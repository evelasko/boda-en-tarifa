import * as logger from "firebase-functions/logger";
import {createGraphClient, describeAxiosError} from "./client.js";
import {toMetaWaId, type E164} from "../lib/phone.js";

/**
 * Outbound send helpers wrapping the Meta Cloud API.
 *
 * Spec: `bot/specs/08-integration-contract.md` §2.
 *
 * Phase 1: text-only. Subsequent phases add interactive, list, location,
 * image, template and Flow payloads.
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
