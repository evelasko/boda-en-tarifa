'use client';

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { AccommodationManagement, AttendanceStatus, MainCoursePreference, NightOption, RSVPResponse, RSVPSubmission, TransportationNeed } from '@/types/rsvp';
import { useRSVPForm } from '@/lib/hooks/useRSVPForm';
import { RSVPService } from '@/lib/firestore';

// Form components
import { RadioGroup } from './RadioGroup';
import { CheckboxGroup } from './CheckboxGroup';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { ConditionalField } from './ConditionalField';
import { FormProgress } from './FormProgress';
import { AutoSaveIndicator } from './AutoSaveIndicator';

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
  } = useRSVPForm({ user, initialData });

  // Load existing data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const existingData = await RSVPService.getRSVPResponse(user.uid);
        setInitialData(existingData); // This can be null for new users, which is fine
      } catch (error) {
        console.error('Failed to load existing data:', error);
        // Only show error to user for actual network/server errors, not for "no data found"
        onError?.('No se pudo cargar los datos existentes');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user.uid, onError]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await submitForm();
    if (success) {
      setShowSuccessMessage(true);
      onSuccess?.();
    }
  };

  // Handle cancel - navigate back to home page
  const handleCancel = () => {
    router.push('/');
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
              ¡Hola {user.displayName || user.email}! Por favor, confirma tu asistencia a nuestra boda.
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

            {/* Question 2: ¿Quieres que te gestionemos el alojamiento? */}
            <RadioGroup
              name="accommodationManagement"
              label="¿Quieres que te gestionemos el alojamiento?"
              required
              error={errors.accommodationManagement}
              options={[
                { value: 'yes', label: 'Sí, quiero que me lo gestionéis' },
                { value: 'no', label: 'No, me lo gestiono por mi cuenta' }
              ]}
              value={responses.accommodationManagement}
              onChange={(value) => value && handleFieldUpdate('accommodationManagement', value as AccommodationManagement)}
            />

            {/* Question 3: ¿Qué noches te quedarás en Cádiz? */}
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

            {/* Question 3b: Other nights combination (conditional) */}
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

            {/* Question 4: ¿Con quién compartes habitación? */}
            <TextInput
              name="roomSharing"
              label="¿Con quién compartes habitación? (Escribe su nombre o indica si no lo sabes aún o si deseas habitación individual)"
              required
              error={errors.roomSharing}
              value={responses.roomSharing || ''}
              onChange={(value) => handleFieldUpdate('roomSharing', value)}
              placeholder="Nombre de la persona o indicar si no lo sabes aún..."
              maxLength={100}
            />

            {/* Question 5: ¿Necesitas ayuda con el transporte? */}
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

            {/* Question 6: ¿Tienes alguna alergia, intolerancia o necesidad alimentaria? */}
            <TextArea
              name="dietaryRestrictions"
              label="¿Tienes alguna alergia, intolerancia o necesidad alimentaria?"
              value={responses.dietaryRestrictions || ''}
              onChange={(value) => handleFieldUpdate('dietaryRestrictions', value)}
              placeholder="Describe cualquier alergia, intolerancia o necesidad alimentaria..."
              maxLength={500}
              rows={3}
            />

            {/* Question 7: ¿Qué prefieres para el plato principal? */}
            <RadioGroup
              name="mainCoursePreference"
              label="¿Qué prefieres para el plato principal?"
              required
              error={errors.mainCoursePreference}
              options={[
                { value: 'fish', label: 'Pescado' },
                { value: 'meat', label: 'Carne' },
                { value: 'vegetarian', label: 'Opción vegetariana' },
                { value: 'no_preference', label: 'No tengo preferencia' }
              ]}
              value={responses.mainCoursePreference}
              onChange={(value) => value && handleFieldUpdate('mainCoursePreference', value as MainCoursePreference)}
            />

            {/* Submit and Cancel buttons */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {isSubmitted ? 'Respuesta enviada' : 'Borrador guardado automáticamente'}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid || isSaving}
                    className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Enviando...' : isSubmitted ? 'Actualizar respuesta' : 'Enviar respuesta'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
