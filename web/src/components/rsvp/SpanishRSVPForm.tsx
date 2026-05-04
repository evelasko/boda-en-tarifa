'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { AttendanceStatus, MainCoursePreference, NightOption, RSVPResponse, RSVPSubmission, TransportationNeed } from '@/types/rsvp';
import { useRSVPForm } from '@/lib/hooks/useRSVPForm';
import { RSVPService, RSVPValidation } from '@/lib/firestore';
import { 
  captureRSVPError, 
  addSentryBreadcrumb,
  withSentrySpan 
} from '@/lib/sentry-helpers';

// Form components
import { RadioGroup } from './RadioGroup';
import { CheckboxGroup } from './CheckboxGroup';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { ConditionalField } from './ConditionalField';
import { FormProgress } from './FormProgress';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { auth } from '@/lib/firebase';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SpanishRSVPFormProps {
  user: User;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function SpanishRSVPForm({ user, onSuccess, onError }: SpanishRSVPFormProps) {
  const router = useRouter();
  const [initialData, setInitialData] = useState<RSVPSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const {
    responses,
    errors,
    isDirty,
    isValid,
    isSaving,
    lastSavedAt,
    isSubmitted,
    updateField,
    submitForm,
  } = useRSVPForm({ user, initialData: isLoading ? undefined : initialData });

  const blockingMessages = useMemo(
    () => RSVPValidation.listBlockingMessages(responses),
    [responses]
  );
  const showSubmitHint = !isValid && !isSaving && blockingMessages.length > 0;

  // Load existing data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Add breadcrumb for loading attempt
        addSentryBreadcrumb(
          'RSVP form component loading data',
          'rsvp.component',
          'info',
          { user_id: user.uid }
        );
        
        const existingData = await withSentrySpan(
          'Load RSVP Form Data',
          'rsvp.component.load',
          async () => {
            return await RSVPService.getRSVPResponse(user.uid);
          }
        );
        
        setInitialData(existingData); // This can be null for new users, which is fine
        
        // Track successful load
        addSentryBreadcrumb(
          'RSVP form data loaded',
          'rsvp.component',
          'info',
          { 
            user_id: user.uid,
            has_data: !!existingData,
            is_submitted: existingData?.isSubmitted,
          }
        );
      } catch (error) {
        console.error('Failed to load existing data:', error);
        
        // Capture load error
        captureRSVPError(
          error as Error,
          'load',
          undefined,
          {
            user_id: user.uid,
            user_email: user.email,
            component: 'SpanishRSVPForm',
          }
        );
        
        // Only show error to user for actual network/server errors, not for "no data found"
        onError?.('No se pudo cargar los datos existentes');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user.uid, user.email, onError]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track form submission attempt
    addSentryBreadcrumb(
      'RSVP form submit button clicked',
      'rsvp.component',
      'info',
      { 
        user_id: user.uid,
        is_valid: isValid,
        is_dirty: isDirty,
      }
    );
    
    const success = await submitForm();
    if (success) {
      setShowSuccessMessage(true);
      onSuccess?.();
      
      // Track successful submission
      addSentryBreadcrumb(
        'RSVP form submitted successfully',
        'rsvp.component',
        'info',
        { user_id: user.uid }
      );
    } else {
      // Track failed submission
      addSentryBreadcrumb(
        'RSVP form submission failed',
        'rsvp.component',
        'error',
        { 
          user_id: user.uid,
          has_errors: Object.keys(errors).length > 0,
        }
      );
    }
  };

  // Handle cancel - navigate back to home page
  const handleCancel = () => {
    // Track form cancellation
    addSentryBreadcrumb(
      'RSVP form cancelled',
      'rsvp.component',
      'info',
      { 
        user_id: user.uid,
        was_dirty: isDirty,
        was_submitted: isSubmitted,
      }
    );
    
    auth.signOut().then(() => {
      router.push('/');
    }).catch((error) => {
      console.error('Error signing out:', error);
      // Still navigate even if signout fails
      router.push('/');
    });
  };

  // Handle field updates
  const handleFieldUpdate = <K extends keyof typeof responses>(
    field: K,
    value: typeof responses[K]
  ) => {
    updateField(field, value as RSVPResponse[K]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="ml-3 text-gray-600">Cargando formulario...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Respuesta enviada con éxito!
              </h2>
              <p className="text-gray-600">
                Gracias por confirmar tu asistencia. Te esperamos en nuestra boda.
              </p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Editar respuesta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Confirmar Asistencia
            </h1>
            <p className="text-gray-600 mb-4">
              ¡Hola {responses.displayName?.trim() || user.displayName || user.email}! Por favor,
              confirma tu asistencia a nuestra boda.
            </p>
            
            {/* Progress and Auto-save indicators */}
            <div className="space-y-4">
              <FormProgress responses={responses} />
              <AutoSaveIndicator 
                isSaving={isSaving}
                lastSavedAt={lastSavedAt}
                isDirty={isDirty}
              />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <TextInput
              name="displayName"
              label="Tu nombre (como quieres que aparezca en la lista)"
              required
              error={errors.displayName}
              value={responses.displayName || ''}
              onChange={(value) => handleFieldUpdate('displayName', value)}
              placeholder="Nombre y apellidos"
              maxLength={120}
            />

            {/* Question 1: ¿Vas a venir a la boda? */}
            <RadioGroup
              name="attendance"
              label="¿Vas a venir a la boda?"
              required
              error={errors.attendance}
              options={[
                { value: 'yes', label: 'Sí, claro' },
                { value: 'no', label: 'No puedo asistir' },
                { value: 'maybe', label: 'Aún no lo sé, os diré antes del 30 de abril' }
              ]}
              value={responses.attendance}
              onChange={(value) => value && handleFieldUpdate('attendance', value as AttendanceStatus)}
            />

            {/* Question 2: ¿Qué noches te quedarás en Cádiz? */}
            <CheckboxGroup
              name="nightsStaying"
              label="¿Qué noches te quedarás en Cádiz? (Marca todas las que correspondan)"
              required
              error={errors.nightsStaying}
              options={[
                { value: 'friday', label: 'Viernes' },
                { value: 'saturday', label: 'Sábado' },
                { value: 'sunday', label: 'Domingo (me quedo y me vuelvo el lunes)' },
                { value: 'other', label: 'Otra combinación (especificar más abajo)' }
              ]}
              value={responses.nightsStaying || []}
              onChange={(value) => handleFieldUpdate('nightsStaying', value as NightOption[])}
            />

            {/* Question 2b: Other nights combination (conditional) */}
            <ConditionalField 
              condition={responses.nightsStaying?.includes('other') || false}
            >
              <TextInput
                name="otherNightsCombination"
                label="Especifica tu combinación de noches"
                error={errors.otherNightsCombination}
                value={responses.otherNightsCombination || ''}
                onChange={(value) => handleFieldUpdate('otherNightsCombination', value)}
                placeholder="Describe tu combinación de noches..."
                maxLength={200}
              />
            </ConditionalField>

            {/* Question 3: ¿Con quién compartes habitación? */}
            <TextInput
              name="roomSharing"
              label="¿Con quién compartes habitación? (Escribe su nombre o indica si no lo sabes aún o si deseas habitación individual)"
              error={errors.roomSharing}
              value={responses.roomSharing || ''}
              onChange={(value) => handleFieldUpdate('roomSharing', value)}
              placeholder="Nombre de la persona o indicar si no lo sabes aún..."
              maxLength={100}
            />

            {/* Question 4: ¿Necesitas ayuda con el transporte? */}
            <CheckboxGroup
              name="transportationNeeds"
              label="¿Necesitas ayuda con el transporte? (Marca lo que se aplique)"
              required
              error={errors.transportationNeeds}
              options={[
                { value: 'find_ride', label: 'Sí, me vendría bien que me ayudéis a encontrar plaza con alguien' },
                { value: 'offer_ride', label: 'Yo tengo coche y podría compartir con otros' },
                { value: 'no_help', label: 'No necesito ayuda con el transporte' },
                { value: 'not_sure', label: 'No lo sé todavía' }
              ]}
              value={responses.transportationNeeds || []}
              onChange={(value) => handleFieldUpdate('transportationNeeds', value as TransportationNeed[])}
            />

            {/* Question 5: ¿Tienes alguna alergia, intolerancia o necesidad alimentaria? */}
            <TextArea
              name="dietaryRestrictions"
              label="¿Tienes alguna alergia, intolerancia o necesidad alimentaria?"
              value={responses.dietaryRestrictions || ''}
              onChange={(value) => handleFieldUpdate('dietaryRestrictions', value)}
              placeholder="Describe cualquier alergia, intolerancia o necesidad alimentaria..."
              maxLength={500}
              rows={3}
            />

            {/* Question 6: ¿Qué prefieres para el plato principal? */}
            <RadioGroup
              name="mainCoursePreference"
              label="¿Qué prefieres para el plato principal?"
              required
              error={errors.mainCoursePreference}
              options={[
                { value: 'fish', label: 'Pescado' },
                { value: 'meat', label: 'Carne' },
                { value: 'vegetarian', label: 'Opción vegetariana' },
              ]}
              value={responses.mainCoursePreference}
              onChange={(value) =>
                value && handleFieldUpdate('mainCoursePreference', value as MainCoursePreference)
              }
            />

            {/* Question 7: Brunch del domingo (optional) */}
            <div
              className={cn(
                'flex items-start gap-3 p-3 my-12 rounded-lg border border-gray-200',
                'hover:border-gray-300 hover:bg-gray-50 transition-colors'
              )}
            >
              <Checkbox
                id="sundayBrunch"
                checked={responses.sundayBrunch === true}
                onCheckedChange={(checked) =>
                  handleFieldUpdate('sundayBrunch', checked === true)
                }
                className="mt-1"
              />
              <label
                htmlFor="sundayBrunch"
                className="text-sm text-gray-700 leading-relaxed cursor-pointer select-none"
              >
                ¿Contamos contigo para el brunch del domingo?
              </label>
            </div>

            {/* Submit and Cancel buttons */}
            <div className="pt-6 border-t border-gray-200">
              <TooltipProvider delayDuration={250}>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-500 sm:order-1">
                      {isSubmitted ? 'Respuesta enviada' : 'Borrador guardado automáticamente'}
                    </div>
                    <div className="flex justify-end gap-3 sm:order-2">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-3 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                      >
                        Cancelar
                      </button>
                      {showSubmitHint ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              tabIndex={0}
                              className="inline-flex rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                            >
                              <button
                                type="submit"
                                disabled
                                aria-describedby="rsvp-submit-blocking-hint"
                                className="bg-blue-600 text-white px-8 py-3 rounded-md opacity-50 cursor-not-allowed"
                              >
                                {isSubmitted ? 'Actualizar respuesta' : 'Enviar respuesta'}
                              </button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="end" className="max-w-[min(20rem,calc(100vw-2rem))]">
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-charcoal/80">
                              Falta por completar
                            </p>
                            <ul className="list-disc space-y-1 pl-4 text-left text-sm text-charcoal">
                              {blockingMessages.map((msg, i) => (
                                <li key={`${i}-${msg.slice(0, 24)}`}>{msg}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <button
                          type="submit"
                          disabled={!isValid || isSaving}
                          className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? 'Enviando...' : isSubmitted ? 'Actualizar respuesta' : 'Enviar respuesta'}
                        </button>
                      )}
                    </div>
                  </div>
                  {showSubmitHint && (
                    <div
                      id="rsvp-submit-blocking-hint"
                      role="status"
                      aria-live="polite"
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 sm:ml-auto sm:max-w-xl sm:text-right"
                    >
                      <p className="font-medium sm:text-right">Aún no puedes enviar el formulario</p>
                      <ul className="mt-1 list-inside list-disc space-y-0.5 text-red-800 sm:ml-auto sm:inline-block sm:text-left">
                        {blockingMessages.map((msg, i) => (
                          <li key={`${i}-${msg.slice(0, 24)}`}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
