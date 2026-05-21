/**
 * Writer for `feed_posts/{auto}` — the moderation queue surface for
 * guest-submitted photos.
 *
 * Spec: `bot/specs/04-data-model.md` §1 (FeedPost schema),
 *       `bot/specs/02-conversation-design.md` §4 (Photo / album row).
 */

import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";
import {dayOfWedding} from "../lib/time.js";

const COLLECTION = "feed_posts";

export type FeedPostConsent = "granted" | "declined" | "pending";

export interface CreateFeedPostArgs {
  guestId: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
  /** Mapped from guest.photoConsent — see `consentFromGuestField`. */
  consent: FeedPostConsent;
  /** Optional caption from the inbound (image.caption). */
  caption?: string;
}

export async function createFeedPost(
  args: CreateFeedPostArgs
): Promise<string> {
  const ref = getFirestore().collection(COLLECTION).doc();
  await ref.set({
    guestId: args.guestId,
    source: "whatsapp",
    cloudinaryPublicId: args.cloudinaryPublicId,
    cloudinaryUrl: args.cloudinaryUrl,
    mimeType: args.mimeType,
    width: args.width ?? null,
    height: args.height ?? null,
    status: "pending_moderation",
    consent: args.consent,
    weddingDay: dayOfWedding(new Date()),
    caption: args.caption ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/**
 * Map the boolean `photoConsent` field on the guest doc to the
 * tri-state `consent` enum the moderation surface expects:
 *
 *   true  → "granted"
 *   false → "declined"
 *   undef → "pending"
 */
export function consentFromGuestField(
  v: boolean | undefined
): FeedPostConsent {
  if (v === true) return "granted";
  if (v === false) return "declined";
  return "pending";
}
