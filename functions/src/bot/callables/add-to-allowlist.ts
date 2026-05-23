/**
 * `botAddToAllowlist` — operator promotes a wrong-number caller into a
 * real guest record. Input is an E.164 phone (+ optional first name and
 * language). Side effects:
 *   1. `guests/{auto}` doc created with `botEnrolled: true`,
 *      `rsvpStatus: "pending"`, `phoneE164: <phone>`, plus any provided
 *      `fullName` / `language` overrides.
 *   2. Any matching `bot_unknown_inbound` docs (same phone) are marked
 *      `resolved: true` so the admin queue clears.
 *
 * Spec: `bot/specs/08-integration-contract.md` §3.2 (`botAddToAllowlist`),
 *       launch-readiness plan B (deferred unknown-inbound page, now FU4).
 *
 * Guardrails:
 *   - Returns `already-exists` (HttpsError) if any `guests` doc already
 *     carries this `phoneE164`. We never silently mutate an existing
 *     guest record.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {z} from "zod";
import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";
import {BOT_REGION} from "../lib/config.js";
import {normalizeE164} from "../lib/phone.js";
import {assertAdmin} from "./_admin.js";

const PayloadSchema = z.object({
  phone: z.string().min(1),
  firstName: z.string().min(1).optional(),
  language: z.enum(["es", "en"]).optional(),
});

export const botAddToAllowlist = onCall(
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

    let phone: string;
    try {
      phone = normalizeE164(parsed.data.phone);
    } catch (err) {
      throw new HttpsError(
        "invalid-argument",
        `Phone not E.164: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const existing = await getFirestore()
      .collection("guests")
      .where("phoneE164", "==", phone)
      .limit(1)
      .get();
    if (!existing.empty) {
      throw new HttpsError(
        "already-exists",
        `Guest with phone ${phone} already exists (id: ${existing.docs[0].id}).`
      );
    }

    const guestRef = getFirestore().collection("guests").doc();
    await guestRef.set({
      fullName: parsed.data.firstName ?? "",
      phoneE164: phone,
      language: parsed.data.language ?? null,
      rsvpStatus: "pending",
      botEnrolled: true,
      directoryVisible: false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: admin.email,
      createdVia: "bot.add_to_allowlist",
    });

    // Best-effort: clear matching unknown-inbound rows.
    try {
      const unknown = await getFirestore()
        .collection("bot_unknown_inbound")
        .where("phone", "==", phone)
        .get();
      const batch = getFirestore().batch();
      for (const d of unknown.docs) {
        batch.update(d.ref, {
          resolved: true,
          resolvedBy: admin.email,
          resolvedAt: FieldValue.serverTimestamp(),
          resolvedAs: guestRef.id,
        });
      }
      if (!unknown.empty) await batch.commit();
    } catch (err) {
      logger.warn("bot.callable.add_to_allowlist.unknown_inbound_clear_failed", {
        phone,
        err: err instanceof Error ? err.message : String(err),
      });
    }

    logger.info("bot.callable.add_to_allowlist.ok", {
      actor: admin.email,
      guestId: guestRef.id,
    });

    return {guestId: guestRef.id};
  }
);
