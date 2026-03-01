import {beforeUserCreated, HttpsError} from "firebase-functions/v2/identity";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

export const onUserCreate = beforeUserCreated(
  {region: "europe-west1", timeoutSeconds: 60, maxInstances: 10},
  async (event) => {
    if (!event.data) {
      logger.warn("No user data in event");
      return {customClaims: {authorized: false}};
    }

    const {uid, email} = event.data;

    // 1. Validate email exists
    if (!email) {
      logger.warn("User created without email", {uid});
      return {customClaims: {authorized: false}};
    }

    const normalizedEmail = email.toLowerCase();
    const db = getFirestore();

    // 2. Query guests collection for matching email
    let guestsSnapshot;
    try {
      guestsSnapshot = await db
        .collection("guests")
        .where("email", "==", normalizedEmail)
        .limit(1)
        .get();
    } catch (error) {
      logger.error("Firestore query failed", {
        uid, email: normalizedEmail, error,
      });
      throw new HttpsError("internal", "Failed to verify guest status.");
    }

    // 3. No match — unauthorized
    if (guestsSnapshot.empty) {
      logger.warn("Email not in allowlist", {uid, email: normalizedEmail});
      return {customClaims: {authorized: false}};
    }

    // 4. Match found — authorize
    const guestDoc = guestsSnapshot.docs[0];
    const guestData = guestDoc.data();

    try {
      if (guestDoc.id !== uid) {
        // Guest doc ID differs from Auth UID (e.g. Google/Apple sign-in).
        // Migrate: create new doc with Auth UID, delete the old one.
        const batch = db.batch();
        batch.set(db.collection("guests").doc(uid), {
          ...guestData,
          profileClaimed: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
        batch.delete(guestDoc.ref);
        await batch.commit();
        logger.info("Migrated guest document to Auth UID", {
          oldDocId: guestDoc.id,
          newDocId: uid,
          email: normalizedEmail,
        });
      } else if (!guestData.profileClaimed) {
        // Same UID, first-time claim
        await guestDoc.ref.update({
          profileClaimed: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
        logger.info("Profile claimed", {uid, email: normalizedEmail});
      } else {
        // Profile already claimed — idempotent, skip update
        logger.info("Profile already claimed, skipping update", {
          uid,
          email: normalizedEmail,
        });
      }
    } catch (error) {
      logger.error("Failed to update guest document", {
        uid,
        email: normalizedEmail,
        guestDocId: guestDoc.id,
        error,
      });
      throw new HttpsError("internal", "Failed to complete profile claim.");
    }

    // 5. Build custom claims
    const claims: Record<string, boolean> = {authorized: true};
    if (guestData.isAdmin === true) {
      claims.admin = true;
    }

    return {customClaims: claims};
  }
);
