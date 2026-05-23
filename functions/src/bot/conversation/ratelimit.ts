/**
 * Per-phone rate limit: 30 inbound messages per 5-minute UTC bucket
 * (Phase 2 DoD: "Rate limit: 31 messages in 5 min from one phone
 * triggers throttle").
 *
 * Spec: `bot/specs/04-data-model.md` §2 (`bot_rate` / `BotRate`).
 *
 * Implementation:
 *   - Doc id: `${phoneNoPrefix}_${bucket}`
 *   - Atomic counter via `FieldValue.increment`
 *   - 5-minute UTC buckets (`floor(epochMs / 300_000)`)
 *   - TTL field `ttlExpiresAt` auto-purges entries
 *
 * Returns `{ over: true, throttled }` exactly once per threshold
 * crossing: the bot replies with the throttle notice on that turn and
 * stays silent until the bucket rolls. Callers should treat any
 * subsequent `over: true` in the same bucket as "skip silently".
 */

import {getFirestore, Timestamp} from "firebase-admin/firestore";
import type {E164} from "../lib/phone.js";
import {
  DEFAULT_RATE_LIMIT_PER_5MIN,
  RATE_BUCKET_TTL_MS,
} from "../lib/config.js";
import {rateBucket} from "../lib/time.js";

const COLLECTION = "bot_rate";

export interface RateDecision {
  bucket: number;
  count: number;
  over: boolean;
  /** True only on the first inbound that crossed the threshold this bucket. */
  shouldNotify: boolean;
}

export async function recordInboundAndCheck(
  phone: E164,
  limit: number = DEFAULT_RATE_LIMIT_PER_5MIN
): Promise<RateDecision> {
  const bucket = rateBucket();
  const docId = `${phone.replace("+", "")}_${bucket}`;
  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(docId);

  // Single round-trip via transaction (Phase C2). The previous
  // `set(merge) → get` pair cost two RPCs; transactional read+write
  // returns the new count in one and guarantees monotonic counting under
  // concurrent inbounds.
  //
  // `maxAttempts: 20` raises the SDK default of 5. A single phone burst-
  // sending into the same 5-minute bucket can produce a handful of
  // racers, and the default budget gives up too early on contended docs.
  const count = await db.runTransaction(
    async (tx) => {
      const snap = await tx.get(ref);
      const current = ((snap.data()?.count as number | undefined) ?? 0) + 1;
      tx.set(
        ref,
        {
          phone,
          bucket,
          count: current,
          ttlExpiresAt: Timestamp.fromMillis(Date.now() + RATE_BUCKET_TTL_MS),
        },
        {merge: true}
      );
      return current;
    },
    {maxAttempts: 20}
  );

  const over = count > limit;
  // Notify exactly once per bucket — when count first crosses `limit + 1`.
  const shouldNotify = count === limit + 1;
  return {bucket, count, over, shouldNotify};
}
