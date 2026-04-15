import {onSchedule} from "firebase-functions/v2/scheduler";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

/** Delete unauthorized Auth users older than 7 days. */
const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

/** Max users per listUsers / deleteUsers call. */
const BATCH_SIZE = 1000;
const MAGIC_LINK_ISSUES_COLLECTION = "magic_link_issues";

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

export const cleanupExpiredMagicLinks = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: "Europe/Madrid",
    region: "europe-west1",
    timeoutSeconds: 120,
    maxInstances: 1,
  },
  async () => {
    const auth = getAuth();
    const db = getFirestore();
    const dryRun = parseBoolEnv("MAGIC_LINK_CLEANUP_DRY_RUN", false);
    const cutoff = Date.now() - GRACE_PERIOD_MS;
    let totalDeleted = 0;
    let totalCandidates = 0;
    let pageToken: string | undefined;

    do {
      const listResult = await auth.listUsers(BATCH_SIZE, pageToken);

      const uidsToDelete: string[] = [];
      for (const user of listResult.users) {
        // Keep authorized users.
        if (user.customClaims?.authorized === true) continue;

        // Keep users still within the grace period.
        const createdAt = new Date(user.metadata.creationTime).getTime();
        if (createdAt > cutoff) continue;

        // Keep users that have a recent pending magic-link issue.
        const recentIssueSnapshot = await db
          .collection(MAGIC_LINK_ISSUES_COLLECTION)
          .where("guestUid", "==", user.uid)
          .where("usedAt", "==", null)
          .where("revokedAt", "==", null)
          .orderBy("issuedAt", "desc")
          .limit(1)
          .get();

        if (!recentIssueSnapshot.empty) {
          const issue = recentIssueSnapshot.docs[0].data();
          const expiresAt = Date.parse(issue.expiresAt as string);
          if (!Number.isNaN(expiresAt) && expiresAt > Date.now()) {
            continue;
          }
        }

        uidsToDelete.push(user.uid);
      }

      if (uidsToDelete.length > 0) {
        totalCandidates += uidsToDelete.length;
        if (dryRun) {
          logger.info("Dry-run cleanup candidate batch", {
            candidateCount: uidsToDelete.length,
            uids: uidsToDelete,
          });
          pageToken = listResult.pageToken;
          continue;
        }

        try {
          const result = await auth.deleteUsers(uidsToDelete);
          totalDeleted += result.successCount;
          if (result.failureCount > 0) {
            logger.warn("Some user deletions failed", {
              failureCount: result.failureCount,
              errors: result.errors.map((e) => ({
                uid: uidsToDelete[e.index],
                error: e.error.message,
              })),
            });
          }
        } catch (error) {
          logger.error("Batch deletion failed", {
            batchSize: uidsToDelete.length,
            error,
          });
          // Continue with next page — don't abort entire cleanup
        }
      }

      pageToken = listResult.pageToken;
    } while (pageToken);

    logger.info("Cleanup completed", {
      dryRun,
      totalCandidates,
      totalDeleted,
    });
  }
);
