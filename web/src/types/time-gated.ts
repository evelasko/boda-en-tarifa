// ─── Time-Gated Content ──────────────────────────────────

export type ContentType = 'menu' | 'seating';

export interface TimeGatedItem {
  id: string;
  contentType: ContentType;
  title: string;
  unlockAt: string; // ISO 8601 datetime
  eventId?: string;
  firestoreDocPath?: string;
  payload?: MenuPayload | SeatingPayload;
}

// ─── Menu Payload ────────────────────────────────────────

export interface MenuPayload {
  items: MenuItem[];
  notes?: string;
}

export interface MenuItem {
  name: string;
  description?: string;
  dietary: string[];
}

// ─── Seating Payload ─────────────────────────────────────

export interface SeatingPayload {
  imagePublicId?: string;
}

// ─── Constants ───────────────────────────────────────────

export const DIETARY_TAGS = [
  'vegetariano',
  'vegano',
  'sin gluten',
  'sin lactosa',
  'sin frutos secos',
] as const;

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  menu: 'Menú',
  seating: 'Asignación de mesas',
};

/** Wedding event window for unlock time validation (Europe/Madrid) */
export const WEDDING_WINDOW = {
  start: '2026-05-28T00:00:00+02:00',
  end: '2026-05-31T23:59:59+02:00',
} as const;
