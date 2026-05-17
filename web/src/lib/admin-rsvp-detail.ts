import 'server-only';

import type { DocumentData } from 'firebase-admin/firestore';
import type {
  AttendanceStatus,
  MainCoursePreference,
  NightOption,
  RsvpSubmissionSource,
} from '@/types/rsvp';
import type {
  AdminRsvpDetailRow,
  AdminRsvpGuestSummary,
  AdminRsvpLinkBucket,
} from '@/types/admin-rsvp-response';
import {
  buildAdminRsvpRows,
  buildNormalizedEmailToGuestUids,
} from '@/lib/admin-rsvp-responses';

const NIGHT_VALUES: NightOption[] = ['friday', 'saturday', 'sunday', 'other'];
const MAIN_COURSE_VALUES: MainCoursePreference[] = ['fish', 'meat', 'vegetarian'];
const SOURCE_VALUES: RsvpSubmissionSource[] = ['web', 'whatsapp', 'manual'];

function parseNightsStaying(raw: unknown): NightOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is NightOption =>
    typeof v === 'string' && NIGHT_VALUES.includes(v as NightOption)
  );
}

function parseMainCourse(raw: unknown): MainCoursePreference | null {
  if (typeof raw !== 'string') return null;
  return MAIN_COURSE_VALUES.includes(raw as MainCoursePreference)
    ? (raw as MainCoursePreference)
    : null;
}

function parseSource(raw: unknown): RsvpSubmissionSource | null {
  if (typeof raw !== 'string') return null;
  return SOURCE_VALUES.includes(raw as RsvpSubmissionSource)
    ? (raw as RsvpSubmissionSource)
    : null;
}

function parseDetailFields(data: DocumentData): Pick<
  AdminRsvpDetailRow,
  | 'mainCoursePreference'
  | 'dietaryRestrictions'
  | 'nightsStaying'
  | 'otherNightsCombination'
  | 'roomSharing'
  | 'source'
> {
  const responses = data.responses as Record<string, unknown> | undefined;
  const dietary =
    typeof responses?.dietaryRestrictions === 'string'
      ? responses.dietaryRestrictions
      : '';
  const roomSharing =
    typeof responses?.roomSharing === 'string' ? responses.roomSharing : '';
  const otherNights =
    typeof responses?.otherNightsCombination === 'string' &&
    responses.otherNightsCombination.trim()
      ? responses.otherNightsCombination.trim()
      : null;

  return {
    mainCoursePreference: parseMainCourse(responses?.mainCoursePreference),
    dietaryRestrictions: dietary,
    nightsStaying: parseNightsStaying(responses?.nightsStaying),
    otherNightsCombination: otherNights,
    roomSharing,
    source: parseSource(data.source),
  };
}

export function buildAdminRsvpDetailRows(
  rsvpDocs: Array<{ id: string; data: () => DocumentData }>,
  guestSummariesByUid: Map<string, AdminRsvpGuestSummary>,
  emailToGuestUids: Map<string, string[]>
): AdminRsvpDetailRow[] {
  const summaryRows = buildAdminRsvpRows(rsvpDocs, guestSummariesByUid, emailToGuestUids);
  const dataById = new Map(rsvpDocs.map((d) => [d.id, d.data()]));

  return summaryRows.map((row) => {
    const data = dataById.get(row.rsvpUid) ?? {};
    return { ...row, ...parseDetailFields(data) };
  });
}

export type AdminRsvpDetailFilters = {
  search?: string | null;
  attendance?: AttendanceStatus | 'all' | null;
  isSubmitted?: 'true' | 'false' | 'all' | null;
  linkStatus?: AdminRsvpLinkBucket | 'all' | null;
  source?: RsvpSubmissionSource | 'all' | null;
};

export function filterAdminRsvpDetailRows(
  rows: AdminRsvpDetailRow[],
  filters: AdminRsvpDetailFilters
): AdminRsvpDetailRow[] {
  let out = rows;

  const { linkStatus, attendance, isSubmitted, source, search } = filters;

  if (linkStatus && linkStatus !== 'all') {
    out = out.filter((r) => r.linkStatus === linkStatus);
  }

  if (attendance && attendance !== 'all') {
    out = out.filter((r) => r.attendance === attendance);
  }

  if (isSubmitted === 'true') {
    out = out.filter((r) => r.isSubmitted);
  } else if (isSubmitted === 'false') {
    out = out.filter((r) => !r.isSubmitted);
  }

  if (source && source !== 'all') {
    out = out.filter((r) => r.source === source);
  }

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter((r) => {
      if (r.rsvpUid.toLowerCase().includes(q)) return true;
      if (r.userEmail.toLowerCase().includes(q)) return true;
      if (r.displayName.toLowerCase().includes(q)) return true;
      if (r.dietaryRestrictions.toLowerCase().includes(q)) return true;
      if (r.roomSharing.toLowerCase().includes(q)) return true;
      if (r.linkedGuest?.fullName.toLowerCase().includes(q)) return true;
      if (r.linkedGuest?.email.toLowerCase().includes(q)) return true;
      if (r.suggestedGuest?.fullName.toLowerCase().includes(q)) return true;
      if (r.suggestedGuest?.email.toLowerCase().includes(q)) return true;
      return false;
    });
  }

  return out;
}

export { buildNormalizedEmailToGuestUids };
