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
import { RSVPValidation, cleanRSVPResponse } from '@/lib/rsvp-validation';
import { 
  captureFirestoreError, 
  addSentryBreadcrumb,
  withSentrySpan 
} from './sentry-helpers';

export { RSVPValidation, cleanRSVPResponse } from '@/lib/rsvp-validation';

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
      // Add breadcrumb
      addSentryBreadcrumb(
        `Saving RSVP response for user ${userId}`,
        'firestore.rsvp',
        'info',
        { 
          user_id: userId,
          is_submitted: isSubmitted,
          field_count: Object.keys(responses).length,
        }
      );
      
      // Clean responses to remove undefined values before saving
      const cleanedResponses = cleanRSVPResponse(responses);
      
      await withSentrySpan(
        'Save RSVP Response',
        'firestore.write',
        async () => {
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
              ...cleanedResponses // Override with new cleaned values
            } as RSVPResponse;
          } else {
            // For new documents, we need all required fields
            if (isSubmitted && !RSVPValidation.isFormValid(cleanedResponses)) {
              throw new Error('Cannot submit incomplete form');
            }
            finalResponses = cleanedResponses as RSVPResponse;
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
          
          // Track successful save
          addSentryBreadcrumb(
            `RSVP response saved successfully`,
            'firestore.rsvp',
            'info',
            { 
              user_id: userId,
              is_update: isUpdate,
              is_submitted: isSubmitted,
            }
          );
        },
        { operation: isSubmitted ? 'submit' : 'save' }
      );
    } catch (error) {
      console.error('Error saving RSVP response:', error);
      
      // Capture error in Sentry
      captureFirestoreError(
        error as Error,
        'write',
        RSVP_COLLECTION,
        userId,
        {
          user_id: userId,
          user_email: userEmail,
          is_submitted: isSubmitted,
          field_count: Object.keys(responses).length,
        }
      );
      
      throw new Error('No se pudo guardar la respuesta. Por favor, inténtalo de nuevo.');
    }
  }

  /**
   * Get RSVP response for a specific user
   * Returns null if no response exists (new user)
   */
  static async getRSVPResponse(userId: string): Promise<RSVPSubmission | null> {
    try {
      // Add breadcrumb
      addSentryBreadcrumb(
        `Getting RSVP response for user ${userId}`,
        'firestore.rsvp',
        'info',
        { user_id: userId }
      );
      
      const result = await withSentrySpan(
        'Get RSVP Response',
        'firestore.read',
        async () => {
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
        }
      );
      
      // Track result
      addSentryBreadcrumb(
        `RSVP response retrieved`,
        'firestore.rsvp',
        'info',
        { 
          user_id: userId,
          found: !!result,
          is_submitted: result?.isSubmitted,
        }
      );
      
      return result;
    } catch (error) {
      console.error('Error getting RSVP response:', error);
      
      // Capture error in Sentry
      captureFirestoreError(
        error as Error,
        'read',
        RSVP_COLLECTION,
        userId,
        { user_id: userId }
      );
      
      throw new Error('No se pudo cargar la respuesta. Por favor, inténtalo de nuevo.');
    }
  }

  /**
   * Delete RSVP response
   */
  static async deleteRSVPResponse(userId: string): Promise<void> {
    try {
      // Add breadcrumb
      addSentryBreadcrumb(
        `Deleting RSVP response for user ${userId}`,
        'firestore.rsvp',
        'info',
        { user_id: userId }
      );
      
      await withSentrySpan(
        'Delete RSVP Response',
        'firestore.delete',
        async () => {
          const rsvpRef = doc(db, RSVP_COLLECTION, userId);
          await deleteDoc(rsvpRef);
        }
      );
      
      // Track successful deletion
      addSentryBreadcrumb(
        `RSVP response deleted successfully`,
        'firestore.rsvp',
        'info',
        { user_id: userId }
      );
    } catch (error) {
      console.error('Error deleting RSVP response:', error);
      
      // Capture error in Sentry
      captureFirestoreError(
        error as Error,
        'delete',
        RSVP_COLLECTION,
        userId,
        { user_id: userId }
      );
      
      throw new Error('No se pudo eliminar la respuesta. Por favor, inténtalo de nuevo.');
    }
  }

  /**
   * Get all RSVP responses (admin function)
   */
  static async getAllRSVPResponses(): Promise<RSVPSubmission[]> {
    try {
      // Add breadcrumb
      addSentryBreadcrumb(
        'Getting all RSVP responses',
        'firestore.rsvp',
        'info'
      );
      
      const results = await withSentrySpan(
        'Get All RSVP Responses',
        'firestore.read',
        async () => {
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
        }
      );
      
      // Track result
      addSentryBreadcrumb(
        'All RSVP responses retrieved',
        'firestore.rsvp',
        'info',
        { count: results.length }
      );
      
      return results;
    } catch (error) {
      console.error('Error getting all RSVP responses:', error);
      
      // Capture error in Sentry
      captureFirestoreError(
        error as Error,
        'read',
        RSVP_COLLECTION,
        undefined,
        { operation: 'get_all' }
      );
      
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
    // Add breadcrumb
    addSentryBreadcrumb(
      `Subscribing to RSVP updates for user ${userId}`,
      'firestore.rsvp',
      'info',
      { user_id: userId }
    );
    
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
      
      // Capture subscription error in Sentry
      captureFirestoreError(
        error as Error,
        'subscribe',
        RSVP_COLLECTION,
        userId,
        { 
          user_id: userId,
          error_type: 'subscription',
        }
      );
      
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
