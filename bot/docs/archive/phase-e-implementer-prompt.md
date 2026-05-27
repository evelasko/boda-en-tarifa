# Implementer agent prompt — Phase E (pre-event hardening)

> Hand-off prompt for an LLM implementer to ship **Phase E implementer-owned tasks** (E1, E2, E3).
> Today is **2026-05-23**; deploy freeze is **2026-05-28**; wedding is **2026-05-29 → 31**.
> Phases A, B, C have already shipped (see "What is already done"). Phase D (initial broadcast) is operator-driven; you don't run it. Phase E adds the higher-value features that weren't on the launch critical path, then hands off to operator for E4 (joint adversarial), E5 (real-SIM smoke), and E6 (freeze + tag).

---

## Your mission

Ship every task marked **Owner: Implementer** in `bot/docs/launch-readiness-plan.md` §8 — **Phase E**:

| # | Task | Files (primary) | Effort | Owner |
|---|---|---|---|---|
| E1 | Whisper voice-note transcription | new `functions/src/bot/services/transcription.ts`, new `functions/src/bot/handlers/voice.ts`; touch `webhook/classify.ts`, `webhook/handler.ts`, `lib/config.ts` | M | **Implementer** |
| E2 | Pre-event warmup | new `functions/src/bot/scheduled/pre-event-warmup.ts`; touch `bot/index.ts`, root `index.ts` | S | **Implementer** |
| E3 | Opus 4.7 routing for photo turns | `lib/config.ts`, `claude/pipeline.ts`, `handlers/media.ts` | S | **Implementer** |
| E4 | Joint adversarial + concurrency test | runtime check, not code | — | **Joint (not your job)** |
| E5 | Final smoke test from real SIM | runtime check | — | **Operator (not your job)** |
| E6 | Deploy freeze + tag | git ops | — | **Operator (not your job)** |

End state: E1 + E2 + E3 merged, `npm run build` + `npm run lint` + `npm test` clean in `functions/`, no regressions to A/B/C. Hand back to operator for E4 (you may be asked to be on standby during E4's load test, but you don't drive it).

The operator (Enrique) reviews your PRs and runs the production deploys.

---

## What is already done (do NOT redo)

**Phase A — wedding-critical scheduled functions + infra optimizations** (all merged + deployed):

- A1 broadcast core: `functions/src/bot/whatsapp/templates.ts`, `broadcast/audience.ts`, `broadcast/dispatch.ts`, `services/send-log.ts`, `webhook/status.ts`
- A2 `botEventReminderTick` · A3 `botContentUnlockTick` · A4 `botFilmDeveloped` · A5 `botKeepKbWarm` — all in `functions/src/bot/scheduled/`
- A6: webhook is `4GiB / cpu 2 / concurrency 40 / minInstances 5 / maxInstances 50`
- A7: 1-hour Anthropic cache TTL set on the three system-prompt blocks
- Legacy `notifications/send-event-reminder.ts` + `send-content-unlock.ts` deleted
- Shared idempotency helper at `functions/src/bot/scheduled/idempotency.ts`

**Phase B — admin UI minimum viable**:

- `/admin/bot` layout + status header + sub-nav (`web/src/app/admin/bot/layout.tsx`)
- `/admin/bot/conversations` list + `[phone]` thread view
- `/admin/bot/escalations` queue + `[id]` detail with reply box
- `/admin/bot/broadcasts` list + `new` 3-step wizard + `[id]` live progress
- `/admin/bot/settings` (kill switch, film-approval, keep-warm)
- Callables: `botSetConfig`, `botReplyToEscalation`, `botSendBroadcast`, `botCancelBroadcast` — all under `functions/src/bot/callables/`
- Shared admin-check at `functions/src/bot/callables/_admin.ts` — reads `config/admins.emails` (matches existing `web/src/lib/admin-auth.ts`)
- Firestore rule `isOperator()` extended to accept the same email-list path
- Kill-switch wired into `webhook/handler.ts` with a 10s in-process cache

**Phase C — post-deploy hardening + observability** (just shipped)

- C1 parallelized tool execution in `claude/pipeline.ts`
- C2 single-RT rate limit in `conversation/ratelimit.ts`
- C3 backgrounded outbound audit write in `handlers/conversation.ts`
- C4 typing indicator wired at the top of `handleInboundText` (the `markReadWithTyping` helper was pre-shipped in A1's batch in `whatsapp/send.ts`)
- **C5 Sentry**: `functions/src/lib/sentry.ts` exports `ensureSentry(dsn, release?)` + `captureWithContext(err, {requestId, phone?, kind?})`. `SENTRY_DSN` is in `WEBHOOK_SECRETS` and bound to **every** scheduled function in `functions/src/bot/scheduled/*.ts`. Every `catch` block in `webhook/handler.ts`, `handlers/conversation.ts`, `handlers/media.ts`, `handlers/command.ts`, and the scheduled functions calls `captureWithContext(err, {requestId, ...})` before the existing `logger.error(...)`. **You MUST follow this same pattern in E1's new `handlers/voice.ts` and E2's `pre-event-warmup.ts`.**
- C6 backup-SIM runbook at `bot/docs/backup-sim-runbook.md`

**Operator-track status (2026-05-23)**:

- Op-1 Anthropic Priority Tier: **DENIED** — do not add the `anthropic-priority-tier` header anywhere.
- Op-2 Anthropic tier-2: pending; non-blocking.
- Op-3 Backup SIM: in transit; runbook only (C6 done).
- **Op-4 Sentry DSN: DONE** — `SENTRY_DSN` is a Firebase Functions secret, already wired into existing code.
- **Op-5 OpenAI API key: DONE** — `OPENAI_API_KEY` is a Firebase Functions secret, **but not yet declared in `lib/config.ts` or added to `WEBHOOK_SECRETS`**. E1 does that.

---

## Read these first, in this order

1. **`bot/docs/launch-readiness-plan.md` §8 Phase E (tasks E1, E2, E3)** — authoritative scope, behavior contracts, acceptance criteria.
2. **`bot/docs/event-optimization-implementer-plan.md` Imp-8 (E3), Imp-9 (E1), Imp-10 second half (E2)** — has worked diffs and per-call contracts. Where it disagrees with the launch-readiness plan, the launch-readiness plan wins.
3. **`functions/src/bot/lib/config.ts`** — pattern for declaring secrets and extending `WEBHOOK_SECRETS`. E1 adds `OPENAI_API_KEY`; E3 adds `CLAUDE_OPUS_MODEL = "claude-opus-4-7"`.
4. **`functions/src/bot/webhook/classify.ts`** — currently buckets `audio` as `media`. E1 surfaces it as a first-class kind with discriminator `kind: "audio"`. Mirror the existing `media` shape (mediaId, mimeType).
5. **`functions/src/bot/webhook/handler.ts`** — read end-to-end. You'll add an `event.kind === "audio"` branch in `dispatchEvent` that calls into `handlers/voice.ts`. The kill-switch guard, Sentry init, status fanout, and dedupe wrapping are all already in place — don't duplicate them, route through them.
6. **`functions/src/bot/handlers/media.ts`** — read the `runTurn` call site for the inbound-photo path. E3 changes that single call to pass `model: CLAUDE_OPUS_MODEL`. (Verify it exists; the handler shipped in Phase 3, before A1.)
7. **`functions/src/bot/handlers/conversation.ts`** — read `handleInboundText` end-to-end. E1's voice handler reuses this exact pattern (allowlist → rate-limit → command → language → pipeline) but feeds it transcribed text. Look for a clean way to refactor the allowlist+rate-limit prefix into a shared helper so voice doesn't duplicate it.
8. **`functions/src/bot/whatsapp/media.ts`** — has the Meta-media-download flow E1 reuses for fetching the audio binary.
9. **`functions/src/bot/claude/pipeline.ts`** — read `runTurn` + `PipelineInput`. E3 adds an optional `model?: string` field defaulting to `CLAUDE_SONNET_MODEL`. C1 (parallelized tool execution) is already in this file — do not refactor the tool loop again.
10. **`functions/src/bot/scheduled/keep-kb-warm.ts`** — A5 reference. E2's `pre-event-warmup.ts` is structurally very similar (load KB, build system, fire Claude pings) but gated by proximity to hardcoded event times rather than an always-on active window.
11. **`functions/src/lib/sentry.ts`** + **`functions/src/bot/scheduled/event-reminder.ts`** — reference for how to wire `ensureSentry(SENTRY_DSN.value())` + `captureWithContext(...)` into a new function. Both E1's voice handler and E2's warmup function follow this pattern.
12. **`bot/specs/02-conversation-design.md` §9 ("AUDIO_ACK")** + **`functions/src/bot/lib/i18n.ts`** — already exports `AUDIO_ACK` Bilingual constants. E1 uses these for the empty-transcription fallback (do NOT improvise the copy).
13. **`bot/specs/09-security-privacy.md` §6.1** — load-bearing for E1's audit log: never log raw transcription text in Cloud Logs (Firestore audit row is fine; that's gated to operators). Same Sentry rules apply: only `phone.slice(-4)`, never raw text.

Skim, don't re-read everything you don't need. Phase A/B/C touched a lot; focus on the files above.

---

## Sequencing

E1, E2, E3 are **independent**. Pick whichever order minimizes context-switching. Recommended (in dependency-graph order):

```
E3 (Opus photos)  ──┐
E2 (pre-event warmup) ──┼──→ all green ──→ hand off to operator for E4
E1 (Whisper voice)  ──┘
```

E3 is the smallest (3 lines + a constant). E2 mirrors A5 closely. E1 is the heaviest — new service, new handler, classify changes, webhook routing, secret declaration, refactor of the shared allowlist+rate-limit prefix.

---

## Conventions to match (load-bearing)

Same as Phase A/B/C — the prior implementers held to these tightly:

- **TypeScript strict, no `any`** except in third-party shim layers. Use `unknown` + narrow.
- **Cross-module function signatures use named arg objects** (`fn({to, body})`).
- **Files are kebab-case.ts.** Imports use `.js` extensions (existing ESM convention).
- **Structured logs** via `firebase-functions/logger`: `logger.info("bot.<area>.<event>", {requestId, ...})`. Never log raw phone numbers (use `maskPhone(p)` from `lib/phone.ts`) or full message text.
- **Phone numbers are E.164 with `+`** internally; convert at the Meta boundary via `toMetaWaId`/`fromMetaWaId`.
- **Spanish UI copy** matches existing voice (Thora's). For E1's empty-transcription fallback, use the existing `AUDIO_ACK` Bilingual constant from `lib/i18n.ts` — do NOT write new copy.
- **Sentry pattern is mandatory for new handlers.** At function top: `ensureSentry(SENTRY_DSN.value())`. In every `catch`: `captureWithContext(err, {requestId, kind?})` immediately before the existing `logger.error(...)`. Never pass raw text or full phone — only `phone.slice(-4)` if you absolutely need to tag a recipient.

### Lint discipline

The repo gates on zero new warnings in the bot tree. You will see **3 pre-existing warnings** in `web/src/lib/hooks/useRSVPForm.ts` and `web/src/lib/staff-service-report.ts` — not yours to fix. Any new warning you introduce blocks the PR.

### Test discipline

After every task: `cd functions && npm run build && npm run lint && npm test`. All three must be clean before marking done. 38 unit tests should stay at 38 passing (or higher if you add tests).

### Verify cycle

```bash
cd functions
npm run build && npm run lint && npm test
```

Common bug from Phase A/B/C: **don't spread a result that contains a field you also set explicitly**. `runBroadcast` returns `{broadcastId, ...}` — if you write `{broadcastId, ...result}` TS errors with "specified more than once". This bit two prior agents.

---

## Per-task specifics

### E1 — Whisper voice-note transcription

**Status**: Op-5 (OpenAI API key) is done. You can deploy as soon as code lands.

**New files**:
- `functions/src/bot/services/transcription.ts` — Whisper wrapper. Contract from optimization-plan §Imp-9:
  ```ts
  export interface TranscribeArgs {
    audioBuffer: Buffer;
    mimeType: string;
    language?: Language;       // hint, optional
    apiKey: string;
    requestId: string;
  }
  export interface TranscribeResult {
    text: string;
    durationSec?: number;
    detectedLanguage?: string;
  }
  export async function transcribe(args: TranscribeArgs): Promise<TranscribeResult>;
  ```
  Use `fetch` + `FormData` against `https://api.openai.com/v1/audio/transcriptions` with `model=whisper-1`. Reject audio > 25 MB (Whisper's hard limit) with a typed error. No need to add the OpenAI SDK — one endpoint, plain fetch.
- `functions/src/bot/handlers/voice.ts` — orchestrator. Steps:
  1. Allowlist + rate-limit check (reuse shared prefix — refactor it out of `handlers/conversation.ts` into a tiny helper if cleaner; don't duplicate)
  2. Download audio via the existing `whatsapp/media.ts` Meta-media flow
  3. Call `transcribe(...)` with `Language` hint from the guest's stored `language` if present
  4. If transcription text is empty/whitespace: reply with the pre-existing `AUDIO_ACK` from `lib/i18n.ts` (DO NOT call Claude — short-circuit), log `bot.transcription.empty`
  5. Else: route the text through `handleInboundText` (or its internal pipeline) so Claude sees it as a normal text turn
  6. Audit log entry: `type: "audio"`, includes both the Cloudinary URL (per existing media flow) and the transcribed text. Cloudinary upload of the raw audio is **optional**; defer if it complicates the PR — the transcribed text is the primary record.

**Touched files**:
- `functions/src/bot/webhook/classify.ts` — surface `audio` as a first-class `kind`. Currently it's bucketed under `media`. Add a discriminator branch so `dispatchEvent` can route it cleanly. Mirror the `media` shape (`mediaId`, `mimeType`, `from`, `messageId`).
- `functions/src/bot/webhook/handler.ts` — in `dispatchEvent`, add an `event.kind === "audio"` branch that calls `handleInboundAudio(...)` from the new `handlers/voice.ts`. Pattern matches the existing media-dispatch branch — copy from `dispatchMedia` for shape.
- `functions/src/bot/lib/config.ts` — declare `OPENAI_API_KEY = defineSecret("OPENAI_API_KEY")` and add it to `WEBHOOK_SECRETS`.

**Edge cases (already specified)**:
- Empty transcription → soft-fallback reply, no Claude call.
- Transcription timeout > 10s → the webhook ack pattern already handles this; no extra work.
- Non-Spanish/EN audio → Whisper auto-detects; downstream Claude turn sees foreign text and Thora redirects per existing off-topic rules.

**Acceptance** (from launch-readiness §8 E1):
- Sending a 5-second Spanish voice note to staging produces a sensible Thora reply within ~8s; audit log shows transcription text + Cloudinary URL (if you wired it).
- Sending a near-silent voice note produces the `AUDIO_ACK` fallback with no Claude call (verify via Cloud Logging — no `bot.claude.*` events for that requestId).

**Sentry**: wire `ensureSentry` + `captureWithContext` in `handleInboundAudio`'s `catch` blocks. Same pattern as `handlers/conversation.ts`.

### E2 — Pre-event warmup

**Source**: launch-readiness §8 E2 + optimization-plan Imp-10 second half. Depends on A5 (`scheduled/keep-kb-warm.ts`) — already shipped.

**New file**: `functions/src/bot/scheduled/pre-event-warmup.ts`. Pattern mirrors A5:
- `onSchedule` every 30 minutes (`"0,30 * * * *"`)
- Region `BOT_REGION`, timezone `WEDDING_TIMEZONE`
- Secrets: `[ANTHROPIC_API_KEY, SENTRY_DSN]`
- 512 MiB, cpu 1, 60s timeout (warmup runs three pings in series — give it room)
- `ensureSentry(SENTRY_DSN.value())` at the top

**Behavior**:
1. Compute "now". If outside the active window (2026-05-23 → 2026-06-05 Europe/Madrid) → return.
2. Honor `config/bot.keep_warm_enabled` (default true) — same check as A5; refactor into a shared helper if cleaner.
3. Hardcoded event start times — extract from `bot/data/events.yaml` at module load OR just hardcode the four targets per the plan:
   ```
   2026-05-29T19:30:00+02:00  (Friday welcome dinner)
   2026-05-30T17:00:00+02:00  (Saturday ceremony)
   2026-05-31T11:00:00+02:00  (Sunday brunch)
   2026-05-31T19:00:00+02:00  (Sunday album reveal)
   ```
   Plan says "for safety, hardcode in the file since the schedule is frozen". Do that.
4. Find any target where `(target - now)` is positive and < 60 minutes.
5. If found: call `invalidateKbCache()` from `claude/kb.ts` to force a fresh KB build (if such a function exists; otherwise just call `getKb()` after clearing the in-process cache — read kb.ts to see what's available). Then fire **three** 1-token Claude `messages.create` pings in series (each refreshes cache on a different warm instance, statistically — `minInstances: 5` means multiple instances exist).
6. Log `bot.preeventwarmup.ok` with `{kbVersion, targets: <count>}`.

**Acceptance**:
- 60 min before any test event time, `bot.preeventwarmup.ok` fires three times in quick succession; the next real inbound's audit log shows `cachedReadTokens` ≈ `inputTokens`.

**Wire it up**:
- Export from `functions/src/bot/index.ts`
- Re-export from root `functions/src/index.ts`

### E3 — Opus 4.7 routing for photo turns

**Source**: launch-readiness §8 E3 + optimization-plan Imp-8.

**Touches**:
- `functions/src/bot/lib/config.ts` — add `export const CLAUDE_OPUS_MODEL = "claude-opus-4-7";` alongside the existing Sonnet/Haiku constants.
- `functions/src/bot/claude/pipeline.ts` — `PipelineInput` gets an optional `model?: string`. In `runTurn`, use `input.model ?? CLAUDE_SONNET_MODEL` in the `messages.create` call. **Do not** refactor the tool loop — C1 already parallelized it.
- `functions/src/bot/handlers/media.ts` — at the inbound-photo `runTurn` call site, pass `model: CLAUDE_OPUS_MODEL`. Read the file first to find the exact call.

**Audit log**: `appendMessage` already accepts `claudeModel`. Update the value passed from the media path to `"opus-4-7"` (you may need to extend the `claudeModel` union in `services/audit.ts` from `"sonnet-4-6" | "haiku-4-5"` to also include `"opus-4-7"`).

**Cost budget**: ~30 photo turns × Opus pricing ≈ €2 over the event. Pre-approved.

**Acceptance**:
- Text inbound's audit shows `claudeModel: "sonnet-4-6"`.
- Photo inbound's audit shows `claudeModel: "opus-4-7"`.

---

## Specific gotchas to avoid

- **Spread-override bug**: don't add `broadcastId,` next to `...result` when `result` already contains `broadcastId`. TS error "specified more than once". This hit two prior agents.
- **Unused imports**: `eslint` is strict. If you import `Timestamp` for "future fields" without using it, the lint fails.
- **Sentry secrets pool**: every new function that catches errors should add `SENTRY_DSN` to its `secrets: [...]` array. The Phase C agent already did this for all four scheduled functions and the webhook — your new `pre-event-warmup.ts` and (probably) `handlers/voice.ts` need the same.
- **Don't re-add `markReadWithTyping`** — it's already in `whatsapp/send.ts`. C4 already wired the call site in `handleInboundText`. E1's voice handler should also call it for the inbound audio message (fire-and-forget per the C4 pattern).
- **Don't touch the tool-execution loop in `claude/pipeline.ts`** — C1 already parallelized it. Your E3 change is only the model arg.
- **Don't duplicate the kill-switch check**. It lives in `webhook/handler.ts` once and applies to all inbound. Voice inbound goes through the same `handlePost` → `dispatchEvent` flow, so it inherits the guard automatically.

---

## Task tracker

When you start, run `TaskList`. Tasks 19, 20, 21 are E1, E2, E3 in `pending` (created by the Phase A/B implementer; verified intact through Phase C). Claim by setting `in_progress`. Mark `completed` when build + lint + tests are green for that task.

E4, E5, E6 are NOT in the task list because they aren't Implementer-owned. Don't create tasks for them.

---

## What you do NOT touch

- **Phase D (initial broadcast launch)** — operator drives D1-D4. You're available on standby if asked, but you don't initiate any broadcast. Once the operator launches D, the bot will be live with real guests; your code changes during that window MUST be reviewed extra carefully.
- **E4 joint adversarial test** — that's a real-time joint session: operator + helper attack from real phones; you'd run the concurrency script and watch Sentry. Different work mode; don't try to do it solo.
- **E5 real-SIM smoke test** — operator-only (only they have the live SIM in hand).
- **E6 freeze + git tag** — operator-only.
- **`triggerFilmDevelopment` in `camera/trigger-film-development.ts`** — legacy FCM, dead path, but explicitly preserved per launch plan A4 note "Do not break the existing camera flow". Leave it alone.
- **The pre-existing 3 lint warnings** in `web/src/lib/hooks/useRSVPForm.ts` and `web/src/lib/staff-service-report.ts` — not yours.
- **The pre-existing typecheck error** in `web/src/lib/__tests__/admin-rsvp-update.test.ts` (a `MainCoursePreference` union mismatch) — not yours.

---

## When you're done

Summarize in 6 bullets max:
- What shipped (per E1/E2/E3)
- New files added
- Touched files
- Any new lint/test additions
- Any open callouts (especially anything that needs live deploy to verify, e.g., the staging Whisper round-trip)
- Hand back to operator for E4 prep

Phase E exit criteria from the launch-readiness plan: "all E tasks deployed; Op-8 joint test passes; deploy frozen and tagged." Your bar is "E1+E2+E3 merged, all checks green." The deploy + E4 joint test + E5 smoke + E6 freeze are operator-led from there.
