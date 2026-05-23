/**
 * Shared idempotency primitive for scheduled triggers (A2 / A3 / A4).
 *
 * Each scheduled function lays down a marker document the first time it
 * fires for a given (kind, key) pair, before doing any work. Subsequent
 * ticks check the marker and skip if present.
 *
 * Collections used:
 *   - `bot_event_reminder_log/{eventId}_{leadMinutes}`
 *   - `bot_content_unlock_log/{unlockId}`
 *   - `bot_film_developed_log/{yyyy-mm-dd}`
 *
 * The marker is written with `create()` so a race between two concurrent
 * ticks results in exactly one winner — the loser gets `ALREADY_EXISTS`
 * and can skip cleanly.
 */

import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";

export type ScheduledMarkerCollection =
  | "bot_event_reminder_log"
  | "bot_content_unlock_log"
  | "bot_film_developed_log";

/**
 * Try to claim a scheduled-trigger marker. Returns `true` if this caller
 * is the unique winner (first to claim). Returns `false` if the marker
 * already exists — the caller should skip the side-effectful work.
 */
export async function claimScheduledMarker(args: {
  collection: ScheduledMarkerCollection;
  id: string;
  payload?: Record<string, unknown>;
}): Promise<boolean> {
  const ref = getFirestore().collection(args.collection).doc(args.id);
  try {
    await ref.create({
      ...(args.payload ?? {}),
      createdAt: FieldValue.serverTimestamp(),
    });
    return true;
  } catch (err: unknown) {
    if (isAlreadyExists(err)) return false;
    throw err;
  }
}

function isAlreadyExists(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = (err as {code?: number | string}).code;
  return code === 6 || code === "already-exists";
}
