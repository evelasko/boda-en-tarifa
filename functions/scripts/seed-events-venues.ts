#!/usr/bin/env -S node --import tsx
/**
 * seed-events-venues.ts — derive `venues/{venueId}` and `events/{eventId}`
 * Firestore docs from the web app's static `wedding-content.json`.
 *
 * This is a transitional bridge: until the web admin grows a real
 * editor for events/venues (parallel workstream), the JSON file is the
 * source of truth. The bot's KB builder (`functions/src/bot/claude/kb.ts`)
 * reads the Firestore collections; this script keeps them in sync with
 * a one-shot import.
 *
 * Spec alignment:
 *   - Event card shape: `bot/specs/07-knowledge-base.md` §3.2
 *   - Venue card shape: `bot/specs/07-knowledge-base.md` §3.3
 *   - Service types:    `functions/src/bot/services/{events,venues}.ts`
 *
 * Usage:
 *
 *   # 1. Dry-run (default) — print what would be written
 *   npx tsx functions/scripts/seed-events-venues.ts
 *
 *   # 2. Apply against the configured project
 *   npx tsx functions/scripts/seed-events-venues.ts --apply
 *
 *   # 3. Emulator
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
 *     npx tsx functions/scripts/seed-events-venues.ts --apply
 *
 * Exit codes: 0 success, 1 error, 2 CLI usage error.
 */

import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, resolve as resolvePath} from "node:path";
import {applicationDefault, initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

// ── Source JSON shape (mirrors `web/src/types/content.ts`) ────────────────

interface SourceCoords {lat: number; lng: number}
interface SourceVenue {
  name: string;
  address: string;
  coordinates: SourceCoords;
  mapEmbed?: string;
  mapUrl?: string;
  website?: string;
}
interface SourceEvent {
  id: string;
  type: "welcome" | "pre-wedding" | "ceremony" | "celebration" | "party" | "post-wedding";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  description?: string;
  venue: SourceVenue;
}
interface SourceContent {events: SourceEvent[]}

// ── Bot doc shapes (mirror `services/{events,venues}.ts`) ──────────────────

interface SeedVenue {
  id: string;
  name: string;
  type: "beach" | "restaurant" | "private" | "church" | string;
  address: string;
  lat: number;
  lng: number;
  mapsLink?: string;
  webLink?: string;
  notes?: string;
}
interface SeedEvent {
  id: string;
  nameEs: string;
  nameEn: string;
  startAt: string;
  venueId: string;
  whom?: string;
  descriptionEs?: string;
  descriptionEn?: string;
}

// ── Per-event bilingual + venue-type overrides ─────────────────────────────
//
// JSON is Spanish-only and doesn't classify venues. These tables encode
// the English titles + venue typology so the KB renders both columns.
// Operator can override later via the eventual admin UI.

const EVENT_EN_TITLES: Record<string, string> = {
  "early-welcome": "Welcome drinks",
  "pre-wedding": "Pre-wedding party",
  "ceremony": "Ceremony",
  "celebration": "Reception",
  "party": "Party",
  "post-wedding": "Paella brunch",
};

const EVENT_EN_DESCRIPTIONS: Record<string, string> = {
  "early-welcome": "Drinks and tapas on the beach.",
  "pre-wedding": "An evening of celebration before the big day.",
  "ceremony": "The vows, with the ocean as our witness.",
  "celebration": "Cocktail, dinner, and memories under the stars.",
  "party": "Dancing and revelry until morning.",
  "post-wedding": "A relaxed gathering to share stories and say goodbye.",
};

const VENUE_TYPE_OVERRIDES: Record<string, SeedVenue["type"]> = {
  "chiringuito-bora": "beach",
  "casa-explora": "restaurant",
  "surfin-tarifa-surf": "beach",
  "chill-out-hotel-tres-mares": "private",
};

// ── Main ───────────────────────────────────────────────────────────────────

interface Args {apply: boolean; sourcePath: string}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  // Default: web/src/content/wedding-content.json, resolved relative to
  // this script regardless of where the user invokes it from.
  const here = dirname(fileURLToPath(import.meta.url));
  const defaultSrc = resolvePath(
    here, "..", "..", "web", "src", "content", "wedding-content.json"
  );
  const sourceFlag = argv.find((a) => a.startsWith("--source="));
  return {
    apply,
    sourcePath: sourceFlag ? sourceFlag.slice("--source=".length) : defaultSrc,
  };
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Map an event's wedding-local date+time to an ISO string with offset.
 * Wedding window (2026-05-29 → 2026-05-31) is fully inside CEST, so
 * the offset is `+02:00`. Hard-coded rather than imported from date-fns
 * to keep the script dependency-free.
 */
function buildStartAt(date: string, time: string): string {
  return `${date}T${time}:00+02:00`;
}

function deriveVenueId(name: string): string {
  // Trim suffixes like "— Tarifa" / " - Tarifa" before slugifying so
  // "Casa Explora — Tarifa" and "Casa Explora" collapse to one id.
  const cleaned = name.replace(/[—-]\s*Tarifa\s*$/i, "").trim();
  return slugify(cleaned);
}

function venueRecord(src: SourceVenue): SeedVenue {
  const id = deriveVenueId(src.name);
  return {
    id,
    name: src.name,
    type: VENUE_TYPE_OVERRIDES[id] ?? "private",
    address: src.address,
    lat: src.coordinates.lat,
    lng: src.coordinates.lng,
    mapsLink: src.mapUrl,
    webLink: src.website,
  };
}

function eventRecord(src: SourceEvent): SeedEvent {
  const venueId = deriveVenueId(src.venue.name);
  return {
    id: src.id,
    nameEs: src.title,
    nameEn: EVENT_EN_TITLES[src.id] ?? src.title,
    startAt: buildStartAt(src.date, src.time),
    venueId,
    descriptionEs: src.description,
    descriptionEn: EVENT_EN_DESCRIPTIONS[src.id],
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const raw = readFileSync(args.sourcePath, "utf8");
  const content = JSON.parse(raw) as SourceContent;

  // Dedupe venues by derived id; later events that reuse the same
  // venue silently overlap (same data → same doc, no conflict).
  const venuesById = new Map<string, SeedVenue>();
  for (const ev of content.events) {
    const v = venueRecord(ev.venue);
    if (!venuesById.has(v.id)) venuesById.set(v.id, v);
  }

  const events = content.events.map(eventRecord);

  process.stdout.write(
    `Source: ${args.sourcePath}\n` +
    `Parsed: ${content.events.length} events → ` +
    `${events.length} event docs, ${venuesById.size} unique venues.\n\n`
  );

  process.stdout.write("Venues:\n");
  for (const v of venuesById.values()) {
    process.stdout.write(`  - ${v.id.padEnd(32)} ${v.name} (${v.type})\n`);
  }
  process.stdout.write("\nEvents:\n");
  for (const e of events) {
    process.stdout.write(
      `  - ${e.id.padEnd(16)} ${e.startAt}  → venue=${e.venueId}\n` +
      `      ES: ${e.nameEs}\n` +
      `      EN: ${e.nameEn}\n`
    );
  }

  if (!args.apply) {
    process.stdout.write(
      "\nDry run only. Pass --apply to write to Firestore.\n"
    );
    return;
  }

  // Verbose per-step tracing — the Admin SDK retries silently on auth
  // failures and `applicationDefault()` can hang reaching the metadata
  // server. Loud logging here makes a hang's location obvious.
  process.stdout.write("\n[1/5] initializeApp...\n");
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
  process.stdout.write(
    `      projectId=${app.options.projectId ?? "(unresolved)"}\n` +
    `      FIRESTORE_EMULATOR_HOST=${process.env.FIRESTORE_EMULATOR_HOST ?? "(unset)"}\n` +
    `      GOOGLE_APPLICATION_CREDENTIALS=${process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "(unset, using ADC)"}\n`
  );

  process.stdout.write("[2/5] getFirestore...\n");
  const db = getFirestore();

  process.stdout.write("[3/5] building batch...\n");
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();
  for (const v of venuesById.values()) {
    const ref = db.collection("venues").doc(v.id);
    const {id: _ignored, ...rest} = v;
    void _ignored;
    batch.set(ref, {...rest, seededAt: now}, {merge: true});
  }
  for (const e of events) {
    const ref = db.collection("events").doc(e.id);
    const {id: _ignored, ...rest} = e;
    void _ignored;
    batch.set(ref, {...rest, seededAt: now}, {merge: true});
  }

  process.stdout.write("[4/5] committing (30s timeout)...\n");
  await withTimeout(batch.commit(), 30_000, "batch.commit");

  process.stdout.write(
    `[5/5] done — wrote ${venuesById.size} venues + ${events.length} events.\n`
  );
}

/**
 * Reject if `promise` doesn't settle within `ms`. The Admin SDK retries
 * forever on auth/network failure; the timeout converts that into a
 * visible error rather than a silent hang.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      }
    );
  });
}

main().catch((err) => {
  process.stderr.write(`seed-events-venues failed: ${String(err)}\n`);
  process.exit(1);
});
