# Meta Approval Submission Guide — Templates & Flows

> Operator-facing, end-to-end runbook for submitting the bot's **32 message templates** (16 logical × 2 languages) and **8 Flow versions** (4 logical × 2 languages) to Meta for approval, before Phase 3 implementation kicks off.
>
> **Owner**: Enrique (operator) · **Implementer assist**: provide Flow JSON files and verify rendering · **Target completion**: D−10 (so approvals are settled by D−7)
>
> This guide assumes setup-guide.md Steps 1–12 are **done** (WABA created, prod number registered, display name approved, system-user token issued, webhook verified, test recipients allowlisted). If any of those is not done, fix it before starting here.

---

## 0. TL;DR — what you're about to do

1. **Prep assets** (image URLs, footer text, decisions table) — ~30 min
2. **Publish Flows first** (F1, F3, F4, F6 × ES/EN) — ~90 min authoring + ≤30 min approval per Flow
3. **Submit templates** (T1–T17 minus T5, both languages) — ~3h authoring + ≤24h approval per template
4. **Link Flow buttons** to F1 (in T2) and F6 (in T11) once Flows are published
5. **Verify all show Approved** in WhatsApp Manager
6. **Update `config/bot` Firestore doc** with the approved IDs / names
7. **Smoke-test** each template by sending one to your own phone on the test number

If you are time-pressed and want to know the critical sequencing rule: **Flows must be `Published` before any template that references them can be submitted with a Flow button.** Everything else can be done in parallel.

---

## 1. Why we do this now (and not in Phase 3)

Meta's approval latency is non-deterministic. Templates usually clear in 1–24h; Flows usually clear in <30 min; rejections can happen on either. We submit at the end of Phase 2 so that during Phase 3 the implementer can wire up the live `metaName` strings and `metaFlowId` values into `bot/whatsapp/templates.ts` and `bot/whatsapp/flows.ts` without waiting on Meta.

If a template is rejected, we have buffer to revise copy and resubmit. If we wait until the implementer is ready to wire them up, a rejection mid-Phase-3 could block the conversational pipeline tests on the rsvp / feedback Flow paths.

This guide is referenced from:

- `bot/docs/implementation-plan.md` § Operator parallel track, rows Op-4 / Op-5 / Op-7
- `bot/docs/setup-guide.md` § Step 13 (this is the deep version of that step)
- `bot/specs/05-message-templates.md` § 4 (submission instructions — short version)
- `bot/specs/06-whatsapp-flows.md` § 7 (publishing & lifecycle — short version)

---

## 2. Prerequisites checklist

Confirm each line before opening WhatsApp Manager:

- [x] **Meta Business Manager** access via your admin account. Manuel also has admin (setup §2).
- [x] **WABA** created and the **prod phone number** registered with **Approved** display name (setup §6).
- [x] **Meta App** created (`Thora al habla bot`) and linked to the WABA (setup §5).
- [x] **System User token** (`WHATSAPP_ACCESS_TOKEN`) is set in Firebase secrets (setup §10). Not strictly needed for UI submission, but you'll need it for any API-based re-submission and for the implementer's `bot/whatsapp/*` modules.
- [x] **Test recipient list** has at least Enrique's phone, Manuel's phone, and 1–2 friends (setup §12). Required to smoke-test approved templates before the prod onboarding broadcast.
- [ ] **Header image** for T1 `welcome_onboarding` is uploaded and reachable at a stable HTTPS URL (default: `https://bodaentarifa.com/og/thora-welcome.jpg`). PNG or JPG, ≤5 MB, ideally ≥1080 px on the long edge. **Must already be live before submission — Meta downloads it during review.**
- [ ] **Header image** for T6 `film_developed` is uploaded at `https://bodaentarifa.com/og/film-developed.jpg` (or final URL). Same constraints.
- [ ] **Header image** for T8 `farewell_thanks` is uploaded at `https://bodaentarifa.com/og/farewell.jpg` (or final URL). Same constraints.
- [ ] **Privacy policy URL** is live at `https://bodaentarifa.com/privacy-bot` (required by Meta for some Utility templates with personalized content; safer to have it up).
- [x] **Display name** ("Boda en Tarifa" / "Thora — Wedding Concierge" / whatever you chose) is showing **Approved** on the prod phone number.
- [ ] You have the **Meta Flow Builder JSON files** in front of you — provided inline below in §6 and §7 for copy-paste.

If anything is missing, fix it first. Meta will reject media-header templates if the image URL 404s or returns the wrong content-type during their automated review.

---

## 3. Asset preparation

### 3.1 Header images

Three templates use **media headers** (T1, T6, T8). Two more (`pitonisa_now`, `bus_pickup_last`) could optionally use a media header but the spec keeps them text-only — do **not** add headers there; it would force re-approval if changed.

For each media header, you need a **publicly accessible HTTPS URL** that:

- Resolves to a single static image (no redirects with image content; Meta's crawler doesn't follow >1 redirect).
- Returns `Content-Type: image/png` or `image/jpeg`.
- Is ≤5 MB.
- Has aspect ratio close to 1.91:1 (1200×628 or similar) — WhatsApp crops to that.

Recommended pre-flight check from your terminal:

```bash
for url in \
  https://bodaentarifa.com/og/thora-welcome.jpg \
  https://bodaentarifa.com/og/film-developed.jpg \
  https://bodaentarifa.com/og/farewell.jpg; do
  echo "$url"
  curl -sIL "$url" | grep -iE 'content-(type|length)|^http/'
  echo "---"
done
```

You want each to show `HTTP/2 200`, an `image/*` content-type, and a `content-length` ≤ 5 000 000.

If the assets aren't ready yet, you have two options:

- **Substitute now, fix later**: use a placeholder image, submit, and once the final asset is ready re-submit. (Re-submission is required because a template's header is locked once approved.)
- **Defer text-header variant**: temporarily change the header to a `TEXT` header and submit. Then resubmit a new template with a media header once the asset is ready. This means two approvals per logical template — only worth it if asset is more than 2 days out.

The cleanest path is to host the placeholder/final assets at their permanent URLs before submission and never resubmit unless rejected. **Recommended: assets ready before step 4.**

### 3.2 Footer text

Per `05-message-templates.md` §3, every template footer is **`Thora al habla`** (same in ES and EN — it's Thora's signature, language-agnostic). Setup-guide.md §13 said "Boda en Tarifa" — **ignore that**, use `Thora al habla`. Lock the choice and use it consistently across all 32 submissions so the UX is uniform.

### 3.3 Submission tracker

Open a simple sheet or text file. You'll mark each entry as you submit / get approval. Suggested columns:

```
Logical | Lang | Meta name             | Submitted | Status   | Notes
T1      | es   | welcome_onboarding_es | 2026-...  | Pending  |
T1      | en   | welcome_onboarding_en | 2026-...  | Approved |
...
F1      | es   | rsvp_full_es          | 2026-...  | Published|
F1      | en   | rsvp_full_en          | 2026-...  | Published|
```

You will refer back to this when populating `config/bot` in Firestore (§9).

---

## 4. Order of operations

There is **one** dependency that constrains ordering: templates with Flow buttons (T2 `rsvp_reminder` and T11 `feedback_request`) reference `F1` and `F6` respectively. Those Flows **must be Published** before you can save those templates.

Recommended order:

1. **Day A — Flows** (~2h authoring, ~30 min approval each)
   - Publish F1_es, F1_en, F3_es, F3_en, F4_es, F4_en, F6_es, F6_en. (8 versions)
2. **Day A or B — Standalone templates** (no Flow dependency)
   - Submit T1, T3, T4, T6, T7, T8, T9, T10, T12–T17 in both languages. (14 logical × 2 = 28 submissions)
3. **Day B — Flow-dependent templates** (only after F1 and F6 show **Published**)
   - Submit T2 (links F1) and T11 (links F6) in both languages. (4 submissions)
4. **Day B or C — Verify approvals + populate Firestore config** (§9)
5. **Day C — Smoke test** (§10): send each approved template to your own phone via the test number; render visually on iOS + Android.

Total wall-clock: usually 36–48 hours from first submission to all-green. Plan for 4 days to absorb any rejection-and-resubmit loops.

---

## 5. Navigating WhatsApp Manager — orientation

This guide refers to two surfaces inside Meta Business Suite:

- **Message Templates**: `business.facebook.com/wa/manage/message-templates/?waba_id=<WABA_ID>`
- **Flows**: `business.facebook.com/wa/manage/flows/?waba_id=<WABA_ID>`

If you don't see those, navigate from `business.facebook.com` → switch to the right Business → WhatsApp Manager → select your WABA from the dropdown.

**Bookmark both URLs now.** You'll be moving between them frequently over the next 2 days.

For each Flow or template, the rough lifecycle states you'll see:

- **Templates**: `In Review` → `Approved` / `Rejected` (sometimes `Paused` later if quality drops)
- **Flows**: `Draft` → `In Review` → `Published` / `Rejected`

---

## 6. Flow submission (do this first)

You will publish **8 Flows** (4 logical × 2 languages). Each takes ~10 minutes to author + a Meta review of typically <30 minutes.

### 6.1 General procedure

For each Flow:

1. Flows page → **Create Flow** button (top right).
2. **Name**: lowercase snake_case from the worksheet below (e.g., `rsvp_full_es`).
3. **Category**: pick the closest match — Meta uses this for triage, not gating.
   - F1 `rsvp_full` → **SIGN_UP** (or **OTHER** if SIGN_UP feels too commercial-y)
   - F3 `song_request` → **OTHER**
   - F4 `logistics_intake` → **OTHER**
   - F6 `feedback` → **CUSTOMER_SUPPORT** (or **OTHER**)
4. **Endpoint**: pick **No endpoint** (we use default data exchange via webhook; we do NOT host a Flow data endpoint per `06-whatsapp-flows.md` §2).
5. Click **Create** — you land in the Flow Builder UI.
6. In the Builder, switch to the **JSON** tab (top right of the editor canvas).
7. **Replace the entire JSON** with the appropriate block from §6.2–§6.5 below.
8. Click **Save Draft**.
9. Click **Validate** — fix any errors flagged (usually missing `terminal: true` on the last screen or a stray comma).
10. Click **Preview** → step through every screen on the right-hand simulator. Verify all labels are right; submit-buttons reach the terminal state.
11. Click **Publish**.
12. Meta enters **In Review**. Refresh after ~10–30 min. State should flip to **Published**.
13. Click the published Flow → copy the numeric **Flow ID** at the top → record it in your tracker (you'll need these in §9).

> ⚠️ **Once Published, a Flow is immutable for that version.** You can publish a new version (a new ID), but existing templates pointing at the old ID continue to work until you update them. For our use case (event in 9 days, no iteration after launch), publish-once-and-leave-it is the right model.

### 6.2 F1 — `rsvp_full` (ES + EN)

The Spanish JSON is the canonical one from `bot/specs/06-whatsapp-flows.md` §4. Paste it verbatim into the Builder for `rsvp_full_es`. For `rsvp_full_en`, paste the JSON below — same structure, English labels.

**`rsvp_full_es`**: copy the JSON block in `bot/specs/06-whatsapp-flows.md` §4 (lines 75–331) verbatim.

**`rsvp_full_en`** — paste exactly:

```json
{
  "version": "6.0",
  "screens": [
    {
      "id": "BASICS",
      "title": "Your details",
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "RSVP — Enrique & Manuel's wedding" },
          { "type": "TextBody", "text": "Less than a minute. Let's go." },
          {
            "type": "Form",
            "name": "form_basics",
            "children": [
              { "type": "TextInput", "label": "First name", "name": "first_name", "required": true, "input-type": "text", "max-length": 60 },
              { "type": "TextInput", "label": "Last name",  "name": "last_name",  "required": false, "input-type": "text", "max-length": 80 },
              {
                "type": "RadioButtonsGroup",
                "label": "Will you attend?",
                "name": "attending",
                "required": true,
                "data-source": [
                  { "id": "yes", "title": "Yes, I'll be there" },
                  { "id": "no",  "title": "I can't make it" }
                ]
              },
              {
                "type": "Footer",
                "label": "Next",
                "on-click-action": {
                  "name": "navigate",
                  "next": { "type": "screen", "name": "EVENTS" },
                  "payload": {
                    "first_name": "${form.first_name}",
                    "last_name":  "${form.last_name}",
                    "attending":  "${form.attending}"
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
      "title": "Which events?",
      "data": {
        "first_name": { "type": "string", "__example__": "Mary" },
        "last_name":  { "type": "string", "__example__": "Smith" },
        "attending":  { "type": "string", "__example__": "yes" }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "Which events will you attend?" },
          { "type": "TextBody", "text": "Tick all that apply." },
          {
            "type": "Form",
            "name": "form_events",
            "children": [
              {
                "type": "CheckboxGroup",
                "label": "Events",
                "name": "events",
                "required": true,
                "data-source": [
                  { "id": "pre_wedding", "title": "Pre-wedding drinks — Fri 29, 22:30 (Casa Explora)" },
                  { "id": "ceremony",    "title": "Ceremony — Sat 30, 18:00" },
                  { "id": "reception",   "title": "Reception & party — Sat 30, 20:00" },
                  { "id": "brunch",      "title": "Farewell brunch — Sun 31, 11:30" }
                ]
              },
              { "type": "TextInput", "label": "Plus-one?", "name": "plus_one_name", "required": false, "input-type": "text", "helper-text": "First and last name. Leave empty if none.", "max-length": 100 },
              {
                "type": "Footer",
                "label": "Next",
                "on-click-action": {
                  "name": "navigate",
                  "next": { "type": "screen", "name": "DIETARY" },
                  "payload": {
                    "first_name":    "${data.first_name}",
                    "last_name":     "${data.last_name}",
                    "attending":     "${data.attending}",
                    "events":        "${form.events}",
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
      "title": "Food",
      "data": {
        "first_name":    { "type": "string" },
        "last_name":     { "type": "string" },
        "attending":     { "type": "string" },
        "events":        { "type": "array", "items": { "type": "string" } },
        "plus_one_name": { "type": "string" }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "Dietary restrictions" },
          {
            "type": "Form",
            "name": "form_dietary",
            "children": [
              {
                "type": "CheckboxGroup",
                "label": "Restrictions",
                "name": "dietary",
                "required": false,
                "data-source": [
                  { "id": "vegetarian",   "title": "Vegetarian" },
                  { "id": "vegan",        "title": "Vegan" },
                  { "id": "gluten_free",  "title": "Gluten-free" },
                  { "id": "lactose_free", "title": "Lactose-free" },
                  { "id": "no_pork",      "title": "No pork" },
                  { "id": "no_alcohol",   "title": "No alcohol" },
                  { "id": "other",        "title": "Other (specify below)" }
                ]
              },
              { "type": "TextArea", "label": "Allergies or details", "name": "dietary_notes", "required": false, "helper-text": "Nuts, shellfish, etc. Free text.", "max-length": 400 },
              {
                "type": "Footer",
                "label": "Review",
                "on-click-action": {
                  "name": "navigate",
                  "next": { "type": "screen", "name": "CONFIRM" },
                  "payload": {
                    "first_name":    "${data.first_name}",
                    "last_name":     "${data.last_name}",
                    "attending":     "${data.attending}",
                    "events":        "${data.events}",
                    "plus_one_name": "${data.plus_one_name}",
                    "dietary":       "${form.dietary}",
                    "dietary_notes": "${form.dietary_notes}"
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
      "title": "Confirm",
      "terminal": true,
      "data": {
        "first_name":    { "type": "string" },
        "last_name":     { "type": "string" },
        "attending":     { "type": "string" },
        "events":        { "type": "array", "items": { "type": "string" } },
        "plus_one_name": { "type": "string" },
        "dietary":       { "type": "array", "items": { "type": "string" } },
        "dietary_notes": { "type": "string" }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "Almost there" },
          { "type": "TextBody", "text": "Review and submit." },
          { "type": "TextSubheading", "text": "Summary" },
          { "type": "TextBody", "text": "*${data.first_name} ${data.last_name}* — ${data.attending}" },
          {
            "type": "Form",
            "name": "form_confirm",
            "children": [
              { "type": "TextArea", "label": "Message for Enrique and Manuel (optional)", "name": "message", "required": false, "max-length": 500 },
              {
                "type": "Footer",
                "label": "Submit",
                "on-click-action": {
                  "name": "complete",
                  "payload": {
                    "first_name":    "${data.first_name}",
                    "last_name":     "${data.last_name}",
                    "attending":     "${data.attending}",
                    "events":        "${data.events}",
                    "plus_one_name": "${data.plus_one_name}",
                    "dietary":       "${data.dietary}",
                    "dietary_notes": "${data.dietary_notes}",
                    "message":       "${form.message}"
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

### 6.3 F3 — `song_request` (ES + EN)

**`song_request_es`**: copy from `bot/specs/06-whatsapp-flows.md` §4 F3 (lines 401–470).

**`song_request_en`** — paste:

```json
{
  "version": "6.0",
  "screens": [{
    "id": "SONG",
    "title": "Request a song",
    "terminal": true,
    "layout": {
      "type": "SingleColumnLayout",
      "children": [
        { "type": "TextHeading", "text": "🎵 Song request" },
        { "type": "TextBody", "text": "One per person — the DJ gets them unfiltered. Good luck." },
        {
          "type": "Form",
          "name": "form_song",
          "children": [
            { "type": "TextInput", "label": "Title",  "name": "title",  "required": true, "input-type": "text", "max-length": 120 },
            { "type": "TextInput", "label": "Artist (optional)", "name": "artist", "required": false, "input-type": "text", "max-length": 100 },
            {
              "type": "RadioButtonsGroup",
              "label": "Vibe",
              "name": "vibe",
              "required": true,
              "data-source": [
                { "id": "chill",    "title": "Chill (cocktail)" },
                { "id": "dance",    "title": "Dance floor" },
                { "id": "wildcard", "title": "Wildcard / surprise" }
              ]
            },
            { "type": "TextArea", "label": "Notes", "name": "notes", "required": false, "max-length": 200 },
            {
              "type": "Footer",
              "label": "Request",
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

### 6.4 F4 — `logistics_intake` (ES + EN)

**`logistics_intake_es`**: copy from `bot/specs/06-whatsapp-flows.md` §4 F4 (lines 508–616).

**`logistics_intake_en`** — paste:

```json
{
  "version": "6.0",
  "screens": [
    {
      "id": "ARRIVAL",
      "title": "Your arrival",
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "Logistics" },
          { "type": "TextBody", "text": "So we can coordinate transport and lodging." },
          {
            "type": "Form",
            "name": "form_arrival",
            "children": [
              { "type": "DatePicker", "label": "Arrival date", "name": "arrival_date", "required": true, "min-date": "2026-05-27", "max-date": "2026-05-31" },
              {
                "type": "Dropdown",
                "label": "Airport",
                "name": "arrival_airport",
                "required": false,
                "data-source": [
                  { "id": "AGP",   "title": "Málaga (AGP)" },
                  { "id": "GIB",   "title": "Gibraltar (GIB)" },
                  { "id": "JTR",   "title": "Jerez (JTR)" },
                  { "id": "OTHER", "title": "Other or driving" }
                ]
              },
              {
                "type": "RadioButtonsGroup",
                "label": "Need coordinated transport?",
                "name": "needs_transport",
                "required": true,
                "data-source": [
                  { "id": "yes", "title": "Yes, please" },
                  { "id": "no",  "title": "No, I'm sorted" }
                ]
              },
              {
                "type": "Footer",
                "label": "Next",
                "on-click-action": {
                  "name": "navigate",
                  "next": { "type": "screen", "name": "ACCESS" },
                  "payload": {
                    "arrival_date":    "${form.arrival_date}",
                    "arrival_airport": "${form.arrival_airport}",
                    "needs_transport": "${form.needs_transport}"
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
      "title": "Accessibility",
      "terminal": true,
      "data": {
        "arrival_date":    { "type": "string" },
        "arrival_airport": { "type": "string" },
        "needs_transport": { "type": "string" }
      },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "Anything else?" },
          {
            "type": "Form",
            "name": "form_access",
            "children": [
              { "type": "TextArea", "label": "Accessibility needs or details", "name": "accessibility_notes", "required": false, "max-length": 400 },
              {
                "type": "Footer",
                "label": "Submit",
                "on-click-action": {
                  "name": "complete",
                  "payload": {
                    "arrival_date":        "${data.arrival_date}",
                    "arrival_airport":     "${data.arrival_airport}",
                    "needs_transport":     "${data.needs_transport}",
                    "accessibility_notes": "${form.accessibility_notes}"
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

### 6.5 F6 — `feedback` (ES + EN)

**`feedback_es`**: copy from `bot/specs/06-whatsapp-flows.md` §4 F6 (lines 638–719).

**`feedback_en`** — paste:

```json
{
  "version": "6.0",
  "screens": [
    {
      "id": "RATING",
      "title": "How was it?",
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          { "type": "TextHeading", "text": "Quick feedback" },
          { "type": "TextBody", "text": "30 seconds. Anonymous if you'd like." },
          {
            "type": "Form",
            "name": "form_rating",
            "children": [
              {
                "type": "RadioButtonsGroup",
                "label": "Your rating",
                "name": "rating",
                "required": true,
                "data-source": [
                  { "id": "5", "title": "🌟🌟🌟🌟🌟 Brilliant" },
                  { "id": "4", "title": "🌟🌟🌟🌟 Very good" },
                  { "id": "3", "title": "🌟🌟🌟 Okay" },
                  { "id": "2", "title": "🌟🌟 Could be better" },
                  { "id": "1", "title": "🌟 Bad" }
                ]
              },
              {
                "type": "Footer",
                "label": "Next",
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
      "title": "Anything to share?",
      "terminal": true,
      "data": { "rating": { "type": "string" } },
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "Form",
            "name": "form_text",
            "children": [
              { "type": "TextArea", "label": "Comments (optional)", "name": "text", "required": false, "max-length": 1000 },
              {
                "type": "Footer",
                "label": "Submit",
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

### 6.6 Common Flow rejection causes

If a Flow comes back `Rejected`, the most likely causes are:

| Symptom in Meta UI | Cause | Fix |
|---|---|---|
| "Invalid JSON" | Trailing comma, smart-quote substitution by your editor | Re-paste from this guide; ensure straight `"` quotes |
| "Missing terminal screen" | No screen has `"terminal": true` | Mark last screen terminal |
| "Variable referenced but not declared in `data`" | A `${data.foo}` on screen N has no `foo` declared in N's `data` block | Add the missing declaration |
| "Unsupported component" | Older version string or typo in `type` | Confirm `"version": "6.0"` and check `type` casing |
| "Submit not reachable" | Some screen lacks a Footer with a valid `on-click-action` | Add Footer to the screen |

After fixing, re-validate and re-publish. Meta does not retain a rejection backlog — fix and re-submit anytime.

---

## 7. Template submission

After all 8 Flow versions are **Published** (or for templates that don't reference Flows, anytime), proceed.

### 7.1 General procedure

For each template:

1. WhatsApp Manager → **Message Templates** → **Create Template**.
2. **Category**: **Utility** (every single one of ours — confirmed in `05-message-templates.md` §1).
3. **Name**: lowercase snake_case (e.g., `welcome_onboarding_es`). Names are immutable once submitted; pick from the worksheet in §7.3.
4. **Languages**: select **one** language per submission. Submit `_es` and `_en` as **two separate templates** with two separate submissions. Pick `Spanish (Spain) — es_ES` or `English (US) — en_US` from the dropdown.
5. **Header**: choose `Text`, `Media`, or `None` per the spec for that template (see worksheet in §7.3).
   - For media: select `Image`, choose **"Use sample"** → upload the file (Meta caches it; the live URL will be substituted by your sending function via media ID — but for approval, you supply a sample). Or paste the static URL — Meta will download it.
6. **Body**: paste the body text **exactly** from `05-message-templates.md` §3 for that template. Variables in order; no leading/trailing `{{n}}`.
7. **Footer**: type `Thora al habla` (same string in both languages).
8. **Buttons**: per the worksheet in §7.3.
   - For **quick-reply** buttons: type the exact label (max 25 chars, emoji counts as 2 chars in Meta's UI counter — adjust if rejected).
   - For **URL** buttons: choose `Dynamic` if there is a `{{n}}` variable in the URL; otherwise `Static`. Provide a sample URL value for review.
   - For **Flow** buttons: choose `Flow`, then select the published Flow from the dropdown (will only show after §6 completes). Provide the **Flow CTA label** and an optional flow_token sample (e.g., `rsvp_full|+34600000000|sample`).
9. **Submit for Review**.
10. State will be `In Review` (~1–24 h). Refresh and check.

> 💡 Keep the WhatsApp Manager tab open in one browser window and your tracker (sheet/file) in another. After submitting, drop the submission timestamp in the tracker before moving to the next template — useful when chasing rejections.

### 7.2 Variable sample values

Meta requires you to provide a **sample value** for every variable so it can render the template during review. Use realistic-looking samples — never `XXX` or `{{var}}` literally, since some Utility heuristics flag those.

Suggested sample values:

| Variable | Sample (ES) | Sample (EN) |
|---|---|---|
| First name | `María` | `Sarah` |
| Event name | `Ceremonia` | `Ceremony` |
| Venue name | `Casa Explora` | `Casa Explora` |
| Time string | `18:00` | `18:00` |
| Event slug | `ceremony` | `ceremony` |
| Table label | `Mesa 7 — La Calma` | `Table 7 — La Calma` |
| Signed token | `t.abc123` | `t.abc123` |
| Weather summary | `soleado, 24°C max` | `sunny, 24°C max` |
| Wind summary | `Levante, 22 km/h` | `Levante, 22 km/h` |
| Announcement body | `La fiesta se mueve al jardín de la piscina por viento.` | `Party moved to pool garden due to wind.` |
| Operator message | `Os queríamos dar las gracias por vuestra ayuda con el coche.` | `Wanted to thank you for the help with the car.` |

### 7.3 Per-template submission worksheet

For full body copy, refer to `bot/specs/05-message-templates.md` §3 (verbatim). The worksheet below captures the **operational** decisions per submission.

> Order in this section matches Flow-dependency: T1 and T3–T17 (except T5) first, then T2 and T11 last.

#### T1 — `welcome_onboarding`

| Field | ES (`welcome_onboarding_es`) | EN (`welcome_onboarding_en`) |
|---|---|---|
| Category | Utility | Utility |
| Header | Media (Image) — URL `https://bodaentarifa.com/og/thora-welcome.jpg` | Same |
| Body | from spec T1 ES | from spec T1 EN |
| Body sample for `{{1}}` | `María` | `Sarah` |
| Footer | `Thora al habla` | `Thora al habla` |
| Button 1 (quick reply) | `📅 Programa` | `📅 Schedule` |
| Button 2 (quick reply) | `📍 Cómo llegar` | `📍 How to get there` |
| Button 3 (quick reply) | `🐾 Qué tal, Thora` | `🐾 Hi Thora` |

⚠️ **Quick-reply button length**: WhatsApp's UI counter treats emoji as ≥2 chars. If `🐾 Qué tal, Thora` is rejected for length, drop the comma → `🐾 Qué tal Thora` (or `🐾 Hola Thora`).

#### T2 — `rsvp_reminder` *(submit AFTER F1 is Published)*

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T2 ES | from spec T2 EN |
| Body sample for `{{1}}` | `María` | `Sarah` |
| Footer | `Thora al habla` | `Thora al habla` |
| Button 1 (Flow) | Label `Confirmar` → Flow `rsvp_full_es` | Label `RSVP now` → Flow `rsvp_full_en` |
| Button 2 (quick reply) | `Más tarde` | `Later` |

#### T3 — `event_reminder_30min`

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T3 ES | from spec T3 EN |
| Samples | `{{1}}=Ceremonia`, `{{2}}=Casa Explora`, `{{3}}=18:00`, `{{4}}=ceremony` | `{{1}}=Ceremony`, `{{2}}=Casa Explora`, `{{3}}=18:00`, `{{4}}=ceremony` |
| Footer | `Thora al habla` | `Thora al habla` |
| Button (URL, dynamic) | `Ver detalles` → `https://bodaentarifa.com/eventos/{{4}}` | `View details` → `https://bodaentarifa.com/events/{{4}}` |

If Meta rejects the URL with a body variable: fall back to a static URL `https://bodaentarifa.com/programa` (ES) / `/schedule` (EN) and drop `{{4}}`. Adjust the body length accordingly so it has no trailing variable.

#### T4 — `seating_unlock`

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T4 ES | from spec T4 EN |
| Samples | `{{1}}=María`, `{{2}}=Mesa 7 — La Calma`, `{{3}}=t.abc123` | `{{1}}=Sarah`, `{{2}}=Table 7 — La Calma`, `{{3}}=t.abc123` |
| Footer | `Thora al habla` | `Thora al habla` |
| Button (URL, dynamic) | `Ver mi mesa` → `https://bodaentarifa.com/mi-mesa/{{3}}` | `See my table` → `https://bodaentarifa.com/my-table/{{3}}` |

#### T5 — `menu_unlock` — **DROPPED, DO NOT SUBMIT**

Per `05-message-templates.md` §3 T5. Skip entirely.

#### T6 — `film_developed`

| Field | ES | EN |
|---|---|---|
| Header | Media (Image) — `https://bodaentarifa.com/og/film-developed.jpg` | Same |
| Body | from spec T6 ES | from spec T6 EN |
| Body sample for `{{1}}` | `María` | `Sarah` |
| Footer | `Thora al habla` | `Thora al habla` |
| Button (URL, static) | `Ver el álbum` → `https://bodaentarifa.com/album` | `View the album` → `https://bodaentarifa.com/album` |

#### T7 — `weather_morning_brief`

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T7 ES | from spec T7 EN |
| Samples | `{{1}}=soleado, 24°C max`, `{{2}}=Levante, 22 km/h` | `{{1}}=sunny, 24°C max`, `{{2}}=Levante, 22 km/h` |
| Footer | `Thora al habla` | `Thora al habla` |
| Buttons | None | None |

#### T8 — `farewell_thanks`

| Field | ES | EN |
|---|---|---|
| Header | Media (Image) — `https://bodaentarifa.com/og/farewell.jpg` | Same |
| Body | from spec T8 ES | from spec T8 EN |
| Body sample for `{{1}}` | `María` | `Sarah` |
| Footer | `Thora al habla` | `Thora al habla` |
| Buttons | None | None |

#### T9 — `manual_announcement`

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T9 ES (`🐾 {{1}}`) | from spec T9 EN (`🐾 {{1}}`) |
| Body sample for `{{1}}` | `La fiesta se mueve al jardín de la piscina por viento.` | `Party moved to pool garden due to wind.` |
| Footer | `Thora al habla` | `Thora al habla` |
| Buttons | None | None |

⚠️ Meta does not allow a body that's **only** a variable (no leading or trailing variable, ever, with no surrounding text). The leading emoji `🐾 ` counts as content, so this is acceptable — but if rejected, expand the body slightly: `🐾 Aviso: {{1}}` / `🐾 Heads-up: {{1}}`.

#### T10 — `escalation_followup`

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T10 ES | from spec T10 EN |
| Body sample for `{{1}}` | `Os queríamos dar las gracias por vuestra ayuda con el coche.` | `Wanted to thank you for the help with the car.` |
| Footer | `Thora al habla` | `Thora al habla` |
| Buttons | None | None |

#### T11 — `feedback_request` *(submit AFTER F6 is Published)*

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T11 ES | from spec T11 EN |
| Body sample for `{{1}}` | `María` | `Sarah` |
| Footer | `Thora al habla` | `Thora al habla` |
| Button (Flow) | `Dar feedback` → Flow `feedback_es` | `Give feedback` → Flow `feedback_en` |

#### T12 — `bus_pickup_early`

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T12 ES | from spec T12 EN |
| Variables | none | none |
| Footer | `Thora al habla` | `Thora al habla` |
| Buttons | None | None |

#### T13 — `bus_pickup_last`

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T13 ES | from spec T13 EN |
| Variables | none | none |
| Footer | `Thora al habla` | `Thora al habla` |
| Buttons | None | None |

#### T14 — `pre_wedding_drinks`

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T14 ES | from spec T14 EN |
| Variables | none | none |
| Footer | `Thora al habla` | `Thora al habla` |
| Buttons | None | None |

#### T15 — `amenities_cocktail`

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T15 ES | from spec T15 EN |
| Variables | none | none |
| Footer | `Thora al habla` | `Thora al habla` |
| Buttons | None | None |

#### T16 — `pitonisa_now`

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T16 ES | from spec T16 EN |
| Variables | none | none |
| Footer | `Thora al habla` | `Thora al habla` |
| Buttons | None | None |

#### T17 — `arrival_day_nudge`

| Field | ES | EN |
|---|---|---|
| Header | None | None |
| Body | from spec T17 ES | from spec T17 EN |
| Body sample for `{{1}}` | `María` | `Sarah` |
| Footer | `Thora al habla` | `Thora al habla` |
| Buttons | None | None |

### 7.4 Common template rejection causes

| Symptom | Cause | Fix |
|---|---|---|
| "Body contains marketing language" | Words like "free", "offer", "click now", excessive exclamation | Soften copy; Utility category requires informational tone. (Our copy is already conservative — should not trigger this.) |
| "Variable formatting issue" | Variable at start or end of body, or two variables touching | Add a leading word; insert connective text |
| "Missing context" | Body is too short to convey purpose | Add a sentence of context |
| "Sample mismatch" | Sample variable values don't match body intent | Re-enter realistic samples per §7.2 |
| "Quick reply too long" | Emoji + text >25 displayable chars | Trim the label |
| "URL not allowlisted" | Dynamic URL points to a host not associated with the WABA | Verify domain `bodaentarifa.com` is added to the WABA's business profile |
| "Media header unavailable" | Image URL 404 / wrong content-type / >5 MB | Fix the URL, re-submit |

If a rejection mentions a generic "policy violation" with no specifics, the playbook is:

1. Re-read the body. Try removing any emoji at the start (rare cause, but possible).
2. Try resubmitting with the same content first — Meta's review is partly automated and re-review sometimes flips the verdict.
3. If still rejected: simplify copy further. Drop variables that read as "marketing-y." Last resort: use an Authentication-style minimalist copy and lean on the button (per `implementation-plan.md` Risk responses).
4. If rejected twice with no clear path, escalate via Business Manager → Help → Contact Support → choose "WhatsApp Business" → describe the template. Response in 1–3 days; for our timeline this should be a last resort.

---

## 8. Approval monitoring

Open WhatsApp Manager → Message Templates list. The state column shows `In Review`, `Approved`, `Rejected`, or `Paused`.

Refresh every 30–60 min the first day. Most templates resolve within 4 hours; outliers can take up to 24 h. Flows resolve faster (typically <30 min).

For each rejected item:

1. Click the row → read Meta's rejection reason.
2. Cross-reference §6.6 (Flows) or §7.4 (templates).
3. **Do not edit and resubmit the same row** — templates and Flows are immutable. Instead, click `Duplicate`, edit the duplicate, and submit. The original moves to `Rejected` and the duplicate enters `In Review` with the same name (the rejected one is effectively superseded). Some workflows in Meta UI surface a `Resubmit` button that handles this for you — use it if it appears.
4. If you must rename to avoid a name collision (rare), append `_v2` and update the worksheet — and tell the implementer so `bot/whatsapp/templates.ts` references the right `metaName`.

When ≥95% of templates are `Approved`, the gate is open. The remaining 5% (typically zero or one) can be chased while implementation continues; if any remain unresolved by D−4, escalate.

---

## 9. Update Firestore config (post-approval)

Once all are approved, populate two documents that the implementer's code will read at runtime.

### 9.1 `config/bot.templates.activeNames`

This is the registry of approved template Meta-names. The bot uses it to assert each named template exists before attempting a send.

Schema (per `bot/specs/04-data-model.md`):

```json
{
  "templates": {
    "activeNames": [
      "welcome_onboarding_es", "welcome_onboarding_en",
      "rsvp_reminder_es", "rsvp_reminder_en",
      "event_reminder_30min_es", "event_reminder_30min_en",
      "seating_unlock_es", "seating_unlock_en",
      "film_developed_es", "film_developed_en",
      "weather_morning_brief_es", "weather_morning_brief_en",
      "farewell_thanks_es", "farewell_thanks_en",
      "manual_announcement_es", "manual_announcement_en",
      "escalation_followup_es", "escalation_followup_en",
      "feedback_request_es", "feedback_request_en",
      "bus_pickup_early_es", "bus_pickup_early_en",
      "bus_pickup_last_es", "bus_pickup_last_en",
      "pre_wedding_drinks_es", "pre_wedding_drinks_en",
      "amenities_cocktail_es", "amenities_cocktail_en",
      "pitonisa_now_es", "pitonisa_now_en",
      "arrival_day_nudge_es", "arrival_day_nudge_en"
    ]
  }
}
```

You can edit this directly via Firebase Console → Firestore → `config` → `bot` → field `templates.activeNames` (write as Array). Or run the implementer's seed script once Phase 3 begins:

```bash
cd functions
npx ts-node scripts/seed-bot-config.ts
```

### 9.2 `config/bot.flows.activeIds`

Map logical Flow names to Meta Flow IDs (numeric strings). You'll have collected these in your tracker.

```json
{
  "flows": {
    "activeIds": {
      "rsvp_full_es":         "<META_ID>",
      "rsvp_full_en":         "<META_ID>",
      "song_request_es":      "<META_ID>",
      "song_request_en":      "<META_ID>",
      "logistics_intake_es":  "<META_ID>",
      "logistics_intake_en":  "<META_ID>",
      "feedback_es":          "<META_ID>",
      "feedback_en":          "<META_ID>"
    }
  }
}
```

Same as above: edit via Firebase Console or seed script.

### 9.3 Quality rating baseline

In WhatsApp Manager → Phone Numbers → click your prod number → check **Quality rating** and **Messaging limits**. You want:

- Quality rating: `High` (default for new numbers before any sends).
- Messaging limit tier: `250 unique recipients/day` (default before verification) or `1k` post-verification. Either is enough for ~150 guests.

Record both in your tracker. After the launch broadcast you'll re-check these.

---

## 10. Smoke-test each approved template

Before declaring victory, send each approved template once to your own phone via the API to verify rendering. The implementer ships a `scripts/send-test-template.ts` in Phase 3; for now, you can do it from Graph API Explorer or via curl:

```bash
TOKEN="$WHATSAPP_ACCESS_TOKEN"  # the system-user token
PHONE_NUMBER_ID="$WHATSAPP_PHONE_NUMBER_ID"  # the test number ID
MY_PHONE="34600000000"  # your phone in E.164 without the + (per Meta convention)

# Example: T1 welcome_onboarding (ES)
curl -X POST "https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "'"${MY_PHONE}"'",
    "type": "template",
    "template": {
      "name": "welcome_onboarding_es",
      "language": { "code": "es_ES" },
      "components": [
        { "type": "header", "parameters": [{ "type": "image", "image": { "link": "https://bodaentarifa.com/og/thora-welcome.jpg" }}]},
        { "type": "body",   "parameters": [{ "type": "text", "text": "Enrique" }]}
      ]
    }
  }'
```

Replace `name`, `language.code`, and `parameters` for each template per its variable schema. (For Flow buttons, components include a `type: "button"` block with `sub_type: "flow"` — the implementer's `bot/whatsapp/templates.ts` will encapsulate this; for now, smoke-testing a Flow-bearing template visually verifies the button label and tap-to-open behavior.)

For each smoke test, check on both iOS and Android:

- Header (text / media) renders.
- Body interpolation is correct — variables resolve, no `{{1}}` literal showing.
- Footer reads `Thora al habla`.
- Buttons render in the right order, labels not truncated.
- Quick-reply buttons, when tapped, send back the label as an inbound message (you'll see it in your webhook logs once Phase 3 wires the conversation handler).
- URL buttons, when tapped, open the expected page.
- Flow buttons (T2, T11), when tapped, open the Flow screens. Walk through to terminal screen. Submission lands as an inbound `nfm_reply` (will be parsed in Phase 3).

If anything renders wrong, that's a template content bug — re-author the duplicate and resubmit.

---

## 11. Final checklist (handoff to Phase 3)

Phase 3 implementation can begin once all of the following are true:

- [ ] 8 Flow versions show **Published** in WhatsApp Manager.
- [ ] 32 templates show **Approved** in WhatsApp Manager.
- [ ] Each template smoke-tested on both iOS and Android — rendering verified.
- [ ] `config/bot.templates.activeNames` populated in Firestore.
- [ ] `config/bot.flows.activeIds` populated in Firestore.
- [ ] Tracker (sheet/file) committed somewhere accessible — implementer needs the mapping from logical → Meta IDs.
- [ ] Quality rating on prod number is **High** or **Medium** with no warnings.
- [ ] Any rejected items are either approved on resubmission or have a documented workaround.

When all green, ping the implementer to start Phase 3.

---

## 12. Rejection recovery playbook (one-pager)

If something goes wrong, find the row and follow the action.

| Surface | State | Action |
|---|---|---|
| Template | Rejected — body issue | Duplicate, soften copy per §7.4, resubmit |
| Template | Rejected — header media | Fix image URL (200 OK, image/*, ≤5 MB), duplicate, resubmit |
| Template | Rejected — quick-reply length | Trim button label to ≤20 chars, duplicate, resubmit |
| Template | Rejected — URL not allowlisted | Add `bodaentarifa.com` to business profile → Verified domains, then duplicate + resubmit |
| Template | Rejected — Flow button reference broken | Confirm Flow is **Published** (not just Approved). If Flow needs republishing, do that first and then resubmit the template |
| Template | Paused (post-approval) | Quality drop; check Insights → Quality rating. Usually unpauses within 24 h. If repeated, simplify copy and submit new variant |
| Flow | Rejected — JSON | Re-paste from this guide, re-validate, republish |
| Flow | Rejected — terminal missing | Add `"terminal": true` to last screen, republish |
| Flow | Rejected — data shape | Fix data-source / data block per §6.6, republish |
| Flow | Validation error pre-submit | Builder shows inline errors — fix and retry |
| Display name | Rejected | Choose a more descriptive name (e.g., `Enrique & Manuel Wedding Concierge`), resubmit in Phone Numbers → number → Edit |
| WABA | Verification stuck >5 days | Email Meta support via Business Manager → Help; mention wedding date in subject line for prioritization |

---

## 13. Quick reference — total surface

- **32 templates to submit**: 16 logical (T1, T2, T3, T4, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17 — T5 dropped) × ES + EN.
- **8 Flow versions to publish**: 4 logical (F1, F3, F4, F6 — F2 and F5 dropped) × ES + EN.
- **3 media-header assets** to host before submission: thora-welcome.jpg, film-developed.jpg, farewell.jpg.
- **2 Firestore config keys** to populate post-approval: `config/bot.templates.activeNames`, `config/bot.flows.activeIds`.
- **Critical sequencing rule**: Flows F1 and F6 must be **Published** before templates T2 and T11 can be submitted.
- **Approval ETA**: Flows <30 min · Templates 1–24 h · plan 4 days end-to-end for resubmissions.

When in doubt, the canonical references are:

- `bot/specs/05-message-templates.md` — full template copy
- `bot/specs/06-whatsapp-flows.md` — full Flow JSON (ES) and lifecycle notes
- `bot/docs/setup-guide.md` — original setup steps (1–12 done)
- `bot/docs/troubleshooting.md` — broader troubleshooting beyond submission
