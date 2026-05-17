#!/usr/bin/env node
/**
 * Upload reference photos for guest dossiers to Cloudinary, and sync
 * each per-guest dossier.yaml's `reference_photos` array.
 * ============================================================================
 *
 * Run from the repo root:
 *
 *   # One-time setup
 *   cd bot/scripts && npm install && cd ../..
 *
 *   # Sync a single guest's photos
 *   node bot/scripts/upload-reference-photos.mjs javier-otero
 *
 *   # Sync every guest folder under bot/data/guest-dossiers/
 *   node bot/scripts/upload-reference-photos.mjs --all
 *
 *   # Preview only (no Cloudinary uploads, no YAML writes)
 *   node bot/scripts/upload-reference-photos.mjs javier-otero --dry-run
 *
 * Behavior:
 *   - Treats `bot/data/guest-dossiers/{slug}/` as the canonical source of truth.
 *   - Every .jpg/.jpeg/.png/.webp file in the folder is uploaded to Cloudinary
 *     at `bot/reference/{slug}/{filename-without-ext}` with:
 *       - type: authenticated  (signed-URL access only)
 *       - overwrite: true       (re-runs replace, not duplicate)
 *   - The signed URL is written into `dossier.yaml`'s `reference_photos`
 *     array, preserving every comment and section divider via the `yaml`
 *     library's Document API.
 *   - Idempotent: re-running the script with the same files yields the same
 *     public_ids and the same URLs. Removing a photo locally drops it from
 *     the YAML on next sync (the Cloudinary asset persists as an orphan —
 *     a known limitation; manual cleanup occasionally if needed).
 *
 * Prerequisites:
 *   - Node 18+ (uses built-in URL/path; Cloudinary SDK works on Node 14+).
 *   - bot/.env contains EITHER:
 *       CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
 *     OR all three of:
 *       CLOUDINARY_CLOUD_NAME=...
 *       CLOUDINARY_API_KEY=...
 *       CLOUDINARY_API_SECRET=...
 *   - bot/scripts dependencies installed: `cd bot/scripts && npm install`.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { join, basename, extname } from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { parseDocument } from 'yaml';

// ─────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────

const DOSSIERS_DIR = 'bot/data/guest-dossiers';
const CLOUDINARY_FOLDER = 'bot/reference';
const ENV_PATH = 'bot/.env';
const PHOTO_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(
      `Cannot find ${filePath}. Run this script from the repo root.`,
    );
  }
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

function configureCloudinary(env) {
  if (env.CLOUDINARY_URL) {
    // SDK reads CLOUDINARY_URL from process.env automatically on config()
    process.env.CLOUDINARY_URL = env.CLOUDINARY_URL;
    cloudinary.config({ secure: true });
  } else if (
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  } else {
    throw new Error(
      `Missing Cloudinary credentials in ${ENV_PATH}. Set CLOUDINARY_URL ` +
        `or all of CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.`,
    );
  }
  const cfg = cloudinary.config();
  if (!cfg.cloud_name) {
    throw new Error(
      'Cloudinary cloud_name is not configured. Check your bot/.env values.',
    );
  }
  return cfg;
}

function listGuestSlugs() {
  if (!existsSync(DOSSIERS_DIR)) {
    throw new Error(`Cannot find ${DOSSIERS_DIR}`);
  }
  const entries = readdirSync(DOSSIERS_DIR, { withFileTypes: true });
  return entries
    .filter(
      (e) =>
        e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('_'),
    )
    .map((e) => e.name)
    .sort();
}

function findPhotos(guestDir) {
  const entries = readdirSync(guestDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && PHOTO_EXTS.has(extname(e.name).toLowerCase()))
    .map((e) => join(guestDir, e.name))
    .sort();
}

async function uploadPhoto(localPath, slug, photoBasename, opts) {
  const publicId = `${CLOUDINARY_FOLDER}/${slug}/${photoBasename}`;

  if (opts.dryRun) {
    return `<dry-run>https://res.cloudinary.com/<cloud>/image/authenticated/s--xxx--/${publicId}.<ext>`;
  }

  const result = await cloudinary.uploader.upload(localPath, {
    public_id: publicId,
    overwrite: true,
    type: 'authenticated',
    resource_type: 'image',
    invalidate: true,
  });

  // Build a signed URL that doesn't expire (tied to API secret).
  // Time-bound auth-token URLs are an optional future upgrade — see README.
  const url = cloudinary.url(publicId, {
    type: 'authenticated',
    resource_type: 'image',
    sign_url: true,
    secure: true,
    version: result.version,
    format: result.format,
  });

  return url;
}

function updateDossierYaml(yamlPath, urls, opts) {
  if (!existsSync(yamlPath)) {
    throw new Error(`Cannot find ${yamlPath}`);
  }
  const text = readFileSync(yamlPath, 'utf8');
  const doc = parseDocument(text);

  // Preserves comments and surrounding ordering; replaces just the value
  // at the `reference_photos` key.
  doc.set('reference_photos', urls);

  const updated = doc.toString({ lineWidth: 0 });

  if (opts.dryRun) {
    console.log(
      `   [dry-run] would write ${urls.length} URL(s) to ${yamlPath}`,
    );
    return;
  }

  writeFileSync(yamlPath, updated, 'utf8');
}

async function syncGuest(slug, opts) {
  const guestDir = join(DOSSIERS_DIR, slug);
  if (!existsSync(guestDir)) {
    console.warn(`   ⚠️  No folder at ${guestDir} — skipping.`);
    return;
  }

  const yamlPath = join(guestDir, 'dossier.yaml');
  if (!existsSync(yamlPath)) {
    console.warn(`   ⚠️  No dossier.yaml in ${guestDir} — skipping.`);
    return;
  }

  const photos = findPhotos(guestDir);
  if (photos.length === 0) {
    console.log(
      `   No photos found. reference_photos will be cleared in the YAML.`,
    );
  } else {
    console.log(
      `   Found ${photos.length} photo(s): ${photos.map(basename).join(', ')}`,
    );
  }

  const urls = [];
  for (const photoPath of photos) {
    const photoName = basename(photoPath, extname(photoPath));
    try {
      const url = await uploadPhoto(photoPath, slug, photoName, opts);
      urls.push(url);
      if (!opts.dryRun) {
        const shortUrl = url.length > 90 ? url.slice(0, 87) + '...' : url;
        console.log(`   ✓ ${basename(photoPath)} → ${shortUrl}`);
      } else {
        console.log(`   [dry-run] would upload ${basename(photoPath)}`);
      }
    } catch (e) {
      console.error(
        `   ❌ Upload failed for ${basename(photoPath)}: ${e.message}`,
      );
      throw e;
    }
  }

  updateDossierYaml(yamlPath, urls, opts);
  if (!opts.dryRun && urls.length > 0) {
    console.log(`   ✓ Updated ${yamlPath} (${urls.length} URL(s))`);
  } else if (!opts.dryRun && urls.length === 0) {
    console.log(`   ✓ Updated ${yamlPath} (reference_photos cleared)`);
  }
}

function usage() {
  console.error(`
Usage:
  node bot/scripts/upload-reference-photos.mjs <guest-slug>  [--dry-run]
  node bot/scripts/upload-reference-photos.mjs --all          [--dry-run]

Examples:
  node bot/scripts/upload-reference-photos.mjs javier-otero
  node bot/scripts/upload-reference-photos.mjs --all --dry-run
`);
}

// ─────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const all = args.includes('--all');
const positional = args.find((a) => !a.startsWith('--'));

if (!all && !positional) {
  usage();
  process.exit(1);
}

let env;
try {
  env = loadEnvFile(ENV_PATH);
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}

try {
  const cfg = configureCloudinary(env);
  console.log(
    `\n🐾 Reference-photo sync${dryRun ? ' (DRY RUN — no uploads, no writes)' : ''}`,
  );
  console.log(`   Cloudinary cloud: ${cfg.cloud_name}`);
  console.log(`   Target folder:    ${CLOUDINARY_FOLDER}/{slug}/\n`);
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}

const slugs = all ? listGuestSlugs() : [positional];

if (slugs.length === 0) {
  console.warn(
    `⚠️  No guest folders found under ${DOSSIERS_DIR}. Nothing to do.`,
  );
  process.exit(0);
}

let failed = 0;
for (const slug of slugs) {
  console.log(`▶ ${slug}`);
  try {
    await syncGuest(slug, { dryRun });
  } catch (e) {
    failed += 1;
    console.error(`   ❌ ${slug} failed: ${e.message}`);
  }
  console.log('');
}

if (failed > 0) {
  console.error(`❌ Done with ${failed} failure(s).`);
  process.exit(1);
} else {
  console.log(`✅ Done.`);
}
