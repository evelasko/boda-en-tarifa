# Backup-SIM Swap Runbook

> Operator-only runbook for switching the bot to its backup WABA phone number when the primary is unavailable. Drafted 2026-05-23 (Phase C6 of `launch-readiness-plan.md`). Replaces the deferred Imp-13 script — the SIM cannot be rehearsed in time, so this is a doc, not a one-shot.
>
> **Audience**: Enrique (and Manuel as backup). Assumes Op-3 has provisioned a verified backup number on a different carrier, with all critical templates approved, and the backup secrets captured in the password manager.
>
> **Pre-condition**: every step below has `OPERATOR VERIFIES` next to anything that touches Meta, Firebase, or production traffic — verify before relying on it mid-incident.

---

## When to swap

You swap if any of the following is true about the **primary** number:

- Meta has flagged it (quality drop banner in WhatsApp Manager, or templates suddenly rejected) **AND** template sends are failing.
- The primary SIM's carrier is offline for your geography for >15 minutes and inbound is not delivering.
- A WABA-level policy violation has triggered an account-review hold that blocks sends.

You **do not** swap for:

- A transient 5xx from Meta — wait 5 minutes, refresh the dashboard, check Sentry.
- A single template failing — Meta sometimes pauses individual templates; pick a different one.
- A misconfigured allowlist or a Firestore rule glitch — those are not number-related.

If unsure, ping the implementer before swapping. A swap is reversible but costs ~5 minutes during which guests can't reach Thora.

---

## Pre-swap checklist

Before doing anything destructive, confirm all of the below. If any item is unverified, stop and finish it first — a half-prepared swap is worse than letting the primary degrade further.

- [ ] **Backup `WHATSAPP_PHONE_NUMBER_ID` is captured** in 1Password / Bitwarden (look for the entry tagged `boda-bot-backup-sim`). `OPERATOR VERIFIES`
- [ ] **Backup `WHATSAPP_ACCESS_TOKEN` is captured** in the same entry. `OPERATOR VERIFIES`
- [ ] **All critical templates are Approved on the backup number.** Open Meta Business Manager → WhatsApp Manager → backup number → Message Templates. Confirm at minimum: `welcome_onboarding`, `event_reminder_generic`, `seating_unlocked`, `film_developed`, `farewell_thanks`. `OPERATOR VERIFIES`
- [ ] **The backup SIM is physically in the test phone** and has a usable balance (€2+). Sending a manual WhatsApp message from the backup number to the operator's personal number should round-trip. `OPERATOR VERIFIES`
- [ ] **You have shell access** to a machine with the Firebase CLI signed in to the prod project. Run `firebase projects:list` to confirm. `OPERATOR VERIFIES`

If any of the above fails, do not swap. Either degrade gracefully on the primary or pause guest-facing sends (`config/bot.enabled = false` from `/admin/bot/settings`) while you fix the backup.

---

## Swap commands

Run these from the repo root on your operator workstation. Commands are listed in the exact order you must execute them — do not parallelize, do not skip.

1. Set the backup `WHATSAPP_PHONE_NUMBER_ID`. Firebase prompts for the value; paste from the password manager.
   ```bash
   firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID
   ```
   `OPERATOR VERIFIES` the prompt displays the **prod** project name before pasting.

2. Set the backup `WHATSAPP_ACCESS_TOKEN`. Same dance.
   ```bash
   firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN
   ```
   `OPERATOR VERIFIES` the prompt project matches prod.

3. Redeploy the webhook function only. This takes 60–120s — the new secrets bind on cold start.
   ```bash
   firebase deploy --only functions:whatsappWebhook
   ```
   `OPERATOR VERIFIES` the deploy reports "Successful create operation" or "Successful update operation". Any other status — stop and investigate.

The other Cloud Functions (`botEventReminderTick`, `botContentUnlockTick`, `botFilmDeveloped`, `botKeepKbWarm`) share the same `WHATSAPP_*` secrets pool, so a fresh deploy of just the webhook is enough — they'll pick up the new values on their next cold start. If you want to force this immediately, add them to the deploy:
```bash
firebase deploy --only functions:whatsappWebhook,functions:botEventReminderTick,functions:botContentUnlockTick,functions:botFilmDeveloped,functions:botKeepKbWarm
```
`OPERATOR VERIFIES` is needed only if a scheduled fire is imminent (within 5 minutes).

---

## Meta-side webhook re-confirmation

The webhook URL itself does not change — it's the same Cloud Functions endpoint either way. But Meta tracks webhook subscription per-number, so the backup number needs its webhook subscription confirmed (this was already done during Op-3 setup; verify it survived).

1. Meta Business Suite → WhatsApp Manager → select the **backup** number → Configuration → Webhook. `OPERATOR VERIFIES`
2. Confirm the callback URL matches the production webhook URL (`https://europe-west1-<project>.cloudfunctions.net/whatsappWebhook` or the equivalent rewrite). `OPERATOR VERIFIES`
3. Confirm `messages` is checked under "Webhook fields". `OPERATOR VERIFIES`
4. If anything is missing, click "Verify and Save". Meta will GET the webhook handshake; the existing `WHATSAPP_VERIFY_TOKEN` is unchanged, so this should succeed. `OPERATOR VERIFIES` the green check appears.

---

## Verification

Within 2 minutes of the deploy completing, prove the new number is live:

1. From the operator's **personal** WhatsApp, send a Spanish "hola" to the **backup** number's WhatsApp profile. `OPERATOR VERIFIES`
2. Thora replies within ~5 seconds with an in-character greeting. `OPERATOR VERIFIES`
3. Open `/admin/bot/conversations` → confirm a new thread appears for the operator's phone, tagged with the backup number's phoneNumberId in the audit row's metadata. `OPERATOR VERIFIES`
4. Check Sentry — no new errors during the swap window. `OPERATOR VERIFIES`

If the test inbound round-trips: the swap is live, you're done.

If it doesn't:

- The webhook may still be cold-starting. Wait 90s and retry.
- Check Cloud Logging for `bot.webhook.signature_failed` — the app secret hasn't changed, so this would indicate Meta is calling the wrong app. Stop and rollback (see below).
- Check for `bot.send.text.failed` with `metaCode: 131047` or similar — the access token may not have full permissions on the backup number. Re-verify Op-3 step 3 (system-user permissions).

---

## Guest notification fallback

The guests don't know the number changed. They saved Thora's primary number in their phone book and will keep messaging it. Until they message the backup, the bot can't respond.

Three communication paths in priority order:

1. **One-off broadcast from the primary, if the primary still has any send capacity.** Open `/admin/bot/broadcasts/new` BEFORE running the swap commands. Use template `welcome_onboarding` or a hand-rolled session message announcing the new number. This works only if the primary is degraded but not fully blocked.

2. **The operator's personal WhatsApp.** Manually message the most-important guests (immediate family, wedding party) from your personal WhatsApp with: "Thora's number changed — please save +XX XXX XXX XXX. The old number is offline." `OPERATOR VERIFIES` the message goes to the right contacts.

3. **Public channel.** If you have a private wedding Instagram / Facebook / shared family group, post the new number there. Last resort — assume reach is incomplete.

**Do not** try to forward inbound on the primary to the backup. WhatsApp does not support that, and any attempt will fail or violate ToS.

---

## Rollback

If the backup turns out to be worse than the degraded primary, reverse the swap:

1. Re-set the primary values from the password manager:
   ```bash
   firebase functions:secrets:set WHATSAPP_PHONE_NUMBER_ID
   firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN
   ```
   Paste the original primary values when prompted. `OPERATOR VERIFIES` you are pasting the **primary** entry, not the backup.

2. Redeploy:
   ```bash
   firebase deploy --only functions:whatsappWebhook
   ```
   `OPERATOR VERIFIES` deploy success.

3. Re-run the verification steps above using the primary number.

If both numbers fail simultaneously, set `config/bot.enabled = false` from `/admin/bot/settings` (or via the Firebase console if the admin UI is unreachable) and notify guests via personal WhatsApp that Thora is offline for maintenance. Then ping the implementer — at that point the issue is not number-related.

---

## After the swap

Once the backup is stable and you're not actively responding to an incident:

- Update the password manager: flip the labels so the **backup** entry is now marked `boda-bot-primary` and vice versa. Future swaps will use the next backup. `OPERATOR VERIFIES`
- Open a post-mortem note in `bot/docs/incident-notes.md` (create if missing) with: when, why, what changed, what to investigate post-event.
- If Meta restored the original primary, decide whether to swap back during the event or wait until 2026-06-05 (the wind-down date in F4).
