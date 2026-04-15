#!/usr/bin/env tsx

import {initializeApp, getApps} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {FieldPath, getFirestore} from "firebase-admin/firestore";

const DEFAULT_PROJECT_ID = "demo-boda-en-tarifa";
const SEED_PREFIX = "seed_";

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

function initAdmin(projectId: string): void {
  if (getApps().length > 0) return;
  initializeApp({projectId});
}

async function deleteUsersWithPrefix(prefix: string): Promise<number> {
  const auth = getAuth();
  const uids: string[] = [];
  let pageToken: string | undefined;

  do {
    const result = await auth.listUsers(1000, pageToken);
    for (const user of result.users) {
      if (user.uid.startsWith(prefix)) {
        uids.push(user.uid);
      }
    }
    pageToken = result.pageToken;
  } while (pageToken);

  if (uids.length === 0) return 0;

  let deleted = 0;
  const chunkSize = 1000;
  for (let i = 0; i < uids.length; i += chunkSize) {
    const chunk = uids.slice(i, i + chunkSize);
    const result = await auth.deleteUsers(chunk);
    deleted += result.successCount;
    if (result.failureCount > 0) {
      for (const err of result.errors) {
        const uid = chunk[err.index];
        console.warn(
          `Failed to delete auth user ${uid}: ${err.error.message}`
        );
      }
    }
  }

  return deleted;
}

async function deleteDocsByIdPrefix(
  collectionName: string,
  prefix: string
): Promise<number> {
  const db = getFirestore();
  let deleted = 0;

  while (true) {
    const snap = await db
      .collection(collectionName)
      .where(FieldPath.documentId(), ">=", prefix)
      .where(FieldPath.documentId(), "<", `${prefix}\uf8ff`)
      .limit(400)
      .get();

    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    deleted += snap.size;
  }

  return deleted;
}

async function deleteExplicitDocs(
  collectionName: string,
  ids: string[]
): Promise<number> {
  if (ids.length === 0) return 0;
  const db = getFirestore();
  let deleted = 0;

  const chunkSize = 400;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const batch = db.batch();
    for (const id of chunk) {
      batch.delete(db.collection(collectionName).doc(id));
    }
    await batch.commit();
    deleted += chunk.length;
  }

  return deleted;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const projectId = parseProjectId(args);
  const includeRsvp = args.includes("--include-rsvp");
  const includeMigrationCase = args.includes("--include-migration-case");

  const firestoreHost = requireEnv("FIRESTORE_EMULATOR_HOST");
  const authHost = requireEnv("FIREBASE_AUTH_EMULATOR_HOST");

  console.log(`Clearing seeded emulator data for project: ${projectId}`);
  console.log(`Firestore emulator host: ${firestoreHost}`);
  console.log(`Auth emulator host: ${authHost}`);

  initAdmin(projectId);

  const usersDeleted = await deleteUsersWithPrefix(SEED_PREFIX);
  const guestsDeleted = await deleteDocsByIdPrefix("guests", SEED_PREFIX);
  const seatingDeleted = await deleteDocsByIdPrefix("seating", SEED_PREFIX);
  const postsDeleted = await deleteDocsByIdPrefix("feed_posts", SEED_PREFIX);
  const noticesDeleted = await deleteDocsByIdPrefix("notices", SEED_PREFIX);

  let rsvpDeleted = 0;
  if (includeRsvp) {
    rsvpDeleted = await deleteDocsByIdPrefix("rsvp_responses", SEED_PREFIX);
  }

  const contentDeleted = await deleteExplicitDocs("time_gated_content", [
    "cocktail_menu",
    "seating_chart",
    "banquet_menu",
  ]);

  const sentNotificationsDeleted = await deleteExplicitDocs(
    "sent_notifications",
    ["welcome_party_reminder"]
  );

  if (includeMigrationCase) {
    await deleteExplicitDocs("guests", ["seed_legacy_guest_doc_001"]);
  }

  console.log("\nClear complete:");
  console.log(`- Auth users deleted: ${usersDeleted}`);
  console.log(`- guests deleted: ${guestsDeleted}`);
  console.log(`- seating deleted: ${seatingDeleted}`);
  console.log(`- feed_posts deleted: ${postsDeleted}`);
  console.log(`- notices deleted: ${noticesDeleted}`);
  console.log(`- time_gated_content deleted: ${contentDeleted}`);
  console.log(`- sent_notifications deleted: ${sentNotificationsDeleted}`);
  console.log(
    `- rsvp_responses deleted: ${rsvpDeleted}${includeRsvp ? "" : " (skipped)"}`
  );
}

main().catch((error) => {
  console.error("Failed to clear emulator seed data.");
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
