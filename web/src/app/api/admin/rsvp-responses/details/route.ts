import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-api-auth';
import {
  buildAdminRsvpDetailRows,
  buildNormalizedEmailToGuestUids,
  filterAdminRsvpDetailRows,
} from '@/lib/admin-rsvp-detail';
import type { AttendanceStatus, RsvpSubmissionSource } from '@/types/rsvp';
import type { AdminRsvpLinkBucket } from '@/types/admin-rsvp-response';

const GUESTS_COLLECTION = 'guests';
const RSVP_COLLECTION = 'rsvp_responses';

const ATTENDANCE_VALUES: Array<AttendanceStatus | 'all'> = ['yes', 'no', 'maybe', 'all'];
const SUBMITTED_VALUES = ['true', 'false', 'all'] as const;
const LINK_STATUS_VALUES: Array<AdminRsvpLinkBucket | 'all'> = [
  'linked',
  'auto_match',
  'needs_review',
  'all',
];
const SOURCE_VALUES: Array<RsvpSubmissionSource | 'all'> = [
  'web',
  'whatsapp',
  'manual',
  'all',
];

function parseAttendance(raw: string | null): AttendanceStatus | 'all' {
  if (raw && ATTENDANCE_VALUES.includes(raw as AttendanceStatus | 'all')) {
    return raw as AttendanceStatus | 'all';
  }
  return 'all';
}

function parseSubmitted(raw: string | null): 'true' | 'false' | 'all' {
  if (raw && SUBMITTED_VALUES.includes(raw as (typeof SUBMITTED_VALUES)[number])) {
    return raw as 'true' | 'false' | 'all';
  }
  return 'all';
}

function parseLinkStatus(raw: string | null): AdminRsvpLinkBucket | 'all' {
  if (raw && LINK_STATUS_VALUES.includes(raw as AdminRsvpLinkBucket | 'all')) {
    return raw as AdminRsvpLinkBucket | 'all';
  }
  return 'all';
}

function parseSource(raw: string | null): RsvpSubmissionSource | 'all' {
  if (raw && SOURCE_VALUES.includes(raw as RsvpSubmissionSource | 'all')) {
    return raw as RsvpSubmissionSource | 'all';
  }
  return 'all';
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const attendance = parseAttendance(searchParams.get('attendance'));
    const isSubmitted = parseSubmitted(searchParams.get('isSubmitted'));
    const linkStatus = parseLinkStatus(searchParams.get('linkStatus'));
    const source = parseSource(searchParams.get('source'));
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
    const allRows = buildAdminRsvpDetailRows(
      rsvpSnap.docs,
      guestSummariesByUid,
      emailToGuestUids
    );

    const rows = filterAdminRsvpDetailRows(allRows, {
      attendance,
      isSubmitted,
      linkStatus,
      source,
      search,
    });

    return NextResponse.json({
      rows,
      counts: {
        all: allRows.length,
        submitted: allRows.filter((r) => r.isSubmitted).length,
        draft: allRows.filter((r) => !r.isSubmitted).length,
        linked: allRows.filter((r) => r.linkStatus === 'linked').length,
      },
    });
  } catch (error) {
    console.error('Error fetching RSVP detail responses for admin:', error);
    return NextResponse.json(
      { error: 'Error al cargar las respuestas RSVP' },
      { status: 500 }
    );
  }
}
