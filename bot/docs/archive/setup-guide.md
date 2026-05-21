# WhatsApp Bot — Setup Guide (Operator)

> One-time setup steps the operator (Enrique) performs before implementation can begin or testing can go live. Allow ~half a day of focused work, plus 1–3 days of waiting on Meta verification.

This guide is for **Enrique**. The implementer (LLM or engineer) does NOT do these steps — they require human identity and ID upload.

## Before you start

You'll need:

- A laptop (not just a phone — Meta Business Manager works best on desktop).
- A government-issued photo ID and a recent utility bill or bank statement, in PDF or JPG, for business verification.
- A SIM card for a phone number that will be the bot's number. Get a new one if you don't want to deactivate your personal number from consumer WhatsApp.
- An hour or two of uninterrupted focus.
- Your existing access to:
  - The Firebase project (`boda-tarifa-prod`).
  - Anthropic console (or the ability to create one).
  - Cloudinary account (already set up for the web).
  - The wedding domain DNS (for an optional verification record).

Outcome at the end of this guide:

- A WhatsApp Business Account (WABA) on a real phone number, ready for templates and webhook traffic.
- Anthropic API key.
- All Firebase secrets set.
- Webhook subscription connected to Meta.
- Meta test number unlocked for development before production templates are approved.

---

## Step 1: Decide on the legal entity

Meta requires "business verification." For a personal wedding project, the easiest path is your `Autónomo` registration if you have one, or a small one-page company. If you don't have either:

- **Path A (recommended):** Use your `Autónomo` ID. Verification approval is usually within 24h.
- **Path B (fallback):** Submit as an individual using your DNI/passport. Meta may take longer (3–10 days) and may ask follow-up questions. Doable, but plan for the wait.

Whichever path: have a clear "business name." For Path B, just use "Enrique Velasco — Boda en Tarifa". For Path A, use your Autónomo trade name.

**Checkpoint:** Decide your path now and note the entity name. You'll use it consistently.

---

## Step 2: Create a Meta Business Manager account

If you don't already have one:

1. Go to https://business.facebook.com.
2. Click "Create Account."
3. Use a Facebook account you control (a personal one is fine — Meta requires a personal account behind every business account).
4. Set the business name to the entity from Step 1.
5. Verify your email.

Add Manuel as a second admin **right away**:

1. Business Settings → Users → People → Add.
2. Enter Manuel's email; assign "Admin" role.
3. He confirms via email link.

This is your insurance if something happens to your account.

---

## Step 3: Provision the bot's phone number

You have two sub-paths:

### A. Use a fresh SIM (recommended)

1. Pick up a Spanish prepaid SIM (Movistar, Vodafone, Yoigo — any). ~€5–10.
2. Activate it. Note the phone number.
3. **Do not** install consumer WhatsApp on this number; if you accidentally did, deactivate WhatsApp on that phone (Settings → Account → Delete my account in WhatsApp). The number must be free of consumer WhatsApp before you can use it for the Cloud API.
4. Keep the SIM in a phone you can occasionally check for SMS verification codes during setup.

### B. Use an existing number you own (only if you can give it up consumer-WhatsApp-side)

1. Open consumer WhatsApp on that number.
2. Settings → Account → Delete my account.
3. Wait ~24 hours before proceeding (Meta requires it).

You'll register this number into Meta's WhatsApp Manager in Step 5.

---

## Step 4: Start business verification

In Meta Business Manager:

1. Business Settings → Security Center.
2. Click "Start Verification."
3. Enter business legal info: name (matching ID), country (Spain), tax ID (DNI for individuals, NIF for companies).
4. Upload supporting docs:
   - For Path A: Autónomo registration + utility bill or bank statement showing your address.
   - For Path B: Photo ID + recent utility bill (last 3 months).
5. Submit.

You can proceed to other steps while this is pending. **Verification approval takes 1–10 days.** The bot can run in unverified mode (limited to 250 unique recipients/day, which is fine for ~150 guests) but quality and trust scoring is tighter.

**Checkpoint:** Once verified, you'll see a "Verified" badge on the business profile.

---

## Step 5: Create a Meta App + WhatsApp product

Meta requires a "Meta App" container for the WhatsApp product:

1. Go to https://developers.facebook.com/apps.
2. Click "Create App."
3. Choose **"Other"** as use case → **"Business"** as type.
4. Name: `Boda en Tarifa Bot`. Linked Business Account: your Business Manager from Step 2.
5. App created. You're now in the App Dashboard.

Add WhatsApp:

1. App Dashboard → "Add a Product" → **WhatsApp** → "Set Up."
2. Choose your Business Account (created in Step 2).
3. Meta provisions a **test number** for you immediately. Note its phone number — you'll use this for development.
4. The dashboard now shows your Phone Number ID (numeric) and Business Account ID (WABA ID). **Save both** — you'll set them as Firebase secrets.

---

## Step 6: Add and verify the production phone number

In WhatsApp Manager (under your Business Account):

1. Phone Numbers → "Add Phone Number."
2. Enter the number from Step 3 (in international format, e.g., `+34612345678`).
3. Choose verification method (SMS or voice). The number receives a 6-digit code; enter it.
4. Set **Display Name**: e.g., `Boda en Tarifa` or `Wedding Concierge`. This name needs Meta approval (~1–24h). Approval is granted unless the name implies you're someone you're not. Keep it descriptive.
5. Choose two-factor authentication PIN — note this PIN somewhere safe; you'll re-enter it if you ever migrate the number.

**Checkpoint:** Phone Number Display Name shows "Approved."

---

## Step 7: Create the Anthropic account & API key

1. Go to https://console.anthropic.com.
2. Sign up or log in.
3. Workspaces → create one called `Boda en Tarifa`.
4. API Keys → create a key named `boda-bot-prod`. Copy it (you'll see it only once).
5. Settings → Limits → set a **monthly spend cap of €200** as a hard ceiling. The expected actual spend is <€30, but the cap protects against runaway costs.

Save the API key for Step 9.

---

## Step 8: Cloudinary preset

You already have Cloudinary for the web. Add a new unsigned upload preset for the bot:

1. Cloudinary console → Settings → Upload → Upload presets → Add upload preset.
2. Name: `wedding_photos_pending`.
3. Mode: **Unsigned**.
4. Folder: `wedding/2026/whatsapp/`.
5. Allowed formats: `jpg, png, webp, mp4, mov, heic`.
6. Auto-tagging: enabled (optional).
7. Eager transformations:
   - `c_limit,w_1080,q_auto,f_auto` (web preview)
   - `c_thumb,w_400,h_400,g_auto,q_auto,f_auto` (thumb)
8. Tags applied: `whatsapp, bot, pending_moderation`.
9. Save.

You don't need new API credentials — the existing Cloudinary cloud name + API secret is reused.

---

## Step 9: Set Firebase secrets

From a terminal where `firebase` CLI is logged in to the prod project:

```bash
cd /path/to/boda-en-tarifa

firebase use boda-tarifa-prod

firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN
# paste the system-user token from Meta (see Step 10 below)

firebase functions:secrets:set WHATSAPP_APP_SECRET
# paste from Meta App → Settings → Basic → App Secret

firebase functions:secrets:set WHATSAPP_VERIFY_TOKEN
# paste a randomly-generated 32-byte hex string (e.g. `openssl rand -hex 32`)

firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID
# paste from WhatsApp Manager → Phone Numbers → click your number → ID

firebase functions:secrets:set WHATSAPP_BUSINESS_ACCOUNT_ID
# paste from Business Settings → WhatsApp Accounts → ID

firebase functions:secrets:set ANTHROPIC_API_KEY
# paste the key from Step 7
```

Confirm:

```bash
firebase functions:secrets:access WHATSAPP_PHONE_NUMBER_ID
# ...should print the value (or its name only depending on CLI version)

firebase functions:secrets:get
# lists all defined secrets
```

---

## Step 10: System User access token

Meta access tokens come in two flavors. We want a **System User token** (long-lived, doesn't expire) — not a user token (24h expiry).

1. Business Settings → Users → System Users → Add.
2. Name: `boda-bot-system`. Role: **Admin**.
3. Click "Add Assets" → WhatsApp Accounts → select your WABA → permissions: **Full Control** (or at minimum: messaging + manage templates + manage flows).
4. "Generate New Token":
   - App: your Meta App (from Step 5).
   - Token expiration: **Never**.
   - Permissions: `whatsapp_business_messaging`, `whatsapp_business_management`.
5. Copy the token. Set it as the `WHATSAPP_ACCESS_TOKEN` secret in Step 9.

This token doesn't expire — keep it secret. If leaked, regenerate immediately (it invalidates the old).

---

## Step 11: Configure the webhook

After the implementer has deployed at least the webhook scaffold (see implementation plan Day 2 deliverable):

1. App Dashboard → WhatsApp → Configuration → Webhook.
2. Callback URL: paste the deployed Cloud Function URL (e.g., `https://europe-west1-boda-tarifa-prod.cloudfunctions.net/whatsappWebhook`).
3. Verify Token: paste the same value you put in `WHATSAPP_VERIFY_TOKEN`.
4. Click "Verify and Save." Meta calls the GET handshake; if the function returns the challenge correctly, this succeeds.
5. Click "Manage" on the webhook fields and subscribe to:
   - `messages` (required)
   - `message_template_status_update` (recommended)
   - `account_update` (recommended)
   - `phone_number_quality_update` (recommended)

**Checkpoint:** Send any message from a personal WhatsApp to the test number → check Cloud Logs to see the inbound payload arrive at your function.

---

## Step 12: Add allowlisted test recipients (test number)

Until templates are approved (Day 4-5), you'll be using the Meta test number. The test number can only message **5 specific phone numbers** — you must add them.

1. App Dashboard → WhatsApp → Getting Started.
2. "To" field → "Manage phone number list" → add up to 5 test phones (yours, Manuel's, a friend's, etc.).
3. Each phone receives a verification message; tap to confirm.

These 5 phones can also message the test number freely, opening the CSW.

---

## Step 13: Submit templates and Flows

This requires the implementer to have authored them. See:

- `bot/specs/05-message-templates.md` — for the 22 templates (11 logical × 2 languages).
- `bot/specs/06-whatsapp-flows.md` — for the 6 Flows.

Submission is via WhatsApp Manager UI:

1. WhatsApp Manager → Message Templates → Create Template (for each).
2. WhatsApp Manager → Flows → Create Flow → paste JSON (for each).

Approval is typically within 24h per item. Submit on **Day 4** of the implementation plan to leave buffer.

After approval, run the seeding script to populate `config/bot.flows.activeIds` with each Flow's Meta-side ID:

```bash
cd functions
npx ts-node scripts/seed-bot-config.ts
```

---

## Step 14: Production phone number — switch from test number

This happens once everything works on the test number AND verification is complete AND templates are approved (typically Day 8-10 of the implementation plan):

1. App Dashboard → WhatsApp → Configuration → switch the Phone Number ID secret to your production number ID (set in Step 6).
2. Update Firebase: `firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID` with the prod ID, redeploy.
3. Webhook URL stays the same.
4. Send a real broadcast to a small audience (operator + Manuel + 2 friends) as a smoke test before the full guest rollout.

---

## Step 15: Backup admin and emergency access

In case anything happens to your primary access:

- [ ] Manuel added as admin on Meta Business Manager (Step 2).
- [ ] Manuel has access to the Firebase project (`boda-tarifa-prod`) as Owner or Editor.
- [ ] Manuel has Anthropic console access (add as workspace admin).
- [ ] Print or write down (and seal in an envelope):
  - Meta Phone Number ID
  - Meta WABA ID
  - Two-factor PIN for the WABA phone number
  - Verify token (it's not a secret — you control its rotation)
- [ ] Save the System User token in your password manager.

---

## Final pre-launch checklist (you, as operator)

- [ ] Business verified.
- [ ] Display name approved.
- [ ] All 22 templates show "Approved."
- [ ] All 6 Flows show "Published."
- [ ] Webhook responding (test with a manual GET handshake).
- [ ] Test broadcast to operator + Manuel succeeded with both languages.
- [ ] Test conversation answered correctly in both ES and EN.
- [ ] Test Flow submission appeared in admin dashboard.
- [ ] Test photo upload appeared in moderation queue.
- [ ] Backup admin access verified (have Manuel log in independently).
- [ ] Anthropic spend cap set to €200/month.
- [ ] Phone number quality rating "High" (or at least "Medium" with no warnings).
- [ ] Privacy notice page live at `bodaentarifa.com/privacy-bot`.
- [ ] Runbook (`bot/docs/admin-runbook.md`) read and walked through.

When all green: you're ready to send the welcome onboarding broadcast to all guests (typically 5–7 days before the wedding).

---

## Troubleshooting

If something goes wrong during setup, see `bot/docs/troubleshooting.md` for common issues. The most frequent ones:

- **Verification stuck for >5 days:** email Meta support (link in Business Manager → Help). Mention you're a small business and the timeline.
- **Phone number rejected for "still active in WhatsApp":** wait 24h after deactivating consumer WhatsApp on that number; retry.
- **Display name rejected:** Meta thinks the name is misleading. Use something more descriptive like "Enrique & Manuel Wedding Bot".
- **Test number not receiving messages:** check that the sending phone is in the test recipient list (Step 12).
- **Webhook GET handshake fails:** verify token mismatch — re-check that the value you pasted in Meta matches `WHATSAPP_VERIFY_TOKEN` exactly.
- **HMAC verification fails on POST:** App Secret mismatch — regenerate from Meta App settings and update Firebase secret.
