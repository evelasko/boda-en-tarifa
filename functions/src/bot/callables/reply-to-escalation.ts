/**
 * `botReplyToEscalation` — operator sends a free-form reply to an open
 * escalation. Inside the 24-hour customer-service window only; outside it
 * the call returns `failed-precondition` and the operator should reach
 * the guest via their personal WhatsApp (per D19 two-channel policy) or
 * via the rarely-used `escalation_followup` template.
 *
 * Spec: launch-readiness plan B3,
 *       `bot/specs/02-conversation-design.md` §5 / D19.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  getFirestore,
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";
import {z} from "zod";
import {randomUUID} from "node:crypto";
import {
  BOT_REGION,
  CSW_WINDOW_MS,
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
} from "../lib/config.js";
import {sendText} from "../whatsapp/send.js";
import {appendMessage} from "../services/audit.js";
import {assertAdmin} from "./_admin.js";
import {normalizeE164} from "../lib/phone.js";

const PayloadSchema = z.object({
  escalationId: z.string().min(1),
  replyText: z.string().min(1).max(2000),
  closeAfter: z.boolean().optional(),
});

export const botReplyToEscalation = onCall(
  {
    region: BOT_REGION,
    cors: true,
    secrets: [WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID],
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
    const {escalationId, replyText, closeAfter} = parsed.data;

    const escRef = getFirestore()
      .collection("bot_escalations")
      .doc(escalationId);
    const escSnap = await escRef.get();
    if (!escSnap.exists) {
      throw new HttpsError("not-found", "Escalation does not exist.");
    }
    const esc = escSnap.data() as {
      guestId: string;
      guestPhone: string;
      conversationPhone?: string;
      status: string;
    };
    if (esc.status === "resolved" || esc.status === "cancelled") {
      throw new HttpsError(
        "failed-precondition",
        `Escalation is already ${esc.status}.`
      );
    }

    const phone = normalizeE164(esc.conversationPhone ?? esc.guestPhone);

    // 24h CSW check. The CSW opens on inbound and lives at the
    // bot_conversations root as `csmWindowExpiresAt`. If the field is
    // missing, fall back to lastMessageAt + 24h.
    const cswOpen = await isCswOpen(phone);
    if (!cswOpen) {
      throw new HttpsError(
        "failed-precondition",
        "The 24h customer-service window with this guest has closed. " +
        "Reply from your personal WhatsApp, or send the escalation_followup template."
      );
    }

    const requestId = randomUUID();
    let metaMessageId: string | undefined;
    try {
      const sendResult = await sendText({
        to: phone as `+${string}`,
        body: replyText,
        requestId,
        phoneNumberId: WHATSAPP_PHONE_NUMBER_ID.value(),
        accessToken: WHATSAPP_ACCESS_TOKEN.value(),
      });
      metaMessageId = sendResult.metaMessageId;
    } catch (err) {
      logger.error("bot.callable.reply_to_escalation.send_failed", {
        escalationId,
        err: err instanceof Error ? err.message : String(err),
      });
      throw new HttpsError(
        "internal",
        "Send failed; the guest did not receive the reply."
      );
    }

    await appendMessage({
      phone,
      guestId: esc.guestId,
      direction: "outbound",
      type: "text",
      requestId,
      metaMessageId,
      text: replyText,
      senderType: "operator",
      operatorEmail: admin.email,
      outcome: "replied",
    });

    if (closeAfter !== false) {
      await escRef.update({
        status: "resolved",
        operatorReply: replyText,
        operatorUid: admin.uid,
        resolvedAt: FieldValue.serverTimestamp(),
        // Clear the pointer on the conversation root so the UI no longer
        // shows an "open escalation" badge.
      });
      await getFirestore()
        .collection("bot_conversations")
        .doc(phone)
        .set({unresolvedEscalationId: null}, {merge: true})
        .catch(() => {
          /* root may not exist yet — non-fatal */
        });
    }

    logger.info("bot.callable.reply_to_escalation.ok", {
      escalationId,
      actor: admin.email,
      sentVia: "session",
    });

    return {ok: true as const, sentVia: "session" as const};
  }
);

async function isCswOpen(phone: string): Promise<boolean> {
  const snap = await getFirestore()
    .collection("bot_conversations")
    .doc(phone)
    .get();
  if (!snap.exists) return false;
  const data = snap.data() as {
    csmWindowExpiresAt?: Timestamp;
    lastMessageAt?: Timestamp;
  };
  const expiresMs = data.csmWindowExpiresAt?.toMillis();
  if (typeof expiresMs === "number") return expiresMs > Date.now();
  const lastMs = data.lastMessageAt?.toMillis();
  if (typeof lastMs === "number") return Date.now() - lastMs < CSW_WINDOW_MS;
  return false;
}
