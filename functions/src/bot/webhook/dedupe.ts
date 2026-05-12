import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {DEDUPE_TTL_MS} from "../lib/config.js";

/**
 * Inbound idempotency via `bot_dedupe/{messageId}`.
 *
 * Spec: `bot/specs/04-data-model.md` §2 (`bot_dedupe`),
 *       `bot/specs/03-architecture.md` §6.4.
 *
 * Atomic claim using Firestore `create()` (fails if exists).
 * Returns `true` iff this caller is the first to see this messageId.
 * The second-and-later callers receive `false` and must skip processing.
 *
 * Firestore TTL on `ttlExpiresAt` purges entries automatically; configure
 * the TTL policy on the collection in the Firebase console (one-time op).
 */

const COLLECTION = "bot_dedupe";

/**
 * Atomically claim a Meta message ID. Returns true if this is the first
 * time we've seen it; false if it was already claimed.
 *
 * @param {string} messageId Meta `wamid.…` from the webhook payload.
 * @return {Promise<boolean>}
 */
export async function claimMessageId(messageId: string): Promise<boolean> {
  if (!messageId) throw new Error("dedupe: empty messageId");

  const ref = getFirestore().collection(COLLECTION).doc(messageId);
  const ttlExpiresAt = Timestamp.fromMillis(Date.now() + DEDUPE_TTL_MS);

  try {
    await ref.create({
      messageId,
      receivedAt: Timestamp.now(),
      ttlExpiresAt,
      processedSuccessfully: false,
    });
    return true;
  } catch (err: unknown) {
    if (isAlreadyExists(err)) return false;
    throw err;
  }
}

/**
 * Mark a previously-claimed message as fully processed. Used for audit
 * and to distinguish "we crashed mid-flight" from "we deliberately
 * skipped processing" in `bot_dedupe`.
 *
 * @param {string} messageId
 * @return {Promise<void>}
 */
export async function markProcessed(messageId: string): Promise<void> {
  if (!messageId) return;
  await getFirestore()
    .collection(COLLECTION)
    .doc(messageId)
    .update({processedSuccessfully: true});
}

/**
 * Detect Firestore ALREADY_EXISTS errors across SDK versions.
 *
 * @param {unknown} err
 * @return {boolean}
 */
function isAlreadyExists(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as {code?: number | string};
  // gRPC numeric code for ALREADY_EXISTS is 6; string form is "already-exists".
  return e.code === 6 || e.code === "already-exists";
}
