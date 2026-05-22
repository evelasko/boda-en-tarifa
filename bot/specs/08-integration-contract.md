# Boda en Tarifa — WhatsApp Bot: Integration Contract

> All interfaces between the bot, Meta, the existing Firebase backend, the existing Next.js admin, and external services. This is the document for "what calls what, with what shape."

## 1. Webhook contract (Meta → Bot)

### 1.1 Endpoint

`POST https://europe-west1-{project}.cloudfunctions.net/whatsappWebhook`

Configured in Meta Business Suite → WhatsApp Manager → Configuration → Webhook URL. Subscribed events:

- `messages` (required)
- `message_template_status_update` (optional, for monitoring approvals)
- `account_update` (optional, for quality changes)
- `phone_number_quality_update` (optional)

### 1.2 GET handshake

Meta's initial subscription verification:

```
GET /whatsappWebhook?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>
```

Bot must return the `hub.challenge` body with `200 OK` if `hub.verify_token === WHATSAPP_VERIFY_TOKEN`. Otherwise `403`.

### 1.3 POST inbound payload (typical text message)

Meta's payload (abridged — full schema at developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples):

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "<WABA_ID>",
    "changes": [{
      "field": "messages",
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "+34900...",
          "phone_number_id": "<PHONE_NUMBER_ID>"
        },
        "contacts": [{
          "profile": { "name": "María García" },
          "wa_id": "34612345678"
        }],
        "messages": [{
          "from": "34612345678",
          "id": "wamid.HBgL...",
          "timestamp": "1748520000",
          "type": "text",
          "text": { "body": "¿a qué hora es la ceremonia?" }
        }]
      }
    }]
  }]
}
```

For other message types, `messages[0]` contains:

| Type | Discriminator | Useful fields |
|---|---|---|
| Text | `type: "text"` | `text.body` |
| Image | `type: "image"` | `image.id`, `image.mime_type`, `image.caption?` |
| Video | `type: "video"` | `video.id`, `video.mime_type` |
| Audio | `type: "audio"` | `audio.id`, `audio.mime_type`, `audio.voice` |
| Document | `type: "document"` | `document.id`, `document.filename` |
| Sticker | `type: "sticker"` | `sticker.id` |
| Location | `type: "location"` | `location.latitude`, `location.longitude` |
| Contacts | `type: "contacts"` | `contacts[]` |
| Reaction | `type: "reaction"` | `reaction.message_id`, `reaction.emoji` |
| Button reply | `type: "interactive"`, `interactive.type: "button_reply"` | `interactive.button_reply.id`, `.title` |
| List reply | `type: "interactive"`, `interactive.type: "list_reply"` | `interactive.list_reply.id`, `.title`, `.description` |
| Flow submission | `type: "interactive"`, `interactive.type: "nfm_reply"` | `interactive.nfm_reply.response_json`, `.body` |

### 1.4 Status updates

Meta also sends delivery/read receipts:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "statuses": [{
          "id": "wamid.HBgL...",
          "status": "delivered",
          "timestamp": "1748520010",
          "recipient_id": "34612345678",
          "conversation": { "id": "..." },
          "pricing": { "billable": true, "category": "utility", "pricing_model": "PMP" }
        }]
      }
    }]
  }]
}
```

The bot updates `bot_send_log` accordingly.

### 1.5 Bot's response

Always `200 OK` within 10s, regardless of internal success/failure. If processing fails, log it and async-handle from logs / `bot_outbound_pending`. Never let an exception bubble to the HTTP layer with a 5xx response — Meta will retry, causing duplicate processing.

### 1.6 Signature verification

Meta sends `X-Hub-Signature-256: sha256=<hex>` header. Compute HMAC-SHA256 over the **raw request body** using `WHATSAPP_APP_SECRET`. Compare in constant time. On mismatch → 401, log, no processing.

```ts
import * as crypto from 'crypto';

function verifySignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signatureHeader.slice('sha256='.length);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(provided, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```

Note: Firebase Functions Gen2 with `onRequest` exposes raw body via `req.rawBody`. Use that, not the parsed body.

## 2. Outbound contract (Bot → Meta)

All sends go through `bot/whatsapp/send.ts`, which wraps the Graph API.

### 2.1 Base URL

`https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages`

(API version pinned in `bot/whatsapp/client.ts`. Update annually.)

### 2.2 Auth

Header: `Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}`.

### 2.3 Send payloads (canonical examples)

#### Text

```json
{
  "messaging_product": "whatsapp",
  "to": "34612345678",
  "type": "text",
  "text": { "body": "La ceremonia es el sábado 30 de mayo a las 18:00." }
}
```

#### Reply buttons

```json
{
  "messaging_product": "whatsapp",
  "to": "34612345678",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "¿Te mando la ubicación?" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "yes_pin", "title": "Sí, gracias" } },
        { "type": "reply", "reply": { "id": "no_pin",  "title": "No hace falta" } }
      ]
    }
  }
}
```

#### List

```json
{
  "messaging_product": "whatsapp",
  "to": "34612345678",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": { "type": "text", "text": "Te puedo ayudar con…" },
    "body":   { "text": "Elige una opción" },
    "footer": { "text": "Boda en Tarifa" },
    "action": {
      "button": "Ver opciones",
      "sections": [{
        "title": "Logística",
        "rows": [
          { "id": "schedule",     "title": "📅 Programa" },
          { "id": "venues",       "title": "📍 Ubicaciones" },
          { "id": "accommodation","title": "🛏️ Alojamiento" },
          { "id": "dress_code",   "title": "👗 Vestimenta" }
        ]
      },{
        "title": "Acciones",
        "rows": [
          { "id": "rsvp",        "title": "✅ Confirmar" },
          { "id": "song",        "title": "🎵 Pedir canción" }
        ]
      }]
    }
  }
}
```

#### Location

```json
{
  "messaging_product": "whatsapp",
  "to": "34612345678",
  "type": "location",
  "location": {
    "latitude": 36.0143,
    "longitude": -5.6044,
    "name": "Iglesia de Tarifa",
    "address": "Plaza de la Iglesia, Tarifa"
  }
}
```

#### Image (attachment)

```json
{
  "messaging_product": "whatsapp",
  "to": "34612345678",
  "type": "image",
  "image": {
    "link": "https://res.cloudinary.com/.../map.jpg",
    "caption": "Mapa de la zona"
  }
}
```

#### Template

```json
{
  "messaging_product": "whatsapp",
  "to": "34612345678",
  "type": "template",
  "template": {
    "name": "event_reminder_30min_es",
    "language": { "code": "es_ES" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Cena de bienvenida" },
          { "type": "text", "text": "Restaurante La Caracola" },
          { "type": "text", "text": "20:30" }
        ]
      }
    ]
  }
}
```

#### Flow trigger (session message inside CSW)

See `06-whatsapp-flows.md` §5.2 for the canonical payload.

### 2.4 Response handling

Successful send returns:

```json
{
  "messaging_product": "whatsapp",
  "contacts": [{ "input": "34612345678", "wa_id": "34612345678" }],
  "messages": [{ "id": "wamid.HBgL...", "message_status": "accepted" }]
}
```

Bot stores `messages[0].id` as `metaMessageId` on the outbound `bot_conversations/.../messages` record.

Errors:

```json
{
  "error": {
    "message": "(#131026) Message Undeliverable",
    "type": "OAuthException",
    "code": 131026,
    "error_data": { "messaging_product": "whatsapp", "details": "..." },
    "fbtrace_id": "..."
  }
}
```

Common error codes worth handling specifically:

| Code | Meaning | Bot action |
|---|---|---|
| `131026` | Message undeliverable (user has WhatsApp issue) | Log, mark `bot_send_log.status: failed`, no retry |
| `131047` | Re-engagement message — outside CSW | Switch to template path |
| `131051` | Unsupported message type | Log, fallback to text |
| `131056` | Pair rate limit | Backoff, retry once |
| `132000` | Template parameter mismatch | Bug — log loudly, alert operator |
| `190` | Token expired | Refresh token (manual op), alert operator |
| Network / 5xx | Transient | Retry up to 3× exp backoff, then queue in `bot_outbound_pending` |

## 3. Internal Firebase Cloud Functions API

Three categories: HTTP webhooks (Meta-facing), Callable (admin-facing), Scheduled (cron-driven). Below: only those new to / modified for the bot.

### 3.1 HTTP webhooks

| Function | Method | Path | Auth | Purpose |
|---|---|---|---|---|
| `whatsappWebhook` | GET / POST | `/whatsappWebhook` | HMAC + verify token | Meta inbound |

### 3.2 Callable functions (Firebase Callable, called from web admin)

All require `request.auth.uid` to exist and that uid to be in `admins/{uid}` (otherwise throw `functions.https.HttpsError('permission-denied')`).

| Name | Input | Output | Purpose |
|---|---|---|---|
| `botSendBroadcast` | `{ templateName, variables, audience, dryRun? }` | `{ broadcastId, audienceCount }` | Operator initiates a broadcast |
| `botCancelBroadcast` | `{ broadcastId }` | `{ ok: true }` | Cancel a running broadcast |
| `botReplyToEscalation` | `{ escalationId, replyText, closeAfter? }` | `{ ok: true, sentVia: 'session' \| 'template' }` | Operator replies; bot routes via session or template |
| `botResolveEscalation` | `{ escalationId, notes? }` | `{ ok: true }` | Mark escalation resolved without reply |
| `botAddToAllowlist` | `{ phone, firstName?, language? }` | `{ guestId }` | Operator manually adds a guest from unknown-inbound |
| `botRebuildKb` | `{}` | `{ version, hash }` | Force KB rebuild (debug) |
| `botSimulateInbound` | `{ phone, text, type? }` | `{ replyText? }` | Dev/staging only — simulates a message for testing |

### 3.3 Scheduled functions

All in `functions/src/bot/scheduled/`. Cron expressions in Europe/Madrid.

| Function | Schedule | Purpose |
|---|---|---|
| `botEventReminderTick` | `*/5 * * * *` | Look 30 min ahead, send `event_reminder_30min` for matching events |
| `botContentUnlockTick` | `*/5 * * * *` | Send `seating_unlock`/`menu_unlock` when unlock time passes |
| `botFilmDeveloped` | `0 5 31 5 *` (05:00 May 31 2026) | Flip album public + send `film_developed` to all |
| `botWeatherMorningBrief` | `0 8 29-31 5 *` | 08:00 each event day, send `weather_morning_brief` |
| `botKeepKbWarm` | `*/4 28-31 5 *` (every 4 min, May 28-31) | Anthropic prompt-cache keep-warm |
| `botRetryOutboundPending` | `*/5 * * * *` | Drain `bot_outbound_pending` |
| `botPurgeExpiredMessages` | `0 3 * * *` | Daily 03:00 — delete messages older than retention window |

### 3.4 Firestore triggers

| Trigger | Path | Purpose |
|---|---|---|
| `onContentChangeBuildKb` | `events/{id}`, `venues/{id}`, `faq/{id}`, `time_gated_content/{id}`, `config/{id}` | Bumps `bot_kb_version` |

## 4. Existing functions — extensions

The bot reuses three existing **Gen2** scheduled functions instead of replacing them. The web project owns the originals; the bot owns the WhatsApp dispatch path.

| Existing | Bot extension |
|---|---|
| `sendEventReminder` | Renamed to `botEventReminderTick`; adds WhatsApp template send. The original FCM push path is removed (no app to push to). |
| `sendContentUnlockNotification` | Renamed to `botContentUnlockTick`; adds WhatsApp send. |
| `triggerFilmDevelopment` | Adds the `film_developed` template send + flips `config/album.public`. |

### 4.1 Retired guest-auth Cloud Functions (2026-05)

The following were **removed** from `functions/src/index.ts` because guest access is **WhatsApp-only** (phone allowlist on `guests/{id}`, see `functions/src/bot/allowlist.ts`). They are not required for Thora or for event-optimization deploys (Gen2 `minInstances` / CPU on `whatsappWebhook`).

| Removed | Former role | Replacement |
|---|---|---|
| `onUserCreate` | Firebase Auth `onCreate` → custom claims + `profileClaimed` | Not used by bot. Optional legacy app auth only. |
| `generateMagicLink` | Callable minting magic-link tokens | Web admin: `POST /api/admin/guests/{uid}/magic-link` (Next.js Admin SDK). Bulk: `scripts/generate-magic-links.ts`. |
| `cleanupExpiredMagicLinks` | Scheduled cleanup of unauthorized Auth users | Drop with guest Auth; no bot dependency. |

**Guest allowlist for the bot:** `guests` document exists with E.164 `phone` and `botEnrolled !== false`. Operators add phones via **`botAddToAllowlist`** (callable, §3.2) or Firestore admin / import — not via Auth triggers.

## 5. Web admin extensions (Next.js)

Add a new top-level admin section: `/admin/bot/`.

### 5.1 Pages

```
web/src/app/admin/bot/
├── layout.tsx            # nav with sub-pages, requires admin auth
├── page.tsx              # dashboard / health
├── conversations/
│   ├── page.tsx          # list of recent conversations
│   └── [phone]/page.tsx  # single conversation thread + reply box
├── escalations/
│   ├── page.tsx          # open escalations queue
│   └── [id]/page.tsx     # single escalation, reply UI
├── broadcasts/
│   ├── page.tsx          # past broadcasts + create new
│   └── new/page.tsx      # composer (template picker, audience picker, preview, send)
├── templates/page.tsx    # read-only list of templates and approval status
├── flows/page.tsx        # read-only list of flows and Meta IDs
├── unknown-inbound/page.tsx  # phones not on allowlist
├── faq/                  # CRUD on faq collection
│   ├── page.tsx
│   └── [id]/page.tsx
└── settings/page.tsx     # config/bot doc editor
```

### 5.2 Data flow

- Pages read directly from Firestore using the Admin SDK in server components (no client-side Firestore reads — security rules restrict to operators anyway).
- Mutations call the corresponding Firebase Callable Function.

### 5.3 Authentication

Existing web admin auth (Firebase Auth + `admins/{uid}` membership). Reuse without modification.

### 5.4 UI components

- Conversation thread view: WhatsApp-style bubbles, ES/EN tag, escalation badge.
- Broadcast composer:
  - Template picker (filtered to `Approved` templates from Meta API status).
  - Variable inputs with per-language preview.
  - Audience picker: All / By language / By RSVP status / By event / Custom phone list.
  - Live count of recipients.
  - Dry run option (sends to operator only).
- Escalation card: shows full guest profile sidebar + recent conversation; reply box with send-via-session vs send-via-template auto-detect (based on CSW status).

### 5.5 Real-time updates

Use Firestore listeners for the escalations queue page (operator wants instant notification). Sound alert in-page on new high-urgency escalation.

## 6. Cloudinary integration

Bot uploads media via the existing Cloudinary account. New unsigned upload preset:

- Preset name: `wedding_photos_pending`
- Folder: `wedding/2026/whatsapp/{wedding_day}/`
- Allowed formats: jpg, png, mp4, mov.
- Auto-format, auto-quality.
- Tags: `whatsapp`, `bot`, `pending_moderation`.
- Eager transformations: 1080p web preview, 400w thumbnail.

Bot calls Cloudinary REST API:

```
POST https://api.cloudinary.com/v1_1/{cloud}/auto/upload
  -F file=@{localpath}
  -F upload_preset=wedding_photos_pending
  -F tags=whatsapp,bot,pending_moderation
```

Returns `{ public_id, url, width, height, format, ... }` → persisted on `feed_posts`.

## 7. Open-Meteo (weather)

Endpoint: `https://api.open-meteo.com/v1/forecast`

Query (Tarifa):

```
?latitude=36.0143&longitude=-5.6044
&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m
&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max
&timezone=Europe/Madrid
```

Response cached in-memory and Firestore (`config/weather_cache`) for 30 minutes. No auth required. No quota concern at our usage.

`bot/services/weather.ts.getCurrentWeather()`:

```ts
async function getCurrentWeather(): Promise<{
  temperature_c: number;
  conditions: { es: string; en: string };
  wind_speed_kmh: number;
  wind_direction: number;
  wind_name: 'Levante' | 'Poniente' | 'Variable';
}>
```

`wind_name` rule: 60–120° → Levante; 240–300° → Poniente; otherwise Variable.

## 8. Anthropic API

SDK: `@anthropic-ai/sdk` (latest at impl time).

```ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: [
    { type: 'text', text: BLOCK_A, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: BLOCK_B, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: BLOCK_C, cache_control: { type: 'ephemeral' } },
  ],
  tools: TOOLS,
  messages: [
    ...historyMessages,
    { role: 'user', content: currentTurnContent },
  ],
});
```

Tool-call loop is handled in `bot/claude/pipeline.ts.runTurn()`:

1. Call `messages.create`.
2. If `stop_reason === 'tool_use'`, execute each `tool_use` block, accumulate `tool_result` content blocks.
3. Append `{role: 'assistant', content: previous_response.content}` and `{role: 'user', content: tool_results}` to messages.
4. Re-call. Repeat up to 5 iterations.
5. Final assistant text → return.

For language detection, use Haiku 4.5:

```ts
{
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 10,
  system: 'Classify language: respond with exactly "es" or "en". Default to "es" if unclear.',
  messages: [{ role: 'user', content: text.slice(0, 200) }],
}
```

## 9. Idempotency keys (cross-cutting)

| Key shape | Used in | Purpose |
|---|---|---|
| `bot_dedupe/{message_id}` | inbound webhook | dedup Meta retries |
| `bot_dedupe/flow_token_{nonce}` | flow submission | replay protection |
| `bot_send_log/{trigger}:{guestId}:{suffix}` | scheduled & broadcast sends | dedup outbound proactive |
| `bot_send_log/broadcast:{broadcastId}:{guestId}` | broadcasts | dedup per-broadcast per-guest |

## 10. Observability contract

Every Cloud Function entry logs a structured event with:

```json
{
  "severity": "INFO",
  "requestId": "<uuid>",
  "function": "whatsappWebhook",
  "phaseSequence": ["verify", "dedupe", "classify", "handler.conversation", "claude", "send"],
  "phaseLatenciesMs": { "verify": 2, "dedupe": 18, ... },
  "guestId": "+34••••••678",
  "outcome": "replied",
  "claudeUsage": { ... },
  "metaResponse": { "messageId": "wamid.HBg..." }
}
```

These flow to Cloud Logging. The admin dashboard's Bot Health page reads aggregated counts from a daily-rollup doc populated by `botPurgeExpiredMessages` (which also runs metric rollups).

## 11. Out-of-band: how the operator finds out something broke

- **Cloud Logging error rate alert** notifies operator's email + WhatsApp (operator self-subscribed via Cloud Monitoring).
- **Quality rating drop**: `account_update` webhook → admin dashboard banner.
- **Phone number issues**: `phone_number_quality_update` webhook → same banner.
- **Anthropic outage**: 3-failure circuit breaker → in-app banner "AI no disponible — el bot responde con respuestas estáticas". Bot falls back to keyword-routing for FAQ (degraded mode).

## 12. Decommissioning contract

90 days post-wedding (≈ 2026-08-31), operator runs `botDecommission` (admin script, not Cloud Function):

1. Disable scheduled functions.
2. Send a final farewell template to remaining `botEnrolled: true` guests with a wrap-up.
3. Bulk delete `bot_conversations/{p}/messages/*`.
4. Anonymize remaining bot collections (replace `phone` with hash, drop `text`, keep aggregates).
5. Delete WABA templates from Meta.
6. Optionally release the WABA phone number.

Aggregate analytics (counts, rates) are retained indefinitely.
