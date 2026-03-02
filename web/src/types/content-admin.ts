// ─── Venues ───────────────────────────────────────────────
export interface AdminVenue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  walkingDirections?: string;
  terrainNote?: string;
}

// ─── Quick Contacts ───────────────────────────────────────
export interface ContactEntry {
  name: string;
  phone: string;
  whatsappUrl?: string;
  role?: string;
}

export interface QuickContacts {
  taxis: ContactEntry[];
  coordinators: ContactEntry[];
}

// ─── Recommendations ─────────────────────────────────────
export interface Recommendation {
  name: string;
  description: string;
  category?: string;
  mapUrl?: string;
  imageUrl?: string;
}

export const RECOMMENDATION_CATEGORIES = [
  'Restaurante',
  'Café',
  'Playa',
  'Bar',
  'Actividad',
] as const;

// ─── Wind Tips ────────────────────────────────────────────
export type WindType = 'levante' | 'poniente' | 'other';

export interface WindTips {
  levante: string[];
  poniente: string[];
  other: string[];
}

export const WIND_TYPE_LABELS: Record<WindType, string> = {
  levante: 'Levante',
  poniente: 'Poniente',
  other: 'Otro / Sin viento',
};
