# Implementer agent prompt — Phase C (post-deploy hardening + observability)

> Hand-off prompt for an LLM implementer to ship **Phase C** of Thora's launch.
> Today is **2026-05-23**; deploy freeze is **2026-05-28**; wedding is **2026-05-29 → 31**.
> Phases A and B already shipped (see "What is already done" below). Phase C is six tightly-scoped tasks. None of them require touching the broadcast/UI surface — this is purely server-side optimization + a single doc.

---

## Your mission

Ship every task marked **Owner: Implementer** in `bot/docs/launch-readiness-plan.md` §6 — **Phase C**:

| # | Task | Files (primary) | Effort |
|---|---|---|---|
| C1 | Parallelize tool execution within a turn | `functions/src/bot/claude/pipeline.ts` | XS |
| C2 | Single-round-trip rate limit | `functions/src/bot/conversation/ratelimit.ts` | S |
| C3 | Background outbound audit write | `functions/src/bot/handlers/conversation.ts` | XS |
| C4 | Typing indicator on inbound | `functions/src/bot/handlers/conversation.ts` (helper already exists in `whatsapp/send.ts`) | S |
| C5 | Sentry init + handler-level capture | new `functions/src/lib/sentry.ts`; touch `webhook/handler.ts`, `handlers/*.ts`, `lib/config.ts` | M |
| C6 | Backup-SIM runbook draft | new `bot/docs/backup-sim-runbook.md` | S |

End state: all six tasks merged, `npm run build` + `npm run lint` + `npm test` clean in `functions/`, no regressions to Phase A or B.

The operator (Enrique) reviews your PRs and runs the production deploys.

---

## What is already done (do NOT redo)

**Phase A — wedding-critical scheduled functions and paired infrastructure**:

- A1: broadcast dispatch core — `functions/src/bot/whatsapp/templates.ts`, `broadcast/audience.ts`, `broadcast/dispatch.ts`, `services/send-log.ts`, `webhook/status.ts`, status fanout in `webhook/handler.ts`, Firestore rules + indexes
- A2: `botEventReminderTick` scheduled function — `functions/src/bot/scheduled/event-reminder.ts`
- A3: `botContentUnlockTick` — `functions/src/bot/scheduled/content-unlock.ts` (reads `bot_content_unlocks/{id}` entries)
- A4: `botFilmDeveloped` — `functions/src/bot/scheduled/film-developed.ts` (gated by `config/bot.film_developed_approved`)
- A5: `botKeepKbWarm` — `functions/src/bot/scheduled/keep-kb-warm.ts` (per-minute, gated to active window + `config/bot.keep_warm_enabled`)
- A6: Cloud Functions compute config bump — `whatsappWebhook` is now `4GiB / cpu 2 / concurrency 40 / minInstances 5 / maxInstances 50`
- A7: 1-hour Anthropic cache TTL — `claude/system-prompt.ts` sets `ttl: "1h"` on the three blocks (SDK 0.65 supports it). **No `anthropic-priority-tier` header — Op-1 was denied.**
- Legacy notifiers `functions/src/notifications/send-event-reminder.ts` and `send-content-unlock.ts` were deleted; root `index.ts` export was removed.
- Shared scheduled-marker helper at `functions/src/bot/scheduled/idempotency.ts`.

**Phase B — admin UI minimum viable**:

- B1: `/admin/bot` layout + landing page + `web/src/lib/bot-callable.ts` typed wrappers
- B2: `/admin/bot/conversations` list + `[phone]` thread view (live `onSnapshot`)
- B3: `/admin/bot/escalations` queue + `[id]` detail with operator reply box → `botReplyToEscalation` callable
- B4: `/admin/bot/broadcasts` list, `new` 3-step wizard, `[id]` live progress + cancel → `botSendBroadcast` + `botCancelBroadcast` callables
- B5: `/admin/bot/settings` — three toggles → `botSetConfig` callable; kill-switch guard wired into `webhook/handler.ts` with a 10s in-process cache
- Firestore rule `isOperator()` extended to accept `request.auth.token.email in config/admins.emails` so the admin UI can do live reads from the browser without a server round-trip.

**Operator-track status (per Enrique, 2026-05-23)**:

- **Op-1 (Anthropic Priority Tier)**: DENIED. Do not add the `anthropic-priority-tier` header.
- **Op-2 (Anthropic tier-2)**: pending but non-blocking at 96 guests.
- **Op-3 (Backup SIM)**: physical SIM in transit. C6 is a **runbook doc only** (no script).
- **Op-4 (Sentry DSN)**: **DONE** — `SENTRY_DSN` is already set as a Firebase Functions secret. C5 is unblocked, no operator pre-step.
- **Op-5 (OpenAI API key)**: DONE. Reserved for E1 (not Phase C).

---

## Read these first, in this order

1. **`bot/docs/launch-readiness-plan.md` §6 Phase C** — authoritative scope, behavior contracts, acceptance criteria for C1–C6. Each task lists the exact files and what "done" means.
2. **`bot/docs/event-optimization-implementer-plan.md`** — has code-level guidance for C1 (Imp-1), C2 (Imp-5), C3 (Imp-7), C4 (Imp-2), C5 (Imp-11), C6 (Imp-13). Has worked diffs you can adapt. **Where the optimization plan disagrees with the launch-readiness plan, the launch-readiness plan wins.**
3. **`bot/specs/09-security-privacy.md` §6.1 (Log redaction)** — load-bearing for C5. Sentry must NEVER receive raw phone numbers, raw message text, or full system prompts. Use `phone.slice(-4)` as the only stable hash; `sendDefaultPii: false`.
4. **`functions/src/bot/lib/config.ts`** — pattern for secrets and `WEBHOOK_SECRETS`. You will extend `WEBHOOK_SECRETS` with `SENTRY_DSN` for C5.
5. **`functions/src/bot/webhook/handler.ts`** — already has the kill-switch + status routing wired in (Phase B / A1). You will add `ensureSentry(...)` at the top of `handlePost` and replace bare `logger.error` calls in `catch` blocks with `captureWithContext(err, {requestId, phone?, kind?})` followed by the logger call.
6. **`functions/src/bot/handlers/conversation.ts`** — touched in C3, C4. Read end-to-end before editing; C3 must preserve the "outbound is logged only after inbound is logged" invariant (the optimization plan's note in Imp-4 explains why).
7. **`functions/src/bot/whatsapp/send.ts`** — `markReadWithTyping` is already implemented (shipped in A1's batch as a C4 helper). C4 is just the call site in `conversation.ts`.
8. **`functions/src/bot/claude/pipeline.ts`** — touched in C1. Read the existing for-loop over `tool_use` blocks (around lines 138–168 historically; verify current line numbers); the refactor is to `Promise.all` while preserving block-order in `recordedCalls`, `sideEffects`, `toolResults`.
9. **`functions/src/bot/conversation/ratelimit.ts`** — touched in C2. Read the existing `recordInboundAndCheck`; the refactor wraps the set+get in a single `runTransaction`.

Skim, don't re-read everything — Phase A/B touched a lot. Focus on the files above.

---

## Sequencing

C1–C4 are **independent** — start them in parallel or back-to-back, your call. C5 (Sentry) is also independent but slightly more surface area; do it after C1–C4 land. C6 is a doc; do it whenever.

Recommended order (matches `event-optimization-implementer-plan.md` Day T-6/T-5 sequencing):

```
C1 → C2 → C3 → C4 → C5 → C6
```

There are no hard dependencies between them — even reverse order works. Pick whatever lets you ship one task per commit.

---

## Conventions to match (load-bearing)

The Phase A/B implementer (me) hewed closely to existing patterns. Stick to them:

- **TypeScript strict, no `any` except in third-party shim layers.** Use `unknown` and narrow.
- **Cross-module function signatures use named arg objects** (`fn({to, body})` not `fn(to, body)`).
- **Files are kebab-case.ts.**
- **Imports use `.js` extensions** (per the existing ESM convention in `functions/`).
- **Structured logs** via `firebase-functions/logger`: `logger.info("bot.<area>.<event>", {requestId, ...})`. Never log raw phone numbers or full message text — use `maskPhone(p)` from `lib/phone.ts`.
- **Phone numbers** are `E164` everywhere internal (with `+`). Only convert at the Meta boundary.
- **No new tools, callables, or scheduled functions in Phase C.** This phase is purely refactors + Sentry init + one doc. If you find yourself adding a new Cloud Function, you're scope-creeping — stop and re-read the plan.
- **Spanish UI copy** matches the existing voice ("Thora al habla", informal `tú`). Phase C has no UI changes, but the C6 runbook doc should be in English (operator's working language for runbooks per existing `admin-runbook.md`).

### Lint discipline

The repo's CI gates on `npm run lint` clean (zero warnings in the bot tree). You will see **3 pre-existing warnings** in `web/src/lib/hooks/useRSVPForm.ts` and `web/src/lib/staff-service-report.ts` — leave them alone, not yours to fix. Any new warning you introduce blocks the PR.

### Test discipline

`functions/test/` has 38 passing unit tests. After every task, run `npm test` to confirm no regressions. Add tests for new behavior where natural (C1's parallel-execution assertion is a good candidate; C2's transactional-integrity assertion is another) but the launch-readiness plan does not require new tests beyond manual verification — operator does pilot smokes in Phase D.

### Verify after every task

From `functions/`:
```bash
npm run build && npm run lint && npm test
```

All three must be clean before marking a task done. If a build error mentions a duplicate field in an object spread, you probably have the same dispatcher bug Phase A hit twice — `runBroadcast` returns `{broadcastId, ...}` so you can't add `broadcastId,` again before `...result`.

---

## Per-task specifics

### C1 — Parallelize tool execution (`claude/pipeline.ts`)

The optimization plan's Imp-1 has the exact `Promise.all` refactor pattern. Preserve block order in `recordedCalls`, `sideEffects`, and `toolResults`. Sequential single-tool-call paths must not change behavior.

Add a unit test in `functions/test/bot/` (mirror existing `classify.test.cjs` style — these are `.cjs` files, not `.ts`, calling the compiled JS in `lib/`). Stub the Claude response with 3 tool_use blocks and assert all three execute concurrently (a barrier on `Promise.all` of executor-start timestamps is the conventional way) and that `recordedCalls` preserves block order.

### C2 — Single-round-trip rate limit (`conversation/ratelimit.ts`)

The optimization plan's Imp-5 has the `runTransaction` diff verbatim. Preserve the existing return shape `{bucket, count, over, shouldNotify}`. The 35-concurrent-call test ensuring `count` values 1..35 with no duplicates or skips is the acceptance criterion — write that test.

### C3 — Background outbound audit write (`handlers/conversation.ts`)

`sendAndLogOutbound` becomes a foreground `safeSend` followed by a fire-and-forget `void appendMessage(...).catch(logger.error)`. The function returns as soon as the send completes.

**Audit invariant**: inbound row must be logged before outbound row. Phase A/B already awaits `appendMessage(inbound)` earlier in `handleInboundText` (line ~155-ish historically; verify). C3 only changes the outbound write to fire-and-forget — the inbound await stays.

### C4 — Typing indicator (`handlers/conversation.ts`)

The `markReadWithTyping` helper is **already in `whatsapp/send.ts`** (shipped in A1's batch). You only need to call it from `handlers/conversation.ts` immediately after the rate-limit check passes, fire-and-forget with `.catch(logger.info)` (INFO not WARN — failures here are cosmetic).

Per the optimization plan's Imp-2 example, the call site is around the top of `handleInboundText`, before any other Firestore work. The `metaMessageId` to mark read with is `input.inboundMetaMessageId`.

### C5 — Sentry init + handler-level capture

Op-4 is **done** — `SENTRY_DSN` is already set as a Firebase Functions secret. You can deploy this as soon as the code lands.

Create `functions/src/lib/sentry.ts` per the optimization plan's Imp-11 (`ensureSentry(dsn, release?)`, `captureWithContext(err, {requestId, phone?, kind?})`). The `@sentry/node` package is **not yet in `functions/package.json`** — you'll need to `npm install @sentry/node` from inside `functions/` and commit the lockfile change.

**Hard privacy rule** (matches `09-security-privacy.md` §6.1):
- `sendDefaultPii: false`
- Never set `user.username` or `user.email`
- If you need to tag a recipient, use `phone.slice(-4)` — that's the only stable hash allowed
- Never include `text` (raw message body) or full `phone` in Sentry context

Add `SENTRY_DSN` to `WEBHOOK_SECRETS` in `functions/src/bot/lib/config.ts` so it's bound to the webhook function. Call `ensureSentry(SENTRY_DSN.value())` at the top of `handlePost` in `webhook/handler.ts`. In every `catch` block in `webhook/handler.ts`, `handlers/conversation.ts`, `handlers/media.ts`, `handlers/command.ts`, and the new scheduled-function handlers from Phase A (`scheduled/event-reminder.ts`, `scheduled/content-unlock.ts`, `scheduled/film-developed.ts`, `scheduled/keep-kb-warm.ts`), call `captureWithContext(err, {requestId, ...})` immediately before the existing `logger.error(...)` call. Do not replace the logger call — keep both.

`environment`: derive from `process.env.GCP_PROJECT?.includes("staging") ? "staging" : "prod"`. `release`: use `process.env.K_REVISION` (Gen2 sets it automatically).

Acceptance (verify manually after operator deploys):
- A synthetic error thrown in staging surfaces in the Sentry dashboard within 30 s, tagged with `requestId` and the correct release.
- Sentry's "Raw" view of the event shows no PII (no raw phone, no raw text).

### C6 — Backup-SIM runbook (`bot/docs/backup-sim-runbook.md`)

A doc, not code. Draft from `bot/docs/setup-guide.md` Step 5 (Meta provisioning steps, if present) and the operator-side Op-3 reference in `bot/docs/event-optimization-operator-plan.md`. Cover:

1. **Pre-swap checklist**: backup `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN` captured in password manager; all critical templates approved on the backup number.
2. **Swap commands**: the two `firebase functions:secrets:set` calls and `firebase deploy --only functions:whatsappWebhook`.
3. **Webhook re-pointing in Meta Business Manager**: URL stays the same; subscription must be re-confirmed on the new number.
4. **Verification steps**: send a test inbound from operator's personal phone; confirm reply round-trips.
5. **Guest notification fallback**: how to tell guests the number changed (personal WhatsApp + a one-off broadcast from the primary if it's still partially alive).
6. **Rollback**: reverse the secret values, redeploy.

Mark every command "OPERATOR VERIFIES" — you cannot rehearse the swap, so the operator must confirm every step before relying on it mid-incident.

---

## Specific gotchas the Phase A/B implementer hit

- **TypeScript spread-overrides**: when calling `runBroadcast` and logging the result, do not add `broadcastId,` next to `...result` — `runBroadcast` already returns `broadcastId` in its result. Same for any future spread of helper return values.
- **Unused-import lint**: `eslint --ext .js,.ts` is strict about unused locals and imports. If you import `Timestamp` for "future TTL fields", the lint will fail. Only import what you use.
- **`firebase-functions/v2/https` `onCall`** — the callable's input is `request.data` (typed as `unknown`); validate with Zod at the start of every handler. Throw `HttpsError("invalid-argument" | "unauthenticated" | "permission-denied" | "failed-precondition" | "internal")` with a short Spanish-flavored message — see `functions/src/bot/callables/reply-to-escalation.ts` for a worked example.
- **The new scheduled functions added in Phase A reuse the same secrets pool** (`ANTHROPIC_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`). C5 must add `SENTRY_DSN` to those functions' `secrets: [...]` arrays too if you want Sentry capture in their `catch` blocks.

---

## Task tracker

When you start, run `TaskList` to see existing tasks. The Phase A/B implementer (me) marked 1–12 as `completed`; tasks 13–18 are **C1–C6** in `pending` state, ready for you to claim. Tasks 19–21 are E1/E2/E3 (later phase, not your job).

Mark each task `in_progress` when you start, `completed` when build + lint + tests are all green. Don't batch — mark as you go.

---

## When you're done

Phase C exit criteria from the launch-readiness plan: "all C tasks deployed; Sentry receives a synthetic test error from staging and routes it to the operator's phone." The deploy + synthetic-error test are operator work; your bar is "code merged, all checks green, runbook published."

Summarize what shipped in 6 bullets max, flag any callouts (especially anything that couldn't be verified without a live deploy), and hand back to the operator. Do **not** start Phase D — that's the launch broadcast, gated on Op-8 adversarial pass (E4) which is its own joint operator+implementer session.
