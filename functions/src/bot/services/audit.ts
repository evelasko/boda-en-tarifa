/**
 * Append-only writes to `bot_conversations/{phone}/messages/{auto}` —
 * the full message log used for context-window assembly, the admin
 * thread view, and post-event review.
 *
 * Spec: `bot/specs/04-data-model.md` §2 (`BotConversationRoot`,
 *       `BotMessage`).
 *
 * All writes happen via Admin SDK (bypassing security rules — collection
 * is server-only per §4).
 */

import {
  getFirestore,
  Timestamp,
  FieldValue,
  type DocumentReference,
} from "firebase-admin/firestore";
import type {E164} from "../lib/phone.js";
import type {Language} from "../lib/i18n.js";
import {CSW_WINDOW_MS} from "../lib/config.js";

const ROOT_COLLECTION = "bot_conversations";

export type Direction = "inbound" | "outbound";

export type BotMessageType =
  | "text" | "image" | "video" | "audio" | "document"
  | "sticker" | "location" | "contacts" | "reaction"
  | "interactive_button_reply" | "interactive_list_reply"
  | "flow_submission" | "template" | "system";

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  errored?: boolean;
}

export interface ClaudeUsage {
  inputTokens: number;
  cachedReadTokens: number;
  cachedWriteTokens: number;
  outputTokens: number;
}

export interface AppendMessageArgs {
  phone: E164;
  guestId: string;
  direction: Direction;
  type: BotMessageType;
  requestId: string;
  metaMessageId?: string;
  text?: string;
  /** Meta media id (inbound media messages). */
  mediaId?: string;
  /** Cloudinary public id once uploaded (inbound or outbound). */
  cloudinaryPublicId?: string;
  toolCalls?: ToolCall[];
  claudeModel?: "sonnet-4-6" | "haiku-4-5";
  claudeUsage?: ClaudeUsage;
  latencyMs?: number;
  outcome?: "replied" | "escalated" | "refused" | "rate_limited" | "error";
  errorCode?: string;
  errorMessage?: string;
  /**
   * Origin of an outbound message — `"bot"` (default) for Claude-generated
   * replies, `"operator"` for human-typed escalation responses. Surfaced
   * in the admin thread view so operators can tell at a glance which
   * messages came from them.
   */
  senderType?: "bot" | "operator";
  /** Admin email when `senderType === "operator"`. */
  operatorEmail?: string;
}

/**
 * Ensure the conversation root exists and reflects the latest inbound.
 * Should be called once per inbound, before appending messages.
 */
export async function upsertConversationRoot(args: {
  phone: E164;
  guestId: string;
  language: Language;
}): Promise<DocumentReference> {
  const ref = rootRef(args.phone);
  const snap = await ref.get();
  const cswExpiresAt = Timestamp.fromMillis(Date.now() + CSW_WINDOW_MS);

  if (!snap.exists) {
    await ref.set({
      phone: args.phone,
      guestId: args.guestId,
      language: args.language,
      startedAt: FieldValue.serverTimestamp(),
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: 0,
      csmWindowExpiresAt: cswExpiresAt,
    });
  } else {
    await ref.update({
      language: args.language,
      lastMessageAt: FieldValue.serverTimestamp(),
      csmWindowExpiresAt: cswExpiresAt,
    });
  }
  return ref;
}

/** Append a single message and bump the conversation counter. */
export async function appendMessage(args: AppendMessageArgs): Promise<void> {
  const root = rootRef(args.phone);
  const doc = {
    conversationPhone: args.phone,
    direction: args.direction,
    type: args.type,
    metaMessageId: args.metaMessageId ?? null,
    text: args.text ?? null,
    mediaId: args.mediaId ?? null,
    cloudinaryPublicId: args.cloudinaryPublicId ?? null,
    toolCalls: args.toolCalls ?? null,
    claudeModel: args.claudeModel ?? null,
    claudeUsage: args.claudeUsage ?? null,
    latencyMs: args.latencyMs ?? null,
    outcome: args.outcome ?? null,
    errorCode: args.errorCode ?? null,
    errorMessage: args.errorMessage ?? null,
    senderType: args.senderType ?? "bot",
    operatorEmail: args.operatorEmail ?? null,
    requestId: args.requestId,
    createdAt: FieldValue.serverTimestamp(),
  };

  await getFirestore().runTransaction(async (tx) => {
    tx.create(root.collection("messages").doc(), doc);
    tx.update(root, {
      messageCount: FieldValue.increment(1),
      lastMessageAt: FieldValue.serverTimestamp(),
    });
  });
}

/**
 * Fetch the last N turns (2N message records) in chronological order.
 * Used by the Claude pipeline to assemble per-turn user content.
 */
export async function getRecentMessages(
  phone: E164,
  limit: number
): Promise<Array<{direction: Direction; text: string; createdAt: Timestamp}>> {
  const snap = await rootRef(phone)
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(limit * 2)
    .get();
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        direction: data.direction as Direction,
        text: (data.text as string | null) ?? "",
        createdAt: data.createdAt as Timestamp,
      };
    })
    .filter((m) => m.text.length > 0)
    .reverse();
}

function rootRef(phone: E164): DocumentReference {
  return getFirestore().collection(ROOT_COLLECTION).doc(phone);
}
