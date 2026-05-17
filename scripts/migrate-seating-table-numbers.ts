#!/usr/bin/env tsx

/**
 * One-shot back-fill: for every doc in `seating/`, resolve its `tableName`
 * against `app_config/seating_layout.names` and write a numeric `tableNumber`
 * field alongside. Unresolved docs get `tableNumber: null` and are logged.
 *
 * Idempotent: docs that already have a numeric `tableNumber` are skipped.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npx tsx scripts/migrate-seating-table-numbers.ts [--dry-run]
 */

import {
  initializeApp,
  cert,
  getApps,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SEATING_COLLECTION = 'seating';
const APP_CONFIG_COLLECTION = 'app_config';
const LAYOUT_DOC_ID = 'seating_layout';

function getServiceAccountPath(args: string[]): string {
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    args.find((arg) => arg.endsWith('.json'));
  if (!keyPath) {
    throw new Error(
      'No service account key found. Set GOOGLE_APPLICATION_CREDENTIALS or pass a JSON key path.',
    );
  }
  return resolve(keyPath);
}

function initAdmin(serviceAccountPath: string): void {
  if (getApps().length > 0) return;
  const raw = readFileSync(serviceAccountPath, 'utf-8');
  const serviceAccount = JSON.parse(raw) as ServiceAccount;
  initializeApp({ credential: cert(serviceAccount) });
}

/**
 * Resolves a raw `seating.tableName` value to a numeric table id. Accepts
 * either a numeric string ("1", "10") or a human-readable table name
 * ("Valdevaqueros"). Mirrors `tableNumberByName` in
 * web/src/lib/seating-layout.ts — keep the two in sync.
 *
 * Production note: the existing seating docs store the table NUMBER in
 * `tableName` as a string (e.g. "1"), not the name. So the numeric form is
 * checked first.
 */
function resolveTableNumber(
  names: Record<string, string>,
  raw: string,
): number | null {
  const needle = (raw ?? '').trim();
  if (!needle) return null;

  if (/^\d+$/.test(needle)) {
    const n = Number(needle);
    if (Number.isInteger(n) && n > 0 && Object.prototype.hasOwnProperty.call(names, String(n))) {
      return n;
    }
    return null;
  }

  const lowered = needle.toLowerCase();
  for (const [key, value] of Object.entries(names)) {
    if (typeof value === 'string' && value.trim().toLowerCase() === lowered) {
      const n = Number(key);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const serviceAccountPath = getServiceAccountPath(args);
  initAdmin(serviceAccountPath);
  const db = getFirestore();

  const layoutSnap = await db.collection(APP_CONFIG_COLLECTION).doc(LAYOUT_DOC_ID).get();
  if (!layoutSnap.exists) {
    console.error(
      `Aborting: ${APP_CONFIG_COLLECTION}/${LAYOUT_DOC_ID} does not exist. Run seed-seating-layout.ts first.`,
    );
    process.exit(2);
  }
  const layoutData = layoutSnap.data() ?? {};
  const names = (layoutData.names ?? {}) as Record<string, string>;

  const seatingSnap = await db.collection(SEATING_COLLECTION).get();

  let updated = 0;
  let unresolved = 0;
  let skipped = 0;

  for (const doc of seatingSnap.docs) {
    const data = doc.data();
    if (typeof data.tableNumber === 'number' && Number.isFinite(data.tableNumber)) {
      skipped += 1;
      continue;
    }
    const tableNameRaw =
      typeof data.tableName === 'string' ? data.tableName : '';
    const resolved = resolveTableNumber(names, tableNameRaw);

    if (resolved === null) {
      unresolved += 1;
      console.error(`UNRESOLVED ${doc.id} "${tableNameRaw}"`);
    }

    if (!dryRun) {
      await doc.ref.set({ tableNumber: resolved }, { merge: true });
    }
    updated += 1;
  }

  console.log(JSON.stringify({ updated, unresolved, skipped, dryRun }, null, 2));
}

main().catch((error) => {
  console.error('migrate-seating-table-numbers failed.');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
