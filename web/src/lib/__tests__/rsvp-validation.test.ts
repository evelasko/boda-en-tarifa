import { RSVPValidation } from '../firestore';
import { RSVPResponse } from '@/types/rsvp';

describe('RSVP Validation', () => {
  describe('validateResponse', () => {
    it('should return errors for empty form', () => {
      const emptyResponse: Partial<RSVPResponse> = {};
      const errors = RSVPValidation.validateResponse(emptyResponse);

      expect(errors).toHaveProperty('displayName');
      expect(errors).toHaveProperty('attendance');
      expect(errors).toHaveProperty('nightsStaying');
      expect(errors).toHaveProperty('transportationNeeds');
      expect(errors).toHaveProperty('mainCoursePreference');
      expect(Object.keys(errors)).toHaveLength(5);
    });

    it('should return no errors for complete valid form', () => {
      const completeResponse: Partial<RSVPResponse> = {
        displayName: 'María García',
        attendance: 'yes',
        nightsStaying: ['friday', 'saturday'],
        roomSharing: 'Juan Pérez',
        transportationNeeds: ['find_ride'],
        mainCoursePreference: 'fish',
      };

      const errors = RSVPValidation.validateResponse(completeResponse);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should still require main course when not attending', () => {
      const response: Partial<RSVPResponse> = {
        displayName: 'María García',
        attendance: 'no',
        nightsStaying: ['friday'],
        transportationNeeds: ['no_help'],
      };

      expect(RSVPValidation.validateResponse(response)).toHaveProperty('mainCoursePreference');
    });

    it('should return no errors when sundayBrunch is true', () => {
      const response: Partial<RSVPResponse> = {
        displayName: 'María García',
        attendance: 'yes',
        nightsStaying: ['friday', 'saturday'],
        transportationNeeds: ['find_ride'],
        mainCoursePreference: 'fish',
        sundayBrunch: true,
      };

      expect(RSVPValidation.validateResponse(response)).toEqual({});
    });

    it('should return no errors when sundayBrunch is false', () => {
      const response: Partial<RSVPResponse> = {
        displayName: 'María García',
        attendance: 'yes',
        nightsStaying: ['friday', 'saturday'],
        transportationNeeds: ['find_ride'],
        mainCoursePreference: 'fish',
        sundayBrunch: false,
      };

      expect(RSVPValidation.validateResponse(response)).toEqual({});
    });

    it('should still report other errors when only sundayBrunch is set', () => {
      const response: Partial<RSVPResponse> = { sundayBrunch: true };
      const errors = RSVPValidation.validateResponse(response);

      expect(errors).toHaveProperty('displayName');
      expect(errors).toHaveProperty('attendance');
      expect(errors).toHaveProperty('nightsStaying');
      expect(errors).toHaveProperty('transportationNeeds');
      expect(errors).toHaveProperty('mainCoursePreference');
      expect(errors).not.toHaveProperty('sundayBrunch');
    });

    it('should require otherNightsCombination when other is selected', () => {
      const response: Partial<RSVPResponse> = {
        displayName: 'María García',
        attendance: 'yes',
        nightsStaying: ['other'],
        roomSharing: 'Juan Pérez',
        transportationNeeds: ['find_ride'],
        mainCoursePreference: 'fish',
      };

      const errors = RSVPValidation.validateResponse(response);
      expect(errors).toHaveProperty('otherNightsCombination');
    });

    it('should not require otherNightsCombination when other is not selected', () => {
      const response: Partial<RSVPResponse> = {
        displayName: 'María García',
        attendance: 'yes',
        nightsStaying: ['friday', 'saturday'],
        roomSharing: 'Juan Pérez',
        transportationNeeds: ['find_ride'],
        mainCoursePreference: 'fish',
      };

      const errors = RSVPValidation.validateResponse(response);
      expect(errors).not.toHaveProperty('otherNightsCombination');
    });
  });

  describe('listBlockingMessages', () => {
    it('returns messages in form order (display name before attendance)', () => {
      const messages = RSVPValidation.listBlockingMessages({});
      expect(messages[0]).toMatch(/nombre/i);
      expect(messages.some((m) => m.includes('boda'))).toBe(true);
    });
  });

  describe('isFormValid', () => {
    it('should return false for invalid form', () => {
      const invalidResponse: Partial<RSVPResponse> = {
        attendance: 'yes',
      };

      expect(RSVPValidation.isFormValid(invalidResponse)).toBe(false);
    });

    it('should return true for valid form', () => {
      const validResponse: Partial<RSVPResponse> = {
        displayName: 'María García',
        attendance: 'yes',
        nightsStaying: ['friday', 'saturday'],
        transportationNeeds: ['find_ride'],
        mainCoursePreference: 'fish',
      };

      expect(RSVPValidation.isFormValid(validResponse)).toBe(true);
    });
  });
});
