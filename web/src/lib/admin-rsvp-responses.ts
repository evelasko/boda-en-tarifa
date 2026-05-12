import 'server-only';

import type { DocumentData } from 'firebase-admin/firestore';
import type { AttendanceStatus, RsvpGuestLinkSource } from '@/types/rsvp';
import type {
  AdminRsvpGuestSummary,
  AdminRsvpLinkBucket,
  AdminRsvpResponseRow,
} from '@/types/admin-rsvp-response';
import { normalizeGuestEmailForMatch } from '@/lib/admin-guest-rsvp';

export type { AdminRsvpGuestSummary, AdminRsvpLinkBucket, AdminRsvpResponseRow };

function isoFromFirestore(value: unknown): string | null {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

/**
 * Map normalized guest email → guest uids (sheet may duplicate emails; then there is no unique match).
 */
export function buildNormalizedEmailToGuestUids(
  guests: Array<{ id: string; email: string }>
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const g of guests) {
    const key = normalizeGuestEmailForMatch(g.email);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(g.id);
    map.set(key, list);
  }
  return map;
}

export function classifyRsvpLinkBucket(
  linkedGuestUid: string | null,
  normalizedRsvpEmail: string,
  emailToGuestUids: Map<string, string[]>
): AdminRsvpLinkBucket {
  if (linkedGuestUid) return 'linked';
  if (!normalizedRsvpEmail) return 'needs_review';
  const uids = emailToGuestUids.get(normalizedRsvpEmail);
  if (uids && uids.length === 1) return 'auto_match';
  return 'needs_review';
}

export function buildAdminRsvpRows(
  rsvpDocs: Array<{ id: string; data: () => DocumentData }>,
  guestSummariesByUid: Map<string, AdminRsvpGuestSummary>,
  emailToGuestUids: Map<string, string[]>
): AdminRsvpResponseRow[] {
  const rows: AdminRsvpResponseRow[] = [];

  for (const doc of rsvpDocs) {
    const data = doc.data();
    const userEmail = typeof data.userEmail === 'string' ? data.userEmail : '';
    const normalizedEmail = userEmail.trim() ? normalizeGuestEmailForMatch(userEmail) : '';

    const linkedRaw = data.linkedGuestUid;
    const linkedGuestUid =
      typeof linkedRaw === 'string' && linkedRaw.trim() ? linkedRaw.trim() : null;

    const linkSourceRaw = data.linkSource;
    const linkSource: RsvpGuestLinkSource | null =
      linkSourceRaw === 'manual' || linkSourceRaw === 'auto_email' ? linkSourceRaw : null;

    const linkNotes = typeof data.linkNotes === 'string' ? data.linkNotes : null;

    const responses = data.responses as Record<string, unknown> | undefined;
    const attendance = (responses?.attendance as AttendanceStatus | undefined) ?? null;

    const displayNameFromForm =
      typeof responses?.displayName === 'string' ? responses.displayName.trim() : '';
    const userDisplayName =
      typeof data.userDisplayName === 'string' ? data.userDisplayName.trim() : '';
    const displayName = displayNameFromForm || userDisplayName || '—';

    const linkStatus = classifyRsvpLinkBucket(linkedGuestUid, normalizedEmail, emailToGuestUids);

    let suggestedGuest: AdminRsvpGuestSummary | null = null;
    if (linkStatus === 'auto_match' && normalizedEmail) {
      const uids = emailToGuestUids.get(normalizedEmail);
      const uid = uids?.[0];
      if (uid) suggestedGuest = guestSummariesByUid.get(uid) ?? null;
    }

    let linkedGuest: AdminRsvpGuestSummary | null = null;
    if (linkedGuestUid) {
      linkedGuest = guestSummariesByUid.get(linkedGuestUid) ?? {
        uid: linkedGuestUid,
        fullName: '(invitado no encontrado)',
        email: '',
      };
    }

    rows.push({
      rsvpUid: doc.id,
      userEmail,
      displayName,
      attendance,
      isSubmitted: data.isSubmitted === true,
      lastUpdatedAt: isoFromFirestore(data.lastUpdatedAt) ?? new Date(0).toISOString(),
      submittedAt: isoFromFirestore(data.submittedAt),
      linkStatus,
      linkedGuestUid,
      linkSource,
      linkNotes,
      suggestedGuest,
      linkedGuest,
    });
  }

  rows.sort((a, b) => (a.lastUpdatedAt < b.lastUpdatedAt ? 1 : -1));
  return rows;
}

export function filterAdminRsvpRows(
  rows: AdminRsvpResponseRow[],
  status: AdminRsvpLinkBucket | 'all' | null,
  search: string | null
): AdminRsvpResponseRow[] {
  let out = rows;
  if (status && status !== 'all') {
    out = out.filter((r) => r.linkStatus === status);
  }
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter((r) => {
      if (r.rsvpUid.toLowerCase().includes(q)) return true;
      if (r.userEmail.toLowerCase().includes(q)) return true;
      if (r.displayName.toLowerCase().includes(q)) return true;
      if (r.linkedGuest?.fullName.toLowerCase().includes(q)) return true;
      if (r.linkedGuest?.email.toLowerCase().includes(q)) return true;
      if (r.suggestedGuest?.fullName.toLowerCase().includes(q)) return true;
      if (r.suggestedGuest?.email.toLowerCase().includes(q)) return true;
      return false;
    });
  }
  return out;
}
