/**
 * Bilingual string helpers. The KB and config docs carry parallel
 * `{ es, en }` objects; this module is the single read-side accessor.
 *
 * Spec: `bot/specs/02-conversation-design.md` §3.
 */

export type Language = "es" | "en";

export interface Bilingual<T = string> {
  es: T;
  en: T;
}

/** Two-letter ISO-639-1 codes we accept. */
const LANGUAGES = new Set<Language>(["es", "en"]);

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && LANGUAGES.has(value as Language);
}

/**
 * Pick the `lang` variant from a bilingual object. Falls back to ES
 * (the default per `02-conversation-design.md` §3 "Detection") if the
 * requested variant is missing — never throws.
 */
export function pick<T>(bundle: Bilingual<T>, lang: Language): T {
  return bundle[lang] ?? bundle.es;
}

/**
 * Canonical fallback copy used when the operator hasn't seeded
 * `config/bot.fallbackErrorMessage` yet. Kept tiny and on-persona
 * (Thora — `02-conversation-design.md` §9 "Claude API error").
 */
export const DEFAULT_FALLBACK_ERROR: Bilingual = {
  es:
    "Perdona, tengo un microcorte 🐾 " +
    "Inténtalo en un momento o escribe *ayuda*.",
  en:
    "Sorry — quick blip on my end 🐾 " +
    "Try again in a moment, or write *help*.",
};

/** Rate-limit notice copy (config override: `rateLimit.throttleNoticeText`). */
export const DEFAULT_RATE_LIMIT_NOTICE: Bilingual = {
  es: "Voy un poco saturada contigo, dame un momento 🐾",
  en: "I'm a bit swamped — give me a second 🐾",
};

/** Allowlist refusal (unknown phone — `02-conversation-design.md` §9, §10). */
export const ALLOWLIST_REFUSAL: Bilingual = {
  es:
    "Hmm, no te encuentro en mi lista. Si crees que es un error, " +
    "escribe a mis humanos directamente 🐾",
  en:
    "Hmm, can't find you on my list. If you think that's a mistake, " +
    "ping my humans directly 🐾",
};

/** Stop / opt-out ack (F14, `02-conversation-design.md` §4 row "Stop"). */
export const STOP_ACK: Bilingual = {
  es: "Vale, me callo. Me voy al sofá 🐾 Cualquier mensaje me reactiva.",
  en: "Okay, going quiet. Off to the sofa 🐾 Any message will wake me up.",
};

// ── Media acks (Phase 3 — `02-conversation-design.md` §4, §9) ─────────────

/** Photo received, consent granted — Sunday May 31 20:00 album reveal. */
export const PHOTO_ACK_GRANTED: Bilingual = {
  es:
    "¡Recibida! 🐾 Guardada para el álbum — se desvela el " +
    "*domingo 31 a las 20:00*. Sigue mandando.",
  en:
    "Got it! 🐾 Saved for the album — reveal is " +
    "*Sunday May 31 at 20:00*. Keep them coming.",
};

/** Photo received, consent declined — kept private. */
export const PHOTO_ACK_DECLINED: Bilingual = {
  es:
    "Recibida 🐾 Queda guardada para mis humanos. " +
    "No va al álbum compartido.",
  en:
    "Got it 🐾 Saved just for my humans. " +
    "Won't go to the shared album.",
};

/** Photo received, consent not yet on file — operator will follow up. */
export const PHOTO_ACK_PENDING: Bilingual = {
  es:
    "Recibida 🐾 Mis humanos te confirman fuera de aquí si va al " +
    "álbum compartido o no.",
  en:
    "Got it 🐾 My humans will confirm separately whether it goes " +
    "to the shared album.",
};

/** Photo received but Cloudinary upload failed (§9). */
export const PHOTO_UPLOAD_FAILED: Bilingual = {
  es:
    "Recibí tu foto pero hubo un problema guardándola, " +
    "¿me la reenvías? 🐾",
  en:
    "I got your photo but something went wrong saving it — " +
    "can you re-send? 🐾",
};

/** Voice note ack (§4, §9). */
export const AUDIO_ACK: Bilingual = {
  es: "🐾 No tengo orejas digitales — escríbemelo y te ayudo.",
  en: "🐾 I don't have digital ears — type it for me and I'll help.",
};

/** Document / PDF ack (§4, §9). */
export const DOCUMENT_ACK: Bilingual = {
  es: "🐾 Veo el documento pero no leo PDFs. ¿De qué se trata?",
  en: "🐾 I can see the document but I can't read PDFs. What's it about?",
};

/** Sticker / video ack (§4, §9). */
export const STICKER_ACK: Bilingual = {
  es: "🐾",
  en: "🐾",
};
