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

/**
 * Per-category fill colour for the seat disc. Values are CSS `var(...)`
 * references resolved from `web/src/styles/seating-diagram.css`; tweak the
 * underlying tokens there to recolour the diagram without touching code.
 * These strings are passed straight into inline `style={{ fill: ... }}` on
 * the SVG element, where `var(--seat-fill-meat)` is valid CSS.
 */
export const FOOD_FILLS: Record<FoodCategory, string> = {
  meat:       'var(--seat-fill-meat)',
  fish:       'var(--seat-fill-fish)',
  vegetarian: 'var(--seat-fill-vegetarian)',
  child:      'var(--seat-fill-child)',
  unknown:    'var(--seat-fill-unknown)',
};

/**
 * Per-category stroke colour for the seat disc. Same pattern as FOOD_FILLS.
 */
export const FOOD_STROKES: Record<FoodCategory, string> = {
  meat:       'var(--seat-stroke-meat)',
  fish:       'var(--seat-stroke-fish)',
  vegetarian: 'var(--seat-stroke-vegetarian)',
  child:      'var(--seat-stroke-child)',
  unknown:    'var(--seat-stroke-unknown)',
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
