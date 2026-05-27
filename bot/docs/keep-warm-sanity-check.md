# Keep-Warm + Pre-Event Warmup — Sanity Check Guide

> Operator runbook for verifying `botKeepKbWarm` and `botPreEventWarmup` after deploy. Companion to `event-optimization-operator-plan.md` §Op-7.
>
> **Project**: `boda-en-tarifa` · **Region**: `europe-west1` · **Active window**: 2026-05-23 → 2026-06-05

---

## 1. Scheduler is registered and enabled (1 min)

In **GCP Console → Cloud Scheduler** (project `boda-en-tarifa`, region `europe-west1`), confirm two jobs:

| Job | Schedule | Next run |
|---|---|---|
| `firebase-schedule-botKeepKbWarm-europe-west1` | `* * * * *` (every minute) | within next 60s |
| `firebase-schedule-botPreEventWarmup-europe-west1` | `0,30 * * * *` (twice/hour) | next :00 or :30 |

Both must show **State: Enabled** and **Last result: (empty)** or **OK**.

Or from the CLI:
```bash
gcloud scheduler jobs list --location=europe-west1 --project=boda-en-tarifa | grep -E "botKeepKbWarm|botPreEventWarmup"
```

---

## 2. Keep-warm first successful ping (2 min)

Tail the logs:
```bash
gcloud functions logs read botKeepKbWarm \
  --region=europe-west1 --project=boda-en-tarifa \
  --gen2 --limit=10
```

Within **2 minutes** you should see one or more entries with the message:
```
bot.keepwarm.ok
```
…and a JSON payload containing `kbVersion`, `cacheReadTokens`, `cacheCreateTokens`, `inputTokens`, `outputTokens`.

**Expectations on the very first run after deploy:**
- `cacheCreateTokens` > 0  (big number — writing the cache for the first time)
- `cacheReadTokens` = 0  (nothing to read yet)
- `inputTokens` is small (just the "ping" message)
- `outputTokens` = 1

This is normal. The cache is being written.

---

## 3. Cache hit progression (5–15 min)

Keep watching. By the **second** tick and onward, the numbers should flip:

| Tick | `cacheCreateTokens` | `cacheReadTokens` |
|---|---|---|
| 1 (first run) | high (e.g. ~15–25k) | 0 |
| 2 (next minute) | 0 | high (≈ same as #1's create) |
| 3–60 | mostly 0 | high, steady |
| Every ~60 min | high again (TTL refresh) | brief dip |

**Pass criteria for Op-7 §Verification:**
> *"Cache hit rate climbs to >95% within an hour of deployment."*

Translation: `cacheReadTokens / (cacheReadTokens + cacheCreateTokens + inputTokens)` averaged across ~60 keep-warm runs should be **>0.95**.

Quick approximation: out of the next 60 minutes of `bot.keepwarm.ok` logs, you'd expect **≤2 entries** with `cacheCreateTokens > 0` (the initial write + one ~1h TTL refresh). If you see cache-creates every few minutes, something is busting the cache between runs.

---

## 4. End-to-end with a live inbound (optional, 3 min)

The real signal of operator value is that **guest turns** see cache hits — not just keep-warm pings.

Send one inbound from your test phone, then:
```bash
gcloud functions logs read whatsappWebhook \
  --region=europe-west1 --project=boda-en-tarifa \
  --gen2 --limit=30 | grep -E "bot\.claude\.pipeline"
```

In the pipeline log entry, look for `cachedReadTokens` (or `cache_read_input_tokens` depending on the log shape). It should be **close to the total input tokens** — i.e. the system prompt was served from cache, not re-billed.

If `cachedReadTokens = 0` on a live turn while keep-warm shows hits, the most common cause is **the live turn hit a cold Cloud Function instance** that the keep-warm pings haven't reached. With `minInstances: 5` this should be rare; if you see it more than once, that's a finding worth raising before the load test.

---

## 5. Pre-event warmup (no-fire is the correct behavior today)

`botPreEventWarmup` only logs when an event start is within the next 60 min. The hardcoded targets in `functions/src/bot/scheduled/pre-event-warmup.ts:54-59` are:

- Fri 2026-05-29 19:30 — welcome dinner
- Sat 2026-05-30 17:00 — ceremony
- Sun 2026-05-31 11:00 — brunch
- Sun 2026-05-31 19:00 — album reveal

**So before Friday it will silently no-op every 30 minutes — that is expected and correct.** Don't go looking for `bot.preeventwarmup.ok` logs yet; the first ones will land **Friday at 18:30 Europe/Madrid**.

Two things you *can* verify in the meantime:

1. **Scheduler is firing the function**: in Cloud Scheduler, confirm the `botPreEventWarmup` job's "Last result" updates to **OK** at the next :00 or :30 mark. (The function runs and returns without logging — that's a clean exit.)
2. **Optional manual dry-run**: in GCP Console → Cloud Scheduler → `botPreEventWarmup` → **Force a run**. Then check Cloud Logging — you should see no error and no `bot.preeventwarmup.*` log line, just a clean function execution. If you want to actually see `bot.preeventwarmup.ok` fire today, you'd need to temporarily edit `EVENT_WARMUP_TARGETS_MS` to include `Date.now() + 30*60*1000` and redeploy — **not recommended this close to the freeze.**

---

## 6. Failure-mode cheatsheet

| Symptom | Likely cause | Fix |
|---|---|---|
| `bot.keepwarm.disabled` in logs | `config/bot.keep_warm_enabled` is `false` | Firestore: `config/bot` → set `keep_warm_enabled: true` |
| `bot.keepwarm.failed` with `401` or auth error | `ANTHROPIC_API_KEY` secret missing or stale on this function | `firebase functions:secrets:access ANTHROPIC_API_KEY`; redeploy |
| No `bot.keepwarm.*` logs at all after 3 min | Scheduler job not enabled, or function not actually deployed | Check step 1; redeploy if missing |
| `cacheCreateTokens > 0` on every tick | KB is changing every minute (likely `bot_kb_version` bumping) → cache busting | Check `config/bot_kb_extras` and any YAML edits since deploy |
| Cache hits in keep-warm but not on live turns | Cold-start hitting an instance keep-warm hasn't touched yet | Confirm `minInstances: 5` on `whatsappWebhook`; consider a few extra keep-warm pings |

---

## Sign-off criterion

Op-7 is verified when, **after the deploy has been live for ≥60 minutes**:

- [ ] `gcloud functions logs read botKeepKbWarm` shows ≥50 `bot.keepwarm.ok` entries in the last hour
- [ ] Of those, ≤2 have `cacheCreateTokens > 0`
- [ ] One live test turn through `whatsappWebhook` shows `cachedReadTokens` ≈ total input tokens
- [ ] `botPreEventWarmup` scheduler "Last result" = OK on the most recent :00 or :30 tick
