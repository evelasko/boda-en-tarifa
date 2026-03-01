#!/usr/bin/env tsx

import {initializeApp, cert, type ServiceAccount} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {readFileSync} from "fs";
import {resolve} from "path";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const guestFlagIndex = args.indexOf("--guest");
const singleGuestEmail =
  guestFlagIndex !== -1 ? args[guestFlagIndex + 1] : null;

if (guestFlagIndex !== -1 && !singleGuestEmail) {
  console.error("Error: --guest flag requires an email argument.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Firebase Admin initialization
// ---------------------------------------------------------------------------

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || args.find((a) => a.endsWith(".json"));

if (!keyPath) {
  console.error(
    "Error: No service account key found.\n" +
      "Set GOOGLE_APPLICATION_CREDENTIALS or pass the key file path as an argument."
  );
  process.exit(1);
}

let serviceAccount: ServiceAccount;
try {
  const raw = readFileSync(resolve(keyPath), "utf-8");
  serviceAccount = JSON.parse(raw) as ServiceAccount;
} catch (err) {
  console.error(`Error: Could not read service account key at "${keyPath}".`);
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

initializeApp({credential: cert(serviceAccount)});

const db = getFirestore();
const auth = getAuth();

const DEEP_LINK_DOMAIN = process.env.DEEP_LINK_DOMAIN || "bodaentarifa.com";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Build query for unclaimed guest profiles
  let query: FirebaseFirestore.Query = db
    .collection("guests")
    .where("profileClaimed", "==", false);

  if (singleGuestEmail) {
    query = query.where("email", "==", singleGuestEmail.toLowerCase());
  }

  const snapshot = await query.get();

  if (snapshot.empty) {
    const filter = singleGuestEmail
      ? ` matching email "${singleGuestEmail}"`
      : "";
    console.error(`No unclaimed guest profiles found${filter}.`);
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} unclaimed guest(s).`);

  if (dryRun) {
    console.log("\n-- DRY RUN -- No tokens will be generated.\n");
    console.log("fullName,email");
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`${csvEscape(data.fullName)},${csvEscape(data.email)}`);
    }
    return;
  }

  // CSV header
  console.log("\nfullName,email,magicLinkUrl");

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const uid = doc.id;
    const fullName: string = data.fullName ?? "";
    const email: string = data.email ?? "";

    try {
      const customToken = await auth.createCustomToken(uid);

      const params = new URLSearchParams({token: customToken});
      if (fullName) {
        params.set("name", fullName);
      }
      const deepLinkUrl = `https://${DEEP_LINK_DOMAIN}/login?${params.toString()}`;

      console.log(
        `${csvEscape(fullName)},${csvEscape(email)},${csvEscape(deepLinkUrl)}`
      );
    } catch (err) {
      console.error(
        `Failed to generate token for ${fullName} (${uid}):`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
