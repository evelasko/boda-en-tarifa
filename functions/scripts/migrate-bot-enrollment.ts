#!/usr/bin/env -S node --import tsx
/**
 * migrate-bot-enrollment.ts — one-time provisioning of `botEnrolled: true`
 * across the existing `guests` collection.
 *
 * Spec: `bot/specs/04-data-model.md` §6 ("For one-time provisioning of
 *       `botEnrolled = true` across the existing guest list, run the
 *       migration script ... Idempotent: skips guests already having
 *       the field").
 *
 * Usage:
 *
 *   # 1. Dry-run against the Cloud project the Admin SDK is logged into
 *   #    (default — never writes unless --apply is passed)
 *   npx tsx functions/scripts/migrate-bot-enrollment.ts
 *
 *   # 2. Apply against the configured project
 *   npx tsx functions/scripts/migrate-bot-enrollment.ts --apply
 *
 *   # 3. Pick the project explicitly
 *   GOOGLE_APPLICATION_CREDENTIALS=./sa.json \
 *     FIREBASE_PROJECT_ID=boda-en-tarifa-prod \
 *     npx tsx functions/scripts/migrate-bot-enrollment.ts --apply
 *
 *   # 4. Run against the Firestore emulator
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
 *     npx tsx functions/scripts/migrate-bot-enrollment.ts --apply
 *
 * Exit codes:
 *   0  success (dry-run or apply)
 *   1  uncaught error
 *   2  CLI usage error
 */

import {applicationDefault, initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

const BATCH_SIZE = 400; // Firestore batched writes cap at 500; keep margin.

interface Args {
  apply: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  for (const a of argv) {
    if (a !== "--apply" && a !== "--dry-run") {
      process.stderr.write(`migrate-bot-enrollment: unknown flag ${a}\n`);
      process.exit(2);
    }
  }
  return {apply: argv.includes("--apply")};
}

async function main(): Promise<void> {
  const args = parseArgs();
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
  const db = getFirestore();

  const snap = await db.collection("guests").get();
  process.stdout.write(`Scanned ${snap.size} guest docs.\n`);

  const targets = snap.docs.filter((d) => {
    const data = d.data();
    return data.botEnrolled === undefined;
  });

  process.stdout.write(
    `Eligible (missing botEnrolled): ${targets.length}\n` +
    `Already migrated: ${snap.size - targets.length}\n`
  );

  if (!args.apply) {
    process.stdout.write(
      "Dry run only. Pass --apply to write `botEnrolled: true` to the eligible docs.\n"
    );
    return;
  }

  let written = 0;
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const slice = targets.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const d of slice) {
      batch.update(d.ref, {
        botEnrolled: true,
        // botOnboardingResponded is set later by the welcome-template
        // flow; seed `false` so it has a sensible default.
        botOnboardingResponded: false,
        botMigrationAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    written += slice.length;
    process.stdout.write(`  committed ${written}/${targets.length}\n`);
  }
  process.stdout.write(`Done. Updated ${written} guests.\n`);
}

main().catch((err) => {
  process.stderr.write(`migrate-bot-enrollment failed: ${String(err)}\n`);
  process.exit(1);
});
