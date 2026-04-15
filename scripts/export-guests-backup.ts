#!/usr/bin/env tsx

import {initializeApp, cert, type ServiceAccount} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {mkdirSync, readFileSync, writeFileSync} from "fs";
import {dirname, resolve} from "path";

interface GuestBackupRecord {
  uid: string;
  data: Record<string, unknown>;
}

function getServiceAccountPath(args: string[]): string {
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    args.find((arg) => arg.endsWith(".json"));

  if (!keyPath) {
    throw new Error(
      "No service account key found. Set GOOGLE_APPLICATION_CREDENTIALS or pass a JSON key path."
    );
  }
  return resolve(keyPath);
}

function getOutputPath(args: string[]): string {
  const outputFlagIndex = args.indexOf("--output");
  if (outputFlagIndex !== -1) {
    const outputPath = args[outputFlagIndex + 1];
    if (!outputPath) {
      throw new Error("The --output flag requires a file path.");
    }
    return resolve(outputPath);
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return resolve(`./backups/guests-backup-${timestamp}.json`);
}

function initAdmin(serviceAccountPath: string): void {
  const raw = readFileSync(serviceAccountPath, "utf-8");
  const serviceAccount = JSON.parse(raw) as ServiceAccount;
  initializeApp({credential: cert(serviceAccount)});
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const serviceAccountPath = getServiceAccountPath(args);
  const outputPath = getOutputPath(args);

  initAdmin(serviceAccountPath);
  const db = getFirestore();

  const guestsSnap = await db.collection("guests").get();
  const records: GuestBackupRecord[] = guestsSnap.docs.map((doc) => ({
    uid: doc.id,
    data: doc.data(),
  }));

  const payload = {
    exportedAt: new Date().toISOString(),
    count: records.length,
    records,
  };

  const outputDir = dirname(outputPath);
  mkdirSync(outputDir, {recursive: true});
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf-8");

  console.log(`Exported ${records.length} guest documents to ${outputPath}`);
}

main().catch((error) => {
  console.error("Guest backup export failed.");
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
