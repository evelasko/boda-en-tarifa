#!/usr/bin/env node
/**
 * Seed `bot_content_unlocks/seating_2026-05-30` from the live `seating/`
 * collection so the Saturday 19:30 seating-reveal broadcast (A3) has the
 * per-guest variables it needs.
 * ============================================================================
 *
 * Inputs (read from Firestore):
 *   - `seating/{guestUid}` — `{guestUid, tableName, seatNumber, tableNumber}`
 *     authored via the existing admin seating editor
 *     (`web/src/app/admin/seating/layout/page.tsx`).
 *   - `guests/{uid}` — used only to verify each seated guest still exists.
 *
 * Output (written to Firestore):
 *   `bot_content_unlocks/seating_2026-05-30 = {
 *     unlockAt: "2026-05-30T19:30:00+02:00",
 *     templateName: "seating_unlocked",
 *     audience: {
 *       requiresNight: "saturday",       // exclude guests not staying Sat
 *       guestIds: [...seatedGuestIds],   // and limit to seated guests
 *     },
 *     varsByGuest: {
 *       "<guestId>": { tableLabel: "Mesa 7", seatingToken: "<guestId>" },
 *       ...
 *     },
 *     enabled: true,
 *     perMinuteCap: 60,
 *   }`
 *
 * The seating-unlock template (`seating_unlock` on Meta) expects three
 * variables: `firstName` (auto from the audience member), `tableLabel`
 * (from `seating.tableName`), and `seatingToken` (the URL-button param).
 * No signed-token system exists; we use the guestId as the token. The
 * button URL `https://bodaentarifa.com/mi-mesa/{guestId}` will 404 until
 * an operator adds the route — body text still tells the guest their table.
 *
 * Usage:
 *   node bot/scripts/seed-seating-unlock.mjs            # write
 *   node bot/scripts/seed-seating-unlock.mjs --dry-run  # log + exit
 *
 * Credentials:
 *   Same as sync-kb.mjs — set GOOGLE_APPLICATION_CREDENTIALS to a
 *   Firebase service-account JSON path, or FIREBASE_SERVICE_ACCOUNT_PATH
 *   in `bot/.env`.
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

const UNLOCK_DOC_ID = 'seating_2026-05-30';
const UNLOCK_AT_ISO = '2026-05-30T19:30:00+02:00';
const TEMPLATE_NAME = 'seating_unlocked';

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

  console.log('Reading seating/ ...');
  const seatingSnap = await db.collection('seating').get();
  if (seatingSnap.empty) {
    throw new Error(
      'seating/ is empty — seed the seating editor in the admin UI first.',
    );
  }

  console.log('Reading guests/ ...');
  const guestsSnap = await db.collection('guests').get();
  const guestIds = new Set(guestsSnap.docs.map((d) => d.id));

  const varsByGuest = {};
  const seatedGuestIds = [];
  let missingGuestRefs = 0;
  let missingTableName = 0;

  for (const doc of seatingSnap.docs) {
    const data = doc.data();
    const guestUid = data.guestUid ?? doc.id;
    const tableName = data.tableName;
    if (!guestIds.has(guestUid)) {
      missingGuestRefs += 1;
      continue;
    }
    if (typeof tableName !== 'string' || tableName.length === 0) {
      missingTableName += 1;
      continue;
    }
    varsByGuest[guestUid] = {
      tableLabel: tableName,
      seatingToken: guestUid, // placeholder until a signed-token route ships
    };
    seatedGuestIds.push(guestUid);
  }

  seatedGuestIds.sort();

  console.log(`Seated guests: ${seatedGuestIds.length}`);
  if (missingGuestRefs > 0) {
    console.warn(`Skipped ${missingGuestRefs} seating rows whose guest doc was missing.`);
  }
  if (missingTableName > 0) {
    console.warn(`Skipped ${missingTableName} seating rows without a tableName.`);
  }

  const payload = {
    unlockAt: UNLOCK_AT_ISO,
    templateName: TEMPLATE_NAME,
    enabled: true,
    audience: {
      requiresNight: 'saturday',
      guestIds: seatedGuestIds,
    },
    varsByGuest,
    perMinuteCap: 60,
  };

  if (DRY_RUN) {
    console.log('--dry-run: not writing. Preview:');
    console.log(
      JSON.stringify(
        { id: UNLOCK_DOC_ID, ...payload, varsByGuest: `(${seatedGuestIds.length} entries)` },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`Writing bot_content_unlocks/${UNLOCK_DOC_ID} ...`);
  await db.collection('bot_content_unlocks').doc(UNLOCK_DOC_ID).set(payload);
  console.log('✅ Done. The botContentUnlockTick scheduler will fire it at ' + UNLOCK_AT_ISO);
}

// ─────────────────────────────────────────────────
// Helpers (mirror bot/scripts/sync-kb.mjs)
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
