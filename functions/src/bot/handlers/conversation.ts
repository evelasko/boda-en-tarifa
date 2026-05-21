/**
 * Conversation handler for text inbound. Glues together:
 *
 *   allowlist  →  rate-limit  →  command short-circuit  →
 *   language detect/persist  →  KB load  →  Claude pipeline  →
 *   audit log + send
 *
 * Spec: `bot/specs/02-conversation-design.md` §8 (lifecycle),
 *       `bot/specs/03-architecture.md` (conversation handler),
 *       `bot/specs/07-knowledge-base.md` §4.2 (per-turn content).
 *
 * The webhook handler classifies inbound and calls this for text.
 * Media / interactive / flow handlers live in their own modules
 * (Phase 3).
 */

import * as logger from "firebase-functions/logger";
import type {E164} from "../lib/phone.js";
import {maskPhone} from "../lib/phone.js";
import {
  DEFAULT_FALLBACK_ERROR,
  DEFAULT_RATE_LIMIT_NOTICE,
  ALLOWLIST_REFUSAL,
  isLanguage,
  type Language,
} from "../lib/i18n.js";
import {toMadridIso, dayOfWedding, weekday} from "../lib/time.js";
import {decideInbound, recordUnknownInbound} from "../allowlist.js";
import {recordInboundAndCheck} from "../conversation/ratelimit.js";
import {loadHistory} from "../conversation/state.js";
import {
  displayName,
  setLanguage,
  touchGuestOnInbound,
  type Guest,
} from "../services/guests.js";
import {
  appendMessage,
  upsertConversationRoot,
} from "../services/audit.js";
import {sendText} from "../whatsapp/send.js";
import {classifyCommand, handleHelp, handleStop} from "./command.js";
import {detectLanguage} from "../claude/language.js";
import {getKb} from "../claude/kb.js";
import {
  PipelineIterationCapError,
  runTurn,
  type PipelineOutput,
} from "../claude/pipeline.js";

export interface ConversationDeps {
  /** Resolved at call time so the function can read Cloud Functions secrets. */
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  anthropicApiKey: string;
}

export interface ConversationInput {
  phone: E164;
  text: string;
  requestId: string;
  inboundMetaMessageId: string;
  profileName?: string;
}

export type ConversationOutcome =
  | "replied"
  | "refused_unknown"
  | "rate_limited"
  | "stop_command"
  | "help_command"
  | "error";

export interface ConversationResult {
  outcome: ConversationOutcome;
  replyText?: string;
  outboundMetaMessageId?: string;
  toolCallCount?: number;
}

/**
 * Handle a single inbound text message. The webhook layer is
 * responsible for HMAC verification, dedupe, and classification — this
 * function trusts that the call corresponds to a previously-unseen
 * inbound text from the given phone.
 */
export async function handleInboundText(
  input: ConversationInput,
  deps: ConversationDeps
): Promise<ConversationResult> {
  const {phone, text, requestId} = input;
  const baseLog = {requestId, phone: maskPhone(phone)};

  // 1. Allowlist. Unknown phones get the polite refusal. Previously
  //    opted-out guests ARE allowed back in — per `02-conversation-
  //    design.md` §4 ("Cualquier mensaje me reactiva"), any new
  //    inbound reactivates Thora; `touchGuestOnInbound` re-flips
  //    `botEnrolled` below. The decision carries the resolved Guest
  //    on the allowed branch so we don't re-read in §3.
  const decision = await decideInbound(phone);
  if (decision.kind === "unknown") {
    return handleNotAllowed({input, deps, baseLog});
  }
  const guest: Guest = decision.guest;

  // 2. Rate limit (count this inbound first, then act on the result).
  const rate = await recordInboundAndCheck(phone);
  if (rate.over) {
    if (rate.shouldNotify) {
      const lang = guest.language ?? "es";
      const noticeText = lang === "en" ?
        DEFAULT_RATE_LIMIT_NOTICE.en :
        DEFAULT_RATE_LIMIT_NOTICE.es;
      await safeSend({deps, phone, text: noticeText, requestId});
      logger.info("bot.conversation.rate_limited.notified", {
        ...baseLog,
        count: rate.count,
        bucket: rate.bucket,
      });
      return {outcome: "rate_limited", replyText: noticeText};
    }
    logger.info("bot.conversation.rate_limited.silent", {
      ...baseLog,
      count: rate.count,
      bucket: rate.bucket,
    });
    return {outcome: "rate_limited"};
  }

  // 3. Language resolution. Stored value wins; first-turn we detect
  //    via Haiku and persist. Mid-conversation switch (debounced) is
  //    a Phase 3 follow-up.
  const language = await resolveLanguage({
    storedLanguage: guest.language,
    text,
    anthropicApiKey: deps.anthropicApiKey,
    requestId,
    guestId: guest.id,
  });

  // 4. Touch guest (CSW + first-seen) and ensure conversation root.
  //    `touchGuestOnInbound` consults `guest.botFirstSeenAt` to
  //    decide whether to seed it, avoiding a second read.
  await touchGuestOnInbound(guest);
  await upsertConversationRoot({
    phone,
    guestId: guest.id,
    language,
  });

  // 5. Append inbound to the audit log up front so the message
  //    appears in admin even if Claude bails.
  await appendMessage({
    phone,
    guestId: guest.id,
    direction: "inbound",
    type: "text",
    requestId,
    metaMessageId: input.inboundMetaMessageId,
    text,
  });

  // 6. Command short-circuit.
  const command = classifyCommand(text);
  if (command === "stop") {
    const reply = await handleStop(guest.id, language);
    await sendAndLogOutbound({
      input,
      deps,
      guestId: guest.id,
      replyText: reply.text,
      outcome: "replied",
    });
    return {outcome: "stop_command", replyText: reply.text};
  }
  if (command === "help") {
    const reply = handleHelp(language);
    await sendAndLogOutbound({
      input,
      deps,
      guestId: guest.id,
      replyText: reply.text,
      outcome: "replied",
    });
    return {outcome: "help_command", replyText: reply.text};
  }

  // 7. Conversational turn — KB + history + per-turn header.
  const kb = await getKb();
  const history = await loadHistory(phone);
  const perTurnHeader = buildPerTurnHeader({
    guest,
    phone,
    language,
  });

  let pipeline: PipelineOutput;
  try {
    pipeline = await runTurn({
      apiKey: deps.anthropicApiKey,
      phone,
      language,
      perTurnHeader,
      history,
      currentText: text,
      kbBlock: kb.text,
      requestId,
      guestId: guest.id,
      inboundMessageId: input.inboundMetaMessageId,
    });
  } catch (err) {
    logger.error("bot.conversation.claude_failed", {
      ...baseLog,
      err: err instanceof Error ? err.message : String(err),
      iterCap: err instanceof PipelineIterationCapError,
    });
    const fallbackText = language === "en" ?
      DEFAULT_FALLBACK_ERROR.en :
      DEFAULT_FALLBACK_ERROR.es;
    await sendAndLogOutbound({
      input,
      deps,
      guestId: guest.id,
      replyText: fallbackText,
      outcome: "error",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return {outcome: "error", replyText: fallbackText};
  }

  const escalated = pipeline.sideEffects.some(
    (se) => se.kind === "escalation_recorded"
  );
  await sendAndLogOutbound({
    input,
    deps,
    guestId: guest.id,
    replyText: pipeline.text,
    outcome: escalated ? "escalated" : "replied",
    pipeline,
  });

  // Side effects observability. Escalations are now real side effects
  // (written by the tool executor); location pins and flow triggers
  // remain pending — their dispatchers land in later Phase 3 tasks.
  if (pipeline.sideEffects.length > 0) {
    logger.info("bot.conversation.side_effects", {
      ...baseLog,
      sideEffects: pipeline.sideEffects.map((se) => se.kind),
    });
  }

  return {
    outcome: "replied",
    replyText: pipeline.text,
    toolCallCount: pipeline.toolCalls.length,
  };
}

// ── Internal helpers ───────────────────────────────────────────────────────

async function resolveLanguage(args: {
  storedLanguage: Language | undefined;
  text: string;
  anthropicApiKey: string;
  requestId: string;
  guestId: string;
}): Promise<Language> {
  if (isLanguage(args.storedLanguage)) {
    // Stored language wins; mid-conversation switch detection lands in
    // Phase 3 once we have a debounced 2-turn confirmation flow.
    return args.storedLanguage;
  }
  const detected = await detectLanguage({
    apiKey: args.anthropicApiKey,
    text: args.text,
    requestId: args.requestId,
  });
  await setLanguage(args.guestId, detected).catch((err) => {
    logger.warn("bot.conversation.language_persist_failed", {
      requestId: args.requestId,
      err: err instanceof Error ? err.message : String(err),
    });
  });
  return detected;
}

function buildPerTurnHeader(args: {
  guest: Guest;
  phone: E164;
  language: Language;
}): string {
  const {guest, phone, language} = args;
  const name = displayName(guest);
  const now = new Date();
  const photoConsent = guest.photoConsent === undefined ?
    "unknown" : guest.photoConsent ? "granted" : "declined";
  const lines = [
    "[Per-guest header]",
    `Guest: ${guest.fullName} (preferred: ${name})`,
    `Phone: ${maskPhone(phone)}`,
    `Language: ${language}`,
    `RSVP status: ${guest.rsvpStatus ?? "pending"}`,
    `Photo consent: ${photoConsent}`,
    "",
    "[Today's situation — dynamic KB]",
    `Now: ${toMadridIso(now)}`,
    `Weekday: ${weekday(now, language)}`,
    `Day of wedding: ${dayOfWedding(now)}`,
  ];
  return lines.join("\n");
}

async function sendAndLogOutbound(args: {
  input: ConversationInput;
  deps: ConversationDeps;
  guestId: string;
  replyText: string;
  outcome: "replied" | "escalated" | "error";
  errorMessage?: string;
  pipeline?: PipelineOutput;
}): Promise<void> {
  const sendResult = await safeSend({
    deps: args.deps,
    phone: args.input.phone,
    text: args.replyText,
    requestId: args.input.requestId,
  });
  await appendMessage({
    phone: args.input.phone,
    guestId: args.guestId,
    direction: "outbound",
    type: "text",
    requestId: args.input.requestId,
    metaMessageId: sendResult.metaMessageId,
    text: args.replyText,
    outcome: args.outcome,
    errorMessage: args.errorMessage,
    toolCalls: args.pipeline?.toolCalls,
    claudeModel: args.pipeline ? "sonnet-4-6" : undefined,
    claudeUsage: args.pipeline?.usage,
  });
}

interface SafeSendArgs {
  deps: ConversationDeps;
  phone: E164;
  text: string;
  requestId: string;
}

async function safeSend(args: SafeSendArgs): Promise<{metaMessageId?: string}> {
  try {
    const r = await sendText({
      to: args.phone,
      body: args.text,
      requestId: args.requestId,
      phoneNumberId: args.deps.whatsappPhoneNumberId,
      accessToken: args.deps.whatsappAccessToken,
    });
    return {metaMessageId: r.metaMessageId};
  } catch (err) {
    logger.error("bot.conversation.send_failed", {
      requestId: args.requestId,
      err: err instanceof Error ? err.message : String(err),
    });
    return {};
  }
}

async function handleNotAllowed(args: {
  input: ConversationInput;
  deps: ConversationDeps;
  baseLog: Record<string, unknown>;
}): Promise<ConversationResult> {
  const {input, deps, baseLog} = args;
  // Unknown phone — refuse politely, log to `bot_unknown_inbound`.
  // Refusal copy defaults to ES (no language preference exists yet).
  const send = await safeSend({
    deps,
    phone: input.phone,
    text: ALLOWLIST_REFUSAL.es,
    requestId: input.requestId,
  });
  await recordUnknownInbound({
    phone: input.phone,
    bodyPreview: input.text,
    responseSent: Boolean(send.metaMessageId),
  });
  logger.info("bot.conversation.refused_unknown", baseLog);
  return {
    outcome: "refused_unknown",
    replyText: ALLOWLIST_REFUSAL.es,
    outboundMetaMessageId: send.metaMessageId,
  };
}
