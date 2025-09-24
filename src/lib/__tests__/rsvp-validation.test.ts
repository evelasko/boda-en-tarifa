import { RSVPValidation } from '../firestore';
import { RSVPResponse } from '@/types/rsvp';

describe('RSVP Validation', () => {
  describe('validateResponse', () => {
    it('should return errors for empty form', () => {
      const emptyResponse: Partial<RSVPResponse> = {};
      const errors = RSVPValidation.validateResponse(emptyResponse);
      
      expect(errors).toHaveProperty('attendance');
      expect(errors).toHaveProperty('accommodationManagement');
      expect(errors).toHaveProperty('nightsStaying');
      expect(errors).toHaveProperty('roomSharing');
      expect(errors).toHaveProperty('transportationNeeds');
      expect(errors).toHaveProperty('mainCoursePreference');
    });

    it('should return no errors for complete valid form', () => {
      const completeResponse: Partial<RSVPResponse> = {
        attendance: 'yes',
        accommodationManagement: 'yes',
        nightsStaying: ['friday', 'saturday'],
        roomSharing: 'Juan Pérez',
        transportationNeeds: ['find_ride'],
        mainCoursePreference: 'fish'
      };
      
      const errors = RSVPValidation.validateResponse(completeResponse);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should require otherNightsCombination when other is selected', () => {
      const response: Partial<RSVPResponse> = {
        attendance: 'yes',
        accommodationManagement: 'yes',
        nightsStaying: ['other'],
        roomSharing: 'Juan Pérez',
        transportationNeeds: ['find_ride'],
        mainCoursePreference: 'fish'
      };
      
      const errors = RSVPValidation.validateResponse(response);
      expect(errors).toHaveProperty('otherNightsCombination');
    });

    it('should not require otherNightsCombination when other is not selected', () => {
      const response: Partial<RSVPResponse> = {
        attendance: 'yes',
        accommodationManagement: 'yes',
        nightsStaying: ['friday', 'saturday'],
        roomSharing: 'Juan Pérez',
        transportationNeeds: ['find_ride'],
        mainCoursePreference: 'fish'
      };
      
      const errors = RSVPValidation.validateResponse(response);
      expect(errors).not.toHaveProperty('otherNightsCombination');
    });
  });

  describe('isFormValid', () => {
    it('should return false for invalid form', () => {
      const invalidResponse: Partial<RSVPResponse> = {
        attendance: 'yes'
        // Missing other required fields
      };
      
      expect(RSVPValidation.isFormValid(invalidResponse)).toBe(false);
    });

    it('should return true for valid form', () => {
      const validResponse: Partial<RSVPResponse> = {
        attendance: 'yes',
        accommodationManagement: 'yes',
        nightsStaying: ['friday', 'saturday'],
        roomSharing: 'Juan Pérez',
        transportationNeeds: ['find_ride'],
        mainCoursePreference: 'fish'
      };
      
      expect(RSVPValidation.isFormValid(validResponse)).toBe(true);
    });
  });
});
