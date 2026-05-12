import {defineSecret} from "firebase-functions/params";

/**
 * Centralized declarations of bot-related secrets and config constants.
 *
 * Secrets are bound to functions via `secrets: [...]` in the function
 * definition. Read with `.value()` at call-time, never at module load.
 *
 * Spec: `bot/specs/03-architecture.md` §7,
 *       `bot/specs/09-security-privacy.md` §3.
 */

// ── Meta WhatsApp Cloud API ────────────────────────────────────────────────
export const WHATSAPP_ACCESS_TOKEN = defineSecret("WHATSAPP_ACCESS_TOKEN");
export const WHATSAPP_APP_SECRET = defineSecret("WHATSAPP_APP_SECRET");
export const WHATSAPP_VERIFY_TOKEN = defineSecret("WHATSAPP_VERIFY_TOKEN");
export const WHATSAPP_PHONE_NUMBER_ID = defineSecret(
  "WHATSAPP_PHONE_NUMBER_ID"
);
export const WHATSAPP_BUSINESS_ACCOUNT_ID = defineSecret(
  "WHATSAPP_BUSINESS_ACCOUNT_ID"
);

/**
 * Subset of secrets needed by the inbound webhook scaffold (Phase 1).
 * Other secrets are bound by handlers as they come online.
 */
export const WEBHOOK_SECRETS = [
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_APP_SECRET,
  WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
];

// ── Constants ──────────────────────────────────────────────────────────────

/** All bot Cloud Functions deploy here. */
export const BOT_REGION = "europe-west1";

/** Pinned Meta Graph API version. Update annually. */
export const META_GRAPH_API_VERSION = "v22.0";

/** Meta Graph API base URL. */
export const META_GRAPH_API_BASE = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

/** TTL for `bot_dedupe` entries (matches Meta's retry window with margin). */
export const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;

/** Phase 1 hardcoded reply (replaced by Claude in Phase 2). */
export const PHASE1_PLACEHOLDER_REPLY =
  "Hola, te leo. (estoy en construcción)";
