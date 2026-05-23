/**
 * Sunday 20:00 Europe/Madrid film-developed reveal.
 *
 * Spec: launch-readiness plan §4 A4, message templates §05 T6.
 *
 * Behavior:
 *   1. Runs every minute, but only fires within ±30s of
 *      2026-05-31 20:00 Europe/Madrid.
 *   2. Refuses to fire unless `config/bot.film_developed_approved === true`.
 *      The operator flips this from the settings page after a final
 *      moderation pass on the album.
 *   3. On fire:
 *        a. Claims `bot_film_developed_log/2026-05-31` (idempotency).
 *        b. Flips `config/album.public = true` (existing web album route
 *           reads this).
 *        c. Dispatches `film_developed` template to all bot-enrolled
 *           guests via the broadcast machinery (A1).
 *
 * The legacy `functions/src/camera/trigger-film-development.ts` FCM
 * sender is left intact — there is no native app subscribing to that
 * topic anymore, so its sends are no-ops, but removing it is out of
 * scope for this PR.
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
import {createBroadcast, runBroadcast} from "../broadcast/dispatch.js";
import {claimScheduledMarker} from "./idempotency.js";
import {captureWithContext, ensureSentry} from "../../lib/sentry.js";

const SCHEDULED_REQUEST_ID = "scheduled.film_developed";

/** Wedding reveal target: Sunday 31 May 2026 at 20:00 Europe/Madrid. */
const FIRE_AT_ISO = "2026-05-31T20:00:00+02:00";
const FIRE_AT_MS = Date.parse(FIRE_AT_ISO);
const TICK_WINDOW_MS = 30_000;
const LOG_ID = "2026-05-31";

export const botFilmDeveloped = onSchedule(
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
    if (Math.abs(FIRE_AT_MS - now) > TICK_WINDOW_MS) return;

    const approved = await readApproval();
    if (!approved) {
      logger.warn("bot.scheduled.film_developed.not_approved", {
        message: "config/bot.film_developed_approved is not true; skipping.",
      });
      return;
    }

    const claimed = await claimScheduledMarker({
      collection: "bot_film_developed_log",
      id: LOG_ID,
      payload: {fireAt: FIRE_AT_ISO},
    });
    if (!claimed) {
      logger.info("bot.scheduled.film_developed.skip_already_sent");
      return;
    }

    // Flip album public before sending — guests tapping the URL button in
    // the template should land on the live album. If this fails, abort
    // the dispatch and let the operator manually flip + retry.
    try {
      await getFirestore().doc("config/album").set(
        {public: true, publicAt: FIRE_AT_ISO},
        {merge: true}
      );
      logger.info("bot.scheduled.film_developed.album_flipped");
    } catch (err) {
      captureWithContext(err, {
        requestId: SCHEDULED_REQUEST_ID,
        kind: "scheduled.film_developed.album_flip",
      });
      logger.error("bot.scheduled.film_developed.album_flip_failed", {
        err: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    const broadcastId = `film-developed-${LOG_ID}`;
    await createBroadcast({
      broadcastId,
      templateName: "film_developed",
      audience: {},
      perMinuteCap: 60,
    });
    const result = await runBroadcast(broadcastId, {
      whatsappPhoneNumberId: WHATSAPP_PHONE_NUMBER_ID.value(),
      whatsappAccessToken: WHATSAPP_ACCESS_TOKEN.value(),
    });

    logger.info("bot.scheduled.film_developed.dispatched", {...result});
  }
);

async function readApproval(): Promise<boolean> {
  try {
    const snap = await getFirestore().doc("config/bot").get();
    if (!snap.exists) return false;
    return Boolean(
      (snap.data() as {film_developed_approved?: boolean})
        .film_developed_approved
    );
  } catch (err) {
    logger.warn("bot.scheduled.film_developed.approval_read_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
