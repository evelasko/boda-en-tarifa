/**
 * Read-only accessor for wedding events.
 *
 * Spec: `bot/specs/07-knowledge-base.md` §3.2 (event card format),
 *       `bot/specs/04-data-model.md` §1 ("`events/{eventId}` Existing.
 *       Bot reads only").
 *
 * Implementation status:
 *
 *   The bot spec assumes a Firestore `events/{eventId}` collection
 *   owned by the web admin. As of Phase 2 kickoff that collection does
 *   not yet exist — events live in `web/src/content/wedding-content.json`
 *   and in `functions/src/config/notifications.ts`. This module reads
 *   Firestore first and returns an empty list if absent; the KB build
 *   degrades gracefully. Once the web admin migrates events to
 *   Firestore (parallel workstream), no change here is needed.
 */

import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

export interface BotEvent {
  id: string;
  nameEs: string;
  nameEn: string;
  /** ISO with offset, e.g. `2026-05-30T18:00:00+02:00`. */
  startAt: string;
  /** Optional ISO; same shape as `startAt`. */
  endAt?: string;
  venueId?: string;
  dressCodeId?: string;
  transportNotes?: string;
  /** `all`, `ceremony+`, `family`, etc. — opaque scope label. */
  whom?: string;
  descriptionEs?: string;
  descriptionEn?: string;
  /**
   * Lead times (minutes before `startAt`) at which the event-reminder
   * scheduler should fire `event_reminder_generic`. Default `[60, 15]`
   * when absent. Set to `[]` to suppress generic reminders entirely (for
   * events covered by dedicated templates — e.g. ceremony uses
   * bus_pickup_early/last; pre_wedding uses pre_wedding_drinks).
   * Launch-readiness plan A2.
   */
  reminders?: number[];

  /**
   * If set, only guests whose `rsvp_responses.responses.nightsStaying`
   * array includes this night receive reminders for the event. Spares
   * day-trippers from getting Friday-night pings when they're not in
   * town yet, and Saturday-only attendees from Sunday brunch reminders.
   * Allowed values: "friday" | "saturday" | "sunday" (see
   * `web/src/types/rsvp.ts` `NightOption`).
   */
  requiresNight?: "friday" | "saturday" | "sunday";
}

const COLLECTION = "events";

export async function listEvents(): Promise<BotEvent[]> {
  try {
    const snap = await getFirestore().collection(COLLECTION).get();
    if (snap.empty) {
      logger.info("bot.services.events.empty");
      return [];
    }
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<BotEvent, "id">),
    }));
  } catch (err) {
    // Don't crash the KB build if the collection isn't provisioned yet;
    // the spec treats a missing collection as "nothing to render".
    logger.warn("bot.services.events.read_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export async function getEvent(id: string): Promise<BotEvent | null> {
  const snap = await getFirestore().collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return {id: snap.id, ...(snap.data() as Omit<BotEvent, "id">)};
}
