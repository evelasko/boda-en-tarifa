/**
 * Inbound voice-note handler — Phase E1.
 *
 * Flow:
 *   1. Allowlist + rate limit (shared `evaluateInboundGate`).
 *   2. Typing indicator (fire-and-forget, mirrors C4 in text handler).
 *   3. Download the audio binary from Meta via `whatsapp/media.ts`.
 *   4. Transcribe via OpenAI Whisper (`services/transcription.ts`).
 *   5. Empty transcription → reply with the canonical `AUDIO_ACK` from
 *      `lib/i18n.ts` and short-circuit (no Claude call).
 *   6. Non-empty → resolve language, touch guest, upsert conversation
 *      root, write the inbound audit row with `type: "audio"` (carrying
 *      the transcribed text + Meta mediaId), then run the shared
 *      `runConversationalTurn` so Claude sees the transcribed text as
 *      a normal text turn.
 *
 * Privacy: never log the raw transcribed text. The Firestore audit row
 * is operator-gated (`bot/specs/09-security-privacy.md` §6.1); Cloud
 * Logging only sees byte-length / duration / language signals.
 *
 * Spec: launch-readiness §8 E1, optimization-plan Imp-9.
 */

import * as logger from "firebase-functions/logger";
import type {E164} from "../lib/phone.js";
import {maskPhone} from "../lib/phone.js";
import {
  ALLOWLIST_REFUSAL,
  AUDIO_ACK,
  DEFAULT_FALLBACK_ERROR,
  DEFAULT_RATE_LIMIT_NOTICE,
  type Language,
} from "../lib/i18n.js";
import {recordUnknownInbound} from "../allowlist.js";
import {evaluateInboundGate} from "../conversation/inbound-gate.js";
import {touchGuestOnInbound, type Guest} from "../services/guests.js";
import {appendMessage, upsertConversationRoot} from "../services/audit.js";
import {markReadWithTyping} from "../whatsapp/send.js";
import {downloadMedia} from "../whatsapp/media.js";
import {captureWithContext} from "../../lib/sentry.js";
import {
  resolveLanguage,
  runConversationalTurn,
  safeSend,
  type ConversationDeps,
} from "./conversation.js";
import {
  TranscriptionTooLargeError,
  transcribe,
} from "../services/transcription.js";

export interface VoiceHandlerDeps extends ConversationDeps {
  /** OpenAI API key — `OPENAI_API_KEY` secret. */
  openaiApiKey: string;
}

export interface VoiceInbound {
  phone: E164;
  requestId: string;
  inboundMetaMessageId: string;
  mediaId: string;
  mimeType?: string;
}

export type VoiceOutcome =
  | "replied"
  | "audio_ack_empty"
  | "audio_ack_download_failed"
  | "audio_ack_too_large"
  | "audio_ack_transcribe_failed"
  | "refused_unknown"
  | "rate_limited"
  | "stop_command"
  | "help_command"
  | "error";

export interface VoiceResult {
  outcome: VoiceOutcome;
  replyText?: string;
}

const DEFAULT_AUDIO_MIME = "audio/ogg; codecs=opus";

export async function handleInboundAudio(
  input: VoiceInbound,
  deps: VoiceHandlerDeps
): Promise<VoiceResult> {
  const {phone, requestId} = input;
  const baseLog = {requestId, phone: maskPhone(phone), kind: "audio"};

  // 1. Gate.
  let gate;
  try {
    gate = await evaluateInboundGate(phone);
  } catch (err) {
    captureWithContext(err, {requestId, phone, kind: "voice.gate"});
    logger.error("bot.voice.gate_failed", {
      ...baseLog,
      err: err instanceof Error ? err.message : String(err),
    });
    return {outcome: "error"};
  }

  if (gate.kind === "refused_unknown") {
    const send = await safeSend({
      deps,
      phone,
      text: ALLOWLIST_REFUSAL.es,
      requestId,
    });
    await recordUnknownInbound({
      phone,
      bodyPreview: "[audio]",
      responseSent: Boolean(send.metaMessageId),
    });
    logger.info("bot.voice.refused_unknown", baseLog);
    return {outcome: "refused_unknown", replyText: ALLOWLIST_REFUSAL.es};
  }
  if (gate.kind === "rate_limited") {
    if (gate.rate.shouldNotify) {
      const lang: Language = gate.guest.language ?? "es";
      const notice = lang === "en" ?
        DEFAULT_RATE_LIMIT_NOTICE.en :
        DEFAULT_RATE_LIMIT_NOTICE.es;
      await safeSend({deps, phone, text: notice, requestId});
      logger.info("bot.voice.rate_limited.notified", {
        ...baseLog,
        count: gate.rate.count,
        bucket: gate.rate.bucket,
      });
      return {outcome: "rate_limited", replyText: notice};
    }
    logger.info("bot.voice.rate_limited.silent", {
      ...baseLog,
      count: gate.rate.count,
      bucket: gate.rate.bucket,
    });
    return {outcome: "rate_limited"};
  }
  const guest: Guest = gate.guest;

  // 2. Typing indicator (fire-and-forget — C4 pattern).
  void markReadWithTyping({
    metaMessageId: input.inboundMetaMessageId,
    phoneNumberId: deps.whatsappPhoneNumberId,
    accessToken: deps.whatsappAccessToken,
    requestId,
  }).catch((err) => {
    logger.info("bot.voice.typing_indicator_failed", {
      ...baseLog,
      err: err instanceof Error ? err.message : String(err),
    });
  });

  // 3. Download audio binary from Meta.
  let downloaded;
  try {
    downloaded = await downloadMedia({
      mediaId: input.mediaId,
      accessToken: deps.whatsappAccessToken,
      requestId,
    });
  } catch (err) {
    captureWithContext(err, {requestId, phone, kind: "voice.download"});
    logger.error("bot.voice.download_failed", {
      ...baseLog,
      mediaId: input.mediaId,
      err: err instanceof Error ? err.message : String(err),
    });
    await safeAppendInbound({
      phone,
      guestId: guest.id,
      requestId,
      metaMessageId: input.inboundMetaMessageId,
      mediaId: input.mediaId,
    });
    return sendAudioAckFallback({
      guest,
      input,
      deps,
      outcome: "audio_ack_download_failed",
    });
  }

  // 4. Transcribe via Whisper. Pass the guest's stored language as a
  //    hint when present — Whisper auto-detects otherwise.
  let transcription;
  try {
    transcription = await transcribe({
      audioBuffer: downloaded.buffer,
      mimeType: downloaded.mimeType || input.mimeType || DEFAULT_AUDIO_MIME,
      language: guest.language,
      apiKey: deps.openaiApiKey,
      requestId,
    });
  } catch (err) {
    captureWithContext(err, {requestId, phone, kind: "voice.transcribe"});
    await safeAppendInbound({
      phone,
      guestId: guest.id,
      requestId,
      metaMessageId: input.inboundMetaMessageId,
      mediaId: input.mediaId,
    });
    if (err instanceof TranscriptionTooLargeError) {
      logger.warn("bot.voice.too_large", {
        ...baseLog,
        bytes: err.bytes,
      });
      return sendAudioAckFallback({
        guest,
        input,
        deps,
        outcome: "audio_ack_too_large",
      });
    }
    logger.error("bot.voice.transcribe_failed", {
      ...baseLog,
      err: err instanceof Error ? err.message : String(err),
    });
    return sendErrorFallback({guest, input, deps});
  }

  const transcribedText = transcription.text;

  // 5. Empty transcription → soft fallback, no Claude.
  if (transcribedText.length === 0) {
    logger.info("bot.transcription.empty", {
      ...baseLog,
      durationSec: transcription.durationSec,
      detectedLanguage: transcription.detectedLanguage,
    });
    // Audit the inbound even when empty so the operator sees the audio
    // landed (no text body, just the Meta mediaId reference).
    await safeAppendInbound({
      phone,
      guestId: guest.id,
      requestId,
      metaMessageId: input.inboundMetaMessageId,
      mediaId: input.mediaId,
    });
    return sendAudioAckFallback({
      guest,
      input,
      deps,
      outcome: "audio_ack_empty",
    });
  }

  // 6. Resolve language. Whisper's detected language is informational
  //    only — we keep using the existing Haiku detector to stay
  //    consistent with the text path's persistence behavior.
  const language = await resolveLanguage({
    storedLanguage: guest.language,
    text: transcribedText,
    anthropicApiKey: deps.anthropicApiKey,
    requestId,
    guestId: guest.id,
  });

  // 7. Touch guest + upsert conversation root, then write the inbound
  //    audit row (type "audio") with the transcribed text and mediaId
  //    so admins see what landed before the Claude turn runs.
  await touchGuestOnInbound(guest);
  await upsertConversationRoot({phone, guestId: guest.id, language});
  await appendMessage({
    phone,
    guestId: guest.id,
    direction: "inbound",
    type: "audio",
    requestId,
    metaMessageId: input.inboundMetaMessageId,
    mediaId: input.mediaId,
    text: transcribedText,
  });

  // 8. Hand off to the shared post-audit pipeline (command short-circuit
  //    + KB + Claude turn + outbound send + outbound audit).
  const result = await runConversationalTurn({
    guest,
    phone,
    language,
    currentText: transcribedText,
    requestId,
    inboundMetaMessageId: input.inboundMetaMessageId,
    deps,
  });

  return {
    outcome: toVoiceOutcome(result.outcome),
    replyText: result.replyText,
  };
}

function toVoiceOutcome(inner: string): VoiceOutcome {
  switch (inner) {
  case "replied":
  case "stop_command":
  case "help_command":
  case "rate_limited":
  case "error":
    return inner;
  default:
    // `refused_unknown` cannot reach here (gate ran earlier). Anything
    // else collapses to a benign "replied" so the dispatcher still
    // marks the message processed.
    return "replied";
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────

async function sendAudioAckFallback(args: {
  guest: Guest;
  input: VoiceInbound;
  deps: VoiceHandlerDeps;
  outcome: VoiceOutcome;
}): Promise<VoiceResult> {
  const lang: Language = args.guest.language ?? "es";
  const text = lang === "en" ? AUDIO_ACK.en : AUDIO_ACK.es;
  return sendFallback({...args, text});
}

async function sendErrorFallback(args: {
  guest: Guest;
  input: VoiceInbound;
  deps: VoiceHandlerDeps;
}): Promise<VoiceResult> {
  const lang: Language = args.guest.language ?? "es";
  const text = lang === "en" ?
    DEFAULT_FALLBACK_ERROR.en :
    DEFAULT_FALLBACK_ERROR.es;
  return sendFallback({
    ...args,
    text,
    outcome: "audio_ack_transcribe_failed",
  });
}

async function sendFallback(args: {
  guest: Guest;
  input: VoiceInbound;
  deps: VoiceHandlerDeps;
  text: string;
  outcome: VoiceOutcome;
}): Promise<VoiceResult> {
  const {guest, input, deps, text, outcome} = args;
  const send = await safeSend({
    deps,
    phone: input.phone,
    text,
    requestId: input.requestId,
  });
  await appendMessage({
    phone: input.phone,
    guestId: guest.id,
    direction: "outbound",
    type: "text",
    requestId: input.requestId,
    metaMessageId: send.metaMessageId,
    text,
    outcome: outcome === "audio_ack_transcribe_failed" ? "error" : "replied",
  }).catch((err) => {
    captureWithContext(err, {
      requestId: input.requestId,
      phone: input.phone,
      kind: "voice.outbound_audit",
    });
    logger.error("bot.voice.outbound_audit_failed", {
      requestId: input.requestId,
      err: err instanceof Error ? err.message : String(err),
    });
  });
  return {outcome, replyText: text};
}

async function safeAppendInbound(args: {
  phone: E164;
  guestId: string;
  requestId: string;
  metaMessageId: string;
  mediaId: string;
}): Promise<void> {
  try {
    await appendMessage({
      phone: args.phone,
      guestId: args.guestId,
      direction: "inbound",
      type: "audio",
      requestId: args.requestId,
      metaMessageId: args.metaMessageId,
      mediaId: args.mediaId,
    });
  } catch (err) {
    captureWithContext(err, {
      requestId: args.requestId,
      phone: args.phone,
      kind: "voice.inbound_audit",
    });
    logger.error("bot.voice.inbound_audit_failed", {
      requestId: args.requestId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
