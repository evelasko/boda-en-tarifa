/**
 * Writes `bot_escalations/{auto}` and links the new escalation onto the
 * conversation root (`bot_conversations/{phone}.unresolvedEscalationId`)
 * so the admin UI can surface a "this conversation has an open
 * escalation" badge in Phase 4.
 *
 * Spec: `bot/specs/04-data-model.md` §2 (BotEscalation schema),
 *       `bot/specs/02-conversation-design.md` §5 (escalation policy),
 *       `bot/specs/07-knowledge-base.md` §5.10 (tool contract).
 */

import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";
import type {E164} from "../lib/phone.js";
import type {Language} from "../lib/i18n.js";
import {validate, UrgencySchema} from "../lib/validation.js";

const COLLECTION = "bot_escalations";
const ROOT_COLLECTION = "bot_conversations";

export type Urgency = "low" | "normal" | "high";

export interface CreateEscalationArgs {
  guestId: string;
  guestPhone: E164;
  guestLanguage: Language;
  reason: string;
  summary: string;
  urgency: Urgency;
  triggeringMessageId: string;
  triggeringMessageText?: string;
}

/** Creates a new `bot_escalations` doc; returns its auto-id. */
export async function createEscalation(
  args: CreateEscalationArgs
): Promise<string> {
  // Defensive: tool input schema already enums urgency, but Claude can
  // still produce an unexpected literal. Bounce now rather than write a
  // doc the admin UI can't filter.
  const urgency = validate(UrgencySchema, args.urgency, "escalation_urgency");

  const ref = getFirestore().collection(COLLECTION).doc();
  await ref.set({
    guestId: args.guestId,
    guestPhone: args.guestPhone,
    guestLanguage: args.guestLanguage,
    conversationPhone: args.guestPhone,
    reason: args.reason,
    summary: args.summary,
    urgency,
    triggeringMessageId: args.triggeringMessageId,
    triggeringMessageText: args.triggeringMessageText ?? null,
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/**
 * Point `bot_conversations/{phone}.unresolvedEscalationId` at the latest
 * open escalation. Multiple escalations per conversation are allowed —
 * this field always reflects the most recent open one (Phase 4 admin
 * resolves them and clears the pointer).
 */
export async function linkEscalationToConversation(
  phone: E164,
  escalationId: string
): Promise<void> {
  await getFirestore()
    .collection(ROOT_COLLECTION)
    .doc(phone)
    .set(
      {unresolvedEscalationId: escalationId},
      {merge: true}
    );
}
