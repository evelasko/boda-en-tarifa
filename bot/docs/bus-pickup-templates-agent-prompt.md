# Agent Brief: Wire T12 + T13 Bus Pickup Templates Into Runtime

## Goal

Add the two Meta-approved bus-pickup WhatsApp templates (T12 `bus_pickup_early`, T13 `bus_pickup_last`) to the runtime template registry, wire them into the admin broadcast UI, and suppress the generic T3 reminder for the ceremony event so we don't double-send.

The templates are **Meta-approved** but **not yet exposed** in our code. The wedding is May 30 2026 (today is launch day for this work).

---

## Background — read this first

This codebase is a WhatsApp bot ("Thora") that sends template messages to wedding guests. The runtime template registry is at `functions/src/bot/whatsapp/templates.ts`. The broadcast machinery (audience resolution, dry-run preview, dispatch, idempotency, pacing) is at `functions/src/bot/broadcast/dispatch.ts`. The admin compose UI for ad-hoc broadcasts is at `web/src/app/admin/bot/broadcasts/new/page.tsx`.

### Templates already wired (good reference patterns)

- **T1 `welcome_onboarding`** — body has `firstName` + IMAGE header. Hardcoded `es` language.
- **T3 `event_reminder_generic`** — body vars `eventName/venue/time`. Hardcoded `es`. Has a FOOTER ("Thora al habla") that lives on the Meta side; we don't send it as a parameter component. The dispatcher resolves vars from `events/{eventId}` + `venues/{venueId}` server-side when the admin UI passes `varsStatic: { eventId }`.
- **T4 `seating_unlocked`** — body vars `firstName/tableLabel` + a URL button (`{{1}}` placeholder, the literal `%7B%7B3%7D%7D` in the URL path is not a placeholder). Hardcoded `es`. Per-recipient vars resolved from `seating/{guestId}`.
- **T6 `film_developed`** — body `firstName` + IMAGE header.
- **T8 `farewell_thanks`** — body `firstName` only.

### Templates Meta-approved but NOT yet in our registry — your scope

- **T12 `bus_pickup_early`** — fires 14:00 Sat May 30. No body variables. Header/footer per Meta-approved structure (verify via curl, see below).
- **T13 `bus_pickup_last`** — fires 16:45 Sat May 30. No body variables. Same audience.

Spec authoritative reference: `bot/specs/05-message-templates.md` §T12 (line 431) and §T13 (line 467). **Trust the Meta API response over the spec doc** — the spec is the operator's *intent*, but operators have historically edited copy at Meta-submission time. We've seen this mismatch on T3 and T4. **The Meta response is the canonical wire shape we must match.**

### The ceremony-event problem

In `bot/data/events.yaml`, the `ceremony` event currently has no `reminders` field, so it defaults to `[60, 15]` minutes. That means if `botEventReminderTick` were to fire, it would send T3 (`event_reminder_generic`) to ceremony attendees at 17:00 and 17:45 Saturday — **redundant with T12/T13 and arrives too late to be useful** (T3's body says "starts in 30 minutes", arriving while guests are already supposed to be on the bus).

T3's spec (`05-message-templates.md` line 186): **"Skip event_id = `ceremony` — that event uses T12 + T13 (bus pickup beats) instead."**

So you must also set `reminders: []` on the ceremony event in `bot/data/events.yaml`, then re-sync via `bot/scripts/sync-kb.mjs`.

### What the admin compose UI looks like today

The user picks a template from a dropdown. For T3 they also pick an event. For T4 there's no extra picker (per-guest vars auto-resolved). T12/T13 should look like T1/T6/T8 — no extra picker since they have no body variables.

`TEMPLATE_OPTIONS` is the in-file source of truth for the dropdown options in `web/src/app/admin/bot/broadcasts/new/page.tsx`. You add the two new template values there.

The admin UI calls the Firebase Callable `botSendBroadcast` (typed in `web/src/lib/bot-callable.ts`, implemented at `functions/src/bot/callables/send-broadcast.ts`). The callable validates the `templateName` against `listTemplateNames()` from the registry — once T12/T13 are in the registry, the callable accepts them automatically. No change to the callable needed.

### How sends work

The same `runBroadcast` (in `dispatch.ts`) is used for both manual admin sends and scheduled fires. For each recipient it calls `tmpl.buildPayload(lang, vars)` and sends via the Meta Graph API. Idempotency is handled by `bot_send_log/{compositeId}` — re-running a broadcast with the same id is safe. Audience filtering is at `functions/src/bot/broadcast/audience.ts`, which already supports `requiresNight: 'saturday'` to restrict to Saturday-night attendees.

---

## Scope

**In scope:**

1. Verify Meta-approved structure of `bus_pickup_early` + `bus_pickup_last` via curl. Both `es` and `en` if they have both.
2. Add both templates to `functions/src/bot/whatsapp/templates.ts` (registry entry, zod var schema even if empty, `buildPayload`, `preview`).
3. Add both to the admin UI dropdown in `web/src/app/admin/bot/broadcasts/new/page.tsx` (`TEMPLATE_OPTIONS` constant). They behave like simple templates (no extra picker, no special UI).
4. Update `bot/data/events.yaml` to set `reminders: []` on the ceremony event.
5. Re-sync the YAML to Firestore via `node bot/scripts/sync-kb.mjs events venues` (the user runs this — you provide the command).
6. Manual operator path is enough for today. **Scheduling is optional** — see "Scheduling decision" below.

**Out of scope:**

- Building any new scheduled function unless trivially layered onto the existing `botContentUnlockTick` pattern (see decision below). Manual admin fires are the today-safe operational lever.
- Anything else from the spec's "not in registry" list (`pre_wedding_drinks`, `arrival_day_nudge`, `weather_morning_brief`, `manual_announcement`). Out.
- Editing the spec doc to match Meta. The Meta response is the truth; if the spec doc diverges, leave it — the registry's source-of-truth comment can call out the discrepancy.

---

## Investigation phase (do this BEFORE editing code)

### 1. Fetch Meta's approved structure for both templates

The operator (the user) can run these curls and paste the responses back. Provide the commands:

```sh
WABA_ID="$(firebase functions:secrets:access WHATSAPP_BUSINESS_ACCOUNT_ID)"
ACCESS_TOKEN="$(firebase functions:secrets:access WHATSAPP_ACCESS_TOKEN)"

for name in bus_pickup_early bus_pickup_last; do
  echo "=== $name ==="
  curl -sS -G \
    "https://graph.facebook.com/v22.0/${WABA_ID}/message_templates" \
    --data-urlencode "name=${name}" \
    --data-urlencode 'fields=name,language,status,category,components' \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    | jq .
done
```

For each template, you need to determine from the response:

- **Languages approved** — only `es`? both `es` and `en`? (T3 and T4 turned out es-only despite the spec claiming both.)
- **Body component** — exact text, any `{{n}}` placeholders.
- **Header component** — text? image? if image, is it static or per-send?
- **Footer component** — present? if so, just static text (no params).
- **Buttons component** — any URL or quick-reply buttons?

**Do not skip this step.** On T3 we discovered the operator changed `"¡Os esperamos!"` → `"¡Te esperamos!"` at submission. On T4 we discovered the URL button has `%7B%7B3%7D%7D` URL-encoded as literal text alongside the real `{{1}}` placeholder. The Meta response is the only authoritative source.

### 2. Read these files to understand the patterns

- `functions/src/bot/whatsapp/templates.ts` — full file. Pay attention to:
  - `TemplateName` union (line ~28)
  - `bodyOnlyPayload()` helper (used by templates with no header/footer/buttons)
  - The `event_reminder_generic` entry — recent reference, hardcoded `es`
  - The `welcome_onboarding` entry — pattern for templates WITH a static IMAGE header
- `functions/src/bot/callables/send-broadcast.ts` — see how the registry's `listTemplateNames()` is used; you shouldn't need to touch this file
- `web/src/app/admin/bot/broadcasts/new/page.tsx` — find the `TEMPLATE_OPTIONS` constant
- `functions/src/bot/broadcast/dispatch.ts` — read just enough to understand that adding a new template to the registry "just works" through `dryRunBroadcast`/`createBroadcast`/`runBroadcast`. No dispatcher changes should be required for these templates (they're param-free).
- `bot/data/events.yaml` — see how the existing `ceremony` event is shaped; add `reminders: []` cleanly to that entry.

### 3. Verify the existing audience-filter for Saturday attendees

In `functions/src/bot/broadcast/audience.ts`, confirm `AudienceSpec.requiresNight: 'saturday'` works correctly. The admin UI doesn't expose this as a control yet — the operator selects the audience via the existing language/RSVP-status filters or by pasting phones. For T12/T13, "all ceremony attendees" maps to: bot-enrolled + RSVP-attending + (ideally) staying Saturday night. **Don't add a new UI control for this** — the operator can use the existing controls.

---

## Implementation tasks

### Task 1: Template registry entries

In `functions/src/bot/whatsapp/templates.ts`:

1. Add `"bus_pickup_early"` and `"bus_pickup_last"` to the `TemplateName` union.
2. Add a zod var schema. Since both templates have **no body variables**, the schema is `z.object({})` — but check the Meta response for header/footer/buttons that might need params. Most likely shape:
   ```ts
   const EmptyVars = z.object({});
   type EmptyVars = z.infer<typeof EmptyVars>;
   ```
3. Add preview-body constants for ES (and EN if Meta has it). Mirror the exact approved text — including any closing `🌊` emoji, asterisks for bold, etc.
4. Add the two registry entries. Hardcode `language.code` based on what Meta has approved. If only `es`, hardcode `"es"` and have the EN preview return the ES copy (like the `seating_unlocked` pattern). If both `es` and `en`, use the `lang` arg (like `welcome_onboarding`'s pre-edit pattern — see git for it).
5. Update the `TEMPLATES` Record type at the top of the registry to include both new keys.

If Meta's response includes a static FOOTER like `"Thora al habla"`, **do not** send a FOOTER component in the payload — Meta renders the approved footer automatically. We only send components for things that take parameters (BODY, HEADER if image, BUTTON if URL/quick-reply with a placeholder).

If Meta's response includes a static HEADER (text, not image), same rule — don't send it. If the HEADER is `IMAGE` and per-send (uploadable), follow the `welcome_onboarding` pattern (hardcoded image URL). The bus pickup templates likely have no header, but verify from the response.

### Task 2: Admin UI dropdown

In `web/src/app/admin/bot/broadcasts/new/page.tsx`:

1. Add two entries to `TEMPLATE_OPTIONS`:
   ```ts
   { value: 'bus_pickup_early', label: 'Bus pickup early (T12)' },
   { value: 'bus_pickup_last',  label: 'Bus pickup last (T13)' },
   ```
2. Both should behave like T1/T6/T8 — no extra picker, no special branches.
3. The `isEsOnlyTemplate` boolean is used to lock the language selector to `es` for T3/T4. If Meta approved bus_pickup only in `es`, extend `isEsOnlyTemplate` to include the bus templates. If both `es` and `en` are approved, leave them out of `isEsOnlyTemplate`.

### Task 3: Suppress T3 for the ceremony event

In `bot/data/events.yaml`, find the `ceremony` event entry (id `ceremony`) and add:

```yaml
    reminders: []   # T3 suppressed — T12/T13 (bus pickup) handle ceremony reminders.
```

Place it alongside the existing fields (e.g., right after `whom: "all"`). Don't change anything else on that entry.

Then tell the operator to re-sync:

```sh
node bot/scripts/sync-kb.mjs events venues
```

This will overwrite `events/{ceremony}` in Firestore with the new `reminders: []` field, suppressing the generic T3 fire for ceremony.

### Task 4: Build + typecheck + lint

Run from repo root:

```sh
cd functions && npm run build && npm run lint
cd ../web && npx tsc --noEmit && npm run lint
```

Both must exit 0 (web may have pre-existing errors in unrelated files — filter for files you touched).

### Scheduling decision (optional, ask operator before implementing)

The spec calls for T12 to fire at 14:00 Sat and T13 at 16:45 Sat automatically. Two options:

**Option A — manual operator fire (recommended for today).** The operator goes to `/admin/bot/broadcasts/new` at the right time, picks T12, confirms send. Same for T13. Zero new scheduling code. Operator is presumably awake and at a screen on wedding day.

**Option B — seed `bot_content_unlocks/` docs.** The existing `botContentUnlockTick` scheduled function (`functions/src/bot/scheduled/content-unlock.ts`) reads `bot_content_unlocks/{id}` docs and fires whatever templateName they specify within ±30s of their `unlockAt`. For T12/T13 you'd seed two docs:

```
bot_content_unlocks/bus_pickup_early_2026-05-30:
  unlockAt: "2026-05-30T14:00:00+02:00"
  templateName: "bus_pickup_early"
  audience: { requiresNight: "saturday", rsvpStatus: "attending" }
  enabled: true

bot_content_unlocks/bus_pickup_last_2026-05-30:
  unlockAt: "2026-05-30T16:45:00+02:00"
  templateName: "bus_pickup_last"
  audience: { requiresNight: "saturday", rsvpStatus: "attending" }
  enabled: true
```

You can mirror the existing `scripts/seed-content-unlock-seating.ts` to produce a `seed-content-unlock-bus-pickup.ts`. The `botContentUnlockTick` scheduler is generic — it doesn't care what template fires.

**Ask the operator which they prefer before writing scheduling code.** If they pick A, your work ends after Task 4. If B, also produce the seed script.

---

## Testing

### Step 1: Offline payload sanity (30 seconds, no Firestore, no Meta)

```sh
cd functions && npm run build
node --input-type=module -e "
import {TEMPLATES} from './lib/bot/whatsapp/templates.js';
for (const name of ['bus_pickup_early', 'bus_pickup_last']) {
  console.log('===', name, '===');
  console.log(JSON.stringify(TEMPLATES[name].buildPayload('en', {}), null, 2));
}
"
```

Check that the output matches the Meta-approved structure exactly: `language.code`, `components` shape, no extra components for static footers/headers.

### Step 2: Meta smoke test (~1 min, costs 2 template credits)

Have the operator send each template to their own phone via curl:

```sh
PHONE_NUMBER_ID="$(firebase functions:secrets:access WHATSAPP_PHONE_NUMBER_ID)"
ACCESS_TOKEN="$(firebase functions:secrets:access WHATSAPP_ACCESS_TOKEN)"
YOUR_PHONE="+34XXXXXXXXX"

for name in bus_pickup_early bus_pickup_last; do
  echo "=== sending $name ==="
  curl -sS -X POST \
    "https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "messaging_product": "whatsapp",
      "to": "'"${YOUR_PHONE}"'",
      "type": "template",
      "template": {
        "name": "'"${name}"'",
        "language": {"code": "es"},
        "components": []
      }
    }' | jq .
done
```

Both should return 200 with `messages[0].id`. Operator should receive both on their phone. If you see a 132012-series error, the payload shape in `buildPayload` is wrong — diff against this curl.

### Step 3: Admin UI dry-run + single-recipient send

Deploy:

```sh
cd functions && firebase deploy --only functions:botSendBroadcast
cd ../web && npm run build && firebase deploy --only hosting
```

In `/admin/bot/broadcasts/new`:
1. Pick **Bus pickup early (T12)** → no extra picker should appear. Confirm language is locked to `es` (if Meta approved only `es`).
2. Paste the operator's own phone in the explicit list.
3. Previsualizar → audience count `1`, preview body matches the Meta-approved copy exactly.
4. Confirmar → ENVIAR. Operator's phone receives the message within ~10s. Broadcast doc shows `status: complete`, `sentCount: 1`.
5. Repeat for **Bus pickup last (T13)**.

### Step 4: Confirm ceremony T3 is suppressed

After the operator re-runs `node bot/scripts/sync-kb.mjs events venues`:

```sh
firebase firestore:get events/ceremony
```

Confirm the doc shows `reminders: []`. This means `botEventReminderTick` will iterate ceremony but skip both default lead times (60min, 15min) and fire nothing — exactly the desired behavior.

### Step 5 (only if Option B scheduling was chosen)

Pre-fire via the scheduler 2 minutes in advance to a test phone. Same pattern as the existing `seating_2026-05-30` content-unlock test in `scripts/seed-content-unlock-seating.ts` instructions. Watch `firebase functions:log --only botContentUnlockTick` for `bot.scheduled.content_unlock.dispatched`.

---

## Do not do these things

- **Do not change the Meta-side templates.** Even if you find a typo in the approved copy, re-submission takes hours and we'd miss the wedding-day window. If the copy is "wrong" relative to the spec, the Meta version wins — update the spec doc to match in a follow-up if you want.
- **Do not edit `functions/src/bot/callables/send-broadcast.ts`** — it doesn't need changes; the registry-based template-name validation handles new templates automatically.
- **Do not touch the dispatcher's seating-resolver, event-reminder-resolver, or any of the existing template logic.** T1/T3/T4/T6/T8 were stabilized very recently and breaking them would be costly. Only add new registry entries.
- **Do not add per-guest variables to T12/T13.** Per the spec and (likely) Meta, both templates have no `{{n}}` placeholders. Even if the body mentions "17:30" it's literal text, not a parameter.
- **Do not invent a new scheduled function** unless Option B is explicitly chosen. The existing `botContentUnlockTick` handles arbitrary template+unlockAt pairs.
- **Do not skip the curl verification step.** We learned the hard way on T3 and T4 — the Meta response differs from the spec in subtle ways and breaks sends.
- **Do not commit changes unless the operator asks.** This codebase has explicit memory feedback ("commit only when explicitly asked").

---

## Reference: key file paths

- `bot/specs/05-message-templates.md` — spec, §T12 line 431, §T13 line 467
- `bot/specs/00-overview.md` line 158 — quick "Bus pickup: double-beat reminder" note
- `bot/data/events.yaml` — event source of truth; ceremony entry needs `reminders: []`
- `bot/scripts/sync-kb.mjs` — YAML → Firestore sync
- `functions/src/bot/whatsapp/templates.ts` — runtime template registry
- `functions/src/bot/broadcast/dispatch.ts` — dispatcher (no changes expected)
- `functions/src/bot/broadcast/audience.ts` — audience filter (no changes expected)
- `functions/src/bot/callables/send-broadcast.ts` — admin callable (no changes expected)
- `functions/src/bot/scheduled/content-unlock.ts` — scheduler used by seating + (optionally) bus pickup
- `web/src/app/admin/bot/broadcasts/new/page.tsx` — admin compose UI; only `TEMPLATE_OPTIONS` needs editing
- `web/src/lib/bot-callable.ts` — typed wrapper for the callable (no changes expected)
- `scripts/seed-content-unlock-seating.ts` — reference for Option B seed script if chosen

---

## Definition of done

1. Both T12 and T13 appear in the admin compose UI dropdown.
2. Dry-run preview renders the exact Meta-approved body for both, in the language they were approved in.
3. A live single-recipient send via the admin UI for each template lands on the operator's phone with the approved copy and no Meta error.
4. `events/{ceremony}` in Firestore has `reminders: []`.
5. `npm run build` and `npm run lint` pass in both `functions/` and `web/`.
6. The operator knows whether they're firing manually at 14:00/16:45 Sat or via scheduled docs (Option A vs B), and has the commands they need.

If you finish before reaching definition-of-done, **say what's blocking** rather than declaring success. This is wedding-day work — silent partial wins are worse than known gaps.
