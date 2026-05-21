# WhatsApp Bot — Implementation Plan

> Phased delivery plan from kickoff to wedding. Designed for an LLM implementer with the operator (Enrique) reviewing daily.

## Timeline at a glance

- **Day 0** = 2026-05-08 (today, kickoff)
- **Day 14** = 2026-05-22 (target launch readiness — full guest onboarding broadcast)
- **Day 21** = 2026-05-29 (wedding starts)
- **Day 23** = 2026-05-31 (wedding ends)
- **Day 24** = 2026-06-01 (post-event wind-down)

The plan front-loads operator setup work (Meta verification has unpredictable latency) and gives an 8-day buffer between launch readiness and wedding for guest engagement, fixes, and template polishing.

## Critical-path dependency graph

```
[Op-1: Meta verification]──────────────┐ (parallel, async, 1-10d)
                                       ▼
[D1-D2 webhook scaffold] ── [D3 Claude pipeline] ── [D5 KB + tools] ── [D7 Flows live] ──┐
[D2 send wrapper] ──────────────────────────────────────────────────────────────────────┤
[D3 dedupe + state] ─────────────────────────────────────────────────────────────────────┤
                                                                                         ▼
                                                                         [D8 admin extensions]
                                                                                         │
                                                                                         ▼
                                                                          [D10-D12 evals + UAT]
                                                                                         │
                                                                                         ▼
                                                                        [D13 prod phone switch]
                                                                                         │
                                                                                         ▼
                                                                      [D14 onboarding broadcast]
                                                                                         │
                                                                                         ▼
                                                                              [D21-D23 event]
                                                                                         │
                                                                                         ▼
                                                                          [D24 post-event wrap-up]
                                                                                         │
                                                                                         ▼
                                                                  [D+90 decommissioning]
```

## Operator parallel track (start Day 0)

These are NOT sequential with the implementation. Operator does them in parallel.

| Op-day | Task | Owner | Doc |
|---|---|---|---|
| Op-0 (today) | Start Meta business verification | Operator | `setup-guide.md` Step 4 |
| Op-0 | Provision phone number / SIM | Operator | Step 3 |
| Op-0 | Create Meta App + WABA + test number | Operator | Step 5 |
| Op-0 | Create Anthropic account + key + spend cap | Operator | Step 7 |
| Op-1 | Add Manuel as backup admin everywhere | Operator | Step 2 |
| Op-1 | Cloudinary preset configured | Operator | Step 8 |
| Op-2 | All Firebase secrets set | Operator | Step 9 |
| Op-3 | System User token generated | Operator | Step 10 |
| Op-4 | Submit templates (after implementer authors) | Operator | Step 13 |
| Op-5 | Submit Flows (after implementer authors) | Operator | Step 13 |
| Op-7 | Verify approval status of all templates / flows | Operator | Step 13 |
| Op-13 | Switch from test number to prod number | Operator | Step 14 |
| Op-13 | Send onboarding broadcast (50-guest pilot) | Operator | runbook |
| Op-14 | Full onboarding broadcast | Operator | runbook |

If verification is delayed, the test number can carry the implementation through Day 12. If verification still hasn't completed by Day 13, the operator falls back to the unverified-tier production phone (250 unique recipients/day cap, fine for 150 guests) and proceeds.

---

## Implementation phases

Each phase has: deliverable, files touched, definition of done, and a daily checkpoint with the operator.

---

### Phase 1 — Foundation (Day 1–2)

**Goal:** receive an inbound message from Meta, log it, ack with a hardcoded reply.

**Deliverable:** A deployed Cloud Function `whatsappWebhook` that verifies signatures, deduplicates, classifies, and replies to text messages with `"Hola, te leo. (estoy en construcción)"`. End-to-end via Meta test number.

**Files created:**

- `functions/src/bot/index.ts` (re-exports)
- `functions/src/bot/webhook/handler.ts`
- `functions/src/bot/webhook/verify.ts`
- `functions/src/bot/webhook/dedupe.ts`
- `functions/src/bot/webhook/classify.ts`
- `functions/src/bot/whatsapp/client.ts`
- `functions/src/bot/whatsapp/send.ts` (text-only initially)
- `functions/src/bot/lib/phone.ts`
- `functions/src/bot/lib/config.ts`
- `firebase/firestore.rules` (add bot collection rules from `04-data-model.md` §4)
- Update `functions/src/index.ts` to export `whatsappWebhook`
- Update `functions/package.json` (add `@anthropic-ai/sdk`, `axios`, `zod`)

**Definition of done:**

- Operator sends a message from a test phone to the test number → reply arrives within 5s.
- Cloud Logs show structured logs for the request.
- HMAC verification rejects a tampered payload (verified via `simulate-webhook.ts`).
- Dedupe: same `message.id` posted twice produces only one outbound.
- `firestore.rules` updated and deployed.

**Daily checkpoint:** end of Day 2, operator runs the live test and confirms the round trip.

---

### Phase 2 — Conversational pipeline (Day 3–5)

**Goal:** real Claude-powered replies grounded in a basic KB.

**Deliverable:** the bot answers schedule and venue questions correctly in ES/EN using Claude + tools, with prompt caching.

**Files created:**

- `functions/src/bot/handlers/conversation.ts`
- `functions/src/bot/handlers/command.ts` (stop, help)
- `functions/src/bot/conversation/state.ts`
- `functions/src/bot/conversation/ratelimit.ts`
- `functions/src/bot/allowlist.ts`
- `functions/src/bot/claude/pipeline.ts`
- `functions/src/bot/claude/system-prompt.ts`
- `functions/src/bot/claude/tools.ts` (definitions only — most tools stubbed)
- `functions/src/bot/claude/kb.ts`
- `functions/src/bot/claude/language.ts`
- `functions/src/bot/services/guests.ts`
- `functions/src/bot/services/events.ts` (read from existing `events/` collection)
- `functions/src/bot/services/venues.ts` (read from existing `venues/` collection)
- `functions/src/bot/services/audit.ts`
- `functions/src/bot/lib/i18n.ts`
- `functions/src/bot/lib/time.ts`
- `functions/src/bot/lib/validation.ts`
- `firebase/firestore.indexes.json` (add bot indexes from `04-data-model.md` §3)

**Migrations:**

- Run `functions/scripts/migrate-bot-enrollment.ts` — sets `botEnrolled: true` for existing guests.

**Definition of done:**

- Each of these golden examples produces a correct response (run via `npm run eval` in `functions/`):
  - G1, G2, G3, G6, G10, G11, G12, G13, G15 from `02-conversation-design.md`.
- Cache hit rate >80% on the system prompt across 10 turns.
- Allowlist: unknown phone gets the polite refusal; logged in `bot_unknown_inbound`.
- Stop command: marks `botEnrolled = false`.
- Rate limit: 31 messages in 5 min from one phone triggers throttle.
- Bilingual: ES guest gets ES; EN guest gets EN; mid-conversation switch works.
- KB rebuild: editing a Firestore `events` doc bumps `bot_kb_version`.

**Daily checkpoint:** end of Day 5, operator runs the conversational scenarios from a real test phone and approves tone.

---

### Phase 3 — Tools, media, and Flows (Day 6–8)

**Goal:** all tools functional, photo intake working, Flows published and routable.

**Deliverable:** the bot can send location pins, fetch live weather, look up seating (with locked-state respect), receive photos, and trigger/process the `song_request` Flow (ES/EN).

**Files created:**

- `functions/src/bot/handlers/media.ts`
- `functions/src/bot/handlers/flow.ts`
- `functions/src/bot/handlers/status.ts`
- `functions/src/bot/whatsapp/media.ts`
- `functions/src/bot/whatsapp/flows.ts`
- `functions/src/bot/whatsapp/templates.ts` (full registry, templates already submitted by Op-4)
- `functions/src/bot/services/seating.ts`
- `functions/src/bot/services/menu.ts`
- `functions/src/bot/services/weather.ts` (Open-Meteo fetcher + cache)
- `functions/src/bot/services/photos.ts`
- `functions/src/bot/services/escalation.ts`
- `functions/src/bot/services/songs.ts`

**Operator parallel:**

- Submit all 26 templates and 2 Flow versions via Meta UI on Op-4.
- Verify approvals on Op-5 to Op-7. Re-submit any rejections.

**Definition of done:**

- Photo sent → uploaded to Cloudinary → `feed_posts/{auto}` created with `status: pending_moderation` → bot acks.
- `song_request` Flow triggered, submitted, and parsed correctly. Submissions visible in admin (or directly in Firestore for now).
- `lookup_seating` returns "locked" before unlock time, real data after.
- `get_current_weather` returns a real Tarifa snapshot.
- Escalation tool creates a `bot_escalations` doc.
- Privacy boundaries hold: G4 (other-guest attendance), G5 (time-gated), G14 (operator forwarding).

**Daily checkpoint:** end of Day 8, operator runs song-request Flow end-to-end on real test phone in both languages.

---

### Phase 4 — Admin UI extensions (Day 8–10)

> Runs in parallel with Phase 3 on Day 8, then continues solo.

**Goal:** operator can monitor, broadcast, and reply to escalations from the existing Next.js admin.

**Deliverable:** the `/admin/bot/**` section described in `08-integration-contract.md` §5.

**Files created:**

- `web/src/app/admin/bot/layout.tsx`
- `web/src/app/admin/bot/page.tsx` (dashboard)
- `web/src/app/admin/bot/conversations/page.tsx`
- `web/src/app/admin/bot/conversations/[phone]/page.tsx`
- `web/src/app/admin/bot/escalations/page.tsx`
- `web/src/app/admin/bot/escalations/[id]/page.tsx`
- `web/src/app/admin/bot/broadcasts/page.tsx`
- `web/src/app/admin/bot/broadcasts/new/page.tsx`
- `web/src/app/admin/bot/templates/page.tsx`
- `web/src/app/admin/bot/flows/page.tsx`
- `web/src/app/admin/bot/unknown-inbound/page.tsx`
- `web/src/app/admin/bot/faq/page.tsx`
- `web/src/app/admin/bot/faq/[id]/page.tsx`
- `web/src/app/admin/bot/settings/page.tsx`
- `web/src/lib/bot-callable.ts` (typed wrappers around Callable functions)
- Callable functions in `functions/src/bot/`:
  - `botSendBroadcast`
  - `botCancelBroadcast`
  - `botReplyToEscalation`
  - `botResolveEscalation`
  - `botAddToAllowlist`
  - `botRebuildKb`
  - `botSimulateInbound`

**Definition of done:**

- Operator (logged in as admin) can view all conversations, all escalations.
- Operator can compose a dry-run broadcast and see the resolved audience count.
- Operator can reply to an escalation; the reply round-trips to a test phone.
- Operator can add an unknown phone to the allowlist.
- FAQ CRUD functional; saving a new FAQ entry triggers KB rebuild.
- Settings page can toggle `config/bot.enabled`.

**Daily checkpoint:** end of Day 10, operator does a "dry day" — uses only the admin UI for an hour to handle a simulated inbound stream from `botSimulateInbound`.

---

### Phase 5 — Scheduled functions & broadcasts (Day 10–11)

**Goal:** time-driven sends fire correctly with full idempotency.

**Deliverable:** all 8 scheduled functions deployed, tested, and observable.

**Files created:**

- `functions/src/bot/scheduled/eventReminder.ts`
- `functions/src/bot/scheduled/contentUnlock.ts`
- `functions/src/bot/scheduled/filmDeveloped.ts`
- `functions/src/bot/scheduled/weatherMorningBrief.ts`
- `functions/src/bot/scheduled/keepKbWarm.ts`
- `functions/src/bot/scheduled/retryOutboundPending.ts`
- `functions/src/bot/scheduled/purgeExpiredMessages.ts`
- `functions/src/bot/broadcast/dispatch.ts`
- `functions/src/bot/broadcast/audience.ts`
- `functions/src/bot/scheduled/_shared.ts` (rate-limited dispatcher used by all)

**Files modified:**

- Existing `functions/src/notifications/sendEventReminder.ts` → migrate to `bot/scheduled/eventReminder.ts` and remove FCM path.
- Existing `functions/src/notifications/sendContentUnlockNotification.ts` → migrate.
- Existing `functions/src/camera/triggerFilmDevelopment.ts` → integrate template send.

**Definition of done:**

- Test "fake event 5 min from now" with one test guest → reminder template fires once at the right time.
- Idempotency: re-running the cron tick within the window does NOT double-send.
- Broadcast: dry-run shows correct audience count; real send to a 3-guest pilot succeeds with logged delivery receipts.
- `keepKbWarm` runs every 4 min only inside the configured window.

**Daily checkpoint:** end of Day 11, operator schedules a fake test event for the next morning and verifies the reminder fires correctly.

---

### Phase 6 — Evaluation harness, hardening, and polish (Day 11–13)

**Goal:** confidence the bot won't embarrass the couple at the wedding.

**Deliverable:** comprehensive automated and manual evals; all known edge cases handled.

**Files created:**

- `functions/test/bot/eval.spec.ts` — runs all 15 golden examples + 10 adversarial cases against live Claude.
- `functions/scripts/simulate-webhook.ts` — dev tool for crafting inbound payloads.
- `functions/scripts/seed-bot-config.ts` — populates `config/bot` and `config/bot.flows.activeIds`.
- `functions/scripts/migrate-bot-enrollment.ts` (already done in Phase 2, keep updated).

**Tests / activities:**

- Run full eval suite. Iterate on system prompt until 100% pass.
- Bilingual end-to-end UAT with operator + Manuel + 2 trusted friends, in both ES and EN.
- Adversarial UAT: prompt injection attempts, off-topic, allowlist bypass attempts, very long messages, voice notes, stickers.
- Cost simulation: run 50 simulated turns; verify cache hit rate ≥85% and projected event cost <€30.
- Operator runbook walkthrough — operator reads `admin-runbook.md` and walks through every scenario.
- Disaster drill: kill switch (`config/bot.enabled = false`) — verify bot stops responding within 10s.
- Quality rating check on the WABA — should be "High" or "Medium." Address any warnings.

**Definition of done:**

- Eval pass rate: 100%.
- All Phase 1–5 acceptance criteria from `01-prd.md` §10 met.
- Operator signs off in writing (Slack / email).

**Daily checkpoint:** end of Day 13, go/no-go decision with operator.

---

### Phase 7 — Production switchover (Day 13)

**Goal:** flip from test number to production phone number.

**Activities:**

- Operator updates `WHATSAPP_PHONE_NUMBER_ID` secret to prod number.
- Implementer redeploys functions.
- Operator sends a 4-recipient pilot broadcast (operator + Manuel + 2 friends): T1 welcome onboarding template.
- Verify all 4 receive correctly in correct language. Click each quick-reply → bot responds.
- Verify quality rating remains "High."

**If anything fails:** rollback by reverting the secret (test number ID); keep test number active for follow-up.

**Definition of done:** all 4 pilot recipients confirm round trip. Operator gives go-ahead.

---

### Phase 8 — Onboarding broadcast (Day 14)

**Goal:** all RSVP'd guests have heard from the bot at least once.

**Activities:**

- Operator opens `/admin/bot/broadcasts/new`.
- Selects template `welcome_onboarding`.
- Audience: all `botEnrolled: true` guests with `language` set.
- Pre-segments by language: send ES variant to ES guests, EN to EN guests.
- Reviews the dry-run preview (3-guest sample).
- Sends.
- Monitors `bot_send_log` for ~10 min: expect ~80% delivered within that window; the rest within an hour.

**Watch for:**

- Delivery failures (logged with reason — could be invalid phone, blocked by user, etc.). Operator follows up manually.
- Opt-outs in the first hour (probably 1-3 guests). Update guest doc, suppress further sends.
- Unexpected questions in the first 4 hours — usually clarifications. Bot handles most; operator triages escalations.

**Definition of done:** ≥80% of guests have responded to the welcome (replied with anything, tapped a button, sent a Flow).

---

### Phase 9 — Pre-event polish (Day 15–20)

**Goal:** address everything you didn't anticipate, calmly.

**Activities (mostly operator, implementer on standby):**

- Daily review of `bot_unknown_inbound`, `bot_escalations`, and Cloud Logs.
- Iteration on KB / FAQ as new questions surface — add FAQ entries; KB rebuilds automatically.
- Tweak system prompt if a category of questions is consistently mis-answered (rare in practice).
- Final dry run of all proactive sends in staging (event reminders, content unlocks, weather brief, film developed).
- Pre-event Firestore export (manual) Day 20.

**Activities (implementer):**

- Bug fixes and small UX improvements based on real usage data.
- No new features. Stability over scope.

**Daily checkpoint:** brief operator + implementer chat, ~15 min.

---

### Phase 10 — Event weekend (Day 21–23)

**Goal:** the bot does its job; operator stays available but unbothered.

**Operator activities:**

- Morning: skim `/admin/bot/escalations` over coffee. Reply to anything blocking.
- During events: bot handles itself. Operator only intervenes for high-urgency escalations (in-the-moment logistical issues).
- Evening: quick scan of conversations, photo moderation queue.

**Implementer activities:**

- On standby. Available via WhatsApp to operator. No new deploys unless absolutely necessary.

**Friday May 29:** welcome dinner reminder fires automatically; weather brief in the morning.

**Saturday May 30:** bus reminders at 14:00 and 16:45; ceremony context reminders active; seating unlock at 19:30; at 00:00 (Saturday-night boundary into May 31) `song_request_party_open` invites requests for DJ forwarding.

**Sunday May 31:** at 20:00, `film_developed` template fires; album becomes public; this is the most emotionally weighted send. **Operator should review the album content beforehand and approve final state.**

**Continuous:** photo intake throughout. Approved photos go live in album as `film_developed` flips public visibility.

---

### Phase 11 — Post-event (Day 24+)

- **Day 24 14:00:** operator sends `farewell_thanks` template manually.
- **Day 25–30:** review feedback. Save as a keepsake.
- **Day 30:** archive the bot to "wind-down" mode — `config/bot.enabled = false` after a final farewell.
- **Day 90:** run `botDecommission` script. Conversations purged. Album remains. Aggregates archived.

---

## Daily checkpoints — format

A 10-minute Slack / WhatsApp call between operator and implementer at end of each working day:

1. **What shipped today** (1 min).
2. **Any operator observations** from sample interactions (3 min).
3. **Open blockers** (3 min).
4. **Tomorrow's deliverable** confirmed (3 min).

---

## Risk responses

If at any checkpoint a phase is at risk:

| Risk | Response |
|---|---|
| Verification taking too long | Proceed on test number; cap launch broadcast at 250 unique recipients (still covers all guests). |
| Templates rejected repeatedly | Simplify copy further. Drop variables that look "marketing-y." Last resort: use Authentication-style minimalist copy and make the URL button do the heavy lifting. |
| Conversational quality below bar | Tighten system prompt. Add 5 more golden examples in the KB. Consider stronger model (already on Sonnet). |
| Escalations exploding | Move from auto-escalation to human-routed-only (operator decides). Tighten escalation triggers in system prompt. |
| Cost runaway | Drop history window from 8 turns to 4. Reduce KB to essentials. Cap daily Anthropic spend at €10 (it shouldn't exceed €5/day). |
| Operator overwhelmed | Add second operator (a friend) to handle escalation triage during event. |

---

## Acceptance for "ready to launch"

The bot is ready when, for 24 consecutive hours of normal operation in staging:

- ≥95% of inbound messages produce a sane reply.
- ≤1 escalation surfaces that a competent human couldn't have handled better.
- 0 secrets leaked to logs or repo.
- 0 photo publications without consent.
- 0 unauthorized broadcasts.
- Quality rating: High or Medium.
- Operator confidence: subjective but vocal yes.
