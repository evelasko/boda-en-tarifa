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
