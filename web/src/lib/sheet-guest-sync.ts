import 'server-only';

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from '@/lib/firebase-admin';
import { getSheetsClient } from '@/lib/google-sheets-delegated';
import { normalizeSheetPhoneToE164 } from '@/lib/phone';
import type { Guest } from '@/types/guest';

const GUESTS_COLLECTION = 'guests';
const SEATING_COLLECTION = 'seating';

const VALID_SIDES = new Set(['novioA', 'novioB', 'ambos']);
const VALID_STATUSES = new Set(['soltero', 'enPareja', 'buscando']);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_BATCH_OPS = 450;

export interface SheetSyncErrorRow {
  sheetRow: number;
  messages: string[];
}

export interface SheetSyncResult {
  created: number;
  updated: number;
  unchanged: number;
  errors: SheetSyncErrorRow[];
  dryRun: boolean;
}

interface ParsedSheetRow {
  sheetRow: number;
  sheetNickname: string;
  fullName: string;
  tableNameRaw: string;
  seatRaw: string;
  age?: number | string;
  roomNumber?: string;
  phoneE164: string | null;
  email: string;
  side: Guest['side'];
  relationToGrooms: string;
  relationshipStatus: Guest['relationshipStatus'];
  isDirectoryVisible: boolean;
  firestoreUid: string;
  funFact: string;
  isChild: boolean;
  connectedTo: string;
  connectionType: string;
  contactPending: boolean;
}

type SeatingPlan = 'delete' | { tableName: string; seatNumber: number };

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_GUESTS_SPREADSHEET_ID?.trim();
  if (!id) {
    throw new Error('GOOGLE_GUESTS_SPREADSHEET_ID is not set.');
  }
  return id;
}

function getSheetName(): string {
  return process.env.GOOGLE_GUESTS_SHEET_NAME?.trim() || 'Guests';
}

function a1Range(sheetName: string, range: string): string {
  const needsQuotes = /[^A-Za-z0-9_]/.test(sheetName) || sheetName.includes("'");
  const escaped = needsQuotes ? `'${sheetName.replace(/'/g, "''")}'` : sheetName;
  return `${escaped}!${range}`;
}

function cell(row: unknown[] | undefined, index: number): string {
  const v = row?.[index];
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function parseDirectoryVisible(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  if (!s) return true;
  if (['sí', 'si', 'yes', 'true', '1', 's', 'y'].includes(s)) return true;
  if (['no', 'false', '0', 'n'].includes(s)) return false;
  return true;
}

/** Google Sheets checkbox / boolean cell */
function parseSheetChildColumn(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  if (!s) return false;
  return ['true', 'yes', '1', 'sí', 'si', 'y', 'x', 'checked'].includes(s);
}

function childLinkKey(connectedTo: string, fullName: string): string {
  return `${connectedTo.trim().toLowerCase()}\t${fullName.trim().toLowerCase()}`;
}

/** Stable match for adults without email/phone (same columns as the sheet row). */
function pendingGuestSyncKeyFromParts(
  fullName: string,
  side: string,
  relationToGrooms: string,
  relationshipStatus: string,
  tableNameRaw: string,
  seatRaw: string
): string {
  return [
    fullName.trim().toLowerCase(),
    side,
    relationToGrooms.trim().toLowerCase(),
    relationshipStatus,
    tableNameRaw.trim().toLowerCase(),
    seatRaw.trim().toLowerCase(),
  ].join('\u{1f}');
}

function pendingGuestSyncKeyFromParsed(row: ParsedSheetRow): string {
  return pendingGuestSyncKeyFromParts(
    row.fullName,
    row.side,
    row.relationToGrooms,
    row.relationshipStatus,
    row.tableNameRaw,
    row.seatRaw
  );
}

function isAdultContactPendingRow(parsed: ParsedSheetRow): boolean {
  return !parsed.isChild && !parsed.email && !parsed.phoneE164;
}

function parseAge(raw: string): number | string | undefined {
  if (!raw.trim()) return undefined;
  const n = Number(raw);
  if (Number.isFinite(n) && String(n) === raw.trim()) return n;
  return raw.trim();
}

function seatingFromColumns(tableRaw: string, seatRaw: string): SeatingPlan {
  const tableName = tableRaw.trim();
  const seatTrim = seatRaw.trim();
  if (!tableName && !seatTrim) {
    return 'delete';
  }
  let seatNumber = 0;
  if (seatTrim) {
    const n = Number.parseInt(seatTrim, 10);
    seatNumber = Number.isFinite(n) ? n : 0;
  }
  return { tableName: tableName || '', seatNumber };
}

function isRowBlank(row: unknown[]): boolean {
  return row.every((c) => !String(c ?? '').trim());
}

function isValidFirestoreDocId(id: string): boolean {
  if (!id || id.length > 800) return false;
  if (id.includes('/') || id.includes('..')) return false;
  return true;
}

function parseGuestRow(values: unknown[], sheetRow: number): { ok: ParsedSheetRow } | { errors: string[] } {
  const errors: string[] = [];

  const nickname = cell(values, 0);
  const name = cell(values, 1);
  const lastname = cell(values, 2);
  let fullName = cell(values, 3);
  if (!fullName) {
    const combined = `${name} ${lastname}`.trim();
    if (!combined) {
      errors.push('Nombre completo vacío (columna D o B+C)');
    } else {
      fullName = combined;
    }
  }

  const tableNameRaw = cell(values, 4);
  const ageRaw = cell(values, 5);
  const roomNumberRaw = cell(values, 6);
  const phoneRaw = cell(values, 7);
  const emailRaw = cell(values, 8).toLowerCase();
  const sideRaw = cell(values, 9);
  const relationRaw = cell(values, 10);
  const statusRaw = cell(values, 11);
  const seatRaw = cell(values, 12);
  const dirRaw = cell(values, 13);
  const firestoreUid = cell(values, 14);
  const funFact = cell(values, 15);
  const connectedToRaw = cell(values, 16);
  const connectionTypeRaw = cell(values, 17);
  const isChild = parseSheetChildColumn(cell(values, 18));

  const phoneE164 = normalizeSheetPhoneToE164(phoneRaw || null);
  const email = emailRaw.trim();

  if (connectedToRaw && !isValidFirestoreDocId(connectedToRaw)) {
    errors.push('connectedTo (Q): UID no válido');
  }

  if (email && !EMAIL_REGEX.test(email)) {
    errors.push('Formato de email inválido');
  }

  if (isChild) {
    if (!email && !phoneE164 && !firestoreUid && !connectedToRaw) {
      errors.push(
        'Menor (S): sin email ni teléfono hace falta columna O (UID) o Q (connectedTo del adulto)'
      );
    }
  }
  // Adults may omit email and phone: they sync as contactPending until RSVP adds contact.

  let sideResolved: Guest['side'];
  let relationResolved: string;
  let statusResolved: Guest['relationshipStatus'];

  if (isChild) {
    if (sideRaw && VALID_SIDES.has(sideRaw)) {
      sideResolved = sideRaw as Guest['side'];
    } else {
      sideResolved = 'ambos';
    }
    relationResolved = relationRaw || 'Menor';
    if (statusRaw && VALID_STATUSES.has(statusRaw)) {
      statusResolved = statusRaw as Guest['relationshipStatus'];
    } else {
      statusResolved = 'soltero';
    }
  } else {
    if (!sideRaw) {
      errors.push('Lado (J) es obligatorio');
    } else if (!VALID_SIDES.has(sideRaw)) {
      errors.push(`Lado inválido: ${sideRaw}`);
    } else {
      sideResolved = sideRaw as Guest['side'];
    }

    if (!relationRaw) {
      errors.push('Relación con los novios (K) es obligatoria');
    } else {
      relationResolved = relationRaw;
    }

    if (!statusRaw) {
      errors.push('Estado sentimental (L) es obligatorio');
    } else if (!VALID_STATUSES.has(statusRaw)) {
      errors.push(`Estado sentimental inválido: ${statusRaw}`);
    } else {
      statusResolved = statusRaw as Guest['relationshipStatus'];
    }
  }

  if (firestoreUid && !isValidFirestoreDocId(firestoreUid)) {
    errors.push('firestoreUid (O) tiene un formato no válido');
  }

  if (errors.length > 0) {
    return { errors };
  }

  const contactPending = !isChild && !email && !phoneE164;

  return {
    ok: {
      sheetRow,
      sheetNickname: nickname,
      fullName: fullName!,
      tableNameRaw,
      seatRaw,
      age: parseAge(ageRaw),
      roomNumber: roomNumberRaw || undefined,
      phoneE164,
      email,
      side: sideResolved!,
      relationToGrooms: relationResolved!,
      relationshipStatus: statusResolved!,
      isDirectoryVisible: parseDirectoryVisible(dirRaw),
      firestoreUid,
      funFact,
      isChild,
      connectedTo: connectedToRaw,
      connectionType: connectionTypeRaw,
      contactPending,
    },
  };
}

function resolveExistingUid(
  parsed: ParsedSheetRow,
  byEmail: Map<string, string>,
  byPhone: Map<string, string>,
  byChildLink: Map<string, string>,
  byPendingSyncKey: Map<string, string>
): string | undefined {
  if (parsed.firestoreUid) {
    return undefined;
  }
  if (parsed.email) {
    const u = byEmail.get(parsed.email);
    if (u) return u;
  }
  if (parsed.phoneE164) {
    const u = byPhone.get(parsed.phoneE164);
    if (u) return u;
  }
  if (parsed.isChild && parsed.connectedTo) {
    const u = byChildLink.get(childLinkKey(parsed.connectedTo, parsed.fullName));
    if (u) return u;
  }
  if (isAdultContactPendingRow(parsed)) {
    const u = byPendingSyncKey.get(pendingGuestSyncKeyFromParsed(parsed));
    if (u) return u;
  }
  return undefined;
}

function inconsistentEmailPhone(
  parsed: ParsedSheetRow,
  byEmail: Map<string, string>,
  byPhone: Map<string, string>
): string | null {
  if (!parsed.email || !parsed.phoneE164) return null;
  const eu = byEmail.get(parsed.email);
  const pu = byPhone.get(parsed.phoneE164);
  if (eu && pu && eu !== pu) {
    return 'El email y el teléfono corresponden a dos invitados distintos en la base de datos';
  }
  return null;
}

function conflictForTarget(
  parsed: ParsedSheetRow,
  targetKey: string,
  byEmail: Map<string, string>,
  byPhone: Map<string, string>,
  byChildLink: Map<string, string>,
  byPendingSyncKey: Map<string, string>,
  reservedEmail: Map<string, string>,
  reservedPhone: Map<string, string>,
  reservedChildLink: Map<string, string>,
  reservedPendingSyncKey: Map<string, string>
): string | null {
  if (parsed.email) {
    const holder = byEmail.get(parsed.email) ?? reservedEmail.get(parsed.email);
    if (holder && holder !== targetKey) {
      return 'El email ya pertenece a otro invitado';
    }
  }
  if (parsed.phoneE164) {
    const holder = byPhone.get(parsed.phoneE164) ?? reservedPhone.get(parsed.phoneE164);
    if (holder && holder !== targetKey) {
      return 'El teléfono ya pertenece a otro invitado';
    }
  }
  if (parsed.isChild && parsed.connectedTo) {
    const k = childLinkKey(parsed.connectedTo, parsed.fullName);
    const holder =
      byChildLink.get(k) ?? reservedChildLink.get(k);
    if (holder && holder !== targetKey) {
      return 'Otra fila ya usa el mismo adulto (Q) y nombre para un menor';
    }
  }
  if (isAdultContactPendingRow(parsed)) {
    const pk = pendingGuestSyncKeyFromParsed(parsed);
    const holder =
      byPendingSyncKey.get(pk) ?? reservedPendingSyncKey.get(pk);
    if (holder && holder !== targetKey) {
      return 'Otra fila coincide con el mismo perfil sin contacto (nombre, lado, relación, estado, mesa y asiento)';
    }
  }
  return null;
}

interface ExistingMaps {
  byEmail: Map<string, string>;
  byPhone: Map<string, string>;
  byChildLink: Map<string, string>;
  byPendingSyncKey: Map<string, string>;
  guestByUid: Map<string, Record<string, unknown>>;
  seatingByUid: Map<string, { tableName: string; seatNumber: number }>;
}

async function loadExistingMaps(fs: Firestore): Promise<ExistingMaps> {
  const [guestsSnap, seatingSnap] = await Promise.all([
    fs.collection(GUESTS_COLLECTION).get(),
    fs.collection(SEATING_COLLECTION).get(),
  ]);

  const byEmail = new Map<string, string>();
  const byPhone = new Map<string, string>();
  const byChildLink = new Map<string, string>();
  const byPendingSyncKey = new Map<string, string>();
  const guestByUid = new Map<string, Record<string, unknown>>();

  for (const doc of guestsSnap.docs) {
    const d = doc.data();
    guestByUid.set(doc.id, d);
    const em = typeof d.email === 'string' ? d.email.toLowerCase().trim() : '';
    if (em) {
      byEmail.set(em, doc.id);
    }
    const ph = typeof d.phoneE164 === 'string' ? d.phoneE164.trim() : '';
    if (ph) {
      byPhone.set(ph, doc.id);
    }
    if (d.child === true && typeof d.connectedTo === 'string' && d.connectedTo.trim()) {
      const fn = typeof d.fullName === 'string' ? d.fullName : '';
      const k = childLinkKey(d.connectedTo, fn);
      byChildLink.set(k, doc.id);
    }
  }

  const seatingByUid = new Map<string, { tableName: string; seatNumber: number }>();
  for (const doc of seatingSnap.docs) {
    const data = doc.data() as { tableName?: string; seatNumber?: number };
    seatingByUid.set(doc.id, {
      tableName: data.tableName ?? '',
      seatNumber: Number(data.seatNumber ?? 0),
    });
  }

  for (const doc of guestsSnap.docs) {
    const d = doc.data();
    if (d.child === true) continue;
    const em = typeof d.email === 'string' ? d.email.trim() : '';
    const ph = typeof d.phoneE164 === 'string' ? d.phoneE164.trim() : '';
    if (em || ph) continue;
    const seat = seatingByUid.get(doc.id);
    const tableRaw = seat?.tableName ?? '';
    const seatRawForKey =
      seat && seat.seatNumber ? String(seat.seatNumber) : '';
    const pk = pendingGuestSyncKeyFromParts(
      String(d.fullName ?? ''),
      String(d.side ?? ''),
      String(d.relationToGrooms ?? ''),
      String(d.relationshipStatus ?? ''),
      tableRaw,
      seatRawForKey
    );
    byPendingSyncKey.set(pk, doc.id);
  }

  return { byEmail, byPhone, byChildLink, byPendingSyncKey, guestByUid, seatingByUid };
}

function toIsoString(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function buildGuestCreatePayload(parsed: ParsedSheetRow, nowIso: string): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    fullName: parsed.fullName,
    email: parsed.email,
    phoneE164: parsed.phoneE164 ?? '',
    side: parsed.side,
    relationToGrooms: parsed.relationToGrooms,
    relationshipStatus: parsed.relationshipStatus,
    isDirectoryVisible: parsed.isDirectoryVisible,
    funFact: parsed.funFact,
    sheetNickname: parsed.sheetNickname,
    child: parsed.isChild,
    profileClaimed: false,
    whatsappNumber: '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  if (parsed.age !== undefined) doc.age = parsed.age;
  if (parsed.roomNumber !== undefined) doc.roomNumber = parsed.roomNumber;
  if (parsed.connectedTo) doc.connectedTo = parsed.connectedTo;
  if (parsed.connectionType) doc.connectionType = parsed.connectionType;
  doc.contactPending = parsed.contactPending;
  return doc;
}

function buildGuestUpdatePayload(
  parsed: ParsedSheetRow,
  existing: Record<string, unknown>,
  nowIso: string
): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    fullName: parsed.fullName,
    email: parsed.email,
    phoneE164: parsed.phoneE164 ?? '',
    side: parsed.side,
    relationToGrooms: parsed.relationToGrooms,
    relationshipStatus: parsed.relationshipStatus,
    isDirectoryVisible: parsed.isDirectoryVisible,
    funFact: parsed.funFact,
    sheetNickname: parsed.sheetNickname,
    child: parsed.isChild,
    contactPending: parsed.contactPending,
    profileClaimed: existing.profileClaimed ?? false,
    whatsappNumber: existing.whatsappNumber ?? '',
    createdAt: existing.createdAt ?? nowIso,
    updatedAt: nowIso,
  };

  // Firestore rejects undefined; optional fields may be absent on existing docs.
  if (typeof existing.photoUrl === 'string') {
    doc.photoUrl = existing.photoUrl;
  }

  if (parsed.connectedTo) {
    doc.connectedTo = parsed.connectedTo;
  } else if (existing.connectedTo !== undefined && existing.connectedTo !== null && existing.connectedTo !== '') {
    doc.connectedTo = FieldValue.delete();
  }

  if (parsed.connectionType) {
    doc.connectionType = parsed.connectionType;
  } else if (
    existing.connectionType !== undefined &&
    existing.connectionType !== null &&
    String(existing.connectionType) !== ''
  ) {
    doc.connectionType = FieldValue.delete();
  }

  if (parsed.age !== undefined) {
    doc.age = parsed.age;
  } else if (existing.age !== undefined && existing.age !== null) {
    doc.age = FieldValue.delete();
  }

  if (parsed.roomNumber !== undefined) {
    doc.roomNumber = parsed.roomNumber;
  } else if (existing.roomNumber !== undefined && existing.roomNumber !== null && existing.roomNumber !== '') {
    doc.roomNumber = FieldValue.delete();
  }

  return doc;
}

function syncedGuestFieldsEqual(existing: Record<string, unknown>, parsed: ParsedSheetRow): boolean {
  if (String(existing.fullName ?? '') !== parsed.fullName) return false;
  if (String(existing.email ?? '').toLowerCase() !== parsed.email) return false;
  if (String(existing.phoneE164 ?? '') !== (parsed.phoneE164 ?? '')) return false;
  if (String(existing.side ?? '') !== parsed.side) return false;
  if (String(existing.relationToGrooms ?? '') !== parsed.relationToGrooms) return false;
  if (String(existing.relationshipStatus ?? '') !== parsed.relationshipStatus) return false;
  if (Boolean(existing.isDirectoryVisible ?? true) !== parsed.isDirectoryVisible) return false;
  if (String(existing.funFact ?? '') !== parsed.funFact) return false;
  if (String(existing.sheetNickname ?? '') !== parsed.sheetNickname) return false;

  const exAge = existing.age;
  if (parsed.age !== undefined) {
    if (String(exAge ?? '') !== String(parsed.age)) return false;
  } else if (exAge !== undefined && exAge !== null && exAge !== '') {
    return false;
  }

  const exRoom = existing.roomNumber;
  if (parsed.roomNumber !== undefined) {
    if (String(exRoom ?? '') !== String(parsed.roomNumber)) return false;
  } else if (exRoom !== undefined && exRoom !== null && String(exRoom) !== '') {
    return false;
  }

  if (Boolean(existing.child) !== parsed.isChild) return false;
  if (String(existing.connectedTo ?? '') !== parsed.connectedTo) return false;
  if (String(existing.connectionType ?? '') !== parsed.connectionType) return false;
  if (Boolean(existing.contactPending) !== parsed.contactPending) return false;

  return true;
}

function seatingPlansEqual(
  existing: { tableName: string; seatNumber: number } | undefined,
  plan: SeatingPlan
): boolean {
  if (plan === 'delete') {
    if (!existing) return true;
    return !existing.tableName && !existing.seatNumber;
  }
  if (!existing) return false;
  return existing.tableName === plan.tableName && existing.seatNumber === plan.seatNumber;
}

interface PlannedMutation {
  sheetRow: number;
  guestRefId: string;
  isNew: boolean;
  guestPayload: Record<string, unknown>;
  needsGuestWrite: boolean;
  seatingPlan: SeatingPlan;
  needsSeatingWrite: boolean;
}

export async function syncGuestsFromSheet(options: { dryRun: boolean }): Promise<SheetSyncResult> {
  const spreadsheetId = getSpreadsheetId();
  const sheetName = getSheetName();

  const sheets = await getSheetsClient();
  const range = a1Range(sheetName, 'A2:S');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const valueRows = res.data.values ?? [];

  const result: SheetSyncResult = {
    created: 0,
    updated: 0,
    unchanged: 0,
    errors: [],
    dryRun: options.dryRun,
  };

  const maps = await loadExistingMaps(adminFirestore);
  const { byEmail, byPhone, byChildLink, byPendingSyncKey, guestByUid, seatingByUid } = maps;

  const reservedEmail = new Map<string, string>();
  const reservedPhone = new Map<string, string>();
  const reservedChildLink = new Map<string, string>();
  const reservedPendingSyncKey = new Map<string, string>();

  const sheetUidSeen = new Set<string>();
  const parsedOk: ParsedSheetRow[] = [];
  const parseErrors: SheetSyncErrorRow[] = [];

  for (let i = 0; i < valueRows.length; i++) {
    const row = valueRows[i] as unknown[];
    const sheetRow = i + 2;
    if (isRowBlank(row)) continue;

    const parsed = parseGuestRow(row, sheetRow);
    if ('errors' in parsed) {
      parseErrors.push({ sheetRow, messages: parsed.errors });
      continue;
    }

    const pr = parsed.ok;
    if (pr.firestoreUid) {
      if (sheetUidSeen.has(pr.firestoreUid)) {
        parseErrors.push({ sheetRow, messages: ['firestoreUid (O) duplicado en la hoja'] });
        continue;
      }
      sheetUidSeen.add(pr.firestoreUid);
    }

    const inc = inconsistentEmailPhone(pr, byEmail, byPhone);
    if (inc) {
      parseErrors.push({ sheetRow, messages: [inc] });
      continue;
    }

    parsedOk.push(pr);
  }

  result.errors.push(...parseErrors);

  const explicitUidsOnSheet = new Set(
    parsedOk.map((p) => p.firestoreUid).filter((id): id is string => Boolean(id))
  );
  const validatedOk: ParsedSheetRow[] = [];
  for (const pr of parsedOk) {
    if (pr.connectedTo) {
      const parentOk =
        guestByUid.has(pr.connectedTo) || explicitUidsOnSheet.has(pr.connectedTo);
      if (!parentOk) {
        result.errors.push({
          sheetRow: pr.sheetRow,
          messages: [
            'connectedTo (Q): no existe un invitado con ese UID ni una fila en esta hoja con columna O igual a ese valor',
          ],
        });
        continue;
      }
    }
    validatedOk.push(pr);
  }

  const nowIso = new Date().toISOString();
  const mutations: PlannedMutation[] = [];

  for (const pr of validatedOk) {
    const existingUid = resolveExistingUid(pr, byEmail, byPhone, byChildLink, byPendingSyncKey);
    const explicitUid = pr.firestoreUid || undefined;
    const isNew = !existingUid && !explicitUid;

    let targetKey: string;
    let guestRefId: string;

    if (explicitUid) {
      targetKey = explicitUid;
      guestRefId = explicitUid;
    } else if (existingUid) {
      targetKey = existingUid;
      guestRefId = existingUid;
    } else {
      targetKey = `__new_${pr.sheetRow}__`;
      guestRefId = '';
    }

    const conflict = conflictForTarget(
      pr,
      targetKey,
      byEmail,
      byPhone,
      byChildLink,
      byPendingSyncKey,
      reservedEmail,
      reservedPhone,
      reservedChildLink,
      reservedPendingSyncKey
    );
    if (conflict) {
      result.errors.push({ sheetRow: pr.sheetRow, messages: [conflict] });
      continue;
    }

    if (pr.email) reservedEmail.set(pr.email, targetKey);
    if (pr.phoneE164) reservedPhone.set(pr.phoneE164, targetKey);
    if (pr.isChild && pr.connectedTo) {
      reservedChildLink.set(childLinkKey(pr.connectedTo, pr.fullName), targetKey);
    }
    if (isAdultContactPendingRow(pr)) {
      reservedPendingSyncKey.set(pendingGuestSyncKeyFromParsed(pr), targetKey);
    }

    const existingDoc = guestRefId ? guestByUid.get(guestRefId) : undefined;
    const reallyNew = Boolean(isNew || (!!explicitUid && !existingDoc));

    const guestPayload =
      reallyNew || !existingDoc
        ? buildGuestCreatePayload(pr, nowIso)
        : (() => {
            const u = buildGuestUpdatePayload(pr, existingDoc, nowIso);
            u.createdAt = toIsoString(existingDoc.createdAt);
            return u;
          })();

    const seatingPlan = seatingFromColumns(pr.tableNameRaw, pr.seatRaw);
    const currentSeating = guestRefId ? seatingByUid.get(guestRefId) : undefined;

    const guestSame = !reallyNew && existingDoc ? syncedGuestFieldsEqual(existingDoc, pr) : false;
    const seatSame = reallyNew ? false : seatingPlansEqual(currentSeating, seatingPlan);

    const needsGuestWrite = reallyNew || !guestSame;
    let needsSeatingWrite: boolean;

    if (reallyNew) {
      needsSeatingWrite = seatingPlan !== 'delete';
    } else if (seatingPlan === 'delete') {
      needsSeatingWrite = !!currentSeating && (!!currentSeating.tableName || !!currentSeating.seatNumber);
    } else {
      needsSeatingWrite = !seatSame;
    }

    if (!needsGuestWrite && !needsSeatingWrite) {
      result.unchanged += 1;
      continue;
    }

    mutations.push({
      sheetRow: pr.sheetRow,
      guestRefId,
      isNew: reallyNew,
      guestPayload,
      needsGuestWrite,
      seatingPlan,
      needsSeatingWrite,
    });
  }

  if (options.dryRun) {
    for (const m of mutations) {
      if (m.isNew) result.created += 1;
      else result.updated += 1;
    }
    return result;
  }

  let batch = adminFirestore.batch();
  let opCount = 0;

  const flush = async () => {
    if (opCount === 0) return;
    await batch.commit();
    batch = adminFirestore.batch();
    opCount = 0;
  };

  for (const m of mutations) {
    const guestsCol = adminFirestore.collection(GUESTS_COLLECTION);
    const guestRef =
      m.isNew && !m.guestRefId ? guestsCol.doc() : guestsCol.doc(m.guestRefId);

    const finalId = guestRef.id;

    if (m.needsGuestWrite) {
      batch.set(guestRef, m.guestPayload, { merge: false });
      opCount += 1;
    }

    if (m.needsSeatingWrite) {
      const seatRef = adminFirestore.collection(SEATING_COLLECTION).doc(finalId);
      if (m.seatingPlan === 'delete') {
        batch.delete(seatRef);
      } else {
        batch.set(seatRef, {
          tableName: m.seatingPlan.tableName,
          seatNumber: m.seatingPlan.seatNumber,
        });
      }
      opCount += 1;
    }

    if (m.isNew) {
      result.created += 1;
    } else {
      result.updated += 1;
    }

    if (opCount >= MAX_BATCH_OPS) {
      await flush();
    }
  }

  await flush();

  return result;
}
