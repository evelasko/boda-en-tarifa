import 'server-only';

import { buildSeatingRenderPayload } from '@/lib/seating-render';
import {
  CAPTAIN_BADGE,
  FOOD_LABELS,
  GIFT_BADGE,
  type FoodCategory,
  type SeatRender,
  type SeatingRenderPayload,
  type UnassignedGuest,
} from '@/types/seating-layout';

export interface ServiceDishCounts {
  meat: number;
  fish: number;
  vegetarian: number;
  children: number;
  captains: number;
}

export interface ServiceTableGuest {
  seatNumber: number;
  fullName: string;
  mainCourse: string;
  foodCategory: FoodCategory;
  dietaryRestrictions: string;
  isCaptain: boolean;
  isChild: boolean;
}

export interface ServiceTableReport {
  tableNumber: number;
  tableName: string;
  counts: ServiceDishCounts;
  guests: ServiceTableGuest[];
}

export interface StaffServiceReport {
  counts: ServiceDishCounts;
  tables: ServiceTableReport[];
  unassigned: UnassignedGuest[];
  generatedAt: string;
}

const EMPTY_COUNTS: ServiceDishCounts = {
  meat: 0,
  fish: 0,
  vegetarian: 0,
  children: 0,
  captains: 0,
};

export function countServiceDishes(seats: SeatRender[]): ServiceDishCounts {
  const counts = { ...EMPTY_COUNTS };
  for (const seat of seats) {
    const guest = seat.guest;
    if (!guest) continue;
    if (guest.isCaptain) counts.captains += 1;
    switch (guest.foodCategory) {
      case 'meat':
        counts.meat += 1;
        break;
      case 'fish':
        counts.fish += 1;
        break;
      case 'vegetarian':
        counts.vegetarian += 1;
        break;
      case 'child':
        counts.children += 1;
        break;
      default:
        break;
    }
  }
  return counts;
}

function seatToGuestRow(seat: SeatRender): ServiceTableGuest | null {
  const guest = seat.guest;
  if (!guest) return null;
  return {
    seatNumber: seat.seatNumber,
    fullName: guest.fullName,
    mainCourse: FOOD_LABELS[guest.foodCategory],
    foodCategory: guest.foodCategory,
    dietaryRestrictions: guest.dietaryRestrictions.trim(),
    isCaptain: guest.isCaptain,
    isChild: guest.isChild,
  };
}

export function buildStaffServiceReportFromPayload(
  payload: SeatingRenderPayload,
): StaffServiceReport {
  const byTable = new Map<number, SeatRender[]>();
  for (const seat of payload.seats) {
    const list = byTable.get(seat.tableNumber);
    if (list) list.push(seat);
    else byTable.set(seat.tableNumber, [seat]);
  }

  const tables: ServiceTableReport[] = [...byTable.entries()]
    .sort(([a], [b]) => a - b)
    .map(([tableNumber, tableSeats]) => {
      const sorted = [...tableSeats].sort((a, b) => a.seatNumber - b.seatNumber);
      const first = sorted[0];
      return {
        tableNumber,
        tableName: first?.tableName ?? '',
        counts: countServiceDishes(sorted),
        guests: sorted
          .map(seatToGuestRow)
          .filter((row): row is ServiceTableGuest => row !== null),
      };
    });

  return {
    counts: countServiceDishes(payload.seats),
    tables,
    unassigned: payload.unassigned,
    generatedAt: payload.generatedAt,
  };
}

export async function buildStaffServiceReport(): Promise<StaffServiceReport | null> {
  const payload = await buildSeatingRenderPayload();
  if (!payload) return null;
  return buildStaffServiceReportFromPayload(payload);
}
