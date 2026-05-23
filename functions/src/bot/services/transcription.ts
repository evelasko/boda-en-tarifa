/**
 * OpenAI Whisper wrapper. One endpoint, plain `fetch` + `FormData` — no
 * OpenAI SDK needed.
 *
 * Spec: launch-readiness plan §8 E1, optimization-plan Imp-9.
 *
 * Privacy: never log the transcribed text. The caller (handlers/voice.ts)
 * owns the audit-row write that persists the text inside Firestore (which
 * is gated to operators by security rules). Cloud Logging only sees a
 * byte-length / duration summary.
 */

import * as logger from "firebase-functions/logger";
import type {Language} from "../lib/i18n.js";

/** Whisper's hard limit per the OpenAI docs. */
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";
const MODEL = "whisper-1";

export interface TranscribeArgs {
  audioBuffer: Buffer;
  /** e.g. "audio/ogg; codecs=opus" — Meta's voice-note default. */
  mimeType: string;
  /** Optional hint; Whisper auto-detects when absent. */
  language?: Language;
  apiKey: string;
  requestId: string;
}

export interface TranscribeResult {
  text: string;
  durationSec?: number;
  detectedLanguage?: string;
}

export class TranscriptionTooLargeError extends Error {
  constructor(public readonly bytes: number) {
    super(`audio_too_large: ${bytes} bytes (max ${MAX_AUDIO_BYTES})`);
    this.name = "TranscriptionTooLargeError";
  }
}

export class TranscriptionApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string
  ) {
    super(`whisper_api_failed: HTTP ${status}: ${detail}`);
    this.name = "TranscriptionApiError";
  }
}

interface WhisperVerboseJsonResponse {
  text?: string;
  duration?: number;
  language?: string;
}

export async function transcribe(
  args: TranscribeArgs
): Promise<TranscribeResult> {
  const {audioBuffer, mimeType, language, apiKey, requestId} = args;

  if (!apiKey) throw new Error("transcribe: missing apiKey");
  if (audioBuffer.length === 0) throw new Error("transcribe: empty buffer");
  if (audioBuffer.length > MAX_AUDIO_BYTES) {
    throw new TranscriptionTooLargeError(audioBuffer.length);
  }

  const form = new FormData();
  const filename = filenameFor(mimeType);
  form.set(
    "file",
    new Blob([new Uint8Array(audioBuffer)], {type: mimeType}),
    filename
  );
  form.set("model", MODEL);
  // `verbose_json` returns duration + detected language so we can log a
  // signal of recognition quality without storing the raw text.
  form.set("response_format", "verbose_json");
  if (language) form.set("language", language);

  const resp = await fetch(ENDPOINT, {
    method: "POST",
    headers: {Authorization: `Bearer ${apiKey}`},
    body: form,
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    logger.warn("bot.transcription.api_failed", {
      requestId,
      status: resp.status,
      detailPreview: detail.slice(0, 200),
    });
    throw new TranscriptionApiError(resp.status, detail.slice(0, 200));
  }

  const json = (await resp.json()) as WhisperVerboseJsonResponse;
  const text = typeof json.text === "string" ? json.text.trim() : "";
  const durationSec = typeof json.duration === "number" ?
    json.duration :
    undefined;
  const detectedLanguage = typeof json.language === "string" ?
    json.language :
    undefined;

  logger.info("bot.transcription.ok", {
    requestId,
    bytes: audioBuffer.length,
    durationSec,
    detectedLanguage,
    empty: text.length === 0,
  });

  return {text, durationSec, detectedLanguage};
}

function filenameFor(mimeType: string): string {
  const lower = mimeType.toLowerCase();
  if (lower.includes("ogg")) return "audio.ogg";
  if (lower.includes("mp4") || lower.includes("m4a")) return "audio.m4a";
  if (lower.includes("mpeg") || lower.includes("mp3")) return "audio.mp3";
  if (lower.includes("wav")) return "audio.wav";
  if (lower.includes("webm")) return "audio.webm";
  return "audio.bin";
}
