# Boda en Tarifa — WhatsApp Bot: Flows

> Multi-screen forms rendered natively inside WhatsApp. Each Flow is defined as JSON, published to Meta, and triggered either via a template button or as a session message. Submission arrives at the webhook as `interactive.type === 'nfm_reply'`.

## 1. Flow inventory

| ID | Logical name | Purpose | Screens | Triggered by | Submission handler |
|---|---|---|---|---|---|
| ~~F1~~ | ~~`rsvp_full`~~ | **DROPPED** — RSVP flow retired; RSVP is handled on web / conversationally as needed. | — | — | — |
| ~~F2~~ | ~~`brunch_attendance`~~ | **DROPPED** — brunch is loose-attendance; web RSVP captures it. Thora handles conversationally. | — | — | — |
| F3 | `song_request` | Song requests with moderation | 1 | T18 button, "song" intent | `services/songs.ts.submitSongFlow()` |
| ~~F4~~ | ~~`logistics_intake`~~ | **DROPPED** — logistics captured conversationally; no dedicated Flow. | — | — | — |
| ~~F5~~ | ~~`photo_consent`~~ | **DROPPED** — photo consent collected pre-event on the web. | — | — | — |
| ~~F6~~ | ~~`feedback`~~ | **DROPPED** — no post-event feedback Flow in this version. | — | — | — |

Each Flow's Meta-side ID is stored in `config/bot.flows.activeIds` (active: `song_request_es`, `song_request_en`) so the implementation references logical names.

**Default arrival-date capture**: per the 2026-05-14 design refinement, the **lightweight conversational ask** ("¿qué día llegas a Tarifa?") is the default mechanism for capturing arrival dates (used to schedule the `arrival_day_nudge` template T17). No dedicated logistics Flow is used.

## 2. Authoring conventions

- Use **Flow JSON v6** (current as of early 2026).
- Use the **default** data exchange mode (no custom data endpoint) for v1: Meta delivers the submission to our webhook as `nfm_reply`. We do NOT host a Flow data endpoint. This is simpler, sufficient, and avoids the additional URL/SSL setup.
- Default routing model: linear, with one final "Submit" CTA on the last screen.
- All field labels and helper text exist in both languages; we publish two Flow versions (`{name}_es`, `{name}_en`).
- All fields use Meta Flow component types: `TextInput`, `TextArea`, `RadioButtonsGroup`, `CheckboxGroup`, `Dropdown`, `DatePicker`.
- Validation: required fields use `"required": true`; specific patterns via component constraints. Server-side re-validation in the submission handler is mandatory — never trust client.

## 3. Common payload structure

The webhook receives this on Flow submission:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "+34612345678",
          "id": "wamid.HBgL...",
          "timestamp": "1748520000",
          "type": "interactive",
          "interactive": {
            "type": "nfm_reply",
            "nfm_reply": {
              "name": "flow",
              "body": "Sent",
              "response_json": "{\"flow_token\":\"song_request|+34612345678|<nonce>\",\"title\":\"Despechá\",\"artist\":\"Rosalía\",...}"
            }
          }
        }]
      }
    }]
  }]
}
```

Critical fields:

- `interactive.nfm_reply.response_json` — JSON string with the full submission.
- `flow_token` — value we set when sending the Flow trigger; format: `${flowName}|${guestPhone}|${nonce}`. Used to identify which Flow + which guest, and to prevent replay.

## 4. Flow definitions

Below: full Flow JSON for each, in **Spanish**. The English variant is identical structurally with translated labels (omitted for brevity; implementer creates both).

---

### F1: `rsvp_full` — **DROPPED**

Removed from the active flow set. RSVP updates are handled on web and, when needed, conversationally via operator escalation.

---

### F2: `brunch_attendance` — **DROPPED**

Removed in the 2026-05-14 design refinement. Rationale: the brunch is loose ("paella for all who want to come"); the web RSVP already captures the field. If operator needs an update closer to the date, Thora can ask conversationally rather than via a dedicated Flow.

---

### F3: `song_request`

```json
{
  "version": "6.0",
  "screens": [{
    "id": "SONG",
    "title": "Pide una canción",
    "terminal": true,
    "layout": {
      "type": "SingleColumnLayout",
      "children": [
        { "type": "TextHeading", "text": "🎵 Petición musical" },
        { "type": "TextBody", "text": "Una por persona — el DJ las recibe sin filtro. Buena suerte." },
        {
          "type": "Form",
          "name": "form_song",
          "children": [
            {
              "type": "TextInput",
              "label": "Título",
              "name": "title",
              "required": true,
              "input-type": "text",
              "max-length": 120
            },
            {
              "type": "TextInput",
              "label": "Artista (opcional)",
              "name": "artist",
              "required": false,
              "input-type": "text",
              "max-length": 100
            },
            {
              "type": "RadioButtonsGroup",
              "label": "Vibe",
              "name": "vibe",
              "required": true,
              "data-source": [
                { "id": "chill",    "title": "Chill (cóctel)" },
                { "id": "dance",    "title": "Pista de baile" },
                { "id": "wildcard", "title": "Comodín / sorpresa" }
              ]
            },
            {
              "type": "TextArea",
              "label": "Notas",
              "name": "notes",
              "required": false,
              "max-length": 200
            },
            {
              "type": "Footer",
              "label": "Pedir",
              "on-click-action": {
                "name": "complete",
                "payload": {
                  "title":  "${form.title}",
                  "artist": "${form.artist}",
                  "vibe":   "${form.vibe}",
                  "notes":  "${form.notes}"
                }
              }
            }
          ]
        }
      ]
    }
  }]
}
```

**Handler:** writes a `song_requests` doc with `status: pending`. Applies `config/bot.moderation_hints` no-go list (artist exclusions, song exclusions, theme exclusions provided by operator). Decision tree:

- **Pass (default for borderline)** → status flips to `approved`, song-title-resolution via Spotify API attempts to add to the playlist (`config/bot.spotify.playlistId`), Thora acks: `"🎵 Apuntada, cruzo las patas 🐾 — el DJ tiene la última palabra"`.
- **Fail (matches moderation hint)** → status flips to `rejected_self_moderated`. Thora delegates to in-person: `"Esa mis humanos la tienen marcada — díselo en persona si insistes, tienen vía directa con Randy 🐾"`. No escalation, no operator action needed.
- **Spotify not found** → Thora asks for help inline: `"No encuentro 'X' en Spotify, ¿la deletreas o me das artista?"` — song stays `pending` until the guest follows up.

**Per-guest quota**: 3 requests max within the active window. On 4th attempt: `"Ya me has pedido 3 canciones 🐾 No me digas que no es suficiente."`.

**Window**: requests accepted between **21:00 Sat May 30 and 01:00 Sun May 31** (last hour closed so the DJ can flex). Outside this window: `"Cerré por hoy — pídeselas a Randy cara a cara 🐾"`.

**`moderation_hints` operator schema** (Firestore `config/bot.moderation_hints`):

```ts
interface ModerationHints {
  blocked_artists: string[];        // e.g., ["Despacito", "Macarena"]
  blocked_songs: { title: string; artist?: string }[];
  blocked_themes: string[];         // free-form descriptions for Haiku to interpret
  notes_for_thora?: string;         // operator note Thora can quote when refusing
}
```

**Spotify integration**:

- Single playlist (`config/bot.spotify.playlistId`) created by operator pre-event.
- App credentials and refresh token in Firebase secrets: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`.
- Resolution: `GET /v1/search?q={title artist}&type=track&limit=3` → pick top hit; if confidence low, ask the guest for confirmation.
- Append: `POST /v1/playlists/{playlistId}/tracks` with the resolved track URI.
- Randy (DJ) is given the playlist URL pre-event and pulls from it live.

---

### F4: `logistics_intake` — **DROPPED**

Removed from the active flow set. Arrival/transport/accessibility info is handled conversationally and escalated to the operator when needed.

---

### F5: `photo_consent` — **DROPPED**

Removed in the 2026-05-14 design refinement. **Photo consent is collected pre-event on the web** (per the RSVP/profile flow already in place). Thora does **not** trigger a consent flow on first photo. All photos arrive at the bot already tagged with the guest's stored `photoConsent` field.

If `photoConsent == false`, the photo is stored privately (visible only to operator); not added to the album.

If `photoConsent == true`, the photo enters the moderation queue per the standard flow.

If `photoConsent == undefined` (legacy edge case for a guest who's not on the web): Thora replies neutrally — `"Recibida 🐾 Avisa a mis humanos si quieres que aparezca en el álbum compartido o solo para nosotros."` — and the operator handles consent capture out-of-band.

---

### F6: `feedback` — **DROPPED**

Removed from the active flow set. No dedicated post-event feedback Flow in this version.

---

## 5. Triggering a Flow

Two pathways:

### 5.1 Flow button on a template

(See T18 `song_request_party_open` in `05-message-templates.md`.)

In Meta's template builder, attach a "Flow" button. Provide:

- The Meta Flow ID (from `config/bot.flows.activeIds`).
- The Flow CTA label.
- An optional initial `flow_token`.

### 5.2 Inline (session message)

Inside the CSW, the bot can send a Flow trigger as an interactive message:

```ts
// bot/whatsapp/send.ts
sendFlow({
  to: '+34612345678',
  flowName: 'song_request',
  language: 'es',
  body: 'La fiesta ya está en marcha 🐾 ¿Pides tema?',
  ctaLabel: 'Pedir canción',
  flowToken: `song_request|+34612345678|${nanoid()}`,
});
```

The corresponding Meta Cloud API payload (compact form):

```json
{
  "messaging_product": "whatsapp",
  "to": "34612345678",
  "type": "interactive",
  "interactive": {
    "type": "flow",
    "body": { "text": "¡Perfecto! Te paso un formulario rápido (1 minuto). Tócalo 👇" },
    "action": {
      "name": "flow",
      "parameters": {
        "flow_message_version": "3",
        "flow_token": "song_request|+34612345678|<nonce>",
        "flow_id": "<META_FLOW_ID_FROM_CONFIG>",
        "flow_cta": "Pedir canción",
        "flow_action": "navigate",
        "flow_action_payload": {
          "screen": "BASICS",
          "data": {}
        }
      }
    }
  }
}
```

## 6. Validation rules (server-side)

Each Flow's submission handler MUST:

1. Confirm the `flow_token` belongs to the inbound sender's phone.
2. Confirm the `flow_token` nonce hasn't been used (replay protection — store recent nonces in `bot_dedupe` with `kind: 'flow_token'`).
3. Re-parse the `response_json` against a Zod schema mirroring the Flow's contract.
4. On any validation failure: log, do not write data, send the user a polite "algo no cuadró, ¿puedes volver a intentarlo?".
5. On success: write the appropriate domain doc, ack the user with a session message.

Zod schemas live in `bot/whatsapp/flows.ts`:

```ts
import { z } from 'zod';

export const SongRequestSubmission = z.object({
  flow_token: z.string().regex(/^song_request\|\+\d+\|[A-Za-z0-9_-]+$/),
  title: z.string().min(1).max(120),
  artist: z.string().max(100).optional(),
  vibe: z.enum(['chill', 'dance', 'wildcard']),
  notes: z.string().max(200).optional(),
});

// ... one schema per Flow
```

## 7. Publishing & lifecycle

- **Authoring:** in Meta Flow Builder UI, paste the JSON (or upload a file). The implementer can also use the `flows.create` Graph API endpoint, but Builder UI is faster for one-off authoring.
- **Versioning:** when editing a Flow, publish a new version. Existing templates referencing the Flow ID continue to work; the Flow is non-versioned in the URL — the template UX uses the latest **published** version.
- **Publishing requires:** Flow is `Draft` → run validation → submit → Meta validates → publishes.
- **Approval:** typically <30 min. Some Flow features (e.g., custom data exchange) require additional review; we don't use those.
- **Unpublishing:** keep all Flows published until 30 days after wedding, then deprecate.

## 8. Test plan

| Test | How |
|---|---|
| Flow renders correctly on iOS | Operator opens template-with-Flow-button on personal device |
| Flow renders correctly on Android | Same, second device |
| Submission arrives at webhook | Local emulator + ngrok or staging deploy; check Cloud Logs |
| Validation rejects malformed payload | `simulate-webhook.ts` script with crafted bad JSON |
| Idempotency (same nonce twice) | Replay test |
| Wrong-phone token | Submit Flow from a different test phone with mismatching token |
| Bilingual: ES vs EN render | Send Flow trigger to ES test guest, then EN |
| Editing existing RSVP | Submit Flow when `rsvp_responses/{guestId}` exists; verify `history` subcollection populated |

## 9. Implementation contract

`bot/whatsapp/flows.ts`:

```ts
export type FlowName =
  | 'song_request';

export interface FlowDef {
  name: FlowName;
  metaFlowId: (lang: 'es' | 'en') => string;     // resolves from config/bot.flows.activeIds
  buildToken: (guestPhone: E164) => string;      // returns `${name}|${phone}|${nanoid}`
  parseToken: (token: string) => { name: FlowName; phone: E164; nonce: string };
  parseSubmission: (token: string, responseJson: unknown) => ParsedSubmission;
  handler: (parsed: ParsedSubmission, ctx: HandlerCtx) => Promise<void>;
}
```

The webhook's `flow.ts` handler dispatches to `FlowDef.handler(...)` once parsing succeeds.
