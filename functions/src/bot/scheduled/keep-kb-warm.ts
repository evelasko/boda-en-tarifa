/**
 * Per-minute Anthropic prompt-cache keep-warm.
 *
 * Spec: launch-readiness plan §4 A5 (depends on A7 — 1h cache TTL).
 *
 * Behavior:
 *   1. Runs every minute. Outside the active window
 *      (2026-05-23 → 2026-06-05 Europe/Madrid) → immediate return.
 *   2. Honors `config/bot.keep_warm_enabled` (default true). If `false`,
 *      logs once and returns.
 *   3. Loads the KB + builds the system prompt + fires a 1-token Claude
 *      `messages.create` to refresh the 1-hour ephemeral cache.
 *
 * Cost shape: at 1 token of output × 60 ticks/h × 24h × 14 days the
 * cache-write portion dominates and is bounded by the ~1h TTL refresh
 * cadence (one cache write per hour per warm instance per system block).
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
import {getKb} from "../claude/kb.js";
import {captureWithContext, ensureSentry} from "../../lib/sentry.js";

const SCHEDULED_REQUEST_ID = "scheduled.keep_kb_warm";

const ACTIVE_START_MS = Date.parse("2026-05-23T00:00:00+02:00");
const ACTIVE_END_MS = Date.parse("2026-06-05T23:59:59+02:00");

export const botKeepKbWarm = onSchedule(
  {
    region: BOT_REGION,
    schedule: "* * * * *",
    timeZone: WEDDING_TIMEZONE,
    secrets: [ANTHROPIC_API_KEY, SENTRY_DSN],
    memory: "512MiB",
    cpu: 1,
    timeoutSeconds: 30,
    maxInstances: 1,
  },
  async () => {
    ensureSentry(SENTRY_DSN.value());
    const now = Date.now();
    if (now < ACTIVE_START_MS || now > ACTIVE_END_MS) return;

    if (!(await isEnabled())) {
      logger.info("bot.keepwarm.disabled");
      return;
    }

    try {
      const kb = await getKb();
      const system = buildSystem({kbBlock: kb.text});
      const client = new Anthropic({apiKey: ANTHROPIC_API_KEY.value()});
      const resp = await client.messages.create({
        model: CLAUDE_SONNET_MODEL,
        max_tokens: 1,
        system,
        messages: [{role: "user", content: "ping"}],
      });
      logger.info("bot.keepwarm.ok", {
        kbVersion: kb.version,
        cacheReadTokens: resp.usage.cache_read_input_tokens ?? 0,
        cacheCreateTokens: resp.usage.cache_creation_input_tokens ?? 0,
        inputTokens: resp.usage.input_tokens,
        outputTokens: resp.usage.output_tokens,
      });
    } catch (err) {
      captureWithContext(err, {
        requestId: SCHEDULED_REQUEST_ID,
        kind: "scheduled.keep_kb_warm",
      });
      logger.error("bot.keepwarm.failed", {
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
