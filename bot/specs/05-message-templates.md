# Boda en Tarifa — WhatsApp Bot: Message Templates

> Every Meta-approved template Thora sends. Templates are required for any business-initiated message and for re-engaging guests outside the 24-hour Customer Service Window. All templates speak in **Thora's voice** per `02-conversation-design.md`. Implementer: register all of these in `bot/whatsapp/templates.ts`. Operator: submit each via Meta Business Manager → WhatsApp → Templates as documented.

## 1. Quick reference

| Logical name | Meta name (es / en) | Category | Variables | Triggered by | Audience |
|---|---|---|---|---|---|
| `welcome_onboarding` | `welcome_onboarding_es` / `_en` | Utility | `{{1}}` first name | Operator (one-time, D-7, after D-8 pilot to ~5) | All `botEnrolled` guests |
| `event_reminder_30min` | `event_reminder_30min_es` / `_en` | Utility | `{{1}}` event name, `{{2}}` venue, `{{3}}` time | Scheduled (`sendEventReminder`) | Guests attending event. **Note:** for the ceremony, this is REPLACED by T12+T13 bus templates. |
| `seating_unlock` | `seating_unlock_es` / `_en` | Utility | `{{1}}` first name, `{{2}}` table label, `{{3}}` signed token | Scheduled (`sendContentUnlockNotification`, 19:30 Sat May 30) | All attending guests |
| ~~`menu_unlock`~~ | — | **DROPPED** | — | — | Menus are paper at-seat. Thora deflects in chat instead. |
| `film_developed` | `film_developed_es` / `_en` | Utility | `{{1}}` first name | Scheduled (`triggerFilmDevelopment`, **20:00 May 31**) | All `botEnrolled` |
| `weather_morning_brief` | `weather_morning_brief_es` / `_en` | Utility | `{{1}}` weather summary, `{{2}}` wind summary | Scheduled (08:00 each event day) | All attending guests of that day |
| `farewell_thanks` | `farewell_thanks_es` / `_en` | Utility | `{{1}}` first name | Operator (manual, ~14:00 June 1) | All `botEnrolled` |
| `manual_announcement` | `manual_announcement_es` / `_en` | Utility | `{{1}}` body text | Operator (ad-hoc) | Selected audience |
| `escalation_followup` | `escalation_followup_es` / `_en` | Utility | `{{1}}` operator message text | Auto fallback when operator replies > 24h after CSW closed AND cannot use personal number | Single guest |
| **`bus_pickup_early`** | `bus_pickup_early_es` / `_en` | Utility | none | Scheduled (14:00 Sat May 30) | All ceremony attendees |
| **`bus_pickup_last`** | `bus_pickup_last_es` / `_en` | Utility | none | Scheduled (16:45 Sat May 30) | All ceremony attendees |
| **`pre_wedding_drinks`** | `pre_wedding_drinks_es` / `_en` | Utility | none | Scheduled (21:00 Fri May 29) | All pre-wedding attendees |
| **`arrival_day_nudge`** | `arrival_day_nudge_es` / `_en` | Utility | `{{1}}` first name | Per-guest scheduled (15:00 on their `arrival_date`) | Each guest individually |
| **`song_request_party_open`** | `song_request_party_open_es` / `_en` | Utility | none | Scheduled (00:00 Sun May 31, i.e. Saturday night party start) | Reception/party attendees |

All templates are **Utility** category. None are Marketing. None are Authentication.

**Total templates to submit: 13 logical × 2 languages = 26 templates**.

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

**Purpose:** First touch with each guest; reveals Thora's identity, primes them for the bot relationship, opens a CSW so subsequent free-form messages work.

**Header (image):** photo of Thora (warm, slightly playful, wedding-context). Operator provides asset, hosted at `https://bodaentarifa.com/og/thora-welcome.jpg` (or similar stable URL).

**Body — ES:**
```
¡Guau Guau {{1}}! 🐾

Soy Thora! sí, la perra de Enrique y Manuel. Mis papis me han regalado un teléfono para que encargue de atenderos y ayudaros durante estos días. Ya solo queda una semana y los tres queremos que lo pases fenomenal!

Me han entrenado muy bien, así que pregúntame lo que necesites: horarios, ubicaciones, cómo llegar, qué llevar, lo que sea. Tu mensaje abre la conversación.
```

**Body — EN:**

```
Woof {{1}}! 🐾

I'm Thora — yes, Enrique and Manuel's dog. They handed me a keyboard for the wedding (May 29-31, Tarifa) and turns out I'm not bad at this.

Ask me anything: schedule, venues, how to get there, what to wear. Just send me a message to start.
```

**Footer:** `Thora al habla`

**Buttons (both languages, quick replies):**
- ES: `📅 Programa` / `📍 Cómo llegar` / `🐾 Qué tal, Thora`
- EN: `📅 Schedule` / `📍 How to get there` / `🐾 Hi Thora`

**Variables:** `{{1}}` = guest first name.

**Trigger:** operator-initiated bulk send via admin "Broadcast" page. **D-8: pilot send to ~5 willing recipients (Enrique + Manuel + 2-3 friends) for verification. D-7: full broadcast.**

**Notes:**
- The third quick-reply button replaces the original RSVP CTA — most guests will have RSVPed via web before this fires. RSVP-pending guests get the Flow conversationally on first contact.
- Quick-reply buttons trigger inbound messages with text matching the button label; bot handlers detect those exact strings as quick-replies and route appropriately.
- Sending this template opens the CSW for 24h, allowing Thora to engage freely with their first reply.
- The audience auto-segments by `guests[].language` so ES guests get ES variant.

---

### T2: `rsvp_reminder` — **DROPPED**

**Purpose:** Removed from operations. All guests have already submitted RSVP, so no RSVP reminder template is needed.

**Body — ES:**
```
¡Guau {{1}}! 🐾

Recordatorio rápido: aún no tengo tu confirmación para la boda de mis humanos. Te toma 1 minuto y me ayuda mucho con la planificación.
```

**Body — EN:**
```
Woof {{1}}! 🐾

Quick reminder: I don't have your RSVP yet for my humans' wedding. Takes 1 minute and helps a lot with planning.
```

**Footer:** `Thora al habla`

**Buttons:**
- **Flow button** labeled `Confirmar` (ES) / `RSVP now` (EN) → opens RSVP Flow (see `06-whatsapp-flows.md` F1).
- **Quick reply** `Más tarde` (ES) / `Later` (EN) → Thora acknowledges and notes for re-prompt in 48h.

**Variables:** `{{1}}` = guest first name.

**Trigger:** none (template not submitted, not used).

---

### T3: `event_reminder_30min`

**Purpose:** Generic 30-min-before nudge for events that don't have their own dedicated template (i.e., not the ceremony, which uses T12/T13 instead).

**Body — ES:**
```
🐾 *{{1}}* empieza en 30 minutos.

📍 {{2}}
🕐 {{3}}

¡Os esperamos!
```

**Body — EN:**
```
🐾 *{{1}}* starts in 30 minutes.

📍 {{2}}
🕐 {{3}}

See you there!
```

**Footer:** `Thora al habla`

**Buttons (URL, dynamic):**
- ES: `Ver detalles` → `https://bodaentarifa.com/eventos/{{4}}`
- EN: `View details` → `https://bodaentarifa.com/events/{{4}}`

(If Meta doesn't support a URL parameter alongside body variables in the current template version, the button uses a static URL `https://bodaentarifa.com/programa` and the event ID is implicit in the user's session.)

**Variables:**
- `{{1}}` = event name (localized)
- `{{2}}` = venue name
- `{{3}}` = time string ("18:00", "8:30 PM")
- `{{4}}` (URL button) = event slug

**Trigger:** scheduled function `sendEventReminder`.

**Notes:**
- Idempotency keyed by `(eventId, guestId)` in `bot_send_log`.
- Skip guests with `botEnrolled: false`.
- Skip guests not on the event's attendee list.
- **Skip event_id = `ceremony`** — that event uses T12 + T13 (bus pickup beats) instead.
- The Pre-wedding event (Casa Explora, Fri 22:30) uses T14 `pre_wedding_drinks` instead of the generic 30-min reminder, since 22:00 lands during dinner for many guests.

---

### T4: `seating_unlock`

**Purpose:** Reveal each guest's table on Saturday 19:30 — the first time-gated reveal.

**Body — ES:**

```
🐾 Te he buscado sitio yo misma, {{1}}.

Estás en *{{2}}*. Con quién más? dale al botón.
```

**Body — EN:**

```
🐾 I picked your seat myself, {{1}}.

You're at *{{2}}*. For who else is at your table, tap below.
```

**Footer:** `Thora al habla`

**Buttons (URL, personalized):**
- ES: `Ver mi mesa` → `https://bodaentarifa.com/mi-mesa/{{3}}`
- EN: `See my table` → `https://bodaentarifa.com/my-table/{{3}}`

**Variables:**
- `{{1}}` = first name
- `{{2}}` = table label (e.g., "Mesa 7 — La Calma")
- `{{3}}` = signed token for the personal seating page

**Trigger:** scheduled `sendContentUnlockNotification` for `seating` content at unlock time (configured in `time_gated_content/seating`, **Saturday May 30 at 19:30 Europe/Madrid**).

---

### T5: `menu_unlock` — **DROPPED**

This template was originally specified to reveal the dinner menu. **Removed** during the 2026-05-14 design refinement: menus are paper at-seat at the dinner venue, no digital reveal needed. Thora handles menu questions in chat with a humorous deflection (see `02-conversation-design.md` §7 G5b):

> "El menú me lo escondieron porque se me hacía la boca agua 🐾 Pero lo tienes impreso en tu sitio cuando llegues a la cena."

**Implementation ripple:**
- `lookup_menu` tool dropped from `07-knowledge-base.md`.
- No scheduled `sendContentUnlockNotification` fire for menu content.
- `time_gated_content/menu` Firestore doc no longer used by the bot (may remain for web display if desired).
- Menu section removed from the KB build output.

---

### T6: `film_developed`

**Purpose:** The post-wedding "film developed" album reveal — Thora-flavored, fired Sunday evening (shifted from original 05:00 dawn to **20:00 May 31** so brunch photos make it in; D20).

**Header (image):** static PNG with retro-film aesthetic, ideally featuring Thora. URL: `https://bodaentarifa.com/og/film-developed.jpg`.

**Body — ES:**

```
🐾 Buenas tardes {{1}}.

Recién despierta de la siesta y con hambre. El álbum de la boda está listo — todas las fotos que mandasteis (y muchas más), tratadas con cariño.

Coged una copa. Mirad con calma 💛
```

**Body — EN:**
```
🐾 Good evening {{1}}.

Just woke up from a nap, already hungry. The wedding album is ready — every photo you sent (and many more), with extra care.

Pour yourself a drink. Take it in 💛
```

**Buttons (URL):**
- ES: `Ver el álbum` → `https://bodaentarifa.com/album`
- EN: `View the album` → `https://bodaentarifa.com/album`

**Variables:** `{{1}}` = first name.

**Trigger:** scheduled `triggerFilmDevelopment` at **20:00 May 31, 2026** (`Europe/Madrid`).

**Notes:**
- Album is private until this trigger; the function flips `config/album.public = true` and unhides approved `feed_posts`.
- This is the most emotionally weighted send. Operator does a 60-min moderation pass between ~17:00–19:00 Sunday before this fires.
- Operator should pre-approve the header asset, body copy, and timing in the D-2 smoke test.

---

### T7: `weather_morning_brief`

**Purpose:** Daily orientation; capitalizes on the Tarifa wind being a *thing*. Thora as local-eye reporter.

**Body — ES:**
```
🐾 ¡Buenos días! Acabo de salir un rato y os cuento.

Hoy: *{{1}}*. Viento *{{2}}*.

Si necesitáis algo, dadme un toque.
```

**Body — EN:**
```
🐾 Good morning! Just stepped out and here's the report.

Today: *{{1}}*. Wind *{{2}}*.

Need anything, you know where to find me.
```

**Variables:**
- `{{1}}` = weather summary (e.g., "soleado, 24°C max" / "sunny, 24°C max")
- `{{2}}` = wind summary (e.g., "Levante, 22 km/h" / "Levante, 22 km/h")

**Trigger:** scheduled at 09:00 each event day (Fri May 29, Sat May 30, Sun May 31). Pulls from Open-Meteo (cached 30 min).

**Notes:**
- **Strong-wind variant**: when Levante > 25 km/h or Poniente > 30 km/h, the wind summary string `{{2}}` is constructed with a trailing tip baked in by the pipeline (rather than a separate template — single template, dynamic value): e.g., `"Levante, 28 km/h — gorros y gafas si vais a la playa"`. Template-safe because variable interpolation doesn't change.
- Strong-wind threshold + tip logic lives in `bot/services/weather.ts`. Tip pool sourced from `config/wind_tips` (Firestore).

---

### T8: `farewell_thanks`

**Purpose:** Post-wedding thank-you, ~14:00 D+1 (Mon Jun 1).

**Header (image):** group photo if available, else a sunset image with Thora in frame.

**Body — ES:**
```
{{1}}, ya estoy camino a casa con mis humanos derrotados.

Gracias por venir — no habría sido lo mismo sin vosotros 🌅 Si subís alguna foto más estos días, mandádmela y la añado al álbum.

Hasta pronto 🐾
```

**Body — EN:**
```
{{1}}, I'm on the sofa now with my exhausted humans.

Thank you for being there — wouldn't have been the same without you all 🌅 If you take any more photos in the next few days, send them my way and I'll add them.

See you soon 🐾
```

**Variables:** `{{1}}` = first name.

**Trigger:** operator manual, ~14:00 June 1, 2026.

---

### T9: `manual_announcement`

**Purpose:** Generic broadcast container the operator uses for one-off updates ("la pista de baile se mueve a la zona de la piscina por el viento"). Always delivered in Thora's voice.

**Body — ES:**
```
🐾 {{1}}
```

**Body — EN:**
```
🐾 {{1}}
```

**Footer:** `Thora al habla`

**Variables:** `{{1}}` = the announcement body. Operator types it in admin UI.

**Trigger:** operator broadcast.

**Notes:**
- The paw emoji replaces the original megaphone — Thora's voice is the consistent messenger frame.
- Operator drafts the content; Thora delivers it. For human-attributed personal messages, operator messages from their own WhatsApp directly (D19).
- Limit `{{1}}` content to ≤300 chars in admin UI to ensure approval-compliant rendering.
- Bot still respects opt-outs.

---

### T10: `escalation_followup`

**Purpose:** **Fallback** template for the edge case where operator replies after CSW is closed (>24h since user's last inbound) AND can't use their personal WhatsApp number. Per the D19 two-channel policy, this template is rarely used.

**Body — ES:**
```
🐾 Mis humanos os mandan decir:

«{{1}}»

Si queréis seguir hablando, escribidme y abrimos.
```

**Body — EN:**
```
🐾 My humans say:

"{{1}}"

If you want to keep talking, just message me and we'll resume.
```

**Variables:** `{{1}}` = the operator's message text (sanitized).

**Trigger:** automatic — when operator replies in admin dashboard AND target's CSW is closed AND operator has chosen NOT to use their personal WhatsApp.

**Notes:**
- Per D19, the **preferred** path post-CSW-close is for the operator to message the guest directly from their own WhatsApp. This template exists as a fallback for helper-operators or cases where the personal-number path isn't available.
- Sanitize `{{1}}`: max 600 chars; strip line breaks Meta can't render (replace with `\n` literals — Meta supports two literal newlines in templates, no more); escape any chars that break Meta's parser.
- If the reply is longer than 600 chars, send a truncated version + a quick-reply "Sigue / Read more" that re-opens conversation (CSW now open) for Thora to deliver the rest.

---

### T11: `feedback_request` — **DROPPED**

**Purpose:** Removed from operations. Flow F6 (`feedback`) was removed, so this template is no longer used.

**Body — ES:**
```
🐾 {{1}}, último mensaje mío. Os echo de menos ya.

¿Qué tal lo viviste? Tengo un formulario rapidísimo (30 segundos) — te dejo el botón.
```

**Body — EN:**
```
🐾 {{1}}, last message from me. Already missing you all.

How was it for you? Quick form (30 seconds) — tap below.
```

**Buttons:** none (template not submitted).

**Variables:** `{{1}}` = first name.

**Trigger:** none (template not submitted, not used).

---

### T12: `bus_pickup_early`

**Purpose:** First of two bus-pickup reminders. Lands at **14:00 Saturday** so guests read it before they start getting ready. Replaces the generic 30-min `event_reminder_30min` for the ceremony (which would arrive too late).

**Body — ES:**

```
🐾 llegó el gran día!

Recordad: los autobuses para la ceremonia salen del parking del hotel *100% Fun* a las *17:30*. Mejor estad allí a las *17:15*.

Aún queda tiempo para un bañito 🌊
```

**Body — EN:**

```
🐾 Big afternoon today.

Reminder: buses for the ceremony leave from the *100% Fun hotel parking* at *17:30*. Best be there by *17:15*.

Squeeze in a swim first 🌊
```

**Footer:** `Thora al habla`

**Variables:** none.

**Trigger:** scheduled `bot/scheduled/busPickup.ts.runEarly` at 14:00 Sat May 30, 2026 (`Europe/Madrid`).

**Audience:** all guests attending the ceremony per `rsvp_responses[].events.ceremony == true` AND `botEnrolled: true`.

**Idempotency:** key `(template="bus_pickup_early", date="2026-05-30", guestId)` in `bot_send_log`.

---

### T13: `bus_pickup_last`

**Purpose:** Last-call bus reminder at **16:45 Saturday** — 30 min before bus departure. Catches anyone who missed T12.

**Body — ES:**
```
🐾 *30 minutos* para que salgan los autobuses.

Parking del hotel *100% Fun*, salida a las *17:30*. Los novios están al caer 🌊

¡Id yendo! Sed puntuales que los autobuseros no esperan…
```

**Body — EN:**
```
🐾 *30 minutes* until the buses leave.

*100% Fun hotel parking*, departure *17:30*. The grooms are nearly here 🌊

Head over!
```

**Footer:** `Thora al habla`

**Variables:** none.

**Trigger:** scheduled `bot/scheduled/busPickup.ts.runLast` at 16:45 Sat May 30, 2026.

**Audience:** same as T12.

**Idempotency:** key `(template="bus_pickup_last", date="2026-05-30", guestId)`.

---

### T14: `pre_wedding_drinks`

**Purpose:** Soft 1.5h-ahead nudge for the pre-wedding drinks at Casa Explora (Fri 22:30). The standard 30-min reminder would land at 22:00 while most guests are still finishing dinner — awkward.

**Body — ES:**
```
🐾 ¡Buenas!

En hora y media empezamos en *Casa Explora* (1 min andando desde Tres Mares por el jardín de la piscina).

Sin código de vestimenta, ven cuando puedas. Hasta las 2 de la mañana 🍾
```

**Body — EN:**
```
🐾 Hi!

In an hour and a half we start at *Casa Explora* (1 min walking from Tres Mares through the pool garden).

No dress code, come whenever. Open till 2am 🌅
```

**Footer:** `Thora al habla`

**Variables:** none.

**Trigger:** scheduled `bot/scheduled/preWeddingDrinks.ts.run` at 21:00 Fri May 29, 2026.

**Audience:** all attending guests (`botEnrolled: true` AND `rsvp_responses[].events.pre_wedding == true` — note: this event slug needs to be present in the events Firestore schema).

---

### T17: `arrival_day_nudge`

**Purpose:** Per-guest welcome on the morning of their arrival in Tarifa. Triggered by the lightweight conversational `arrival_date` captured by Thora (D17, `02-conversation-design.md` §4 intent: Arrival).

**Body — ES:**
```
🐾 ¡Calentando motores {{1}}!

Si estás por Tarifa y te apetece vamos a estar en el *Chiringuito Bora*: buena música, refrescos, sin horarios.

Nos vemos cuando llegues 🌊
```

**Body — EN:**

```
🐾 Welcome to Tarifa, {{1}}!

If you want to swing by *Chiringuito Bora* (right by Tres Mares, the closest one), the grooms are there. Good music, drinks, no schedule.

See you whenever 🌊
```

**Footer:** `Thora al habla`

**Variables:** `{{1}}` = first name.

**Trigger:** per-guest scheduled at **15:00** on the guest's `arrival_date` (if known). Skipped if arrival_date == wedding day (no point) or unknown.

**Audience:** single guest.

**Idempotency:** key `(template="arrival_day_nudge", arrivalDate, guestId)`.

---

### T18: `song_request_party_open`

**Purpose:** Kick off song-request mode right as the party opens (midnight boundary). Thora invites guests to submit requests and clarifies she'll pass them directly to the DJ.

**Body — ES:**
```
🐾 La fiesta ya está en marcha.

Si quieres pedir canción, ahora es el momento: te paso el botón y yo se la mando directa al DJ.

A ver esos temazos 💛
```

**Body — EN:**
```
🐾 Party mode is on.

If you want to request a song, now's the time: tap below and I'll pass it straight to the DJ.

Let's hear your bangers 💛
```

**Footer:** `Thora al habla`

**Buttons (Flow):**
- ES: `Pedir canción` → opens Flow `song_request` (see `06-whatsapp-flows.md` F3).
- EN: `Request song` → opens Flow `song_request` (see `06-whatsapp-flows.md` F3).

**Variables:** none.

**Trigger:** scheduled `bot/scheduled/songRequestPartyOpen.ts.run` at **00:00 Sun May 31, 2026** (`Europe/Madrid`) — this is the Saturday-night party start boundary.

**Audience:** guests attending reception/party (`rsvp_responses[].events.reception == true`) with `botEnrolled: true`.

## 4. Submission instructions (operator)

For each of the **13 active logical templates × 2 languages = 26 templates** to submit.

(`rsvp_reminder`, `menu_unlock`, `amenities_cocktail`, and `pitonisa_now` are dropped — do not submit.)

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

- **Pre-launch:** all 26 templates submitted by Day 4. Mark `config/bot.templates.activeNames` once approved.
- **Mid-event:** templates can't be edited; deletion + re-create only, with new approval. So lock copy.
- **Post-event:** templates remain on the WABA. After decommission (90 days post-wedding), delete to keep the WABA clean.

## 6. Implementation contract

In `bot/whatsapp/templates.ts`:

```ts
export type TemplateName =
  | 'welcome_onboarding'
  | 'event_reminder_30min'
  | 'seating_unlock'
  // | 'menu_unlock'         ← DROPPED (2026-05-14 design session)
  | 'film_developed'
  | 'weather_morning_brief'
  | 'farewell_thanks'
  | 'manual_announcement'
  | 'escalation_followup'
  | 'bus_pickup_early'
  | 'bus_pickup_last'
  | 'pre_wedding_drinks'
  | 'arrival_day_nudge'
  | 'song_request_party_open';

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
- **Approval audit (day -7):** confirm all 26 templates show `Approved` in Meta Business Suite. Halt launch if any are pending.
