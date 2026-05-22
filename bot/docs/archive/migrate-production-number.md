# Migrating the production phone number to the "Thora al habla" app

> Move the existing business phone number from the WhatsApp Business App (and its old WABA) into the production Meta App "Thora al habla" on Cloud API — with display name `Thora al habla`, custom profile picture, and a tailored description.

This guide is for **Enrique** (operator). It complements `setup-guide.md` Steps 6 and 14, but is written for the concrete situation where:

- The number currently lives in the **WhatsApp Business App** (mobile) under a business WABA you no longer need.
- You already have a production Meta App **"Thora al habla"** (App ID `1459981058648067`) and a production WABA created in `setup-guide.md` Steps 2–5.
- The webhook is working end-to-end on the Meta test number (verified during `setup-guide.md` Step 11 checkpoint).

Time budget: **~1 hour of focused work**, plus **0–7 days of waiting** (display-name approval, optional 2-step-verification cooldown).

---

## What you'll lose, what you'll keep

- **Lost:** Chats currently in the WhatsApp Business App for this number. They stay on the device file system (you can export them — see Step 2) but the Cloud API does not import them. Once the number is on Cloud API, the mobile app for that number is deactivated.
- **Lost:** The old "business WABA" (you'll delete it in Step 12).
- **Kept:** The phone number itself. Same SIM, same number, same SMS reception.
- **Kept:** Your Meta Business Manager, the production "Thora al habla" Meta App, the production WABA, all Firebase secrets infra. Only a few secret *values* change.

---

## Pre-flight — what you need at hand

- [ ] The SIM with the production number — in a phone you can use to receive SMS / voice calls right now.
- [ ] Admin access to the **WhatsApp Business App** for that number (the mobile app on the same phone).
- [ ] Admin access to **Meta Business Manager** for both the old business and the new "Thora al habla" business (they're probably the same business, but confirm).
- [ ] Admin access to the production Meta App **"Thora al habla"** at `developers.facebook.com/apps`.
- [ ] A laptop with `firebase` CLI logged in to `boda-tarifa-prod`.
- [ ] A square profile picture (640×640 PNG/JPG, < 5 MB) — we'll discuss what to use in Step 7.
- [ ] The two-step-verification PIN for the number's WhatsApp Business App account (Settings → Account → Two-step verification — if enabled). If you don't remember it, see Step 3.

---

## Step 1: Decide whether "Thora al habla" will pass Meta's display-name review

Meta's display-name guidelines say the name must be "intuitively associated with the business represented by the WABA." For a wedding-companion number, `Thora al habla` is unusual but defensible — and Meta has loosened the bar substantially over the past year, especially for non-commercial accounts.

**My read:** likely approved, but **not guaranteed**. Have a backup ready so you don't lose time on a rejection cycle.

- **Primary submission:** `Thora al habla`
- **Backup #1:** `Boda Enrique & Manuel`
- **Backup #2:** `Boda en Tarifa 2026`

If `Thora al habla` is rejected, you can resubmit immediately with a backup (no penalty). Display-name reviews typically resolve in **a few hours up to 1–3 business days**.

**Tip:** When submitting `Thora al habla`, in any "additional info" / appeal box add one line: *"Thora is the pet of the hosts (Enrique & Manuel). The number is a personal wedding-event concierge for invited guests. Non-commercial."* That context helps reviewers.

**Checkpoint:** Decide your primary + backup names now. Don't change your mind mid-flow.

---

## Step 2: Back up the WhatsApp Business App chats (optional)

If there's nothing important in those chats, skip. Otherwise:

1. On the phone, open WhatsApp Business → Settings → Chats → **Chat backup** → Back up now (Google Drive or iCloud).
2. For chats you want as plain text/PDF: open the chat → ⋮ menu → More → **Export chat** → "Without media" (faster) or "With media" → email/AirDrop to yourself.

Once migrated, the Business App will sign out of this number. The chats stay readable in the app's "archived" state on that one device, but no new messages arrive there — they go to the Cloud API webhook instead.

---

## Step 3: Disable two-step verification (or schedule a 7-day wait)

Meta enforces a **7-day cooldown** if a number has 2-step verification enabled and you try to migrate it without first disabling 2FA (or without entering the PIN). You have three paths:

### Path A — You know the 2FA PIN (recommended)

1. WhatsApp Business app → Settings → Account → **Two-step verification** → **Turn off**.
2. Enter the PIN. Confirm.
3. You can migrate immediately (proceed to Step 4).

### Path B — You don't know the 2FA PIN

1. Disable WhatsApp on that number anyway? No — that doesn't help, you can't bypass.
2. Best option: **wait 7 days**. During the migration in Step 5, Meta will register the number after the 7-day cooldown without requiring the PIN.
3. Mark a reminder in your calendar. Continue with Step 4 (it's all UI prep — doesn't depend on the cooldown).

### Path C — 2FA never enabled

1. Skip to Step 4.

**Checkpoint:** Either 2FA is now off, or you've accepted the 7-day wait.

---

## Step 4: Confirm the production WABA is ready to receive the number

Open WhatsApp Manager: <https://business.facebook.com/wa/manage/>.

1. Top-left **WABA selector** → confirm you can see your **production WABA** (the one linked to "Thora al habla", not the old business one, and not the **Test** one Meta auto-provisioned).
2. Click into it. Sidebar → **Account tools** → **Phone numbers**.
3. If you currently have the test number listed here, that's fine — leave it. We'll add the production number alongside, then later remove the test number (or keep both; the test number is free to keep).
4. Confirm under **Account tools → Overview** that the WABA shows: business verification **approved**, payment method **on file** (Settings → Payment methods → add a card if not — required even for the free service-message tier).

**Checkpoint:** You're looking at the production WABA in WhatsApp Manager, and it has no blockers (no "action required" banner).

---

## Step 5: Migrate the number from WhatsApp Business App to the production WABA

This is the surgical step. Once it succeeds, the number is on Cloud API.

1. Still inside the production WABA → **Account tools → Phone numbers** → click **Add phone number** (top-right).
2. The wizard asks **"What do you want to do?"**:
   - "Add a new phone number" (for a fresh SIM never on WhatsApp).
   - **"Migrate an existing WhatsApp number"** ← pick this.
3. Sub-question: **"Where is it currently registered?"**:
   - **"WhatsApp Business App"** ← pick this.
   - (The other option is "Another WhatsApp Business Platform account" — that's the WABA-to-WABA path, not yours.)
4. Enter the phone number in **international format** (e.g. `+34 612 345 678`).
5. Choose verification method: **SMS** (default) or **Voice call**. SMS is fastest if signal is decent.
6. Meta sends a 6-digit code to that SIM → enter it in the wizard.
7. **2FA PIN prompt:**
   - If 2FA was disabled (Step 3 Path A): no prompt.
   - If 2FA was enabled and you know the PIN: enter it.
   - If 7-day cooldown applied: this step is skipped automatically after the cooldown.
8. **Set a new two-step verification PIN for the Cloud API account.** This is separate from the Business App PIN. Pick a 6-digit code, write it down in your password manager — you'll need it if you ever migrate again or contact Meta support.
9. Submit. The wizard confirms migration in progress; usually completes in **under 60 seconds**.

After it completes:

- The WhatsApp Business App on the phone signs out of this number automatically (you may see "This number is no longer registered with WhatsApp on this phone").
- In WhatsApp Manager → Phone numbers, the new number now appears with status **"Connected"**.
- Click into the number row to see its **Phone Number ID** (a numeric string). **Save this** — you'll need it for the Firebase secret in Step 9.

**Checkpoint:** The number shows up as **Connected** in the production WABA's phone-number list.

---

## Step 6: Submit the display name "Thora al habla"

Still inside the phone-number detail page in WhatsApp Manager:

1. Find the **Display name** section (often labelled "Verified Name" or shown as the bot's outward identity in chat).
2. Click **Edit** or **Submit display name**.
3. Type `Thora al habla` exactly (with that capitalisation — Meta is case-sensitive in storage but presents it as you typed).
4. If a "Reason / additional info" field is offered, paste: *"Thora is the pet of the hosts (Enrique & Manuel). The number is a personal wedding-event concierge for invited guests. Non-commercial."*
5. Submit.

Review timeline: **a few hours to 1–3 business days**. While pending, the number works for messaging but recipients see the raw phone number as the "name." Once approved, Thora al habla shows in WhatsApp chat headers.

**If rejected:** the rejection email/notification states the reason. Resubmit with `Boda Enrique & Manuel` or `Boda en Tarifa 2026` from Step 1.

---

## Step 7: Set up the bot's public profile

Independent of display-name review, you can set the **business profile** that recipients see when they tap your number in WhatsApp.

In WhatsApp Manager → your phone number → **Profile** (or **WhatsApp Business profile**):

1. **Profile picture** — upload the 640×640 picture you prepared. Suggestions for what works visually at small sizes:
   - A close, well-lit headshot of Thora.
   - A simple stylised graphic with `T` or `Thora` text.
   - A photo from the engagement / save-the-date shoot, tightly cropped.
   - Avoid: text-heavy logos that become unreadable at chat-list size.
2. **About** (max 139 characters) — suggestion: *"Asistente de la boda de Enrique & Manuel · Tarifa, 29–31 mayo 2026 🌊"* (replace emoji or remove if you want to skip emoji per house style).
3. **Description** (max 512 characters) — suggestion:
   > *Hola, soy Thora 🐶. Te ayudo con todo lo relacionado con la boda de Enrique & Manuel en Tarifa los días 29, 30 y 31 de mayo de 2026: agenda, ubicaciones, alojamiento, fotos, RSVP. Escríbeme en español o inglés. (Hi! I'm Thora — your wedding assistant. Write in English or Spanish.)*
4. **Category** — pick **"Event Planning Service"** or **"Personal Services"**. (You can change it later.)
5. **Email** — optional. Use a wedding-specific address if you have one; otherwise leave blank.
6. **Website** — `https://bodaentarifa.com`.
7. **Address** — leave blank. (Adding a Tarifa address would be confusing — the bot isn't a business with a venue.)
8. Save.

These fields are **not** subject to Meta review; changes take effect immediately. They're separate from the display-name review in Step 6.

---

## Step 8: Generate a fresh System User token for the production WABA

The `WHATSAPP_ACCESS_TOKEN` you currently have in Firebase secrets was generated for the **test number / test WABA**. It almost certainly does **not** have the new production phone number listed in its asset scope, even though both WABAs may live under the same Business Manager. The cleanest fix is to regenerate.

You can either (a) regenerate against the existing System User you created in `setup-guide.md` Step 10, or (b) create a new System User for clarity. **Option (a)** is simpler.

1. Business Settings → Users → **System Users** → click `boda-bot-system` (or whatever you named it in `setup-guide.md` Step 10).
2. **Add Assets** → **WhatsApp Accounts** → confirm the **production WABA** is checked → **permissions: Full Control** (or at minimum: *Send messages*, *Manage phone numbers*, *Manage templates*, *Manage flows*).
3. (If your test WABA is also assigned: leave it — having both keeps test-number development working.)
4. Back on the System User page → **Generate New Token**:
   - **App:** `Thora al habla`.
   - **Token expiration:** **Never**.
   - **Permissions:** check `whatsapp_business_messaging` and `whatsapp_business_management`.
5. Click **Generate Token** → **copy it once** (you can't see it again). Keep the previous token usable for ~10 min while you swap secrets — they coexist.

---

## Step 9: Update Firebase secrets and redeploy

From your laptop:

```bash
cd /Users/henry/Workbench/White\ Hibiscus/dev/boda-en-tarifa

firebase use boda-tarifa-prod

# (1) New phone number ID — from WhatsApp Manager → phone number detail
firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID
# paste the new numeric Phone Number ID, press enter

# (2) New WABA ID — only if your production WABA is different from what you set
#     during the test-number phase. If you're already on the production WABA,
#     this stays the same and you can skip.
firebase functions:secrets:set WHATSAPP_BUSINESS_ACCOUNT_ID
# paste the production WABA ID

# (3) Fresh access token from Step 8
firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN
# paste the new token

# Confirm both are set
firebase functions:secrets:get
```

`WHATSAPP_APP_SECRET` and `WHATSAPP_VERIFY_TOKEN` do **not** change — they belong to the "Thora al habla" Meta App, which is unchanged.

Redeploy the webhook function so it picks up the new secret values:

```bash
cd functions
npm run build  # sanity check first
cd ..

firebase deploy --only functions:whatsappWebhook
```

Watch the deploy output. On success, the Cloud Run revision URL stays the same:
`https://europe-west1-boda-tarifa-prod.cloudfunctions.net/whatsappWebhook`.

**Checkpoint:** Deploy succeeds. New revision is live.

---

## Step 10: Subscribe the production WABA to the "Thora al habla" app

This is the same `subscribed_apps` step you did for the test WABA — but now for the production WABA. Two-layer rule: subscribing webhook **fields** on the App is not enough; the **WABA itself** must also list the App as a subscriber.

Substitute your real values:

```bash
# Variables — set these once in your shell
WABA_ID="<production WABA ID>"
TOKEN="<the access token from Step 8>"

# Subscribe the WABA to your app
curl -X POST "https://graph.facebook.com/v22.0/${WABA_ID}/subscribed_apps" \
  -H "Authorization: Bearer ${TOKEN}"

# Verify — should list "Thora al habla" (id 1459981058648067) among subscribed_apps
curl -X GET "https://graph.facebook.com/v22.0/${WABA_ID}/subscribed_apps" \
  -H "Authorization: Bearer ${TOKEN}"
```

The verify GET should return JSON containing an entry with `"whatsapp_business_api_data": { "id": "1459981058648067", "name": "Thora al habla" }`.

**Checkpoint:** GET response lists "Thora al habla" as subscribed.

---

## Step 11: End-to-end smoke test

You don't need the test-recipient allowlist for the production number — that restriction is **test-number only**. The production number can message any WhatsApp user, with two natural limits:

- For the **first outbound** (you-initiated), you must use an **approved template** (Marketing/Utility/Auth). Templates aren't approved yet — they come in `setup-guide.md` Step 13.
- For **inbound-first conversations** (the user messages you first, opening a 24h Customer Service Window), you can reply with **free-form text** — which is exactly what the Phase 1 placeholder bot does.

So the smoke test path is **inbound-first**:

1. From your personal WhatsApp (any number, doesn't need to be allowlisted), send a text message to the production number.
2. Expect a reply within ~2 seconds: *"Hola, te leo. (estoy en construcción)"*.
3. Tail logs to confirm the round trip:
   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" \
     AND resource.labels.service_name="whatsappwebhook"' \
     --limit=20 --project=boda-tarifa-prod \
     --format="value(jsonPayload.message, jsonPayload.metaMessageId, jsonPayload.outboundMetaMessageId)" \
     --freshness=5m
   ```
   You should see `bot.webhook.text_inbound` → `bot.webhook.replied`.
4. Repeat from Manuel's phone to confirm it's not a single-recipient fluke.

**Checkpoint:** Both phones get the placeholder reply, and logs show no `send_failed` or `processing_error` lines.

---

## Step 12: Cleanup — retire the old business WABA and uninstall the Business App

Only do this **after** Step 11 passes. Then everything's safely on the new setup.

### 12a. Uninstall WhatsApp Business App from the phone

The mobile app for that number is already signed out (Step 5 deactivated it). Uninstalling it just tidies up the device:

1. Home screen → long-press WhatsApp Business → Uninstall.
2. (Optional) Keep regular consumer WhatsApp on your personal number — that's a separate account on the same device, unaffected.

### 12b. Delete the old business WABA

If the old WABA was auto-created by the Business App and is now empty (no phone numbers, no templates, no flows), you can delete it:

1. business.facebook.com → **Business Settings** → **Accounts** → **WhatsApp Accounts**.
2. Find the old WABA (anything that's **not** the production WABA and **not** the test WABA).
3. Confirm it shows **0 phone numbers** (the migration in Step 5 removed yours).
4. Click the WABA → ⋯ menu → **Remove** (or **Delete**).
5. Meta asks for confirmation — type/confirm.

If Meta refuses to delete (sometimes it complains about pending charges, even €0): leave it. An empty unused WABA costs nothing and doesn't interfere. You can revisit in a few weeks.

### 12c. Decide on the Meta test WABA

You have three options:
- **Keep it** (recommended) — free; useful for future Phase 2+ development without touching production traffic.
- **Detach the test number** from your Business — keep the WABA shell for future test allocations.
- **Delete the test WABA** — same flow as 12b, only if you're sure you won't want a test fixture again.

The `setup-guide.md` Step 12 (test recipient allowlist) still applies if you keep the test number for development.

---

## Step 13: Update operational state

After everything's switched over, take 5 minutes to keep the secondary records in sync:

- [ ] **Password manager**: store the new System User token (Step 8) and the new 2FA PIN (Step 5.8). Delete the old test-number-era token entry, or label it "retired".
- [ ] **`bot/.env.example`** — if any Phone Number ID is committed there as an example value, update or scrub.
- [ ] **Manuel's access** — confirm Manuel can see the production WABA in Business Settings → WhatsApp Accounts → Permissions (he should have admin if added in `setup-guide.md` Step 2).
- [ ] **`setup-guide.md` Step 14** — once display name is approved, update its language to past tense or mark the migration done.

No code change is needed beyond Step 9. The webhook handler reads everything at request time from secrets.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Number is still active on WhatsApp" error in Step 5 wizard. | The mobile WhatsApp Business App didn't sign out cleanly. | On the phone: open WhatsApp Business → Settings → Account → **Delete my account**. Wait 1–2 minutes. Retry migration. |
| Wizard asks for a 2FA PIN you don't have. | 2FA was on, you forgot the PIN. | Cancel. Either (a) wait 7 days from your earliest attempt and retry — Meta will let you through after the cooldown, or (b) reach Meta support via Business Manager → Help. |
| Migration succeeded but no Phone Number ID appears. | UI lag. | Refresh WhatsApp Manager. If still missing after 5 min, log out of Business Manager and back in. |
| Display name pending for > 5 days. | Reviewer backlog. | Resubmit with `Boda Enrique & Manuel`. If still stuck after another 3 days, contact Meta via Business Manager → Help → WhatsApp. |
| Smoke test in Step 11 → 401 on POST to Meta. | Old access token still cached or new token doesn't have the new WABA in its asset list. | Re-do Step 8 ensuring the production WABA is checked under "Add Assets," regenerate token, re-set `WHATSAPP_ACCESS_TOKEN`, redeploy. |
| Smoke test → `send_failed` with code 131030 ("recipient not in allowed list"). | You're somehow still hitting the **test** Phone Number ID. | Re-check `WHATSAPP_PHONE_NUMBER_ID` value in Firebase: `firebase functions:secrets:access WHATSAPP_PHONE_NUMBER_ID`. Compare with WhatsApp Manager → production phone number detail page. |
| Smoke test → webhook receives nothing. | WABA→App subscription missing (Step 10). | Re-run the `subscribed_apps` POST in Step 10. Verify with the GET. |
| Smoke test → `bot.webhook.text_inbound` logged but no `bot.webhook.replied`. | Likely send-side failure with Firestore dedupe already claimed. Inspect the next log line (`send_failed`) for the Meta error code. | Diagnose the specific code; common ones: `190` (token), `132000` (param), `131056` (rate). |
| Cannot delete old business WABA — "pending charges". | Carry-over from messaging tests done on it. | Settings → Payment methods → check balance; pay any remaining €. Retry delete in 24h. If still stuck, leave it (harmless). |

---

## Quick reference — what changes in your infra

| Thing | Before (test number) | After (production number) |
|---|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Test Phone Number ID | **New production Phone Number ID** |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Test WABA ID (or already production) | **Production WABA ID** |
| `WHATSAPP_ACCESS_TOKEN` | Token scoped to test WABA | **Regenerated token scoped to production WABA** |
| `WHATSAPP_APP_SECRET` | Thora al habla App Secret | unchanged |
| `WHATSAPP_VERIFY_TOKEN` | Random hex string | unchanged |
| Webhook callback URL | europe-west1-…/whatsappWebhook | unchanged |
| Meta App | Thora al habla (1459981058648067) | unchanged |
| Subscribed apps on WABA | test WABA → Thora al habla | **production WABA → Thora al habla** |

---

## Done

When all of:
- Display name `Thora al habla` approved ✅
- Profile picture + about + description set ✅
- Smoke test from your phone + Manuel's phone replied successfully ✅
- Old business WABA either deleted or empty-and-ignored ✅

…you're ready to move on to `setup-guide.md` Step 13 (templates + Flows submission) using the production number for everything from here on.
