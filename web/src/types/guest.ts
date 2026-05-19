import type { AttendanceStatus } from './rsvp';

export type GuestSide = 'novioA' | 'novioB' | 'ambos';

export type RelationshipStatus = 'soltero' | 'enPareja' | 'buscando';

export interface Guest {
  uid: string;
  email: string;
  fullName: string;
  /** How the WhatsApp bot addresses the guest (overrides first token of fullName). */
  preferredName?: string;
  photoUrl?: string;
  phoneE164?: string;
  whatsappNumber?: string;
  funFact?: string;
  /** Synced from spreadsheet column A */
  sheetNickname?: string;
  /** Synced from spreadsheet (logistics) */
  age?: number | string;
  /** Synced from spreadsheet (logistics) */
  roomNumber?: string;
  /** Synced from spreadsheet column S — minors may omit contact fields */
  child?: boolean;
  /** Synced from spreadsheet column U — table captain for service staff */
  tableCaptain?: boolean;
  /** Firebase guest UID this row is linked to (spreadsheet column Q) */
  connectedTo?: string;
  /** Free-form link label (spreadsheet column R) */
  connectionType?: string;
  /** Adult on the list without email/phone yet (sheet or admin); cleared when contact is added */
  contactPending?: boolean;
  relationToGrooms: string;
  relationshipStatus: RelationshipStatus;
  side: GuestSide;
  profileClaimed: boolean;
  isDirectoryVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeatingAssignment {
  tableName: string;
  seatNumber: number;
}

export interface GuestWithRSVP extends Guest {
  rsvpStatus: AttendanceStatus | 'no_response';
  /** Set when loaded from admin list API (seating collection). */
  seating?: SeatingAssignment;
}

export interface GuestWithSeating extends GuestWithRSVP {
  seating?: SeatingAssignment;
}

export interface CreateGuestInput {
  fullName: string;
  preferredName?: string;
  email?: string;
  side: GuestSide;
  relationToGrooms: string;
  relationshipStatus: RelationshipStatus;
  isDirectoryVisible?: boolean;
  phoneE164?: string;
  whatsappNumber?: string;
  /** When true, email/phone are optional (minor guest). */
  child?: boolean;
  tableCaptain?: boolean;
  connectedTo?: string;
  connectionType?: string;
  /** When true (adult), email/phone/whatsapp may all be empty until RSVP. */
  contactPending?: boolean;
}

export interface UpdateGuestInput {
  fullName?: string;
  preferredName?: string;
  email?: string;
  side?: GuestSide;
  relationToGrooms?: string;
  relationshipStatus?: RelationshipStatus;
  isDirectoryVisible?: boolean;
  phoneE164?: string;
  whatsappNumber?: string;
  child?: boolean;
  tableCaptain?: boolean;
  connectedTo?: string;
  connectionType?: string;
  contactPending?: boolean;
  tableName?: string;
  seatNumber?: number;
}

export interface CSVGuestRow {
  fullName: string;
  email?: string;
  phoneE164?: string;
  side: string;
  relationToGrooms: string;
  relationshipStatus: string;
}

export interface CSVValidationResult {
  row: number;
  data: CSVGuestRow;
  valid: boolean;
  errors: string[];
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: Array<{ row: number; errors: string[] }>;
}

export const SIDE_LABELS: Record<GuestSide, string> = {
  novioA: 'Novio A (Enrique)',
  novioB: 'Novio B (Manuel)',
  ambos: 'Ambos',
};

/** Short groom names for table badges and compact UI. */
export const SIDE_GROOM_NAMES: Record<GuestSide, string> = {
  novioA: 'Enrique',
  novioB: 'Manuel',
  ambos: 'Ambos',
};

export const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatus, string> = {
  soltero: 'Soltero',
  enPareja: 'En Pareja',
  buscando: 'Buscando',
};

export const RSVP_STATUS_LABELS: Record<AttendanceStatus | 'no_response', string> = {
  yes: 'Asiste',
  no: 'No asiste',
  maybe: 'Quizás',
  no_response: 'Sin respuesta',
};
