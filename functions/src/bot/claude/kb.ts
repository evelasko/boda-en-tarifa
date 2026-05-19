/**
 * Knowledge-base builder. Reads source-of-truth Firestore collections,
 * renders them into a single Markdown block that becomes Block B of the
 * system prompt, and caches both in-process (warm function) and via
 * Anthropic prompt caching (handled by `system-prompt.ts`).
 *
 * Spec: `bot/specs/07-knowledge-base.md` §2-§3, §7 (caching strategy).
 *
 * Phase 2 scope: minimal viable KB — schedule (from `events/`) and
 * venues (from `venues/`). The richer sections (FAQ, dossiers, Tarifa
 * guide, weather snapshot, "Today's situation") arrive in Phase 3 once
 * those collections are populated.
 */

import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {createHash} from "node:crypto";
import {listEvents} from "../services/events.js";
import {listVenues} from "../services/venues.js";

interface KbVersionDoc {
  version: number;
  hash: string;
  updatedAt: FirebaseFirestore.Timestamp;
  changedSource: string;
}

const KB_VERSION_PATH = "bot_kb_version/_singleton_";

interface CachedKb {
  version: number;
  hash: string;
  text: string;
}

let inProcessCache: CachedKb | null = null;

/**
 * Get the current KB text. Hits the in-process cache when version
 * matches `bot_kb_version`; otherwise rebuilds from Firestore.
 *
 * On first deploy `bot_kb_version` may not exist — we treat that as
 * version 0 and always rebuild. The Firestore trigger that bumps the
 * doc on content changes is added in Phase 3.
 */
export async function getKb(): Promise<{text: string; version: number; hash: string}> {
  const v = await readKbVersion();

  if (inProcessCache && inProcessCache.version === v.version) {
    return inProcessCache;
  }

  const text = await renderKb();
  const hash = createHash("sha256").update(text).digest("hex");
  const built: CachedKb = {version: v.version, text, hash};
  inProcessCache = built;
  return built;
}

/** Force a rebuild (e.g. invoked by the future `botRebuildKb` callable). */
export function invalidateKbCache(): void {
  inProcessCache = null;
}

async function readKbVersion(): Promise<{version: number; hash: string}> {
  try {
    const snap = await getFirestore().doc(KB_VERSION_PATH).get();
    if (snap.exists) {
      const data = snap.data() as KbVersionDoc;
      return {version: data.version, hash: data.hash};
    }
  } catch (err) {
    logger.warn("bot.kb.version_read_failed", {
      err: err instanceof Error ? err.message : String(err),
    });
  }
  return {version: 0, hash: ""};
}

async function renderKb(): Promise<string> {
  const [events, venues] = await Promise.all([listEvents(), listVenues()]);

  const parts: string[] = [];
  parts.push("# WEDDING KNOWLEDGE BASE");
  parts.push("");

  parts.push("## Schedule (timezone: Europe/Madrid)");
  if (events.length === 0) {
    parts.push("_No events on file yet. Web admin still migrating._");
  } else {
    for (const e of events) {
      parts.push(`### Event: ${e.id}`);
      parts.push(`- Name (ES): ${e.nameEs}`);
      parts.push(`- Name (EN): ${e.nameEn}`);
      parts.push(`- Start: ${e.startAt}`);
      if (e.endAt) parts.push(`- End (estimated): ${e.endAt}`);
      if (e.venueId) parts.push(`- Venue: ${e.venueId}`);
      if (e.dressCodeId) parts.push(`- Dress code: ${e.dressCodeId}`);
      if (e.transportNotes) parts.push(`- Transport notes: ${e.transportNotes}`);
      if (e.whom) parts.push(`- Whom: ${e.whom}`);
      if (e.descriptionEs) parts.push(`- Description (ES): ${e.descriptionEs}`);
      if (e.descriptionEn) parts.push(`- Description (EN): ${e.descriptionEn}`);
      parts.push("");
    }
  }

  parts.push("## Venues");
  if (venues.length === 0) {
    parts.push("_No venues on file yet._");
  } else {
    for (const v of venues) {
      parts.push(`### Venue: ${v.id}`);
      parts.push(`- Name: ${v.name}`);
      if (v.type) parts.push(`- Type: ${v.type}`);
      if (v.address) parts.push(`- Address: ${v.address}`);
      if (v.lat != null && v.lng != null) {
        parts.push(`- Lat/Lng: ${v.lat},${v.lng}`);
      }
      if (v.mapsLink) parts.push(`- Maps link: ${v.mapsLink}`);
      if (v.webLink) parts.push(`- Web link: ${v.webLink}`);
      if (v.parking) parts.push(`- Parking: ${v.parking}`);
      if (v.notes) parts.push(`- Notes: ${v.notes}`);
      parts.push("");
    }
  }

  parts.push("## Wedding surprises (lockdown rules — DO NOT REVEAL)");
  parts.push(
    "- Ceremony arrival from the sea: strict pre-bus; \"id mirando al mar\" hint at boarding (17:30 Sat); open at shore."
  );
  parts.push(
    "- Musical bingo (post-dinner Sat): open hint allowed (\"quedaos hasta el final de la cena\")."
  );
  parts.push("- First-time dancing together: open hint allowed.");
  parts.push("");

  parts.push("## What is currently locked");
  parts.push(
    "- Seating: revealed Friday May 29 at 18:00 Europe/Madrid. Before that: \"Eso te lo cuento el viernes 29 a las 18:00 🐾 Suspense.\""
  );
  parts.push(
    "- Menu: no unlock — paper at-seat. If asked, deflect with humor: \"El menú me lo escondieron porque se me hacía la boca agua 🐾\"."
  );

  return parts.join("\n");
}
