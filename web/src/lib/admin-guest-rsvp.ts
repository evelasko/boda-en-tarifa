import type { DocumentData } from 'firebase-admin/firestore';
import type { AttendanceStatus } from '@/types/rsvp';

export type GuestRsvpLookup = {
  /** RSVP doc id (Firebase Auth UID) → attendance */
  byRsvpDocId: Map<string, AttendanceStatus>;
  /** Normalized RSVP userEmail → attendance (when doc id ≠ guest id) */
  byResponderEmail: Map<string, AttendanceStatus>;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function timestampMs(value: unknown): number {
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function rsvpRecencyMs(data: DocumentData): number {
  return Math.max(timestampMs(data.lastUpdatedAt), timestampMs(data.submittedAt));
}

/**
 * Build lookup maps from `rsvp_responses` documents.
 * RSVP docs are keyed by Auth UID; guest docs often use unrelated Firestore IDs
 * (sheet sync, CSV). We match by doc id first, then by normalized `userEmail`.
 */
export function buildGuestRsvpLookup(rsvpDocs: Array<{ id: string; data: () => DocumentData }>): GuestRsvpLookup {
  const byRsvpDocId = new Map<string, AttendanceStatus>();
  const byResponderEmail = new Map<
    string,
    { attendance: AttendanceStatus; recency: number }
  >();

  for (const doc of rsvpDocs) {
    const data = doc.data();
    const attendance = data.responses?.attendance as AttendanceStatus | undefined;
    if (!attendance) continue;

    byRsvpDocId.set(doc.id, attendance);

    const emailRaw = data.userEmail;
    if (typeof emailRaw !== 'string' || !emailRaw.trim()) continue;

    const email = normalizeEmail(emailRaw);
    const recency = rsvpRecencyMs(data);
    const prev = byResponderEmail.get(email);
    if (!prev || recency >= prev.recency) {
      byResponderEmail.set(email, { attendance, recency });
    }
  }

  const emailFlat = new Map<string, AttendanceStatus>();
  for (const [email, { attendance }] of byResponderEmail) {
    emailFlat.set(email, attendance);
  }

  return { byRsvpDocId, byResponderEmail: emailFlat };
}

export function resolveGuestRsvpStatus(
  guestUid: string,
  guestEmail: string,
  lookup: GuestRsvpLookup
): AttendanceStatus | 'no_response' {
  const byId = lookup.byRsvpDocId.get(guestUid);
  if (byId) return byId;

  const em = normalizeEmail(guestEmail);
  if (em) {
    const byEmail = lookup.byResponderEmail.get(em);
    if (byEmail) return byEmail;
  }

  return 'no_response';
}
