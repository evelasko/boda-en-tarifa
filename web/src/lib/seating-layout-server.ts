import 'server-only';

import { adminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { SeatingLayout, SeatingLayoutInput } from '@/types/seating-layout';
import { CANONICAL_SEED, validateLayout } from './seating-layout';

const COLLECTION = 'app_config';
const DOC_ID = 'seating_layout';

/**
 * Firestore does not allow nested arrays as field values, so each row is
 * stored as `{ tables: number[] }` and unwrapped on read.
 */
type StoredRow = { tables: number[] };

function rowsToStorage(rows: number[][]): StoredRow[] {
  return rows.map((tables) => ({ tables: [...tables] }));
}

function rowsFromStorage(stored: unknown): number[][] {
  if (!Array.isArray(stored)) return [];
  return stored.map((entry) => {
    if (
      entry &&
      typeof entry === 'object' &&
      Array.isArray((entry as { tables?: unknown }).tables)
    ) {
      return (entry as { tables: number[] }).tables;
    }
    // Defensive: tolerate the (illegal) raw-nested-array form too.
    if (Array.isArray(entry)) return entry as number[];
    return [];
  });
}

function parseStoredLayout(raw: Record<string, unknown>): SeatingLayout {
  const updatedAtVal = raw.updatedAt;
  let updatedAt: string;
  if (
    updatedAtVal &&
    typeof updatedAtVal === 'object' &&
    'toDate' in updatedAtVal &&
    typeof (updatedAtVal as { toDate: () => Date }).toDate === 'function'
  ) {
    updatedAt = (updatedAtVal as { toDate: () => Date }).toDate().toISOString();
  } else if (typeof updatedAtVal === 'string') {
    updatedAt = updatedAtVal;
  } else {
    updatedAt = new Date(0).toISOString();
  }

  return {
    rows: rowsFromStorage(raw.rows),
    names: raw.names as Record<string, string>,
    maxSeats: raw.maxSeats as number,
    updatedAt,
    updatedByAdminUid: (raw.updatedByAdminUid as string | undefined) ?? '',
  };
}

export async function readSeatingLayout(): Promise<SeatingLayout | null> {
  const snap = await adminFirestore.collection(COLLECTION).doc(DOC_ID).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data) return null;
  return parseStoredLayout(data);
}

export async function writeSeatingLayout(
  next: SeatingLayoutInput,
  adminUid: string,
): Promise<SeatingLayout> {
  validateLayout(next);
  const ref = adminFirestore.collection(COLLECTION).doc(DOC_ID);
  await ref.set({
    rows: rowsToStorage(next.rows),
    names: next.names,
    maxSeats: next.maxSeats,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByAdminUid: adminUid,
  });
  const written = await ref.get();
  const data = written.data();
  if (!data) {
    throw new Error('Failed to read back seating layout after write.');
  }
  return parseStoredLayout(data);
}

export async function seedSeatingLayoutIfMissing(
  adminUid: string,
): Promise<{ created: boolean; layout: SeatingLayout }> {
  const existing = await readSeatingLayout();
  if (existing) return { created: false, layout: existing };
  const layout = await writeSeatingLayout(CANONICAL_SEED, adminUid);
  return { created: true, layout };
}
