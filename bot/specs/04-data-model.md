# Boda en Tarifa — WhatsApp Bot: Data Model

> Firestore schema additions and extensions. The bot reuses the existing wedding database; nothing new is introduced as a separate store.

Conventions:

- Document IDs are explicitly named where they matter for idempotency. Auto-IDs are noted as `{auto}`.
- Phone numbers are always normalized to E.164 (e.g. `+34612345678`). Helper: `bot/lib/phone.ts`.
- All timestamps are Firestore `Timestamp`. Wall-clock formatting uses `Europe/Madrid`.
- Field types use TypeScript notation. `?` = optional. Strings without `?` are required.
- Indexes: any field marked `[idx]` requires a composite or single-field index — listed at end of doc.

## 1. Existing collections (extended)

### `guests/{phoneNumber}`

Document ID is the E.164 phone number. The bot extends this existing collection with a few fields. Existing fields used by the bot are noted but not redefined.

```ts
interface Guest {
  // ── existing (web/RSVP) ─────────────────────────────────────────────
  id: string;                  // same as document ID
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;               // E.164, mirror of doc ID
  language?: 'es' | 'en';      // existing — extended use by bot
  invitedTo: string[];         // event IDs
  rsvpStatus: 'pending' | 'attending' | 'declined' | 'partial';
  rsvpId?: string;             // doc ID in rsvp_responses
  directoryVisible: boolean;
  photoConsent?: boolean;      // existing — extended use

  // ── added by bot ────────────────────────────────────────────────────
  botEnrolled: boolean;             // default true; user can opt out via "stop"
  botFirstSeenAt?: Timestamp;       // first inbound bot message
  botLastSeenAt?: Timestamp;        // last inbound bot message [idx]
  botCsmWindowExpiresAt?: Timestamp;// 24h after last inbound; bot can free-form before this
  botOnboardedAt?: Timestamp;       // when welcome template was sent
  botOnboardingResponded: boolean;  // did they respond to welcome template
  preferredName?: string;           // if Claude infers/asks ("call me Tito")
  logistics?: {                      // populated via logistics-intake Flow
    arrivalDate?: string;            // ISO date
    arrivalAirport?: 'GIB' | 'AGP' | 'JTR' | 'OTHER';
    arrivalNotes?: string;
    needsTransport?: boolean;
    accessibilityNotes?: string;
    departureDate?: string;
  };
}
```

### `rsvp_responses/{guestId}`

Already used by web. Bot's RSVP Flow writes to the same shape. No bot-specific fields, but bot adds `source: 'whatsapp'` to the existing `source` enum (web | whatsapp | manual).

### `feed_posts/{auto}`

Already used. Bot writes new posts with these fields populated:

```ts
interface FeedPost {
  id: string;
  guestId: string;
  source: 'whatsapp' | 'web' | 'native';   // bot uses 'whatsapp'
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  mimeType: 'image/jpeg' | 'image/png' | 'video/mp4' | string;
  width?: number;
  height?: number;
  durationSec?: number;                     // for video
  status: 'pending_moderation' | 'approved' | 'hidden' | 'flagged';
  consent: 'granted' | 'denied' | 'pending';
  weddingDay: 'pre' | 'fri' | 'sat' | 'sun' | 'post';   // computed from createdAt
  caption?: string;
  createdAt: Timestamp;
  moderatedAt?: Timestamp;
  moderatedBy?: string;                     // operator UID
}
```

### `events/{eventId}`, `venues/{venueId}`, `time_gated_content/{contentId}`

Existing. Bot reads only.

## 2. New collections

### `bot_conversations/{phoneNumber}`

One doc per guest representing the conversation root.

```ts
interface BotConversationRoot {
  phone: string;
  guestId: string;
  language: 'es' | 'en';
  startedAt: Timestamp;
  lastMessageAt: Timestamp;       // [idx]
  messageCount: number;
  csmWindowExpiresAt: Timestamp;
  unresolvedEscalationId?: string;
}
```

#### `bot_conversations/{phoneNumber}/messages/{auto}`

Full message log, used for context window assembly and audit.

```ts
interface BotMessage {
  id: string;
  conversationPhone: string;
  direction: 'inbound' | 'outbound';
  type:
    | 'text' | 'image' | 'video' | 'audio' | 'document'
    | 'sticker' | 'location' | 'contacts' | 'reaction'
    | 'interactive_button_reply' | 'interactive_list_reply'
    | 'flow_submission' | 'template' | 'system';
  metaMessageId?: string;          // Meta's wamid; present on inbound + outbound (Meta returns one on send)
  text?: string;
  mediaId?: string;                 // Meta media ID (inbound)
  cloudinaryPublicId?: string;     // if uploaded
  templateName?: string;            // outbound template
  templateVariables?: Record<string, string>;
  flowId?: string;                  // for flow_submission
  flowResponse?: Record<string, unknown>;  // parsed Flow data
  buttonId?: string;
  listId?: string;
  reactionEmoji?: string;
  reactionTargetMessageId?: string;
  toolCalls?: ToolCall[];           // populated for outbound when Claude used tools
  claudeModel?: 'sonnet-4-6' | 'haiku-4-5';
  claudeUsage?: {
    inputTokens: number;
    cachedReadTokens: number;
    cachedWriteTokens: number;
    outputTokens: number;
  };
  latencyMs?: number;
  outcome?: 'replied' | 'escalated' | 'refused' | 'rate_limited' | 'error';
  errorCode?: string;
  errorMessage?: string;
  createdAt: Timestamp;             // [idx]
  requestId: string;                // tracing across logs + Firestore
}

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  errored?: boolean;
}
```

### `bot_dedupe/{messageId}`

Idempotency keys for inbound messages. Auto-purged via Firestore TTL.

```ts
interface BotDedupe {
  messageId: string;        // Meta wamid
  receivedAt: Timestamp;
  ttlExpiresAt: Timestamp;  // TTL field — receivedAt + 24h
  processedSuccessfully: boolean;
}
```

### `bot_send_log/{compositeId}`

Outbound idempotency. `compositeId` is `${trigger}:${guestId}:${suffix}` — e.g. `event_reminder:+34612345678:event_dinner_fri` or `broadcast:+34612345678:bcst-12`.

```ts
interface BotSendLog {
  id: string;
  trigger: 'event_reminder' | 'content_unlock' | 'film_developed' | 'broadcast' | 'onboarding' | 'other';
  guestId: string;
  templateName?: string;
  payloadHash: string;        // for diffing if retried
  sentAt?: Timestamp;
  metaMessageId?: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
  attempts: number;
}
```

### `bot_broadcasts/{auto}`

Operator-initiated bulk sends.

```ts
interface BotBroadcast {
  id: string;
  createdBy: string;            // operator UID
  createdAt: Timestamp;
  templateName: string;
  variables: Record<string, string>;
  audience: BroadcastAudience;
  audienceCount: number;
  status: 'draft' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  successCount: number;
  failureCount: number;
  errors?: { phone: string; reason: string }[];
}

type BroadcastAudience =
  | { kind: 'all' }
  | { kind: 'language'; language: 'es' | 'en' }
  | { kind: 'event_attendees'; eventId: string }
  | { kind: 'rsvp_status'; status: 'pending' | 'attending' | 'declined' }
  | { kind: 'guest_list'; phones: string[] };
```

### `bot_escalations/{auto}`

Each time the bot escalates to the operator.

```ts
interface BotEscalation {
  id: string;
  guestId: string;
  guestPhone: string;
  guestLanguage: 'es' | 'en';
  conversationPhone: string;        // for fast jump from admin UI
  reason: string;                    // model-provided
  summary: string;                   // model-provided one-liner
  urgency: 'low' | 'normal' | 'high';
  triggeringMessageId: string;
  triggeringMessageText?: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'cancelled';
  createdAt: Timestamp;              // [idx]
  acknowledgedAt?: Timestamp;
  resolvedAt?: Timestamp;
  operatorReply?: string;
  operatorNotes?: string;            // private, never sent to guest
  operatorUid?: string;
}
```

### `bot_unknown_inbound/{auto}`

Records inbound from non-allowlisted phones for operator review.

```ts
interface BotUnknownInbound {
  id: string;
  phone: string;                     // E.164
  receivedAt: Timestamp;
  messagePreviewHash: string;        // sha256 of first 200 chars; for grouping repeat offenders without retaining content
  count: number;                     // increment if same phone repeats
  responseSent: boolean;             // whether bot replied with the polite refusal
  resolved: boolean;                 // operator handled (added to allowlist or marked spam)
  resolvedBy?: string;
  resolvedAt?: Timestamp;
}
```

### `bot_rate/{phoneNumber}_{bucket}`

Sliding-window rate-limit counters. Bucket is 5-minute UTC bucket: `floor(epochMs/300_000)`. TTL via Firestore TTL field.

```ts
interface BotRate {
  phone: string;
  bucket: number;
  count: number;
  ttlExpiresAt: Timestamp;     // bucket end + 1h
}
```

### `bot_kb_version/_singleton_`

Single doc representing current KB version. Updated by Firestore trigger when any source-of-truth content doc changes.

```ts
interface BotKbVersion {
  version: number;             // monotonic
  hash: string;                 // sha256 of canonical KB JSON
  updatedAt: Timestamp;
  changedSource: string;        // e.g. "events/event_dinner_fri"
}
```

### `bot_feedback/{auto}`

Post-event feedback Flow submissions.

```ts
interface BotFeedback {
  id: string;
  guestId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text?: string;
  language: 'es' | 'en';
  submittedAt: Timestamp;
}
```

### `song_requests/{auto}`

Captured via the song-request Flow.

```ts
interface SongRequest {
  id: string;
  guestId: string;
  title: string;
  artist?: string;
  vibe: 'chill' | 'dance' | 'wildcard';
  notes?: string;
  submittedAt: Timestamp;
}
```

### `bot_outbound_pending/{auto}`

Queue for sends that failed transient errors and need retry. Worker drains every 5 min.

```ts
interface BotOutboundPending {
  id: string;
  toPhone: string;
  payload: Record<string, unknown>;   // ready-to-send Meta payload
  reason: string;                      // why it's queued
  attempts: number;
  nextAttemptAt: Timestamp;            // [idx]
  abandonAfter: Timestamp;             // give up after this
  createdAt: Timestamp;
}
```

### `config/bot` (single doc, in existing `config` collection)

Bot-specific operational config, hot-tunable from admin dashboard.

```ts
interface ConfigBot {
  enabled: boolean;
  fallbackErrorMessage: { es: string; en: string };
  rateLimit: { perUserPer5min: number; throttleNoticeText: { es: string; en: string } };
  escalation: {
    autoCloseAfterMinutes: number;
    operatorReplyPrefix: { es: string; en: string };  // "Enrique:" / "Enrique:"
    urgencyThresholds: Record<'low' | 'normal' | 'high', { responseMinutesGoal: number }>;
  };
  history: {
    turnsInContext: number;       // default 8 turns = 16 messages
  };
  proactivity: {
    eventReminderMinutesBefore: number;   // default 30
    keepWarmEnabledFrom: Timestamp;       // start of event window
    keepWarmEnabledUntil: Timestamp;
  };
  templates: {
    activeNames: string[];        // approved templates available to broadcast UI
  };
  flows: {
    activeIds: Record<string, string>;     // logical name -> Meta flow ID
  };
  retention: {
    conversationDays: number;     // default 90
  };
}
```

## 3. Indexes

Firestore composite indexes required (add to `firebase/firestore.indexes.json`):

| Collection | Fields | Order | Used by |
|---|---|---|---|
| `guests` | `botEnrolled` ASC, `language` ASC | | broadcast audience filtering |
| `guests` | `rsvpStatus` ASC, `botEnrolled` ASC | | RSVP-segmented queries |
| `bot_conversations` | `lastMessageAt` DESC | single-field | recent conversations list |
| `bot_conversations/{p}/messages` | `createdAt` DESC | single-field | history fetch |
| `bot_escalations` | `status` ASC, `createdAt` DESC | | operator open queue |
| `bot_escalations` | `urgency` ASC, `status` ASC, `createdAt` DESC | | priority sort |
| `bot_send_log` | `trigger` ASC, `guestId` ASC | | dedup lookup |
| `bot_outbound_pending` | `nextAttemptAt` ASC | single-field | retry worker |
| `feed_posts` | `source` ASC, `status` ASC, `createdAt` DESC | | moderation queue (extends existing) |
| `bot_unknown_inbound` | `resolved` ASC, `receivedAt` DESC | | unknown-phones admin page |

TTL fields:

| Collection | TTL field |
|---|---|
| `bot_dedupe` | `ttlExpiresAt` |
| `bot_rate` | `ttlExpiresAt` |
| `bot_outbound_pending` | `abandonAfter` (after which job is abandoned & deleted) |
| `bot_conversations/{p}/messages` | none — purged via scheduled job per `config/bot.retention.conversationDays` |

## 4. Firestore security rules (additions)

Add to `firebase/firestore.rules`. Pattern matches existing rules style. All bot collections are **server-only** (no client read/write); all access is via Functions with Admin SDK, except for admin-dashboard reads gated to authenticated operators.

```
match /bot_conversations/{phone} {
  allow read: if isOperator();
  allow write: if false;
}
match /bot_conversations/{phone}/messages/{messageId} {
  allow read: if isOperator();
  allow write: if false;
}
match /bot_dedupe/{id} { allow read, write: if false; }
match /bot_send_log/{id} { allow read: if isOperator(); allow write: if false; }
match /bot_broadcasts/{id} {
  allow read: if isOperator();
  allow create, update: if isOperator();
  allow delete: if false;
}
match /bot_escalations/{id} {
  allow read: if isOperator();
  allow update: if isOperator();
  allow create, delete: if false;
}
match /bot_unknown_inbound/{id} {
  allow read: if isOperator();
  allow update: if isOperator();
  allow create, delete: if false;
}
match /bot_rate/{id} { allow read, write: if false; }
match /bot_kb_version/{id} { allow read: if isOperator(); allow write: if false; }
match /bot_feedback/{id} { allow read: if isOperator(); allow write: if false; }
match /song_requests/{id} { allow read: if isOperator(); allow write: if false; }
match /bot_outbound_pending/{id} { allow read, write: if false; }
match /config/bot { allow read, write: if isOperator(); }

function isOperator() {
  return request.auth != null
    && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```

The `admins/{uid}` collection already exists in the web project; reuse it.

## 5. Field-level conventions

- **Phone numbers**: always E.164 with leading `+`. Never store local format.
- **Timestamps**: always Firestore `Timestamp`, never strings or numbers.
- **Currency** (if it appears): not applicable in v1.
- **Language codes**: lower-case ISO-639-1 (`es`, `en`). Two-letter only.
- **IDs**: lower-snake-case, no special chars beyond `_`. Example: `event_dinner_fri`.
- **Enums**: union of string literals in TS, validated at write time via Zod (introduced in `bot/lib/validation.ts`).
- **PII**: phone, email, name. Logged with last-4 truncation outside of audit collections.

## 6. Migrations

The bot does not touch existing `guests` records' existing fields. New optional fields are added lazily on first interaction. No batch migration is required.

For one-time provisioning of `botEnrolled = true` across the existing guest list, run the migration script `functions/scripts/migrate-bot-enrollment.ts` during setup. Idempotent: skips guests already having the field.

## 7. Retention & purge

| Data | Retention | Mechanism |
|---|---|---|
| `bot_conversations/{p}/messages` | 90 days | Scheduled Cloud Function `purgeOldBotMessages` runs daily |
| `bot_dedupe` | 24h | Firestore TTL |
| `bot_rate` | 1h | Firestore TTL |
| `bot_outbound_pending` (abandoned) | TTL on `abandonAfter` | Firestore TTL |
| `feed_posts` (rejected) | Deleted from Cloudinary on `status: hidden` | Manual via admin |
| `feed_posts` (approved) | Indefinite | — |
| `bot_escalations` | Indefinite (operator may want to recall) | — |
| `bot_unknown_inbound` | 30 days | Scheduled purge |
| `bot_feedback` | Indefinite | — |
| `bot_send_log` | 90 days | Scheduled purge |

## 8. Backup & disaster recovery

- Firestore daily automated export (already configured for the web project) covers all bot collections.
- A pre-event dump (manual export at start of each wedding day) is recommended — see runbook.
- Cloudinary has its own redundancy; no extra backup.

## 9. Example documents

For implementer reference, here are realistic example payloads.

### Example `bot_conversations/+34612345678`

```json
{
  "phone": "+34612345678",
  "guestId": "+34612345678",
  "language": "es",
  "startedAt": "2026-05-22T10:00:00Z",
  "lastMessageAt": "2026-05-30T18:30:00Z",
  "messageCount": 14,
  "csmWindowExpiresAt": "2026-05-31T18:30:00Z",
  "unresolvedEscalationId": null
}
```

### Example `bot_conversations/+34612345678/messages/{auto}` (inbound text)

```json
{
  "direction": "inbound",
  "type": "text",
  "metaMessageId": "wamid.HBgL...",
  "text": "¿a qué hora es la ceremonia?",
  "createdAt": "2026-05-30T17:55:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Example `bot_conversations/+34612345678/messages/{auto}` (outbound reply)

```json
{
  "direction": "outbound",
  "type": "text",
  "metaMessageId": "wamid.HBgL...",
  "text": "La ceremonia es el *sábado 30 de mayo a las 18:00*…",
  "toolCalls": [
    { "name": "lookup_events", "input": {"filter": "ceremony"}, "output": {"events": [...]} }
  ],
  "claudeModel": "sonnet-4-6",
  "claudeUsage": {
    "inputTokens": 230,
    "cachedReadTokens": 11500,
    "cachedWriteTokens": 0,
    "outputTokens": 78
  },
  "latencyMs": 2340,
  "outcome": "replied",
  "createdAt": "2026-05-30T17:55:02Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Example `bot_escalations/{auto}`

```json
{
  "guestId": "+34699887766",
  "guestPhone": "+34699887766",
  "guestLanguage": "en",
  "conversationPhone": "+34699887766",
  "reason": "user has flight delay; logistics question that affects welcome dinner attendance",
  "summary": "Flight delayed, may miss welcome dinner Fri 29 May",
  "urgency": "normal",
  "triggeringMessageId": "wamid.HBgL...",
  "triggeringMessageText": "my flight is delayed and I'll miss the welcome dinner. is that ok??",
  "status": "open",
  "createdAt": "2026-05-29T15:02:00Z"
}
```
