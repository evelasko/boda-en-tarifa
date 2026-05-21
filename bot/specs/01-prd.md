# Boda en Tarifa — WhatsApp Bot: Product Requirements

## 1. Mission

Be the easiest possible way for every wedding guest to know what's happening, when, where, and what to do — and to share what they want to share — without installing anything.

## 2. Personas

### P1: The Spanish family member (~50% of guests)

- 35–75 years old, Spanish first language.
- WhatsApp daily; native install / app store unfamiliar / hostile.
- Will ask: "¿A qué hora es la ceremonia?", "¿Dónde aparco?", "¿Hace falta corbata?"
- Wants: clear logistics, friendly tone, photos of grandchildren post-event.
- **Primary success signal:** sends ≥1 message during the weekend without giving up.

### P2: The international friend (~30% of guests)

- 28–45, English first language, Spanish optional.
- Tech-comfortable, traveling from abroad, anxious about logistics.
- Will ask: "Where do I get the bus from Tarifa?", "What's the dress code on day 2?", "Is the welcome dinner on the beach actually ON the sand?"
- Wants: travel-grade clarity, accurate timing, sense of vibe.
- **Primary success signal:** treats the bot as a trusted source and stops emailing the couple.

### P3: The local Spanish friend (~15% of guests)

- 28–45, knows the area, mostly self-sufficient.
- Will ask logistical edge cases: parking, late arrival, plus-one questions.
- Wants: low-friction RSVP edits, song requests, "where's the after-party?"
- **Primary success signal:** uses bot channels (especially song requests) instead of texting Enrique directly.

### P4: The operator — Enrique (and Manuel as secondary)

- Couple. Already overloaded.
- Cannot be the on-call answer machine for 150 people during their own wedding.
- Wants: visibility into what guests are asking, ability to broadcast updates, escalation only when needed.
- **Primary success signal:** ≤10 manual escalations per day during the event weekend.

## 3. Goals

### Primary

1. **Universal reach.** Every RSVP'd guest is reachable via WhatsApp at <30s latency for proactive messages and <5s latency for replies.
2. **Self-service answers.** ≥85% of guest questions are answered by the bot without operator escalation.
3. **Structured interaction collection.** Song requests captured via Flow with ≥80% completion rate among users who open it.
4. **Photo collection.** Guests can share photos in chat; ≥500 photos collected across the weekend; surfaced in a public web album at 05:00 May 31.
5. **Operator sanity.** Enrique receives ≤10 escalations per day during the event weekend.

### Secondary

6. Bilingual ES/EN with no quality drop in either.
7. Time-gated reveals (seating, menu) feel like moments, not just messages.
8. Post-event: archive of guest interactions and photos.

## 4. Non-goals

- A general-purpose AI assistant. Off-topic Q is politely redirected.
- A group chat. Not technically possible; not a goal.
- A replacement for the existing wedding website. The web is still the source for browsing.
- A native app. Killed; superseded by this project.
- A long-term product. Bot is decommissioned ~3 months post-wedding (see `09-security-privacy.md` retention).
- Marketing or promotion of any kind.

## 5. Feature inventory

Each feature has: a name, the personas served, the surface (chat / Flow / template / web link), the trigger (user-initiated or proactive), and the success signal.

### F1: Welcome & onboarding

- **Personas:** all.
- **Surface:** template (proactive, one-time) + free-form session message.
- **Trigger:** operator broadcast `welcome_onboarding` template ~7 days before the event.
- **Behavior:** "Hi {name}, this is the wedding concierge for Enrique & Manuel's wedding. Ask me anything…" + 2 quick-reply buttons: "📅 What's the schedule?" / "🛏️ Where do I stay?"
- **Success:** ≥80% of guests reply or tap a button within 24h.

### F2: Conversational Q&A

- **Personas:** all.
- **Surface:** session messages, Claude-powered.
- **Trigger:** user-initiated; any text.
- **Behavior:** answer with KB context, in user's language, with light personality. If unsure, escalate (F11).
- **Success:** ≥85% answered without escalation; user satisfaction inferred from conversation continuation.

### F3: Schedule lookup

- **Personas:** all.
- **Surface:** session messages + list message ("Choose an event").
- **Trigger:** intent: "schedule", "what time", "where", "tomorrow", "today".
- **Behavior:** if specific event implied → answer directly. If vague → list message with all events.
- **Includes:** time, venue, dress code, transport notes, ceremony details, expected duration.

### F4: Venue and travel info

- **Personas:** P2 especially, all generally.
- **Surface:** session messages with optional location pin.
- **Trigger:** intent: "where", "how do I get to", "parking", "address".
- **Behavior:** answer with venue details, send a location pin, link to Google Maps and to the dedicated venue page on the web.

### F5: RSVP updates (conversational / web)

- **Personas:** P1, P3 especially.
- **Surface:** session messages + web fallback.
- **Trigger:** user types "RSVP" / "confirmar"; or user replies to onboarding.
- **Behavior:** bot summarizes existing RSVP and offers updates; complex edits escalate to operator and/or web.

### F6: Song requests

- **Personas:** all.
- **Surface:** WhatsApp Flow (1 screen).
- **Trigger:** scheduled template `song_request_party_open` at 00:00 (start of May 31, party already running); or user-initiated.
- **Behavior:** structured collection; results visible in web admin.

### F7: Time-gated reveal (seating)

- **Personas:** all.
- **Surface:** template message at unlock time + interactive button to view detail.
- **Trigger:** scheduled functions (existing `sendContentUnlockNotification`).
- **Behavior:** at 19:30 May 30 (seating), bot DMs each guest with their personal seating details. Sends a CTA URL button to the matching web page. Menu is not time-gated in bot flows (paper at-seat).

### F8: Event reminders

- **Personas:** all.
- **Surface:** utility template, 30 min before each event.
- **Trigger:** existing scheduled function `sendEventReminder`, extended to send via WhatsApp.
- **Behavior:** "🌅 La cena de bienvenida empieza en 30 min en {venue}. ¡Te esperamos!" with a CTA button to view event details.
- **De-dup:** never send twice for the same event-guest pair.

### F9: Photo intake

- **Personas:** all.
- **Surface:** chat (user sends image/video) + bot acknowledgement.
- **Trigger:** any image/video sent to the bot.
- **Behavior:** download via Graph API, upload to Cloudinary, write `feed_posts` doc with `status: pending_moderation, source: whatsapp`. Bot acks with a warm message ("¡Capturada! Aparecerá en el álbum cuando se revele el sábado. 📸").
- **Consent:** if the guest hasn't consented to publication (via F12 or the web), photo is stored privately, marked `consent: pending`, and not published.

### F10: Disposable-camera reveal

- **Personas:** all.
- **Surface:** template push at 05:00 May 31 with link to public web album.
- **Trigger:** existing scheduled function `triggerFilmDevelopment`.
- **Behavior:** album page (web) becomes public, applies retro/film Cloudinary transforms, displays approved photos. Bot sends a single utility template to all guests with the link.
- **Replaces:** the Flutter app's disposable-camera feature.

### F11: Escalation

- **Personas:** all (initiator); P4 (operator).
- **Surface:** chat (bot says "I'll ask Enrique") + admin dashboard alert.
- **Trigger:** Claude's `escalate_to_operator` tool call (low-confidence answer, sensitive question, explicit user request).
- **Behavior:** writes a `bot_escalations` doc; operator sees it in admin dashboard; operator's reply is sent back to the guest via the bot. SLA: best-effort; goal ≤30 min during event, ≤4h before.

### F12: Photo consent capture

- **Personas:** all.
- **Surface:** WhatsApp Flow (1 screen, 1 checkbox).
- **Trigger:** sent on first photo send if consent is missing; or as part of the onboarding template's button menu.
- **Behavior:** persists `photoConsent: true|false` on the guest doc. If false, photos are kept private indefinitely.

### F13: Operator broadcasts

- **Personas:** P4.
- **Surface:** admin dashboard "Broadcast" page (extends existing Next.js admin).
- **Trigger:** operator manually composes a broadcast.
- **Behavior:** operator picks a template, fills variables, picks audience (all / event-specific / language-specific / a single guest), confirms, sends. System writes a `bot_broadcasts` doc and dispatches.
- **Constraints:** rate-limited; templates must already be approved.

### F14: Stop / opt-out

- **Personas:** all.
- **Surface:** chat command.
- **Trigger:** user types "stop" / "parar" / "unsubscribe" / "darme de baja".
- **Behavior:** marks `botEnrolled: false` on guest doc; bot sends one final acknowledgement; no further messages until user re-engages.

### F15: Help / what can you do

- **Personas:** P1 especially.
- **Surface:** session message with list message.
- **Trigger:** "help", "ayuda", "qué puedes hacer", "?", "menu".
- **Behavior:** shows a curated list of capabilities with quick-pick options.

### F16: Post-event closeout

- **Personas:** all.
- **Surface:** manual farewell template + optional direct messages.
- **Trigger:** operator sends `farewell_thanks` after the event.
- **Behavior:** closes the bot loop without a dedicated feedback Flow.

## 6. Success metrics

Tracked in admin dashboard "Bot" page; values measured at end of weekend.

| Metric | Target |
|---|---|
| Onboarded guests (responded to welcome) | ≥80% |
| Conversational answers without escalation | ≥85% |
| Song request Flow completion (opened → submitted) | ≥80% |
| Median bot reply latency | <5s |
| P95 bot reply latency | <15s |
| Operator escalations / day during event | ≤10 |
| Photos collected | ≥500 |
| Guest opt-out rate | <5% |
| Quality rating (Meta) at end of event | ≥ "High" |

## 7. Constraints & dependencies

### Hard constraints

- **Time:** wedding is 2026-05-29 to 2026-05-31. Today is 2026-05-07. Implementation window is 14 working days max with 8 days of pre-event buffer for operator onboarding broadcast.
- **Platform:** WhatsApp Cloud API, no group support (D9 in `00-overview.md`).
- **Cost ceiling:** total Meta + Anthropic + Cloudinary spend should not exceed €500. Estimated: <€200.

### Soft constraints

- One-developer-equivalent capacity. The implementer is an LLM with the operator reviewing.
- Operator (Enrique) availability for verification, template approvals, copy review: ~2h/day.

### Dependencies

- Existing Firebase project (`functions/`, `firebase/`).
- Existing Firestore collections: `guests`, `rsvp_responses`, `seating`, `feed_posts`, `notices`, `time_gated_content`, `config/*`.
- Existing scheduled functions: `sendEventReminder`, `sendContentUnlockNotification`, `triggerFilmDevelopment`, `generateMagicLink`, `onUserCreate`.
- Existing web admin (Next.js, `web/`). Will be extended with a "Bot" section.
- Anthropic API account with access to Sonnet 4.6 + Haiku 4.5.
- Meta Business Manager account + WABA + verified phone number.
- Cloudinary account (already in use by web).

## 8. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Meta business verification delayed beyond launch date | Medium | Critical | Start day 0. Have unverified-tier fallback (250 unique recipients/day cap, but enough for 150 guests). |
| Template rejection cycle exceeds time budget | Medium | High | Submit templates on day 4. Have plain-English transactional copy; avoid marketing-y language. Iterate quickly. |
| Claude reply quality inconsistent across ES/EN | Low | Medium | Golden test set per language; calibration pass with operator. |
| Bot hallucinates wrong logistical info | Medium | High | Knowledge base is authoritative. Tool-call architecture: Claude must use lookup tools for facts; refuses to guess. Operator review of golden tests. |
| Guest sends inappropriate media to bot | Low | Low | Photos go to private moderation queue; never auto-published. |
| Webhook outage on event day | Low | Critical | Cloud Functions retry semantics + operator phone fallback ("call/text Enrique directly"). |
| Operator overwhelmed by escalations | Medium | High | Tune escalation threshold conservatively up-front. Default to "give bot wider answer space" before launch. |
| Phone number quality rating drops | Low | Medium | Conservative template usage; avoid marketing category; respect opt-outs. |
| Cost runaway from Claude | Low | Low | Prompt caching (D4); per-guest 30-msg / 5-min rate limit (D13); daily spend alert. |

## 9. Out of scope (explicit)

For each item below, do NOT implement, even if it seems easy.

- ❌ Any payment / Bizum / Stripe integration.
- ❌ Hotel or transport booking.
- ❌ Live video / WhatsApp Calls.
- ❌ Multi-tenant ("white-label this for other weddings"). One wedding, one project.
- ❌ Voice transcription of inbound voice notes (defer; surface "I can't hear voice notes yet, can you type it?").
- ❌ Long-term memory across guests ("Maria last year said…").
- ❌ Sentiment analysis or guest emotion tracking.
- ❌ Marketing analytics beyond the metrics in §6.
- ❌ Social media auto-posting.
- ❌ Anything requiring human moderators staffed 24/7.

## 10. Acceptance criteria for v1

The bot is "done" for the wedding when **all** of the following hold:

1. Operator has sent a successful onboarding broadcast to ≥10 guests on a real WABA phone number.
2. ≥3 of those guests have completed a Q&A round-trip in their language with correct answers.
3. Song request Flow end-to-end test: guest submits via Flow → response visible in web admin.
4. Photo intake end-to-end test: guest sends image → uploads to Cloudinary → appears in admin moderation queue.
5. Scheduled `event_reminder_30min` template fires correctly in a dry run against a small audience.
6. `escalate_to_operator` tool call surfaces in admin dashboard within 5 seconds; operator reply round-trips correctly.
7. Stop command marks guest unenrolled; subsequent broadcast skips them.
8. Quality rating "High" or "Medium" maintained.
9. Documented runbook (`bot/docs/admin-runbook.md`) walked through with operator at least once.
10. All 9 specs and 5 docs reviewed by operator.
