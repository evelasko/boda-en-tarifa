import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {randomUUID} from "node:crypto";

interface GenerateMagicLinkRequest {
  guestUid: string;
}

interface GenerateMagicLinkResponse {
  deepLinkUrl: string;
  expiresAt: string;
  issuedAt: string;
  linkId: string;
}

const MAGIC_LINK_ISSUES_COLLECTION = "magic_link_issues";
const DEFAULT_TOKEN_TTL_MINUTES = 60;
const DEFAULT_RATE_LIMIT_WINDOW_MINUTES = 10;
const DEFAULT_RATE_LIMIT_PER_GUEST = 5;
const DEFAULT_RATE_LIMIT_PER_ADMIN = 20;

/**
 * Parse positive integer env var with fallback.
 * @param {string} name
 * @param {number} fallback
 * @return {number}
 */
function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/**
 * Parse boolean env var with fallback.
 * @param {string} name
 * @param {boolean} fallback
 * @return {boolean}
 */
function parseBoolEnv(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

export const generateMagicLink = onCall<
  GenerateMagicLinkRequest,
  Promise<GenerateMagicLinkResponse>
>(
  {region: "europe-west1"},
  async (request) => {
    // 1. Validate caller is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Caller must be authenticated."
      );
    }

    // 2. Validate caller has admin privileges
    if (request.auth.token.admin !== true) {
      logger.warn("Non-admin attempted to generate magic link", {
        callerUid: request.auth.uid,
      });
      throw new HttpsError(
        "permission-denied",
        "Caller does not have admin privileges."
      );
    }

    const {guestUid} = request.data;

    if (!guestUid || typeof guestUid !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "guestUid is required and must be a string."
      );
    }

    // 3. Read guest document from Firestore.
    const db = getFirestore();
    const guestDoc = await db.collection("guests").doc(guestUid).get();

    if (!guestDoc.exists) {
      throw new HttpsError(
        "not-found",
        `No guest document found for UID: ${guestUid}`
      );
    }

    const guestData = guestDoc.data();
    const fullName: string = guestData?.fullName ?? "";
    const now = Date.now();
    const issuedAt = new Date(now).toISOString();
    const ttlMinutes = parseIntEnv(
      "MAGIC_LINK_TTL_MINUTES",
      DEFAULT_TOKEN_TTL_MINUTES
    );
    const tokenLifetimeMs = ttlMinutes * 60 * 1000;
    const expiresAt = new Date(now + tokenLifetimeMs).toISOString();
    const revokePrevious = parseBoolEnv(
      "MAGIC_LINK_REVOKE_PREVIOUS_ENABLED",
      true
    );
    const rateLimitWindowMinutes = parseIntEnv(
      "MAGIC_LINK_RATE_LIMIT_WINDOW_MINUTES",
      DEFAULT_RATE_LIMIT_WINDOW_MINUTES
    );
    const rateLimitPerGuest = parseIntEnv(
      "MAGIC_LINK_RATE_LIMIT_PER_GUEST",
      DEFAULT_RATE_LIMIT_PER_GUEST
    );
    const rateLimitPerAdmin = parseIntEnv(
      "MAGIC_LINK_RATE_LIMIT_PER_ADMIN",
      DEFAULT_RATE_LIMIT_PER_ADMIN
    );
    const singleUseEnabled = parseBoolEnv(
      "MAGIC_LINK_SINGLE_USE_ENABLED",
      false
    );

    const rateLimitThreshold = new Date(
      now - rateLimitWindowMinutes * 60 * 1000
    ).toISOString();
    const [recentGuestIssues, recentAdminIssues] = await Promise.all([
      db
        .collection(MAGIC_LINK_ISSUES_COLLECTION)
        .where("guestUid", "==", guestUid)
        .where("issuedAt", ">=", rateLimitThreshold)
        .count()
        .get(),
      db
        .collection(MAGIC_LINK_ISSUES_COLLECTION)
        .where("issuedBy", "==", request.auth.uid)
        .where("issuedAt", ">=", rateLimitThreshold)
        .count()
        .get(),
    ]);

    if (recentGuestIssues.data().count >= rateLimitPerGuest) {
      throw new HttpsError(
        "resource-exhausted",
        "Rate limit reached for this guest. Try again later."
      );
    }
    if (recentAdminIssues.data().count >= rateLimitPerAdmin) {
      throw new HttpsError(
        "resource-exhausted",
        "Rate limit reached for this admin user. Try again later."
      );
    }

    const linkId = randomUUID();

    // 4. Mint a custom auth token.
    let customToken: string;
    try {
      customToken = await getAuth().createCustomToken(guestUid, {
        magicLinkId: linkId,
      });
    } catch (error) {
      logger.error("Failed to create custom token", {guestUid, error});
      throw new HttpsError(
        "internal",
        "Failed to generate authentication token."
      );
    }

    if (revokePrevious) {
      const activeSnapshot = await db
        .collection(MAGIC_LINK_ISSUES_COLLECTION)
        .where("guestUid", "==", guestUid)
        .where("usedAt", "==", null)
        .where("revokedAt", "==", null)
        .get();

      if (!activeSnapshot.empty) {
        const batch = db.batch();
        for (const doc of activeSnapshot.docs) {
          batch.update(doc.ref, {
            revokedAt: issuedAt,
            revokedReason: "superseded",
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        await batch.commit();
      }
    }

    await db.collection(MAGIC_LINK_ISSUES_COLLECTION).doc(linkId).set({
      guestUid,
      issuedBy: request.auth.uid,
      issuedAt,
      expiresAt,
      usedAt: null,
      revokedAt: null,
      revokedReason: null,
      singleUse: singleUseEnabled,
      metadata: {
        guestName: fullName,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 5. Construct deep link URL.
    const domain = process.env.DEEP_LINK_DOMAIN || "bodaentarifa.com";
    const params = new URLSearchParams({token: customToken});
    if (fullName) {
      params.set("name", fullName);
    }
    const deepLinkUrl = `https://${domain}/login?${params.toString()}`;

    logger.info("Magic link generated", {
      linkId,
      guestUid,
      guestName: fullName,
      issuedAt,
      expiresAt,
      ttlMinutes,
      singleUseEnabled,
    });

    return {deepLinkUrl, issuedAt, expiresAt, linkId};
  }
);
