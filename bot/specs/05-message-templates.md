# Boda en Tarifa — WhatsApp Bot: Message Templates

> Every Meta-approved template the bot sends. Templates are required for any business-initiated message and for re-engaging guests outside the 24-hour Customer Service Window. Implementer: register all of these in `bot/whatsapp/templates.ts`. Operator: submit each via Meta Business Manager → WhatsApp → Templates as documented.

## 1. Quick reference

| Logical name | Meta name (es / en) | Category | Variables | Triggered by | Audience |
|---|---|---|---|---|---|
| `welcome_onboarding` | `welcome_onboarding_es` / `welcome_onboarding_en` | Utility | `{{1}}` first name | Operator (one-time, ~D-7) | All `botEnrolled` guests |
| `rsvp_reminder` | `rsvp_reminder_es` / `rsvp_reminder_en` | Utility | `{{1}}` first name | Operator (manual, conditional) | Guests with `rsvpStatus: pending` |
| `event_reminder_30min` | `event_reminder_30min_es` / `_en` | Utility | `{{1}}` event name, `{{2}}` venue, `{{3}}` time | Scheduled (`sendEventReminder`) | Guests attending event |
| `seating_unlock` | `seating_unlock_es` / `_en` | Utility | `{{1}}` first name, `{{2}}` table label | Scheduled (`sendContentUnlockNotification`) | All attending guests |
| `menu_unlock` | `menu_unlock_es` / `_en` | Utility | `{{1}}` event name | Scheduled | All attending guests |
| `film_developed` | `film_developed_es` / `_en` | Utility | `{{1}}` first name | Scheduled (`triggerFilmDevelopment`, 05:00 May 31) | All `botEnrolled` |
| `weather_morning_brief` | `weather_morning_brief_es` / `_en` | Utility | `{{1}}` weather summary, `{{2}}` wind direction | Scheduled (08:00 each event day) | All attending guests of that day |
| `farewell_thanks` | `farewell_thanks_es` / `_en` | Utility | `{{1}}` first name | Operator (manual, ~D+1) | All `botEnrolled` |
| `manual_announcement` | `manual_announcement_es` / `_en` | Utility | `{{1}}` body text | Operator (ad-hoc) | Selected audience |
| `escalation_followup` | `escalation_followup_es` / `_en` | Utility | `{{1}}` operator reply text | Auto when operator replies > 24h after CSW closed | Single guest |
| `feedback_request` | `feedback_request_es` / `_en` | Utility | `{{1}}` first name | Scheduled (12:00 June 1) | All `botEnrolled` |

All templates are **Utility** category. None are Marketing. None are Authentication.

## 2. Authoring conventions

- **Headers:** prefer text headers; image headers only where they add real value (welcome, film_developed, farewell). Image must be a static PNG/JPG ≤5MB hosted at a stable URL.
- **Bodies:** keep ≤350 characters to maximize readability and approval rate.
- **Variables:** sequential `{{1}}`, `{{2}}` etc. Each must be referenced in the body (Meta requires this). No leading/trailing variables (also a Meta rule).
- **Buttons:**
  - **Quick reply** buttons fire as inbound messages — handle them in `bot/handlers/conversation.ts` like text. Max 3 per template.
  - **URL** buttons can carry a single `{{1}}` variable for personalization (e.g., per-guest seating page). Use sparingly.
  - **Phone** buttons not used (we don't surface personal numbers).
  - **Flow** buttons attach a Flow trigger — used in some templates below.
- **Footers:** optional, ≤60 chars. Use a tiny brand line: "Boda en Tarifa".
- **Locale:** Meta lets you set a language code on the template. Use `es_ES` and `en_US`. Submit both variants of every template.
- **Naming on Meta side:** lowercase, snake_case, ≤512 chars. Use the `_es` / `_en` suffix convention listed above.
- **Approval expectation:** ~1–24h. Submit all templates by Day 4 of the implementation plan (see `bot/docs/implementation-plan.md`).

## 3. The templates (full copy)

For each template: header, body, footer, buttons, variables, when it fires, and notes.

---

### T1: `welcome_onboarding`

**Purpose:** First touch with each guest; primes them for the bot relationship and opens a CSW so subsequent free-form messages work.

**Header (image):** static PNG/JPG hosted at `https://bodaentarifa.com/og/welcome-{lang}.jpg` (operator provides asset).

**Body — ES:**
```
¡Hola {{1}}! 👋

Soy el asistente digital de la boda de Enrique y Manuel (29-31 de mayo en Tarifa).

Pregúntame lo que necesites: horarios, ubicaciones, cómo llegar, qué llevar, lo que sea. Tu mensaje me abre la conversación.
```

**Body — EN:**
```
Hi {{1}}! 👋

I'm the digital assistant for Enrique & Manuel's wedding (May 29-31, Tarifa, Spain).

Ask me anything you need: schedule, venues, how to get there, what to wear. Just send me a message to start.
```

**Footer:** `Boda en Tarifa`

**Buttons (both languages, quick replies):**
- ES: `📅 Programa` / `📍 Cómo llegar` / `✅ Confirmar`
- EN: `📅 Schedule` / `📍 How to get there` / `✅ RSVP`

**Variables:** `{{1}}` = guest first name.

**Trigger:** operator-initiated bulk send via admin "Broadcast" page, ~7 days before wedding.

**Notes:**
- Quick-reply buttons trigger inbound messages with text matching the button label; bot handlers detect those exact strings as quick-replies and route to F3/F4/F5 from the PRD.
- Sending this template opens the CSW for 24h, allowing the bot to engage freely with their first reply.

---

### T2: `rsvp_reminder`

**Purpose:** Nudge guests who haven't completed RSVP. Triggers the RSVP Flow directly.

**Body — ES:**
```
¡Hola {{1}}!

Solo recordatorio: aún no has confirmado para la boda de Enrique y Manuel. Te toma 1 minuto y nos ayuda mucho con la planificación. 💛
```

**Body — EN:**
```
Hi {{1}},

Just a quick reminder: you haven't confirmed for Enrique & Manuel's wedding yet. Takes 1 minute and helps us a lot with planning. 💛
```

**Footer:** `Boda en Tarifa`

**Buttons:**
- **Flow button** labeled `Confirmar` (ES) / `RSVP now` (EN) → opens RSVP Flow (see `06-whatsapp-flows.md` F1).
- **Quick reply** `Más tarde` (ES) / `Later` (EN) → bot acknowledges and notes for re-prompt in 48h.

**Variables:** `{{1}}` = guest first name.

**Trigger:** operator manual or scheduled, audience filtered by `rsvpStatus: 'pending'`.

---

### T3: `event_reminder_30min`

**Purpose:** Time-of-event nudge.

**Body — ES:**
```
🌅 *{{1}}* empieza en 30 minutos.

📍 {{2}}
🕐 {{3}}

¡Te esperamos!
```

**Body — EN:**
```
🌅 *{{1}}* starts in 30 minutes.

📍 {{2}}
🕐 {{3}}

See you there!
```

**Footer:** `Boda en Tarifa`

**Buttons (URL, dynamic):**
- ES: `Ver detalles` → `https://bodaentarifa.com/eventos/{{4}}`
- EN: `View details` → `https://bodaentarifa.com/events/{{4}}`

(Wait — URL templates currently only support one URL with one variable, depending on Meta's current capability. If a URL parameter isn't supported alongside body variables, the button uses a static URL `https://bodaentarifa.com/programa` and the event ID is implicit in the user's session.)

**Variables:**
- `{{1}}` = event name (localized)
- `{{2}}` = venue name
- `{{3}}` = time string ("18:00", "8:30 PM")
- `{{4}}` (URL button) = event slug

**Trigger:** scheduled function `sendEventReminder` (extended from existing).

**Notes:**
- Idempotency keyed by `(eventId, guestId)` in `bot_send_log`.
- Skip guests with `botEnrolled: false`.
- Skip guests not on the event's attendee list.

---

### T4: `seating_unlock`

**Purpose:** Reveal each guest's table.

**Body — ES:**
```
🪑 ¡Tu sitio está listo, {{1}}!

Te sentás en *{{2}}*.

El plano completo y quién más está en tu mesa, en el botón.
```

**Body — EN:**
```
🪑 Your seat is ready, {{1}}!

You're at *{{2}}*.

Tap below for the full layout and tablemates.
```

**Footer:** `Boda en Tarifa`

**Buttons (URL, personalized):**
- ES: `Ver mi mesa` → `https://bodaentarifa.com/mi-mesa/{{3}}`
- EN: `See my table` → `https://bodaentarifa.com/my-table/{{3}}`

**Variables:**
- `{{1}}` = first name
- `{{2}}` = table label (e.g., "Mesa 7 — La Calma")
- `{{3}}` = signed token for the personal seating page

**Trigger:** scheduled `sendContentUnlockNotification` for `seating` content at unlock time (configured in `time_gated_content/seating`).

---

### T5: `menu_unlock`

**Purpose:** Reveal menu.

**Body — ES:**
```
🍽️ Menú disponible para *{{1}}*. Échale un ojo en el botón si quieres ir abriendo el apetito.
```

**Body — EN:**
```
🍽️ Menu unlocked for *{{1}}*. Tap below to peek and start working up an appetite.
```

**Buttons (URL):**
- ES: `Ver menú` → `https://bodaentarifa.com/menu/{{2}}`
- EN: `View menu` → `https://bodaentarifa.com/menu/{{2}}`

**Variables:** `{{1}}` event name; `{{2}}` event slug.

**Trigger:** scheduled `sendContentUnlockNotification` for `menu` content at the configured unlock time (12:00 day-of by default).

---

### T6: `film_developed`

**Purpose:** The post-wedding "film developed" album reveal — replaces the planned native disposable-camera reveal.

**Header (image):** static PNG with retro-film aesthetic. URL: `https://bodaentarifa.com/og/film-developed.jpg`.

**Body — ES:**
```
🎞️ Buenos días {{1}}.

El álbum de fotos de la boda está revelado. Todas las fotos que mandasteis (y muchas más), tratadas con cariño analógico.

Tómate un café. Disfruta. 💛
```

**Body — EN:**
```
🎞️ Good morning {{1}}.

The wedding album is developed. Every photo you sent (and many more), treated with analog care.

Grab a coffee. Take it in. 💛
```

**Buttons (URL):**
- ES: `Ver el álbum` → `https://bodaentarifa.com/album`
- EN: `View the album` → `https://bodaentarifa.com/album`

**Variables:** `{{1}}` = first name.

**Trigger:** scheduled `triggerFilmDevelopment` at 05:00 May 31, 2026 (`Europe/Madrid`).

**Notes:**
- Album is private until this trigger; the function flips `config/album.public = true` and unhides approved `feed_posts`.
- This is the most emotionally weighted send. Operator should pre-approve the asset, body, and timing.

---

### T7: `weather_morning_brief`

**Purpose:** Daily orientation, capitalizes on the Tarifa wind being a *thing*.

**Body — ES:**
```
☀️ ¡Buenos días!

Hoy: *{{1}}*. Viento *{{2}}*.

Si necesitas algo, ya sabes dónde estoy.
```

**Body — EN:**
```
☀️ Good morning!

Today: *{{1}}*. Wind *{{2}}*.

Need anything, you know where to find me.
```

**Variables:**
- `{{1}}` = weather summary (e.g., "Sunny, 24°C max")
- `{{2}}` = wind name + speed (e.g., "Levante, 22 km/h")

**Trigger:** scheduled at 08:00 each event day. Pulls from Open-Meteo (cached).

---

### T8: `farewell_thanks`

**Purpose:** Post-wedding thank-you, ~D+1.

**Header (image):** group photo if available, else a sunset image.

**Body — ES:**
```
{{1}}, gracias por estar.

De parte de Enrique y Manuel: la boda no habría sido lo mismo sin ti. Si subes alguna foto más en los próximos días, mándamela y la añado al álbum.

Hasta pronto. 🌅
```

**Body — EN:**
```
{{1}}, thank you for being there.

From Enrique & Manuel: the wedding wouldn't have been the same without you. If you take any more photos in the next few days, send them my way and I'll add them to the album.

See you soon. 🌅
```

**Variables:** `{{1}}` = first name.

**Trigger:** operator manual, ~14:00 June 1, 2026.

---

### T9: `manual_announcement`

**Purpose:** Generic broadcast container the operator uses for one-off updates ("the welcome dinner location has shifted 200m up the beach due to wind").

**Body — ES:**
```
📣 {{1}}
```

**Body — EN:**
```
📣 {{1}}
```

**Footer:** `Boda en Tarifa`

**Variables:** `{{1}}` = the announcement body. Operator types it in admin UI.

**Trigger:** operator broadcast.

**Notes:**
- Limit `{{1}}` content to ≤300 chars in admin UI to ensure approval-compliant rendering.
- Bot still respects opt-outs.

---

### T10: `escalation_followup`

**Purpose:** When the operator replies after the CSW has closed (>24h since user's last inbound), we can't free-form. This template is the carrier.

**Body — ES:**
```
✉️ Mensaje de Enrique:

«{{1}}»

Si quieres seguir hablando, escríbeme y abrimos conversación.
```

**Body — EN:**
```
✉️ Message from Enrique:

"{{1}}"

If you want to keep talking, just message me and we'll resume.
```

**Variables:** `{{1}}` = the operator's reply text (sanitized).

**Trigger:** automatic — when operator replies in admin dashboard and the target's CSW is closed.

**Notes:**
- Sanitize `{{1}}`: max 600 chars; strip line breaks Meta can't render in templates (replace with `\n` literals — Meta supports two literal newlines in templates, no more); escape any chars that break Meta's parser.
- If the reply is longer than 600 chars, send the template with a truncated version + a quick-reply "Read more" that, when tapped, the bot answers (CSW now open) with the full text.

---

### T11: `feedback_request`

**Purpose:** Post-event feedback Flow.

**Body — ES:**
```
{{1}}, último mensaje del bot 💛

¿Cómo lo viviste? Te dejo un formulario rapidísimo (30 segundos) para que nos cuentes lo que te apetezca.
```

**Body — EN:**
```
{{1}}, one last message from the bot 💛

How was it for you? Quick form (30 seconds) so you can share whatever you'd like.
```

**Buttons:**
- **Flow button** labeled `Dar feedback` (ES) / `Give feedback` (EN) → opens feedback Flow.

**Variables:** `{{1}}` = first name.

**Trigger:** scheduled, 12:00 June 1, 2026.

---

## 4. Submission instructions (operator)

For each of the 11 logical templates × 2 languages = **22 templates** to submit.

1. Meta Business Suite → WhatsApp Manager → select WABA → Message Templates → Create.
2. Category: **Utility**.
3. Language: pick `Spanish (Spain) — es_ES` or `English (US) — en_US`.
4. Name: lowercase snake_case from §1.
5. Header: text or media per spec.
6. Body: paste exactly. Variables in order.
7. Footer: `Boda en Tarifa`.
8. Buttons: per spec. For Flow buttons, the Flow must be published first (see `06-whatsapp-flows.md`).
9. Submit. Approval typically <2h.

If a template is rejected:

- Most common reasons: variables at start/end of body, marketing-y wording, missing context. Read Meta's reason and re-submit.
- If rejected twice with no clear path, escalate by emailing Meta WhatsApp support (response 1–3 days). For our timeline this should not be needed if we follow Utility-style copy.

## 5. Lifecycle

- **Pre-launch:** all 22 templates submitted by Day 4. Mark `config/bot.templates.activeNames` once approved.
- **Mid-event:** templates can't be edited; deletion + re-create only, with new approval. So lock copy.
- **Post-event:** templates remain on the WABA. After decommission (90 days post-wedding), delete to keep the WABA clean.

## 6. Implementation contract

In `bot/whatsapp/templates.ts`:

```ts
export type TemplateName =
  | 'welcome_onboarding'
  | 'rsvp_reminder'
  | 'event_reminder_30min'
  | 'seating_unlock'
  | 'menu_unlock'
  | 'film_developed'
  | 'weather_morning_brief'
  | 'farewell_thanks'
  | 'manual_announcement'
  | 'escalation_followup'
  | 'feedback_request';

export interface TemplateDef<V extends Record<string, string>> {
  name: TemplateName;
  metaName: (lang: 'es' | 'en') => string;   // e.g., (l) => `welcome_onboarding_${l}`
  category: 'utility';
  variableSchema: ZodSchema<V>;                // Zod schema validating variable bag
  buildPayload: (lang: 'es' | 'en', vars: V) => MetaTemplatePayload;
}

export const TEMPLATES: Record<TemplateName, TemplateDef<any>> = { ... };
```

`bot/whatsapp/send.ts` exposes:

```ts
sendTemplate(opts: { to: E164; name: TemplateName; lang: 'es' | 'en'; vars: Record<string, string>; idempotencyKey?: string }): Promise<{ metaMessageId: string }>
```

It handles:

- Variable validation (Zod).
- Idempotency check via `bot_send_log` if `idempotencyKey` provided.
- Retry with exponential backoff on transient Meta errors.
- Persisting `bot_send_log` and `bot_conversations/.../messages`.

## 7. Test plan

- **Unit:** every template's `buildPayload` produces the expected JSON for sample inputs in both languages.
- **Integration (emulator):** simulate scheduled function firing → verifies template name, variables, and idempotency record.
- **Live (test number, day -10):** send each template once to operator's own number in both languages; visually verify rendering on iOS and Android.
- **Approval audit (day -7):** confirm all 22 templates show `Approved` in Meta Business Suite. Halt launch if any are pending.
