# Boda en Tarifa — WhatsApp Bot: Overview

> **Document index entry-point.** Read this first. Every other doc in `bot/specs/` and `bot/docs/` is referenced here.

## 1. Purpose

This bot replaces the previously-planned Flutter companion app (`app/`). It serves as the primary digital touchpoint for guests of Enrique & Manuel's wedding (Tarifa, Spain — May 29–31, 2026). It delivers:

- Conversational Q&A about the wedding (logistics, schedule, venues, weather, dress code).
- Proactive reminders and time-gated content reveals.
- Structured data collection (RSVP, dietary, brunch attendance, song requests).
- Photo intake from guests and curated reveal at the post-wedding "film developed" moment.
- Soft escalation to the couple when the bot doesn't know the answer.

The existing wedding website (`web/`) remains the rich-UI surface for browsing (itinerary, directory, photo album, maps). The bot is the **front door**; the web is the **gallery**.

## 2. Why this exists

The original plan was a Flutter app. Three constraints forced a pivot:

1. **Time:** wedding is 22 days away (today: 2026-05-07). Finishing the Linear plan (~280 story points remaining) is not feasible.
2. **Reach:** native app adoption among ~150 guests of mixed ages/tech-comfort is realistically 50–70%. WhatsApp reach is ~100% — every guest already has it and we have every phone number.
3. **Conversational value:** an AI concierge ("what time is the church?", "where do I park?") is genuinely *new* value the app didn't even plan. WhatsApp + Claude unlocks it.

What we lose: the disposable-camera-as-keepsake aesthetic, custom illustrated map, native in-app feed. The first is partially salvaged via Cloudinary post-processing on the public album; the others move to the existing web.

## 3. Document map

### `bot/specs/` — the contract

| File | Purpose |
|---|---|
| `00-overview.md` | This file. Decision log + pointers. |
| `01-prd.md` | Product requirements: goals, personas, features, success metrics, non-goals. |
| `02-conversation-design.md` | Persona (**Thora**), voice, intents, escalation, multilingual handling, golden examples. |
| `03-architecture.md` | System diagram, components, runtime, deployment topology. |
| `04-data-model.md` | Firestore schema (new + extended), conversation state, indices. |
| `05-message-templates.md` | All Meta templates: name, category, copy ES/EN, variables, triggers. |
| `06-whatsapp-flows.md` | All Flows: screen-by-screen JSON, validation, submission handling. |
| `07-knowledge-base.md` | Sources of truth, Claude prompt structure, caching, tool calls, vision. |
| `08-integration-contract.md` | Webhook contract, internal APIs, scheduled triggers, web admin extensions. |
| `09-security-privacy.md` | Auth, HMAC verification, secrets, PII, GDPR, abuse prevention. |
| `couple-dossier.md` | What Thora knows about Enrique & Manuel; disclosure rules. |
| `guest-dossier-schema.md` | Per-guest dossier schema for face recognition and personalization. |
| `tarifa-guide.yaml` | Curated local guide for the Tarifa concierge layer (operator-fillable). |

### `bot/docs/` — the how

| File | Purpose |
|---|---|
| `setup-guide.md` | Meta Business Manager, WABA, phone, verification, secrets configuration. |
| `implementation-plan.md` | 14-day phased delivery plan with deliverables and checkpoints. |
| `developer-guide.md` | Local dev, test number, deployment, code organization, conventions. |
| `admin-runbook.md` | Wedding-weekend operator playbook: broadcasts, monitoring, escalation. |
| `troubleshooting.md` | Common issues, error catalog, diagnostic queries, recovery steps. |

### Reading order for an implementing LLM

1. `00-overview.md` (this) → orientation.
2. `01-prd.md` → what we're building and why.
3. `03-architecture.md` → component map.
4. `04-data-model.md` + `08-integration-contract.md` → schema and interfaces.
5. `02-conversation-design.md` + `07-knowledge-base.md` → bot brain.
6. `05-message-templates.md` + `06-whatsapp-flows.md` → outbound surfaces.
7. `09-security-privacy.md` → guardrails.
8. `bot/docs/setup-guide.md` → environment.
9. `bot/docs/implementation-plan.md` → execution sequence.
10. `bot/docs/developer-guide.md` → conventions while coding.

## 4. Decision log (load-bearing choices)

These are the non-obvious calls baked into the rest of the docs. If you want to change one, update this list and propagate the change through dependent docs.

| # | Decision | Rationale |
|---|---|---|
| D1 | **WhatsApp Cloud API direct (no BSP).** | Simpler billing, fewer middlemen, full control. Twilio/360dialog markup not worth it for a one-off project. |
| D2 | **Webhook hosted on Firebase Cloud Functions** (region `europe-west1`). | Reuses existing Firebase project, secrets, and IAM. Same VPC as Firestore for low-latency reads. |
| D3 | **Claude Sonnet 4.6** for primary conversation (with vision); **Claude Haiku 4.5** for cheap classification (intent routing, language detection) and pre-step photo captioning. | Sonnet quality for guest-facing replies; Haiku at ~10× cheaper for routing and vision captions. |
| D4 | **Anthropic prompt caching** with the wedding knowledge base, couple dossier, guest dossier (with reference photos), and Tarifa guide in the cached system prompt. | KB is large (~15-20k tokens with dossiers + reference photos) and identical across every guest turn. Without caching this is the dominant cost. |
| D5 | **Bot uses a dedicated phone number**, not Enrique's personal. | Personal number cannot be reused (consumer WhatsApp would have to be deactivated). Fresh SIM is ~€10. |
| D6 | **Bilingual ES/EN only, auto-detected from first message** and persisted on guest profile; mid-conversation language switch is mirrored. | Most guests are Spanish-speaking but a meaningful minority are international; foreign guests are universally EN-comfortable at this proficiency level. |
| D7 | **Bot RSVP Flow writes to the same `rsvp_responses` Firestore collection** as the existing web RSVP. Single source of truth. RSVP-already-done detected via `get_guest_context` → summary instead of Flow. | Avoids divergence; existing admin dashboard already reads this collection. Most guests will have RSVPed via web before the bot launches. |
| D8 | **Photos sent to bot are stored privately during the event** and made public on the web album at `triggerFilmDevelopment` time (**20:00 May 31**, shifted from original 05:00). | Preserves the "film developed" emotional reveal; shift to evening lets brunch photos make it in and gives the operator Sunday daylight for a 60-min final moderation pass (~17:00–19:00). |
| D9 | **No groups.** All guest interactions are 1:1. Anything group-shaped lives on the web. | WhatsApp Cloud API does not support group messaging; this is a hard platform constraint. |
| D10 | **TypeScript everywhere**, Node 24, matching existing `functions/` conventions. | Existing codebase is TS Node 24; consistency. |
| D11 | **Firestore is the single source of truth** for content (itinerary, venues, FAQ, couple dossier, guest dossier, Tarifa guide). Remote Config mirrors it for hot updates. | Already wired this way for the web; bot reuses. |
| D12 | **Dedup inbound messages by Meta `message.id`** before processing. Meta retries the webhook on slow responses; idempotency is required. | Prevents double-replies, double-saves, and double Claude charges. |
| D13 | **Per-guest rate limit: 30 inbound messages / 5 minutes.** Exceeded → throttle reply with a polite "give me a moment" and pause Claude calls. | Cheap insurance against runaway loops, accidental media spam, or hostile use. |
| D14 | **All bot writes pass through a typed service layer** (`bot/services/`) — Claude never writes directly to Firestore. Tool calls are typed and audited. | Auditability, testability, and safety. |
| D15 | **Conversation transcripts are retained for 90 days post-wedding** (until 2026-08-31), then purged. Aggregated/anonymized analytics retained indefinitely. | GDPR minimization. Long enough for operator review and "lessons learned"; not indefinite. |
| **D16** | **Bot persona is "Thora"**, the couple's 3-year-old Weimaraner. Display name on WhatsApp is **"Thora al habla"**. The fable is that Thora the dog is the one writing. Gag density ~1-in-3 messages; sensitive/escalation contexts drop the gags. Never reveals as an LLM. See `02-conversation-design.md` and `couple-dossier.md`. | Provides a unifying voice that most guests already know in real life (Thora is a real, well-known dog) and turns the concierge experience into something memorable rather than generic. |
| **D17** | **Scope expansion: Tarifa concierge layer.** Bot answers curated questions about Tarifa-area beaches, restaurants, kite/wind activities, water sports, sightseeing, day trips, walking trails, nightlife, family activities. KB-grounded only via `tarifa-guide.yaml`. No live data, no booking. | Many guests arrive 1-3 days early to explore; serving them is high-leverage and doesn't break the "wedding-only" boundary much. Off-list questions still redirected. |
| **D18** | **Face recognition via reference-photo-in-prompt** (option `a`). Up to ~30 dossier'd guests get 1-3 reference photos embedded in the cached system prompt; Claude vision matches faces in inbound photos against them. Misidentification mitigated by confidence threshold + soft phrasing for borderline cases. | Simpler than an embedding pipeline, "good enough" accuracy, in-character recoverable when wrong. No biometric vendor, no extra GDPR-consent layer. |
| **D19** | **Operator-mediated reply policy**: Thora paraphrases operator replies in her own voice for logistical content (default); for emotional/personal replies, Enrique/Manuel message guests directly from their own WhatsApp numbers. Verbatim courier mode available when explicitly requested. Template T10 (`escalation_followup`) is a rarely-used Thora-flavored fallback for the CSW-closed edge case. | The "Thora always speaks as Thora" rule means we never paste a human's words verbatim by default; the two-channel approach preserves authenticity without losing fidelity for sensitive moments. |
| **D20** | **Album reveal moved to Sunday 20:00** Europe/Madrid (was 05:00). Brunch photos thus make it in. Operator does a 60-min moderation pass ~17:00–19:00. | Aligns with how Sunday actually unfolds (exhausted couple needs daylight to moderate; guests want photos shot at brunch to count); 20:00 is a contemplative wind-down hour for the reveal. |
| **D21** | **Several new wedding-day-specific templates** added beyond the original 10: bus-pickup early ping (14:00 Sat), bus-pickup last call (16:45 Sat), pre-wedding 9pm soft ping (Fri), amenities-at-cocktail summary (Sat ~20:30), pitonisa solo ping (Sat ~01:55). Plus per-guest arrival-day nudge (template per guest's arrival date). Original `menu_unlock` (T5) is **dropped**; menus are paper at-seat. | Wedding-specific operational moments need their own templates; pre-event reminders and just-in-time nudges are higher-leverage than generic 30-min-before reminders. |

## 5. Glossary

- **WABA** — WhatsApp Business Account. The Meta-side container for a phone number, templates, and Flows.
- **Cloud API** — WhatsApp Business Cloud API, hosted by Meta. The REST API we call.
- **Graph API** — Meta's overarching API; Cloud API endpoints live under `graph.facebook.com`.
- **Customer Service Window (CSW)** — 24-hour rolling window opened by an inbound user message. Inside CSW, free-form messages are allowed.
- **Template** — Pre-approved message used to initiate or re-initiate conversation outside the CSW. Categorized as Utility / Authentication / Marketing.
- **Flow** — Meta's multi-screen native form, defined in JSON, rendered inside WhatsApp.
- **Session message** / **service message** — A free-form message sent inside the CSW. Synonyms.
- **BSP** — Business Solution Provider (Twilio, 360dialog, etc.). Not used in this project — see D1.
- **Guest** — A person on the allowlist, identified by E.164 phone number.
- **Operator** — Enrique (and any helper given admin access). Receives escalations and uses the admin dashboard.
- **KB** — Knowledge base. The structured wedding info Claude is given as context.
- **CSW** — see Customer Service Window.

## 6. What this bot is NOT

To prevent scope creep during implementation. Anything in this list is intentionally excluded.

- ❌ A group chat replacement (impossible per platform — see D9).
- ❌ A general-purpose chatbot. **Scope is wedding-related questions + the curated Tarifa concierge layer (D17)**. Off-list off-topic questions are politely redirected.
- ❌ A payment processor or money handler.
- ❌ A travel booking engine. Thora may give info and offer personal-intro contacts (Tarifa guide §personal_intro), but **does not book** restaurants, lessons, taxis, or anything else. ("Sin pulgares no marco 🐾")
- ❌ A live data source. Thora has no real-time hours / availability / weather beyond the cached 30-min weather snapshot.
- ❌ A live photo feed (photos are private during event, public album reveal at 20:00 May 31 — D20).
- ❌ A replacement for the web admin dashboard (the bot extends it; existing dashboard remains primary).
- ❌ A replacement for the Flutter app's offline custom map (web Mapbox embed instead).
- ❌ A long-term chat history / memory product post-wedding (transcripts purged at 90 days — D15).

## 7. Status & next steps

Status as of 2026-05-07: **design phase complete (this doc tree).** Implementation has not started.

Next steps (see `bot/docs/implementation-plan.md` for full plan):

1. Operator (Enrique) starts Meta Business verification and provisions phone number — see `bot/docs/setup-guide.md`.
2. Implementing engineer/LLM reads the docs in the order in §3.
3. Day-1 deliverable: webhook scaffold receiving messages from Meta test number, replying with hardcoded text.

## 8. Open questions for the user

Items where a decision was deferred to the user. **Most of these were resolved in the 2026-05-14 design refinement session — see Answers below.**

| # | Question | Status | Resolution |
|---|---|---|---|
| Q1 | Is there a registered `Autónomo` or company name to use for Meta business verification, or do we use Enrique's personal name? | **OPEN** | Operator to confirm during setup. Default: personal name. |
| Q2 | Bot's WhatsApp display name? | ✅ resolved | **"Thora al habla"** — the bot speaks as Thora the dog (D16). |
| Q3 | Persona vibe? | ✅ resolved | **Thora persona**: warm, playful, food-obsessed, gluttonous, occasionally distracted, takes herself in third person sometimes; explicit "¡Guau! Soy Thora…" reveal on first contact; ~1-in-3 messages carry a doggy tic; sensitive contexts drop the gags entirely. See `02-conversation-design.md` and `couple-dossier.md`. |
| Q4 | Manual photo approval vs. auto-publish? | ✅ resolved | **Manual operator pass**, 60 min between ~17:00–19:00 Sunday; reveal at 20:00 Sunday (D20). |
| Q5 | Proactive outreach to non-RSVP guests? | ✅ resolved | Single onboarding broadcast at D-7 (preceded by a D-8 pilot to ~5 willing recipients); after that, opt-in only except for scheduled wedding-day templates. |
| Q6 | Excluded guests? | ✅ resolved | **No blanket exclusions** — all RSVP'd enrolled by default; individual opt-outs via "stop"; specific guests can be flagged in dashboard to silently route their inbound to escalation rather than reply. |
| Q7 | Multi-language scope? | ✅ resolved | **ES + EN only**. International guests are universally EN-comfortable at this proficiency level. |

### Additional answers from the 2026-05-14 design session

| Topic | Decision |
|---|---|
| Thora's voice positioning | Always speaks as herself, references her humans in third person ("mi humano Enrique…", "los novios…"). Never speaks *as* them. |
| Pre/post-Thora voice rule | Anything before late-2022 framed as hearsay ("eso me lo cuentan"); anything after, first-hand ("yo estaba allí"). Hard-coded per `couple-dossier.md` §3. |
| Operator-mediated replies | Two-channel: Thora paraphrases for logistical, humans message directly for personal (D19). |
| Bus pickup | Double-beat reminder: 14:00 + 16:45 Saturday. Missed-bus always escalates. |
| Taxi mechanic | Thora gives the number `956 230 762` formatted to be click-to-call. "Sin pulgares no marco" — guest dials. |
| Ceremony surprise (grooms from sea) | Strict tease pre-bus → "id mirando al mar" hint at boarding → full discussion only once shore is visible. |
| Musical bingo (post-dinner) | Open hint: "quedaos hasta el final de la cena, hay algo". |
| First-time dancing together | Open hint, not strict surprise. |
| Thora's whereabouts during cocktail→party | "iPad excuse" — she's been sent to the bedroom but the wifi reaches; gags dial down (a bit grumpy/quieter); perks back up post-party and at brunch. |
| Pre-wedding ping (Casa Explora) | 9pm-ish Friday, not the standard 30-min reminder. |
| Photos: vision + Thora-personality | Yes. Vision recognizes ~30 dossier'd guests; roast material gated by per-guest `safe_jokes`. |
| Photo consent | Already handled pre-event on the web. Bot does NOT trigger the consent flow. F5 dropped. |
| NSFW photo pre-filter | **No** — every photo goes to the moderation queue; operator rejects manually. |
| Song requests | Spotify playlist flow with Randy García the DJ. Thora moderates herself per `moderation_hints`; rejected requests are delegated to in-person ("díselo a mis humanos"). 3 requests max per guest; window 21:00–01:00 Saturday. |
| Tarifa concierge | All categories on (beaches, restaurants, kite/wind, water, sightseeing, day trips, whale watching, walking, nightlife, family). Both targeting modes (on-demand + proactive to early-arrivers). Personal-intro mode enabled. |
| Brunch attendance Flow | **Dropped** (F2). Loose paella gathering; web RSVP captures it. |
| Honeymoon | Off-limits. Thora doesn't share. |
| Identity question ("are you AI?") | Playful: "Pues mira, una perra escribiendo. Sí, soy yo 🐾". Never reveals as LLM. |
| Reactions (heart/thumbs) | Ignore silently. |
| 24/7 operations | Always-on, no quiet hours; tone shifts by time-of-day (sleepier at night, brighter morning). |
| High-urgency operator notification | WhatsApp message to Enrique's personal phone, Manuel as backup recipient. |
