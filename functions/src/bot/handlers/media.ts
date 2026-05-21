/**
 * Inbound media handler. Phase 3 (Task 3) scope: image intake only —
 * Meta download → Cloudinary upload → `feed_posts/{auto}` writer →
 * Thora ack. No Claude turn, no vision / recognition (deferred to
 * Phase 3.5 once operator dossiers land).
 *
 * Other media types get a short Thora-voiced ack and a skip log:
 *   - audio / video → "no digital ears" copy
 *   - document     → "I see the doc but no PDFs" copy
 *   - sticker      → light 🐾 ack
 *
 * Spec: `bot/specs/02-conversation-design.md` §4 / §9 / §11,
 *       `bot/specs/04-data-model.md` §1 (FeedPost),
 *       `bot/specs/07-knowledge-base.md` §11 (vision pipeline, steps
 *       1-3, 6 — recognition steps 4-5 are deferred),
 *       `bot/specs/08-integration-contract.md` §6.
 */

import * as logger from "firebase-functions/logger";
import type {E164} from "../lib/phone.js";
import {fromMetaWaId, maskPhone} from "../lib/phone.js";
import {
  ALLOWLIST_REFUSAL,
  AUDIO_ACK,
  DOCUMENT_ACK,
  DEFAULT_RATE_LIMIT_NOTICE,
  PHOTO_ACK_DECLINED,
  PHOTO_ACK_GRANTED,
  PHOTO_ACK_PENDING,
  PHOTO_UPLOAD_FAILED,
  STICKER_ACK,
  type Language,
} from "../lib/i18n.js";
import {decideInbound, recordUnknownInbound} from "../allowlist.js";
import {recordInboundAndCheck} from "../conversation/ratelimit.js";
import {
  touchGuestOnInbound,
  type Guest,
} from "../services/guests.js";
import {
  appendMessage,
  upsertConversationRoot,
} from "../services/audit.js";
import {sendText} from "../whatsapp/send.js";
import {downloadMedia} from "../whatsapp/media.js";
import {uploadBuffer} from "../lib/cloudinary.js";
import {
  consentFromGuestField,
  createFeedPost,
} from "../services/photos.js";

export interface MediaHandlerDeps {
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
}

export interface MediaInbound {
  phone: E164;
  requestId: string;
  inboundMetaMessageId: string;
  mediaType: "image" | "video" | "audio" | "document" | "sticker";
  mediaId: string;
  /** From `image.caption` etc. when present. */
  caption?: string;
  /** Optional inbound mime hint from Meta's payload. */
  mimeType?: string;
}

export type MediaOutcome =
  | "ack_image"
  | "ack_non_image"
  | "ack_upload_failed"
  | "refused_unknown"
  | "rate_limited"
  | "error";

export interface MediaResult {
  outcome: MediaOutcome;
}

/**
 * Extract media-message details (id, caption, mime_type) from the
 * Meta-classified payload. The classifier preserves the raw `messages[]`
 * element under `raw`; we tease the relevant nested object out here so
 * the webhook stays decoupled from Meta's exact JSON shape.
 */
export function extractMediaPayload(
  mediaType: MediaInbound["mediaType"],
  raw: unknown
): {mediaId: string; caption?: string; mimeType?: string} | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const node = r[mediaType];
  if (typeof node !== "object" || node === null) return null;
  const n = node as Record<string, unknown>;
  const id = typeof n.id === "string" ? n.id : "";
  if (!id) return null;
  return {
    mediaId: id,
    caption: typeof n.caption === "string" ? n.caption : undefined,
    mimeType: typeof n.mime_type === "string" ? n.mime_type : undefined,
  };
}

export async function handleInboundMedia(
  input: MediaInbound,
  deps: MediaHandlerDeps
): Promise<MediaResult> {
  const {phone, requestId} = input;
  const baseLog = {
    requestId,
    phone: maskPhone(phone),
    mediaType: input.mediaType,
  };

  // 1. Allowlist — unknown phones get the same polite refusal as text.
  const decision = await decideInbound(phone);
  if (decision.kind === "unknown") {
    const send = await safeSend({
      deps,
      phone,
      text: ALLOWLIST_REFUSAL.es,
      requestId,
    });
    await recordUnknownInbound({
      phone,
      bodyPreview: `[media:${input.mediaType}]`,
      responseSent: Boolean(send.metaMessageId),
    });
    logger.info("bot.media.refused_unknown", baseLog);
    return {outcome: "refused_unknown"};
  }
  const guest: Guest = decision.guest;

  // 2. Rate limit — media inbound counts the same as text.
  const rate = await recordInboundAndCheck(phone);
  if (rate.over) {
    if (rate.shouldNotify) {
      const lang: Language = guest.language ?? "es";
      const notice = lang === "en" ?
        DEFAULT_RATE_LIMIT_NOTICE.en :
        DEFAULT_RATE_LIMIT_NOTICE.es;
      await safeSend({deps, phone, text: notice, requestId});
      logger.info("bot.media.rate_limited.notified", {
        ...baseLog,
        count: rate.count,
        bucket: rate.bucket,
      });
    } else {
      logger.info("bot.media.rate_limited.silent", {
        ...baseLog,
        count: rate.count,
        bucket: rate.bucket,
      });
    }
    return {outcome: "rate_limited"};
  }

  // 3. Touch guest + conversation root. We don't run the Claude
  //    pipeline for media (yet) but the bookkeeping still needs to
  //    happen so admin UI sees a unified thread.
  const language: Language = guest.language ?? "es";
  await touchGuestOnInbound(guest);
  await upsertConversationRoot({phone, guestId: guest.id, language});

  // 4. Audit inbound. For non-image kinds we use the matching
  //    BotMessageType ("audio", "video", etc.); image carries mediaId
  //    and (later) cloudinaryPublicId once upload completes.
  await appendMessage({
    phone,
    guestId: guest.id,
    direction: "inbound",
    type: input.mediaType,
    requestId,
    metaMessageId: input.inboundMetaMessageId,
    mediaId: input.mediaId,
    text: input.caption,
  });

  if (input.mediaType !== "image") {
    return ackNonImage({input, deps, guest, language, baseLog});
  }

  return processImage({input, deps, guest, language, baseLog});
}

// ── Image pipeline ────────────────────────────────────────────────────────

async function processImage(args: {
  input: MediaInbound;
  deps: MediaHandlerDeps;
  guest: Guest;
  language: Language;
  baseLog: Record<string, unknown>;
}): Promise<MediaResult> {
  const {input, deps, guest, language, baseLog} = args;

  let downloaded;
  try {
    downloaded = await downloadMedia({
      mediaId: input.mediaId,
      accessToken: deps.whatsappAccessToken,
      requestId: input.requestId,
    });
  } catch (err) {
    logger.error("bot.media.download_error", {
      ...baseLog,
      err: err instanceof Error ? err.message : String(err),
    });
    return ackUploadFailed({input, deps, guest, language});
  }

  let uploaded;
  try {
    uploaded = await uploadBuffer({
      cloudName: deps.cloudinaryCloudName,
      uploadPreset: deps.cloudinaryUploadPreset,
      buffer: downloaded.buffer,
      filename: `${input.mediaId}`,
      contentType: downloaded.mimeType,
      tags: ["whatsapp", "bot", "pending_moderation"],
      requestId: input.requestId,
    });
  } catch (err) {
    logger.error("bot.media.upload_error", {
      ...baseLog,
      err: err instanceof Error ? err.message : String(err),
    });
    return ackUploadFailed({input, deps, guest, language});
  }

  let feedPostId: string;
  try {
    feedPostId = await createFeedPost({
      guestId: guest.id,
      cloudinaryPublicId: uploaded.public_id,
      cloudinaryUrl: uploaded.secure_url,
      mimeType: downloaded.mimeType,
      width: uploaded.width,
      height: uploaded.height,
      consent: consentFromGuestField(guest.photoConsent),
      caption: input.caption,
    });
  } catch (err) {
    logger.error("bot.media.feed_post_error", {
      ...baseLog,
      publicId: uploaded.public_id,
      err: err instanceof Error ? err.message : String(err),
    });
    return ackUploadFailed({input, deps, guest, language});
  }

  logger.info("bot.media.feed_post_created", {
    ...baseLog,
    feedPostId,
    publicId: uploaded.public_id,
    consent: consentFromGuestField(guest.photoConsent),
  });

  const ackText = pickPhotoAck(guest.photoConsent, language);
  const sendResult = await safeSend({
    deps,
    phone: input.phone,
    text: ackText,
    requestId: input.requestId,
  });
  await appendMessage({
    phone: input.phone,
    guestId: guest.id,
    direction: "outbound",
    type: "text",
    requestId: input.requestId,
    metaMessageId: sendResult.metaMessageId,
    text: ackText,
    cloudinaryPublicId: uploaded.public_id,
    outcome: "replied",
  });

  return {outcome: "ack_image"};
}

async function ackUploadFailed(args: {
  input: MediaInbound;
  deps: MediaHandlerDeps;
  guest: Guest;
  language: Language;
}): Promise<MediaResult> {
  const {input, deps, guest, language} = args;
  const text = pick(PHOTO_UPLOAD_FAILED, language);
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
    outcome: "error",
  });
  return {outcome: "ack_upload_failed"};
}

// ── Non-image pipeline ────────────────────────────────────────────────────

async function ackNonImage(args: {
  input: MediaInbound;
  deps: MediaHandlerDeps;
  guest: Guest;
  language: Language;
  baseLog: Record<string, unknown>;
}): Promise<MediaResult> {
  const {input, deps, guest, language, baseLog} = args;
  const text = pickNonImageAck(input.mediaType, language);

  logger.info("bot.media.skip_non_image", {
    ...baseLog,
    note: "phase3_image_only",
  });

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
    outcome: "replied",
  });
  return {outcome: "ack_non_image"};
}

// ── Helpers ───────────────────────────────────────────────────────────────

function pick(bundle: {es: string; en: string}, lang: Language): string {
  return lang === "en" ? bundle.en : bundle.es;
}

function pickPhotoAck(
  consent: boolean | undefined,
  lang: Language
): string {
  if (consent === true) return pick(PHOTO_ACK_GRANTED, lang);
  if (consent === false) return pick(PHOTO_ACK_DECLINED, lang);
  return pick(PHOTO_ACK_PENDING, lang);
}

function pickNonImageAck(
  mediaType: MediaInbound["mediaType"],
  lang: Language
): string {
  switch (mediaType) {
  case "audio":
    return pick(AUDIO_ACK, lang);
  case "video":
    // Video isn't called out separately in §9 yet — mirror audio for
    // Phase 3; revisit when the operator decides to accept video.
    return pick(AUDIO_ACK, lang);
  case "document":
    return pick(DOCUMENT_ACK, lang);
  case "sticker":
    return pick(STICKER_ACK, lang);
  default:
    return pick(AUDIO_ACK, lang);
  }
}

async function safeSend(args: {
  deps: MediaHandlerDeps;
  phone: E164;
  text: string;
  requestId: string;
}): Promise<{metaMessageId?: string}> {
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
    logger.error("bot.media.send_failed", {
      requestId: args.requestId,
      err: err instanceof Error ? err.message : String(err),
    });
    return {};
  }
}

// Re-exported so the webhook dispatcher can normalize the wa_id once
// rather than threading the helper through.
export {fromMetaWaId};
