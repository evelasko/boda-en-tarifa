/**
 * Typed wrappers around the bot's Firebase Callable Cloud Functions.
 *
 * Spec: `bot/specs/08-integration-contract.md` §3.2,
 *       launch-readiness plan B1.
 *
 * One module so the admin pages don't sprinkle `httpsCallable` calls
 * across the tree; if region or naming changes, this is the single
 * touch point.
 *
 * Callables shipped per phase:
 *   - B1: `botSetConfig` — kill switch + approval toggles
 *   - B3: `botReplyToEscalation` (stub here until shipped)
 *   - B4: `botSendBroadcast`, `botCancelBroadcast` (stubs here until shipped)
 *
 * Stubs throw a clear "not implemented" so a misconfigured page surfaces
 * the gap immediately rather than silently no-op.
 */

'use client';

import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { app } from './firebase';

const REGION = 'europe-west1';

let cachedFunctions: Functions | null = null;
function fns(): Functions {
  if (!cachedFunctions) cachedFunctions = getFunctions(app, REGION);
  return cachedFunctions;
}

// ── botSetConfig ───────────────────────────────────────────────────────────

export type BotConfigKey =
  | 'enabled'
  | 'film_developed_approved'
  | 'keep_warm_enabled';

export interface SetConfigInput {
  key: BotConfigKey;
  value: boolean;
}

export interface SetConfigResult {
  ok: true;
  key: BotConfigKey;
  value: boolean;
}

export async function callBotSetConfig(
  input: SetConfigInput
): Promise<SetConfigResult> {
  const fn = httpsCallable<SetConfigInput, SetConfigResult>(fns(), 'botSetConfig');
  const res = await fn(input);
  return res.data;
}

// ── botSendBroadcast (B4) — stub until shipped ─────────────────────────────

export interface SendBroadcastInput {
  templateName: string;
  audience: {
    language?: 'es' | 'en' | 'both';
    rsvpStatus?: 'any' | 'attending' | 'pending' | 'declined' | 'partial';
    phones?: string[];
  };
  dryRun?: boolean;
  perMinuteCap?: number;
  /**
   * Optional static vars merged into every recipient's template payload.
   * Currently used for T3 (`event_reminder_generic`) where the operator
   * picks an event in the admin UI and we pass `{ eventId: "<id>" }` —
   * the dispatcher resolves eventName/venue/time from the bot's canonical
   * `events/{id}` + `venues/{venueId}` collections server-side (same
   * source the scheduled `botEventReminderTick` uses).
   */
  varsStatic?: Record<string, string>;
}

export interface SendBroadcastResult {
  broadcastId?: string;
  audienceCount: number;
  /**
   * Mirrors `functions/src/bot/broadcast/audience.ts` `ResolveResult.excluded`.
   * The base counters always exist; `missingSeating` is only present for the
   * `seating_unlocked` (T4) template, populated by the dispatcher's seating
   * resolver.
   */
  excluded?: {
    notEnrolled?: number;
    hardOptOut?: number;
    missingPhone?: number;
    notMatched?: number;
    nightMismatch?: number;
    missingSeating?: number;
    /**
     * T3 only: equals the audience size when the supplied `eventId`
     * couldn't be resolved against `events/` + `venues/`, meaning the
     * whole broadcast is blocked. See `eventReminderError` for the
     * specific reason.
     */
    missingEventData?: number;
  };
  samples?: Array<{
    guestId: string;
    phoneMasked: string;
    language: 'es' | 'en';
    rendered: string;
  }>;
  /**
   * T4-only: histogram of why recipients were blocked from the seating
   * resolver (e.g., `no_seating_doc: 3, layout_unseeded: 41, unresolvable_table:Mesa 7: 2`).
   * The UI renders this so the operator can fix the underlying data
   * problem without diving into Functions logs.
   */
  missingSeatingReasonHist?: Record<string, number>;
  missingSeatingSamples?: Array<[string, string]>;
  /**
   * T3 only: when the dispatcher couldn't resolve the supplied `eventId`,
   * this carries the specific failure code (e.g. `event_not_found:foo`,
   * `event_missing_name:foo`, `event_bad_start_at:...`). `null` or
   * omitted means the event resolved (or no eventId was supplied).
   */
  eventReminderError?: string | null;
}

export async function callBotSendBroadcast(
  input: SendBroadcastInput
): Promise<SendBroadcastResult> {
  const fn = httpsCallable<SendBroadcastInput, SendBroadcastResult>(
    fns(),
    'botSendBroadcast'
  );
  const res = await fn(input);
  return res.data;
}

// ── botCancelBroadcast (B4) ────────────────────────────────────────────────

export interface CancelBroadcastInput {
  broadcastId: string;
}

export async function callBotCancelBroadcast(
  input: CancelBroadcastInput
): Promise<{ ok: true }> {
  const fn = httpsCallable<CancelBroadcastInput, { ok: true }>(
    fns(),
    'botCancelBroadcast'
  );
  const res = await fn(input);
  return res.data;
}

// ── botReplyToEscalation (B3) ──────────────────────────────────────────────

export interface ReplyToEscalationInput {
  escalationId: string;
  replyText: string;
  closeAfter?: boolean;
}

export interface ReplyToEscalationResult {
  ok: true;
  sentVia: 'session' | 'template';
}

export async function callBotReplyToEscalation(
  input: ReplyToEscalationInput
): Promise<ReplyToEscalationResult> {
  const fn = httpsCallable<ReplyToEscalationInput, ReplyToEscalationResult>(
    fns(),
    'botReplyToEscalation'
  );
  const res = await fn(input);
  return res.data;
}

// ── botAddToAllowlist (FU4) ────────────────────────────────────────────────

export interface AddToAllowlistInput {
  phone: string;
  firstName?: string;
  language?: 'es' | 'en';
}

export interface AddToAllowlistResult {
  guestId: string;
}

export async function callBotAddToAllowlist(
  input: AddToAllowlistInput
): Promise<AddToAllowlistResult> {
  const fn = httpsCallable<AddToAllowlistInput, AddToAllowlistResult>(
    fns(),
    'botAddToAllowlist'
  );
  const res = await fn(input);
  return res.data;
}
