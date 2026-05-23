/**
 * `botSendBroadcast` — operator triggers a template broadcast.
 *
 * Two modes:
 *   - `dryRun: true` — returns audience count + 3 rendered sample bodies.
 *     No Firestore writes, no Meta calls.
 *   - `dryRun: false` (default) — creates `bot_broadcasts/{id}` with
 *     status `dispatching`, populates the recipients subcollection, then
 *     synchronously runs the dispatcher. Returns the broadcast id.
 *
 * The dispatcher's pacing (default 60/min) plus the 540s function timeout
 * comfortably accommodate any wedding-sized audience. For larger
 * audiences we would split this into "create" + a separate drain
 * scheduled function — out of scope here.
 *
 * Spec: launch-readiness plan B4.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {z} from "zod";
import {
  BOT_REGION,
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
} from "../lib/config.js";
import {
  createBroadcast,
  dryRunBroadcast,
  runBroadcast,
} from "../broadcast/dispatch.js";
import {listTemplateNames} from "../whatsapp/templates.js";
import {assertAdmin} from "./_admin.js";

const AudienceSchema = z.object({
  language: z.enum(["es", "en", "both"]).optional(),
  rsvpStatus: z.enum([
    "any", "attending", "pending", "declined", "partial",
  ]).optional(),
  phones: z.array(z.string()).optional(),
  guestIds: z.array(z.string()).optional(),
});

const PayloadSchema = z.object({
  templateName: z.string().min(1),
  audience: AudienceSchema,
  dryRun: z.boolean().optional(),
  perMinuteCap: z.number().int().min(1).max(600).optional(),
  varsStatic: z.record(z.string(), z.string()).optional(),
  varsByLanguage: z.record(
    z.enum(["es", "en"]),
    z.record(z.string(), z.string())
  ).optional(),
});

export const botSendBroadcast = onCall(
  {
    region: BOT_REGION,
    cors: true,
    secrets: [WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID],
    memory: "1GiB",
    cpu: 1,
    timeoutSeconds: 540,
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
    const {
      templateName, audience, dryRun, perMinuteCap, varsStatic, varsByLanguage,
    } = parsed.data;

    if (!listTemplateNames().includes(templateName as never)) {
      throw new HttpsError(
        "invalid-argument",
        `Unknown template: ${templateName}. ` +
        `Known: ${listTemplateNames().join(", ")}.`
      );
    }

    const vars = {
      static: varsStatic,
      byLanguage: varsByLanguage,
    };

    if (dryRun) {
      const result = await dryRunBroadcast({
        templateName: templateName as never,
        audience,
        vars,
      });
      logger.info("bot.callable.send_broadcast.dry_run", {
        actor: admin.email,
        templateName,
        audienceCount: result.audienceCount,
      });
      return result;
    }

    const created = await createBroadcast({
      templateName: templateName as never,
      audience,
      vars,
      perMinuteCap,
      operatorUid: admin.uid,
    });

    if (created.audienceCount === 0) {
      logger.warn("bot.callable.send_broadcast.empty_audience", {
        actor: admin.email,
        templateName,
        broadcastId: created.broadcastId,
      });
      return {
        broadcastId: created.broadcastId,
        audienceCount: 0,
        status: "complete" as const,
        sent: 0, delivered: 0, failed: 0, skipped: 0, total: 0,
      };
    }

    const result = await runBroadcast(created.broadcastId, {
      whatsappPhoneNumberId: WHATSAPP_PHONE_NUMBER_ID.value(),
      whatsappAccessToken: WHATSAPP_ACCESS_TOKEN.value(),
    });

    logger.info("bot.callable.send_broadcast.sent", {
      actor: admin.email,
      templateName,
      ...result,
    });

    return {
      // `runBroadcast` returns `broadcastId` too, but we re-state it
      // last so the field is explicit at the call site.
      ...result,
      audienceCount: created.audienceCount,
      broadcastId: created.broadcastId,
    };
  }
);
