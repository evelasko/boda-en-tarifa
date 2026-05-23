import * as logger from "firebase-functions/logger";
import {createGraphClient, describeAxiosError} from "./client.js";
import {toMetaWaId, type E164} from "../lib/phone.js";
import type {MetaTemplatePayload} from "./templates.js";

/**
 * Outbound send helpers wrapping the Meta Cloud API.
 *
 * Spec: `bot/specs/08-integration-contract.md` §2.
 *
 * Phase 1: text-only. Phase 4/5 (launch-readiness plan A1) adds template
 * sends used by the broadcast dispatcher and scheduled functions.
 */

export interface SendTextArgs {
  to: E164;
  body: string;
  requestId: string;
  /** WHATSAPP_PHONE_NUMBER_ID secret value. */
  phoneNumberId: string;
  /** WHATSAPP_ACCESS_TOKEN secret value. */
  accessToken: string;
}

export interface SendResult {
  metaMessageId: string;
}

interface MetaSendResponse {
  messaging_product?: string;
  contacts?: Array<{input?: string; wa_id?: string}>;
  messages?: Array<{id: string; message_status?: string}>;
  error?: {code?: number; message?: string};
}

/**
 * Send a plain text WhatsApp session message. Caller must already have
 * confirmed the recipient is inside the 24-hour customer service window.
 *
 * @param {SendTextArgs} args
 * @return {Promise<SendResult>}
 */
export async function sendText(args: SendTextArgs): Promise<SendResult> {
  const {to, body, requestId, phoneNumberId, accessToken} = args;

  if (!phoneNumberId) {
    throw new Error("send: missing phoneNumberId");
  }
  if (!accessToken) {
    throw new Error("send: missing accessToken");
  }

  const client = createGraphClient(accessToken);
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toMetaWaId(to),
    type: "text",
    text: {body},
  };

  try {
    const resp = await client.post<MetaSendResponse>(
      `/${phoneNumberId}/messages`,
      payload
    );

    if (resp.status >= 400 || resp.data.error) {
      const err = resp.data.error ?? {message: `HTTP ${resp.status}`};
      logger.warn("bot.send.text.failed", {
        requestId,
        status: resp.status,
        metaCode: err.code,
        metaMessage: err.message,
      });
      throw new Error(
        `meta_send_failed: ${err.code ?? resp.status}: ${err.message}`
      );
    }

    const metaMessageId = resp.data.messages?.[0]?.id;
    if (!metaMessageId) {
      throw new Error("meta_send_failed: no message id in response");
    }

    logger.info("bot.send.text.ok", {
      requestId,
      metaMessageId,
    });

    return {metaMessageId};
  } catch (err) {
    const described = describeAxiosError(err);
    logger.error("bot.send.text.error", {
      requestId,
      err: described,
    });
    throw err;
  }
}

// ── Templates ──────────────────────────────────────────────────────────────

export interface SendTemplateArgs {
  to: E164;
  template: MetaTemplatePayload;
  requestId: string;
  phoneNumberId: string;
  accessToken: string;
}

/**
 * Send a Meta-approved template. Used for any business-initiated message
 * (broadcasts, event reminders, content unlocks, film-developed reveal).
 * Idempotency / send-log writes happen at the dispatcher layer.
 */
export async function sendTemplate(
  args: SendTemplateArgs
): Promise<SendResult> {
  const {to, template, requestId, phoneNumberId, accessToken} = args;

  if (!phoneNumberId) {
    throw new Error("send: missing phoneNumberId");
  }
  if (!accessToken) {
    throw new Error("send: missing accessToken");
  }

  const client = createGraphClient(accessToken);
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toMetaWaId(to),
    type: "template",
    template,
  };

  try {
    const resp = await client.post<MetaSendResponse>(
      `/${phoneNumberId}/messages`,
      payload
    );

    if (resp.status >= 400 || resp.data.error) {
      const err = resp.data.error ?? {message: `HTTP ${resp.status}`};
      logger.warn("bot.send.template.failed", {
        requestId,
        status: resp.status,
        metaCode: err.code,
        metaMessage: err.message,
        templateName: template.name,
      });
      throw new Error(
        `meta_send_failed: ${err.code ?? resp.status}: ${err.message}`
      );
    }

    const metaMessageId = resp.data.messages?.[0]?.id;
    if (!metaMessageId) {
      throw new Error("meta_send_failed: no message id in response");
    }

    logger.info("bot.send.template.ok", {
      requestId,
      metaMessageId,
      templateName: template.name,
    });

    return {metaMessageId};
  } catch (err) {
    const described = describeAxiosError(err);
    logger.error("bot.send.template.error", {
      requestId,
      err: described,
      templateName: template.name,
    });
    throw err;
  }
}

// ── Read receipts + typing indicator (Imp-2 prep, used at handler call site)
//
// Marks a previously-received inbound as read and shows WhatsApp's
// "typing…" bubble. Fire-and-forget at the caller — failure is cosmetic.

export interface MarkReadWithTypingArgs {
  metaMessageId: string;
  phoneNumberId: string;
  accessToken: string;
  requestId: string;
}

export async function markReadWithTyping(
  args: MarkReadWithTypingArgs
): Promise<void> {
  const {metaMessageId, phoneNumberId, accessToken, requestId} = args;
  const client = createGraphClient(accessToken);
  const payload = {
    messaging_product: "whatsapp",
    status: "read",
    message_id: metaMessageId,
    typing_indicator: {type: "text"},
  };
  const resp = await client.post(`/${phoneNumberId}/messages`, payload);
  if (resp.status >= 400) {
    throw new Error(`mark_read_failed: HTTP ${resp.status}`);
  }
  logger.info("bot.send.typing_indicator.ok", {requestId, metaMessageId});
}
