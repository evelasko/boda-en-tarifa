#!/usr/bin/env tsx
/**
 * Mint custom-token magic links for Auth users seeded by `seed-emulator.ts`.
 * Uses the Auth + Firestore emulators only (no service account).
 *
 * Keep SEED_AUTH_USERS in sync with `seed-emulator.ts` AUTH_USERS.
 */

import {initializeApp, getApps} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";

const DEFAULT_PROJECT_ID = "demo-boda-en-tarifa";

/** Must match `scripts/seed-emulator.ts` AUTH_USERS. */
const SEED_AUTH_USERS: ReadonlyArray<{
  uid: string;
  email: string;
  displayName: string;
}> = [
  {
    uid: "seed_admin_001",
    email: "admin.one@example.test",
    displayName: "Admin One",
  },
  {
    uid: "seed_guest_001",
    email: "ana.mar@example.test",
    displayName: "Ana del Mar",
  },
  {
    uid: "seed_guest_002",
    email: "luis.rio@example.test",
    displayName: "Luis del Rio",
  },
  {
    uid: "seed_guest_003",
    email: "marta.sol@example.test",
    displayName: "Marta Sol",
  },
  {
    uid: "seed_guest_004",
    email: "pablo.luz@example.test",
    displayName: "Pablo Luz",
  },
  {
    uid: "seed_guest_unclaimed_001",
    email: "sofia.pending@example.test",
    displayName: "Sofia Pending",
  },
  {
    uid: "seed_orphan_001",
    email: "orphan.user@example.test",
    displayName: "Orphan User",
  },
];

const MIGRATION_SEED_USER = {
  uid: "seed_migrated_001",
  email: "migrated.user@example.test",
  displayName: "Migrated User",
} as const;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseProjectId(args: string[]): string {
  const flagIndex = args.indexOf("--project");
  if (flagIndex !== -1) {
    const fromFlag = args[flagIndex + 1];
    if (!fromFlag) {
      throw new Error("The --project flag requires a value.");
    }
    return fromFlag;
  }
  return process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
}

function parseGuestEmail(args: string[]): string | null {
  const flagIndex = args.indexOf("--guest-email");
  if (flagIndex === -1) {
    return null;
  }
  const email = args[flagIndex + 1];
  if (!email) {
    throw new Error("The --guest-email flag requires an email argument.");
  }
  return email.toLowerCase().trim();
}

function initAdmin(projectId: string): void {
  if (getApps().length > 0) {
    return;
  }
  initializeApp({projectId});
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const includeMigration = args.includes("--include-migration-case");
  const projectId = parseProjectId(args);
  const guestEmailFilter = parseGuestEmail(args);

  requireEnv("FIRESTORE_EMULATOR_HOST");
  requireEnv("FIREBASE_AUTH_EMULATOR_HOST");

  let users = [...SEED_AUTH_USERS];
  if (includeMigration) {
    users = [...users, MIGRATION_SEED_USER];
  }

  if (guestEmailFilter) {
    users = users.filter((u) => u.email.toLowerCase() === guestEmailFilter);
    if (users.length === 0) {
      console.error(
        `No seeded emulator user matches email "${guestEmailFilter}".`
      );
      process.exit(1);
    }
  }

  initAdmin(projectId);
  const db = getFirestore();
  const auth = getAuth();
  const domain = process.env.DEEP_LINK_DOMAIN || "bodaentarifa.com";

  console.error(
    `Project: ${projectId} | Generating links for ${users.length} user(s)${dryRun ? " (dry run)" : ""}.`
  );

  if (dryRun) {
    console.log("uid,email,displayName,fullNameFromFirestore");
    for (const u of users) {
      const guest = await db.collection("guests").doc(u.uid).get();
      const fullName = guest.exists ?
        String(guest.data()?.fullName ?? "") :
        "";
      console.log(
        `${csvEscape(u.uid)},${csvEscape(u.email)},${csvEscape(u.displayName)},${csvEscape(fullName)}`
      );
    }
    return;
  }

  console.log("uid,email,fullName,magicLinkUrl");

  for (const u of users) {
    const guest = await db.collection("guests").doc(u.uid).get();
    const fullName: string = guest.exists ?
      String(guest.data()?.fullName ?? u.displayName) :
      u.displayName;

    try {
      await auth.getUser(u.uid);
    } catch (err) {
      const code = (err as {code?: string}).code;
      if (code === "auth/user-not-found") {
        console.error(
          `Skipping ${u.uid}: Auth user not found. Run seed-emulator first (and --include-migration-case if needed).`
        );
        continue;
      }
      throw err;
    }

    const customToken = await auth.createCustomToken(u.uid);
    const params = new URLSearchParams({token: customToken});
    if (fullName) {
      params.set("name", fullName);
    }
    const magicLinkUrl = `https://${domain}/login?${params.toString()}`;

    console.log(
      `${csvEscape(u.uid)},${csvEscape(u.email)},${csvEscape(fullName)},${csvEscape(magicLinkUrl)}`
    );
  }
}

main().catch((err) => {
  console.error("Failed to generate emulator magic links.");
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
