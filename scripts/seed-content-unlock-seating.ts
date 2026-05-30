#!/usr/bin/env tsx

/**
 * Seeds (or overwrites) `bot_content_unlocks/seating_2026-05-30` — the
 * trigger doc the scheduled `botContentUnlockTick` reads to fire the T4
 * `seating_unlocked` broadcast at the configured wall-clock time.
 *
 * The scheduler runs every minute in `Europe/Madrid` and fires any doc
 * whose `unlockAt` is within ±30s of the tick. Idempotency is handled by
 * `bot_content_unlock_log/{id}` — the unlock fires exactly once per id.
 *
 * Default config:
 *   id:          seating_2026-05-30
 *   unlockAt:    2026-05-30T19:30:00+02:00
 *   templateName seating_unlocked
 *   audience:    { rsvpStatus: "attending" }
 *   perMinuteCap 60
 *   enabled:     true
 *
 * Per-guest vars are NOT pre-populated — `dispatch.ts:resolveSeatingVars`
 * auto-resolves `tableLabel` + `seatingToken` from `seating/{guestId}` +
 * `app_config/seating_layout` for every recipient at send time.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npx tsx scripts/seed-content-unlock-seating.ts [options]
 *
 * Options:
 *   --force                 Overwrite an existing doc.
 *   --unlock-at <ISO>       Override `unlockAt` (with timezone offset).
 *                           Useful for ad-hoc test fires:
 *                             --unlock-at "2026-05-30T18:00:00+02:00"
 *   --id <docId>            Override the doc id (default: seating_2026-05-30).
 *                           Use this for parallel test fires:
 *                             --id seating_test_$(date +%s)
 *   --rsvp-status <status>  attending | any | pending | declined
 *                           (default: attending)
 *   --disable               Set `enabled: false` (kill switch).
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

const COLLECTION = 'bot_content_unlocks';
const DEFAULT_ID = 'seating_2026-05-30';
const DEFAULT_UNLOCK_AT = '2026-05-30T19:30:00+02:00';
const DEFAULT_TEMPLATE = 'seating_unlocked';
const DEFAULT_PER_MINUTE_CAP = 60;

type RsvpStatus = 'any' | 'attending' | 'pending' | 'declined';

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

function flagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1) return undefined;
  const v = args[i + 1];
  if (!v || v.startsWith('--')) {
    throw new Error(`Flag ${flag} expects a value.`);
  }
  return v;
}

function isRsvpStatus(s: string): s is RsvpStatus {
  return s === 'any' || s === 'attending' || s === 'pending' || s === 'declined';
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const disable = args.includes('--disable');
  const id = flagValue(args, '--id') ?? DEFAULT_ID;
  const unlockAt = flagValue(args, '--unlock-at') ?? DEFAULT_UNLOCK_AT;
  const rsvpStatusRaw = flagValue(args, '--rsvp-status') ?? 'attending';
  if (!isRsvpStatus(rsvpStatusRaw)) {
    throw new Error(
      `--rsvp-status must be one of: any, attending, pending, declined. Got: ${rsvpStatusRaw}`,
    );
  }

  // Sanity check: `unlockAt` must parse to a real date and have a tz offset.
  if (Number.isNaN(Date.parse(unlockAt))) {
    throw new Error(`--unlock-at is not a valid ISO timestamp: ${unlockAt}`);
  }
  if (!/[Zz]$|[+-]\d{2}:?\d{2}$/.test(unlockAt)) {
    throw new Error(
      `--unlock-at must include a timezone offset (e.g., "+02:00" or "Z"). Got: ${unlockAt}`,
    );
  }

  const serviceAccountPath = getServiceAccountPath(args);
  initAdmin(serviceAccountPath);
  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(id);

  const existing = await ref.get();
  if (existing.exists && !force) {
    console.log(
      `Doc already exists at ${COLLECTION}/${id}. Pass --force to overwrite.`,
    );
    console.log('Current contents:');
    console.log(JSON.stringify(existing.data(), null, 2));
    return;
  }

  const payload: Record<string, unknown> = {
    unlockAt,
    templateName: DEFAULT_TEMPLATE,
    enabled: !disable,
    audience: { rsvpStatus: rsvpStatusRaw },
    perMinuteCap: DEFAULT_PER_MINUTE_CAP,
    // No `varsByGuest`: the dispatcher resolves seating vars per recipient
    // from `seating/{guestId}` + `app_config/seating_layout` at send time.
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(payload);

  console.log(
    `Wrote ${COLLECTION}/${id} (force=${force}, disable=${disable}).`,
  );
  console.log(JSON.stringify(payload, null, 2));

  // Sanity warning: if the doc id has been fired before, the marker
  // exists and the scheduler will skip re-firing. The operator must
  // delete `bot_content_unlock_log/{id}` to re-trigger.
  const markerRef = db.collection('bot_content_unlock_log').doc(id);
  const marker = await markerRef.get();
  if (marker.exists) {
    console.warn('');
    console.warn(
      `WARNING: bot_content_unlock_log/${id} already exists — this id has fired before.`,
    );
    console.warn(
      `The scheduler will SKIP this entry. To re-trigger, delete the marker:`,
    );
    console.warn(`  firebase firestore:delete bot_content_unlock_log/${id}`);
    console.warn(
      'Or use a fresh id: --id seating_2026-05-30_retry',
    );
  }
}

main().catch((error) => {
  console.error('seed-content-unlock-seating failed.');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
