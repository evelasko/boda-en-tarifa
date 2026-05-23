/**
 * `botCancelBroadcast` — flips a broadcast to `cancelled` so the next
 * pacing tick in `runBroadcast` stops sending. Already-sent recipients
 * are not undone (Meta can't unsend).
 *
 * Spec: launch-readiness plan B4.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {z} from "zod";
import {BOT_REGION} from "../lib/config.js";
import {cancelBroadcast} from "../broadcast/dispatch.js";
import {assertAdmin} from "./_admin.js";

const PayloadSchema = z.object({
  broadcastId: z.string().min(1),
});

export const botCancelBroadcast = onCall(
  {
    region: BOT_REGION,
    cors: true,
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (request) => {
    const admin = await assertAdmin(request);
    const parsed = PayloadSchema.safeParse(request.data);
    if (!parsed.success) {
      throw new HttpsError(
        "invalid-argument",
        parsed.error.errors[0]?.message ?? "Invalid payload."
      );
    }
    await cancelBroadcast(parsed.data.broadcastId);
    logger.info("bot.callable.cancel_broadcast.ok", {
      actor: admin.email,
      broadcastId: parsed.data.broadcastId,
    });
    return {ok: true as const};
  }
);
