/**
 * Single-turn Claude pipeline: system + history + per-turn context →
 * tool loop → final text. Wraps the Anthropic SDK with the three-block
 * cached system prompt and the tool registry.
 *
 * Spec: `bot/specs/08-integration-contract.md` §8 (Anthropic API),
 *       `bot/specs/07-knowledge-base.md` §4.2 (per-turn user content),
 *       `bot/specs/02-conversation-design.md` §8 (conversation
 *       lifecycle — last 8 turns).
 *
 * The pipeline does NOT touch Firestore directly — it consumes a
 * `PipelineInput` assembled by `handlers/conversation.ts` and returns
 * the assistant text plus structured tool-call traces for audit.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as logger from "firebase-functions/logger";
import type {Language} from "../lib/i18n.js";
import type {E164} from "../lib/phone.js";
import {
  CLAUDE_SONNET_MODEL,
  DEFAULT_CLAUDE_MAX_TOKENS,
  DEFAULT_MAX_TOOL_ITERATIONS,
} from "../lib/config.js";
import {buildSystem} from "./system-prompt.js";
import {
  executeTool,
  TOOLS,
  type ToolContext,
  type ToolResult,
} from "./tools.js";
import type {HistoryTurn} from "../conversation/state.js";

export interface PipelineInput {
  apiKey: string;
  phone: E164;
  language: Language;
  /** Per-turn user-content header block (guest profile + today's situation). */
  perTurnHeader: string;
  history: HistoryTurn[];
  currentText: string;
  kbBlock: string;
  requestId: string;
  /** Guest uid — needed by tools that write back to Firestore. */
  guestId: string;
  /** Meta wamid for the inbound that started this turn. */
  inboundMessageId: string;
  maxIterations?: number;
  maxTokens?: number;
}

export interface PipelineToolCall {
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  errored?: boolean;
}

export interface PipelineOutput {
  text: string;
  toolCalls: PipelineToolCall[];
  sideEffects: NonNullable<ToolResult["sideEffect"]>[];
  usage: {
    inputTokens: number;
    cachedReadTokens: number;
    cachedWriteTokens: number;
    outputTokens: number;
  };
  stopReason: Anthropic.Messages.Message["stop_reason"];
  iterations: number;
}

let cachedClient: Anthropic | null = null;
function client(apiKey: string): Anthropic {
  if (cachedClient) return cachedClient;
  cachedClient = new Anthropic({apiKey});
  return cachedClient;
}

export async function runTurn(input: PipelineInput): Promise<PipelineOutput> {
  const maxIter = input.maxIterations ?? DEFAULT_MAX_TOOL_ITERATIONS;
  const maxTokens = input.maxTokens ?? DEFAULT_CLAUDE_MAX_TOKENS;

  const system = buildSystem({kbBlock: input.kbBlock});
  const messages = buildInitialMessages(input);

  const toolCtx: ToolContext = {
    phone: input.phone,
    language: input.language,
    requestId: input.requestId,
    guestId: input.guestId,
    inboundMessageId: input.inboundMessageId,
    inboundText: input.currentText,
  };

  const recordedCalls: PipelineToolCall[] = [];
  const sideEffects: NonNullable<ToolResult["sideEffect"]>[] = [];
  const usage = {
    inputTokens: 0,
    cachedReadTokens: 0,
    cachedWriteTokens: 0,
    outputTokens: 0,
  };

  let lastStopReason: Anthropic.Messages.Message["stop_reason"] = null;
  let iterations = 0;

  for (let i = 0; i < maxIter; i++) {
    iterations++;
    const resp = await client(input.apiKey).messages.create({
      model: CLAUDE_SONNET_MODEL,
      max_tokens: maxTokens,
      system,
      tools: TOOLS,
      messages,
    });
    accumulateUsage(usage, resp);
    lastStopReason = resp.stop_reason;

    if (resp.stop_reason !== "tool_use") {
      const text = extractText(resp);
      return {
        text,
        toolCalls: recordedCalls,
        sideEffects,
        usage,
        stopReason: lastStopReason,
        iterations,
      };
    }

    // Echo assistant turn back into the message list, then build a
    // user message with one tool_result per tool_use block (per
    // Anthropic SDK convention).
    messages.push({role: "assistant", content: resp.content});

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const block of resp.content) {
      if (block.type !== "tool_use") continue;
      const args = (block.input as Record<string, unknown>) ?? {};
      const result: ToolResult = await executeTool(block.name, args, toolCtx)
        .catch((err) => {
          logger.error("bot.claude.pipeline.tool_threw", {
            requestId: input.requestId,
            name: block.name,
            err: err instanceof Error ? err.message : String(err),
          });
          return {
            output: {error: "tool_exception"},
            errored: true,
          } as ToolResult;
        });

      recordedCalls.push({
        name: block.name,
        input: args,
        output: result.output,
        errored: result.errored,
      });
      if (result.sideEffect) sideEffects.push(result.sideEffect);

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result.output),
        is_error: result.errored ?? false,
      });
    }

    messages.push({role: "user", content: toolResults});
  }

  // Hit the iteration cap without a final text. Surface as an error so
  // the handler can fall back to the polite "microcorte" message.
  logger.warn("bot.claude.pipeline.iter_cap", {
    requestId: input.requestId,
    iterations,
  });
  throw new PipelineIterationCapError(iterations);
}

export class PipelineIterationCapError extends Error {
  constructor(public readonly iterations: number) {
    super(`pipeline_iter_cap: ${iterations}`);
    this.name = "PipelineIterationCapError";
  }
}

function buildInitialMessages(
  input: PipelineInput
): Anthropic.Messages.MessageParam[] {
  const messages: Anthropic.Messages.MessageParam[] = [];

  for (const turn of input.history) {
    messages.push({role: turn.role, content: turn.text});
  }

  // The current turn carries both the per-turn header (guest profile +
  // dynamic KB block) and the user's actual message body. Keeping them
  // in the same message — rather than splitting the header into the
  // system prompt — means the header is uncached, which is correct: it
  // changes per-turn.
  const compositeUserContent =
    `${input.perTurnHeader}\n\n[Current message]\nUSER: ${input.currentText}`;
  messages.push({role: "user", content: compositeUserContent});

  return messages;
}

function extractText(resp: Anthropic.Messages.Message): string {
  const parts: string[] = [];
  for (const block of resp.content) {
    if (block.type === "text") parts.push(block.text);
  }
  return parts.join("").trim();
}

function accumulateUsage(
  acc: PipelineOutput["usage"],
  resp: Anthropic.Messages.Message
): void {
  const u = resp.usage;
  acc.inputTokens += u.input_tokens;
  acc.outputTokens += u.output_tokens;
  acc.cachedReadTokens += u.cache_read_input_tokens ?? 0;
  acc.cachedWriteTokens += u.cache_creation_input_tokens ?? 0;
}
