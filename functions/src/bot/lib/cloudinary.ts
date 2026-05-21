/**
 * Cloudinary unsigned-upload REST client.
 *
 * Spec: `bot/specs/08-integration-contract.md` §6.
 *
 * Uses an unsigned upload preset (`wedding_photos_pending` per spec, but
 * the actual name is supplied by config so the operator can rename
 * without redeploying code). No API secret is needed for unsigned
 * uploads — the preset's permissions are configured Cloudinary-side.
 */

import * as logger from "firebase-functions/logger";
import {z} from "zod";
import {validate} from "./validation.js";

const ENDPOINT_BASE = "https://api.cloudinary.com/v1_1";

const CloudinaryUploadResponseSchema = z.object({
  public_id: z.string(),
  secure_url: z.string(),
  url: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  format: z.string().optional(),
  bytes: z.number().optional(),
});

export type CloudinaryUploadResponse = z.infer<
  typeof CloudinaryUploadResponseSchema
>;

export interface UploadArgs {
  cloudName: string;
  uploadPreset: string;
  buffer: Buffer;
  filename?: string;
  contentType?: string;
  tags?: string[];
  /** Forwarded into logs only — never logged for content. */
  requestId?: string;
}

export async function uploadBuffer(
  args: UploadArgs
): Promise<CloudinaryUploadResponse> {
  if (!args.cloudName || !args.uploadPreset) {
    throw new Error("cloudinary: missing cloudName or uploadPreset");
  }

  const url = `${ENDPOINT_BASE}/${args.cloudName}/auto/upload`;
  const form = new FormData();
  const blob = new Blob([new Uint8Array(args.buffer)], {
    type: args.contentType ?? "application/octet-stream",
  });
  form.append("file", blob, args.filename ?? "upload.bin");
  form.append("upload_preset", args.uploadPreset);
  if (args.tags && args.tags.length > 0) {
    form.append("tags", args.tags.join(","));
  }

  const resp = await fetch(url, {method: "POST", body: form});
  if (!resp.ok) {
    const bodyText = await resp.text().catch(() => "");
    logger.warn("bot.cloudinary.upload_failed", {
      requestId: args.requestId,
      status: resp.status,
      bodyPreview: bodyText.slice(0, 200),
    });
    throw new Error(`cloudinary_upload_failed: HTTP ${resp.status}`);
  }

  const json = await resp.json();
  const parsed = validate(
    CloudinaryUploadResponseSchema,
    json,
    "cloudinary_upload_response"
  );
  logger.info("bot.cloudinary.uploaded", {
    requestId: args.requestId,
    publicId: parsed.public_id,
    bytes: parsed.bytes,
    width: parsed.width,
    height: parsed.height,
    format: parsed.format,
  });
  return parsed;
}
