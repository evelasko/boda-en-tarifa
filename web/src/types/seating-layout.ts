import type { MainCoursePreference } from './rsvp';

export interface SeatingLayout {
  rows: number[][];
  names: Record<string, string>;
  maxSeats: number;
  updatedAt: string;
  updatedByAdminUid: string;
}

export type SeatingLayoutInput = Omit<SeatingLayout, 'updatedAt' | 'updatedByAdminUid'>;

export type FoodCategory = 'meat' | 'fish' | 'vegetarian' | 'child' | 'unknown';

export interface SeatRender {
  tableNumber: number;
  tableName: string;
  seatNumber: number;
  guest: {
    uid: string;
    fullName: string;
    isChild: boolean;
    isCaptain: boolean;
    foodCategory: FoodCategory;
    dietaryRestrictions: string;
  } | null;
}

export type UnassignedReason =
  | 'no_seating_doc'
  | 'unknown_table_name'
  | 'table_number_outside_layout'
  | 'duplicate_seat';

export interface UnassignedGuest {
  uid: string;
  fullName: string;
  reason: UnassignedReason;
  rawTableName?: string;
  rawSeatNumber?: number;
  rawTableNumber?: number | null;
  collidesWithUid?: string;
}

export interface SeatingRenderPayload {
  layout: SeatingLayout;
  seats: SeatRender[];
  unassigned: UnassignedGuest[];
  generatedAt: string;
}

export const FOOD_LABELS: Record<FoodCategory, string> = {
  meat: 'Carne',
  fish: 'Pescado',
  vegetarian: 'Vegetariano',
  child: 'Niño/a',
  unknown: 'Sin RSVP',
};

export const FOOD_LETTERS: Record<FoodCategory, string> = {
  meat: 'C',
  fish: 'P',
  vegetarian: 'V',
  child: 'N',
  unknown: '?',
};

export const FOOD_FILLS: Record<FoodCategory, string> = {
  meat: '#E89B5A',
  fish: '#5A8FB8',
  vegetarian: '#7BAA6E',
  child: '#E58FB5',
  unknown: '#C9C2BA',
};

export const FOOD_STROKES: Record<FoodCategory, string> = {
  meat: '#A86A2E',
  fish: '#345E80',
  vegetarian: '#4F7A45',
  child: '#A35176',
  unknown: '#8C857D',
};

export const CAPTAIN_BADGE = '👑';
export const GIFT_BADGE = '🎁';

export const CAPTAIN_BADGE_CAPTION = 'Capitán de mesa: coloca menú impreso';
export const GIFT_BADGE_CAPTION = 'Niño/a: coloca regalo en su asiento';

export function resolveFoodCategory(
  isChild: boolean,
  mainCourse: MainCoursePreference | null | undefined,
): FoodCategory {
  if (isChild) return 'child';
  if (mainCourse === 'meat' || mainCourse === 'fish' || mainCourse === 'vegetarian') {
    return mainCourse;
  }
  return 'unknown';
}
