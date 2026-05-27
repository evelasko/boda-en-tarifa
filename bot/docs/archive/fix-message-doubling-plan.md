# Fix plan — Thora repeats prior-turn content (message-array doubling)

> **Status**: open bug, observed in production on 2026-05-23.
> **Severity**: high. Wedding is **2026-05-29 → 31** (6 days out). Repetition makes Thora look broken and inflates outbound message volume against the Cloud API throughput cap.
> **Scope**: server-side only — three files touched, no spec changes, no UI changes.
> **Owner**: implementer (this plan).
> **Reviewer**: Enrique (operator).

---

## 1. Symptom (what the operator saw)

Henry's chat, in order:

| # | Henry | Thora |
|---|---|---|
| 1 | "Donde aparco en la ceremonia?" | Parking info + asks if to send location. ✓ |
| 2 | "Mándame la ubicación del parking de 100% Fun por favor" | Sends location + bus-time reminder. ✓ |
| 3 | "Hola thora! A qué hora es la pre boda el próximo viernes?" | **Re-confirms the parking location ("📍 ¡Ubicación enviada! …")** + answers pre-wedding. ✗ |
| 4 | (voice) "puedo cenar en Casa Explora?" | **Re-confirms parking location + re-states pre-wedding info** + answers dinner question. Three topics jammed into one reply. ✗ |

Each later reply re-states things Thora already said in earlier turns. Behavior matches the failure mode of "Claude is being shown the same user message twice with no assistant turn in between," not the failure mode of "system prompt tells Thora to remind users of X."

The system prompt at `functions/src/bot/claude/system-prompt.ts` is clean — no "always remind", no reminder queue, no follow-up backlog. This is purely an artifact of malformed message arrays sent to the Anthropic API.

---

## 2. Root cause (verified by reading the code)

### 2a. Primary cause — the current turn is sent to Claude twice

**Where**: `functions/src/bot/handlers/conversation.ts:190` and `functions/src/bot/claude/pipeline.ts:210-229`.

The sequence on every inbound text turn:

1. `handleInboundText` **awaits** `appendMessage({direction: "inbound", text, ...})` at line 190 — the just-arrived user message is now persisted in Firestore.
2. `handleInboundText` calls `runConversationalTurn(...)` at line 200.
3. `runConversationalTurn` calls `loadHistory(phone)` at line 264.
4. `loadHistory` → `services/audit.ts:147` `getRecentMessages(phone, limit=8)` → fetches the most-recent 16 messages, filters empty text, returns chronologically. The just-written inbound is the **last entry** of this array.
5. `runTurn` → `pipeline.ts:210-229` `buildInitialMessages`:
   ```ts
   for (const turn of input.history) messages.push({role: turn.role, content: turn.text});  // history already contains current inbound
   ...
   const compositeUserContent = `${input.perTurnHeader}\n\n[Current message]\nUSER: ${input.currentText}`;
   messages.push({role: "user", content: compositeUserContent});  // appends it AGAIN
   ```

Result: Claude receives `[..., a_prev, u_current, u_current_again_with_header]` — two consecutive `user` turns. Models trained on multi-turn dialog treat the second of two trailing user messages as a follow-up that may still need to address the first, especially when the second carries new framing (the per-turn header). The model's compromise is to address both — re-summarizing prior context while answering the new question.

The pipeline's contract was clearly designed assuming `input.history` does **not** contain the current turn. The comment at `pipeline.ts:219-223` argues for keeping the per-turn header alongside "the user's actual message body" — implying the author thought the body was being supplied only once, via `currentText`. The caller violates that assumption.

### 2b. Aggravating cause — assistant turns are fire-and-forget

**Where**: `functions/src/bot/handlers/conversation.ts:407` (`void appendMessage({direction: "outbound", ...})`).

Phase C3 (shipped 2026-05-22, see `bot/docs/phase-c-implementer-prompt.md` §C3) made the outbound audit write fire-and-forget to save latency. The comment at `:402-406` documents this and notes "the 'inbound logged before outbound' invariant still holds when the background write lands."

It does — but there's a separate invariant the change broke: **the assistant turn must be in Firestore before the next inbound from the same phone reads history**. When a user sends messages in quick succession (or when the outbound write is slow), the Firestore transaction backing the outbound `appendMessage` may not have committed by the time the next inbound's `loadHistory` runs. The next turn then sees history like `[u1, a1, u2, u3]` with `a2` missing entirely.

Combined with §2a, this compounds: history becomes `[u1, a1, u2, u3]`, then pipeline doubles u3 → `[u1, a1, u2, u3, u3]` — three unanswered user turns, no acknowledgment of u2, and the model summarizes everything to be safe.

### 2c. Same defect in the voice path

`functions/src/bot/handlers/voice.ts:266` awaits the inbound audit row, then calls `runConversationalTurn` at line 279 — same code path, same bug. Fixing the pipeline-level assembly covers both inbound shapes (text + transcribed voice) in one change.

---

## 3. Fix strategy

Two changes, both small and reversible. **Fix 3a is primary** — it eliminates the doubling outright. **Fix 3b is the belt-and-suspenders** — it restores conversational coherence in the race-condition case.

### 3a. Filter the current turn out of the history sent to Claude

**Primary fix.** Keep `loadHistory` returning chronological messages including the current inbound (don't change Firestore queries), but in `pipeline.ts buildInitialMessages`, drop the trailing history entry when it is a `user` turn whose text equals `input.currentText`. Cheap, localized, defends against any future caller making the same mistake.

**File**: `functions/src/bot/claude/pipeline.ts:210-229`.

Replacement for `buildInitialMessages`:

```ts
function buildInitialMessages(
  input: PipelineInput
): Anthropic.Messages.MessageParam[] {
  const messages: Anthropic.Messages.MessageParam[] = [];

  // The current inbound is persisted to the audit log BEFORE this turn
  // runs (see `handlers/conversation.ts:190` and `handlers/voice.ts:266`),
  // so `input.history` typically contains it as its last entry. Drop it
  // here so we don't duplicate the current user message — the composite
  // user content below is the canonical carrier for the current turn.
  const trimmedHistory = input.history.slice();
  const last = trimmedHistory[trimmedHistory.length - 1];
  if (last && last.role === "user" && last.text === input.currentText) {
    trimmedHistory.pop();
  }

  for (const turn of trimmedHistory) {
    messages.push({role: turn.role, content: turn.text});
  }

  // The current turn carries both the per-turn header (guest profile +
  // dynamic KB block) and the user's actual message body. Keeping them
  // in the same message — rather than splitting the header into the
  // system prompt — means the header is uncached, which is correct: it
  // changes per-turn.
  const compositeUserContent =
    `${input.perTurnHeader}\n\n[Current message]\nUSER: ${input.currentText}`;
  messages.push({role: "user", content: compositeUserContent});

  return messages;
}
```

**Why match on text and not message-id**: `HistoryTurn` (`conversation/state.ts:18-22`) doesn't carry `metaMessageId`; threading a new field through `getRecentMessages` → `loadHistory` → `HistoryTurn` is more surface area than the fix needs. Text equality is sufficient: two distinct user messages with identical text in the same window are vanishingly rare for natural-language input, and even if it happened, dropping the duplicate is the right behavior (the composite user content carries the same text).

**Defensive note**: the check is intentionally last-entry only — if for any reason `loadHistory` returns history that does NOT include the current inbound (e.g., a future refactor changes the order), `buildInitialMessages` still works correctly because the pop is a no-op.

### 3b. Await the outbound audit write

**Belt-and-suspenders fix.** Revert the C3 fire-and-forget on the outbound `appendMessage` so the assistant turn is guaranteed to be in Firestore before the function returns. The user-perceived latency does not change (the WhatsApp send already happened); only the Cloud Function billed-time changes by the duration of one Firestore transaction (~50–150 ms).

**File**: `functions/src/bot/handlers/conversation.ts:386-431`.

Replacement for the outbound audit block inside `sendAndLogOutbound`:

```ts
  // Outbound audit write. Originally fire-and-forget (Phase C3) for the
  // ~100ms latency win, reverted 2026-05-23 because the race window
  // between this write and the next inbound's `loadHistory` was letting
  // assistant turns silently drop out of the context sent to Claude —
  // which made Thora repeat herself across turns. The send already
  // happened above, so the user-perceived latency is unaffected; only
  // the Cloud Function's billed wall-clock grows by one Firestore
  // transaction.
  try {
    await appendMessage({
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
      claudeModel: args.pipeline ? auditModelTag(args.pipeline.model) : undefined,
      claudeUsage: args.pipeline?.usage,
    });
  } catch (err) {
    captureWithContext(err, {
      requestId: args.input.requestId,
      phone: args.input.phone,
      kind: "conversation.outbound_audit",
    });
    logger.error("bot.conversation.outbound_audit_failed", {
      requestId: args.input.requestId,
      err: err instanceof Error ? err.message : String(err),
    });
  }
```

**Tradeoff**: this reverses a deliberate Phase C decision. The latency win was real but small (tens of ms on a 2–5 s end-to-end conversational turn — the dominant cost is the Anthropic round trip, not the Firestore write). Conversational coherence is wedding-critical and was the regression that C3 unintentionally introduced. The revert is the right call.

If a future profile shows the Firestore write is materially slow, the right remedy is to make the write faster (batch + index review), not to fan it out off the request path.

### 3c. What we are NOT changing (and why)

- **`handlers/conversation.ts:190` inbound `await appendMessage`** stays as-is. Moving the inbound write to after Claude would break the "inbound row exists even if Claude bails" guarantee that admins rely on (see comment at `:188-189`). Fix 3a removes the need to touch this.
- **`services/audit.ts getRecentMessages`** stays as-is. The function correctly returns the most recent N messages chronologically; the bug is in the caller's assembly, not the query.
- **`conversation/state.ts loadHistory`** stays as-is. No new parameter, no excludeMessageId threading — fix 3a localizes the concern to the pipeline.
- **System prompt (`claude/system-prompt.ts`)** stays as-is. It's already correct ("concise, ≤3 short paragraphs"); the repetition was structural, not promptable.
- **`handlers/voice.ts`** stays as-is. The pipeline-level fix in 3a covers the voice path too.
- **`handlers/media.ts`** is not in scope. It doesn't call `runConversationalTurn` today (verified: it appends an inbound row but does not invoke Claude through this code path). If a future change wires Claude through media, fix 3a will already protect it.

---

## 4. Test plan

### 4a. Add a unit test for `buildInitialMessages`

`functions/test/bot/pipeline.test.cjs` exists already (Phase C1 added it). Extend it — same `.cjs` style, same Anthropic SDK mock pattern — with assertions for the message-array shape `runTurn` sends to the SDK:

1. **Doubling test**: history `[{role: "user", text: "hola"}, {role: "assistant", text: "hi"}, {role: "user", text: "where to park?"}]`, `currentText: "where to park?"`. After `runTurn`, inspect the `messages.create` mock call's first arg's `messages` array. Assert:
   - Length is exactly 3 (not 4): `[u1, a1, u_current_with_header]` — the duplicate `u_current` from history is gone.
   - Last entry's content starts with `[Per-guest header]` or whatever the per-turn header begins with — i.e., it's the composite, not the raw history entry.

2. **No-doubling-when-history-clean test**: history `[{role: "user", text: "hola"}, {role: "assistant", text: "hi"}]` (no current inbound in history — defensive scenario), `currentText: "where to park?"`. Assert the messages array length is 3 and the last is the composite. The trim is a no-op; behavior unchanged.

3. **Empty-history test**: history `[]`, `currentText: "hola"`. Assert the messages array length is 1 (just the composite).

4. **Identical-text-mid-history test** (edge case): history `[{role: "user", text: "ok"}, {role: "assistant", text: "..."}, {role: "user", text: "ok"}]`, `currentText: "ok"`. Assert length 3 — the trim only removes the trailing user turn whose text equals `currentText`, not earlier matches.

Run `cd functions && npm test` after the change. All 38 existing tests must stay green.

### 4b. Manual smoke (operator does this on staging after deploy)

Send the exact Henry sequence (or similar) from a personal WhatsApp into the staging number:

1. "¿Dónde aparco?" → expect parking info.
2. "Envíame la ubicación." → expect location + bus reminder.
3. "¿A qué hora es la pre-boda?" → **expect pre-boda info only.** No re-mention of parking unless contextually warranted.
4. Voice note "¿puedo cenar en Casa Explora?" → **expect dinner answer only.** No re-mention of parking or pre-boda.

Pass criterion: Thora's reply to turn 3 contains no parking/location language; reply to turn 4 mentions only Casa Explora dinner. If either reply mixes prior topics, the fix did not land.

### 4c. Lint + build

From `functions/`:

```bash
npm run build && npm run lint && npm test
```

All three must be clean. No new lint warnings (the bot tree is zero-warning gated per `phase-c-implementer-prompt.md` §Lint discipline).

---

## 5. Acceptance criteria

- `functions/src/bot/claude/pipeline.ts buildInitialMessages` strips the trailing `user` history entry when its text equals `currentText`. Comment at the top of the function explains why.
- `functions/src/bot/handlers/conversation.ts sendAndLogOutbound` awaits the outbound `appendMessage` inside a try/catch. Comment explains the revert from C3 and references this plan.
- New unit tests in `functions/test/bot/pipeline.test.cjs` cover the four scenarios in §4a, all passing.
- `npm run build`, `npm run lint`, `npm test` all clean in `functions/`.
- No changes to specs, no changes to UI, no new Cloud Functions, no new secrets.

---

## 6. Risks and rollback

### Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Outbound audit latency adds enough wall-clock to push p99 over the 10s Cloud Functions soft cap | Low | Firestore writes are ~50–150 ms. The Anthropic round trip is the dominant cost (2–5 s). One extra await is well within budget. |
| Edge case where two distinct messages share identical text and we drop the wrong one | Vanishingly low | Even if it triggers, the composite user content carries the same text — Claude sees the message once instead of twice. No information loss. |
| The fire-and-forget revert masks a latent slow-Firestore issue that was previously invisible | Low | If `appendMessage` becomes the bottleneck post-revert, Sentry + structured logs will surface it (Phase C5 instrumentation is in place). Address as a separate ticket. |
| The pipeline change interacts with the tool-use loop in an unforeseen way | Low | `buildInitialMessages` only assembles the *initial* `messages` array. The tool-loop body (`pipeline.ts:117-192`) appends to `messages` and is untouched. The fix is purely additive in front. |

### Rollback

Both changes are localized to two files. Revert the two commits to restore prior behavior:

```bash
git revert <pipeline-fix-sha> <audit-revert-sha>
```

The doubling will return, but no new failure mode is introduced.

---

## 7. Sequencing

Single commit per fix, deployed together. Estimated total effort: **30–60 minutes** of focused work including the unit tests.

1. Pipeline fix (§3a) + unit tests (§4a) → commit.
2. Outbound audit revert (§3b) → commit.
3. `npm run build && npm run lint && npm test` → clean.
4. Hand back to operator for staging deploy + manual smoke (§4b).
5. Production deploy after smoke passes.

The wedding deploy freeze is **2026-05-28**. This fix lands well before that. There is no operator pre-step blocking either change.

---

## 9. References

- `functions/src/bot/handlers/conversation.ts:190, 264, 407` — inbound await, history load, outbound fire-and-forget
- `functions/src/bot/handlers/voice.ts:266` — voice-path inbound await (same shape, covered transitively)
- `functions/src/bot/claude/pipeline.ts:210-229` — `buildInitialMessages` (primary fix site)
- `functions/src/bot/conversation/state.ts:29-39` — `loadHistory` (unchanged)
- `functions/src/bot/services/audit.ts:147-167` — `getRecentMessages` (unchanged)
- `functions/test/bot/pipeline.test.cjs` — Phase C1 test pattern to mirror
- `bot/docs/phase-c-implementer-prompt.md` §C3 — original fire-and-forget decision being reverted
- `bot/docs/launch-readiness-plan.md` — deploy freeze and wedding dates context
