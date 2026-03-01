import type { AttendanceStatus } from './rsvp';

export type GuestSide = 'novioA' | 'novioB' | 'ambos';

export type RelationshipStatus = 'soltero' | 'enPareja' | 'buscando';

export interface Guest {
  uid: string;
  email: string;
  fullName: string;
  photoUrl?: string;
  whatsappNumber?: string;
  funFact?: string;
  relationToGrooms: string;
  relationshipStatus: RelationshipStatus;
  side: GuestSide;
  profileClaimed: boolean;
  isDirectoryVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GuestWithRSVP extends Guest {
  rsvpStatus: AttendanceStatus | 'no_response';
}

export interface SeatingAssignment {
  tableName: string;
  seatNumber: number;
}

export interface GuestWithSeating extends GuestWithRSVP {
  seating?: SeatingAssignment;
}

export interface CreateGuestInput {
  fullName: string;
  email: string;
  side: GuestSide;
  relationToGrooms: string;
  relationshipStatus: RelationshipStatus;
  isDirectoryVisible?: boolean;
  whatsappNumber?: string;
}

export interface UpdateGuestInput {
  fullName?: string;
  email?: string;
  side?: GuestSide;
  relationToGrooms?: string;
  relationshipStatus?: RelationshipStatus;
  isDirectoryVisible?: boolean;
  whatsappNumber?: string;
  tableName?: string;
  seatNumber?: number;
}

export interface CSVGuestRow {
  fullName: string;
  email: string;
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
