import type { MainCoursePreference, RSVPResponse } from '@/types/rsvp';

const MAIN_COURSE_VALUES: MainCoursePreference[] = ['fish', 'meat', 'vegetarian'];

export class RSVPValidation {
  /**
   * Validate RSVP response
   */
  static validateResponse(responses: Partial<RSVPResponse>): Record<string, string> {
    const errors: Record<string, string> = {};

    // Display name (required)
    if (!responses.displayName?.trim()) {
      errors.displayName = 'Por favor, indica tu nombre completo';
    }

    // Question 1: Attendance (required)
    if (!responses.attendance) {
      errors.attendance = 'Por favor, indica si vas a venir a la boda';
    }

    // Question 2: Nights staying (required, at least one)
    if (!responses.nightsStaying || responses.nightsStaying.length === 0) {
      errors.nightsStaying = 'Por favor, selecciona al menos una noche';
    }

    // Question 2b: Other nights combination (required if "other" is selected)
    if (responses.nightsStaying?.includes('other') && !responses.otherNightsCombination?.trim()) {
      errors.otherNightsCombination = 'Por favor, especifica tu combinación de noches';
    }

    // Question 4: Transportation needs (required, at least one)
    if (!responses.transportationNeeds || responses.transportationNeeds.length === 0) {
      errors.transportationNeeds = 'Por favor, selecciona al menos una opción de transporte';
    }

    // Question 6: Main course preference (required)
    if (
      !responses.mainCoursePreference ||
      !MAIN_COURSE_VALUES.includes(responses.mainCoursePreference)
    ) {
      errors.mainCoursePreference =
        'Por favor, selecciona tu preferencia para el plato principal';
    }

    return errors;
  }

  /**
   * Check if form is valid
   */
  static isFormValid(responses: Partial<RSVPResponse>): boolean {
    const errors = this.validateResponse(responses);
    return Object.keys(errors).length === 0;
  }

  /** Stable order for surfacing blocking issues next to a disabled submit control. */
  private static readonly blockingFieldOrder: (keyof RSVPResponse)[] = [
    'displayName',
    'attendance',
    'nightsStaying',
    'otherNightsCombination',
    'transportationNeeds',
    'mainCoursePreference',
  ];

  /** Human-readable validation messages for fields that block submission. */
  static listBlockingMessages(responses: Partial<RSVPResponse>): string[] {
    const errors = this.validateResponse(responses);
    return this.blockingFieldOrder
      .filter((key) => Boolean(errors[key]))
      .map((key) => errors[key] as string);
  }

  /**
   * Get field-specific error message
   */
  static getFieldError(field: keyof RSVPResponse, responses: Partial<RSVPResponse>): string {
    const errors = this.validateResponse(responses);
    return errors[field] || '';
  }
}

// Utility function to clean responses by removing undefined values
export function cleanRSVPResponse(responses: Partial<RSVPResponse>): Partial<RSVPResponse> {
  const cleaned: Partial<RSVPResponse> = {};

  // Only include fields that have actual values (not undefined)
  Object.entries(responses).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        // Only include arrays that have at least one item
        if (value.length > 0) {
          (cleaned as Record<string, unknown>)[key] = value;
        }
      } else if (typeof value === 'string') {
        // Only include non-empty strings
        if (value.trim() !== '') {
          (cleaned as Record<string, unknown>)[key] = value;
        }
      } else {
        // Include other values (boolean, etc.)
        (cleaned as Record<string, unknown>)[key] = value;
      }
    }
  });

  return cleaned;
}
