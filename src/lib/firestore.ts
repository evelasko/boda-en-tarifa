import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { app } from './firebase';
import { RSVPSubmission, RSVPResponse } from '@/types/rsvp';

// Initialize Firestore
export const db = getFirestore(app);

// Collection references
export const RSVP_COLLECTION = 'rsvp_responses';

// RSVP Operations
export class RSVPService {
  /**
   * Save or update RSVP response
   */
  static async saveRSVPResponse(
    userId: string, 
    userEmail: string, 
    userDisplayName: string, 
    responses: Partial<RSVPResponse>, 
    isSubmitted: boolean = false
  ): Promise<void> {
    try {
      const rsvpRef = doc(db, RSVP_COLLECTION, userId);
      const now = new Date();
      
      // Check if document exists to determine if this is an update
      const existingDoc = await getDoc(rsvpRef);
      const isUpdate = existingDoc.exists();
      
      // For updates, merge with existing responses
      let finalResponses: RSVPResponse;
      if (isUpdate) {
        const existingData = existingDoc.data() as RSVPSubmission;
        finalResponses = {
          ...existingData.responses,
          ...responses // Override with new values
        } as RSVPResponse;
      } else {
        // For new documents, we need all required fields
        if (isSubmitted && !RSVPValidation.isFormValid(responses)) {
          throw new Error('Cannot submit incomplete form');
        }
        finalResponses = responses as RSVPResponse;
      }
      
      const rsvpData: RSVPSubmission = {
        userId,
        userEmail,
        userDisplayName,
        responses: finalResponses,
        submittedAt: isUpdate ? existingDoc.data()?.submittedAt || now : now,
        lastUpdatedAt: now,
        isSubmitted,
        version: isUpdate ? (existingDoc.data()?.version || 0) + 1 : 1
      };

      if (isUpdate) {
        await updateDoc(rsvpRef, {
          ...rsvpData,
          lastUpdatedAt: serverTimestamp()
        });
      } else {
        await setDoc(rsvpRef, {
          ...rsvpData,
          submittedAt: serverTimestamp(),
          lastUpdatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving RSVP response:', error);
      throw new Error('No se pudo guardar la respuesta. Por favor, inténtalo de nuevo.');
    }
  }

  /**
   * Get RSVP response for a specific user
   * Returns null if no response exists (new user)
   */
  static async getRSVPResponse(userId: string): Promise<RSVPSubmission | null> {
    try {
      const rsvpRef = doc(db, RSVP_COLLECTION, userId);
      const rsvpSnap = await getDoc(rsvpRef);
      
      if (rsvpSnap.exists()) {
        const data = rsvpSnap.data();
        return {
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          lastUpdatedAt: data.lastUpdatedAt?.toDate() || new Date()
        } as RSVPSubmission;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting RSVP response:', error);
      throw new Error('No se pudo cargar la respuesta. Por favor, inténtalo de nuevo.');
    }
  }

  /**
   * Delete RSVP response
   */
  static async deleteRSVPResponse(userId: string): Promise<void> {
    try {
      const rsvpRef = doc(db, RSVP_COLLECTION, userId);
      await deleteDoc(rsvpRef);
    } catch (error) {
      console.error('Error deleting RSVP response:', error);
      throw new Error('No se pudo eliminar la respuesta. Por favor, inténtalo de nuevo.');
    }
  }

  /**
   * Get all RSVP responses (admin function)
   */
  static async getAllRSVPResponses(): Promise<RSVPSubmission[]> {
    try {
      const q = query(
        collection(db, RSVP_COLLECTION),
        orderBy('lastUpdatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          lastUpdatedAt: data.lastUpdatedAt?.toDate() || new Date()
        } as RSVPSubmission;
      });
    } catch (error) {
      console.error('Error getting all RSVP responses:', error);
      throw new Error('No se pudieron cargar las respuestas. Por favor, inténtalo de nuevo.');
    }
  }

  /**
   * Subscribe to real-time updates for a user's RSVP
   */
  static subscribeToRSVPResponse(
    userId: string, 
    callback: (rsvp: RSVPSubmission | null) => void
  ): () => void {
    const rsvpRef = doc(db, RSVP_COLLECTION, userId);
    
    return onSnapshot(rsvpRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const rsvp: RSVPSubmission = {
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          lastUpdatedAt: data.lastUpdatedAt?.toDate() || new Date()
        } as RSVPSubmission;
        callback(rsvp);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in RSVP subscription:', error);
      callback(null);
    });
  }

  /**
   * Get RSVP statistics (admin function)
   */
  static async getRSVPStatistics(): Promise<{
    totalResponses: number;
    attending: number;
    notAttending: number;
    maybe: number;
    submitted: number;
    drafts: number;
  }> {
    try {
      const allResponses = await this.getAllRSVPResponses();
      
      return {
        totalResponses: allResponses.length,
        attending: allResponses.filter(r => r.responses.attendance === 'yes').length,
        notAttending: allResponses.filter(r => r.responses.attendance === 'no').length,
        maybe: allResponses.filter(r => r.responses.attendance === 'maybe').length,
        submitted: allResponses.filter(r => r.isSubmitted).length,
        drafts: allResponses.filter(r => !r.isSubmitted).length
      };
    } catch (error) {
      console.error('Error getting RSVP statistics:', error);
      throw new Error('No se pudieron cargar las estadísticas. Por favor, inténtalo de nuevo.');
    }
  }
}

// Form validation utilities
export class RSVPValidation {
  /**
   * Validate RSVP response
   */
  static validateResponse(responses: Partial<RSVPResponse>): Record<string, string> {
    const errors: Record<string, string> = {};

    // Question 1: Attendance (required)
    if (!responses.attendance) {
      errors.attendance = 'Por favor, indica si vas a venir a la boda';
    }

    // Question 2: Accommodation management (required)
    if (!responses.accommodationManagement) {
      errors.accommodationManagement = 'Por favor, indica si quieres que gestionemos tu alojamiento';
    }

    // Question 3: Nights staying (required, at least one)
    if (!responses.nightsStaying || responses.nightsStaying.length === 0) {
      errors.nightsStaying = 'Por favor, selecciona al menos una noche';
    }

    // Question 3: Other nights combination (required if "other" is selected)
    if (responses.nightsStaying?.includes('other') && !responses.otherNightsCombination?.trim()) {
      errors.otherNightsCombination = 'Por favor, especifica tu combinación de noches';
    }

    // Question 4: Room sharing (required)
    if (!responses.roomSharing?.trim()) {
      errors.roomSharing = 'Por favor, indica con quién compartes habitación';
    }

    // Question 5: Transportation needs (required, at least one)
    if (!responses.transportationNeeds || responses.transportationNeeds.length === 0) {
      errors.transportationNeeds = 'Por favor, selecciona al menos una opción de transporte';
    }

    // Question 7: Main course preference (required)
    if (!responses.mainCoursePreference) {
      errors.mainCoursePreference = 'Por favor, selecciona tu preferencia para el plato principal';
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

  /**
   * Get field-specific error message
   */
  static getFieldError(field: keyof RSVPResponse, responses: Partial<RSVPResponse>): string {
    const errors = this.validateResponse(responses);
    return errors[field] || '';
  }
}

// Utility function to clean responses by removing undefined values
function cleanRSVPResponse(responses: Partial<RSVPResponse>): Partial<RSVPResponse> {
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

// Auto-save utilities
export class AutoSaveService {
  private static saveTimeout: NodeJS.Timeout | null = null;
  private static isSaving = false;

  /**
   * Schedule auto-save
   */
  static scheduleAutoSave(
    userId: string,
    userEmail: string,
    userDisplayName: string,
    responses: Partial<RSVPResponse>,
    delay: number = 30000
  ): void {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Schedule new save
    this.saveTimeout = setTimeout(async () => {
      if (!this.isSaving && this.isDirty(responses)) {
        await this.performAutoSave(userId, userEmail, userDisplayName, responses);
      }
    }, delay);
  }

  /**
   * Cancel auto-save
   */
  static cancelAutoSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  /**
   * Check if responses have changes worth saving
   */
  private static isDirty(responses: Partial<RSVPResponse>): boolean {
    // Check if any field has a value
    return Object.values(responses).some(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
  }

  /**
   * Perform auto-save
   */
  private static async performAutoSave(
    userId: string,
    userEmail: string,
    userDisplayName: string,
    responses: Partial<RSVPResponse>
  ): Promise<void> {
    if (this.isSaving) return;

    this.isSaving = true;
    try {
      // Only save if we have valid data
      if (this.isDirty(responses)) {
        const cleanedResponses = cleanRSVPResponse(responses);
        
        // Only proceed if we have some actual data to save
        if (Object.keys(cleanedResponses).length > 0) {
          await RSVPService.saveRSVPResponse(
            userId,
            userEmail,
            userDisplayName,
            cleanedResponses as RSVPResponse,
            false // Auto-save is always a draft
          );
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't throw error for auto-save failures
    } finally {
      this.isSaving = false;
    }
  }
}
