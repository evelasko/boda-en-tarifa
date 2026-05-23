/**
 * Broadcast dispatcher (launch-readiness plan A1).
 *
 * Three primary entry points:
 *   - `dryRunBroadcast(input)` — resolves audience, picks 3 sample
 *     recipients, builds the rendered preview body for each. Zero side
 *     effects. Used by the admin Compose → Preview flow (B4).
 *   - `createBroadcast(input)` — writes `bot_broadcasts/{id}` with status
 *     `dispatching` and populates the recipients subcollection with one
 *     `queued` entry per audience member. Returns the broadcast id.
 *   - `runBroadcast(broadcastId, deps)` — drains the queued/failed
 *     recipients, calling `sendTemplate` per recipient with the configured
 *     pacing cap. Idempotent: re-running with the same id skips recipients
 *     already marked `sent` (or further along).
 *
 * Per-recipient state lives at
 *   `bot_broadcasts/{id}/recipients/{guestId}`.
 *
 * Cross-cutting `bot_send_log/{compositeId}` rows mirror the recipient
 * state per `04-data-model.md` §2 — keyed `broadcast:{guestId}:{id}` —
 * so the delivery-receipt webhook (`webhook/status.ts`) can map Meta's
 * `metaMessageId` callbacks back to a broadcast recipient without a
 * collectionGroup index. `applyDeliveryStatus` updates both rows.
 */

import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {sendTemplate} from "../whatsapp/send.js";
import {
  getTemplate,
  type TemplateLang,
  type TemplateName,
} from "../whatsapp/templates.js";
import {maskPhone} from "../lib/phone.js";
import {
  claimSendLog,
  makeSendLogId,
  markFailed,
  markSent,
} from "../services/send-log.js";
import {
  resolveAudience,
  type AudienceMember,
  type AudienceSpec,
  type ResolveResult,
} from "./audience.js";

// ── Types ──────────────────────────────────────────────────────────────────

export type BroadcastStatus =
  | "draft"
  | "dispatching"
  | "partial"
  | "complete"
  | "cancelled";

export type RecipientStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "skipped";

/**
 * Per-template variables passed by the dispatcher caller. Merged in
 * precedence order (lowest to highest):
 *   1. recipient-derived defaults (`firstName`, `language`)
 *   2. `static` — same for every recipient
 *   3. `byLanguage[lang]` — same for every recipient of that language
 *   4. `perGuest[guestId]` — recipient-specific
 *
 * `byLanguage` is the natural slot for event-reminder copy (the event
 * name + time-of-day phrasing depend on language; the venue name does
 * not). `perGuest` is used for per-recipient tokens like the seating
 * URL signed token.
 */
export interface DispatchVars {
  static?: Record<string, string>;
  byLanguage?: Partial<Record<TemplateLang, Record<string, string>>>;
  perGuest?: Record<string, Record<string, string>>;
}

export interface BroadcastInput {
  templateName: TemplateName;
  audience: AudienceSpec;
  vars?: DispatchVars;
  /** Default 60. Lower for low-confidence sends; raise (within Meta limits)
   *  for full-audience reminders that need to land within a short window. */
  perMinuteCap?: number;
  operatorUid?: string;
  /** Optional explicit id — when re-running, pass the prior id to dedupe. */
  broadcastId?: string;
}

export interface DispatchDeps {
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
}

export interface DryRunResult {
  audienceCount: number;
  excluded: ResolveResult["excluded"];
  samples: Array<{
    guestId: string;
    phoneMasked: string;
    language: TemplateLang;
    rendered: string;
  }>;
}

export interface RunResult {
  broadcastId: string;
  sent: number;
  delivered: number;
  failed: number;
  skipped: number;
  total: number;
  status: BroadcastStatus;
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Resolve audience + render 3 previews. Zero side effects. */
export async function dryRunBroadcast(
  input: BroadcastInput
): Promise<DryRunResult> {
  const tmpl = requireTemplate(input.templateName);
  const audience = await resolveAudience(input.audience);

  const samples = audience.members.slice(0, 3).map((m) => {
    const lang = m.language as TemplateLang;
    const merged = mergeVars(m, input.vars);
    const parsed = tmpl.vars.safeParse(merged);
    const rendered = parsed.success ?
      tmpl.preview(lang, parsed.data) :
      `(invalid vars: ${parsed.error.errors[0]?.message ?? "unknown"})`;
    return {
      guestId: m.guestId,
      phoneMasked: maskPhone(m.phone),
      language: lang,
      rendered,
    };
  });

  return {
    audienceCount: audience.members.length,
    excluded: audience.excluded,
    samples,
  };
}

/**
 * Create the broadcast doc + per-recipient `queued` rows. Returns the
 * broadcast id. The caller (admin callable or test script) typically then
 * invokes `runBroadcast(id, deps)` to actually send. Splitting create
 * from run lets the admin UI subscribe to the broadcast doc to watch
 * progress in real time.
 */
export async function createBroadcast(
  input: BroadcastInput
): Promise<{broadcastId: string; audienceCount: number}> {
  const tmpl = requireTemplate(input.templateName);
  const audience = await resolveAudience(input.audience);

  const broadcastId = input.broadcastId ?? generateBroadcastId();
  const now = FieldValue.serverTimestamp();
  const broadcastRef = getFirestore()
    .collection("bot_broadcasts")
    .doc(broadcastId);

  await getFirestore().runTransaction(async (tx) => {
    tx.set(broadcastRef, {
      templateName: tmpl.name,
      audienceSpec: serializeAudienceSpec(input.audience),
      audienceCount: audience.members.length,
      perMinuteCap: input.perMinuteCap ?? DEFAULT_PER_MINUTE_CAP,
      operatorUid: input.operatorUid ?? null,
      status: "dispatching" as BroadcastStatus,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      skippedCount: 0,
      // Persist vars so `runBroadcast` (possibly re-invoked later) can
      // resume without the caller re-supplying them. `perGuest` is left
      // out — usually small but could be unbounded; callers that need
      // per-recipient vars pass them at `runBroadcast` time.
      varsStatic: input.vars?.static ?? null,
      varsByLanguage: input.vars?.byLanguage ?? null,
      createdAt: now,
      startedAt: now,
    });
    for (const member of audience.members) {
      const recipRef = broadcastRef.collection("recipients").doc(member.guestId);
      tx.set(recipRef, {
        guestId: member.guestId,
        phone: member.phone,
        language: member.language,
        firstName: member.firstName,
        status: "queued" as RecipientStatus,
        attempts: 0,
        createdAt: now,
      });
    }
  });

  logger.info("bot.broadcast.created", {
    broadcastId,
    audienceCount: audience.members.length,
    templateName: tmpl.name,
  });

  return {broadcastId, audienceCount: audience.members.length};
}

/**
 * Drain queued/failed recipients, sending one template per recipient with
 * pacing. Idempotent: skips recipients already `sent` / `delivered` /
 * `read`. Honors `status: "cancelled"` mid-run.
 *
 * Designed to be runnable from a Cloud Functions callable with the
 * default 60s timeout for small (<60) audiences, or from a longer-timeout
 * dispatcher wrapper for larger ones. The pacing loop sleeps in between
 * sends; if the function is killed, a re-invocation picks up where it
 * left off.
 */
export async function runBroadcast(
  broadcastId: string,
  deps: DispatchDeps,
  input?: Pick<BroadcastInput, "vars">
): Promise<RunResult> {
  const broadcastRef = getFirestore()
    .collection("bot_broadcasts")
    .doc(broadcastId);
  const broadcastSnap = await broadcastRef.get();
  if (!broadcastSnap.exists) {
    throw new Error(`broadcast_not_found: ${broadcastId}`);
  }
  const broadcast = broadcastSnap.data() as {
    templateName: TemplateName;
    perMinuteCap?: number;
    status?: BroadcastStatus;
    varsStatic?: Record<string, string> | null;
    varsByLanguage?: Partial<
      Record<TemplateLang, Record<string, string>>
    > | null;
  };
  const tmpl = requireTemplate(broadcast.templateName);
  const perMinuteCap =
    broadcast.perMinuteCap ?? DEFAULT_PER_MINUTE_CAP;
  const minIntervalMs = Math.max(
    Math.floor(60_000 / perMinuteCap),
    50
  );

  // Reassemble vars: stored broadcast doc fields + caller-supplied
  // perGuest overrides (most common for tests).
  const vars: DispatchVars = {
    static: broadcast.varsStatic ?? undefined,
    byLanguage: broadcast.varsByLanguage ?? undefined,
    perGuest: input?.vars?.perGuest,
  };

  // Fresh stats snapshot for this run.
  const stats = {sent: 0, delivered: 0, failed: 0, skipped: 0};
  let lastSendStartMs = 0;

  // Iterate recipients in deterministic guestId order so a retry follows
  // the same path as the original run.
  const recipientsSnap = await broadcastRef
    .collection("recipients")
    .orderBy("guestId")
    .get();
  const total = recipientsSnap.size;

  for (const recipDoc of recipientsSnap.docs) {
    // Mid-run cancellation check.
    const stateSnap = await broadcastRef.get();
    if (
      (stateSnap.data()?.status as BroadcastStatus | undefined) === "cancelled"
    ) {
      logger.info("bot.broadcast.cancelled_midrun", {broadcastId});
      break;
    }

    const recip = recipDoc.data() as {
      guestId: string;
      phone: string;
      language: TemplateLang;
      firstName: string;
      status: RecipientStatus;
    };

    const terminal =
      recip.status === "sent" ||
      recip.status === "delivered" ||
      recip.status === "read";
    if (terminal) {
      stats.skipped += 1;
      continue;
    }

    // Pacing — only sleep if we are about to actually send.
    const sinceLast = Date.now() - lastSendStartMs;
    if (lastSendStartMs > 0 && sinceLast < minIntervalMs) {
      await sleep(minIntervalMs - sinceLast);
    }
    lastSendStartMs = Date.now();

    const sendLogId = makeSendLogId({
      trigger: "broadcast",
      guestId: recip.guestId,
      suffix: broadcastId,
    });

    const claim = await claimSendLog({
      id: sendLogId,
      trigger: "broadcast",
      guestId: recip.guestId,
      templateName: tmpl.name,
    });
    if (claim === "already_sent") {
      // Mirror to recipient row in case the prior run crashed after the
      // send-log write but before the recipient write.
      await recipDoc.ref.set(
        {status: "sent" as RecipientStatus},
        {merge: true}
      );
      stats.skipped += 1;
      continue;
    }

    // Mark sending so the admin UI shows progress in real time.
    await recipDoc.ref.set(
      {
        status: "sending" as RecipientStatus,
        attempts: FieldValue.increment(1),
      },
      {merge: true}
    );

    const mergedVars = mergeVars(
      {
        guestId: recip.guestId,
        phone: recip.phone as `+${string}`,
        language: recip.language,
        firstName: recip.firstName,
        fullName: "",
      },
      vars
    );
    const parsed = tmpl.vars.safeParse(mergedVars);
    if (!parsed.success) {
      const reason = parsed.error.errors[0]?.message ?? "invalid_vars";
      await markRecipientFailed(recipDoc.ref, reason);
      await markFailed({id: sendLogId, error: reason});
      stats.failed += 1;
      continue;
    }

    const payload = tmpl.buildPayload(recip.language, parsed.data);
    try {
      const sendResult = await sendTemplate({
        to: recip.phone as `+${string}`,
        template: payload,
        requestId: `bcst:${broadcastId}:${recip.guestId}`,
        phoneNumberId: deps.whatsappPhoneNumberId,
        accessToken: deps.whatsappAccessToken,
      });
      await recipDoc.ref.set(
        {
          status: "sent" as RecipientStatus,
          metaMessageId: sendResult.metaMessageId,
          sentAt: FieldValue.serverTimestamp(),
        },
        {merge: true}
      );
      await markSent({
        id: sendLogId,
        metaMessageId: sendResult.metaMessageId,
      });
      stats.sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await markRecipientFailed(recipDoc.ref, message);
      await markFailed({id: sendLogId, error: message});
      stats.failed += 1;
    }
  }

  // Roll-up: bump counts on the broadcast doc + set terminal status.
  // No `failed` global state — if every send failed, status is `partial`
  // with zero sent so the operator sees the failure clearly. Reserve the
  // terminal `complete` status for "every recipient marked sent".
  const finishedStatus: BroadcastStatus =
    stats.failed > 0 ? "partial" : "complete";
  await broadcastRef.update({
    status: finishedStatus,
    sentCount: FieldValue.increment(stats.sent),
    failedCount: FieldValue.increment(stats.failed),
    skippedCount: FieldValue.increment(stats.skipped),
    finishedAt: FieldValue.serverTimestamp(),
  });

  logger.info("bot.broadcast.run_complete", {
    broadcastId,
    total,
    ...stats,
    status: finishedStatus,
  });

  return {
    broadcastId,
    total,
    ...stats,
    status: finishedStatus,
  };
}

/** Mark a broadcast cancelled. `runBroadcast` checks per-recipient. */
export async function cancelBroadcast(broadcastId: string): Promise<void> {
  await getFirestore()
    .collection("bot_broadcasts")
    .doc(broadcastId)
    .update({
      status: "cancelled" as BroadcastStatus,
      cancelledAt: FieldValue.serverTimestamp(),
    });
  logger.info("bot.broadcast.cancelled", {broadcastId});
}

// ── helpers ────────────────────────────────────────────────────────────────

const DEFAULT_PER_MINUTE_CAP = 60;

function requireTemplate(name: string) {
  const tmpl = getTemplate(name);
  if (!tmpl) throw new Error(`unknown_template: ${name}`);
  return tmpl;
}

function mergeVars(
  member: AudienceMember,
  vars: DispatchVars | undefined
): Record<string, string> {
  const out: Record<string, string> = {
    firstName: member.firstName,
    language: member.language,
  };
  for (const [k, v] of Object.entries(vars?.static ?? {})) out[k] = v;
  const langOverlay = vars?.byLanguage?.[member.language as TemplateLang];
  if (langOverlay) {
    for (const [k, v] of Object.entries(langOverlay)) out[k] = v;
  }
  for (const [k, v] of Object.entries(
    vars?.perGuest?.[member.guestId] ?? {}
  )) {
    out[k] = v;
  }
  return out;
}

function serializeAudienceSpec(spec: AudienceSpec): Record<string, unknown> {
  return {
    language: spec.language ?? "both",
    rsvpStatus: spec.rsvpStatus ?? "any",
    phoneCount: spec.phones?.length ?? 0,
    guestIdCount: spec.guestIds?.length ?? 0,
  };
}

async function markRecipientFailed(
  recipRef: FirebaseFirestore.DocumentReference,
  reason: string
): Promise<void> {
  await recipRef.set(
    {
      status: "failed" as RecipientStatus,
      error: reason,
      failedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

function generateBroadcastId(): string {
  // Human-friendly id: `bcst-YYYYMMDD-HHmmss-xxxx`. Sortable + grep-able.
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `bcst-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${suffix}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
