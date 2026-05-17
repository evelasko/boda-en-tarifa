#!/usr/bin/env tsx

/**
 * Seeds `app_config/seating_layout` with the canonical row layout / name map /
 * maxSeats from the spec. Idempotent: if the doc already exists, prints the
 * current contents and exits 0 without modifying. Pass `--force` to overwrite.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npx tsx scripts/seed-seating-layout.ts [--force]
 */

import {
  initializeApp,
  cert,
  getApps,
  type ServiceAccount,
} from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const COLLECTION = 'app_config';
const DOC_ID = 'seating_layout';

// Source of truth: keep in sync with web/src/lib/seating-layout.ts
const CANONICAL_SEED = {
  rows: [
    [2, 1, 3],
    [4, 6, 10, 7],
    [5, 8, 9],
  ],
  names: {
    '1': 'Valdevaqueros',
    '2': 'Punta Paloma',
    '3': 'Los Lances',
    '4': 'Palmones',
    '5': 'Caños de Meca',
    '6': 'Bolonia',
    '7': 'Getares',
    '8': 'Arte y Vida',
    '9': 'El Palmar',
    '10': 'Zahara',
  },
  maxSeats: 12,
};

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

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const adminUid = process.env.SEED_ADMIN_UID ?? 'seed-script';

  const serviceAccountPath = getServiceAccountPath(args);
  initAdmin(serviceAccountPath);
  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(DOC_ID);

  const existing = await ref.get();
  if (existing.exists && !force) {
    console.log(`Layout already exists at ${COLLECTION}/${DOC_ID}. Pass --force to overwrite.`);
    console.log('Current contents:');
    console.log(JSON.stringify(existing.data(), null, 2));
    return;
  }

  // Firestore disallows nested arrays in field values, so each row is stored
  // as `{ tables: number[] }` and unwrapped on read (see
  // web/src/lib/seating-layout-server.ts).
  await ref.set({
    rows: CANONICAL_SEED.rows.map((tables) => ({ tables })),
    names: CANONICAL_SEED.names,
    maxSeats: CANONICAL_SEED.maxSeats,
    updatedAt: FieldValue.serverTimestamp(),
    updatedByAdminUid: adminUid,
  });

  console.log(`Wrote canonical layout to ${COLLECTION}/${DOC_ID} (force=${force}).`);
  console.log(JSON.stringify(CANONICAL_SEED, null, 2));
}

main().catch((error) => {
  console.error('seed-seating-layout failed.');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
