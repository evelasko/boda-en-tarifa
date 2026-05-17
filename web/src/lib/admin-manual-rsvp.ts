import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase-admin';
import { cleanRSVPResponse, RSVPValidation } from '@/lib/rsvp-validation';
import type { Guest } from '@/types/guest';
import type { RSVPResponse, RSVPSubmission } from '@/types/rsvp';

const RSVP_COLLECTION = 'rsvp_responses';

export type ExistingRsvpConflict = 'doc' | 'linked' | null;

type ManualRsvpMeta = {
  notes?: string;
  proxySourceRsvpUid?: string;
};

export function resolveExistingRsvpConflict(
  hasDoc: boolean,
  hasLinkedRsvp: boolean
): ExistingRsvpConflict {
  if (hasDoc) return 'doc';
  if (hasLinkedRsvp) return 'linked';
  return null;
}

export async function guestHasExistingRsvp(guestUid: string): Promise<ExistingRsvpConflict> {
  const [byDocId, linkedQuery] = await Promise.all([
    adminFirestore.collection(RSVP_COLLECTION).doc(guestUid).get(),
    adminFirestore.collection(RSVP_COLLECTION).where('linkedGuestUid', '==', guestUid).limit(1).get(),
  ]);
  return resolveExistingRsvpConflict(byDocId.exists, !linkedQuery.empty);
}

function buildCompleteResponse(responses: Partial<RSVPResponse>): RSVPResponse {
  const cleaned = cleanRSVPResponse(responses);
  if (!RSVPValidation.isFormValid(cleaned)) {
    throw new Error('Manual RSVP payload is invalid');
  }
  const result: RSVPResponse = {
    attendance: cleaned.attendance!,
    displayName: cleaned.displayName!,
    accommodationManagement: cleaned.accommodationManagement ?? 'no',
    nightsStaying: cleaned.nightsStaying!,
    roomSharing: cleaned.roomSharing ?? '',
    transportationNeeds: cleaned.transportationNeeds!,
    dietaryRestrictions: cleaned.dietaryRestrictions ?? '',
    mainCoursePreference: cleaned.mainCoursePreference!,
  };
  if (cleaned.otherNightsCombination !== undefined) {
    result.otherNightsCombination = cleaned.otherNightsCombination;
  }
  if (cleaned.sundayBrunch !== undefined) {
    result.sundayBrunch = cleaned.sundayBrunch;
  }
  return result;
}

export function buildManualRsvpDocument(
  guestUid: string,
  guest: Guest,
  responses: Partial<RSVPResponse>,
  adminUid: string,
  meta: ManualRsvpMeta
): Omit<RSVPSubmission, 'submittedAt' | 'lastUpdatedAt'> & {
  submittedAt: FieldValue;
  lastUpdatedAt: FieldValue;
  source: 'manual';
  enteredByAdminUid: string;
  proxySourceRsvpUid?: string;
} {
  const finalResponses = buildCompleteResponse(responses);
  const linkNotes =
    typeof meta.notes === 'string' && meta.notes.trim() ? meta.notes.trim() : undefined;
  const proxySourceRsvpUid =
    typeof meta.proxySourceRsvpUid === 'string' && meta.proxySourceRsvpUid.trim()
      ? meta.proxySourceRsvpUid.trim()
      : undefined;

  return {
    userId: guestUid,
    userEmail: guest.email?.trim() ?? '',
    userDisplayName: finalResponses.displayName || guest.fullName,
    responses: finalResponses,
    isSubmitted: true,
    version: 1,
    submittedAt: FieldValue.serverTimestamp(),
    lastUpdatedAt: FieldValue.serverTimestamp(),
    source: 'manual',
    enteredByAdminUid: adminUid,
    linkedGuestUid: guestUid,
    linkSource: 'manual',
    ...(linkNotes ? { linkNotes } : {}),
    ...(proxySourceRsvpUid ? { proxySourceRsvpUid } : {}),
  };
}
