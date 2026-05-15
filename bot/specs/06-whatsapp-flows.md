# Boda en Tarifa — WhatsApp Bot: Flows

> Multi-screen forms rendered natively inside WhatsApp. Each Flow is defined as JSON, published to Meta, and triggered either via a template button or as a session message. Submission arrives at the webhook as `interactive.type === 'nfm_reply'`.

## 1. Flow inventory

| ID | Logical name | Purpose | Screens | Triggered by | Submission handler |
|---|---|---|---|---|---|
| F1 | `rsvp_full` | Full RSVP capture | 4 | T2 button, "rsvp" intent (when `rsvpStatus: pending`) | `services/rsvp.ts.submitRsvpFlow()` |
| ~~F2~~ | ~~`brunch_attendance`~~ | **DROPPED** — brunch is loose-attendance; web RSVP captures it. Thora handles conversationally. | — | — | — |
| F3 | `song_request` | Song requests with moderation | 1 | "song" intent | `services/songs.ts.submitSongFlow()` |
| F4 | `logistics_intake` | Arrival, transport, accessibility — operator-trigger only for complex cases | 2 | Manual trigger from operator | `services/guests.ts.submitLogisticsFlow()` |
| ~~F5~~ | ~~`photo_consent`~~ | **DROPPED** — photo consent collected pre-event on the web. | — | — | — |
| F6 | `feedback` | Post-event feedback | 2 | T11 button | `services/feedback.ts.submitFeedbackFlow()` |

Each Flow's Meta-side ID is stored in `config/bot.flows.activeIds` as `{ rsvp_full: "12345...", ... }` so the implementation references logical names.

**Default arrival-date capture**: per the 2026-05-14 design refinement, the **lightweight conversational ask** ("¿qué día llegas a Tarifa?") is the default mechanism for capturing arrival dates (used to schedule the `arrival_day_nudge` template T17). The formal F4 Flow stays available but is only triggered manually by the operator for complex logistical cases (transport coordination, accessibility, etc.).

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
              "response_json": "{\"flow_token\":\"rsvp_full|+34612345678|<nonce>\",\"first_name\":\"María\",\"attending\":\"yes\",...}"
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

### F1: `rsvp_full_es` — full RSVP

4 screens: BASICS → EVENTS → DIETARY → CONFIRM.

```json
{
  "version": "6.0",
  "screens": [
    {
      "id": "BASICS",
      "title": "Tus datos",
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Confirmación — Boda Enrique & Manuel"
          },
          {
            "type": "TextBody",
            "text": "Te tomará menos de un minuto. Empezamos."
          },
          {
            "type": "Form",
            "name": "form_basics",
            "children": [
              {
                "type": "TextInput",
                "label": "Nombre",
                "name": "first_name",
                "required": true,
                "input-type": "text",
                "max-length": 60
              },
              {
                "type": "TextInput",
                "label": "Apellidos",
                "name": "last_name",
                "required": false,
                "input-type": "text",
                "max-length": 80
              },
              {
                "type": "RadioButtonsGroup",
                "label": "¿Vendrás?",
                "name": "attending",
                "required": true,
                "data-source": [
                  { "id": "yes", "title": "Sí, allí estaré" },
                  { "id": "no", "title": "No podré asistir" }
                ]
              },
              {
                "type": "Footer",
                "label": "Siguiente",
                "on-click-action": {
                  "name": "navigate",
                  "next": { "type": "screen", "name": "EVENTS" },
                  "payload": {
                    "first_name": "${form.first_name}",
                    "last_name": "${form.last_name}",
                    "attending": "${form.attending}"
                  }
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "EVENTS",
      "title": "¿A qué eventos?",
      "data": {
        "first_name": { "type": "string", "__example__": "María" },
        "last_name":  { "type": "string", "__example__": "García" },
        "attending":  { "type": "string", "__example__": "yes" }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "¿A qué eventos vienes?"
          },
          {
            "type": "TextBody",
            "text": "Marca todos los que te apliquen."
          },
          {
            "type": "Form",
            "name": "form_events",
            "children": [
              {
                "type": "CheckboxGroup",
                "label": "Eventos",
                "name": "events",
                "required": true,
                "data-source": [
                  { "id": "pre_wedding", "title": "Pre-boda — Vie 29, 22:30 (Casa Explora)" },
                  { "id": "ceremony",       "title": "Ceremonia — Sáb 30, 18:00" },
                  { "id": "reception",      "title": "Banquete y fiesta — Sáb 30, 20:00" },
                  { "id": "brunch",         "title": "Brunch despedida — Dom 31, 11:30" }
                ]
              },
              {
                "type": "TextInput",
                "label": "¿Vienes con acompañante?",
                "name": "plus_one_name",
                "required": false,
                "input-type": "text",
                "helper-text": "Nombre y apellido. Déjalo vacío si no.",
                "max-length": 100
              },
              {
                "type": "Footer",
                "label": "Siguiente",
                "on-click-action": {
                  "name": "navigate",
                  "next": { "type": "screen", "name": "DIETARY" },
                  "payload": {
                    "first_name": "${data.first_name}",
                    "last_name":  "${data.last_name}",
                    "attending":  "${data.attending}",
                    "events":     "${form.events}",
                    "plus_one_name": "${form.plus_one_name}"
                  }
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "DIETARY",
      "title": "Comida",
      "data": {
        "first_name": { "type": "string" },
        "last_name":  { "type": "string" },
        "attending":  { "type": "string" },
        "events":     { "type": "array", "items": { "type": "string" } },
        "plus_one_name": { "type": "string" }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Restricciones de comida"
          },
          {
            "type": "Form",
            "name": "form_dietary",
            "children": [
              {
                "type": "CheckboxGroup",
                "label": "Restricciones",
                "name": "dietary",
                "required": false,
                "data-source": [
                  { "id": "vegetarian",  "title": "Vegetariano" },
                  { "id": "vegan",       "title": "Vegano" },
                  { "id": "gluten_free", "title": "Sin gluten" },
                  { "id": "lactose_free","title": "Sin lactosa" },
                  { "id": "no_pork",     "title": "Sin cerdo" },
                  { "id": "no_alcohol",  "title": "Sin alcohol" },
                  { "id": "other",       "title": "Otra (especificar abajo)" }
                ]
              },
              {
                "type": "TextArea",
                "label": "Alergias o detalles",
                "name": "dietary_notes",
                "required": false,
                "helper-text": "Frutos secos, mariscos, etc. Escríbelo libremente.",
                "max-length": 400
              },
              {
                "type": "Footer",
                "label": "Revisar",
                "on-click-action": {
                  "name": "navigate",
                  "next": { "type": "screen", "name": "CONFIRM" },
                  "payload": {
                    "first_name":   "${data.first_name}",
                    "last_name":    "${data.last_name}",
                    "attending":    "${data.attending}",
                    "events":       "${data.events}",
                    "plus_one_name":"${data.plus_one_name}",
                    "dietary":      "${form.dietary}",
                    "dietary_notes":"${form.dietary_notes}"
                  }
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "CONFIRM",
      "title": "Confirmar",
      "terminal": true,
      "data": {
        "first_name":   { "type": "string" },
        "last_name":    { "type": "string" },
        "attending":    { "type": "string" },
        "events":       { "type": "array", "items": { "type": "string" } },
        "plus_one_name":{ "type": "string" },
        "dietary":      { "type": "array", "items": { "type": "string" } },
        "dietary_notes":{ "type": "string" }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "Casi listo" },
          { "type": "TextBody", "text": "Revisa y envía." },
          {
            "type": "TextSubheading",
            "text": "Resumen"
          },
          {
            "type": "TextBody",
            "text": "*${data.first_name} ${data.last_name}* — ${data.attending}"
          },
          {
            "type": "Form",
            "name": "form_confirm",
            "children": [
              {
                "type": "TextArea",
                "label": "Mensaje para Enrique y Manuel (opcional)",
                "name": "message",
                "required": false,
                "max-length": 500
              },
              {
                "type": "Footer",
                "label": "Enviar",
                "on-click-action": {
                  "name": "complete",
                  "payload": {
                    "first_name":   "${data.first_name}",
                    "last_name":    "${data.last_name}",
                    "attending":    "${data.attending}",
                    "events":       "${data.events}",
                    "plus_one_name":"${data.plus_one_name}",
                    "dietary":      "${data.dietary}",
                    "dietary_notes":"${data.dietary_notes}",
                    "message":      "${form.message}"
                  }
                }
              }
            ]
          }
        ]
      }
    }
  ]
}
```

**EN variant:** identical structure with English labels. Title strings:

| ES | EN |
|---|---|
| Tus datos | Your details |
| ¿Vendrás? | Will you attend? |
| Sí, allí estaré | Yes, I'll be there |
| No podré asistir | I can't make it |
| ¿A qué eventos? | Which events? |
| Pre-boda — Vie 29, 22:30 (Casa Explora) | Pre-wedding drinks — Fri 29, 22:30 (Casa Explora) |
| Ceremonia — Sáb 30, 18:00 | Ceremony — Sat 30, 18:00 |
| Banquete y fiesta — Sáb 30, 20:00 | Reception & party — Sat 30, 20:00 |
| Brunch despedida — Dom 31, 11:30 | Farewell brunch — Sun 31, 11:30 |
| Restricciones | Restrictions |
| Vegetariano | Vegetarian |
| ... | ... |

**Submission handler — `services/rsvp.ts.submitRsvpFlow()`:**

```ts
async function submitRsvpFlow(input: {
  flowToken: string;
  responseJson: object;
  guestPhone: E164;
}): Promise<void> {
  // 1. Validate flow_token: parse `${flowName}|${phone}|${nonce}` and check phone match.
  // 2. Re-validate response shape against Zod schema (same fields as defined above).
  // 3. Map to existing rsvp_responses schema:
  //    {
  //      guestId: phone (or resolved guest id),
  //      source: 'whatsapp',
  //      attending: boolean,
  //      events: { pre_wedding: bool, ceremony: bool, reception: bool, brunch: bool },
  //      plusOne: { name?: string },
  //      dietary: string[],
  //      dietaryNotes?: string,
  //      message?: string,
  //      submittedAt: serverTimestamp(),
  //    }
  // 4. Idempotency: if rsvp_responses/{guestId} exists, update with new submission;
  //    write old one to rsvp_responses/{guestId}/history/{auto} for audit.
  // 5. Update guests/{phone}.rsvpStatus accordingly.
  // 6. Send confirmation session message via WhatsApp in Thora's voice:
  //    ES: "¡Recibido! 🐾 Si necesitas cambiar algo, escríbeme y lo arreglamos."
  //    EN: "Got it! 🐾 If you need to change anything, just message me."
  // 7. Log everything via services/audit.ts.
}
```

**RSVP-already-done handling**: when a guest types "quiero confirmar" / "RSVP" and their `rsvp_responses/{guestId}` doc already exists, Thora does **not** open the Flow. Instead she pulls the existing record via `get_guest_context` and replies with a summary + edit offer (golden example G9b in `02-conversation-design.md`):

> Ya estás confirmada 🐾 Vienes a la ceremonia, banquete y brunch. Sin alergias declaradas. ¿Cambiar algo?

If the guest says yes to changing, Thora then triggers F1 (which on submission writes a new record and archives the previous one to `history/`).

**Event slug naming note**: this spec previously listed `welcome_dinner` as an event. Per the 2026-05-14 design refinement reflecting `bot/docs/our-take.md`: the "welcome" is **not** an actual event (just informal hangout at Chiringuito Bora). The real Friday-evening event is **pre-wedding drinks at Casa Explora (22:30 Fri)**. Event slugs in `events/` Firestore should be updated accordingly: `pre_wedding` replaces `welcome_dinner`.

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

### F4: `logistics_intake` — arrival + transport + accessibility

2 screens.

```json
{
  "version": "6.0",
  "screens": [
    {
      "id": "ARRIVAL",
      "title": "Tu llegada",
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "Logística" },
          { "type": "TextBody", "text": "Para coordinar transporte y alojamiento mejor." },
          {
            "type": "Form",
            "name": "form_arrival",
            "children": [
              {
                "type": "DatePicker",
                "label": "Día de llegada",
                "name": "arrival_date",
                "required": true,
                "min-date": "2026-05-27",
                "max-date": "2026-05-31"
              },
              {
                "type": "Dropdown",
                "label": "Aeropuerto",
                "name": "arrival_airport",
                "required": false,
                "data-source": [
                  { "id": "AGP",   "title": "Málaga (AGP)" },
                  { "id": "GIB",   "title": "Gibraltar (GIB)" },
                  { "id": "JTR",   "title": "Jerez (JTR)" },
                  { "id": "OTHER", "title": "Otro o vengo en coche" }
                ]
              },
              {
                "type": "RadioButtonsGroup",
                "label": "¿Necesitas transporte coordinado?",
                "name": "needs_transport",
                "required": true,
                "data-source": [
                  { "id": "yes", "title": "Sí, ayudadme" },
                  { "id": "no",  "title": "No, voy por mi cuenta" }
                ]
              },
              {
                "type": "Footer",
                "label": "Siguiente",
                "on-click-action": {
                  "name": "navigate",
                  "next": { "type": "screen", "name": "ACCESS" },
                  "payload": {
                    "arrival_date":     "${form.arrival_date}",
                    "arrival_airport":  "${form.arrival_airport}",
                    "needs_transport":  "${form.needs_transport}"
                  }
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "ACCESS",
      "title": "Accesibilidad",
      "terminal": true,
      "data": {
        "arrival_date":    { "type": "string" },
        "arrival_airport": { "type": "string" },
        "needs_transport": { "type": "string" }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "¿Algo más?" },
          {
            "type": "Form",
            "name": "form_access",
            "children": [
              {
                "type": "TextArea",
                "label": "Necesidades de accesibilidad o detalles",
                "name": "accessibility_notes",
                "required": false,
                "max-length": 400
              },
              {
                "type": "Footer",
                "label": "Enviar",
                "on-click-action": {
                  "name": "complete",
                  "payload": {
                    "arrival_date":       "${data.arrival_date}",
                    "arrival_airport":    "${data.arrival_airport}",
                    "needs_transport":    "${data.needs_transport}",
                    "accessibility_notes":"${form.accessibility_notes}"
                  }
                }
              }
            ]
          }
        ]
      }
    }
  ]
}
```

**Handler:** updates `guests/{phone}.logistics`. If `needs_transport === 'yes'`, the bot escalates with urgency `normal` so the operator sees and arranges.

---

### F5: `photo_consent` — **DROPPED**

Removed in the 2026-05-14 design refinement. **Photo consent is collected pre-event on the web** (per the RSVP/profile flow already in place). Thora does **not** trigger a consent flow on first photo. All photos arrive at the bot already tagged with the guest's stored `photoConsent` field.

If `photoConsent == false`, the photo is stored privately (visible only to operator); not added to the album.

If `photoConsent == true`, the photo enters the moderation queue per the standard flow.

If `photoConsent == undefined` (legacy edge case for a guest who's not on the web): Thora replies neutrally — `"Recibida 🐾 Avisa a mis humanos si quieres que aparezca en el álbum compartido o solo para nosotros."` — and the operator handles consent capture out-of-band.

---

### F6: `feedback`

2 screens.

```json
{
  "version": "6.0",
  "screens": [
    {
      "id": "RATING",
      "title": "¿Cómo lo viviste?",
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "Feedback rápido" },
          { "type": "TextBody", "text": "30 segundos. Anónimo si lo prefieres." },
          {
            "type": "Form",
            "name": "form_rating",
            "children": [
              {
                "type": "RadioButtonsGroup",
                "label": "Tu valoración",
                "name": "rating",
                "required": true,
                "data-source": [
                  { "id": "5", "title": "🌟🌟🌟🌟🌟 Brutal" },
                  { "id": "4", "title": "🌟🌟🌟🌟 Muy bien" },
                  { "id": "3", "title": "🌟🌟🌟 Normal" },
                  { "id": "2", "title": "🌟🌟 Mejorable" },
                  { "id": "1", "title": "🌟 Mal" }
                ]
              },
              {
                "type": "Footer",
                "label": "Siguiente",
                "on-click-action": {
                  "name": "navigate",
                  "next": { "type": "screen", "name": "TEXT" },
                  "payload": { "rating": "${form.rating}" }
                }
              }
            ]
          }
        ]
      }
    },
    {
      "id": "TEXT",
      "title": "¿Algo que contar?",
      "terminal": true,
      "data": { "rating": { "type": "string" } },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "Form",
            "name": "form_text",
            "children": [
              {
                "type": "TextArea",
                "label": "Comentarios (opcional)",
                "name": "text",
                "required": false,
                "max-length": 1000
              },
              {
                "type": "Footer",
                "label": "Enviar",
                "on-click-action": {
                  "name": "complete",
                  "payload": {
                    "rating": "${data.rating}",
                    "text":   "${form.text}"
                  }
                }
              }
            ]
          }
        ]
      }
    }
  ]
}
```

**Handler:** writes `bot_feedback`. Ack in Thora's voice: `"Gracias 🐾 De verdad. Cuidaos."`

---

## 5. Triggering a Flow

Two pathways:

### 5.1 Flow button on a template

(See T2 `rsvp_reminder`, T11 `feedback_request` in `05-message-templates.md`.)

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
  flowName: 'rsvp_full',
  language: 'es',
  body: '¡Perfecto! Te paso un formulario rápido (1 minuto). Tócalo 👇',
  ctaLabel: 'Confirmar',
  flowToken: `rsvp_full|+34612345678|${nanoid()}`,
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
        "flow_token": "rsvp_full|+34612345678|<nonce>",
        "flow_id": "<META_FLOW_ID_FROM_CONFIG>",
        "flow_cta": "Confirmar",
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

export const RsvpFullSubmission = z.object({
  flow_token: z.string().regex(/^rsvp_full\|\+\d+\|[A-Za-z0-9_-]+$/),
  first_name: z.string().min(1).max(60),
  last_name: z.string().max(80).optional(),
  attending: z.enum(['yes', 'no']),
  events: z.array(z.enum(['welcome_dinner', 'ceremony', 'reception', 'brunch'])),
  plus_one_name: z.string().max(100).optional(),
  dietary: z.array(z.string()).optional(),
  dietary_notes: z.string().max(400).optional(),
  message: z.string().max(500).optional(),
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
  | 'rsvp_full'
  // | 'brunch_attendance'  ← DROPPED (2026-05-14)
  | 'song_request'
  | 'logistics_intake'      // operator-trigger only
  // | 'photo_consent'      ← DROPPED (2026-05-14, consent on web pre-event)
  | 'feedback';

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
