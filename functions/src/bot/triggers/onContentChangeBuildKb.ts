/**
 * Firestore triggers that bump `bot_kb_version/_singleton_` whenever a
 * watched content collection changes. The bot's in-process KB cache
 * checks the version on each turn and rebuilds when it advances —
 * editing an event / venue / FAQ in Firestore therefore takes effect on
 * the next inbound, with no redeploy.
 *
 * Spec: `bot/specs/07-knowledge-base.md` §2 (sources of truth),
 *       `bot/specs/08-integration-contract.md` §3.4,
 *       `bot/specs/04-data-model.md` §2 (BotKbVersion schema).
 *
 * One trigger per watched collection — Firebase v2 deploys each as a
 * separate Cloud Function. Names follow `botKbBumpOn<Collection>` so
 * `firebase deploy --only functions:bot...` selectors are obvious.
 *
 * Hash strategy: we hash the change descriptor (`<path>:<timestamp>`)
 * rather than the rebuilt KB. The bot's cache check is version-based;
 * the hash is purely informational for the admin UI. Rebuilding the KB
 * on every content edit just to compute a content hash would be wasted
 * work — switch to that if a future use of `hash` demands it.
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

export const botKbBumpOnTimeGated = onDocumentWritten(
  {...triggerOptions, document: "time_gated_content/{contentId}"},
  async (event) => {
    await bumpKbVersion(`time_gated_content/${event.params.contentId}`);
  }
);

// `bot_kb_version` is itself not in the watched set, so a write here
// never re-triggers this fan-out. `config/bot` writes will trigger and
// the bot will rebuild on next turn — a no-op if nothing semantic
// changed, but cheap and idempotent.
export const botKbBumpOnConfig = onDocumentWritten(
  {...triggerOptions, document: "config/{configId}"},
  async (event) => {
    await bumpKbVersion(`config/${event.params.configId}`);
  }
);
