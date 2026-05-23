import {onRequest, type Request} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import type {Response} from "express";
import {randomUUID} from "node:crypto";
import {getFirestore} from "firebase-admin/firestore";
import {
  ANTHROPIC_API_KEY,
  BOT_REGION,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  OPENAI_API_KEY,
  SENTRY_DSN,
  WEBHOOK_SECRETS,
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_APP_SECRET,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_VERIFY_TOKEN,
} from "../lib/config.js";
import {fromMetaWaId, maskPhone} from "../lib/phone.js";
import {handleHandshake, verifySignature} from "./verify.js";
import {claimMessageId, markProcessed} from "./dedupe.js";
import {classifyEvents, type ClassifiedEvent} from "./classify.js";
import {handleInboundText} from "../handlers/conversation.js";
import {
  extractMediaPayload,
  handleInboundMedia,
} from "../handlers/media.js";
import {handleInboundAudio} from "../handlers/voice.js";
import {handleStatusEvent} from "./status.js";
import {captureWithContext, ensureSentry} from "../../lib/sentry.js";

/**
 * WhatsApp Cloud API webhook entry point.
 *
 * Phase 1 scope:
 *   - GET handshake for Meta subscription verification.
 *   - POST: HMAC verify, dedupe, classify, reply to text with a placeholder.
 *
 * Always returns 200 to Meta on POST (except for HMAC failure → 401),
 * regardless of internal processing outcome — Meta retries on 5xx and
 * we never want duplicate processing.
 *
 * Spec: `bot/specs/08-integration-contract.md` §1,
 *       `bot/specs/03-architecture.md` §5.1.
 */
// Compute config bumped per launch-readiness plan A6 (Imp-12). The
// active window (2026-05-23 → 2026-06-05) is short enough that the cost
// of always-on warm instances (~€50-60 total per the plan) is a fair
// trade for eliminating cold starts. After the event the operator drops
// minInstances back to 0 (F4).
export const whatsappWebhook = onRequest(
  {
    region: BOT_REGION,
    secrets: WEBHOOK_SECRETS,
    memory: "4GiB",
    cpu: 2,
    concurrency: 40,
    timeoutSeconds: 60,
    minInstances: 5,
    maxInstances: 50,
    invoker: "public",
  },
  async (req, res) => {
    const requestId = randomUUID();

    if (req.method === "GET") {
      return handleGet(req, res, requestId);
    }
    if (req.method === "POST") {
      return handlePost(req, res, requestId);
    }

    logger.warn("bot.webhook.method_not_allowed", {
      requestId,
      method: req.method,
    });
    res.status(405).send("Method Not Allowed");
    return;
  }
);

/**
 * GET handshake — Meta calls this once when the webhook is first
 * subscribed in the App Dashboard (and any time the URL is re-saved).
 *
 * @param {Request} req
 * @param {Response} res
 * @param {string} requestId
 * @return {void}
 */
function handleGet(
  req: Request,
  res: Response,
  requestId: string
): void {
  const expectedToken = WHATSAPP_VERIFY_TOKEN.value();
  const result = handleHandshake(
    {
      mode: typeof req.query["hub.mode"] === "string" ?
        req.query["hub.mode"] : undefined,
      token: typeof req.query["hub.verify_token"] === "string" ?
        req.query["hub.verify_token"] : undefined,
      challenge: typeof req.query["hub.challenge"] === "string" ?
        req.query["hub.challenge"] : undefined,
    },
    expectedToken
  );

  logger.info("bot.webhook.handshake", {
    requestId,
    status: result.status,
  });
  res.status(result.status).send(result.body);
}

/**
 * POST handler — verify signature, then process synchronously inside the
 * 10s Meta timeout. If processing exceeds budget, ack 200 first and let
 * the work continue best-effort (acceptable for Phase 1 placeholder
 * traffic; later phases use a dedicated dispatch path).
 *
 * @param {Request} req
 * @param {Response} res
 * @param {string} requestId
 * @return {Promise<void>}
 */
async function handlePost(
  req: Request,
  res: Response,
  requestId: string
): Promise<void> {
  // Init Sentry once per cold start (Phase C5). Idempotent — subsequent
  // calls inside the same Node process are no-ops.
  ensureSentry(SENTRY_DSN.value());

  const rawBody = req.rawBody?.toString("utf8") ?? "";
  const signature = req.get("x-hub-signature-256") ?? undefined;

  const appSecret = WHATSAPP_APP_SECRET.value();
  if (!verifySignature(rawBody, signature, appSecret)) {
    logger.warn("bot.webhook.signature_failed", {
      requestId,
      hasSignature: Boolean(signature),
    });
    res.status(401).send("Unauthorized");
    return;
  }

  let body: unknown;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch (err) {
    logger.warn("bot.webhook.bad_json", {requestId, err: String(err)});
    res.status(200).send("OK"); // never let Meta retry on our parse failure
    return;
  }

  // Ack early — Meta's timeout is 10s. Phase 1 work is fast (<2s) so we
  // still complete inside the request lifecycle; ack-first is defense
  // against unexpectedly slow downstream calls (Meta send, Firestore).
  res.status(200).send("OK");

  // Kill-switch (launch-readiness B5). When the operator flips
  // `config/bot.enabled = false` from the settings page, classify and
  // log the inbound but skip the conversational handler so Thora goes
  // silent. Status callbacks still process (so delivery state stays
  // accurate for in-flight broadcasts). Result is cached for 10s so a
  // burst of inbounds doesn't hit Firestore on every message.
  const botEnabled = await isBotEnabled();

  try {
    const events = classifyEvents(body);
    logger.info("bot.webhook.received", {
      requestId,
      eventCount: events.length,
      kinds: events.map((e) => e.kind),
      botEnabled,
    });

    for (const event of events) {
      if (!botEnabled && event.kind !== "status") {
        logger.info("bot.webhook.kill_switch_engaged", {
          requestId,
          kind: event.kind,
        });
        continue;
      }
      await dispatchEvent(event, requestId);
    }
  } catch (err) {
    captureWithContext(err, {requestId, kind: "webhook.processing"});
    logger.error("bot.webhook.processing_error", {
      requestId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

// ── Kill-switch cache ──────────────────────────────────────────────────────

const ENABLED_CACHE_TTL_MS = 10_000;
let enabledCache: {value: boolean; expiresAt: number} | null = null;

async function isBotEnabled(): Promise<boolean> {
  const now = Date.now();
  if (enabledCache && enabledCache.expiresAt > now) {
    return enabledCache.value;
  }
  try {
    const snap = await getFirestore().doc("config/bot").get();
    const value = snap.exists ?
      ((snap.data() as {enabled?: boolean}).enabled !== false) :
      true; // default true when the config doc is absent
    enabledCache = {value, expiresAt: now + ENABLED_CACHE_TTL_MS};
    return value;
  } catch (err) {
    logger.warn("bot.webhook.enabled_read_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return true; // fail-open: never silence the bot on a config read error
  }
}

/**
 * Phase 1 dispatcher: only text inbound triggers an outbound. Other
 * kinds are logged so we can confirm classification works end-to-end
 * but do not produce a reply yet.
 *
 * @param {ClassifiedEvent} event
 * @param {string} requestId
 * @return {Promise<void>}
 */
async function dispatchEvent(
  event: ClassifiedEvent,
  requestId: string
): Promise<void> {
  if (event.kind === "status") {
    logger.info("bot.webhook.status", {
      requestId,
      metaMessageId: event.messageId,
      status: event.status,
      recipient: maskPhone(`+${event.recipientId}`),
      errors: event.errors,
    });
    // Fan out to the send-log + broadcast recipient subcollection. Never
    // throws — `handleStatusEvent` catches and logs internally.
    await handleStatusEvent(
      {
        metaMessageId: event.messageId,
        status: event.status,
        recipientId: event.recipientId,
        errors: event.errors,
      },
      requestId
    ).catch((err) => {
      logger.warn("bot.webhook.status.handler_failed", {
        requestId,
        metaMessageId: event.messageId,
        err: err instanceof Error ? err.message : String(err),
      });
    });
    return;
  }

  if (event.kind === "unsupported") {
    logger.info("bot.webhook.unsupported", {
      requestId,
      reason: event.reason,
    });
    return;
  }

  // Inbound message kinds: text | interactive | media. All carry
  // messageId + from. Dedupe applies to all of them.
  const claimed = await claimMessageId(event.messageId);
  if (!claimed) {
    logger.info("bot.webhook.duplicate", {
      requestId,
      metaMessageId: event.messageId,
    });
    return;
  }

  const fromE164 = fromMetaWaId(event.from);
  const baseLog = {
    requestId,
    kind: event.kind,
    metaMessageId: event.messageId,
    from: maskPhone(fromE164),
  };

  if (event.kind === "media") {
    await dispatchMedia(event, fromE164, requestId, baseLog);
    return;
  }

  if (event.kind === "audio") {
    await dispatchAudio(event, fromE164, requestId, baseLog);
    return;
  }

  if (event.kind !== "text") {
    logger.info("bot.webhook.skip_non_text_phase1", baseLog);
    await markProcessed(event.messageId);
    return;
  }

  logger.info("bot.webhook.text_inbound", {
    ...baseLog,
    bodyLength: event.text.length,
  });

  try {
    const result = await handleInboundText(
      {
        phone: fromE164,
        text: event.text,
        requestId,
        inboundMetaMessageId: event.messageId,
        profileName: event.profileName,
      },
      {
        whatsappPhoneNumberId: WHATSAPP_PHONE_NUMBER_ID.value(),
        whatsappAccessToken: WHATSAPP_ACCESS_TOKEN.value(),
        anthropicApiKey: ANTHROPIC_API_KEY.value(),
      }
    );
    logger.info("bot.webhook.handled", {
      ...baseLog,
      outcome: result.outcome,
      toolCalls: result.toolCallCount,
    });
    // markProcessed only on outcomes that produced (or deliberately
    // suppressed) a reply. Unhandled errors leave the dedupe entry
    // as a "claimed but unprocessed" marker for ops review.
    if (result.outcome !== "error") {
      await markProcessed(event.messageId);
    }
  } catch (err) {
    captureWithContext(err, {
      requestId,
      phone: fromE164,
      kind: "webhook.text",
    });
    logger.error("bot.webhook.handler_failed", {
      ...baseLog,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Audio dispatcher (launch-readiness E1). Whisper-backed voice handler
 * downloads the audio, transcribes it, and routes the resulting text
 * through the shared conversational pipeline. Failures here are logged,
 * never thrown — early-ack in `handlePost` already returned 200 to Meta.
 */
async function dispatchAudio(
  event: Extract<ClassifiedEvent, {kind: "audio"}>,
  fromE164: string,
  requestId: string,
  baseLog: Record<string, unknown>
): Promise<void> {
  logger.info("bot.webhook.audio_inbound", {
    ...baseLog,
    hasMimeType: Boolean(event.mimeType),
  });

  try {
    const result = await handleInboundAudio(
      {
        phone: fromE164,
        requestId,
        inboundMetaMessageId: event.messageId,
        mediaId: event.mediaId,
        mimeType: event.mimeType,
      },
      {
        whatsappPhoneNumberId: WHATSAPP_PHONE_NUMBER_ID.value(),
        whatsappAccessToken: WHATSAPP_ACCESS_TOKEN.value(),
        anthropicApiKey: ANTHROPIC_API_KEY.value(),
        openaiApiKey: OPENAI_API_KEY.value(),
      }
    );
    logger.info("bot.webhook.audio_handled", {
      ...baseLog,
      outcome: result.outcome,
    });
    if (result.outcome !== "error") {
      await markProcessed(event.messageId);
    }
  } catch (err) {
    captureWithContext(err, {
      requestId,
      phone: fromE164,
      kind: "webhook.audio",
    });
    logger.error("bot.webhook.audio_handler_failed", {
      ...baseLog,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Media dispatcher — image upload + ack today, with non-image media
 * getting a short Thora-voiced ack. Returns 200 to Meta via the early
 * ack in `handlePost` — failures here are logged, never thrown.
 */
async function dispatchMedia(
  event: Extract<ClassifiedEvent, {kind: "media"}>,
  fromE164: string,
  requestId: string,
  baseLog: Record<string, unknown>
): Promise<void> {
  const payload = extractMediaPayload(event.mediaType, event.raw);
  if (!payload) {
    logger.warn("bot.webhook.media_payload_missing", {
      ...baseLog,
      reason: "no_media_id",
    });
    await markProcessed(event.messageId);
    return;
  }

  logger.info("bot.webhook.media_inbound", {
    ...baseLog,
    mediaType: event.mediaType,
    hasCaption: Boolean(payload.caption),
  });

  try {
    const result = await handleInboundMedia(
      {
        phone: fromE164,
        requestId,
        inboundMetaMessageId: event.messageId,
        mediaType: event.mediaType,
        mediaId: payload.mediaId,
        caption: payload.caption,
        mimeType: payload.mimeType,
      },
      {
        whatsappPhoneNumberId: WHATSAPP_PHONE_NUMBER_ID.value(),
        whatsappAccessToken: WHATSAPP_ACCESS_TOKEN.value(),
        cloudinaryCloudName: CLOUDINARY_CLOUD_NAME.value(),
        cloudinaryUploadPreset: CLOUDINARY_UPLOAD_PRESET.value(),
      }
    );
    logger.info("bot.webhook.media_handled", {
      ...baseLog,
      mediaType: event.mediaType,
      outcome: result.outcome,
    });
    if (result.outcome !== "error") {
      await markProcessed(event.messageId);
    }
  } catch (err) {
    captureWithContext(err, {
      requestId,
      phone: fromE164,
      kind: "webhook.media",
    });
    logger.error("bot.webhook.media_handler_failed", {
      ...baseLog,
      mediaType: event.mediaType,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
