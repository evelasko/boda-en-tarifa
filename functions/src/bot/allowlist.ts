/**
 * Strict-mode allowlist (`02-conversation-design.md` §10).
 *
 * The `guests/{phone}` doc IS the allowlist — its existence (and
 * `botEnrolled !== false`) means the phone is permitted. Unknown phones
 * get the polite refusal and a record in `bot_unknown_inbound` for
 * operator review.
 *
 * This module is intentionally thin: the membership check happens before
 * any KB exposure, so reference photos and dossiers are never reached
 * for unknown phones.
 */

import {
  getFirestore,
  Timestamp,
  FieldValue,
} from "firebase-admin/firestore";
import {createHash} from "node:crypto";
import * as logger from "firebase-functions/logger";
import type {E164} from "./lib/phone.js";
import {getGuestByPhone, type Guest} from "./services/guests.js";

/**
 * Allowlist outcomes. We intentionally do NOT carry an `opted_out`
 * variant: per `02-conversation-design.md` §4 stop is sticky in voice
 * but soft in state — any new inbound from a previously opted-out
 * guest reactivates them via `touchGuestOnInbound`. So at the
 * allowlist layer there are only two cases: "have a guest doc, let
 * them through" and "unknown phone, polite refusal".
 *
 * The Guest is carried on the allowed branch so the handler can avoid
 * a second `getGuestByPhone` read in the hot path.
 */
export type AllowlistDecision =
  | {kind: "allowed"; guest: Guest}
  | {kind: "unknown"};

export async function decideInbound(phone: E164): Promise<AllowlistDecision> {
  const guest = await getGuestByPhone(phone);
  if (!guest) return {kind: "unknown"};
  return {kind: "allowed", guest};
}

const UNKNOWN_COLLECTION = "bot_unknown_inbound";

/**
 * Idempotent log of an unknown-phone hit. Groups repeat offenders via
 * a hash of the first 200 chars (per spec — never stores raw content).
 *
 * Uses a deterministic doc id (`{phoneNoPrefix}_{previewHash8}`) so
 * repeated identical inbound from the same phone increments `count`
 * rather than creating fan-out docs.
 */
export async function recordUnknownInbound(args: {
  phone: E164;
  bodyPreview: string;
  responseSent: boolean;
}): Promise<void> {
  const previewHash = createHash("sha256")
    .update(args.bodyPreview.slice(0, 200))
    .digest("hex");
  const docId = `${args.phone.replace("+", "")}_${previewHash.slice(0, 8)}`;
  const ref = getFirestore().collection(UNKNOWN_COLLECTION).doc(docId);
  try {
    await ref.set(
      {
        phone: args.phone,
        messagePreviewHash: previewHash,
        receivedAt: FieldValue.serverTimestamp(),
        ttlExpiresAt: Timestamp.fromMillis(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
        count: FieldValue.increment(1),
        responseSent: args.responseSent,
        resolved: false,
      },
      {merge: true}
    );
  } catch (err) {
    logger.warn("bot.allowlist.unknown_log_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
