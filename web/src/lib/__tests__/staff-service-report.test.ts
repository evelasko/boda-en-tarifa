import {
  buildStaffServiceReportFromPayload,
  countServiceDishes,
} from '../staff-service-report';
import { buildSeatingRender } from '../seating-render-core';
import { CANONICAL_SEED } from '../seating-layout';
import type { SeatingLayout } from '@/types/seating-layout';
import type { GuestInput, RsvpInput, SeatingDocInput } from '../seating-render-core';

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
): RsvpInput {
  return {
    rsvpDocId,
    linkedGuestUid,
    userEmail: '',
    mainCoursePreference: main,
    dietaryRestrictions: dietary,
  };
}

function seatDoc(guestUid: string, tableNumber: number, seatNumber: number): SeatingDocInput {
  return {
    guestUid,
    tableNumber,
    seatNumber,
    tableName: layout.names[String(tableNumber)] ?? '',
  };
}

describe('staff service report', () => {
  it('aggregates global and per-table dish counts from seating payload', () => {
    const guests: GuestInput[] = [
      guest('alice', 'Alice', { isCaptain: true }),
      guest('bob', 'Bob'),
      guest('carla', 'Carla', { isChild: true }),
      guest('dan', 'Dan'),
    ];
    const rsvps: RsvpInput[] = [
      rsvp('r1', 'alice', 'meat', 'Sin lactosa'),
      rsvp('r2', 'bob', 'fish'),
      rsvp('r4', 'dan', 'vegetarian'),
    ];
    const seating: SeatingDocInput[] = [
      seatDoc('alice', 1, 1),
      seatDoc('bob', 1, 2),
      seatDoc('carla', 1, 3),
      seatDoc('dan', 2, 1),
    ];

    const payload = buildSeatingRender({ layout, guests, rsvps, seating });
    const report = buildStaffServiceReportFromPayload(payload);

    expect(report.counts).toEqual({
      meat: 1,
      fish: 1,
      vegetarian: 1,
      children: 1,
      captains: 1,
    });

    expect(report.tables).toHaveLength(2);
    expect(report.tables[0].tableNumber).toBe(1);
    expect(report.tables[0].counts).toEqual({
      meat: 1,
      fish: 1,
      vegetarian: 0,
      children: 1,
      captains: 1,
    });
    expect(report.tables[0].guests).toHaveLength(3);
    expect(report.tables[0].guests[0]).toMatchObject({
      seatNumber: 1,
      fullName: 'Alice',
      mainCourse: 'Carne',
      dietaryRestrictions: 'Sin lactosa',
      isCaptain: true,
      isChild: false,
    });
    expect(report.tables[0].guests[2]).toMatchObject({
      seatNumber: 3,
      fullName: 'Carla',
      mainCourse: 'Niño/a',
      isChild: true,
    });
  });

  it('countServiceDishes ignores empty seats', () => {
    const counts = countServiceDishes([
      {
        tableNumber: 1,
        tableName: 'Test',
        seatNumber: 1,
        guest: null,
      },
    ]);
    expect(counts).toEqual({
      meat: 0,
      fish: 0,
      vegetarian: 0,
      children: 0,
      captains: 0,
    });
  });
});
