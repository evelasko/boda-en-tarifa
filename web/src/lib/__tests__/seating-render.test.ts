import {
  buildSeatingRender,
  type GuestInput,
  type RsvpInput,
  type SeatingDocInput,
} from '../seating-render-core';
import { CANONICAL_SEED } from '../seating-layout';
import type { SeatingLayout } from '@/types/seating-layout';

const layout: SeatingLayout = {
  ...CANONICAL_SEED,
  updatedAt: '2026-05-17T00:00:00.000Z',
  updatedByAdminUid: 'test',
};

function guest(
  uid: string,
  fullName: string,
  opts: Partial<GuestInput> = {},
): GuestInput {
  return {
    uid,
    fullName,
    email: `${uid}@test.local`,
    isChild: false,
    isCaptain: false,
    ...opts,
  };
}

function rsvp(
  rsvpDocId: string,
  linkedGuestUid: string | null,
  main: RsvpInput['mainCoursePreference'],
  dietary = '',
  userEmail = '',
): RsvpInput {
  return {
    rsvpDocId,
    linkedGuestUid,
    userEmail,
    mainCoursePreference: main,
    dietaryRestrictions: dietary,
  };
}

function seatDoc(
  guestUid: string,
  tableNumber: number | null,
  seatNumber: number,
  tableName = '',
): SeatingDocInput {
  return {
    guestUid,
    tableNumber,
    seatNumber,
    tableName: tableName || (tableNumber !== null ? layout.names[String(tableNumber)] : ''),
  };
}

describe('buildSeatingRender — happy path', () => {
  it('joins three guests, one child, one captain with correct food letters', () => {
    const guests: GuestInput[] = [
      guest('alice', 'Alice Smith', { isCaptain: true }),
      guest('bob', 'Bob Jones'),
      guest('carla', 'Carla Niña', { isChild: true }),
    ];
    const rsvps: RsvpInput[] = [
      rsvp('r1', 'alice', 'meat', 'Sin lactosa'),
      rsvp('r2', 'bob', 'fish'),
    ];
    const seating: SeatingDocInput[] = [
      seatDoc('alice', 1, 1),
      seatDoc('bob', 1, 2),
      seatDoc('carla', 1, 3),
    ];

    const result = buildSeatingRender({ layout, guests, rsvps, seating });

    expect(result.seats).toHaveLength(3);
    expect(result.unassigned).toEqual([]);
    expect(result.seats[0]).toMatchObject({
      tableNumber: 1,
      tableName: 'Valdevaqueros',
      seatNumber: 1,
      guest: {
        uid: 'alice',
        fullName: 'Alice Smith',
        isCaptain: true,
        isChild: false,
        foodCategory: 'meat',
        dietaryRestrictions: 'Sin lactosa',
      },
    });
    expect(result.seats[1].guest?.foodCategory).toBe('fish');
    expect(result.seats[2].guest).toMatchObject({
      isChild: true,
      foodCategory: 'child',
      dietaryRestrictions: '',
    });
  });

  it('sorts seats by tableNumber then seatNumber', () => {
    const guests = [guest('a', 'A'), guest('b', 'B'), guest('c', 'C')];
    const rsvps: RsvpInput[] = [
      rsvp('a', 'a', 'meat'),
      rsvp('b', 'b', 'meat'),
      rsvp('c', 'c', 'meat'),
    ];
    const seating: SeatingDocInput[] = [
      seatDoc('a', 4, 5),
      seatDoc('b', 1, 8),
      seatDoc('c', 1, 2),
    ];
    const result = buildSeatingRender({ layout, guests, rsvps, seating });
    expect(result.seats.map((s) => [s.tableNumber, s.seatNumber])).toEqual([
      [1, 2],
      [1, 8],
      [4, 5],
    ]);
  });
});

describe('buildSeatingRender — children always resolve to child', () => {
  it('child with a (theoretical) RSVP still resolves to child', () => {
    const guests = [guest('kid', 'Kid', { isChild: true })];
    const rsvps: RsvpInput[] = [rsvp('kid', 'kid', 'meat', 'Allergies!')];
    const seating: SeatingDocInput[] = [seatDoc('kid', 1, 1)];
    const result = buildSeatingRender({ layout, guests, rsvps, seating });
    expect(result.seats[0].guest?.foodCategory).toBe('child');
    expect(result.seats[0].guest?.dietaryRestrictions).toBe('');
  });
});

describe('buildSeatingRender — unknown food category', () => {
  it('adult with no RSVP becomes unknown', () => {
    const guests = [guest('lonely', 'Lonely Adult')];
    const result = buildSeatingRender({
      layout,
      guests,
      rsvps: [],
      seating: [seatDoc('lonely', 1, 1)],
    });
    expect(result.seats[0].guest?.foodCategory).toBe('unknown');
  });
});

describe('buildSeatingRender — RSVP email fallback', () => {
  it('joins by case-insensitive email when no linkedGuestUid', () => {
    const guests = [
      guest('g1', 'Test Guest', { email: 'Test@Example.com' }),
    ];
    const rsvps: RsvpInput[] = [
      rsvp('some-auth-uid', null, 'vegetarian', 'No nuts', 'test@example.com'),
    ];
    const seating: SeatingDocInput[] = [seatDoc('g1', 1, 1)];
    const result = buildSeatingRender({ layout, guests, rsvps, seating });
    expect(result.seats[0].guest?.foodCategory).toBe('vegetarian');
    expect(result.seats[0].guest?.dietaryRestrictions).toBe('No nuts');
  });
});

describe('buildSeatingRender — unassigned paths', () => {
  it('flags a seating doc whose tableName is not in the layout', () => {
    const guests = [guest('g1', 'Wrong Table')];
    const seating: SeatingDocInput[] = [
      {
        guestUid: 'g1',
        tableName: 'Tarifa Beach',
        seatNumber: 1,
        tableNumber: null,
      },
    ];
    const result = buildSeatingRender({
      layout,
      guests,
      rsvps: [rsvp('g1', 'g1', 'meat')],
      seating,
    });
    expect(result.seats).toHaveLength(0);
    expect(result.unassigned).toHaveLength(1);
    expect(result.unassigned[0]).toMatchObject({
      uid: 'g1',
      reason: 'unknown_table_name',
      rawTableName: 'Tarifa Beach',
    });
  });

  it('flags a guest with no seating doc', () => {
    const guests = [guest('g1', 'Seated'), guest('g2', 'Not Seated')];
    const seating: SeatingDocInput[] = [seatDoc('g1', 1, 1)];
    const result = buildSeatingRender({
      layout,
      guests,
      rsvps: [rsvp('g1', 'g1', 'meat')],
      seating,
    });
    const unseated = result.unassigned.find((u) => u.uid === 'g2');
    expect(unseated?.reason).toBe('no_seating_doc');
  });

  it('flags a tableNumber outside the layout', () => {
    const guests = [guest('g1', 'Out of Range')];
    const seating: SeatingDocInput[] = [
      {
        guestUid: 'g1',
        tableName: 'Phantom',
        seatNumber: 1,
        tableNumber: 99,
      },
    ];
    const result = buildSeatingRender({
      layout,
      guests,
      rsvps: [rsvp('g1', 'g1', 'meat')],
      seating,
    });
    expect(result.unassigned[0]).toMatchObject({
      uid: 'g1',
      reason: 'table_number_outside_layout',
      rawTableNumber: 99,
    });
  });

  it('flags two guests on the same (table, seat) as duplicate_seat', () => {
    const guests = [guest('a', 'Alice'), guest('b', 'Bob')];
    const seating: SeatingDocInput[] = [
      seatDoc('a', 1, 5),
      seatDoc('b', 1, 5),
    ];
    const result = buildSeatingRender({
      layout,
      guests,
      rsvps: [rsvp('a', 'a', 'meat'), rsvp('b', 'b', 'fish')],
      seating,
    });
    const dupes = result.unassigned.filter((u) => u.reason === 'duplicate_seat');
    expect(dupes).toHaveLength(2);
    expect(dupes.map((d) => d.uid).sort()).toEqual(['a', 'b']);
    expect(result.seats.find((s) => s.tableNumber === 1 && s.seatNumber === 5))
      .toBeUndefined();
  });
});
