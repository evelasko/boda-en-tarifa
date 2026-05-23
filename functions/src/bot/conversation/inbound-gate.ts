/**
 * Shared inbound-gate helper: allowlist + per-phone rate limit.
 *
 * Both the text handler (`handlers/conversation.ts`) and the voice handler
 * (`handlers/voice.ts`) need to run the same two checks before doing any
 * expensive work. Extracted here so the voice path doesn't duplicate the
 * allowlist+ratelimit prefix from `handleInboundText`.
 *
 * The helper is intentionally side-effect-free except for the rate-limit
 * counter increment (which is the side effect callers want — "record this
 * inbound and tell me where we are"). The caller decides what to send
 * back to the guest based on the returned decision.
 */

import {decideInbound} from "../allowlist.js";
import type {E164} from "../lib/phone.js";
import type {Guest} from "../services/guests.js";
import {recordInboundAndCheck, type RateDecision} from "./ratelimit.js";

export type InboundGateDecision =
  | {kind: "proceed"; guest: Guest}
  | {kind: "refused_unknown"}
  | {kind: "rate_limited"; guest: Guest; rate: RateDecision};

/**
 * Evaluate allowlist + rate limit for an inbound. The rate-limit counter
 * is incremented when (and only when) the guest is allowlisted, matching
 * the order used by `handleInboundText` so behavior is identical across
 * handlers.
 */
export async function evaluateInboundGate(
  phone: E164
): Promise<InboundGateDecision> {
  const decision = await decideInbound(phone);
  if (decision.kind === "unknown") return {kind: "refused_unknown"};

  const rate = await recordInboundAndCheck(phone);
  if (rate.over) return {kind: "rate_limited", guest: decision.guest, rate};
  return {kind: "proceed", guest: decision.guest};
}
