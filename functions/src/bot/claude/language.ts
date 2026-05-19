/**
 * Language detection via Haiku 4.5 (cheap pre-classification).
 *
 * Spec: `bot/specs/02-conversation-design.md` §3 ("Detection"),
 *       `bot/specs/08-integration-contract.md` §8 (Anthropic API).
 *
 * Rules:
 *   - First-turn detection only — once `guests.{phone}.language` is set,
 *     prefer that. The handler decides when to call this module.
 *   - Mid-conversation switches are detected here too, but persisted
 *     only after 2 consistent turns to avoid flapping (debounce lives
 *     in `handlers/conversation.ts`).
 *   - Default to ES on `unknown` or call failure.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as logger from "firebase-functions/logger";
import {CLAUDE_HAIKU_MODEL} from "../lib/config.js";
import type {Language} from "../lib/i18n.js";

const SYSTEM = "Classify language: respond with exactly \"es\" or \"en\". Default to \"es\" if unclear.";

let cachedClient: Anthropic | null = null;
function client(apiKey: string): Anthropic {
  if (cachedClient) return cachedClient;
  cachedClient = new Anthropic({apiKey});
  return cachedClient;
}

export async function detectLanguage(args: {
  apiKey: string;
  text: string;
  requestId: string;
}): Promise<Language> {
  const trimmed = args.text.trim().slice(0, 200);
  if (!trimmed) return "es";
  try {
    const resp = await client(args.apiKey).messages.create({
      model: CLAUDE_HAIKU_MODEL,
      max_tokens: 10,
      system: SYSTEM,
      messages: [{role: "user", content: trimmed}],
    });
    const raw = textOf(resp).trim().toLowerCase();
    if (raw === "en") return "en";
    return "es";
  } catch (err) {
    logger.warn("bot.claude.language.detect_failed", {
      requestId: args.requestId,
      err: err instanceof Error ? err.message : String(err),
    });
    return "es";
  }
}

function textOf(resp: Anthropic.Messages.Message): string {
  for (const block of resp.content) {
    if (block.type === "text") return block.text;
  }
  return "";
}
