import { tableNumberByName } from './seating-layout';
import {
  resolveFoodCategory,
  type SeatingLayout,
  type SeatingRenderPayload,
  type SeatRender,
  type UnassignedGuest,
} from '@/types/seating-layout';
import type { MainCoursePreference } from '@/types/rsvp';

export interface GuestInput {
  uid: string;
  fullName: string;
  email: string;
  isChild: boolean;
  isCaptain: boolean;
}

export interface RsvpInput {
  rsvpDocId: string;
  linkedGuestUid: string | null;
  userEmail: string;
  mainCoursePreference: MainCoursePreference | null;
  dietaryRestrictions: string;
}

export interface SeatingDocInput {
  guestUid: string;
  tableName: string;
  seatNumber: number;
  tableNumber: number | null;
}

export interface BuildSeatingRenderArgs {
  layout: SeatingLayout;
  guests: GuestInput[];
  rsvps: RsvpInput[];
  seating: SeatingDocInput[];
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

interface RsvpResolved {
  mainCoursePreference: MainCoursePreference | null;
  dietaryRestrictions: string;
}

function joinGuestRsvp(
  guest: GuestInput,
  rsvps: RsvpInput[],
): RsvpResolved | null {
  // Preferred: linked by linkedGuestUid (admin-curated).
  const linked = rsvps.find((r) => r.linkedGuestUid === guest.uid);
  if (linked) {
    return {
      mainCoursePreference: linked.mainCoursePreference,
      dietaryRestrictions: linked.dietaryRestrictions,
    };
  }
  // Fallback 1: RSVP doc id == guest uid (legacy).
  const byId = rsvps.find((r) => r.rsvpDocId === guest.uid);
  if (byId) {
    return {
      mainCoursePreference: byId.mainCoursePreference,
      dietaryRestrictions: byId.dietaryRestrictions,
    };
  }
  // Fallback 2: case-insensitive email match.
  const email = normalizeEmail(guest.email);
  if (!email) return null;
  const byEmail = rsvps.find((r) => normalizeEmail(r.userEmail) === email);
  if (byEmail) {
    return {
      mainCoursePreference: byEmail.mainCoursePreference,
      dietaryRestrictions: byEmail.dietaryRestrictions,
    };
  }
  return null;
}

export function buildSeatingRender(
  args: BuildSeatingRenderArgs,
): SeatingRenderPayload {
  const { layout, guests, rsvps, seating } = args;

  const guestByUid = new Map<string, GuestInput>();
  for (const g of guests) guestByUid.set(g.uid, g);

  const layoutNumberSet = new Set<number>(layout.rows.flat());
  const tableNameByNumber = new Map<number, string>();
  for (const [key, name] of Object.entries(layout.names)) {
    const n = Number(key);
    if (Number.isFinite(n)) tableNameByNumber.set(n, name);
  }

  const seats: SeatRender[] = [];
  const unassigned: UnassignedGuest[] = [];

  // Map<tableNumber, Map<seatNumber, { seat: SeatRender, guestUid: string }>>
  // Used to detect duplicate seats.
  const placed = new Map<
    number,
    Map<number, { seat: SeatRender; guestUid: string }>
  >();

  const assignedGuestUids = new Set<string>();

  for (const doc of seating) {
    const guest = guestByUid.get(doc.guestUid);
    if (!guest) {
      // No matching guest doc — skip silently (orphan seating doc).
      continue;
    }
    assignedGuestUids.add(guest.uid);

    // Resolve table number: prefer the stored numeric field, fall back to
    // name lookup. If neither resolves, surface as unassigned.
    let tableNumber: number | null = null;
    if (typeof doc.tableNumber === 'number' && layoutNumberSet.has(doc.tableNumber)) {
      tableNumber = doc.tableNumber;
    } else {
      const resolved = tableNumberByName(layout, doc.tableName);
      if (resolved !== null && layoutNumberSet.has(resolved)) {
        tableNumber = resolved;
      }
    }

    if (tableNumber === null) {
      const reason =
        doc.tableNumber !== null && !layoutNumberSet.has(doc.tableNumber)
          ? 'table_number_outside_layout'
          : 'unknown_table_name';
      unassigned.push({
        uid: guest.uid,
        fullName: guest.fullName,
        reason,
        rawTableName: doc.tableName,
        rawSeatNumber: doc.seatNumber,
        rawTableNumber: doc.tableNumber,
      });
      continue;
    }

    const rsvp = joinGuestRsvp(guest, rsvps);
    const foodCategory = resolveFoodCategory(
      guest.isChild,
      rsvp?.mainCoursePreference ?? null,
    );

    const seat: SeatRender = {
      tableNumber,
      tableName: tableNameByNumber.get(tableNumber) ?? '',
      seatNumber: doc.seatNumber,
      guest: {
        uid: guest.uid,
        fullName: guest.fullName,
        isChild: guest.isChild,
        isCaptain: guest.isCaptain,
        foodCategory,
        dietaryRestrictions: guest.isChild ? '' : (rsvp?.dietaryRestrictions ?? ''),
      },
    };

    let inner = placed.get(tableNumber);
    if (!inner) {
      inner = new Map();
      placed.set(tableNumber, inner);
    }
    const existing = inner.get(doc.seatNumber);
    if (existing) {
      // Duplicate seat collision — flag both, omit from rendered seats.
      unassigned.push({
        uid: guest.uid,
        fullName: guest.fullName,
        reason: 'duplicate_seat',
        rawTableName: doc.tableName,
        rawSeatNumber: doc.seatNumber,
        rawTableNumber: tableNumber,
        collidesWithUid: existing.guestUid,
      });
      // The previously placed guest is now also in a duplicate. Remove its
      // already-pushed seat from `seats` (linear scan; lists are small for
      // this dataset) and record it in `unassigned` unless already recorded.
      const idx = seats.findIndex(
        (s) =>
          s.tableNumber === tableNumber &&
          s.seatNumber === doc.seatNumber &&
          s.guest?.uid === existing.guestUid,
      );
      if (idx !== -1) seats.splice(idx, 1);
      const alreadyFlagged = unassigned.some(
        (u) => u.uid === existing.guestUid && u.reason === 'duplicate_seat',
      );
      if (!alreadyFlagged) {
        const existingGuest = guestByUid.get(existing.guestUid);
        unassigned.push({
          uid: existing.guestUid,
          fullName: existingGuest?.fullName ?? '',
          reason: 'duplicate_seat',
          rawTableName: existing.seat.tableName,
          rawSeatNumber: existing.seat.seatNumber,
          rawTableNumber: tableNumber,
          collidesWithUid: guest.uid,
        });
      }
      inner.delete(doc.seatNumber);
      continue;
    }
    inner.set(doc.seatNumber, { seat, guestUid: guest.uid });
    seats.push(seat);
  }

  // Guests with no seating doc — but only count adults / children that
  // matter. We include every guest in `guests` not present in seating.
  for (const guest of guests) {
    if (!assignedGuestUids.has(guest.uid)) {
      unassigned.push({
        uid: guest.uid,
        fullName: guest.fullName,
        reason: 'no_seating_doc',
      });
    }
  }

  seats.sort((a, b) => {
    if (a.tableNumber !== b.tableNumber) return a.tableNumber - b.tableNumber;
    return a.seatNumber - b.seatNumber;
  });

  return {
    layout,
    seats,
    unassigned,
    generatedAt: new Date().toISOString(),
  };
}
