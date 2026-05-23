import {defineSecret, defineString} from "firebase-functions/params";

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
export const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

// ── Sentry (Phase C5 — error tracking + handler-level capture) ────────────
export const SENTRY_DSN = defineSecret("SENTRY_DSN");

// ── Cloudinary (unsigned upload preset per `08-integration-contract.md` §6)
/** Public config — set in `functions/.env`, not Secret Manager. */
export const CLOUDINARY_CLOUD_NAME = defineString("CLOUDINARY_CLOUD_NAME");
export const CLOUDINARY_UPLOAD_PRESET = defineSecret(
  "CLOUDINARY_UPLOAD_PRESET"
);

/**
 * Webhook secrets — bound to the inbound function. Phase 2 added the
 * Anthropic key. Phase 3 adds Cloudinary (Task 3 — media handler).
 *
 * Cloudinary uses an unsigned upload preset, so only the cloud name and
 * preset are needed at runtime; no API secret is bound here.
 */
export const WEBHOOK_SECRETS = [
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_APP_SECRET,
  WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  ANTHROPIC_API_KEY,
  CLOUDINARY_UPLOAD_PRESET,
  SENTRY_DSN,
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

/** TTL for `bot_rate` 5-minute buckets — bucket end + 1h. */
export const RATE_BUCKET_TTL_MS = 65 * 60 * 1000;

/** Anthropic model IDs. */
export const CLAUDE_SONNET_MODEL = "claude-sonnet-4-6";
export const CLAUDE_HAIKU_MODEL = "claude-haiku-4-5-20251001";

/** Display timezone for all wall-clock formatting. */
export const WEDDING_TIMEZONE = "Europe/Madrid";

/**
 * Conversation defaults — mirrored in `config/bot.history` /
 * `config/bot.rateLimit`. Used when the Firestore config doc has not
 * been seeded yet (`scripts/seed-bot-config.ts`, Phase 6).
 */
export const DEFAULT_HISTORY_TURNS = 8;
export const DEFAULT_RATE_LIMIT_PER_5MIN = 30;
export const DEFAULT_MAX_TOOL_ITERATIONS = 5;
export const DEFAULT_CLAUDE_MAX_TOKENS = 1024;

/** 24h Meta customer-service window in ms. */
export const CSW_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Phase 1 hardcoded reply (replaced by Claude in Phase 2). */
export const PHASE1_PLACEHOLDER_REPLY =
  "Hola, te leo. (estoy en construcción)";
