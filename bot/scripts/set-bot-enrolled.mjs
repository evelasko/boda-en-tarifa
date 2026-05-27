#!/usr/bin/env node
/**
 * Set `botEnrolled` on every `guests/` document so the welcome-onboarding
 * broadcast can begin.
 * ============================================================================
 *
 *   - All guests default to `botEnrolled: true`.
 *   - The UIDs in EXCLUDED_UIDS (children + elders not on WhatsApp) are
 *     explicitly set to `botEnrolled: false` so they are skipped by the
 *     broadcast audience filter.
 *
 * Usage:
 *   node bot/scripts/set-bot-enrolled.mjs            # write
 *   node bot/scripts/set-bot-enrolled.mjs --dry-run  # log + exit
 *
 * Credentials: same as the other bot/scripts/*.mjs — set
 * GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_PATH in
 * bot/.env, pointing to a Firebase service-account JSON key.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initializeApp,
  applicationDefault,
  cert,
  getApps,
} from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..', '..');

const EXCLUDED_UIDS = new Set([
  'primita-2-abigail-velasco',
  'primita-1-ana-carolina-velasco',
  'irene-irene-alonso',
  'plus-1-fery-krisztian-toth',
  'lucas-lucas-redondo',
  'tia-mayi-mara-elena-estrada',
  'sara-sara-alonso',
]);

// Firestore batched writes cap at 500 operations.
const BATCH_LIMIT = 450;

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');

main().catch((err) => {
  console.error('FATAL:', err.message ?? err);
  process.exit(1);
});

async function main() {
  loadDotEnv();
  initFirebase();
  const db = getFirestore();

  console.log('Reading guests/ ...');
  const snap = await db.collection('guests').get();
  if (snap.empty) {
    throw new Error('guests/ is empty — nothing to update.');
  }

  const enrolled = [];
  const excluded = [];
  const missingExclusions = new Set(EXCLUDED_UIDS);

  for (const doc of snap.docs) {
    if (EXCLUDED_UIDS.has(doc.id)) {
      excluded.push(doc.id);
      missingExclusions.delete(doc.id);
    } else {
      enrolled.push(doc.id);
    }
  }

  console.log(`Total guests:       ${snap.size}`);
  console.log(`Will set true:      ${enrolled.length}`);
  console.log(`Will set false:     ${excluded.length}`);
  if (missingExclusions.size > 0) {
    console.warn(
      `⚠️  ${missingExclusions.size} excluded UID(s) not found in guests/: ` +
        [...missingExclusions].join(', '),
    );
  }

  if (DRY_RUN) {
    console.log('--dry-run: not writing. Preview:');
    console.log(`  botEnrolled=true → ${enrolled.length} docs`);
    console.log(`  botEnrolled=false → ${excluded.join(', ') || '(none)'}`);
    return;
  }

  console.log('Writing updates ...');
  let written = 0;
  let batch = db.batch();
  let inBatch = 0;

  for (const doc of snap.docs) {
    const botEnrolled = !EXCLUDED_UIDS.has(doc.id);
    batch.update(doc.ref, { botEnrolled });
    inBatch += 1;
    if (inBatch >= BATCH_LIMIT) {
      await batch.commit();
      written += inBatch;
      console.log(`  committed ${written}/${snap.size}`);
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (inBatch > 0) {
    await batch.commit();
    written += inBatch;
  }

  console.log(`✅ Done. Updated ${written} guests.`);
}

// ─────────────────────────────────────────────────
// Helpers (mirror bot/scripts/seed-seating-unlock.mjs)
// ─────────────────────────────────────────────────

function loadDotEnv() {
  const candidates = [
    join(REPO_ROOT, 'bot', '.env'),
    join(REPO_ROOT, '.env'),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq <= 0) continue;
      const key = t.slice(0, eq).trim();
      const val = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

function initFirebase() {
  if (getApps().length > 0) return;
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (keyPath) {
    if (!existsSync(keyPath)) {
      throw new Error(`Service account key not found at ${keyPath}.`);
    }
    const serviceAccount = JSON.parse(readFileSync(resolve(keyPath), 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
    return;
  }
  try {
    initializeApp({ credential: applicationDefault() });
  } catch (err) {
    throw new Error(
      'No Firebase credentials available. Set GOOGLE_APPLICATION_CREDENTIALS ' +
      'or FIREBASE_SERVICE_ACCOUNT_PATH in bot/.env, pointing to a service ' +
      'account JSON key.\n' +
      `Underlying: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
