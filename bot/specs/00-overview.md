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
| `02-conversation-design.md` | Persona, voice, intents, escalation, multilingual handling, golden examples. |
| `03-architecture.md` | System diagram, components, runtime, deployment topology. |
| `04-data-model.md` | Firestore schema (new + extended), conversation state, indices. |
| `05-message-templates.md` | All Meta templates: name, category, copy ES/EN, variables, triggers. |
| `06-whatsapp-flows.md` | All Flows: screen-by-screen JSON, validation, submission handling. |
| `07-knowledge-base.md` | Sources of truth, Claude prompt structure, caching, tool calls. |
| `08-integration-contract.md` | Webhook contract, internal APIs, scheduled triggers, web admin extensions. |
| `09-security-privacy.md` | Auth, HMAC verification, secrets, PII, GDPR, abuse prevention. |

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
| D3 | **Claude Sonnet 4.6** for primary conversation; **Claude Haiku 4.5** for cheap classification (intent routing, language detection). | Sonnet quality for guest-facing replies; Haiku at ~10× cheaper for routing. |
| D4 | **Anthropic prompt caching** with the wedding knowledge base in the cached system prompt. | KB is large (~10k tokens) and identical across every guest turn. Without caching this is the dominant cost. |
| D5 | **Bot uses a dedicated phone number**, not Enrique's personal. | Personal number cannot be reused (consumer WhatsApp would have to be deactivated). Fresh SIM is ~€10. |
| D6 | **Bilingual ES/EN, auto-detected from first message** and persisted on guest profile; mid-conversation language switch is mirrored. | Most guests are Spanish-speaking but a meaningful minority are international. |
| D7 | **Bot RSVP Flow writes to the same `rsvp_responses` Firestore collection** as the existing web RSVP. Single source of truth. | Avoids divergence; existing admin dashboard already reads this collection. |
| D8 | **Photos sent to bot are stored privately during the event** and made public on the web album at `triggerFilmDevelopment` time (05:00 May 31). | Preserves the "film developed" emotional reveal. |
| D9 | **No groups.** All guest interactions are 1:1. Anything group-shaped lives on the web. | WhatsApp Cloud API does not support group messaging; this is a hard platform constraint. |
| D10 | **TypeScript everywhere**, Node 24, matching existing `functions/` conventions. | Existing codebase is TS Node 24; consistency. |
| D11 | **Firestore is the single source of truth** for content (itinerary, venues, FAQ). Remote Config mirrors it for hot updates. | Already wired this way for the web; bot reuses. |
| D12 | **Dedup inbound messages by Meta `message.id`** before processing. Meta retries the webhook on slow responses; idempotency is required. | Prevents double-replies, double-saves, and double Claude charges. |
| D13 | **Per-guest rate limit: 30 inbound messages / 5 minutes.** Exceeded → throttle reply with a polite "give me a moment" and pause Claude calls. | Cheap insurance against runaway loops, accidental media spam, or hostile use. |
| D14 | **All bot writes pass through a typed service layer** (`bot/services/`) — Claude never writes directly to Firestore. Tool calls are typed and audited. | Auditability, testability, and safety. |
| D15 | **Conversation transcripts are retained for 90 days post-wedding** (until 2026-08-31), then purged. Aggregated/anonymized analytics retained indefinitely. | GDPR minimization. Long enough for operator review and "lessons learned"; not indefinite. |

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
- ❌ A general-purpose chatbot (it answers wedding-related questions only; politely redirects off-topic).
- ❌ A payment processor or money handler.
- ❌ A travel booking engine (it links out to existing accommodation/transport info on the web).
- ❌ A live photo feed (photos are private during event, public album reveal post-event).
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

Items where a decision is deferred to the user. Each blocks a specific later choice.

| # | Question | Blocks |
|---|---|---|
| Q1 | Is there a registered `Autónomo` or company name to use for Meta business verification, or do we use Enrique's personal name? | `setup-guide.md` step 1. Verification path differs. |
| Q2 | Should the bot's WhatsApp display name be "Boda Enrique & Manuel", "Boda en Tarifa", or something else? | Template approvals carry the display name; lock it before submitting. |
| Q3 | Is there a preferred greeting phrase / inside-joke / vibe to seed the persona? (E.g. "the unofficial wedding concierge, slightly camp, mostly helpful".) | `02-conversation-design.md` voice section. |
| Q4 | Is the operator OK with manually approving/curating photos before public reveal, or should reveal be automatic at 05:00 May 31? | `05-message-templates.md` `film_developed` trigger. |
| Q5 | Should the bot proactively reach out to non-RSVP'd guests, or only respond to first contact? | `05-message-templates.md` onboarding template. |
| Q6 | Any guests who should be **excluded** from the bot (e.g. very elderly relatives who'd be confused, or VIPs handled directly by the couple)? | Guest model `botEnrolled` flag. |
| Q7 | Multi-language scope: ES + EN only, or also FR / DE / IT / PT? | `02-conversation-design.md`, all templates need approved variants per language. |

Defaults assumed in the docs if no answer comes back:
- Q1: personal name (slower path, may need follow-up docs to Meta).
- Q2: "Boda en Tarifa".
- Q3: warm, slightly playful, intimate; low emoji density.
- Q4: manual approval (operator clicks "publish" in admin dashboard for the album reveal).
- Q5: opt-in only — bot waits for first guest contact, except for one explicit onboarding broadcast.
- Q6: all RSVP'd guests enrolled; opt-out via "stop" command.
- Q7: ES + EN only at launch.
