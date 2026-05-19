/**
 * Guest profile reads + bot-specific field upserts.
 *
 * Spec: `bot/specs/04-data-model.md` §1 (`guests/{phoneNumber}` extension).
 *
 * Keying decision (deviates from the spec — captured in conversation
 * notes 2026-05-19):
 *   - The existing `guests` collection is keyed by Firebase Auth UID
 *     and predates the bot. We do NOT rekey.
 *   - The bot reaches a guest via the existing `phoneE164` field with
 *     a `where('phoneE164', '==', phone).limit(1)` query.
 *   - `Guest.id` resolves to the uid (doc id). Cross-collection
 *     references that say "guestId" mean the uid.
 *   - Phone-keyed bot collections (`bot_conversations/{phone}`,
 *     `bot_dedupe/{messageId}`, `bot_rate/{phone}_{bucket}`) remain
 *     phone-keyed — they're messaging artifacts and only exist for
 *     phone-having guests.
 *
 * Name handling:
 *   - Storage uses `fullName` (existing). Optional new field
 *     `preferredName` lets the operator override when a naïve
 *     "first word of fullName" would be wrong (compound surnames,
 *     "María José" etc.).
 *   - `displayName(g)` is the bot's name resolver:
 *       g.preferredName  ??  g.fullName.split(/\s+/)[0]
 */

import {getFirestore, Timestamp, FieldValue} from "firebase-admin/firestore";
import type {E164} from "../lib/phone.js";
import {CSW_WINDOW_MS} from "../lib/config.js";
import {isLanguage, type Language} from "../lib/i18n.js";

export interface Guest {
  /** Firestore doc id = Firebase Auth UID. */
  id: string;
  fullName: string;
  preferredName?: string;
  email?: string;
  /** Maps to the Firestore field `phoneE164`. */
  phone?: E164;
  language?: Language;
  invitedTo?: string[];
  rsvpStatus?: "pending" | "attending" | "declined" | "partial";
  rsvpId?: string;
  directoryVisible?: boolean;
  photoConsent?: boolean;

  // Bot-managed fields (lazily added — `04-data-model.md` §6 migration).
  botEnrolled?: boolean;
  botFirstSeenAt?: Timestamp;
  botLastSeenAt?: Timestamp;
  botCsmWindowExpiresAt?: Timestamp;
  botOnboardedAt?: Timestamp;
  botOnboardingResponded?: boolean;
  logistics?: {
    arrivalDate?: string;
    arrivalAirport?: "GIB" | "AGP" | "JTR" | "OTHER";
    arrivalNotes?: string;
    needsTransport?: boolean;
    accessibilityNotes?: string;
    departureDate?: string;
  };
}

const COLLECTION = "guests";

/**
 * Lookup a guest by E.164 phone. Returns `null` if no guest doc carries
 * that `phoneE164`. Defensive: if multiple match (two guests sharing a
 * phone) we take the first deterministic one — operator should de-dup.
 */
export async function getGuestByPhone(phone: E164): Promise<Guest | null> {
  const snap = await getFirestore()
    .collection(COLLECTION)
    .where("phoneE164", "==", phone)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return fromDoc(doc.id, doc.data());
}

/** Convenience for hot paths that already know the uid (e.g. tools). */
export async function getGuestById(uid: string): Promise<Guest | null> {
  const snap = await getFirestore().collection(COLLECTION).doc(uid).get();
  if (!snap.exists) return null;
  return fromDoc(snap.id, snap.data() ?? {});
}

/**
 * Resolve the user-facing name. The bot greets / addresses with this,
 * never with `fullName` (too formal for Thora's voice).
 *
 *   1. operator-set `preferredName`
 *   2. first whitespace-delimited token of `fullName`
 *   3. fallback "amig@" / "friend" — extremely unlikely (would mean
 *      both fields are blank, which the operator should fix)
 */
export function displayName(guest: Pick<Guest, "preferredName" | "fullName">): string {
  if (guest.preferredName && guest.preferredName.trim().length > 0) {
    return guest.preferredName.trim();
  }
  const first = guest.fullName?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : "amig@";
}

/**
 * Bump the guest's CSW window + last-seen on any inbound message, and
 * lazily seed `botFirstSeenAt` / `botEnrolled` on the very first turn.
 *
 * Takes the resolved `Guest` rather than a phone so we avoid a second
 * read in the hot path and so `botFirstSeenAt` is set only when the
 * caller can confirm it was previously unset.
 *
 * Per `02-conversation-design.md` §4, opt-out is sticky in voice
 * ("Vale, me callo") but soft in state — any new inbound re-flips
 * `botEnrolled` to true, matching "Cualquier mensaje me reactiva."
 *
 * @returns the persisted Date used for `botCsmWindowExpiresAt`, so the
 *   caller can mirror it onto the `bot_conversations` root in one tick.
 */
export async function touchGuestOnInbound(guest: Guest): Promise<Date> {
  const cswExpiresAt = new Date(Date.now() + CSW_WINDOW_MS);
  const payload: Record<string, unknown> = {
    botLastSeenAt: FieldValue.serverTimestamp(),
    botCsmWindowExpiresAt: Timestamp.fromDate(cswExpiresAt),
    botEnrolled: true,
  };
  if (!guest.botFirstSeenAt) {
    payload.botFirstSeenAt = FieldValue.serverTimestamp();
  }
  await getFirestore().collection(COLLECTION).doc(guest.id).update(payload);
  return cswExpiresAt;
}

/** Persist a detected / switched language. Debounce upstream in the handler. */
export async function setLanguage(guestId: string, lang: Language): Promise<void> {
  await getFirestore().collection(COLLECTION).doc(guestId).update({language: lang});
}

/**
 * F14 stop / opt-out — `botEnrolled = false`. Future inbound still
 * routes (allowlist passes) and `touchGuestOnInbound` re-flips this to
 * true, matching the spec's "any message reactivates me" rule.
 */
export async function setEnrolled(guestId: string, enrolled: boolean): Promise<void> {
  await getFirestore().collection(COLLECTION).doc(guestId).update({botEnrolled: enrolled});
}

// ── Internal ──────────────────────────────────────────────────────────────

/** Map a raw Firestore doc into the bot's `Guest` shape. Tolerates
 *  missing optional fields and validates the `language` enum. */
function fromDoc(id: string, data: FirebaseFirestore.DocumentData): Guest {
  const phoneRaw = (data.phoneE164 as string | undefined) ?? undefined;
  return {
    id,
    fullName: (data.fullName as string | undefined) ?? "",
    preferredName: data.preferredName as string | undefined,
    email: data.email as string | undefined,
    phone: phoneRaw as E164 | undefined,
    language: isLanguage(data.language) ? data.language : undefined,
    invitedTo: data.invitedTo as string[] | undefined,
    rsvpStatus: data.rsvpStatus as Guest["rsvpStatus"],
    rsvpId: data.rsvpId as string | undefined,
    directoryVisible: data.directoryVisible as boolean | undefined,
    photoConsent: data.photoConsent as boolean | undefined,

    botEnrolled: data.botEnrolled as boolean | undefined,
    botFirstSeenAt: data.botFirstSeenAt as Timestamp | undefined,
    botLastSeenAt: data.botLastSeenAt as Timestamp | undefined,
    botCsmWindowExpiresAt: data.botCsmWindowExpiresAt as Timestamp | undefined,
    botOnboardedAt: data.botOnboardedAt as Timestamp | undefined,
    botOnboardingResponded: data.botOnboardingResponded as boolean | undefined,
    logistics: data.logistics as Guest["logistics"],
  };
}
