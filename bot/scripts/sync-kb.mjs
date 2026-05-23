#!/usr/bin/env node
/**
 * Sync the bot Knowledge-Base sources from local files (bot/data/) to
 * Firestore.
 * ============================================================================
 *
 * Run from the repo root. Local YAML/JSON files under bot/data/ are the
 * canonical source of truth; this script pushes them into the Firestore
 * documents the bot reads at runtime. The Firestore writes fire the
 * `botKbBumpOn*` triggers (see functions/src/bot/triggers/), which bump
 * `bot_kb_version` and cause the bot's in-process KB cache to rebuild on
 * the next inbound.
 *
 * Plan: bot/docs/kb-implementation-plan.md §4.3.
 * Spec: bot/specs/07-knowledge-base.md §2.
 *
 *   # Sync everything (default if no positional sources)
 *   just sync-kb
 *   node bot/scripts/sync-kb.mjs --all
 *
 *   # Preview without writing
 *   just sync-kb-dry
 *   node bot/scripts/sync-kb.mjs --all --dry-run
 *
 *   # Show per-doc diff against current Firestore (implies dry-run)
 *   just sync-kb-diff
 *   node bot/scripts/sync-kb.mjs --all --diff
 *
 *   # Sync a subset
 *   node bot/scripts/sync-kb.mjs --only faq,dress-codes
 *   node bot/scripts/sync-kb.mjs events venues
 *
 *   # Opt in to deletion of Firestore docs absent from local data
 *   node bot/scripts/sync-kb.mjs --prune --only faq
 *
 * Sources (use either positional or --only):
 *   events, venues, accommodations, faq, couple, dress-codes,
 *   wind-tips, travel, tarifa-guide, bot-kb-extras, guest-dossiers
 *
 * Credentials:
 *   - GOOGLE_APPLICATION_CREDENTIALS env var pointing to a Firebase
 *     service-account JSON key file.
 *   - Or set FIREBASE_SERVICE_ACCOUNT_PATH in bot/.env to the same JSON path.
 *
 * Guest-dossier specialness:
 *   - Folder name (slug) at bot/data/guest-dossiers/{slug}/ must match
 *     the existing `guests/{slug}` Firestore doc ID.
 *   - The script reads `guests/{slug}` to validate existence and
 *     denormalizes phoneE164 / firstName / lastName / language into the
 *     dossier doc on write.
 *   - Missing-guest folders are reported and skipped; the script exits
 *     non-zero if any are missing (forces operator reconciliation before
 *     launch).
 *
 * Behaviors:
 *   - Upserts by default. Pass --prune to delete Firestore docs not
 *     represented in local data (per source).
 *   - Batch writes (max 500 ops per Firestore batch).
 *   - Validation runs BEFORE any write; a single invalid file aborts the
 *     whole sync.
 *   - Re-runnable / idempotent.
 */

import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import {
  FieldValue,
  Timestamp,
  getFirestore,
} from 'firebase-admin/firestore';

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────

const DATA_DIR = 'bot/data';
const DOSSIERS_DIR = 'bot/data/guest-dossiers';
const ENV_PATH = 'bot/.env';
const FIRESTORE_BATCH_MAX = 500;

const SOURCE_NAMES = [
  'events',
  'venues',
  'accommodations',
  'faq',
  'couple',
  'dress-codes',
  'wind-tips',
  'travel',
  'tarifa-guide',
  'bot-kb-extras',
  'guest-dossiers',
];

// ─────────────────────────────────────────────────
// CLI parsing
// ─────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    all: false,
    dryRun: false,
    diff: false,
    prune: false,
    verbose: false,
    only: null, // string[] | null
    positional: [],
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--all') opts.all = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--diff') {
      opts.diff = true;
      opts.dryRun = true; // --diff implies dry-run
    }
    else if (a === '--prune') opts.prune = true;
    else if (a === '--verbose' || a === '-v') opts.verbose = true;
    else if (a === '--only') {
      const next = args[++i];
      if (!next) throw new Error('--only requires a comma-separated list of source names');
      opts.only = next.split(',').map((s) => s.trim()).filter(Boolean);
    }
    else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    }
    else if (a.startsWith('--')) {
      throw new Error(`Unknown flag: ${a}`);
    } else {
      opts.positional.push(a);
    }
  }
  return opts;
}

function printHelp() {
  console.log(`
sync-kb.mjs — Sync bot/data/ → Firestore (KB sources)

Usage:
  node bot/scripts/sync-kb.mjs [options] [sources...]

Options:
  --all              Sync every source. Default if no sources are given.
  --dry-run          Validate + preview; no Firestore writes.
  --diff             Show per-doc diff vs current Firestore (implies dry-run).
  --prune            Delete Firestore docs absent from local data. OFF by default.
  --only <names>     Comma-separated source names.
  --verbose, -v      Log every read/write.
  --help, -h         This help.

Sources (positional or --only):
  ${SOURCE_NAMES.join(', ')}

Examples:
  node bot/scripts/sync-kb.mjs --all
  node bot/scripts/sync-kb.mjs --diff
  node bot/scripts/sync-kb.mjs --only faq,dress-codes
  node bot/scripts/sync-kb.mjs --prune --only faq
  `.trim());
}

// ─────────────────────────────────────────────────
// Source resolution
// ─────────────────────────────────────────────────

function resolveSourceSet(opts) {
  if (opts.only && opts.positional.length > 0) {
    throw new Error('Use either --only OR positional source names, not both.');
  }
  let names;
  if (opts.only) {
    names = opts.only;
  } else if (opts.positional.length > 0) {
    names = opts.positional;
  } else if (opts.all || true) {
    names = [...SOURCE_NAMES];
  }
  // Validate names.
  const unknown = names.filter((n) => !SOURCE_NAMES.includes(n));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown source(s): ${unknown.join(', ')}. ` +
      `Known: ${SOURCE_NAMES.join(', ')}.`,
    );
  }
  return names;
}

// ─────────────────────────────────────────────────
// .env loader (no dotenv dep — same pattern as upload-reference-photos.mjs)
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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

// ─────────────────────────────────────────────────
// Firebase Admin init
// ─────────────────────────────────────────────────

function initFirebase(envFromFile) {
  if (getApps().length > 0) return;

  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    envFromFile.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (keyPath) {
    if (!existsSync(keyPath)) {
      throw new Error(`Service account key not found at ${keyPath}.`);
    }
    const raw = readFileSync(resolve(keyPath), 'utf8');
    const serviceAccount = JSON.parse(raw);
    initializeApp({ credential: cert(serviceAccount) });
    return;
  }

  // Fallback: application-default (gcloud auth application-default login).
  // Useful in CI with workload-identity; less common locally.
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

// ─────────────────────────────────────────────────
// File helpers
// ─────────────────────────────────────────────────

function readYaml(path) {
  if (!existsSync(path)) {
    throw new Error(`File not found: ${path}`);
  }
  const text = readFileSync(path, 'utf8');
  return parseYaml(text);
}

function snakeToCamel(s) {
  return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function objectKeysToCamel(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[snakeToCamel(k)] = v;
  }
  return out;
}

/** YAML record → Firestore fields; doc id is written separately, not in payload. */
function recordToPayload(record) {
  const { id: _docId, ...rest } = record;
  return objectKeysToCamel(rest);
}

// ─────────────────────────────────────────────────
// Validators (lightweight — no zod dep; tight enough for the small set)
// ─────────────────────────────────────────────────

function requireString(v, ctx) {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${ctx}: expected non-empty string, got ${JSON.stringify(v)}`);
  }
  return v;
}

function requireArray(v, ctx) {
  if (!Array.isArray(v)) {
    throw new Error(`${ctx}: expected array, got ${typeof v}`);
  }
  return v;
}

function validateEventsFile(doc) {
  const list = requireArray(doc?.events, 'events.yaml: top-level `events`');
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const ctx = `events[${i}] (id=${e?.id ?? '?'})`;
    requireString(e.id, `${ctx}.id`);
    requireString(e.name_es, `${ctx}.name_es`);
    requireString(e.name_en, `${ctx}.name_en`);
    requireString(e.start_at, `${ctx}.start_at`);
  }
  return list;
}

function validateVenuesFile(doc) {
  const list = requireArray(doc?.venues, 'venues.yaml: top-level `venues`');
  for (let i = 0; i < list.length; i++) {
    const v = list[i];
    const ctx = `venues[${i}] (id=${v?.id ?? '?'})`;
    requireString(v.id, `${ctx}.id`);
    requireString(v.name, `${ctx}.name`);
  }
  return list;
}

function validateAccommodationsFile(doc) {
  const list = requireArray(
    doc?.accommodations,
    'accommodations.yaml: top-level `accommodations`',
  );
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    const ctx = `accommodations[${i}] (id=${a?.id ?? '?'})`;
    requireString(a.id, `${ctx}.id`);
    requireString(a.name, `${ctx}.name`);
  }
  return list;
}

function validateFaqFile(doc) {
  const list = requireArray(doc?.faq, 'faq.yaml: top-level `faq`');
  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    const ctx = `faq[${i}] (id=${f?.id ?? '?'})`;
    requireString(f.id, `${ctx}.id`);
    requireString(f.question_es, `${ctx}.question_es`);
    requireString(f.question_en, `${ctx}.question_en`);
    requireString(f.answer_es, `${ctx}.answer_es`);
    requireString(f.answer_en, `${ctx}.answer_en`);
  }
  return list;
}

function validateDossierFile(doc, slug) {
  const ctx = `dossier(${slug})`;
  requireString(doc?.name, `${ctx}.name`);
  requireString(doc?.relationship, `${ctx}.relationship`);
  if (doc.guestId !== undefined) {
    throw new Error(
      `${ctx}: legacy 'guestId' field found — must be removed. ` +
      `Identity is carried by the folder name (slug). See ` +
      `bot/specs/guest-dossier-schema.md §3.`,
    );
  }
  if (typeof doc.recognition_confidence_floor !== 'number') {
    throw new Error(
      `${ctx}.recognition_confidence_floor: expected number 0-1, got ` +
      `${typeof doc.recognition_confidence_floor}`,
    );
  }
  return doc;
}

// ─────────────────────────────────────────────────
// Source descriptors
// ─────────────────────────────────────────────────

/**
 * Each source descriptor knows how to:
 *   - load() local content (returns { localDocs: [{ id, payload }] })
 *   - target Firestore collection or doc path
 *   - the kind of write: 'collection' (many docs) or 'single' (one doc)
 *
 * Special: 'guest-dossiers' carries side validation (look up guests/{slug}).
 */
function describeSources(opts) {
  return {
    'events': {
      kind: 'collection',
      collection: 'events',
      load: () => {
        const file = join(DATA_DIR, 'events.yaml');
        const doc = readYaml(file);
        const list = validateEventsFile(doc);
        return list.map((e) => ({
          id: e.id,
          payload: recordToPayload(e),
        }));
      },
    },
    'venues': {
      kind: 'collection',
      collection: 'venues',
      load: () => {
        const file = join(DATA_DIR, 'venues.yaml');
        const doc = readYaml(file);
        const list = validateVenuesFile(doc);
        return list.map((v) => ({
          id: v.id,
          payload: recordToPayload(v),
        }));
      },
    },
    'accommodations': {
      kind: 'collection',
      collection: 'accommodations',
      load: () => {
        const file = join(DATA_DIR, 'accommodations.yaml');
        const doc = readYaml(file);
        const list = validateAccommodationsFile(doc);
        return list.map((a) => ({
          id: a.id,
          payload: recordToPayload(a),
        }));
      },
    },
    'faq': {
      kind: 'collection',
      collection: 'faq',
      load: () => {
        const file = join(DATA_DIR, 'faq.yaml');
        const doc = readYaml(file);
        const list = validateFaqFile(doc);
        return list.map((f) => ({
          id: f.id,
          payload: {
            // FAQ keeps snake_case to match spec §6 schema.
            question_es: f.question_es,
            question_en: f.question_en,
            answer_es: f.answer_es,
            answer_en: f.answer_en,
            tags: f.tags ?? [],
            active: f.active ?? true,
            order: f.order ?? 0,
          },
        }));
      },
    },
    'couple': {
      kind: 'single',
      docPath: 'config/couple',
      load: () => {
        const file = join(DATA_DIR, 'couple-dossier.yaml');
        const doc = readYaml(file);
        if (!doc || typeof doc !== 'object') {
          throw new Error('couple-dossier.yaml: parse failed or empty');
        }
        return doc;
      },
    },
    'dress-codes': {
      kind: 'single',
      docPath: 'config/dress_codes',
      load: () => {
        const file = join(DATA_DIR, 'dress-codes.yaml');
        const doc = readYaml(file);
        if (!doc?.codes || typeof doc.codes !== 'object') {
          throw new Error('dress-codes.yaml: missing top-level `codes` map');
        }
        return doc;
      },
    },
    'wind-tips': {
      kind: 'single',
      docPath: 'config/wind_tips',
      load: () => {
        const file = join(DATA_DIR, 'wind-tips.yaml');
        const doc = readYaml(file);
        return doc;
      },
    },
    'travel': {
      kind: 'single',
      docPath: 'config/travel',
      load: () => {
        const file = join(DATA_DIR, 'travel.yaml');
        const doc = readYaml(file);
        return doc;
      },
    },
    'tarifa-guide': {
      kind: 'single',
      docPath: 'config/tarifa_guide',
      load: () => {
        const file = join(DATA_DIR, 'tarifa-guide.yaml');
        const doc = readYaml(file);
        return doc;
      },
    },
    'bot-kb-extras': {
      kind: 'single',
      docPath: 'config/bot_kb_extras',
      load: () => {
        const file = join(DATA_DIR, 'bot-kb-extras.yaml');
        const doc = readYaml(file);
        if (!doc?.moderation_hints) {
          throw new Error('bot-kb-extras.yaml: missing `moderation_hints`');
        }
        return doc;
      },
    },
    'guest-dossiers': {
      kind: 'collection',
      collection: 'guest_dossier',
      requiresGuestLookup: true,
      load: () => {
        if (!existsSync(DOSSIERS_DIR)) {
          throw new Error(`Missing dossiers dir: ${DOSSIERS_DIR}`);
        }
        const entries = readdirSync(DOSSIERS_DIR);
        const out = [];
        for (const entry of entries) {
          const full = join(DOSSIERS_DIR, entry);
          if (!statSync(full).isDirectory()) continue;
          const yamlPath = join(full, 'dossier.yaml');
          if (!existsSync(yamlPath)) continue; // README, etc.
          const doc = readYaml(yamlPath);
          validateDossierFile(doc, entry);
          // Payload is the raw dossier object with denormalization slots
          // (phoneE164/firstName/lastName/language) filled in at sync time.
          out.push({
            id: entry,
            payload: {
              name: doc.name,
              preferredName: doc.preferred_name ?? null,
              referencePhotos: doc.reference_photos ?? [],
              recognizableFor: doc.recognizable_for ?? null,
              recognitionConfidenceFloor: doc.recognition_confidence_floor,
              relationship: doc.relationship,
              hometown: doc.hometown ?? null,
              languageOverride: doc.language ?? null,
              safeFacts: doc.safe_facts ?? [],
              safeJokes: doc.safe_jokes ?? [],
              doNotMention: doc.do_not_mention ?? [],
              personalIntroFor: doc.personal_intro_for ?? [],
              personalIntroBlurb: doc.personal_intro_blurb ?? null,
              active: doc.active ?? true,
            },
          });
        }
        return out;
      },
    },
  };
}

// ─────────────────────────────────────────────────
// Firestore I/O
// ─────────────────────────────────────────────────

async function listExistingCollection(collection) {
  const snap = await getFirestore().collection(collection).get();
  const map = new Map();
  for (const d of snap.docs) {
    map.set(d.id, d.data());
  }
  return map;
}

async function getSingleDoc(docPath) {
  const snap = await getFirestore().doc(docPath).get();
  return snap.exists ? snap.data() : null;
}

/** Naive structural diff. Returns true if a !== b semantically. */
function isDifferent(a, b) {
  return JSON.stringify(normalize(a)) !== JSON.stringify(normalize(b));
}

function normalize(v) {
  if (v && typeof v === 'object' && v.toDate) {
    // Firestore Timestamp objects — drop their wall-clock and treat as wildcards.
    return '<timestamp>';
  }
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === 'object') {
    const out = {};
    // skip auto-managed fields when diffing
    const skip = new Set(['_syncedAt', 'updatedAt']);
    for (const k of Object.keys(v).sort()) {
      if (skip.has(k)) continue;
      out[k] = normalize(v[k]);
    }
    return out;
  }
  return v ?? null;
}

async function writeCollection({ collection, localDocs, prune, dryRun, diff, verbose }) {
  const existing = await listExistingCollection(collection);

  const seen = new Set();
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  const writes = [];

  for (const { id, payload } of localDocs) {
    seen.add(id);
    const current = existing.get(id) ?? null;
    const enriched = {
      ...payload,
      _syncedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (current === null) {
      added++;
      writes.push({ kind: 'set', id, payload: enriched });
      if (diff || verbose) console.log(`  ADD     ${collection}/${id}`);
    } else if (isDifferent(payload, current)) {
      updated++;
      writes.push({ kind: 'set', id, payload: enriched });
      if (diff || verbose) console.log(`  UPDATE  ${collection}/${id}`);
    } else {
      unchanged++;
      if (verbose) console.log(`  ok      ${collection}/${id}`);
    }
  }

  let pruned = 0;
  if (prune) {
    for (const existingId of existing.keys()) {
      if (seen.has(existingId)) continue;
      writes.push({ kind: 'delete', id: existingId });
      pruned++;
      if (diff || verbose) console.log(`  PRUNE   ${collection}/${existingId}`);
    }
  }

  if (!dryRun) {
    await commitBatches(collection, writes);
  }

  return { added, updated, unchanged, pruned };
}

async function writeSingleDoc({ docPath, payload, dryRun, diff, verbose }) {
  const current = await getSingleDoc(docPath);
  const enriched = {
    ...payload,
    _syncedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  let action = 'UNCHANGED';
  if (current === null) action = 'ADD';
  else if (isDifferent(payload, current)) action = 'UPDATE';

  if (diff || verbose || action !== 'UNCHANGED') {
    console.log(`  ${action.padEnd(8)}${docPath}`);
  }

  if (!dryRun && action !== 'UNCHANGED') {
    await getFirestore().doc(docPath).set(enriched, { merge: false });
  }
  return { action };
}

async function commitBatches(collection, writes) {
  const db = getFirestore();
  for (let i = 0; i < writes.length; i += FIRESTORE_BATCH_MAX) {
    const slice = writes.slice(i, i + FIRESTORE_BATCH_MAX);
    const batch = db.batch();
    for (const w of slice) {
      const ref = db.collection(collection).doc(w.id);
      if (w.kind === 'set') batch.set(ref, w.payload, { merge: false });
      else if (w.kind === 'delete') batch.delete(ref);
    }
    await batch.commit();
  }
}

// ─────────────────────────────────────────────────
// Guest-lookup helper for the dossier source
// ─────────────────────────────────────────────────

async function enrichDossiersWithGuestFields(localDocs) {
  const missing = [];
  const enriched = [];
  for (const { id: slug, payload } of localDocs) {
    const guestSnap = await getFirestore().collection('guests').doc(slug).get();
    if (!guestSnap.exists) {
      missing.push(slug);
      continue;
    }
    const g = guestSnap.data() ?? {};
    enriched.push({
      id: slug,
      payload: {
        ...payload,
        phoneE164: g.phoneE164 ?? null,
        firstName: g.firstName ?? (g.fullName ? String(g.fullName).split(/\s+/)[0] : null),
        lastName: g.lastName ?? null,
        language: payload.languageOverride ?? g.language ?? null,
      },
    });
  }
  return { enriched, missing };
}

// ─────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv);
  } catch (err) {
    console.error(`Error parsing args: ${err.message}`);
    printHelp();
    process.exit(2);
  }

  const envFromFile = loadEnvFile(ENV_PATH);
  initFirebase(envFromFile);

  let names;
  try {
    names = resolveSourceSet(opts);
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }

  const sources = describeSources(opts);

  console.log(`sync-kb: ${names.join(', ')}` +
    (opts.dryRun ? ' [DRY-RUN]' : '') +
    (opts.diff ? ' [DIFF]' : '') +
    (opts.prune ? ' [PRUNE]' : ''));
  console.log('');

  // PASS 1: validate everything before writing anything.
  const loaded = {};
  for (const name of names) {
    const src = sources[name];
    if (!src) throw new Error(`No descriptor for source: ${name}`);
    try {
      loaded[name] = src.load();
    } catch (err) {
      console.error(`[validation] ${name}: ${err.message}`);
      process.exit(3);
    }
  }

  // PASS 2: sync each source.
  let missingGuestSlugs = [];
  const summary = {};

  for (const name of names) {
    const src = sources[name];
    console.log(`▶ ${name}`);

    if (src.kind === 'single') {
      const res = await writeSingleDoc({
        docPath: src.docPath,
        payload: loaded[name],
        dryRun: opts.dryRun,
        diff: opts.diff,
        verbose: opts.verbose,
      });
      summary[name] = `${res.action.toLowerCase()}`;
      console.log('');
      continue;
    }

    // Collection source.
    let localDocs = loaded[name];

    if (src.requiresGuestLookup) {
      const { enriched, missing } = await enrichDossiersWithGuestFields(localDocs);
      missingGuestSlugs = missing;
      localDocs = enriched;
      if (missing.length > 0) {
        console.log(`  ⚠ ${missing.length} dossier folder(s) without a matching guests/{slug} doc:`);
        for (const slug of missing) console.log(`     - ${slug}`);
      }
    }

    const res = await writeCollection({
      collection: src.collection,
      localDocs,
      prune: opts.prune,
      dryRun: opts.dryRun,
      diff: opts.diff,
      verbose: opts.verbose,
    });
    summary[name] = res;
    console.log(`  ${localDocs.length} docs (${res.added} added, ${res.updated} updated, ${res.unchanged} unchanged${res.pruned ? `, ${res.pruned} pruned` : ''})`);
    console.log('');
  }

  console.log('Done.');
  if (opts.dryRun) console.log('(dry-run — no writes committed)');

  if (missingGuestSlugs.length > 0) {
    console.error(
      `\n✗ ${missingGuestSlugs.length} dossier folder(s) had no matching ` +
      `guests/{slug} doc. Rename the folder(s) to match the guests doc ID, ` +
      `or add the missing guests in Firestore, then re-run.`,
    );
    process.exit(4);
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err.stack || err.message || err}`);
  process.exit(1);
});
