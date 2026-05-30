/**
 * Audience resolution for broadcasts (launch-readiness plan A1).
 *
 * Given an `AudienceSpec`, query `guests/` and return a deterministic
 * ordered list of recipients. Honors:
 *   - `botEnrolled: true` (opt-outs excluded; spec D14, F14).
 *   - `bot_optout/{guestId}` collection if it exists (defensive — a future
 *     hard opt-out channel can drop here and audience.ts will respect it
 *     without needing changes elsewhere).
 *   - Language filter (`es` | `en` | both).
 *   - RSVP-status filter (`attending` | `pending` | `declined` | any).
 *   - Explicit phone list (overrides query — used for pilot broadcasts).
 *
 * The returned list is sorted by `id` ASC so the dispatcher's idempotency
 * + pacing are stable across re-runs.
 */

import {getFirestore} from "firebase-admin/firestore";
import type {E164} from "../lib/phone.js";
import {normalizeE164} from "../lib/phone.js";
import type {Language} from "../lib/i18n.js";
import {isLanguage} from "../lib/i18n.js";

export type RsvpStatusFilter =
  | "any"
  | "attending"
  | "pending"
  | "declined"
  | "partial";

export type LanguageFilter = "es" | "en" | "both";

/** Mirrors `web/src/types/rsvp.ts` `NightOption`. */
export type NightOption = "friday" | "saturday" | "sunday";

export interface AudienceSpec {
  language?: LanguageFilter; // default "both"
  rsvpStatus?: RsvpStatusFilter; // default "any"
  /** Optional explicit phone list. When set, ALL OTHER filters are ignored
   *  except the opt-out exclusion (we still skip hard opt-outs). */
  phones?: E164[];
  /** Optional guest-id allowlist (intersect with the rest). */
  guestIds?: string[];
  /**
   * Restrict to guests whose RSVP `responses.nightsStaying` array
   * contains this night. Used by event-reminder dispatching so guests
   * who aren't in town on event day are not pinged. Guests without an
   * `rsvp_responses` doc are excluded (defensive — if they haven't
   * RSVPed for the night, don't ping them about it).
   * Ignored when `phones` is set (explicit-list mode overrides filters).
   */
  requiresNight?: NightOption;
}

export interface AudienceMember {
  guestId: string;
  phone: E164;
  /** Resolved per-recipient language (defaults to `es` if guest has none). */
  language: Language;
  firstName: string;
  fullName: string;
}

export interface ResolveResult {
  members: AudienceMember[];
  /** Reasons that members were excluded — surface in the admin UI. */
  excluded: {
    notEnrolled: number;
    hardOptOut: number;
    missingPhone: number;
    notMatched: number;
    nightMismatch: number;
    /**
     * Populated by the dispatcher (not `resolveAudience`) for templates that
     * require per-guest data lookups before send — currently only
     * `seating_unlocked`. Each entry here is a recipient who would have
     * been audience-eligible but lacks a usable `seating/{guestId}` row.
     */
    missingSeating?: number;
  };
}

/** Resolve an audience spec to a deterministic recipient list. */
export async function resolveAudience(
  spec: AudienceSpec
): Promise<ResolveResult> {
  const excluded = {
    notEnrolled: 0,
    hardOptOut: 0,
    missingPhone: 0,
    notMatched: 0,
    nightMismatch: 0,
  };

  const hardOptOuts = await loadHardOptOuts();
  // Pre-compute the set of guest ids whose RSVP says they're in town for
  // the required night, in one Firestore query instead of N per-guest
  // reads. `null` means no nights filter is active.
  const nightStayers =
    spec.requiresNight && (!spec.phones || spec.phones.length === 0) ?
      await loadGuestsStayingNight(spec.requiresNight) :
      null;

  let candidates: GuestRow[];
  if (spec.phones && spec.phones.length > 0) {
    candidates = await loadByPhones(spec.phones);
  } else {
    candidates = await loadByFilters(spec);
  }

  if (spec.guestIds && spec.guestIds.length > 0) {
    const allow = new Set(spec.guestIds);
    candidates = candidates.filter((g) => allow.has(g.id));
  }

  const members: AudienceMember[] = [];
  for (const g of candidates) {
    if (!g.phoneE164) {
      excluded.missingPhone += 1;
      continue;
    }
    if (g.botEnrolled === false) {
      excluded.notEnrolled += 1;
      continue;
    }
    if (hardOptOuts.has(g.id)) {
      excluded.hardOptOut += 1;
      continue;
    }
    // Phone-list spec doesn't apply language/RSVP/nights filters — but
    // everything else does, so re-check here to keep filter semantics
    // consistent across call paths.
    if (!spec.phones || spec.phones.length === 0) {
      if (!matchesLanguage(g.language, spec.language)) {
        excluded.notMatched += 1;
        continue;
      }
      if (!matchesRsvp(g.rsvpStatus, spec.rsvpStatus)) {
        excluded.notMatched += 1;
        continue;
      }
      if (nightStayers && !nightStayers.has(g.id)) {
        excluded.nightMismatch += 1;
        continue;
      }
    }

    let phone: E164;
    try {
      phone = normalizeE164(g.phoneE164);
    } catch {
      excluded.missingPhone += 1;
      continue;
    }
    members.push({
      guestId: g.id,
      phone,
      language: isLanguage(g.language) ? g.language : "es",
      firstName: firstNameOf(g),
      fullName: g.fullName ?? "",
    });
  }

  members.sort((a, b) => (a.guestId < b.guestId ? -1 : 1));
  return {members, excluded};
}

// ── internals ──────────────────────────────────────────────────────────────

interface GuestRow {
  id: string;
  fullName?: string;
  preferredName?: string;
  phoneE164?: string;
  language?: string;
  rsvpStatus?: string;
  botEnrolled?: boolean;
}

async function loadByFilters(spec: AudienceSpec): Promise<GuestRow[]> {
  // We deliberately do NOT push `botEnrolled == true` into the Firestore
  // query because legacy guests have no `botEnrolled` field yet (the bot
  // populates it lazily on first interaction). Filtering by missing-vs-
  // false in code is more forgiving for the launch broadcast that runs
  // before most guests have interacted.
  const snap = await getFirestore().collection("guests").get();
  const rows: GuestRow[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    rows.push({
      id: doc.id,
      fullName: data.fullName as string | undefined,
      preferredName: data.preferredName as string | undefined,
      phoneE164: data.phoneE164 as string | undefined,
      language: data.language as string | undefined,
      rsvpStatus: data.rsvpStatus as string | undefined,
      botEnrolled: data.botEnrolled as boolean | undefined,
    });
  }
  // Apply language/RSVP filters in code to mirror phone-list path.
  return rows.filter(
    (r) =>
      matchesLanguage(r.language, spec.language) &&
      matchesRsvp(r.rsvpStatus, spec.rsvpStatus)
  );
}

async function loadByPhones(phones: E164[]): Promise<GuestRow[]> {
  // Firestore `in` query caps at 30 values — chunk and merge.
  const rows: GuestRow[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < phones.length; i += 30) {
    const chunk = phones.slice(i, i + 30);
    const snap = await getFirestore()
      .collection("guests")
      .where("phoneE164", "in", chunk)
      .get();
    for (const doc of snap.docs) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      const data = doc.data();
      rows.push({
        id: doc.id,
        fullName: data.fullName as string | undefined,
        preferredName: data.preferredName as string | undefined,
        phoneE164: data.phoneE164 as string | undefined,
        language: data.language as string | undefined,
        rsvpStatus: data.rsvpStatus as string | undefined,
        botEnrolled: data.botEnrolled as boolean | undefined,
      });
    }
  }
  return rows;
}

/**
 * One Firestore query: every `rsvp_responses` doc whose
 * `responses.nightsStaying` array contains the given night. Returns the
 * set of doc ids — which match `guests.id` (data model D7: rsvp_responses
 * is keyed by Firebase Auth UID, same as the guest doc id).
 */
async function loadGuestsStayingNight(
  night: NightOption
): Promise<Set<string>> {
  const out = new Set<string>();
  try {
    const snap = await getFirestore()
      .collection("rsvp_responses")
      .where("responses.nightsStaying", "array-contains", night)
      .get();
    for (const d of snap.docs) out.add(d.id);
  } catch {
    // If the field doesn't exist or the index isn't built yet, treat as
    // "no one staying" — safer than over-pinging. Operator will notice
    // the empty audience in dry-run and can debug.
  }
  return out;
}

async function loadHardOptOuts(): Promise<Set<string>> {
  // `bot_optout` is not part of the current spec — A1 honors it if present
  // to be forward-compatible with a future hard-opt-out channel.
  const out = new Set<string>();
  try {
    const snap = await getFirestore().collection("bot_optout").get();
    for (const doc of snap.docs) out.add(doc.id);
  } catch {
    /* collection doesn't exist or permission denied — treat as empty */
  }
  return out;
}

function matchesLanguage(
  guestLang: string | undefined,
  filter: LanguageFilter | undefined
): boolean {
  if (!filter || filter === "both") return true;
  return guestLang === filter;
}

function matchesRsvp(
  guestStatus: string | undefined,
  filter: RsvpStatusFilter | undefined
): boolean {
  if (!filter || filter === "any") return true;
  return guestStatus === filter;
}

function firstNameOf(g: GuestRow): string {
  if (g.preferredName && g.preferredName.trim().length > 0) {
    return g.preferredName.trim();
  }
  const first = g.fullName?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : "";
}
