'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { RSVPResponse, RSVPSubmission, DEFAULT_RSVP_RESPONSE, AUTO_SAVE_CONFIG } from '@/types/rsvp';
import { RSVPService, RSVPValidation } from '@/lib/firestore';
import { 
  captureRSVPError, 
  trackFormFieldInteraction, 
  withSentrySpan,
  addSentryBreadcrumb 
} from '@/lib/sentry-helpers';

interface UseRSVPFormProps {
  user: User;
  initialData?: RSVPSubmission | null;
}

interface UseRSVPFormReturn {
  // Form state
  responses: Partial<RSVPResponse>;
  errors: Record<string, string>;
  isDirty: boolean;
  isValid: boolean;
  isSaving: boolean;
  lastSavedAt?: Date;
  isSubmitted: boolean;
  hasValidated: boolean;
  
  // Form actions
  updateField: <K extends keyof RSVPResponse>(field: K, value: RSVPResponse[K]) => void;
  submitForm: () => Promise<boolean>;
  resetForm: () => void;
  loadExistingData: () => Promise<void>;
  validateForm: () => void;
  
  // Auto-save
  enableAutoSave: () => void;
  disableAutoSave: () => void;
}

export function useRSVPForm({ user, initialData }: UseRSVPFormProps): UseRSVPFormReturn {
  // Form state
  const [responses, setResponses] = useState<Partial<RSVPResponse>>(DEFAULT_RSVP_RESPONSE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  
  // Auto-save state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(AUTO_SAVE_CONFIG.enabled);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<Partial<RSVPResponse>>(DEFAULT_RSVP_RESPONSE);
  
  // Load initial data
  useEffect(() => {
    if (initialData) {
      setResponses(initialData.responses);
      setIsSubmitted(initialData.isSubmitted);
      setLastSavedAt(initialData.lastUpdatedAt);
      lastSavedDataRef.current = initialData.responses;
    }
  }, [initialData]);
  
  // Validate form whenever responses change (but only show errors after validation has been triggered)
  useEffect(() => {
    const newErrors = RSVPValidation.validateResponse(responses);
    setErrors(newErrors);
    
    // Check if form is dirty
    const isFormDirty = JSON.stringify(responses) !== JSON.stringify(lastSavedDataRef.current);
    setIsDirty(isFormDirty);
  }, [responses]);

  // Validate form when hasValidated changes
  useEffect(() => {
    if (hasValidated) {
      const newErrors = RSVPValidation.validateResponse(responses);
      setErrors(newErrors);
    }
  }, [hasValidated, responses]);
  
  // Perform auto-save
  const performAutoSave = useCallback(async () => {
    if (isSaving || !isDirty) return;
    
    setIsSaving(true);
    
    // Add breadcrumb for auto-save attempt
    addSentryBreadcrumb(
      'RSVP auto-save started',
      'rsvp.autosave',
      'info',
      { 
        user_id: user.uid,
        field_count: Object.keys(responses).filter(k => responses[k as keyof RSVPResponse] !== undefined).length
      }
    );
    
    try {
      await withSentrySpan(
        'RSVP Auto-Save',
        'rsvp.autosave',
        async () => {
          await RSVPService.saveRSVPResponse(
            user.uid,
            user.email || '',
            user.displayName || '',
            responses as RSVPResponse,
            false // Auto-save is always a draft
          );
        },
        { operation: 'auto_save' }
      );
      
      setLastSavedAt(new Date());
      lastSavedDataRef.current = { ...responses };
      setIsDirty(false);
      
      // Track successful auto-save
      addSentryBreadcrumb(
        'RSVP auto-save successful',
        'rsvp.autosave',
        'info'
      );
    } catch (error) {
      console.error('Auto-save failed:', error);
      
      // Capture auto-save error in Sentry
      const fieldCount = Object.keys(responses).filter(
        k => responses[k as keyof RSVPResponse] !== undefined
      ).length;
      
      captureRSVPError(
        error as Error,
        'auto_save',
        {
          isDirty,
          fieldCount,
        },
        {
          user_id: user.uid,
          user_email: user.email,
        }
      );
      
      // Don't show error to user for auto-save failures
    } finally {
      setIsSaving(false);
    }
  }, [user, responses, isSaving, isDirty]);
    
  // Auto-save effect
  useEffect(() => {
    if (autoSaveEnabled && isDirty && !isSaving) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Schedule new auto-save
      autoSaveTimeoutRef.current = setTimeout(async () => {
        await performAutoSave();
      }, AUTO_SAVE_CONFIG.intervalMs);
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [responses, autoSaveEnabled, isDirty, isSaving, performAutoSave]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);
  
  // Update field value
  const updateField = useCallback(<K extends keyof RSVPResponse>(
    field: K, 
    value: RSVPResponse[K] | undefined
  ) => {
    // Track form field interaction
    trackFormFieldInteraction(field, 'change', value);
    
    setResponses(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Validate form manually
  const validateForm = useCallback(() => {
    setHasValidated(true);
    const validationErrors = RSVPValidation.validateResponse(responses);
    setErrors(validationErrors);
  }, [responses]);

  // Submit form
  const submitForm = useCallback(async (): Promise<boolean> => {
    // Trigger validation
    setHasValidated(true);
    const validationErrors = RSVPValidation.validateResponse(responses);
    
    // Add breadcrumb for submission attempt
    addSentryBreadcrumb(
      'RSVP form submission started',
      'rsvp.submit',
      'info',
      {
        user_id: user.uid,
        has_validation_errors: Object.keys(validationErrors).length > 0,
        error_count: Object.keys(validationErrors).length,
      }
    );
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Track validation failure
      captureRSVPError(
        new Error('Form validation failed'),
        'validate',
        {
          isValid: false,
          fieldCount: Object.keys(responses).length,
          errors: validationErrors,
        },
        {
          user_id: user.uid,
          validation_error_fields: Object.keys(validationErrors),
        }
      );
      
      return false;
    }
    
    setIsSaving(true);
    try {
      await withSentrySpan(
        'RSVP Form Submit',
        'rsvp.submit',
        async () => {
          await RSVPService.saveRSVPResponse(
            user.uid,
            user.email || '',
            user.displayName || '',
            responses as RSVPResponse,
            true // This is a final submission
          );
        },
        { operation: 'submit' }
      );
      
      setLastSavedAt(new Date());
      lastSavedDataRef.current = { ...responses };
      setIsDirty(false);
      setIsSubmitted(true);
      
      // Track successful submission
      addSentryBreadcrumb(
        'RSVP form submitted successfully',
        'rsvp.submit',
        'info',
        { user_id: user.uid }
      );
      
      return true;
    } catch (error) {
      console.error('Submit failed:', error);
      
      // Capture submission error in Sentry
      captureRSVPError(
        error as Error,
        'submit',
        {
          isValid: true,
          isDirty,
          fieldCount: Object.keys(responses).length,
        },
        {
          user_id: user.uid,
          user_email: user.email,
        }
      );
      
      setErrors({ submit: 'No se pudo enviar la respuesta. Por favor, inténtalo de nuevo.' });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, responses, isDirty]);
  
  // Reset form
  const resetForm = useCallback(() => {
    setResponses(DEFAULT_RSVP_RESPONSE);
    setErrors({});
    setIsDirty(false);
    setIsSubmitted(false);
    lastSavedDataRef.current = DEFAULT_RSVP_RESPONSE;
  }, []);
  
  // Load existing data
  const loadExistingData = useCallback(async () => {
    try {
      addSentryBreadcrumb(
        'Loading existing RSVP data',
        'rsvp.load',
        'info',
        { user_id: user.uid }
      );
      
      const existingData = await withSentrySpan(
        'Load RSVP Data',
        'rsvp.load',
        async () => {
          return await RSVPService.getRSVPResponse(user.uid);
        }
      );
      
      if (existingData) {
        setResponses(existingData.responses);
        setIsSubmitted(existingData.isSubmitted);
        setLastSavedAt(existingData.lastUpdatedAt);
        lastSavedDataRef.current = existingData.responses;
        
        addSentryBreadcrumb(
          'RSVP data loaded successfully',
          'rsvp.load',
          'info',
          { 
            user_id: user.uid,
            is_submitted: existingData.isSubmitted,
            field_count: Object.keys(existingData.responses).length,
          }
        );
      }
    } catch (error) {
      console.error('Failed to load existing data:', error);
      
      // Capture load error in Sentry
      captureRSVPError(
        error as Error,
        'load',
        undefined,
        {
          user_id: user.uid,
        }
      );
    }
  }, [user.uid]);
  
  // Enable auto-save
  const enableAutoSave = useCallback(() => {
    setAutoSaveEnabled(true);
  }, []);
  
  // Disable auto-save
  const disableAutoSave = useCallback(() => {
    setAutoSaveEnabled(false);
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  }, []);
  
  // Computed values
  const isValid = RSVPValidation.isFormValid(responses);
  
  return {
    // Form state
    responses,
    errors: hasValidated ? errors : {}, // Only show errors after validation has been triggered
    isDirty,
    isValid,
    isSaving,
    lastSavedAt,
    isSubmitted,
    hasValidated,
    
    // Form actions
    updateField,
    submitForm,
    resetForm,
    loadExistingData,
    validateForm,
    
    // Auto-save
    enableAutoSave,
    disableAutoSave
  };
}
