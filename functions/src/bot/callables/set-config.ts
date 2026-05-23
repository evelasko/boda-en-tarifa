/**
 * `botSetConfig` — operator-only kill-switch primitive (B5 settings page).
 *
 * Accepts `{key, value}` and writes `config/bot.{key}`. Allowlisted to the
 * small set of keys the settings page exposes so a compromised admin
 * session can't write arbitrary Firestore.
 *
 * Spec: launch-readiness plan B1/B5; `bot/specs/08-integration-contract.md`
 *       §3.2 (Callable functions, admin auth).
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getFirestore} from "firebase-admin/firestore";
import {z} from "zod";
import {BOT_REGION} from "../lib/config.js";
import {assertAdmin} from "./_admin.js";

const ALLOWED_KEYS = [
  "enabled",
  "film_developed_approved",
  "keep_warm_enabled",
] as const;
type AllowedKey = typeof ALLOWED_KEYS[number];

const PayloadSchema = z.object({
  key: z.enum(ALLOWED_KEYS),
  value: z.boolean(),
});

export const botSetConfig = onCall(
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
    const {key, value} = parsed.data;
    await getFirestore().doc("config/bot").set(
      {[key]: value, [`${key}_updatedAt`]: new Date().toISOString(),
        [`${key}_updatedBy`]: admin.email},
      {merge: true}
    );
    logger.info("bot.callable.set_config.ok", {
      key,
      value,
      actor: admin.email,
    });
    return {ok: true, key: key as AllowedKey, value};
  }
);
