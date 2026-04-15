import {beforeUserCreated, HttpsError} from "firebase-functions/v2/identity";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const MAGIC_LINK_ISSUES_COLLECTION = "magic_link_issues";

export const onUserCreate = beforeUserCreated(
  {region: "europe-west1", timeoutSeconds: 60, maxInstances: 10},
  async (event) => {
    if (!event.data) {
      logger.warn("No user data in event");
      return {customClaims: {authorized: false}};
    }

    const {uid} = event.data;
    const db = getFirestore();
    const guestDocRef = db.collection("guests").doc(uid);

    // 1. Query guests collection by canonical UID.
    let guestDoc;
    try {
      guestDoc = await guestDocRef.get();
    } catch (error) {
      logger.error("Firestore guest lookup failed", {
        uid,
        error,
      });
      throw new HttpsError("internal", "Failed to verify guest status.");
    }

    // 2. No match — unauthorized.
    if (!guestDoc.exists) {
      logger.warn("UID not found in guest allowlist", {uid});
      return {customClaims: {authorized: false}};
    }

    // 3. Match found — authorize.
    const guestData = guestDoc.data() ?? {};

    try {
      if (!guestData?.profileClaimed) {
        // First-time claim.
        await guestDoc.ref.update({
          profileClaimed: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
        logger.info("Profile claimed", {uid});
      } else {
        // Profile already claimed — idempotent, skip update.
        logger.info("Profile already claimed, skipping update", {
          uid,
        });
      }
    } catch (error) {
      logger.error("Failed to update guest document", {
        uid,
        error,
      });
      throw new HttpsError("internal", "Failed to complete profile claim.");
    }

    try {
      const activeIssueSnapshot = await db
        .collection(MAGIC_LINK_ISSUES_COLLECTION)
        .where("guestUid", "==", uid)
        .where("usedAt", "==", null)
        .where("revokedAt", "==", null)
        .orderBy("issuedAt", "desc")
        .limit(1)
        .get();

      if (!activeIssueSnapshot.empty) {
        await activeIssueSnapshot.docs[0].ref.update({
          usedAt: new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      logger.warn("Failed to mark magic-link issue as used", {uid, error});
    }

    // 4. Build custom claims.
    const claims: Record<string, boolean> = {authorized: true};
    if (guestData.isAdmin === true) {
      claims.admin = true;
    }

    return {customClaims: claims};
  }
);
