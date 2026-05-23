/**
 * Per-minute scheduled tick that fires `event_reminder_generic` template
 * sends at each event's configured lead times.
 *
 * Spec: launch-readiness plan §4 A2.
 *
 * Behavior:
 *   1. List all events from Firestore.
 *   2. For each event × lead-minute pair where
 *      `now - 30s ≤ start_at - leadMinutes ≤ now + 30s`,
 *      attempt to claim `bot_event_reminder_log/{eventId}_{leadMinutes}`.
 *      If already claimed, skip.
 *   3. For the unique winner: resolve audience, dispatch via the broadcast
 *      machinery (A1) with a deterministic broadcast id
 *      `evt-{eventId}-{leadMinutes}m`, then run the broadcast.
 *
 * Lead times: read from `BotEvent.reminders` (list of minute values).
 * Default `[60, 15]` when absent. Set `reminders: []` to suppress generic
 * reminders for events covered by dedicated templates (ceremony,
 * pre_wedding) once those templates ship.
 */

import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import {
  ANTHROPIC_API_KEY, // unused; bound only so this fn shares the secret pool
  BOT_REGION,
  SENTRY_DSN,
  WEDDING_TIMEZONE,
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
} from "../lib/config.js";
import {listEvents, type BotEvent} from "../services/events.js";
import {getVenue} from "../services/venues.js";
import {
  createBroadcast,
  runBroadcast,
} from "../broadcast/dispatch.js";
import {claimScheduledMarker} from "./idempotency.js";
import {captureWithContext, ensureSentry} from "../../lib/sentry.js";

const SCHEDULED_REQUEST_ID = "scheduled.event_reminder";

const DEFAULT_LEAD_MINUTES = [60, 15];
/** ± window (ms) around the trigger time within which a tick fires. */
const TICK_WINDOW_MS = 30_000;

export const botEventReminderTick = onSchedule(
  {
    region: BOT_REGION,
    schedule: "* * * * *",
    timeZone: WEDDING_TIMEZONE,
    secrets: [
      WHATSAPP_ACCESS_TOKEN,
      WHATSAPP_PHONE_NUMBER_ID,
      ANTHROPIC_API_KEY,
      SENTRY_DSN,
    ],
    memory: "512MiB",
    cpu: 1,
    timeoutSeconds: 540, // dispatch loop sleeps for pacing
    maxInstances: 1,
  },
  async () => {
    ensureSentry(SENTRY_DSN.value());
    const now = Date.now();
    let events: BotEvent[];
    try {
      events = await listEvents();
    } catch (err) {
      captureWithContext(err, {
        requestId: SCHEDULED_REQUEST_ID,
        kind: "scheduled.event_reminder.events_read",
      });
      logger.error("bot.scheduled.event_reminder.events_read_failed", {
        err: err instanceof Error ? err.message : String(err),
      });
      return;
    }
    if (events.length === 0) {
      logger.info("bot.scheduled.event_reminder.no_events");
      return;
    }

    for (const evt of events) {
      const startMs = parseStartAt(evt.startAt);
      if (startMs == null) {
        logger.warn("bot.scheduled.event_reminder.bad_start_at", {
          eventId: evt.id,
          startAt: evt.startAt,
        });
        continue;
      }
      const leads = leadMinutesFor(evt);
      for (const leadMin of leads) {
        const triggerMs = startMs - leadMin * 60_000;
        const delta = triggerMs - now;
        if (Math.abs(delta) > TICK_WINDOW_MS) continue;

        await fireReminder(evt, leadMin).catch((err) => {
          captureWithContext(err, {
            requestId: SCHEDULED_REQUEST_ID,
            kind: "scheduled.event_reminder.fire",
          });
          logger.error("bot.scheduled.event_reminder.fire_failed", {
            eventId: evt.id,
            leadMin,
            err: err instanceof Error ? err.message : String(err),
          });
        });
      }
    }
  }
);

async function fireReminder(
  evt: BotEvent,
  leadMin: number
): Promise<void> {
  const markerId = `${evt.id}_${leadMin}`;
  const claimed = await claimScheduledMarker({
    collection: "bot_event_reminder_log",
    id: markerId,
    payload: {eventId: evt.id, leadMinutes: leadMin},
  });
  if (!claimed) {
    logger.info("bot.scheduled.event_reminder.skip_already_sent", {
      eventId: evt.id,
      leadMin,
    });
    return;
  }

  const venue = evt.venueId ? await getVenue(evt.venueId) : null;
  const venueName = venue?.name ?? evt.nameEs;
  const timeEs = formatTime(evt.startAt, "es");
  const timeEn = formatTime(evt.startAt, "en");

  const broadcastId = `evt-${evt.id}-${leadMin}m`;
  const dispatchVars = {
    static: {venue: venueName},
    byLanguage: {
      es: {eventName: evt.nameEs, time: timeEs},
      en: {eventName: evt.nameEn, time: timeEn},
    },
  } as const;

  await createBroadcast({
    broadcastId,
    templateName: "event_reminder_generic",
    // Audience: bot-enrolled guests, optionally filtered to those whose
    // `rsvp_responses.responses.nightsStaying` includes the event's
    // `requiresNight`. Opt-outs and missing-phone exclusions always apply.
    audience: evt.requiresNight ?
      {requiresNight: evt.requiresNight} :
      {},
    vars: dispatchVars,
    // Pace at 60/min — Meta's default ceiling and a comfortable cadence
    // for a wedding-sized audience.
    perMinuteCap: 60,
  });

  // vars are persisted onto the broadcast doc by `createBroadcast` above;
  // `runBroadcast` reads them back, so no need to pass them again here.
  const result = await runBroadcast(broadcastId, {
    whatsappPhoneNumberId: WHATSAPP_PHONE_NUMBER_ID.value(),
    whatsappAccessToken: WHATSAPP_ACCESS_TOKEN.value(),
  });

  logger.info("bot.scheduled.event_reminder.dispatched", {
    eventId: evt.id,
    leadMin,
    ...result,
  });
}

function leadMinutesFor(evt: BotEvent): number[] {
  if (Array.isArray(evt.reminders)) return evt.reminders;
  return DEFAULT_LEAD_MINUTES;
}

function parseStartAt(s: string): number | null {
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? null : ms;
}

function formatTime(iso: string, lang: "es" | "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const fmt = new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: WEDDING_TIMEZONE,
  });
  return fmt.format(d);
}
