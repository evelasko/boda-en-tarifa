/**
 * Firestore triggers that bump `bot_kb_version/_singleton_` whenever a
 * watched content collection changes. The bot's in-process KB cache
 * checks the version on each turn and rebuilds when it advances —
 * editing an event / venue / FAQ / dossier in Firestore therefore takes
 * effect on the next inbound, with no redeploy.
 *
 * Spec: `bot/specs/07-knowledge-base.md` §2 (sources of truth),
 *       `bot/specs/08-integration-contract.md` §3.4,
 *       `bot/specs/04-data-model.md` §2 (BotKbVersion schema).
 *
 * Trigger granularity:
 *   - Collection-level: `events`, `venues`, `faq`, `accommodations`,
 *     `guest_dossier`, `time_gated_content`.
 *   - Per-doc for `config/*`: ONLY the KB-contributing config docs are
 *     watched (`couple`, `tarifa_guide`, `dress_codes`, `wind_tips`,
 *     `travel`, `bot_kb_extras`). The operational `config/bot` is
 *     deliberately NOT in this set — operational toggle writes must not
 *     bump the KB cache.
 *
 * Hash strategy: we hash the change descriptor (`<path>:<timestamp>`)
 * rather than the rebuilt KB. The bot's cache check is version-based;
 * the hash is informational for the admin UI.
 */

import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {createHash} from "node:crypto";
import {BOT_REGION} from "../lib/config.js";

const KB_VERSION_PATH = "bot_kb_version/_singleton_";

async function bumpKbVersion(changedSource: string): Promise<void> {
  const db = getFirestore();
  const ref = db.doc(KB_VERSION_PATH);
  const hash = createHash("sha256")
    .update(`${changedSource}:${Date.now()}`)
    .digest("hex");

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ?
      (snap.data() as {version?: number} | undefined) :
      undefined;
    const nextVersion = (current?.version ?? 0) + 1;
    tx.set(ref, {
      version: nextVersion,
      hash,
      updatedAt: FieldValue.serverTimestamp(),
      changedSource,
    });
  });

  logger.info("bot.kb.version_bumped", {changedSource});
}

const triggerOptions = {region: BOT_REGION} as const;

// ── Collection-level triggers ─────────────────────────────────────────

export const botKbBumpOnEvents = onDocumentWritten(
  {...triggerOptions, document: "events/{eventId}"},
  async (event) => {
    await bumpKbVersion(`events/${event.params.eventId}`);
  }
);

export const botKbBumpOnVenues = onDocumentWritten(
  {...triggerOptions, document: "venues/{venueId}"},
  async (event) => {
    await bumpKbVersion(`venues/${event.params.venueId}`);
  }
);

export const botKbBumpOnFaq = onDocumentWritten(
  {...triggerOptions, document: "faq/{faqId}"},
  async (event) => {
    await bumpKbVersion(`faq/${event.params.faqId}`);
  }
);

export const botKbBumpOnAccommodations = onDocumentWritten(
  {...triggerOptions, document: "accommodations/{id}"},
  async (event) => {
    await bumpKbVersion(`accommodations/${event.params.id}`);
  }
);

export const botKbBumpOnGuestDossier = onDocumentWritten(
  {...triggerOptions, document: "guest_dossier/{slug}"},
  async (event) => {
    await bumpKbVersion(`guest_dossier/${event.params.slug}`);
  }
);

export const botKbBumpOnTimeGated = onDocumentWritten(
  {...triggerOptions, document: "time_gated_content/{contentId}"},
  async (event) => {
    await bumpKbVersion(`time_gated_content/${event.params.contentId}`);
  }
);

// ── Per-doc config triggers ────────────────────────────────────────────
//
// IMPORTANT: NO wildcard on config/. The operational `config/bot` doc is
// written frequently (kill switch, rate-limit toggles, etc.) and must
// NOT bump the KB. KB-contributing slices have been moved to
// `config/bot_kb_extras` (see bot/specs/04-data-model.md §2).

export const botKbBumpOnConfigCouple = onDocumentWritten(
  {...triggerOptions, document: "config/couple"},
  async () => {
    await bumpKbVersion("config/couple");
  }
);

export const botKbBumpOnConfigTarifaGuide = onDocumentWritten(
  {...triggerOptions, document: "config/tarifa_guide"},
  async () => {
    await bumpKbVersion("config/tarifa_guide");
  }
);

export const botKbBumpOnConfigDressCodes = onDocumentWritten(
  {...triggerOptions, document: "config/dress_codes"},
  async () => {
    await bumpKbVersion("config/dress_codes");
  }
);

export const botKbBumpOnConfigWindTips = onDocumentWritten(
  {...triggerOptions, document: "config/wind_tips"},
  async () => {
    await bumpKbVersion("config/wind_tips");
  }
);

export const botKbBumpOnConfigTravel = onDocumentWritten(
  {...triggerOptions, document: "config/travel"},
  async () => {
    await bumpKbVersion("config/travel");
  }
);

export const botKbBumpOnConfigBotKbExtras = onDocumentWritten(
  {...triggerOptions, document: "config/bot_kb_extras"},
  async () => {
    await bumpKbVersion("config/bot_kb_extras");
  }
);
