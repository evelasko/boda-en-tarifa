/* eslint-disable max-len */
/**
 * "Today's situation" — the dynamic per-turn KB block. Lives outside the
 * cached Block B because it changes faster than the 5-minute Anthropic
 * ephemeral cache TTL.
 *
 * Spec: `bot/specs/07-knowledge-base.md` §3.5 + §4.2.
 * Plan: `bot/docs/kb-implementation-plan.md` §4.4 (Today's situation).
 *
 * Emitted as plain text and prepended to the per-turn user message by
 * `handlers/conversation.ts`. Weather snapshots are NOT included here —
 * Claude calls `get_current_weather` on demand so we don't pay the
 * Open-Meteo round-trip on turns that don't need it.
 *
 * Time-gated unlocks (currently only seating, per D21) are derived here
 * from a hardcoded schedule rather than `time_gated_content/` since the
 * spec collapses to a single value.
 */

import type {Language} from "../lib/i18n.js";
import {
  dayOfWedding,
  formatHm,
  formatLong,
  toMadridIso,
  weekday,
} from "../lib/time.js";
import {listEvents, type BotEvent} from "../services/events.js";

const SEATING_UNLOCK_ISO = "2026-05-30T19:30:00+02:00";

export interface TodaysSituationArgs {
  now: Date;
  language: Language;
}

/**
 * Returns a multi-line string ready to be embedded in the per-turn user
 * content. Always renders, even if events list is empty — that's a
 * valid (degraded) state and Thora can still answer non-schedule
 * questions.
 */
export async function renderTodaysSituation(
  args: TodaysSituationArgs
): Promise<string> {
  const events = await listEvents();
  return renderTodaysSituationSync({...args, events});
}

/** Pure variant for testing: caller supplies the events. */
export function renderTodaysSituationSync(args: {
  now: Date;
  language: Language;
  events: BotEvent[];
}): string {
  const {now, language, events} = args;
  const dow = dayOfWedding(now);

  const lines: string[] = ["[Today's situation — dynamic, uncached]"];
  lines.push(`Now (Europe/Madrid): ${toMadridIso(now)}`);
  lines.push(`Weekday: ${weekday(now, language)}`);
  lines.push(`Day of wedding: ${dow}`);

  const {current, next, recent} = bucketEvents(events, now);

  if (current) {
    lines.push(
      `Currently happening: ${eventLabel(current, language)} ` +
      `(started ${formatHm(parseISO(current.startAt))}; ends ~` +
      `${current.endAt ? formatHm(parseISO(current.endAt)) : "?"})`
    );
  } else if (recent) {
    const minsAgo = Math.round((now.getTime() - parseISO(recent.startAt).getTime()) / 60000);
    lines.push(
      `Most recent event: ${eventLabel(recent, language)} ` +
      `(started ${minsAgo} min ago)`
    );
  } else {
    lines.push("Currently happening: nothing.");
  }

  if (next) {
    const minsTo = Math.round((parseISO(next.startAt).getTime() - now.getTime()) / 60000);
    const rel = minsTo < 60 ?
      `in ${minsTo} min` :
      `in ${Math.floor(minsTo / 60)}h ${minsTo % 60}m`;
    lines.push(
      `Next event: ${eventLabel(next, language)} — ` +
      `${formatLong(parseISO(next.startAt), language)} (${rel})`
    );
  } else if (dow === "post") {
    lines.push("Next event: the wedding is over. Brunch was the last one.");
  } else {
    lines.push("Next event: nothing on file.");
  }

  // Time-gated unlocks (seating only per D21).
  const seatingUnlock = parseISO(SEATING_UNLOCK_ISO);
  if (now.getTime() >= seatingUnlock.getTime()) {
    lines.push(
      "Time-gated reveals visible: SEATING is unlocked. " +
      "lookup_seating(guest_id) now returns the table assignment."
    );
  } else {
    const minsTo = Math.round((seatingUnlock.getTime() - now.getTime()) / 60000);
    lines.push(
      "Time-gated reveals visible: NONE. Seating is LOCKED until " +
      `${formatLong(seatingUnlock, language)} ` +
      `(${minsTo > 0 ? `in ${minsTo} min` : "any moment"}). ` +
      "Before unlock, deflect: \"Eso te lo cuento el sábado 30 a las 19:30 🐾 Suspense.\""
    );
  }

  lines.push(`Thora's mode for this hour: ${thoraModeForNow(now, dow)}`);

  return lines.join("\n");
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Tolerant ISO parse; returns epoch 0 on failure (keeps callers branch-light). */
function parseISO(s: string | undefined | null): Date {
  if (!s) return new Date(0);
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function eventLabel(e: BotEvent, language: Language): string {
  return language === "en" ? (e.nameEn || e.id) : (e.nameEs || e.id);
}

/** Within ±15 min of `now` counts as "currently happening". */
const CURRENT_WINDOW_MS = 15 * 60_000;

function bucketEvents(
  events: BotEvent[],
  now: Date
): {current: BotEvent | null; next: BotEvent | null; recent: BotEvent | null} {
  const tNow = now.getTime();
  const withT = events
    .map((e) => ({e, start: parseISO(e.startAt).getTime(), end: e.endAt ? parseISO(e.endAt).getTime() : null}))
    .sort((a, b) => a.start - b.start);

  let current: BotEvent | null = null;
  for (const x of withT) {
    if (x.end != null && tNow >= x.start - CURRENT_WINDOW_MS && tNow < x.end) {
      current = x.e;
      break;
    }
    if (x.end == null && Math.abs(tNow - x.start) <= CURRENT_WINDOW_MS) {
      current = x.e;
      break;
    }
  }

  // Next upcoming event (strictly future, not currently happening).
  const next = withT.find((x) => x.start > tNow && x.e !== current)?.e ?? null;

  // Most recent past event (within last 24h) — soft context if nothing current.
  const recent =
    withT
      .filter((x) => x.start <= tNow && tNow - x.start < 24 * 60 * 60_000 && x.e !== current)
      .pop()?.e ?? null;

  return {current, next, recent};
}

/**
 * Thora's in-character mode by hour. Pre-wedding & brunch: first-hand,
 * full personality. Reception window: "iPad-from-bedroom" — quieter,
 * fewer gags. Per `couple-dossier.md` voice rules + D17.
 */
function thoraModeForNow(now: Date, dow: ReturnType<typeof dayOfWedding>): string {
  if (dow === "sat") {
    const hourMadrid = parseInt(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Madrid",
        hour: "2-digit",
        hour12: false,
      }).format(now),
      10
    );
    if (hourMadrid >= 19 && hourMadrid <= 23) {
      return "iPad-from-bedroom (cocktail → dinner window): a touch quieter, " +
        "fewer gags, still warm. Thora was sent to the room but the wifi reaches.";
    }
    if (hourMadrid >= 0 && hourMadrid <= 5) {
      return "iPad-from-bedroom (party): quietest mode, sleepy. Short replies, " +
        "warm, no party-pooper energy.";
    }
  }
  if (dow === "sun") {
    return "post-party brunch: hungry again, perky, food-obsessed.";
  }
  return "default Thora: warm, playful, food-obsessed, ~1-in-3 dog tics.";
}
