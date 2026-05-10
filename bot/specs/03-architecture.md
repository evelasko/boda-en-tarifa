# Boda en Tarifa — WhatsApp Bot: Architecture

> System diagram, components, and runtime topology. The "engineering blueprint."

## 1. One-paragraph summary

A Firebase Cloud Function in `europe-west1` exposes an HTTPS webhook that Meta calls with WhatsApp events. The function deduplicates by message ID, looks up or creates a guest record in Firestore, classifies the event type (text / button / list / Flow submission / media / status), and routes to a handler. Conversational handlers compose a Claude turn (cached system prompt + KB + recent history + current input) with tool definitions, run the Claude API loop until a final assistant message, and send the result via the Meta Cloud API. Media inbound is fetched from Meta's media URL and uploaded to Cloudinary before storage. Outbound proactive messages (reminders, broadcasts) come from existing scheduled Cloud Functions, extended to dispatch via a shared `whatsapp-sender` service. All bot-related state lives in Firestore alongside existing wedding data; no new database is introduced.

## 2. System diagram

```
┌────────────┐   inbound    ┌──────────────────────────────────────────────┐
│ WhatsApp   │ ───────────► │ webhook  (HTTPS Cloud Function, eu-west1)    │
│ user       │              │                                              │
│ (Cloud API)│              │  1. verify HMAC signature                    │
│            │ ◄─────────── │  2. dedupe by message.id                     │
└────────────┘  outbound    │  3. classify event type                      │
       ▲                    │  4. route to handler                         │
       │                    └──────────────────────────────────────────────┘
       │                              │           │            │
       │                              ▼           ▼            ▼
       │            ┌─────────────────────┐  ┌─────────┐  ┌──────────┐
       │            │ conversation        │  │ media   │  │ flow     │
       │            │ handler             │  │ handler │  │ handler  │
       │            │  (Claude pipeline)  │  └─────────┘  └──────────┘
       │            └─────────────────────┘       │            │
       │                       │                  ▼            ▼
       │                       ▼            ┌──────────────────────┐
       │     ┌──────────────────────────┐   │  Firestore           │
       │     │ Claude API (Anthropic)   │   │  (guests, rsvp,      │
       │     │  - Sonnet 4.6 (main)     │   │   feed_posts, …)     │
       │     │  - Haiku 4.5 (cheap)     │   └──────────────────────┘
       │     │  - prompt caching        │            ▲
       │     └──────────────────────────┘            │
       │                       │                     │
       │                       ▼                     │
       │            ┌─────────────────────┐          │
       │            │ tool layer          │ ─────────┘
       │            │ (typed services)    │
       │            └─────────────────────┘
       │                       │
       │                       ▼
       │            ┌─────────────────────┐    ┌──────────────────┐
       └────────────│ whatsapp-sender     │    │ Cloudinary       │
                    │ (Meta Cloud API)    │    │ (media storage)  │
                    └─────────────────────┘    └──────────────────┘
                              ▲
                              │ proactive sends
                              │
                    ┌─────────────────────┐
                    │ scheduled functions │
                    │  - sendEventReminder│
                    │  - contentUnlock    │
                    │  - filmDeveloped    │
                    │  - admin broadcast  │
                    └─────────────────────┘
                              ▲
                              │
                    ┌─────────────────────┐
                    │ Next.js admin       │
                    │ (web/) — Bot pages  │
                    └─────────────────────┘
```

## 3. Runtime stack

| Layer | Technology | Notes |
|---|---|---|
| Compute | Firebase Cloud Functions Gen2 | Reuses existing `functions/` project. Region `europe-west1` for proximity to Meta EU and Firestore. |
| Language | TypeScript 5.7 | Matches existing functions. Strict mode. |
| Node | 24 (per `functions/package.json`) | |
| Database | Cloud Firestore | Single instance shared with web. |
| Secrets | Firebase Functions secrets (`firebase functions:secrets:set`) | No `.env` in production. |
| Media storage | Cloudinary | Already configured in `web/`; reuse. |
| LLM | Anthropic Claude API | Sonnet 4.6 main; Haiku 4.5 routing. SDK: `@anthropic-ai/sdk`. |
| WhatsApp | Meta Cloud API | Direct. No BSP. |
| Webhook auth | HMAC-SHA256 with `X-Hub-Signature-256` | Verified on every request. |
| Logging | Cloud Logging (structured JSON) + Firestore audit trail | |
| Monitoring | Cloud Monitoring + admin dashboard "Bot Health" page | |

## 4. Component inventory

Components live under `functions/src/bot/` (a new sibling to existing `auth/`, `camera/`, `config/`, `notifications/`).

```
functions/src/bot/
├── index.ts                # exports: webhook, scheduled re-bindings
├── webhook/
│   ├── handler.ts          # HTTPS entry, sig verify, dedupe, route
│   ├── verify.ts           # HMAC + Meta hub.challenge handshake
│   ├── dedupe.ts           # idempotency via Firestore
│   └── classify.ts         # event-type discrimination
├── handlers/
│   ├── conversation.ts     # text + button + list inbound → Claude
│   ├── media.ts            # image / video / audio / document inbound
│   ├── flow.ts             # Flow submission inbound
│   ├── status.ts           # delivery / read receipts
│   └── command.ts          # explicit commands (stop, help, ?)
├── claude/
│   ├── pipeline.ts         # orchestrates a turn (system + KB + history + tools)
│   ├── system-prompt.ts    # static + cached portions
│   ├── tools.ts            # tool definitions (JSONSchema)
│   ├── kb.ts               # knowledge-base assembly + cache invalidation
│   └── language.ts         # Haiku-based language detection
├── services/               # the tool layer — typed wrappers around Firestore + APIs
│   ├── guests.ts
│   ├── events.ts
│   ├── venues.ts
│   ├── rsvp.ts
│   ├── seating.ts
│   ├── menu.ts
│   ├── weather.ts
│   ├── photos.ts
│   ├── escalation.ts
│   └── audit.ts
├── whatsapp/               # Meta Cloud API client
│   ├── client.ts           # axios/fetch wrapper, retry, rate limit
│   ├── send.ts             # typed send functions (text, buttons, list, template, flow, location, image)
│   ├── media.ts            # download from media ID
│   ├── templates.ts        # template registry (matches 05-message-templates.md)
│   └── flows.ts            # flow registry (matches 06-whatsapp-flows.md)
├── broadcast/
│   ├── dispatch.ts         # admin broadcast worker
│   └── audience.ts         # audience selection logic
├── scheduled/              # extensions/replacements for existing scheduled funcs
│   ├── eventReminder.ts
│   ├── contentUnlock.ts
│   └── filmDeveloped.ts
├── conversation/
│   ├── state.ts            # CSW tracking, history fetch/save
│   └── ratelimit.ts        # per-user message rate limit
├── allowlist.ts            # phone allowlist enforcement
└── lib/
    ├── phone.ts            # E.164 normalization
    ├── i18n.ts             # ES/EN selection helpers
    └── time.ts             # date formatting (Europe/Madrid)
```

## 5. Data flow walkthroughs

### 5.1 Inbound text message → conversational reply

1. **Meta** POSTs `/whatsapp-webhook` with payload containing `messages[0]` of `type: "text"`.
2. **`webhook/handler.ts`** reads raw body, calls `verify.ts` to check `X-Hub-Signature-256`. On failure → 401, log.
3. Calls `dedupe.ts` to atomically claim `bot_dedupe/{message.id}`. If already claimed → 200 OK, no work.
4. Calls `classify.ts` → returns `{kind: 'conversation', message: {...}, contact: {...}}`.
5. Calls `conversation.ts` handler:
    1. **Allowlist check** (`allowlist.ts`): if phone not in `guests/`, write `bot_unknown_inbound`, send polite refusal, return.
    2. **Rate limit check** (`conversation/ratelimit.ts`): if exceeded, send throttle message, return.
    3. **Load guest doc** (`services/guests.ts`).
    4. **Detect language** if missing (`claude/language.ts` → Haiku call). Persist.
    5. **Open/refresh CSW** (`conversation/state.ts`): set `lastInboundAt = now`.
    6. **Load history** (`conversation/state.ts`): last 8 turns from `bot_conversations/{phone}/messages/`.
    7. **Build Claude request** (`claude/pipeline.ts`):
        - System prompt (cached, see §6.1).
        - Tools (cached, see §6.2).
        - User content: last-8-turns history + current message.
    8. **Run Claude loop**:
       - Call API with `cache_control: {type: "ephemeral"}` on KB blocks.
       - If response contains `tool_use`, execute tool via `services/`, append `tool_result`, call again.
       - Max 5 tool calls per turn.
       - When final `assistant` message arrives → done.
    9. **Send reply** (`whatsapp/send.ts`): typed wrapper picks the right Cloud API call (text vs interactive vs Flow trigger) based on Claude's structured output.
    10. **Log** (`services/audit.ts`): write `bot_conversations/{phone}/messages/{id}` for both inbound and outbound.
6. Return 200 to Meta.

End-to-end p50 latency target: <5s. p95: <15s.

### 5.2 Inbound media (photo)

1. Steps 1–4 as above; classify returns `{kind: 'media'}`.
2. **`media.ts`**:
    1. Allowlist + rate limit (same).
    2. Fetch media URL from Meta Graph API: `GET /{media-id}` → `url` → `GET {url}` (binary, with auth). Implemented in `whatsapp/media.ts`.
    3. Upload to Cloudinary unsigned preset `wedding_photos_pending`. Captures public_id, width/height, format.
    4. Write `feed_posts/{auto-id}` with: `guestId, source: 'whatsapp', cloudinaryPublicId, status: 'pending_moderation', consent: <guest.photoConsent or 'pending'>, createdAt, weddingDay`.
    5. If `consent === 'pending'`: trigger `photo_consent` Flow once per guest (idempotent).
    6. Send acknowledgement (text reply per G8 in `02-conversation-design.md`).
    7. Log inbound to `bot_conversations`.

### 5.3 Inbound Flow submission

1. Meta sends `interactive.type === 'nfm_reply'` with `response_json` (parsed Flow data).
2. `flow.ts` handler:
    1. Parse `flow_token` to identify which Flow + which guest.
    2. Validate response shape against the Flow's schema (in `whatsapp/flows.ts`).
    3. Dispatch to handler per Flow type:
       - RSVP → write to `rsvp_responses/{guestId}` (mirror web schema).
       - Brunch → write to `rsvp_responses/{guestId}.events.brunch`.
       - Song request → push to `song_requests/{auto-id}`.
       - Photo consent → update `guests/{guestId}.photoConsent`.
       - Logistics intake → update `guests/{guestId}.logistics`.
       - Feedback → write to `bot_feedback/{auto-id}`.
    4. Send a confirmation session message to the guest.
    5. Log.

### 5.4 Outbound proactive (event reminder)

1. **Scheduled function** `eventReminder` fires (cron, every 5 min).
2. Queries `events` collection for any event in the next 30–35 min window.
3. For each matching event:
    1. Get audience (default: all guests with `botEnrolled=true` and matching event participation).
    2. For each guest: check `bot_send_log` for prior `event_reminder_30min` for `(eventId, guestId)`. If exists, skip.
    3. Build template payload (`whatsapp/templates.ts`) with guest's language variant.
    4. Send via `whatsapp/send.ts`. Persist `bot_send_log` entry.
    5. Rate limit globally (1 send / 50ms) to stay under Meta tier limits.

### 5.5 Outbound admin broadcast

1. Operator submits broadcast in admin dashboard → `web/` calls a Firebase Callable Function `botBroadcast` (in `functions/src/bot/broadcast/dispatch.ts`).
2. Function authenticates via Firebase Admin SDK (operator must be in `admins` collection).
3. Validates: template exists & approved, audience non-empty, rate-limit budget available.
4. Writes a `bot_broadcasts/{id}` doc with status `running`.
5. Iterates audience, sends each. Updates the doc with progress.
6. On completion, writes status `completed` with success/failure counts.

## 6. Key cross-cutting concerns

### 6.1 Claude prompt caching

The system prompt is layered:

1. **Static persona block** (~1.5k tokens) — `cache_control: ephemeral`.
2. **KB block** (~8k tokens, generated from Firestore content) — `cache_control: ephemeral`.
3. **Tool definitions** (~2k tokens) — `cache_control: ephemeral`.
4. **Per-guest context** (~200 tokens — name, language, RSVP status) — NOT cached.
5. **History window + current turn** — NOT cached.

Cache TTL is 5 minutes (Anthropic ephemeral cache). To keep warm during peak event windows, a scheduled `keep-warm` function runs a tiny "ping" call to Claude every 4 minutes during 2026-05-29 → 2026-05-31. Disabled outside the event window.

KB invalidation: if any source-of-truth Firestore doc changes (events, venues, content), a Firestore trigger writes `bot_kb_version` doc with new timestamp. The pipeline reads `bot_kb_version` and includes it as part of the KB block hash; Anthropic detects the change and busts cache automatically.

### 6.2 Tool definitions

Defined in `claude/tools.ts` as JSONSchema. The set is intentionally small to keep Claude focused. See `07-knowledge-base.md` for the full list and signatures. Tools are registered as `@anthropic-ai/sdk` tool objects; results are returned as JSON strings; failures return `{error: "...", retry: false}` so Claude can choose to apologize gracefully.

### 6.3 Rate limiting

Three layers:

| Layer | Limit | Behavior on exceed |
|---|---|---|
| Per-user inbound (`conversation/ratelimit.ts`) | 30 messages / 5min sliding window | Send throttle message once, drop subsequent for 60s. |
| Global outbound | 20 messages/sec (well under Meta's burst limits at any tier) | Queue; backoff. |
| Claude API | Anthropic SDK retry; max 3 retries with exponential backoff | If all fail, send fallback message. |

Implemented with Firestore atomic increments on a 5-minute bucket key (`bot_rate/{phone}/{bucket}`). TTL 1 hour via Firestore TTL field.

### 6.4 Idempotency

All inbound deduplicated by Meta `message.id` via `bot_dedupe/{message.id}` Firestore doc with TTL 1 day. Atomic claim using Firestore `create()` (fails if exists).

All outbound broadcasts deduplicated by `(broadcastId, guestId)` in `bot_send_log`.

All scheduled reminders deduplicated by `(eventId, guestId, reminderType)`.

### 6.5 Error handling philosophy

- **Webhook always returns 200** within 10s (Meta retry threshold). If processing fails, ack and async-retry from logs.
- **User-visible errors** are warm and short. No stack traces, no codes.
- **Operator-visible errors** in admin dashboard with full stack + request ID.
- **Cloud Logging** is the canonical place for raw errors. Each inbound has a request ID propagated through all layers.

### 6.6 Observability

Every handler emits structured logs with:

- `requestId` (UUID per inbound webhook call)
- `phone` (last 4 digits only in logs; full only in audit collection)
- `guestId`
- `kind` (event type)
- `latencyMs` (per stage: verify, dedupe, claude, send)
- `claudeUsage` (input/output/cache_read/cache_write tokens)
- `outcome` (`replied | escalated | refused | rate_limited | error`)

Daily and per-event aggregates rendered on the admin "Bot Health" page (`web/src/app/admin/bot/health/page.tsx`).

### 6.7 Configuration

Three sources, in precedence order (highest first):

1. **Firebase Remote Config** — for hot-tunable values (e.g. rate-limit thresholds, escalation toggles).
2. **Firestore `config/bot`** doc — for content-like values (greeting copy, fallback messages).
3. **Code constants** in `bot/lib/config.ts` — for defaults.

Secrets are NOT in Remote Config or Firestore. Secrets only in Functions secrets manager.

## 7. Deployment topology

### Environments

| Env | Purpose | Phone number | Anthropic key | Firebase project |
|---|---|---|---|---|
| `dev` | Local + emulator dev | Meta test number | `dev` Anthropic key | Firebase emulator suite |
| `staging` | Pre-prod testing on real Meta WABA | Real WABA, test recipients only | Same as prod, separate project | `boda-tarifa-staging` |
| `prod` | Live wedding | Real WABA | Anthropic prod key | `boda-tarifa-prod` |

### Functions

All bot Cloud Functions:

- Region: `europe-west1`
- Runtime: Node 24, 1GB memory, 60s timeout (webhook); 540s for broadcast worker.
- Min instances: 0 default; **scale to 5 min instances during 2026-05-28 → 2026-06-01** to avoid cold starts during the event.
- Max instances: 50 (well above expected load of ~5 concurrent).

### Secrets

Set via `firebase functions:secrets:set <NAME>`:

| Secret | Purpose |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Meta system-user token, scoped to WABA. |
| `WHATSAPP_APP_SECRET` | For HMAC verification of webhooks. |
| `WHATSAPP_VERIFY_TOKEN` | For Meta's GET handshake on webhook setup. |
| `WHATSAPP_PHONE_NUMBER_ID` | Numeric ID of the bot's phone number on Meta side. |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | WABA ID. |
| `ANTHROPIC_API_KEY` | Claude API key. |
| `CLOUDINARY_API_SECRET` | Already exists; reused. |

Public (non-secret) config like `CLOUDINARY_CLOUD_NAME` lives in Firebase Functions params (`defineString`).

## 8. Scaling expectations

| Vector | Expected peak | Provisioning |
|---|---|---|
| Inbound msg/min | ~30 (event-day evening surge) | 1 instance handles ~600/min easily; default 5 min instances during event. |
| Outbound broadcast burst | 150 sends in <5s (utility templates) | Sender queues at 20/s; total ~8s. Within Meta tier limits. |
| Claude calls/min | ~30 | No concern. |
| Firestore reads/turn | ~10 | KB read is the heaviest; cached in-memory per function instance for 60s. |
| Cloudinary uploads | ~50/h during reception | Asynchronous; not on hot path. |

Cost projection (full event):

- Meta utility templates: ~1500 sends × €0.04 ≈ **€60**.
- Meta service messages (inbound replies): mostly free in Spain post-2025-07.
- Anthropic: ~3000 turns × ~1k uncached tokens / turn (cached system handles bulk) ≈ **€10–25**.
- Cloudinary: free tier sufficient.
- Firebase Functions: well under free tier.
- Total event: **<€100** expected.

## 9. Failure modes & continuity

| Mode | Detection | Recovery |
|---|---|---|
| Webhook returns 5xx | Cloud Logging error rate alert | Meta retries up to ~24h. Operator notified. |
| Claude API outage | 3 retries fail | Fallback message to user; event logged; ops paged. |
| Meta Cloud API outage | Send fails after retries | Queue in `bot_outbound_pending` collection; resume when API healthy. |
| Firestore outage (region-wide) | Functions fail | Out of scope; Firebase SLA. Operator falls back to manual phone calls (runbook). |
| WABA quality drop / rate restriction | Meta sends `account_update` event to webhook | Auto-throttle; alert operator. |
| Phone number flagged | Meta sends notification | Operator escalates to Meta support; switch to backup number if provisioned. |
| Cloudinary outage | Upload fails | Bot replies "I got your photo but it didn't save — please resend" and queues retry. |

## 10. Local development & testing

See `bot/docs/developer-guide.md` for full instructions. Highlights:

- Firebase emulator for Functions + Firestore.
- Meta test number for true E2E (5 destination phones max).
- A `simulate-webhook.ts` script that crafts realistic webhook payloads for offline tests.
- Jest unit tests for tool layer; integration tests using emulator + recorded fixtures.
- Conversation eval harness running golden examples through the real Claude pipeline (gated behind `RUN_LIVE_EVALS=1` to control cost).

## 11. Open architectural questions

| # | Question | Default |
|---|---|---|
| AQ1 | Should we use `firebase-functions/v2/https` (Gen2) or stick with v1? | **Gen2** — better cold-start perf, region-pinning. |
| AQ2 | Anthropic SDK in functions: bundle or import dynamically? | Bundle. ~3MB acceptable. |
| AQ3 | Should KB regeneration be event-driven (Firestore trigger) or pull-on-read with TTL? | **Event-driven** — fewer stale reads, cleaner cache invalidation. |
| AQ4 | Operator's reply forwarding: same WABA number or separate "operator number"? | Same WABA, prefixed `*Enrique:* «...»` per G14 in conversation design. |
| AQ5 | Should we record raw inbound media in Cloud Storage (in addition to Cloudinary) for safety? | **No** — Cloudinary is durable enough; minimize copies. |
| AQ6 | How long do we keep the `bot_dedupe` keys? | 24h TTL via Firestore TTL field. |
