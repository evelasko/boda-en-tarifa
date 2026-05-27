#!/usr/bin/env node
/**
 * op8-teardown-test-phones.mjs — remove every guest seeded by
 * `op8-seed-test-phones.mjs` and all conversation/dedupe/rate artifacts
 * those guests generated.
 * ============================================================================
 *
 * What it deletes (Firestore):
 *   1. guests/{*} where op8TestRun == true
 *   2. bot_conversations/{phone} for each seeded phone, including the
 *      messages subcollection
 *   3. bot_rate/{phone}_* for each seeded phone
 *   4. bot_dedupe entries are intentionally left in place — they expire
 *      via TTL and are useful for post-mortem race-condition analysis.
 *
 * Idempotent. Safe to run multiple times.
 *
 * Usage:
 *   node bot/scripts/op8-teardown-test-phones.mjs            # delete
 *   node bot/scripts/op8-teardown-test-phones.mjs --dry-run  # preview
 *   node bot/scripts/op8-teardown-test-phones.mjs --keep-conversations
 *       # delete guests + rate only; preserve audit trail
 *
 * Credentials: same as sync-kb.mjs.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const argv = process.argv.slice(2);
  return {
    dryRun: argv.includes('--dry-run'),
    keepConversations: argv.includes('--keep-conversations'),
  };
}

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

async function deleteSubcollection(parentRef, name, dryRun) {
  let deleted = 0;
  while (true) {
    const snap = await parentRef.collection(name).limit(200).get();
    if (snap.empty) break;
    if (dryRun) return snap.size;
    const batch = parentRef.firestore.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
    if (snap.size < 200) break;
  }
  return deleted;
}

async function main() {
  const { dryRun, keepConversations } = parseArgs();
  const envFromFile = loadEnvFile(join(__dirname, '..', '.env'));
  initFirebase(envFromFile);
  const db = getFirestore();

  console.log(`Op-8 teardown — ${dryRun ? 'DRY-RUN' : 'DELETE'}` +
    (keepConversations ? ' (keeping conversations)' : ''));
  console.log('─'.repeat(72));

  // 1. Find tagged guests
  const guestSnap = await db.collection('guests')
    .where('op8TestRun', '==', true)
    .get();
  if (guestSnap.empty) {
    console.log('No op8TestRun=true guests found. Nothing to do.');
    return;
  }
  const phones = guestSnap.docs
    .map((d) => d.get('phoneE164'))
    .filter(Boolean);

  console.log(`Found ${guestSnap.size} tagged guests (${phones.length} with phones):`);
  for (const d of guestSnap.docs) {
    console.log(`  guests/${d.id}  ${d.get('phoneE164') ?? '(no phone)'}`);
  }
  console.log('─'.repeat(72));

  // 2. Conversations + messages subcollection
  if (!keepConversations) {
    let totalMsgs = 0;
    for (const phone of phones) {
      const convRef = db.collection('bot_conversations').doc(phone);
      const msgs = await deleteSubcollection(convRef, 'messages', dryRun);
      totalMsgs += msgs;
      if (!dryRun) {
        try { await convRef.delete(); } catch { /* doc may not exist */ }
      }
      console.log(`  bot_conversations/${phone} — ${msgs} message(s) ${dryRun ? '(would delete)' : 'deleted'}`);
    }
    console.log(`  total messages: ${totalMsgs}`);
  }

  // 3. Rate-limit buckets (bot_rate/{phoneNoPlus}_{bucket}).
  // Firestore '__name__' queries need full document refs, not bare
  // doc ids — and bot_rate is tiny (~tens of docs across the active
  // window). List and filter in memory instead.
  const ratePrefixes = phones.map((p) => `${p.replace('+', '')}_`);
  const rateAll = await db.collection('bot_rate').get();
  const rateMatches = rateAll.docs.filter((d) =>
    ratePrefixes.some((pref) => d.id.startsWith(pref))
  );
  if (!dryRun && rateMatches.length > 0) {
    const batch = db.batch();
    rateMatches.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  console.log(`  bot_rate buckets — ${rateMatches.length} ${dryRun ? '(would delete)' : 'deleted'}`);

  // 4. Guests last (so phones list above stays resolvable)
  if (!dryRun) {
    const batch = db.batch();
    guestSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  console.log(`  guests — ${guestSnap.size} ${dryRun ? '(would delete)' : 'deleted'}`);

  console.log('─'.repeat(72));
  if (dryRun) {
    console.log('Dry-run: nothing deleted.');
  } else {
    console.log('✓ Teardown complete. bot_dedupe entries left in place (TTL handles them).');
  }
}

main().catch((err) => {
  console.error('op8-teardown-test-phones failed:', err);
  process.exit(1);
});
