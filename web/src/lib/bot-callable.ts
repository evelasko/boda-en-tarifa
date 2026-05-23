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
}

export interface SendBroadcastResult {
  broadcastId?: string;
  audienceCount: number;
  excluded?: Record<string, number>;
  samples?: Array<{
    guestId: string;
    phoneMasked: string;
    language: 'es' | 'en';
    rendered: string;
  }>;
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
