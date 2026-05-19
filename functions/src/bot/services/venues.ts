/**
 * Read-only accessor for wedding venues.
 *
 * Spec: `bot/specs/07-knowledge-base.md` §3.3 (venue card format),
 *       `bot/specs/04-data-model.md` §1.
 *
 * See `services/events.ts` for the same note on missing-collection
 * fallback behavior.
 */

import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

export interface BotVenue {
  id: string;
  name: string;
  type?: "beach" | "restaurant" | "church" | "private" | string;
  address?: string;
  lat?: number;
  lng?: number;
  mapsLink?: string;
  webLink?: string;
  parking?: string;
  notes?: string;
}

const COLLECTION = "venues";

export async function listVenues(): Promise<BotVenue[]> {
  try {
    const snap = await getFirestore().collection(COLLECTION).get();
    if (snap.empty) return [];
    return snap.docs.map((d) => ({id: d.id, ...(d.data() as Omit<BotVenue, "id">)}));
  } catch (err) {
    logger.warn("bot.services.venues.read_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export async function getVenue(id: string): Promise<BotVenue | null> {
  const snap = await getFirestore().collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return {id: snap.id, ...(snap.data() as Omit<BotVenue, "id">)};
}
