/**
 * Delivery-receipt fanout for outbound messages (launch-readiness A1).
 *
 * Meta's `statuses[]` callbacks contain a `metaMessageId` (`wamid.xxx`),
 * a `status` (`delivered` | `read` | `failed`), and a `recipient_id`. We
 * resolve the message back to its `bot_send_log` row and, if the trigger
 * was `broadcast`, also update the per-recipient subcollection so the
 * admin UI's live progress view reflects deliveries within seconds.
 *
 * Idempotent: applying the same status twice is a no-op (the send-log
 * helper only promotes forward — `read > delivered > sent`).
 */

import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {applyDeliveryStatus} from "../services/send-log.js";

type MetaStatus =
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | string;

export interface StatusEvent {
  metaMessageId: string;
  status: MetaStatus;
  recipientId: string; // Meta wa_id (no `+`)
  errors?: Array<{code?: number; title?: string; message?: string}>;
}

export async function handleStatusEvent(
  event: StatusEvent,
  requestId: string
): Promise<void> {
  const status = normalizeStatus(event.status);
  if (!status) {
    // Some Meta statuses (`sent`) aren't useful to mirror — bot_send_log
    // already moves to `sent` on our own send. Ignore quietly.
    return;
  }

  const firstError = event.errors?.[0];
  const errorMessage = firstError ?
    [
      firstError.code != null ? String(firstError.code) : "",
      firstError.title ?? "",
      firstError.message && firstError.message !== firstError.title ?
        `— ${firstError.message}` :
        "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || undefined :
    undefined;

  const updated = await applyDeliveryStatus({
    metaMessageId: event.metaMessageId,
    status,
    error: errorMessage,
  });

  if (!updated) {
    // Likely a status for a message we did not originate (e.g. operator
    // sent from their personal phone using the same number — shouldn't
    // happen, but log so we notice if it does).
    logger.info("bot.webhook.status.unmatched", {
      requestId,
      metaMessageId: event.metaMessageId,
      status,
    });
    return;
  }

  // If this send-log row was for a broadcast, mirror to the recipient
  // subcollection so the admin live progress view updates within seconds.
  const sendLogRef = getFirestore()
    .collection("bot_send_log")
    .doc(updated.id);
  const sendLogSnap = await sendLogRef.get();
  const sendLog = sendLogSnap.data() as
    | {trigger?: string; guestId?: string}
    | undefined;
  if (sendLog?.trigger === "broadcast" && sendLog.guestId) {
    // send-log id pattern: `broadcast:${guestId}:${broadcastId}`
    const broadcastId = updated.id.split(":").slice(2).join(":");
    if (broadcastId) {
      await getFirestore()
        .collection("bot_broadcasts")
        .doc(broadcastId)
        .collection("recipients")
        .doc(sendLog.guestId)
        .set({status, error: errorMessage ?? null}, {merge: true})
        .catch((err: unknown) => {
          logger.warn("bot.webhook.status.recipient_mirror_failed", {
            requestId,
            broadcastId,
            guestId: sendLog.guestId,
            err: err instanceof Error ? err.message : String(err),
          });
        });
    }
  }

  logger.info("bot.webhook.status.applied", {
    requestId,
    metaMessageId: event.metaMessageId,
    status,
    sendLogId: updated.id,
  });
}

function normalizeStatus(
  s: string
): "delivered" | "read" | "failed" | null {
  if (s === "delivered" || s === "read" || s === "failed") return s;
  return null;
}
