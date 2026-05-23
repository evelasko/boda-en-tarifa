/**
 * Per-minute scheduled tick that fires content-unlock templates at the
 * configured `unlockAt` time for each entry in `bot_content_unlocks/{id}`.
 *
 * Spec: launch-readiness plan §4 A3.
 *
 * Use cases for the launch window:
 *   - **Seating reveal** Saturday 2026-05-30 19:30 Europe/Madrid: an
 *     operator-seeded `bot_content_unlocks/seating_2026-05-30` entry with
 *     `templateName: "seating_unlocked"`, the per-guest seating vars
 *     (`tableLabel`, `seatingToken`) pre-populated in `varsByGuest`,
 *     and `audience: {}` (all enrolled).
 *   - **Album-reveal coupling** is handled by the standalone film-developed
 *     scheduler (A4); A3 is intentionally not used for it.
 *
 * Data shape (Firestore doc at `bot_content_unlocks/{id}`):
 *   {
 *     unlockAt: string;           // ISO with offset
 *     templateName: TemplateName;
 *     enabled?: boolean;          // default true
 *     audience?: AudienceSpec;    // default {} (all enrolled)
 *     varsStatic?: Record<string, string>;
 *     varsByLanguage?: { es?: Record<string,string>; en?: Record<string,string> };
 *     varsByGuest?: Record<string /* guestId *\/, Record<string, string>>;
 *     perMinuteCap?: number;      // default 60
 *   }
 *
 * Idempotency: `bot_content_unlock_log/{id}` marker written before dispatch.
 * The KB's seating-locked branch (claude/today.ts) flips automatically off
 * the hardcoded `SEATING_UNLOCK_ISO` constant, so no extra integration is
 * needed here — the template send and the KB unlock are timed off the same
 * wall clock.
 */

import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";
import {
  ANTHROPIC_API_KEY,
  BOT_REGION,
  SENTRY_DSN,
  WEDDING_TIMEZONE,
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
} from "../lib/config.js";
import {
  createBroadcast,
  runBroadcast,
  type DispatchVars,
} from "../broadcast/dispatch.js";
import type {TemplateName} from "../whatsapp/templates.js";
import type {AudienceSpec} from "../broadcast/audience.js";
import {claimScheduledMarker} from "./idempotency.js";
import {captureWithContext, ensureSentry} from "../../lib/sentry.js";

const SCHEDULED_REQUEST_ID = "scheduled.content_unlock";

const TICK_WINDOW_MS = 30_000;

interface ContentUnlockEntry {
  id: string;
  unlockAt: string;
  templateName: TemplateName;
  enabled?: boolean;
  audience?: AudienceSpec;
  varsStatic?: Record<string, string>;
  varsByLanguage?: DispatchVars["byLanguage"];
  varsByGuest?: Record<string, Record<string, string>>;
  perMinuteCap?: number;
}

export const botContentUnlockTick = onSchedule(
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
    timeoutSeconds: 540,
    maxInstances: 1,
  },
  async () => {
    ensureSentry(SENTRY_DSN.value());
    const now = Date.now();
    const entries = await listContentUnlocks();
    for (const entry of entries) {
      if (entry.enabled === false) continue;
      const triggerMs = Date.parse(entry.unlockAt);
      if (Number.isNaN(triggerMs)) {
        logger.warn("bot.scheduled.content_unlock.bad_unlock_at", {
          id: entry.id,
          unlockAt: entry.unlockAt,
        });
        continue;
      }
      if (Math.abs(triggerMs - now) > TICK_WINDOW_MS) continue;
      await fireUnlock(entry).catch((err) => {
        captureWithContext(err, {
          requestId: SCHEDULED_REQUEST_ID,
          kind: "scheduled.content_unlock.fire",
        });
        logger.error("bot.scheduled.content_unlock.fire_failed", {
          id: entry.id,
          err: err instanceof Error ? err.message : String(err),
        });
      });
    }
  }
);

async function listContentUnlocks(): Promise<ContentUnlockEntry[]> {
  try {
    const snap = await getFirestore().collection("bot_content_unlocks").get();
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ContentUnlockEntry, "id">),
    }));
  } catch (err) {
    logger.warn("bot.scheduled.content_unlock.read_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

async function fireUnlock(entry: ContentUnlockEntry): Promise<void> {
  const claimed = await claimScheduledMarker({
    collection: "bot_content_unlock_log",
    id: entry.id,
    payload: {templateName: entry.templateName, unlockAt: entry.unlockAt},
  });
  if (!claimed) {
    logger.info("bot.scheduled.content_unlock.skip_already_sent", {
      id: entry.id,
    });
    return;
  }

  const broadcastId = `unlock-${entry.id}`;
  await createBroadcast({
    broadcastId,
    templateName: entry.templateName,
    audience: entry.audience ?? {},
    vars: {
      static: entry.varsStatic,
      byLanguage: entry.varsByLanguage,
      perGuest: entry.varsByGuest,
    },
    perMinuteCap: entry.perMinuteCap ?? 60,
  });
  const result = await runBroadcast(
    broadcastId,
    {
      whatsappPhoneNumberId: WHATSAPP_PHONE_NUMBER_ID.value(),
      whatsappAccessToken: WHATSAPP_ACCESS_TOKEN.value(),
    },
    // perGuest is not persisted to the broadcast doc by createBroadcast,
    // so we pass it explicitly to runBroadcast for the first run.
    {vars: {perGuest: entry.varsByGuest}}
  );

  logger.info("bot.scheduled.content_unlock.dispatched", {
    id: entry.id,
    ...result,
  });
}
