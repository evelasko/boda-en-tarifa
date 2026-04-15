#!/usr/bin/env tsx

import {initializeApp, cert, type ServiceAccount} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {readFileSync} from "fs";
import {resolve} from "path";
import {toE164, toWhatsappNumber} from "./phone-utils.js";

type IssueLevel = "error" | "warn";

interface AuditIssue {
  uid: string;
  level: IssueLevel;
  message: string;
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

function initAdmin(serviceAccountPath: string): void {
  const raw = readFileSync(serviceAccountPath, "utf-8");
  const serviceAccount = JSON.parse(raw) as ServiceAccount;
  initializeApp({credential: cert(serviceAccount)});
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");

  const serviceAccountPath = getServiceAccountPath(args);
  initAdmin(serviceAccountPath);

  const db = getFirestore();
  const guestsSnap = await db.collection("guests").get();

  const issues: AuditIssue[] = [];
  const phoneToUid = new Map<string, string>();

  for (const doc of guestsSnap.docs) {
    const data = doc.data();
    const uid = doc.id;
    const email = typeof data.email === "string" ? data.email.trim() : "";
    const phoneE164 = toE164((data.phoneE164 as string | undefined) ?? "");
    const whatsappNumber = toWhatsappNumber(
      (data.whatsappNumber as string | undefined) ?? ""
    );

    if (!email) {
      issues.push({
        uid,
        level: "warn",
        message: "Missing email (acceptable post-migration, ensure phone delivery fields are present).",
      });
    }

    if (!phoneE164 && !whatsappNumber) {
      issues.push({
        uid,
        level: "error",
        message: "Missing valid phone fields. Expected phoneE164 and/or whatsappNumber.",
      });
      continue;
    }

    if (!phoneE164) {
      issues.push({
        uid,
        level: "warn",
        message: "phoneE164 missing or invalid. Recommend storing canonical E.164 format.",
      });
    }

    if (!whatsappNumber) {
      issues.push({
        uid,
        level: "warn",
        message: "whatsappNumber missing or invalid. WhatsApp share links may be unavailable.",
      });
    }

    const dedupeKey = phoneE164 ?? `+${whatsappNumber}`;
    if (dedupeKey) {
      const previousUid = phoneToUid.get(dedupeKey);
      if (previousUid && previousUid !== uid) {
        issues.push({
          uid,
          level: "error",
          message: `Duplicate phone detected (${dedupeKey}) already used by ${previousUid}.`,
        });
      } else {
        phoneToUid.set(dedupeKey, uid);
      }
    }
  }

  const errorCount = issues.filter((issue) => issue.level === "error").length;
  const warnCount = issues.filter((issue) => issue.level === "warn").length;

  console.log(`Audited guests: ${guestsSnap.size}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Warnings: ${warnCount}`);

  if (issues.length > 0) {
    console.log("\nDetailed findings:");
    for (const issue of issues) {
      console.log(`- [${issue.level.toUpperCase()}] ${issue.uid}: ${issue.message}`);
    }
  } else {
    console.log("No issues detected.");
  }

  if (strict && (errorCount > 0 || warnCount > 0)) {
    process.exit(2);
  }

  if (!strict && errorCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Guest audit failed.");
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
