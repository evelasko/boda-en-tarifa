/**
 * Type definitions for Spanish Wedding RSVP Form
 */

// Question 1: ¿Vas a venir a la boda?
export type AttendanceStatus = 'yes' | 'no' | 'maybe';

// Question 2: ¿Quieres que te gestionemos el alojamiento?
export type AccommodationManagement = 'yes' | 'no';

// Question 3: ¿Qué noches te quedarás en Cádiz?
export type NightOption = 'friday' | 'saturday' | 'sunday' | 'other';

// Question 5: ¿Necesitas ayuda con el transporte?
export type TransportationNeed = 'find_ride' | 'offer_ride' | 'no_help' | 'not_sure';

// Question 7: ¿Qué prefieres para el plato principal?
export type MainCoursePreference = 'fish' | 'meat' | 'vegetarian' | 'no_preference';

// Individual RSVP response structure
export interface RSVPResponse {
  // Question 1: ¿Vas a venir a la boda?
  attendance: AttendanceStatus;
  
  // Question 2: ¿Quieres que te gestionemos el alojamiento?
  accommodationManagement: AccommodationManagement;
  
  // Question 3: ¿Qué noches te quedarás en Cádiz?
  nightsStaying: NightOption[];
  otherNightsCombination?: string; // Text input for "otra combinación"
  
  // Question 4: ¿Con quién compartes habitación?
  roomSharing: string;
  
  // Question 5: ¿Necesitas ayuda con el transporte?
  transportationNeeds: TransportationNeed[];
  
  // Question 6: ¿Tienes alguna alergia, intolerancia o necesidad alimentaria?
  dietaryRestrictions: string;
  
  // Question 7: ¿Qué prefieres para el plato principal?
  mainCoursePreference: MainCoursePreference;
}

// Complete RSVP submission with metadata
export interface RSVPSubmission {
  // User identification
  userId: string;
  userEmail: string;
  userDisplayName: string;
  
  // RSVP responses
  responses: RSVPResponse;
  
  // Metadata
  submittedAt: Date;
  lastUpdatedAt: Date;
  isSubmitted: boolean; // true when user clicks submit, false for drafts
  version: number; // for tracking edits
}

// Form state for real-time management
export interface RSVPFormState {
  responses: Partial<RSVPResponse>;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt?: Date;
  errors: Record<string, string>;
  isValid: boolean;
}

// Validation error structure
export interface RSVPValidationError {
  field: keyof RSVPResponse;
  message: string;
}

// Auto-save configuration
export interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  saveOnBlur: boolean;
}

// Form question configuration
export interface RSVPQuestionConfig {
  id: keyof RSVPResponse;
  label: string;
  required: boolean;
  type: 'radio' | 'checkbox' | 'text' | 'textarea';
  options?: Array<{
    value: string;
    label: string;
  }>;
  placeholder?: string;
  maxLength?: number;
  conditional?: {
    dependsOn: keyof RSVPResponse;
    showWhen: unknown;
  };
}

// Spanish form configuration
export const RSVP_FORM_CONFIG: RSVPQuestionConfig[] = [
  {
    id: 'attendance',
    label: '¿Vas a venir a la boda?',
    required: true,
    type: 'radio',
    options: [
      { value: 'yes', label: 'Sí, claro' },
      { value: 'no', label: 'No puedo asistir' },
      { value: 'maybe', label: 'Aún no lo sé, os diré antes del [fecha límite]' }
    ]
  },
  {
    id: 'accommodationManagement',
    label: '¿Quieres que te gestionemos el alojamiento?',
    required: true,
    type: 'radio',
    options: [
      { value: 'yes', label: 'Sí, quiero que me lo gestionéis' },
      { value: 'no', label: 'No, me lo gestiono por mi cuenta' }
    ]
  },
  {
    id: 'nightsStaying',
    label: '¿Qué noches te quedarás en Cádiz? (Marca todas las que correspondan)',
    required: true,
    type: 'checkbox',
    options: [
      { value: 'friday', label: 'Viernes' },
      { value: 'saturday', label: 'Sábado' },
      { value: 'sunday', label: 'Domingo (me quedo y me vuelvo el lunes)' },
      { value: 'other', label: 'Otra combinación (especificar más abajo)' }
    ]
  },
  {
    id: 'otherNightsCombination',
    label: 'Especifica tu combinación de noches',
    required: false,
    type: 'text',
    placeholder: 'Describe tu combinación de noches...',
    maxLength: 200,
    conditional: {
      dependsOn: 'nightsStaying',
      showWhen: ['other']
    }
  },
  {
    id: 'roomSharing',
    label: '¿Con quién compartes habitación? (Escribe su nombre o indica si no lo sabes aún o si deseas habitación individual)',
    required: true,
    type: 'text',
    placeholder: 'Nombre de la persona o indicar si no lo sabes aún...',
    maxLength: 100
  },
  {
    id: 'transportationNeeds',
    label: '¿Necesitas ayuda con el transporte? (Marca lo que se aplique)',
    required: true,
    type: 'checkbox',
    options: [
      { value: 'find_ride', label: 'Sí, me vendría bien que me ayudéis a encontrar plaza con alguien' },
      { value: 'offer_ride', label: 'Yo tengo coche y podría compartir con otros' },
      { value: 'no_help', label: 'No necesito ayuda con el transporte' },
      { value: 'not_sure', label: 'No lo sé todavía' }
    ]
  },
  {
    id: 'dietaryRestrictions',
    label: '¿Tienes alguna alergia, intolerancia o necesidad alimentaria?',
    required: false,
    type: 'textarea',
    placeholder: 'Describe cualquier alergia, intolerancia o necesidad alimentaria...',
    maxLength: 500
  },
  {
    id: 'mainCoursePreference',
    label: '¿Qué prefieres para el plato principal?',
    required: true,
    type: 'radio',
    options: [
      { value: 'fish', label: 'Pescado' },
      { value: 'meat', label: 'Carne' },
      { value: 'vegetarian', label: 'Opción vegetariana' },
      { value: 'no_preference', label: 'No tengo preferencia' }
    ]
  }
];

// Default form state
export const DEFAULT_RSVP_RESPONSE: Partial<RSVPResponse> = {
  attendance: undefined,
  accommodationManagement: undefined,
  nightsStaying: [],
  otherNightsCombination: '',
  roomSharing: '',
  transportationNeeds: [],
  dietaryRestrictions: '',
  mainCoursePreference: undefined
};

// Auto-save configuration
export const AUTO_SAVE_CONFIG: AutoSaveConfig = {
  enabled: true,
  intervalMs: 30000, // 30 seconds
  saveOnBlur: true
};
