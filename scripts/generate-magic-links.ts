#!/usr/bin/env tsx

import {initializeApp, cert, type ServiceAccount} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {readFileSync} from "fs";
import {resolve} from "path";
import {toE164, toWhatsappNumber} from "./phone-utils.js";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const guestEmailFlagIndex = args.indexOf("--guest-email");
const singleGuestEmail =
  guestEmailFlagIndex !== -1 ? args[guestEmailFlagIndex + 1] : null;
const guestPhoneFlagIndex = args.indexOf("--guest-phone");
const singleGuestPhone =
  guestPhoneFlagIndex !== -1 ? args[guestPhoneFlagIndex + 1] : null;

if (guestEmailFlagIndex !== -1 && !singleGuestEmail) {
  console.error("Error: --guest-email flag requires an email argument.");
  process.exit(1);
}
if (guestPhoneFlagIndex !== -1 && !singleGuestPhone) {
  console.error("Error: --guest-phone flag requires a phone argument.");
  process.exit(1);
}
if (singleGuestEmail && singleGuestPhone) {
  console.error("Error: use either --guest-email or --guest-phone, not both.");
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
  if (singleGuestPhone) {
    const normalizedWhatsapp = toWhatsappNumber(singleGuestPhone);
    if (!normalizedWhatsapp) {
      console.error("Error: --guest-phone must be a valid international phone.");
      process.exit(1);
    }
    query = query.where("whatsappNumber", "==", normalizedWhatsapp);
  }

  const snapshot = await query.get();

  if (snapshot.empty) {
    const filter = singleGuestEmail ?
      ` matching email "${singleGuestEmail}"` :
      singleGuestPhone ?
        ` matching phone "${singleGuestPhone}"` :
        "";
    console.error(`No unclaimed guest profiles found${filter}.`);
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} unclaimed guest(s).`);

  if (dryRun) {
    console.log("\n-- DRY RUN -- No tokens will be generated.\n");
    console.log("fullName,email,phoneE164,whatsappNumber");
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const email = String(data.email ?? "");
      const phoneE164 = toE164(String(data.phoneE164 ?? "")) ?? "";
      const whatsappNumber =
        toWhatsappNumber(String(data.whatsappNumber ?? "")) ?? "";
      console.log(
        `${csvEscape(data.fullName)},${csvEscape(email)},${csvEscape(phoneE164)},${csvEscape(whatsappNumber)}`
      );
    }
    return;
  }

  // CSV header
  console.log("\nfullName,email,phoneE164,whatsappNumber,whatsappShareUrl,smsShareUrl,magicLinkUrl");

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const uid = doc.id;
    const fullName: string = data.fullName ?? "";
    const email: string = data.email ?? "";
    const phoneE164: string = toE164(String(data.phoneE164 ?? "")) ?? "";
    const whatsappNumber: string =
      toWhatsappNumber(String(data.whatsappNumber ?? "")) ?? "";

    try {
      const customToken = await auth.createCustomToken(uid);

      const params = new URLSearchParams({token: customToken});
      if (fullName) {
        params.set("name", fullName);
      }
      const deepLinkUrl = `https://${DEEP_LINK_DOMAIN}/login?${params.toString()}`;
      const inviteMessage =
        `Hola ${fullName || "invitado/a"}, abre tu invitacion de boda aqui: ${deepLinkUrl}`;
      const whatsappShareUrl = whatsappNumber ?
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(inviteMessage)}` :
        "";
      const smsShareUrl = phoneE164 ?
        `sms:${phoneE164}?body=${encodeURIComponent(inviteMessage)}` :
        "";

      console.log(
        `${csvEscape(fullName)},${csvEscape(email)},${csvEscape(phoneE164)},${csvEscape(whatsappNumber)},${csvEscape(whatsappShareUrl)},${csvEscape(smsShareUrl)},${csvEscape(deepLinkUrl)}`
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
