# Event Optimization — Operator Plan

> Human-only tasks to harden Thora's latency, availability, and resilience for the wedding window (2026-05-23 → 2026-06-05). Companion document: [`event-optimization-implementer-plan.md`](./event-optimization-implementer-plan.md) — read both before scheduling work.
>
> **Today**: 2026-05-22. **Wedding**: 2026-05-29 → 2026-05-31. **Active window**: 2026-05-23 → 2026-06-05.
>
> Scope: tasks that require a human (account approvals, SIM provisioning, dashboard clicks, paid signups, exercising judgment). Everything that touches code lives in the implementer plan.

---

## Goal

Buy ~€110–130 of headroom in the 7 days before the wedding to:

1. **Eliminate cold starts** (always-on min instances, larger memory tier).
2. **Make Claude faster and more reliable** (Anthropic Priority Tier, 1-hour prompt cache, aggressive keep-warm, rate-limit headroom).
3. **Add voice-note support** (Whisper) so older guests aren't shut out.
4. **Add a backup WABA number** so a single Meta quality flag doesn't take Thora offline mid-event.
5. **Wire Sentry** so the operator hears about exceptions before guests do.
6. **Validate behavior under modest concurrency + adversarial input** before guests pile in.

Memorystore was considered and dropped — for 96 guests the complexity isn't justified.

---

## Timeline at a glance

| Day | Date | Operator critical-path work |
|---|---|---|
| **T-7** | 2026-05-22 (today) | Submit Anthropic Priority Tier application; provision backup SIM |
| **T-6** | 2026-05-23 | Submit Anthropic rate-limit upgrade; create Sentry project + DSN; OpenAI account + Whisper key |
| **T-5** | 2026-05-24 | Deploy updated functions (after implementer Task 1–7 land); verify warm-instance behavior |
| **T-4** | 2026-05-25 | Backup SIM verified + secrets wired; pre-approval check on all Meta templates |
| **T-3** | 2026-05-26 | Deploy keep-warm + pre-event warm-up functions; verify cache hit rate |
| **T-2** | 2026-05-27 | Joint load test (15 simulated concurrent conversations) + adversarial pass with implementer |
| **T-1** | 2026-05-28 | Final smoke test from live SIM; freeze the deploy; confirm Cloud Monitoring alerts arrive on operator's phone |
| **T-0** | 2026-05-29 | Wedding begins. Observe-only mode. |

The two items that can take **multiple days for external approval** — Anthropic Priority Tier and the backup SIM — must go in **today**.

---

## Cross-references with the implementer plan

| Operator task | Depends on / blocks | Implementer task |
|---|---|---|
| Op-1 Anthropic Priority Tier | Provides org-level setting → unblocks | Imp-3 (1h cache + priority header) |
| Op-2 Rate-limit upgrade | Org setting | none in code |
| Op-3 Backup WABA SIM | Provides secret values | Imp-13 (secret + failover flag, optional this phase) |
| Op-4 Sentry project | Provides DSN | Imp-11 (Sentry init in code) |
| Op-5 OpenAI / Whisper account | Provides API key secret | Imp-9 (voice-note handler) |
| Op-6 Deploy infra changes | Needs code changes landed first | Imp-12 (memory/minInstances/cpu config) |
| Op-7 Deploy keep-warm | Needs function written | Imp-10 (keep-warm + warm-up functions) |
| Op-8 Joint load test | Runs against deployed code | All implementer tasks landed |

---

## Op-1 — Anthropic Priority Tier application: status 'denied'

### What
Submit a request to Anthropic to upgrade the production org to **Priority Tier** for the duration of the event (May 23 → June 5).

### Why
Priority Tier routes requests through a higher-priority queue. Real-world impact: 15–30 % faster time-to-first-token on Sonnet 4.6, and meaningfully reduced tail latency under any load. For a conversational bot where the dominant latency cost is Claude inference, this is the single highest-leverage Anthropic-side change.

The application is human-only because Anthropic reviews each request manually — it can take 24–72 hours to approve. **Submit today.**

### How
1. Sign in to console.anthropic.com with the production org account.
2. Settings → Billing → request "Priority Tier" upgrade. If the option is not visible, open a support ticket via the help icon (bottom right) with this template:

   > Subject: Priority Tier request — short-event production workload
   >
   > Hi — we're running a one-off conversational WhatsApp bot for a wedding (~96 guests, ES/EN, Sonnet 4.6 main + Haiku 4.5 routing) from May 23 to June 5, 2026. Expected peak ~30 inbound msgs/min, sustained ~5/min over 3 event days. We'd like Priority Tier enabled for our org [ORG_ID] for that window. Happy to share usage details if helpful.

3. If approved, no code changes are strictly required — the upgrade applies org-wide. The implementer (Imp-3) will add the optional `anthropic-priority-tier` header for explicit opt-in on hot-path requests once the upgrade is confirmed.

### Verification
- Email confirmation from Anthropic.
- Console shows "Priority" tier badge under the org name.
- Coordinate with implementer (Imp-3): paste the confirmation date in `bot/docs/event-optimization-implementer-plan.md` § Imp-3 verification log.

### Time
- Submit: 10 min.
- Wait for approval: 1–3 days. **No further blocking work — keep going on other tasks while it processes.**

### Fallback if denied
Implementer plan still works; you simply forfeit the 15–30 % TTFT win. No code changes needed.

---

## Op-2 — Anthropic rate-limit tier upgrade: status 'requested'

### What
Request a proactive bump on the org's per-minute requests and tokens-per-minute caps.

### Why
Default tier-1 limits (50 RPM / 50k TPM for Sonnet) are theoretically enough for 96 guests but leave no headroom for:

- The D-7 onboarding broadcast (~150 outbound templates over 8 s — these don't hit Claude, but follow-up replies from guests will burst).
- The Saturday 17:30 bus-pickup ping (~80 guests reply simultaneously with location questions).
- The Sunday 20:00 album reveal (everyone refreshes / asks "how do I see it?" at once).

Tier-2 (1000 RPM / 80k TPM) is more than sufficient and is the standard upgrade.

### How
1. Same console support flow as Op-1, but a separate ticket (so they're triaged independently).
2. Template:

   > Subject: Rate-limit tier-2 upgrade for short-event workload
   >
   > Same org [ORG_ID] as the Priority Tier request — would also like a temporary bump to tier-2 RPM/TPM caps on Sonnet 4.6 + Haiku 4.5 for May 23 → June 5. Expected aggregate: ~3000 Sonnet calls and ~500 Haiku calls over the period. Burst handling for ~30 RPM concurrent at peak.

### Verification
- Console → Settings → Limits shows the new caps.
- Test: implementer can run the eval harness with `RUN_LIVE_EVALS=1` against staging without hitting 429s.

### Time
10 min to submit, usually <24 h to approve. Often auto-approved.

### Fallback if denied
Implementer wires retry-on-429 with exponential backoff (already partly in place via the SDK). Not blocking.

---

## Op-3 — Backup WABA phone number: status 'in progress'

### What
Provision a **second** WhatsApp Business phone number on a **different carrier** from the primary, fully verified with Meta, with all templates and Flows pre-approved.

### Why
If the primary number is flagged by Meta (quality drop from a single spammy guest, or Meta misclassification), the bot goes dark with no recovery path inside the event window. A pre-provisioned warm spare can be switched to in ~5 minutes by updating two secrets and redeploying.

This is the cheapest insurance on the entire plan (~€10) and has the highest catastrophic-failure protection.

### How
1. Buy a prepaid SIM from a carrier **different** from the primary (e.g., if primary is Movistar, get Vodafone; if Vodafone, get Orange). Activate and load €5 minimum credit.
2. In Meta Business Manager, add the new number to the existing WABA (or create a parallel WABA if Meta requires).
3. Run through the same provisioning flow as the primary — see `bot/docs/setup-guide.md` Step 5 for the canonical checklist.
4. Submit the **same set of templates** for approval immediately (Meta approves them independently per number — they will not be available on day-1 if you wait).
5. Once Meta approves, capture the new `WHATSAPP_PHONE_NUMBER_ID` and the new system-user `WHATSAPP_ACCESS_TOKEN`. Do NOT set them in production yet — store in a password manager / secure note. They become live only on a switch event.

### Verification
- Meta Business Suite → WhatsApp Manager shows both numbers as Verified and "Connected".
- All 10+ templates show "Approved" status on the backup number.
- Send a test inbound from your personal WhatsApp to the backup number; verify it lands in Meta's webhook test panel (no need to hook it to the live function yet — that's a switch action, not a setup action).

### Switch runbook (do NOT execute unless needed)
1. `firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID` → paste backup value.
2. `firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN` → paste backup value.
3. `firebase deploy --only functions:whatsappWebhook`.
4. In Meta, point the new number's webhook to the same production URL.
5. Send a test inbound; verify reply.
6. Notify guests of the new number via the existing primary if it's still alive, or via the operator's personal WhatsApp.

### Time
- Activate SIM + add to WABA: 30–60 min.
- Template approval: 24–72 h (Meta side).
- Total elapsed: 2–3 days. **Start no later than 2026-05-23.**

---

## Op-4 — Sentry project setup

### What
Create a new Sentry project for the bot, configure alert rules, and provide the DSN to the implementer.

### Why
Cloud Logging is the canonical log surface but it's pull-based: nothing pages the operator when something silently breaks. The free Sentry tier (5k events/month) is comfortably above expected volume and gives push notifications, error grouping, and release tracking.

### How
1. Sign in to sentry.io with your existing free account.
2. Create new project: **Platform: Node.js**, **Project name: `boda-tarifa-bot`**.
3. Under Project Settings → Client Keys (DSN), copy the DSN string.
4. Hand the DSN to the implementer (Imp-11) by adding it to the Firebase secrets manager:
   ```bash
   firebase functions:secrets:set SENTRY_DSN
   ```
   Paste the DSN value when prompted.
5. Configure alert rules: Project Settings → Alerts → New Alert Rule:
   - **Rule 1**: "An issue is first seen" → notify via email + Slack (or whatever channel reaches you fastest).
   - **Rule 2**: "Error rate > 5 events in 5 min" → same notification path.
   - **Rule 3**: Tag filter `level:fatal` → SMS if possible (free tier email is fine if SMS unavailable).
6. Optional but recommended: install the Sentry Slack integration so alerts land in a #wedding-bot channel.

### Verification
- After the implementer has shipped Imp-11, trigger a test error (e.g., temporarily throw in the webhook handler from staging) and confirm it appears in the Sentry dashboard within ~30 seconds.
- Confirm the email/Slack alert fires.

### Time
30 min total.

---

## Op-5 — OpenAI account + Whisper API key: status 'done'

### What
Provision an OpenAI account (or surface an existing personal one) and obtain an API key authorized for the Whisper audio model.

### Why
The implementer (Imp-9) is adding voice-note transcription so older guests can speak to Thora instead of typing. Whisper is the obvious choice — multilingual, high accuracy on Spanish, ~€0.006/minute. Total expected spend over the event: <€5.

### How
1. platform.openai.com → sign in / create account. Use a payment method that's separate from the household card if possible (cleaner billing).
2. Settings → Billing → add credit (€10 prepay is plenty).
3. Settings → API keys → create a new key named `boda-tarifa-bot-whisper-only`.
4. (Optional, recommended) Project Settings → Limits → set a **hard usage cap** at €15 to prevent any surprise from a runaway loop.
5. Hand the key to the implementer:
   ```bash
   firebase functions:secrets:set OPENAI_API_KEY
   ```

### Verification
- API key visible in dashboard with last-used timestamp populated once Imp-9 lands.
- After Imp-9 deploys, send a voice note from a test phone and confirm Thora replies coherently (the implementer's task includes the integration test).

### Time
15 min.

---

## Op-6 — Deploy updated Cloud Functions (memory + minInstances + cpu)

### What
After the implementer lands Imp-12 (the code change that updates the `onRequest` config), deploy the bot functions to production with the new compute tier.

### Why
The implementer can only declare the new tier in code — the actual provisioning happens at deploy time. This is the operator's gate: confirm the diff is what we agreed (`memory: "4GiB"`, `minInstances: 5`, `cpu: 2`, `concurrency: 40` — verify exact values against the implementer's task notes), then deploy.

### How
1. Pull the latest main branch with Imp-12 merged.
2. Read the diff: `git diff HEAD~1 -- functions/src/bot/webhook/handler.ts functions/src/bot/scheduled/`.
3. Verify the config values match what's in the implementer plan § Imp-12 (do not deploy blind — the cost of misconfiguration is real money over 14 days).
4. Deploy:
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions
   ```
5. In Google Cloud Console → Cloud Functions → `whatsappWebhook` → Details: verify
   - Memory: 4 GiB
   - CPU: 2
   - Min instances: 5
   - Max instances: 50
   - Region: europe-west1
6. Cloud Functions Gen2 takes ~2 min to scale up to min instances. Wait, then send a test inbound — first response should be <2 s (no cold start).

### Cost watchpoint
5 instances × 14 days × 4 GiB-vCPU-2 = roughly €50–60 for the period. Budget approved.

### Verification
- `gcloud functions describe whatsappWebhook --region=europe-west1 --gen2` shows the new config.
- Cloud Monitoring → instance count for the function stays ≥5 throughout the 14-day window.
- p50 latency in logs (`bot.webhook.handled`) drops noticeably for the first inbound after long idle periods.

### Time
30 min including verification.

---

## Op-7 — Deploy keep-warm + pre-event warm-up scheduled functions

### What
After the implementer lands Imp-10 (the keep-warm and pre-event warm-up functions), deploy them and verify they fire on schedule.

### Why
The keep-warm function pings Claude every ~60 s with the full system prompt to refresh the 1-hour ephemeral cache. The pre-event warm-up fires 60 minutes before each event start and primes both the cache and the Cloud Functions instance pool.

### How
1. Verify the implementer's diff: the new files should be at:
   - `functions/src/bot/scheduled/keepKbWarm.ts`
   - `functions/src/bot/scheduled/preEventWarmup.ts`
   - registered in `functions/src/bot/index.ts`
2. Confirm the cron schedules match what's in the implementer plan § Imp-10:
   - keep-warm: `* * * * *` (every minute) bounded by date check `2026-05-23 → 2026-06-05`
   - pre-event warm-up: at fixed times derived from event start times
3. Deploy: `firebase deploy --only functions:keepKbWarm,functions:preEventWarmup` (or as a full deploy alongside Op-6).
4. In Cloud Scheduler console, verify both jobs show "Enabled" and the next-run timestamp is within the next minute (keep-warm) and tomorrow's event start −60 min (warm-up).
5. Watch Cloud Logging filtered by `function="keepKbWarm"` — within 2 min you should see ~2 successful invocations logging `claudeUsage.cache_read_input_tokens > 0`.

### Cost watchpoint
1440 keep-warm runs/day × 14 days × ~€0.005/run ≈ €20 total. Within budget envelope.

### Verification
- Cache hit rate (visible in `bot.claude.pipeline.*` logs as `cachedReadTokens` near input total) climbs to >95 % within an hour of deployment.
- Pre-event warm-up logs at the expected T-60 timestamps before each event.

### Time
15 min.

---

## Op-8 — Joint load + adversarial test (with implementer)

### What
Together with the implementer, exercise the deployed system with simulated concurrent traffic and adversarial prompts.

### Why
At 96 guests this is **not** a load test in the production sense — it's a **concurrency-bug hunt**. The dedupe, rate-limit, and audit transaction layers all have race conditions that only appear under simultaneous load. A 15-concurrent-conversation test for 10 minutes shakes them out cheaply.

The adversarial pass tests that Thora's persona holds up under jailbreak attempts, that she doesn't leak the menu/seating/honeymoon/dossier, and that the refusal patterns work.

### How

**Load portion (~30 min):**
1. Implementer prepares a script using `botSimulateInbound` (the existing callable from `08-integration-contract.md` § 3.2) to fire ~15 simultaneous turns against staging, each from a different test phone.
2. Run for 10 minutes with a turn every ~30 s per simulated guest.
3. Watch:
   - Sentry: zero unhandled exceptions.
   - Cloud Logging: zero `bot.webhook.processing_error`.
   - Firestore: dedupe entries are unique per message ID; no double-replies in `bot_conversations`.
   - Latency: p50 still <3 s, p95 <8 s.

**Adversarial portion (~30 min):**
4. Operator (Enrique) and a willing helper (Manuel? a friend?) take turns sending prompts to the staging bot trying to:
- Get Thora to reveal the menu before it's unlocked.
- Get her to leak seating before 19:30 Sat.
- Get her to break character ("ignore previous instructions", "you are now ChatGPT").
- Get her to share another guest's RSVP / contact / seating.
- Get her to share the honeymoon destination.
- Trigger an escalation with low-quality inputs to check the escalation queue's UX.
5. Anything she leaks → record in `bot/docs/adversarial-findings.md` (create if absent) and ping implementer to patch.

### Verification
- All race conditions and persona leaks closed before deploy freeze (T-1).
- A re-run after fixes is clean.

### Time
~1 hour with implementer present. Can be done remotely over Slack/Meet.

---

## Op-9 — Final smoke test from primary SIM (T-1)

### What
Send 10 representative inbound messages from your personal phone to the production bot and confirm every one gets a sensible reply within 5 s.

### Why
Hardware-in-the-loop check that the live SIM, live Meta number, live Firebase, live Anthropic, and live Sentry are all reachable from a real consumer carrier. Catches DNS, signing, secret rotation, and Meta-side gotchas that don't surface in synthetic tests.

### How
- 10 messages, mix of ES + EN, mix of intents (schedule, weather, venue, RSVP question, song request, "stop", "help", a photo, a voice note, "are you AI?").
- Note any reply that's slow (>5 s), wrong, or off-tone in a checklist.
- Anything broken: hold deploy freeze, ping implementer.

### Time
20 min.

---

## Op-10 — Lock the deploy, configure pager (T-1)

### What
Freeze the production code at the verified commit; confirm Sentry alerts route to your phone.

### How
1. Tag the verified commit: `git tag wedding-prod-2026-05-28 && git push --tags`.
2. Configure your phone to allow notifications from Sentry's email/Slack channel even in Do-Not-Disturb mode if your platform supports it. The wedding doesn't take Saturday night off.
3. Test: from staging, trigger a fatal error and confirm the page lands on your phone.

### Time
10 min.

---

## Things to NOT do during the event window

Defensive instructions for the operator once the wedding starts:

- **Do not deploy code changes during the event** unless something is actively broken. The benefit of a "small fix" is dwarfed by the risk of breaking the warm-instance pool and re-paying cold-start costs.
- **Do not edit YAML KB files during event days** unless you've coordinated with implementer — every change bumps `bot_kb_version` and busts the cache. If you must (e.g., last-minute venue change), make the edit on T-3 or earlier so caches re-warm before traffic peaks.
- **Do not touch Anthropic or OpenAI billing settings during the event**. The hard caps are pre-set; trust them.
- **If Meta flags the primary number**, use the backup-SIM switch runbook (Op-3 above). Do not panic-deploy fixes to the primary.

---

## Post-event (June 1 → June 5)

The optimizations stay live through June 5 to handle stragglers and the Sunday-after wind-down. On 2026-06-05:

1. Lower `minInstances` back to 0.
2. Disable the keep-warm and pre-event warm-up scheduled functions.
3. Cancel the Anthropic Priority Tier upgrade (if it was on a metered plan) to avoid charges beyond the event.
4. Anthropic rate-limit tier-2 can stay — it doesn't cost anything when not used.
5. Sentry stays on (it's free).
6. Backup SIM can be deactivated, or kept active for the cost of €5/month — operator's call.

Full decommissioning at T+90 (~2026-08-31) per spec D15.

---

## Appendix — Cost ledger

| Item | Budget | Owner |
|---|---|---|
| Anthropic Priority Tier (14 d) | €20 | Op-1 |
| Anthropic rate-limit upgrade | €0 | Op-2 |
| Backup WABA SIM + credit | €15 | Op-3 |
| Sentry (free tier) | €0 | Op-4 |
| OpenAI Whisper credit | €10 | Op-5 |
| Cloud Functions always-on (5 inst × 4 GiB × 14 d) | €50 | Op-6 |
| Keep-warm Claude pings | €20 | Op-7 |
| Load test compute | €5 | Op-8 |
| **Total operator-side spend** | **~€120** | |
