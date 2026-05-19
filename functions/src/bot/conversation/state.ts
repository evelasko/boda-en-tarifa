/**
 * Conversation state: history window assembly and CSW tracking.
 *
 * Spec: `bot/specs/02-conversation-design.md` §8 ("Conversation
 *       lifecycle" — last 8 turns / 16 messages),
 *       `bot/specs/04-data-model.md` §2 (`BotConversationRoot`).
 *
 * The conversation root + messages collection are written by
 * `services/audit.ts`. This module owns the *read side* assembly the
 * Claude pipeline consumes per turn.
 */

import {Timestamp} from "firebase-admin/firestore";
import type {E164} from "../lib/phone.js";
import {CSW_WINDOW_MS, DEFAULT_HISTORY_TURNS} from "../lib/config.js";
import {getRecentMessages} from "../services/audit.js";

export interface HistoryTurn {
  role: "user" | "assistant";
  text: string;
  at: Date;
}

/**
 * Hydrate the last N turns for the Claude pipeline. Returns
 * chronologically-ordered, alternating user/assistant messages with
 * empty texts filtered out.
 */
export async function loadHistory(
  phone: E164,
  turns: number = DEFAULT_HISTORY_TURNS
): Promise<HistoryTurn[]> {
  const records = await getRecentMessages(phone, turns);
  return records.map((m) => ({
    role: m.direction === "inbound" ? "user" : "assistant",
    text: m.text,
    at: m.createdAt.toDate(),
  }));
}

/** True iff `now` is still inside the 24h customer-service window. */
export function isCswOpen(
  lastInboundAt: Date | Timestamp,
  now: Date = new Date()
): boolean {
  const last = lastInboundAt instanceof Timestamp ?
    lastInboundAt.toDate() :
    lastInboundAt;
  return now.getTime() - last.getTime() < CSW_WINDOW_MS;
}
