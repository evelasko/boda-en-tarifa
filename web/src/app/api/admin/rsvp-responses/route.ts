import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import {
  buildAdminRsvpRows,
  buildNormalizedEmailToGuestUids,
  filterAdminRsvpRows,
  type AdminRsvpLinkBucket,
} from '@/lib/admin-rsvp-responses';

const GUESTS_COLLECTION = 'guests';
const RSVP_COLLECTION = 'rsvp_responses';

const STATUS_VALUES: Array<AdminRsvpLinkBucket | 'all'> = [
  'linked',
  'auto_match',
  'needs_review',
  'all',
];

function parseStatus(raw: string | null): AdminRsvpLinkBucket | 'all' {
  if (raw && STATUS_VALUES.includes(raw as AdminRsvpLinkBucket | 'all')) {
    return raw as AdminRsvpLinkBucket | 'all';
  }
  return 'all';
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = parseStatus(searchParams.get('status'));
    const search = searchParams.get('search');

    const [guestsSnap, rsvpSnap] = await Promise.all([
      adminFirestore.collection(GUESTS_COLLECTION).get(),
      adminFirestore.collection(RSVP_COLLECTION).get(),
    ]);

    const guestSummariesByUid = new Map<
      string,
      { uid: string; fullName: string; email: string }
    >();
    const guestEmailRows: Array<{ id: string; email: string }> = [];

    for (const d of guestsSnap.docs) {
      const raw = d.data();
      const email = typeof raw.email === 'string' ? raw.email : '';
      const fullName = typeof raw.fullName === 'string' ? raw.fullName : '';
      guestSummariesByUid.set(d.id, { uid: d.id, fullName, email });
      guestEmailRows.push({ id: d.id, email });
    }

    const emailToGuestUids = buildNormalizedEmailToGuestUids(guestEmailRows);
    const rows = buildAdminRsvpRows(rsvpSnap.docs, guestSummariesByUid, emailToGuestUids);
    const filtered = filterAdminRsvpRows(rows, status, search);

    return NextResponse.json({
      rows: filtered,
      counts: {
        all: rows.length,
        linked: rows.filter((r) => r.linkStatus === 'linked').length,
        auto_match: rows.filter((r) => r.linkStatus === 'auto_match').length,
        needs_review: rows.filter((r) => r.linkStatus === 'needs_review').length,
      },
    });
  } catch (error) {
    console.error('Error fetching RSVP responses for admin:', error);
    return NextResponse.json(
      { error: 'Error al cargar las respuestas RSVP' },
      { status: 500 }
    );
  }
}
