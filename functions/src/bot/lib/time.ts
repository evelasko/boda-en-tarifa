/**
 * Time helpers, all anchored on `Europe/Madrid` (`WEDDING_TIMEZONE`).
 *
 * Spec: `bot/specs/04-data-model.md` §5 (wall-clock formatting),
 *       `bot/specs/07-knowledge-base.md` §3.5 ("Today's situation").
 *
 * Implementation note: we use `Intl.DateTimeFormat` rather than pulling
 * in date-fns / luxon — Node 24 ships full ICU and that's enough for
 * formatting + bucket arithmetic. If we later need DST-aware date math
 * (subtracting calendar months, etc.) we revisit.
 */

import {Timestamp} from "firebase-admin/firestore";
import {WEDDING_TIMEZONE} from "./config.js";
import type {Language} from "./i18n.js";

export type DayOfWedding = "pre" | "fri" | "sat" | "sun" | "post";

const WEDDING_FRI_ISO = "2026-05-29";
const WEDDING_SAT_ISO = "2026-05-30";
const WEDDING_SUN_ISO = "2026-05-31";

/** Current Date — abstracted for tests. */
export function now(): Date {
  return new Date();
}

/** Date → ISO string in Europe/Madrid (`YYYY-MM-DDTHH:mm:ss±HH:mm`). */
export function toMadridIso(d: Date = now()): string {
  // sv-SE locale renders `YYYY-MM-DD HH:mm:ss`; we splice in the T and
  // append the offset Madrid uses on the given instant.
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: WEDDING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
  const [date, clock] = parts.split(" ");
  return `${date}T${clock}${madridOffset(d)}`;
}

/** YYYY-MM-DD in Madrid TZ. */
export function toMadridDateIso(d: Date = now()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: WEDDING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Map an instant to its wedding-day bucket. `pre` = before Fri,
 * `post` = after Sun. Used by `Today's situation` + photo tagging.
 */
export function dayOfWedding(d: Date = now()): DayOfWedding {
  const iso = toMadridDateIso(d);
  if (iso < WEDDING_FRI_ISO) return "pre";
  if (iso === WEDDING_FRI_ISO) return "fri";
  if (iso === WEDDING_SAT_ISO) return "sat";
  if (iso === WEDDING_SUN_ISO) return "sun";
  return "post";
}

/** Weekday name in the user's language (Madrid TZ). */
export function weekday(d: Date, lang: Language): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "es-ES", {
    timeZone: WEDDING_TIMEZONE,
    weekday: "long",
  }).format(d);
}

/**
 * Full date-time formatting per the voice rules
 * ("sábado 30 de mayo a las 18:00" / "Saturday May 30 at 18:00").
 * Spec: `02-conversation-design.md` §2 "Dos".
 */
export function formatLong(d: Date, lang: Language): string {
  const dateFmt = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "es-ES", {
    timeZone: WEDDING_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeFmt = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "es-ES", {
    timeZone: WEDDING_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return lang === "en" ?
    `${dateFmt.format(d)} at ${timeFmt.format(d)}` :
    `${dateFmt.format(d)} a las ${timeFmt.format(d)}`;
}

/** HH:mm in Madrid TZ. */
export function formatHm(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: WEDDING_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** 5-min rate-limit bucket per `04-data-model.md` §2 `bot_rate`. */
export function rateBucket(d: Date = now()): number {
  return Math.floor(d.getTime() / 300_000);
}

/** Firestore `Timestamp` from epoch ms. */
export function tsFromMs(ms: number): Timestamp {
  return Timestamp.fromMillis(ms);
}

/** Madrid UTC offset string (`+02:00` / `+01:00`) for a given instant. */
function madridOffset(d: Date): string {
  // Re-format with `longOffset` and pull just the offset suffix.
  const text = new Intl.DateTimeFormat("en-GB", {
    timeZone: WEDDING_TIMEZONE,
    timeZoneName: "longOffset",
  }).format(d);
  const m = text.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);
  if (!m) return "+00:00";
  const hh = m[1].padStart(3, m[1].startsWith("-") ? "-0" : "+0");
  const mm = m[2] ?? "00";
  return `${hh}:${mm}`;
}
