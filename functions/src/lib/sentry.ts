/**
 * Sentry wiring for the bot's Cloud Functions (Phase C5).
 *
 * `ensureSentry` is idempotent — call it at the top of every entry point
 * (`handlePost`, scheduled-function handlers). The first call initializes
 * the SDK; subsequent calls within the same Node process are no-ops.
 *
 * `captureWithContext` is the only blessed escape hatch from `catch`
 * blocks. It tags the exception with the `requestId` (and optional
 * `kind`) so events group cleanly in the dashboard. The recipient
 * fingerprint is `phone.slice(-4)` — never the raw E.164 number.
 *
 * Privacy contract (matches `bot/specs/09-security-privacy.md` §6.1):
 *   - `sendDefaultPii: false`
 *   - never set `user.email` or `user.username`
 *   - never attach raw `text`, raw `phone`, or system prompt content
 *   - `phone.slice(-4)` is the only stable identifier permitted
 */

import * as Sentry from "@sentry/node";

let initialized = false;

export function ensureSentry(dsn: string | undefined, release?: string): void {
  if (initialized) return;
  if (!dsn) {
    // No DSN bound — log once and stay quiet. Avoids spamming the log on
    // every request in environments where Sentry isn't configured (local
    // emulator, integration tests).
    initialized = true;
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.GCP_PROJECT?.includes("staging") ?
      "staging" :
      "prod",
    release: release ?? process.env.K_REVISION,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  initialized = true;
}

export interface CaptureContext {
  requestId: string;
  /** Full E.164 phone — only the last 4 digits are sent to Sentry. */
  phone?: string;
  /** Free-form classifier (event kind, scheduled-function name, etc.). */
  kind?: string;
}

export function captureWithContext(
  err: unknown,
  context: CaptureContext
): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    scope.setTag("requestId", context.requestId);
    if (context.kind) scope.setTag("kind", context.kind);
    if (context.phone) {
      scope.setUser({id: context.phone.slice(-4)});
    }
    Sentry.captureException(err);
  });
}
