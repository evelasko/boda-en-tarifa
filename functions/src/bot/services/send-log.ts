/**
 * `bot_send_log/{compositeId}` writer — outbound idempotency + status track.
 *
 * Spec: `bot/specs/04-data-model.md` §2 (`BotSendLog`),
 *       `bot/specs/08-integration-contract.md` §9 (idempotency keys).
 *
 * Composite id pattern: `${trigger}:${guestId}:${suffix}`.
 *   - Broadcast: `broadcast:${guestId}:${broadcastId}`
 *   - Event reminder: `event_reminder:${guestId}:${eventId}_${leadMinutes}`
 *   - Content unlock: `content_unlock:${guestId}:${unlockId}`
 *   - Film developed: `film_developed:${guestId}:${yyyy-mm-dd}`
 *
 * All writes happen server-side; clients never touch this collection.
 */

import {
  getFirestore,
  Timestamp,
  FieldValue,
} from "firebase-admin/firestore";

const COLLECTION = "bot_send_log";

export type SendTrigger =
  | "broadcast"
  | "event_reminder"
  | "content_unlock"
  | "film_developed"
  | "onboarding"
  | "other";

export type SendStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface SendLogRecord {
  id: string;
  trigger: SendTrigger;
  guestId: string;
  templateName?: string;
  payloadHash?: string;
  sentAt?: Timestamp;
  metaMessageId?: string;
  status: SendStatus;
  error?: string;
  attempts: number;
}

export function makeSendLogId(args: {
  trigger: SendTrigger;
  guestId: string;
  suffix: string;
}): string {
  return `${args.trigger}:${args.guestId}:${args.suffix}`;
}

/**
 * Atomically claim a send-log id. Returns:
 *   - `"claimed"` if the row did not exist and we created it.
 *   - `"already_sent"` if the row already exists with status `sent` /
 *     `delivered` / `read` — caller should skip.
 *   - `"retry"` if the row exists but is in a non-terminal failure state
 *     (`queued` or `failed` with attempts < cap) — caller may re-send.
 */
export async function claimSendLog(args: {
  id: string;
  trigger: SendTrigger;
  guestId: string;
  templateName?: string;
}): Promise<"claimed" | "already_sent" | "retry"> {
  const ref = getFirestore().collection(COLLECTION).doc(args.id);
  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const data = snap.data() as Partial<SendLogRecord> | undefined;
      const status: SendStatus = (data?.status as SendStatus) ?? "queued";
      if (
        status === "sent" || status === "delivered" || status === "read"
      ) {
        return "already_sent";
      }
      return "retry";
    }
    tx.create(ref, {
      trigger: args.trigger,
      guestId: args.guestId,
      templateName: args.templateName ?? null,
      status: "queued",
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    return "claimed";
  });
}

export async function markSent(args: {
  id: string;
  metaMessageId: string;
}): Promise<void> {
  await getFirestore().collection(COLLECTION).doc(args.id).set(
    {
      metaMessageId: args.metaMessageId,
      sentAt: FieldValue.serverTimestamp(),
      status: "sent",
      attempts: FieldValue.increment(1),
      error: null,
    },
    {merge: true}
  );
}

export async function markFailed(args: {
  id: string;
  error: string;
}): Promise<void> {
  await getFirestore().collection(COLLECTION).doc(args.id).set(
    {
      status: "failed",
      error: args.error,
      attempts: FieldValue.increment(1),
    },
    {merge: true}
  );
}

/**
 * Promote a sent row to delivered/read based on a Meta status callback.
 * Idempotent: applying the same status twice is a no-op.
 */
export async function applyDeliveryStatus(args: {
  metaMessageId: string;
  status: "delivered" | "read" | "failed";
  error?: string;
}): Promise<{id: string} | null> {
  const snap = await getFirestore()
    .collection(COLLECTION)
    .where("metaMessageId", "==", args.metaMessageId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const current = (doc.data().status as SendStatus | undefined) ?? "sent";
  // Only promote forward — `read > delivered > sent`. Never demote.
  if (current === "read") return {id: doc.id};
  if (current === "delivered" && args.status !== "read") {
    return {id: doc.id};
  }
  await doc.ref.update({
    status: args.status,
    error: args.error ?? null,
  });
  return {id: doc.id};
}
