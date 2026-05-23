/**
 * Pre-event warmup — fires three back-to-back 1-token Claude pings in
 * the hour before each major event so all warm webhook instances enter
 * the traffic spike with a hot 1h ephemeral cache.
 *
 * Spec: launch-readiness plan §8 E2 (depends on A5 keep-warm baseline).
 *
 * Behavior:
 *   1. Cron at 0,30 * * * * (twice per hour) Europe/Madrid.
 *   2. Active window guard (2026-05-23 → 2026-06-05) and shared
 *      `config/bot.keep_warm_enabled` toggle — same gating as A5.
 *   3. If any hardcoded event start is within the next 60 minutes:
 *      invalidate the in-process KB cache, force a fresh build, then
 *      fire three 1-token `messages.create` calls in series. Three pings
 *      give the warm-instance pool (`minInstances: 5`) a statistical
 *      chance of caching across multiple instances ahead of the surge.
 *
 * Hardcoded targets per the launch plan ("schedule is frozen — hardcode
 * in the file"). Keep in sync with `bot/data/events.yaml` if the wedding
 * schedule ever shifts.
 */

import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";
import Anthropic from "@anthropic-ai/sdk";
import {
  ANTHROPIC_API_KEY,
  BOT_REGION,
  CLAUDE_SONNET_MODEL,
  SENTRY_DSN,
  WEDDING_TIMEZONE,
} from "../lib/config.js";
import {buildSystem} from "../claude/system-prompt.js";
import {getKb, invalidateKbCache} from "../claude/kb.js";
import {captureWithContext, ensureSentry} from "../../lib/sentry.js";

const SCHEDULED_REQUEST_ID = "scheduled.pre_event_warmup";

const ACTIVE_START_MS = Date.parse("2026-05-23T00:00:00+02:00");
const ACTIVE_END_MS = Date.parse("2026-06-05T23:59:59+02:00");

/** Fire warmup if any target is within this window from now. */
const LOOKAHEAD_MS = 60 * 60 * 1000;

/** Number of back-to-back warmup pings per fire. */
const WARMUP_PINGS = 3;

/**
 * Hardcoded event start times the wedding pivots on. Kept here (not
 * pulled from Firestore) so a YAML edit shortly before the event can't
 * accidentally suppress the warmup window. Schedule is frozen.
 */
const EVENT_WARMUP_TARGETS_MS: ReadonlyArray<number> = [
  Date.parse("2026-05-29T19:30:00+02:00"), // Friday welcome dinner
  Date.parse("2026-05-30T17:00:00+02:00"), // Saturday ceremony
  Date.parse("2026-05-31T11:00:00+02:00"), // Sunday brunch
  Date.parse("2026-05-31T19:00:00+02:00"), // Sunday album reveal
];

export const botPreEventWarmup = onSchedule(
  {
    region: BOT_REGION,
    schedule: "0,30 * * * *",
    timeZone: WEDDING_TIMEZONE,
    secrets: [ANTHROPIC_API_KEY, SENTRY_DSN],
    memory: "512MiB",
    cpu: 1,
    timeoutSeconds: 60,
    maxInstances: 1,
  },
  async () => {
    ensureSentry(SENTRY_DSN.value());
    const now = Date.now();
    if (now < ACTIVE_START_MS || now > ACTIVE_END_MS) return;

    if (!(await isEnabled())) {
      logger.info("bot.preeventwarmup.disabled");
      return;
    }

    const targets = EVENT_WARMUP_TARGETS_MS.filter((t) => {
      const delta = t - now;
      return delta > 0 && delta < LOOKAHEAD_MS;
    });
    if (targets.length === 0) return;

    try {
      // Force a fresh KB build so the warmup actually exercises the new
      // cache entry rather than a stale in-process copy.
      invalidateKbCache();
      const kb = await getKb();
      const system = buildSystem({kbBlock: kb.text});
      const client = new Anthropic({apiKey: ANTHROPIC_API_KEY.value()});

      let cacheReadTokens = 0;
      let cacheCreateTokens = 0;
      let inputTokens = 0;
      for (let i = 0; i < WARMUP_PINGS; i++) {
        const resp = await client.messages.create({
          model: CLAUDE_SONNET_MODEL,
          max_tokens: 1,
          system,
          messages: [{role: "user", content: "ping"}],
        });
        cacheReadTokens += resp.usage.cache_read_input_tokens ?? 0;
        cacheCreateTokens += resp.usage.cache_creation_input_tokens ?? 0;
        inputTokens += resp.usage.input_tokens;
      }

      logger.info("bot.preeventwarmup.ok", {
        kbVersion: kb.version,
        targets: targets.length,
        pings: WARMUP_PINGS,
        cacheReadTokens,
        cacheCreateTokens,
        inputTokens,
      });
    } catch (err) {
      captureWithContext(err, {
        requestId: SCHEDULED_REQUEST_ID,
        kind: "scheduled.pre_event_warmup",
      });
      logger.error("bot.preeventwarmup.failed", {
        targets: targets.length,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

async function isEnabled(): Promise<boolean> {
  try {
    const snap = await getFirestore().doc("config/bot").get();
    if (!snap.exists) return true; // default true when config doc absent
    const data = snap.data() as {keep_warm_enabled?: boolean};
    return data.keep_warm_enabled !== false;
  } catch {
    return true;
  }
}
