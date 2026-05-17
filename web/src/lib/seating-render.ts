import 'server-only';

import { adminFirestore } from '@/lib/firebase-admin';
import { readSeatingLayout } from '@/lib/seating-layout-server';
import { buildSeatingRender, type GuestInput, type RsvpInput, type SeatingDocInput } from '@/lib/seating-render-core';
import type { MainCoursePreference } from '@/types/rsvp';
import type { SeatingRenderPayload } from '@/types/seating-layout';

const GUESTS_COLLECTION = 'guests';
const RSVP_COLLECTION = 'rsvp_responses';
const SEATING_COLLECTION = 'seating';

export async function buildSeatingRenderPayload(): Promise<SeatingRenderPayload | null> {
  const layout = await readSeatingLayout();
  if (!layout) return null;

  const [guestsSnap, rsvpSnap, seatingSnap] = await Promise.all([
    adminFirestore.collection(GUESTS_COLLECTION).get(),
    adminFirestore.collection(RSVP_COLLECTION).get(),
    adminFirestore.collection(SEATING_COLLECTION).get(),
  ]);

  const guests: GuestInput[] = guestsSnap.docs.map((d) => {
    const raw = d.data();
    return {
      uid: d.id,
      fullName: typeof raw.fullName === 'string' ? raw.fullName : '',
      email: typeof raw.email === 'string' ? raw.email : '',
      isChild: raw.child === true,
      isCaptain: raw.tableCaptain === true,
    };
  });

  const rsvps: RsvpInput[] = rsvpSnap.docs.map((d) => {
    const raw = d.data();
    const responses = (raw.responses ?? {}) as Record<string, unknown>;
    const main = responses.mainCoursePreference;
    const dietary = responses.dietaryRestrictions;
    return {
      rsvpDocId: d.id,
      linkedGuestUid:
        typeof raw.linkedGuestUid === 'string' && raw.linkedGuestUid.trim()
          ? raw.linkedGuestUid.trim()
          : null,
      userEmail: typeof raw.userEmail === 'string' ? raw.userEmail : '',
      mainCoursePreference:
        main === 'meat' || main === 'fish' || main === 'vegetarian'
          ? (main as MainCoursePreference)
          : null,
      dietaryRestrictions: typeof dietary === 'string' ? dietary : '',
    };
  });

  const seating: SeatingDocInput[] = seatingSnap.docs.map((d) => {
    const raw = d.data();
    const tn = raw.tableNumber;
    return {
      guestUid: d.id,
      tableName: typeof raw.tableName === 'string' ? raw.tableName : '',
      seatNumber:
        typeof raw.seatNumber === 'number' && Number.isFinite(raw.seatNumber)
          ? raw.seatNumber
          : 0,
      tableNumber: typeof tn === 'number' && Number.isFinite(tn) ? tn : null,
    };
  });

  return buildSeatingRender({ layout, guests, rsvps, seating });
}
