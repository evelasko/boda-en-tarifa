# Boda en Tarifa — WhatsApp Bot: Flows

> Multi-screen forms rendered natively inside WhatsApp. Each Flow is defined as JSON, published to Meta, and triggered either via a template button or as a session message. Submission arrives at the webhook as `interactive.type === 'nfm_reply'`.

## 1. Flow inventory

| ID | Logical name | Purpose | Screens | Triggered by | Submission handler |
|---|---|---|---|---|---|
| F1 | `rsvp_full` | Full RSVP capture | 4 | T2 button, "rsvp" intent, onboarding quick reply | `services/rsvp.ts.submitRsvpFlow()` |
| F2 | `brunch_attendance` | Brunch attendance + dietary | 1 | "brunch" intent, manual trigger | `services/rsvp.ts.submitBrunchFlow()` |
| F3 | `song_request` | Song requests | 1 | "song" intent, manual trigger | `services/songs.ts.submitSongFlow()` |
| F4 | `logistics_intake` | Arrival, transport, accessibility | 2 | Manual trigger from operator | `services/guests.ts.submitLogisticsFlow()` |
| F5 | `photo_consent` | One-time consent for photo publishing | 1 | First photo received with no consent on file | `services/photos.ts.submitConsentFlow()` |
| F6 | `feedback` | Post-event feedback | 2 | T11 button | `services/feedback.ts.submitFeedbackFlow()` |

Each Flow's Meta-side ID is stored in `config/bot.flows.activeIds` as `{ rsvp_full: "12345...", ... }` so the implementation references logical names.

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
                  { "id": "welcome_dinner", "title": "Cena de bienvenida — Vie 29, 20:30" },
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
| Cena de bienvenida — Vie 29, 20:30 | Welcome dinner — Fri 29, 20:30 |
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
  //      events: { welcome_dinner: bool, ceremony: bool, reception: bool, brunch: bool },
  //      plusOne: { name?: string },
  //      dietary: string[],
  //      dietaryNotes?: string,
  //      message?: string,
  //      submittedAt: serverTimestamp(),
  //    }
  // 4. Idempotency: if rsvp_responses/{guestId} exists, update with new submission;
  //    write old one to rsvp_responses/{guestId}/history/{auto} for audit.
  // 5. Update guests/{phone}.rsvpStatus accordingly.
  // 6. Send confirmation session message via WhatsApp:
  //    ES: "¡Recibido! Si necesitas cambiar algo, escríbeme y lo arreglamos. 💛"
  //    EN: "Got it! If you need to change anything, just message me. 💛"
  // 7. Log everything via services/audit.ts.
}
```

---

### F2: `brunch_attendance` — single-screen brunch yes/no + dietary delta

```json
{
  "version": "6.0",
  "screens": [{
    "id": "BRUNCH",
    "title": "Brunch del domingo",
    "terminal": true,
    "layout": {
      "type": "SingleColumnLayout",
      "children": [
        { "type": "TextHeading", "text": "Brunch despedida — Dom 31" },
        { "type": "TextBody", "text": "11:30, en {venue}. ¿Te apuntas?" },
        {
          "type": "Form",
          "name": "form_brunch",
          "children": [
            {
              "type": "RadioButtonsGroup",
              "label": "¿Vienes al brunch?",
              "name": "attending",
              "required": true,
              "data-source": [
                { "id": "yes",   "title": "Sí" },
                { "id": "no",    "title": "No" },
                { "id": "maybe", "title": "Aún no lo sé" }
              ]
            },
            {
              "type": "TextArea",
              "label": "Cualquier nota (opcional)",
              "name": "notes",
              "required": false,
              "max-length": 200
            },
            {
              "type": "Footer",
              "label": "Enviar",
              "on-click-action": {
                "name": "complete",
                "payload": {
                  "attending": "${form.attending}",
                  "notes": "${form.notes}"
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

**Handler:** updates `rsvp_responses/{guestId}.events.brunch` and `.brunchNotes`. Sends an ack.

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

**Handler:** writes a `song_requests` doc; ack with "🎵 ¡Apuntada! Le pasamos la lista al DJ. 🤞".

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

### F5: `photo_consent`

```json
{
  "version": "6.0",
  "screens": [{
    "id": "CONSENT",
    "title": "Permiso de fotos",
    "terminal": true,
    "layout": {
      "type": "SingleColumnLayout",
      "children": [
        { "type": "TextHeading", "text": "Una pregunta rápida" },
        {
          "type": "TextBody",
          "text": "¿Podemos publicar las fotos que mandas en el álbum compartido de la boda? Será visible para los demás invitados a partir del domingo 31."
        },
        {
          "type": "Form",
          "name": "form_consent",
          "children": [
            {
              "type": "RadioButtonsGroup",
              "label": "¿Las publicamos?",
              "name": "consent",
              "required": true,
              "data-source": [
                { "id": "yes", "title": "Sí, claro" },
                { "id": "no",  "title": "No, mejor solo para vosotros dos" }
              ]
            },
            {
              "type": "Footer",
              "label": "Listo",
              "on-click-action": {
                "name": "complete",
                "payload": { "consent": "${form.consent}" }
              }
            }
          ]
        }
      ]
    }
  }]
}
```

**Handler:** updates `guests/{phone}.photoConsent` to `true`/`false`. If `false`, the bot replies: "Hecho — quedan privadas, las verán solo Enrique y Manuel. 💛". Existing `feed_posts` from this guest with `consent: 'pending'` are bulk-updated to match.

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

**Handler:** writes `bot_feedback`. Ack: "Gracias 💛 De verdad."

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
  | 'brunch_attendance'
  | 'song_request'
  | 'logistics_intake'
  | 'photo_consent'
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
