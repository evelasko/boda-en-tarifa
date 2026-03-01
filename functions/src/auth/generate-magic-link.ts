import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

interface GenerateMagicLinkRequest {
  guestUid: string;
}

interface GenerateMagicLinkResponse {
  deepLinkUrl: string;
  expiresAt: string;
}

// 1 hour — Firebase custom token fixed expiry
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

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

    // 3. Read guest document from Firestore
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

    // 4. Mint a custom auth token
    let customToken: string;
    try {
      customToken = await getAuth().createCustomToken(guestUid);
    } catch (error) {
      logger.error("Failed to create custom token", {guestUid, error});
      throw new HttpsError(
        "internal",
        "Failed to generate authentication token."
      );
    }

    // 5. Construct deep link URL
    const domain = process.env.DEEP_LINK_DOMAIN || "bodaentarifa.com";
    const params = new URLSearchParams({token: customToken});
    if (fullName) {
      params.set("name", fullName);
    }
    const deepLinkUrl = `https://${domain}/login?${params.toString()}`;

    // 6. Calculate expiration
    const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS).toISOString();

    logger.info("Magic link generated", {
      guestUid,
      guestName: fullName,
      expiresAt,
    });

    return {deepLinkUrl, expiresAt};
  }
);
