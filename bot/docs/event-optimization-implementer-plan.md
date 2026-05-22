# Event Optimization — Implementer Plan

> Code-side tasks to harden Thora's latency, availability, and observability for the wedding window (2026-05-23 → 2026-06-05). Companion document: [`event-optimization-operator-plan.md`](./event-optimization-operator-plan.md) — read both before scheduling work.
>
> **Today**: 2026-05-22. **Wedding**: 2026-05-29 → 2026-05-31. **Active window**: 2026-05-23 → 2026-06-05. **Deploy freeze**: 2026-05-28 (T-1).
>
> Audience: an LLM implementer with operator (Enrique) reviewing PRs daily. Every task includes goal, target files, exact diffs or contracts, acceptance criteria, and dependencies. **Do not start a task before its dependencies are resolved** — most failures here come from racing the operator on Anthropic / Sentry / OpenAI keys.

---

## Architectural context (read first)

Current per-turn flow in `functions/src/bot/handlers/conversation.ts`:

```
allowlist → rate-limit → command check → language detect →
  touchGuestOnInbound → upsertConversationRoot → appendMessage(inbound) →
  Promise.all([getKb, loadHistory, renderToday]) → runTurn(Sonnet+tools) →
  sendText → appendMessage(outbound)
```

Of ~3–5 s p50 wall-clock, ~70 % is Claude inference and ~20–25 % is serialized Firestore writes that don't gate Claude. The optimizations below attack the non-Claude portion (Tasks 1, 4, 5, 7), shave perceived latency (Task 2), reduce cache misses (Task 3, 10), and add new capabilities (Tasks 8, 9, 11).

The full investigation that produced this list lives in the conversation that generated this doc (2026-05-22). The 10-item table from that investigation has been re-prioritized given the agreed infra plan: items #9 (streaming) and #10 (cached rendered KB doc) are explicitly **deferred** — they're redundant with `minInstances: 5` and Anthropic Priority Tier.

---

## Cross-references with the operator plan

| Implementer task | Blocked by operator task | Notes |
|---|---|---|
| Imp-3 (1h cache + priority header) | Op-1 (Anthropic Priority Tier approved) | Can land header-less first; flip header once Op-1 confirms |
| Imp-9 (Whisper voice notes) | Op-5 (OpenAI key in `OPENAI_API_KEY` secret) | Hard block — can't deploy without secret |
| Imp-11 (Sentry init) | Op-4 (Sentry DSN in `SENTRY_DSN` secret) | Hard block |
| Imp-12 (compute config) | none | Code-only change; operator deploys (Op-6) |
| Imp-13 (backup-SIM hot-swap helper) | Op-3 (SIM provisioned + secrets captured) | Optional — only land if operator wants the runbook scriptable |

Tasks **not** blocked by any operator work: Imp-1, 2, 4, 5, 6, 7, 8, 10. Start with these in parallel while operator chases approvals.

---

## Task index & sequencing

| # | Task | Files | Effort | Dep. |
|---|---|---|---|---|
| Imp-1 | Parallelize tool execution | `claude/pipeline.ts` | XS | — |
| Imp-2 | WhatsApp typing indicator | `whatsapp/send.ts`, `handlers/conversation.ts` | S | — |
| Imp-3 | 1-hour cache TTL + priority header | `claude/system-prompt.ts`, `claude/pipeline.ts` | XS | Op-1 (soft) |
| Imp-4 | Background pre-Claude Firestore writes | `handlers/conversation.ts` | S | — |
| Imp-5 | Single-RT rate limit | `conversation/ratelimit.ts` | S | — |
| Imp-6 | Language fast path (regex + phone heuristic) | `claude/language.ts`, `handlers/conversation.ts` | S | — |
| Imp-7 | Background outbound audit write | `handlers/conversation.ts` | XS | — |
| Imp-8 | Opus 4.7 routing for photo turns | `lib/config.ts`, `claude/pipeline.ts`, `handlers/media.ts` | S | — |
| Imp-9 | Whisper voice-note transcription | new: `services/transcription.ts`, `handlers/voice.ts`; touch: `webhook/classify.ts`, `webhook/handler.ts` | M | Op-5 |
| Imp-10 | Aggressive keep-warm + pre-event warm-up | new: `scheduled/keepKbWarm.ts`, `scheduled/preEventWarmup.ts`; touch: `bot/index.ts` | M | — |
| Imp-11 | Sentry init + handler-level capture | new: `lib/sentry.ts`; touch: `webhook/handler.ts`, `handlers/*.ts` | S | Op-4 |
| Imp-12 | Cloud Functions compute config bump | `webhook/handler.ts`, `lib/config.ts` | XS | — |
| Imp-13 | Backup-SIM hot-swap (optional, scripted) | `lib/config.ts`, runbook in docs | XS | Op-3 |

Recommended sequencing (parallel work assumed):

```
Day T-6 (May 23): Imp-1, Imp-3, Imp-5, Imp-7, Imp-12   ← cheap, no deps
Day T-5 (May 24): Imp-2, Imp-4, Imp-6, Imp-10          ← code-only mid-effort
Day T-4 (May 25): Imp-8, Imp-11 (after Op-4 lands)
Day T-3 (May 26): Imp-9 (after Op-5 lands)
Day T-2 (May 27): joint load + adversarial test (Op-8)
Day T-1 (May 28): deploy freeze
```

---

## Imp-1 — Parallelize tool execution within a turn

### Goal
When Claude emits ≥2 `tool_use` blocks in a single response, execute them concurrently instead of sequentially. Saves 100–400 ms on common multi-tool turns (`get_guest_context` + `lookup_events` + `get_current_weather`).

### Target file
`functions/src/bot/claude/pipeline.ts:138–168` (the `for (const block of resp.content)` loop).

### Contract
- Each tool call is independent — no tool depends on another's output within the same emission.
- Side effects (location pin, flow trigger, escalation) may be enqueued in any order; the eventual outbound `sideEffects` array can be insertion-ordered by tool_use block index (preserve current ordering for log readability).
- `recordedCalls` must preserve block-order so audit logs match the request flow.

### Approach
Replace the sequential loop with `Promise.all` over the `tool_use` blocks, then re-assemble `toolResults`, `recordedCalls`, and `sideEffects` in the original block order:

```ts
const toolBlocks = resp.content.filter(
  (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
);

const executed = await Promise.all(
  toolBlocks.map(async (block) => {
    const args = (block.input as Record<string, unknown>) ?? {};
    const result = await executeTool(block.name, args, toolCtx).catch((err) => {
      logger.error("bot.claude.pipeline.tool_threw", {
        requestId: input.requestId,
        name: block.name,
        err: err instanceof Error ? err.message : String(err),
      });
      return { output: { error: "tool_exception" }, errored: true } as ToolResult;
    });
    return { block, args, result };
  })
);

for (const { block, args, result } of executed) {
  recordedCalls.push({ name: block.name, input: args, output: result.output, errored: result.errored });
  if (result.sideEffect) sideEffects.push(result.sideEffect);
  toolResults.push({
    type: "tool_result",
    tool_use_id: block.id,
    content: JSON.stringify(result.output),
    is_error: result.errored ?? false,
  });
}
```

### Acceptance
- Unit test in `functions/test/bot/claude/pipeline.spec.ts`: stub Claude to emit 3 tool_use blocks; assert all 3 executors are invoked concurrently (use a barrier / `Promise.allSettled` of stub timestamps) and that `recordedCalls` preserves order.
- No change to single-tool-call paths (the most common case).

---

## Imp-2 — WhatsApp typing indicator

### Goal
Within ~100 ms of receiving an inbound, mark it read and show the typing-indicator bubble in WhatsApp. Masks 2–4 s of Claude latency as perceived "Thora is composing…"

### Target files
- `functions/src/bot/whatsapp/send.ts` (add `markReadWithTyping`)
- `functions/src/bot/handlers/conversation.ts` (call site)

### Contract
- Meta endpoint: `POST /{phone_number_id}/messages` with body
  ```json
  {
    "messaging_product": "whatsapp",
    "status": "read",
    "message_id": "wamid.xxx",
    "typing_indicator": { "type": "text" }
  }
  ```
- Fire-and-forget — never blocks the conversation handler. Errors logged at INFO level (not WARN — failures here are cosmetic).
- Idempotent on Meta's side (calling twice for the same `message_id` is a no-op).

### Call site
In `handlers/conversation.ts`, immediately after `recordInboundAndCheck` returns "not rate-limited" and before any other Firestore work:

```ts
void markReadWithTyping({
  metaMessageId: input.inboundMetaMessageId,
  phoneNumberId: deps.whatsappPhoneNumberId,
  accessToken: deps.whatsappAccessToken,
  requestId,
}).catch((err) => {
  logger.info("bot.conversation.typing_indicator_failed", {
    requestId,
    err: err instanceof Error ? err.message : String(err),
  });
});
```

### Acceptance
- Unit test stubs the Meta client and asserts the correct body shape.
- Manual: send an inbound to staging, observe "typing…" within ~1 s in the WhatsApp UI.

---

## Imp-3 — 1-hour cache TTL + Priority Tier header

### Goal
Extend the Anthropic ephemeral cache TTL from 5 min (default) to 1 hour, so cache hits survive idle stretches between guest messages. Optionally route through the Priority Tier lane once operator confirms approval (Op-1).

### Target files
- `functions/src/bot/claude/system-prompt.ts:120–128`
- `functions/src/bot/claude/pipeline.ts:108–116` (priority header)

### Diff for system-prompt.ts
```ts
export function buildSystem(args: SystemPromptArgs): Anthropic.Messages.TextBlockParam[] {
  const cc: Anthropic.Messages.CacheControlEphemeral = {
    type: "ephemeral",
    ttl: "1h",
  };
  return [
    { type: "text", text: BLOCK_A, cache_control: cc },
    { type: "text", text: args.kbBlock, cache_control: cc },
    { type: "text", text: BLOCK_C, cache_control: cc },
  ];
}
```

The `ttl: "1h"` field is supported by `@anthropic-ai/sdk` ≥ 0.32. Verify the installed version: `npm ls @anthropic-ai/sdk` inside `functions/`. If lower, bump first: `npm i @anthropic-ai/sdk@latest`.

### Diff for pipeline.ts (priority header)
Once operator confirms Op-1 approved, add the priority header on the hot-path `messages.create` call:

```ts
const resp = await client(input.apiKey).messages.create(
  {
    model: CLAUDE_SONNET_MODEL,
    max_tokens: maxTokens,
    system,
    tools: TOOLS,
    messages,
  },
  {
    headers: {
      "anthropic-priority-tier": "priority",
    },
  }
);
```

Until Op-1 lands, do NOT add the header (Anthropic returns 400 on unauthorized header values). Track Op-1 status in this section's verification log:

```
Op-1 confirmation log:
- [ ] Operator confirmed Priority Tier active on [DATE]
- [ ] Header enabled in pipeline.ts on [DATE]
```

### Side effects
- Cache write cost goes up ~1.25× per write (Anthropic's pricing for 1h TTL).
- Cache hit rate goes up dramatically — net cost decreases.
- Keep-warm (Imp-10) can run less often (every 50 min instead of every 4 min — but we agreed every 60 s for paranoia / sub-minute first-turn safety).

### Acceptance
- Live test: send two inbounds 45 min apart on staging. The second one's `usage.cache_read_input_tokens` should be ~95 % of input tokens (vs ~0 % under the old 5-min TTL).
- Verified in logs: search for `cachedReadTokens` after the second message.

---

## Imp-4 — Background pre-Claude Firestore writes

### Goal
Move the three pre-Claude Firestore writes (`touchGuestOnInbound`, `upsertConversationRoot`, `appendMessage(inbound)`) off the critical path. Their results are not consumed by `runTurn`. Saves ~150–300 ms p50.

### Target file
`functions/src/bot/handlers/conversation.ts:144–203`

### Constraints
- `appendMessage(inbound)` depends on `upsertConversationRoot` (the message-collection write transaction updates the root doc, which must exist). So these two are sequential.
- `touchGuestOnInbound` is independent of both.
- The audit invariant "outbound is logged only after inbound is logged" must hold — the inbound write must complete before the outbound write.
- We never return to the user a successful reply for an inbound that wasn't logged. So `await` the background promises before the outbound audit write.

### Approach
```ts
// Kick off Firestore writes immediately — they are not on the Claude path.
const inboundLoggedPromise = (async () => {
  await upsertConversationRoot({ phone, guestId: guest.id, language });
  await appendMessage({
    phone, guestId: guest.id,
    direction: "inbound", type: "text",
    requestId, metaMessageId: input.inboundMetaMessageId, text,
  });
})();

const guestTouchedPromise = touchGuestOnInbound(guest).catch((err) => {
  logger.warn("bot.conversation.touch_failed", { requestId, err: String(err) });
});

// In parallel, fetch what Claude actually needs.
const [kb, history, todaysSituation] = await Promise.all([
  getKb(),
  loadHistory(phone),
  renderTodaysSituation({ now: new Date(), language }),
]);

// Run Claude.
const pipeline = await runTurn({ ... });

// Before logging the outbound, ensure the inbound row exists.
await inboundLoggedPromise;
// guestTouchedPromise is allowed to settle in the background; no await.

// Send + log outbound (Imp-7 makes this also async-fire-and-forget).
```

### Acceptance
- Existing integration tests in `functions/test/` continue to pass.
- New test: confirm that even when `upsertConversationRoot` is artificially slowed by 1 s, the user sees the reply within 4 s (proving the writes overlap with Claude).
- Audit log ordering is preserved: inbound row's `createdAt` precedes outbound row's `createdAt` in every audit query.

---

## Imp-5 — Single-round-trip rate limit

### Goal
Replace the `set(merge) → get` two-trip pattern with a single Firestore transaction that increments and returns the new count. Saves ~80–150 ms per inbound.

### Target file
`functions/src/bot/conversation/ratelimit.ts:42–68`

### Diff
```ts
export async function recordInboundAndCheck(
  phone: E164,
  limit: number = DEFAULT_RATE_LIMIT_PER_5MIN
): Promise<RateDecision> {
  const bucket = rateBucket();
  const docId = `${phone.replace("+", "")}_${bucket}`;
  const ref = getFirestore().collection(COLLECTION).doc(docId);

  const count = await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = ((snap.data()?.count as number | undefined) ?? 0) + 1;
    tx.set(
      ref,
      {
        phone,
        bucket,
        count: current,
        ttlExpiresAt: Timestamp.fromMillis(Date.now() + RATE_BUCKET_TTL_MS),
      },
      { merge: true }
    );
    return current;
  });

  const over = count > limit;
  const shouldNotify = count === limit + 1;
  return { bucket, count, over, shouldNotify };
}
```

### Tradeoff
A transaction has slightly higher fixed cost than a single `set`, but eliminates the `get` round-trip. Net latency improvement is positive in all cases observed.

### Acceptance
- Existing rate-limit tests pass.
- New test: 35 concurrent calls from the same phone produce `count` values 1..35 with no duplicates or skips (transactional integrity preserved).

---

## Imp-6 — Language fast path

### Goal
Skip the Haiku 4.5 language-detection round-trip (currently ~400–900 ms on first-turn) when a simple heuristic gives high confidence. Fall back to Haiku only on ambiguity.

### Target files
- `functions/src/bot/claude/language.ts` (extend with `fastDetectLanguage`)
- `functions/src/bot/handlers/conversation.ts:269–293` (use fast path first)

### Heuristic
```ts
export interface FastDetectResult {
  language: Language | null;
  confidence: number; // 0..1
}

export function fastDetectLanguage(args: {
  text: string;
  phone: E164;
}): FastDetectResult {
  const t = args.text.toLowerCase().trim();
  if (!t) return { language: "es", confidence: 0.6 };

  // Strong ES signals
  const esStrong = /[ñ¿¡áéíóú]/i.test(args.text)
    || /\b(hola|gracias|qué|por favor|buenas|cuándo|dónde|cómo)\b/.test(t);
  if (esStrong) return { language: "es", confidence: 0.95 };

  // Strong EN signals
  const enStrong = /\b(hello|hi|thanks|please|where|when|how|the|is|are)\b/.test(t);
  if (enStrong) return { language: "en", confidence: 0.9 };

  // Country-code bias (Spain primary)
  if (args.phone.startsWith("+34")) {
    return { language: "es", confidence: 0.75 };
  }
  if (/^\+(1|44|33|49|31|351|39)/.test(args.phone)) {
    return { language: "en", confidence: 0.7 };
  }

  return { language: null, confidence: 0 };
}
```

### Caller (`handlers/conversation.ts`)
```ts
async function resolveLanguage(args: {...}): Promise<Language> {
  if (isLanguage(args.storedLanguage)) return args.storedLanguage;

  const fast = fastDetectLanguage({ text: args.text, phone: args.phone });
  if (fast.confidence >= 0.85 && fast.language) {
    void setLanguage(args.guestId, fast.language).catch(...);
    return fast.language;
  }

  // Ambiguous — fall back to Haiku
  const detected = await detectLanguage({ ... });
  void setLanguage(args.guestId, detected).catch(...);
  return detected;
}
```

### Acceptance
- Unit tests for `fastDetectLanguage` covering: ES words, EN words, +34 phones, +1/+44 phones, empty text, mixed-language.
- Integration: send "hola, ¿a qué hora la cena?" — assert no Haiku call in logs.
- Send "hello there" — assert no Haiku call.
- Send "ok 👍" from a +1 number — assert Haiku IS called (ambiguous).

---

## Imp-7 — Background outbound audit write

### Goal
After `sendText`, the `appendMessage(outbound)` call is purely for audit/admin display — the user has already received the reply. Move it off the response path.

### Target file
`functions/src/bot/handlers/conversation.ts:318–347` (the `sendAndLogOutbound` function)

### Diff
Split into `send` + `void log`. The function returns as soon as `safeSend` resolves; the log write runs in the background with error logging.

```ts
async function sendAndLogOutbound(args: {...}): Promise<void> {
  const sendResult = await safeSend({ ... });

  // Audit write is fire-and-forget — user already has the reply.
  void appendMessage({
    phone: args.input.phone,
    guestId: args.guestId,
    direction: "outbound",
    type: "text",
    requestId: args.input.requestId,
    metaMessageId: sendResult.metaMessageId,
    text: args.replyText,
    outcome: args.outcome,
    errorMessage: args.errorMessage,
    toolCalls: args.pipeline?.toolCalls,
    claudeModel: args.pipeline ? "sonnet-4-6" : undefined,
    claudeUsage: args.pipeline?.usage,
  }).catch((err) => {
    logger.error("bot.conversation.outbound_audit_failed", {
      requestId: args.input.requestId,
      err: err instanceof Error ? err.message : String(err),
    });
  });
}
```

### Side effect
The function returns ~80–150 ms sooner, freeing the instance for the next inbound. The user-visible latency doesn't change, but per-instance throughput improves.

### Acceptance
- Existing tests pass.
- New: assert that `sendAndLogOutbound` resolves before the audit write completes (introspect Firestore mock timing).

---

## Imp-8 — Opus 4.7 routing for photo turns

### Goal
Use Claude Opus 4.7 (the highest-quality vision model in the 4.x family) for inbound photo turns where face recognition against the dossier matters. Sonnet 4.6 remains the default for all text turns.

### Target files
- `functions/src/bot/lib/config.ts` (add `CLAUDE_OPUS_MODEL`)
- `functions/src/bot/claude/pipeline.ts` (accept optional `model` arg)
- `functions/src/bot/handlers/media.ts` (pass Opus when calling pipeline)

### Diff for config.ts
```ts
export const CLAUDE_SONNET_MODEL = "claude-sonnet-4-6";
export const CLAUDE_HAIKU_MODEL = "claude-haiku-4-5-20251001";
export const CLAUDE_OPUS_MODEL = "claude-opus-4-7";
```

### Diff for pipeline.ts
Add `model` to `PipelineInput`; default to Sonnet:

```ts
export interface PipelineInput {
  ...
  model?: string; // defaults to CLAUDE_SONNET_MODEL
}

// inside runTurn:
const model = input.model ?? CLAUDE_SONNET_MODEL;
const resp = await client(input.apiKey).messages.create({
  model,
  ...
});
```

### Diff for media.ts
When invoking `runTurn` for an inbound image, pass `model: CLAUDE_OPUS_MODEL`. (Read `handlers/media.ts` to find the right call site — it should already exist for the photo-handling path.)

### Cost budget
~30 photo turns × Opus pricing ≈ €2 over the event. Within envelope.

### Acceptance
- Inbound text continues to use Sonnet (verify in logs: `claudeModel: "sonnet-4-6"`).
- Inbound photo logs `claudeModel: "opus-4-7"`.
- The dossier-recognition behavior for a known guest's photo is at least as good as before (manual eval with 5 dossier'd guest reference photos).

---

## Imp-9 — Whisper voice-note transcription

### Goal
When a guest sends an audio message (`type: "audio"`), transcribe it via OpenAI Whisper and forward the resulting text through the normal conversation handler — Thora replies as if the guest had typed.

### Blocker
**Op-5 must land first**: secret `OPENAI_API_KEY` must be set via `firebase functions:secrets:set OPENAI_API_KEY`. Do not deploy this task until confirmed.

### New files
- `functions/src/bot/services/transcription.ts` (Whisper wrapper)
- `functions/src/bot/handlers/voice.ts` (orchestrator)

### Touched files
- `functions/src/bot/webhook/classify.ts` (add `audio` as a first-class kind, not just "media")
- `functions/src/bot/webhook/handler.ts` (dispatch to voice handler)
- `functions/src/bot/lib/config.ts` (add `OPENAI_API_KEY` secret)

### Flow
1. Webhook receives inbound `type: "audio"`.
2. Classify returns `{kind: "audio", mediaId, mimeType, from, messageId}`.
3. `handlers/voice.ts`:
   a. Allowlist + rate-limit check (reuse `handleInboundText` logic — refactor the prefix into a shared helper if cleaner).
   b. Download audio binary via the existing `whatsapp/media.ts` flow (Meta media URL → binary).
   c. Upload to OpenAI Whisper:
      ```
      POST https://api.openai.com/v1/audio/transcriptions
      Authorization: Bearer ${OPENAI_API_KEY}
      multipart/form-data:
        file=@<audio.ogg>
        model=whisper-1
        language=<es|en or auto>
      ```
   d. Receive `{ text: "..." }`.
   e. Call `handleInboundText` with the transcribed text — this routes through Claude exactly as a typed message would.
   f. Audit log entry includes both the audio's Cloudinary URL (per existing media flow) and the transcribed text, with `type: "audio"`.

### Contract for `services/transcription.ts`
```ts
export interface TranscribeArgs {
  audioBuffer: Buffer;
  mimeType: string;     // e.g. "audio/ogg; codecs=opus"
  language?: Language;  // hint, optional
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

Use the standard `fetch` API with `FormData` (no need to pull in the OpenAI SDK — it's a one-endpoint integration). Reject audio > 25 MB (Whisper's limit).

### Voice-message edge cases
- **Empty transcription** ("the user breathed near the mic"): reply with Thora's in-character "no te he pillado, repítemelo escrito? 🐾".
- **Transcription takes >10 s**: Meta's webhook ack budget is already protected by the early-ack pattern in `webhook/handler.ts`. No additional work.
- **Non-Spanish/English audio**: Whisper auto-detects; the downstream Claude turn will see foreign text and Thora will redirect per spec ("Off-topic redirect").

### Acceptance
- Unit test for `transcribe` with a recorded fixture audio file.
- Integration test: send a 5-second ES voice note, assert Thora replies with a sensible answer to the spoken content.
- Update `bot/specs/07-knowledge-base.md` KQ5 status: "Implemented 2026-05-26 — voice notes transcribed via Whisper."

---

## Imp-10 — Aggressive keep-warm + pre-event warm-up

### Goal
Two scheduled functions:

1. **`keepKbWarm`** — runs every 60 s during the active window (May 23 → June 5). Sends a 1-token Claude call with the full system prompt to refresh the 1h ephemeral cache.
2. **`preEventWarmup`** — runs at fixed offsets before each event start. Forces a fresh KB build, runs a full warmup call, ensures the Cloud Functions instance pool is hot.

### New files
- `functions/src/bot/scheduled/keepKbWarm.ts`
- `functions/src/bot/scheduled/preEventWarmup.ts`

### Touched file
- `functions/src/bot/index.ts` (export the new functions)

### `keepKbWarm` contract
```ts
export const keepKbWarm = onSchedule(
  {
    region: BOT_REGION,
    schedule: "* * * * *",       // every minute
    timeZone: WEDDING_TIMEZONE,
    secrets: [ANTHROPIC_API_KEY],
    memory: "512MiB",
    timeoutSeconds: 30,
  },
  async () => {
    // Bound to the active window.
    const now = new Date();
    const start = new Date("2026-05-23T00:00:00+02:00");
    const end   = new Date("2026-06-05T23:59:59+02:00");
    if (now < start || now > end) return;

    const kb = await getKb();
    const system = buildSystem({ kbBlock: kb.text });
    const apiKey = ANTHROPIC_API_KEY.value();

    await new Anthropic({ apiKey }).messages.create({
      model: CLAUDE_SONNET_MODEL,
      max_tokens: 1,             // minimum cost
      system,
      messages: [{ role: "user", content: "ping" }],
    });

    logger.info("bot.keepwarm.ok", { kbVersion: kb.version });
  }
);
```

### `preEventWarmup` contract
Triggers at `T-60 min` before each event start. Hardcode the event start times for the wedding (extract from `bot/data/events.yaml` at build time, or hardcode for safety — the wedding's schedule is frozen).

```ts
const EVENT_WARMUP_TIMES = [
  // Friday welcome dinner
  "2026-05-29T19:30:00+02:00",
  // Saturday ceremony
  "2026-05-30T17:00:00+02:00",
  // Sunday brunch
  "2026-05-31T11:00:00+02:00",
  // Sunday album reveal
  "2026-05-31T19:00:00+02:00",
];

export const preEventWarmup = onSchedule(
  {
    region: BOT_REGION,
    schedule: "0,30 * * * *",   // every 30 min (we'll filter to exact T-60 hits)
    ...
  },
  async () => {
    const now = Date.now();
    const targets = EVENT_WARMUP_TIMES.filter((t) => {
      const dt = new Date(t).getTime() - now;
      return dt > 0 && dt < 60 * 60 * 1000;       // event within next hour
    });
    if (targets.length === 0) return;

    invalidateKbCache();                          // force fresh KB build
    const kb = await getKb();
    const system = buildSystem({ kbBlock: kb.text });

    // Three back-to-back pings to ensure all warm instances cache-hit.
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
    for (let i = 0; i < 3; i++) {
      await client.messages.create({
        model: CLAUDE_SONNET_MODEL,
        max_tokens: 1,
        system,
        messages: [{ role: "user", content: "ping" }],
      });
    }

    logger.info("bot.preeventwarmup.ok", {
      kbVersion: kb.version,
      targets: targets.length,
    });
  }
);
```

### Acceptance
- After deploy (Op-7), check Cloud Scheduler — both jobs enabled.
- Within 2 minutes of deploy, `bot.keepwarm.ok` logs appear at 60 s intervals.
- 60 min before any test event time, `bot.preeventwarmup.ok` fires three times in quick succession.
- Net cache hit rate during the event window stays > 95 %.

---

## Imp-11 — Sentry initialization + handler-level capture

### Goal
Wire Sentry into the bot's Cloud Functions so unhandled exceptions surface with stack traces, release tags, and request IDs.

### Blocker
**Op-4 must land first**: secret `SENTRY_DSN` must be set.

### New file
`functions/src/lib/sentry.ts`:

```ts
import * as Sentry from "@sentry/node";

let initialized = false;

export function ensureSentry(dsn: string, release?: string): void {
  if (initialized) return;
  Sentry.init({
    dsn,
    environment: process.env.GCP_PROJECT?.includes("staging") ? "staging" : "prod",
    release: release ?? process.env.K_REVISION,
    tracesSampleRate: 0,         // no tracing in this codebase
    sendDefaultPii: false,       // PII (phones, names) explicitly excluded
  });
  initialized = true;
}

export function captureWithContext(
  err: unknown,
  context: { requestId: string; phone?: string; kind?: string }
): void {
  Sentry.withScope((scope) => {
    scope.setTag("requestId", context.requestId);
    if (context.kind) scope.setTag("kind", context.kind);
    if (context.phone) scope.setUser({ id: context.phone.slice(-4) }); // last 4 only
    Sentry.captureException(err);
  });
}
```

### Touched files
- `functions/src/bot/lib/config.ts` — add `SENTRY_DSN` secret declaration + include in `WEBHOOK_SECRETS`.
- `functions/src/bot/webhook/handler.ts` — call `ensureSentry(SENTRY_DSN.value())` at the top of `handlePost`. In every `catch` block, call `captureWithContext(err, {requestId, ...})`.
- `functions/src/bot/handlers/conversation.ts` — same pattern in the existing `catch` blocks (lines 218–236 and 367–371).

### Privacy constraint (matches spec § 9)
Never send raw `text` or `phone` to Sentry. The implementer's instinct will be to set `user.username = phone` — **do not**. Use only `phone.slice(-4)` as a stable-enough hash for grouping.

### Acceptance
- Trigger a synthetic error in staging (e.g., temporarily throw in `runTurn`). Confirm:
  - Sentry receives the event with correct `release` tag.
  - `requestId` tag visible.
  - No PII in the payload (verify in Sentry's "Raw" view).

---

## Imp-12 — Cloud Functions compute config bump

### Goal
Update the `onRequest` and `onSchedule` configs to allocate always-on min instances, higher memory/CPU, and explicit concurrency.

### Target files
- `functions/src/bot/webhook/handler.ts:40–49`
- `functions/src/bot/lib/config.ts` (add config constants)

### Diff for webhook/handler.ts
```ts
export const whatsappWebhook = onRequest(
  {
    region: BOT_REGION,
    secrets: WEBHOOK_SECRETS,
    memory: "4GiB",
    cpu: 2,
    concurrency: 40,
    timeoutSeconds: 60,
    minInstances: 5,
    maxInstances: 50,
    invoker: "public",
  },
  async (req, res) => { ... }
);
```

### Why each value
- **4 GiB / cpu 2**: Cloud Functions Gen2 ties CPU to memory; 4 GiB gives 2 vCPU. Faster JS init + better headroom for parallel tool execution (Imp-1).
- **concurrency: 40**: half the default (80) — explicit because Claude calls block on I/O for 2–4 s; we want a known ceiling that matches the Anthropic rate-limit headroom (Op-2).
- **minInstances: 5**: eliminates cold starts across the entire 14-day window. Operator deploys this (Op-6).
- **maxInstances: 50**: unchanged, plenty of room.

### Other scheduled functions
Lower memory (`512MiB`, `cpu: 1`) is sufficient — they're not on the user-facing latency path. Don't waste budget there.

### Acceptance
- Operator's Op-6 verification step confirms the deployed function reports the new config.
- A test inbound after ≥1 hour of zero traffic still responds in <2 s (no cold start).

---

## Imp-13 — Backup-SIM hot-swap helper (optional)

### Goal
Provide a one-command runbook script that swaps `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` to the backup values and redeploys. Reduces the operator's incident response time from ~15 min to ~3 min.

### Blocker
Op-3 must have completed — the operator must have captured the backup SIM's `PHONE_NUMBER_ID` and `ACCESS_TOKEN`.

### Approach (low-cost)
A documented `bot/docs/backup-sim-runbook.md` is sufficient. A script is nice-to-have but not required — and the operator should NOT execute a script during an incident without reading the diff.

If the operator does want the script:
- `bot/scripts/swap-to-backup-sim.mjs` — prompts for the two backup secrets, calls `firebase functions:secrets:set` twice, then `firebase deploy --only functions:whatsappWebhook`.

### Acceptance
- Runbook exists and is verified by a dry-run on staging (the operator does this once before the event).

---

## Things explicitly NOT in scope

These were considered in the latency investigation and are deferred:

- **Claude streaming** — Priority Tier + 1h cache make this lower-impact; complexity not worth it for 14 days.
- **Cached rendered KB in Firestore** — `minInstances: 5` eliminates cold starts, so the optimization has nowhere to apply.
- **Memorystore (Redis)** — explicitly dropped per operator decision (96 guests don't justify it).
- **Multi-region failover** — explicitly dropped per operator decision.
- **Cloudinary Plus** — kept on free tier.
- **Better Uptime / paid Sentry** — Sentry free + Cloud Monitoring is sufficient.

---

## Pre-deploy checklist (T-1, 2026-05-28)

Before the operator runs final deploy + freeze:

- [ ] All 13 implementer tasks (or the subset agreed) merged to `main`.
- [ ] `npm test` clean in `functions/`.
- [ ] `npm run lint` clean.
- [ ] Joint load test (Op-8) passed — zero unhandled exceptions, p95 < 8 s.
- [ ] Adversarial pass (Op-8) — zero leaks of menu/seating/dossier/honeymoon.
- [ ] All new secrets confirmed set in Firebase secrets manager:
  - `ANTHROPIC_API_KEY` (existing)
  - `OPENAI_API_KEY` (new — Op-5)
  - `SENTRY_DSN` (new — Op-4)
  - `WHATSAPP_*` secrets unchanged
- [ ] Cache hit rate ≥ 95 % observed for ≥ 1 hour on staging after warm-up runs.
- [ ] Sentry receiving events from staging.
- [ ] Sentry alert rules tested end-to-end (synthetic error → notification on operator's phone).

After the freeze, only Imp-13's runbook execution is permitted during the event.

---

## Logging conventions for this work

Every new code path uses the existing structured-log convention:

```ts
logger.info("bot.<area>.<event>", {
  requestId,
  ...domainFields,
});
```

New events introduced by this plan:

- `bot.conversation.typing_indicator_sent` (Imp-2)
- `bot.conversation.fast_language_hit` / `bot.conversation.fast_language_miss` (Imp-6)
- `bot.keepwarm.ok` / `bot.keepwarm.failed` (Imp-10)
- `bot.preeventwarmup.ok` / `bot.preeventwarmup.failed` (Imp-10)
- `bot.transcription.ok` / `bot.transcription.failed` (Imp-9)
- `bot.sentry.initialized` (Imp-11, once per cold start)

These feed both Cloud Logging and the Bot Health dashboard (web/src/app/admin/bot/health) — when the implementer adds them, also bump any dashboard query that aggregates by event name.
