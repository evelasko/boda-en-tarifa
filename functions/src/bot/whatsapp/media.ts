/**
 * Meta WhatsApp Cloud API — media fetch helpers.
 *
 * Spec: `bot/specs/08-integration-contract.md` §6 (Cloudinary, which is
 *       fed from this download), Meta docs for `/{media_id}` endpoint.
 *
 * Two-step download: `GET /{media_id}` returns a short-lived signed URL;
 * a second `GET <url>` actually retrieves the bytes. Both requests carry
 * the bearer token even though the second one is to a different domain
 * — Meta still validates the caller.
 *
 * Media URLs from step 1 expire quickly (~5 minutes) so callers must
 * fetch immediately. We never persist the URL.
 */

import * as logger from "firebase-functions/logger";
import {z} from "zod";
import {META_GRAPH_API_BASE} from "../lib/config.js";
import {validate} from "../lib/validation.js";

const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;

const MediaInfoSchema = z.object({
  url: z.string(),
  mime_type: z.string().optional(),
  sha256: z.string().optional(),
  file_size: z.number().optional(),
  id: z.string().optional(),
});

export interface DownloadedMedia {
  buffer: Buffer;
  mimeType: string;
  bytes: number;
}

export async function downloadMedia(args: {
  mediaId: string;
  accessToken: string;
  requestId?: string;
}): Promise<DownloadedMedia> {
  const {mediaId, accessToken, requestId} = args;
  if (!mediaId) throw new Error("media: missing mediaId");
  if (!accessToken) throw new Error("media: missing accessToken");

  const infoResp = await fetch(`${META_GRAPH_API_BASE}/${mediaId}`, {
    method: "GET",
    headers: {"Authorization": `Bearer ${accessToken}`},
  });
  if (!infoResp.ok) {
    const bodyText = await infoResp.text().catch(() => "");
    logger.warn("bot.media.info_failed", {
      requestId,
      mediaId,
      status: infoResp.status,
      bodyPreview: bodyText.slice(0, 200),
    });
    throw new Error(`media_info_failed: HTTP ${infoResp.status}`);
  }
  const infoJson = await infoResp.json();
  const info = validate(MediaInfoSchema, infoJson, "meta_media_info");

  if (typeof info.file_size === "number" &&
    info.file_size > MAX_DOWNLOAD_BYTES) {
    throw new Error(`media_too_large: ${info.file_size} bytes`);
  }

  const binResp = await fetch(info.url, {
    method: "GET",
    headers: {"Authorization": `Bearer ${accessToken}`},
  });
  if (!binResp.ok) {
    logger.warn("bot.media.download_failed", {
      requestId,
      mediaId,
      status: binResp.status,
    });
    throw new Error(`media_download_failed: HTTP ${binResp.status}`);
  }
  const ab = await binResp.arrayBuffer();
  if (ab.byteLength > MAX_DOWNLOAD_BYTES) {
    throw new Error(`media_too_large: ${ab.byteLength} bytes`);
  }
  const buffer = Buffer.from(ab);
  const mimeType = info.mime_type ??
    binResp.headers.get("content-type") ?? "application/octet-stream";

  logger.info("bot.media.downloaded", {
    requestId,
    mediaId,
    bytes: buffer.length,
    mimeType,
  });

  return {buffer, mimeType, bytes: buffer.length};
}
