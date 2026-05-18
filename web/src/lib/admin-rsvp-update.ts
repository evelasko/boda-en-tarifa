import type { MainCoursePreference } from '@/types/rsvp';

const MAIN_COURSE_VALUES: MainCoursePreference[] = ['fish', 'meat', 'vegetarian'];

export type AdminRsvpEditableResponses = {
  mainCoursePreference: MainCoursePreference;
  /** `null` or empty string removes `dietaryRestrictions` from the stored responses map. */
  dietaryRestrictions?: string | null;
  roomSharing?: string;
  sundayBrunch?: boolean;
};

export function validateAdminRsvpEditablePatch(
  patch: AdminRsvpEditableResponses
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (
    !patch.mainCoursePreference ||
    !MAIN_COURSE_VALUES.includes(patch.mainCoursePreference)
  ) {
    errors.mainCoursePreference =
      'Por favor, selecciona tu preferencia para el plato principal';
  }
  return errors;
}

export function buildAdminRsvpResponsePatch(
  existing: Record<string, unknown>,
  patch: AdminRsvpEditableResponses
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...existing };

  merged.mainCoursePreference = patch.mainCoursePreference;

  if (patch.roomSharing !== undefined) {
    merged.roomSharing = patch.roomSharing.trim();
  }

  if (patch.sundayBrunch !== undefined) {
    merged.sundayBrunch = patch.sundayBrunch;
  }

  if ('dietaryRestrictions' in patch) {
    const raw = patch.dietaryRestrictions;
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (raw === null || trimmed === '') {
      delete merged.dietaryRestrictions;
    } else {
      merged.dietaryRestrictions = trimmed;
    }
  }

  return merged;
}
