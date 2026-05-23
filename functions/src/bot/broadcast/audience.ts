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

export interface AudienceSpec {
  language?: LanguageFilter; // default "both"
  rsvpStatus?: RsvpStatusFilter; // default "any"
  /** Optional explicit phone list. When set, ALL OTHER filters are ignored
   *  except the opt-out exclusion (we still skip hard opt-outs). */
  phones?: E164[];
  /** Optional guest-id allowlist (intersect with the rest). */
  guestIds?: string[];
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
  };

  const hardOptOuts = await loadHardOptOuts();

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
    // Phone-list spec doesn't apply language/RSVP filters — but everything
    // else does, so re-check here to keep filter semantics consistent across
    // call paths.
    if (!spec.phones || spec.phones.length === 0) {
      if (!matchesLanguage(g.language, spec.language)) {
        excluded.notMatched += 1;
        continue;
      }
      if (!matchesRsvp(g.rsvpStatus, spec.rsvpStatus)) {
        excluded.notMatched += 1;
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
