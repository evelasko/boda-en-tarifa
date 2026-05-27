# Op-8 Runbook — Joint Load + Adversarial Test

> Step-by-step orchestration for the Op-8 session described in `event-optimization-operator-plan.md` §Op-8. Designed to run end-to-end in about **90 minutes** with two humans (Operator A + Operator B).
>
> **Date target**: T-2 in the event-optimization timeline (originally 2026-05-27; today if you're running early).
> **Goal**: concurrency-bug hunt + persona/leak hardening before the T-1 (2026-05-28) deploy freeze.

---

## Pre-flight (15 min) — solo operator

Do this **before** Operator B arrives.

### 0.1 Confirm the prep artifacts exist

```bash
ls -la bot/scripts/op8-*.mjs bot/docs/op8-*.md bot/docs/adversarial-findings.md
```

Expect 6 files: 3 scripts, 3 docs.

### 0.2 Confirm Op-7 (keep-warm) is still green

```bash
gcloud functions logs read botKeepKbWarm \
  --region=europe-west1 --project=boda-en-tarifa --gen2 --limit=5
```

The five most recent entries should all say `bot.keepwarm.ok` with non-zero `cacheReadTokens`. If they don't, do NOT proceed — fix Op-7 first (see `keep-warm-sanity-check.md`).

### 0.3 Capture the webhook URL + WhatsApp App Secret

```bash
firebase functions:list --project boda-en-tarifa | grep whatsappWebhook
# Note the URL — usually:
# https://europe-west1-boda-en-tarifa.cloudfunctions.net/whatsappWebhook

# Pull the secret into your shell for the next step:
export WHATSAPP_APP_SECRET=$(firebase functions:secrets:access WHATSAPP_APP_SECRET --project boda-en-tarifa)
echo "secret length: ${#WHATSAPP_APP_SECRET}"  # should be > 16
```

### 0.4 Set up Firestore admin credentials

```bash
# Either point at a service-account JSON:
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json

# OR rely on bot/.env containing FIREBASE_SERVICE_ACCOUNT_PATH=…
# Verify with a dry run:
node bot/scripts/op8-seed-test-phones.mjs --dry-run
```

Expect a table of 15 synthetic guests printed. No write happens on `--dry-run`.

### 0.5 Open three windows side-by-side

- **W1 — Harness driver**: your shell, ready to run the load harness.
- **W2 — Log tail**: a second shell tailing `gcloud functions logs read whatsappWebhook --gen2 --follow`.
- **W3 — Browser**: Firebase Console (Firestore) + Sentry, both in tabs.

You now have the cockpit. Wait for Operator B before continuing.

---

## Phase 1 — Seed the synthetic allowlist (2 min)

In **W1**:

```bash
node bot/scripts/op8-seed-test-phones.mjs
```

Expect output:
```
Op-8 seed — 15 synthetic test guests (WRITE)
…
✓ Seeded 15 guests with op8TestRun=true.
```

In **W3** Firebase Console → Firestore → `guests`, sort by document id, scroll to `op8-test-01` through `op8-test-15`. Confirm `phoneE164` and `botEnrolled: true` are set.

---

## Phase 2 — Load harness, dry-run (3 min)

Always do a 2-guest / 1-minute dry-run first to catch wiring problems cheaply before committing to the 10-minute real run.

In **W1**:

```bash
node bot/scripts/op8-load-harness.mjs --concurrency 2 --duration-min 1
```

Expect ~4 successful requests over ~60s, p50 < 3000 ms.

**If you see**:
- `401` / `Invalid signature` → `WHATSAPP_APP_SECRET` is wrong. Re-do step 0.3.
- `403` → webhook URL is wrong or the function is locked down. Re-check step 0.3.
- Network timeouts → check your internet, then check the function is actually running (`gcloud functions describe whatsappWebhook --region=europe-west1`).

Only proceed to Phase 3 if the dry-run is clean.

---

## Phase 3 — Load harness, real run (~12 min wall clock)

> Run-time budget: 10 min of harness + ~2 min of report generation and review.

### 3.1 Note the start time

In **W1**:

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"  # save this — it's T_START for op8-observability.md
```

### 3.2 Launch the harness

```bash
node bot/scripts/op8-load-harness.mjs
```

This fires 15 virtual guests × 1 turn / 30s × 10 minutes = ~300 turns.

### 3.3 During the run — watch W2 and W3

While the harness runs, in **W2** tail for errors:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="whatsappwebhook"
   AND severity>=ERROR' \
  --project=boda-en-tarifa --freshness=15m --format='value(timestamp,jsonPayload.message)'
```

Re-run this every ~2 min while the harness is firing. If anything appears, **don't panic** — capture it, finish the run, then triage.

In **W3** Sentry tab: refresh once per minute. Zero new issues = ✓.

### 3.4 After the harness completes — read the final report

The harness prints a pass/fail summary at the end. Note the numbers; they go into the dashboard at the bottom of this runbook.

### 3.5 Cross-check with Firestore

Follow `bot/docs/op8-observability.md` §2 and §3 — dedupe uniqueness and double-reply check. Both must be zero.

### 3.6 Fill in the dashboard

Open `bot/docs/op8-observability.md` §"Quick pass/fail dashboard" and fill the **Observed** column. If everything is green → **Op-8 §Load portion signed off**.

If anything is red:
- Capture the failing rows + log excerpts in `adversarial-findings.md` under "Load test findings"
- Ping the implementer
- Don't proceed to the adversarial portion until load is at least amber (no race conditions, latency may still be tuneable)

---

## Phase 4 — Adversarial sweep, scripted (5 min)

Fast pre-screen before the human-driven pass. Catches the easy stuff so the humans focus on creativity.

### 4.1 Run the sweep

In **W1**:

```bash
export ANTHROPIC_API_KEY=$(firebase functions:secrets:access ANTHROPIC_API_KEY --project boda-en-tarifa)
node bot/scripts/op8-adversarial-sweep.mjs
```

Expect ~30 prompts run sequentially, each taking 3–8 seconds. Total: ~3 min.

### 4.2 Review the markdown table

The sweep auto-appends a markdown table to `adversarial-findings.md` under `## Sweep run …`. Scroll through it. Each row marked `⚠ FLAGGED` is a prompt where a red-flag regex matched Thora's reply — but **regex matches can be false positives**, so a human reviews each.

For each flagged row:
- **True positive (Thora actually leaked / broke character)** → promote to a real entry in `## Open findings`, ping implementer.
- **False positive (regex matched but reply is fine)** → leave it in the sweep table, no action.

### 4.3 Sweep sign-off

When every flagged row has been triaged (either resolved or marked FP), the scripted sweep is done.

---

## Phase 5 — Human-driven adversarial pass (30 min — both operators)

Both operators on a video call, each on their own WhatsApp, working from `bot/docs/op8-adversarial-prompts.md`.

### 5.1 Split the sheet

- **Operator A** owns sections A1, A2, A3, A4.
- **Operator B** owns sections B1, B2, B3, B4, B5.

### 5.2 Fire prompts

Each operator reads their section top-to-bottom. **At least 10 seconds between prompts** so rate-limit doesn't kick in.

For each row:
- Send the prompt verbatim.
- Watch Thora's reply.
- Mark PASS / FAIL.
- Any FAIL → screenshot + add to `adversarial-findings.md` Open findings → call out in the video.

### 5.3 Swap and spot-check

After both finish their primary sections, swap — each operator picks 5 random prompts from the other's section and re-runs. Catches consistency drift.

### 5.4 5-minute creative free-form

Per `op8-adversarial-prompts.md` "Free-form 5-minute creative pass" — try whatever you want for 5 minutes.

### 5.5 Adversarial sign-off

When every checkbox at the bottom of `op8-adversarial-prompts.md` is ticked, adversarial is **GREEN**.

---

## Phase 6 — Teardown (2 min)

In **W1**:

```bash
# Preview what will be deleted:
node bot/scripts/op8-teardown-test-phones.mjs --dry-run

# Then actually delete:
node bot/scripts/op8-teardown-test-phones.mjs
```

Expected output: 15 guests deleted, ~300 audit messages deleted, some bot_rate buckets deleted. `bot_dedupe` entries are intentionally left in place — they expire via TTL and are useful for post-mortem analysis.

Verify in Firebase Console → Firestore that `op8-test-*` guests are gone.

---

## Phase 7 — Final sign-off

Fill this in:

| Phase | Status | Notes |
|---|---|---|
| 0. Pre-flight | ✓ / ✗ | |
| 1. Seed allowlist | ✓ / ✗ | |
| 2. Harness dry-run | ✓ / ✗ | |
| 3. Harness real run | ✓ / ✗ | p50: __ ms, p95: __ ms, errors: __ |
| 3.5 Observability checks (dedupe, double-reply, sentry) | ✓ / ✗ | |
| 4. Scripted adversarial sweep | ✓ / ✗ | __ true positives |
| 5. Human adversarial pass | ✓ / ✗ | __ findings logged |
| 6. Teardown | ✓ / ✗ | |

**Sign-off (both operators)**: ____________________ Date: __________

→ Op-8 complete. All findings in `adversarial-findings.md` triaged and either patched (with re-test) or explicitly accepted as wontfix before T-1 deploy freeze.

---

## If anything goes catastrophically wrong mid-run

1. **Stop the harness** — Ctrl-C in W1.
2. **Disable the bot** — Firebase Console → Firestore → `config/bot` → set `enabled: false`. The webhook will short-circuit on next inbound and stop replying.
3. **Run teardown anyway** — `node bot/scripts/op8-teardown-test-phones.mjs` cleans up the synthetic guests so they don't pollute prod data.
4. **Re-enable the bot once you've patched** — `config/bot.enabled: true`.
5. **Document the incident** under `adversarial-findings.md` → Load test findings.

The kill-switch (`config/bot.enabled = false`) is also tested during real-event operations; running it here doubles as a disaster-drill rehearsal.
