#!/usr/bin/env node
/**
 * op8-seed-test-phones.mjs — create 15 synthetic allowlisted guests for
 * the Op-8 joint load + adversarial test.
 * ============================================================================
 *
 * Why: the allowlist check happens BEFORE any conversation pipeline work
 * (see `functions/src/bot/allowlist.ts`). Without a `guests/{uid}` doc
 * that carries the matching `phoneE164`, an inbound from a synthetic test
 * phone short-circuits to "unknown" and never exercises the dedupe,
 * rate-limit, audit, or Claude paths we want to load-test.
 *
 * What this script writes (Firestore):
 *   guests/op8-test-{NN} = {
 *     fullName: "Op8 Test Phone {NN}",
 *     preferredName: "Test{NN}",
 *     phoneE164: "+34900000{NNN}",
 *     language: "es" | "en",  // alternating, so we exercise both pipelines
 *     botEnrolled: true,
 *     directoryVisible: false,
 *     photoConsent: false,
 *     op8TestRun: true,        // tag for teardown
 *     op8SeededAt: <Timestamp>,
 *   }
 *
 * Phone format: +34 900 000 1xx (Spanish toll-free range; never routed
 * to a real subscriber). Meta send attempts to these numbers will fail
 * silently at the WABA layer, which is harmless for a 10-min concurrency
 * hunt — the failures land in `bot_send_log` with a clear error code.
 *
 * Idempotency: re-running is safe. The doc ids are deterministic
 * (`op8-test-01` through `op8-test-15`) so a second run upserts the
 * same docs. Use `--dry-run` to preview without writing.
 *
 * Usage:
 *   node bot/scripts/op8-seed-test-phones.mjs            # write
 *   node bot/scripts/op8-seed-test-phones.mjs --dry-run  # log + exit
 *   node bot/scripts/op8-seed-test-phones.mjs --count 25 # custom count
 *
 * Teardown: when the test is done, run
 *   node bot/scripts/op8-teardown-test-phones.mjs
 * which deletes every guest doc with `op8TestRun: true`.
 *
 * Credentials: same as sync-kb.mjs — `GOOGLE_APPLICATION_CREDENTIALS`
 * env var or `FIREBASE_SERVICE_ACCOUNT_PATH` in `bot/.env`.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────
// CLI args
// ─────────────────────────────────────────────────

function parseArgs() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const countIdx = argv.indexOf('--count');
  const count = countIdx !== -1 ? Number(argv[countIdx + 1]) : 15;
  if (!Number.isFinite(count) || count < 1 || count > 99) {
    throw new Error(`--count must be 1–99 (got ${argv[countIdx + 1]})`);
  }
  return { dryRun, count };
}

// ─────────────────────────────────────────────────
// .env loader (mirrors sync-kb.mjs pattern)
// ─────────────────────────────────────────────────

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const text = readFileSync(filePath, 'utf8');
  const env = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '').trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function initFirebase(envFromFile) {
  if (getApps().length > 0) return;
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    envFromFile.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (keyPath) {
    if (!existsSync(keyPath)) throw new Error(`Service account not found: ${keyPath}`);
    const serviceAccount = JSON.parse(readFileSync(resolve(keyPath), 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
    return;
  }
  try { initializeApp({ credential: applicationDefault() }); }
  catch (err) {
    throw new Error(
      'No Firebase credentials. Set GOOGLE_APPLICATION_CREDENTIALS or ' +
      'FIREBASE_SERVICE_ACCOUNT_PATH in bot/.env.\n' +
      `Underlying: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ─────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────

async function main() {
  const { dryRun, count } = parseArgs();
  const envFromFile = loadEnvFile(join(__dirname, '..', '.env'));
  initFirebase(envFromFile);
  const db = getFirestore();

  const docs = Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return {
      id: `op8-test-${n}`,
      data: {
        fullName: `Op8 Test Phone ${n}`,
        preferredName: `Test${n}`,
        phoneE164: `+34900000${String(100 + i).padStart(3, '0')}`,
        language: i % 2 === 0 ? 'es' : 'en',
        botEnrolled: true,
        directoryVisible: false,
        photoConsent: false,
        op8TestRun: true,
        op8SeededAt: FieldValue.serverTimestamp(),
      },
    };
  });

  console.log(`Op-8 seed — ${count} synthetic test guests (${dryRun ? 'DRY-RUN' : 'WRITE'})`);
  console.log('─'.repeat(72));
  for (const { id, data } of docs) {
    console.log(`  guests/${id}  ${data.phoneE164}  lang=${data.language}`);
  }
  console.log('─'.repeat(72));

  if (dryRun) {
    console.log('Dry-run: nothing written.');
    return;
  }

  const batch = db.batch();
  for (const { id, data } of docs) {
    batch.set(db.collection('guests').doc(id), data, { merge: true });
  }
  await batch.commit();
  console.log(`✓ Seeded ${docs.length} guests with op8TestRun=true.`);
  console.log('  Run op8-teardown-test-phones.mjs when the test is done.');
}

main().catch((err) => {
  console.error('op8-seed-test-phones failed:', err);
  process.exit(1);
});
