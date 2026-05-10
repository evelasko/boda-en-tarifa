# WhatsApp Bot — Troubleshooting

> Symptoms, likely causes, diagnostic steps, fixes. Optimized for "I have 10 minutes and need to know what's wrong."

## Quick triage

**Bot completely silent (no replies):**

1. `/admin/bot` health page → red status?
2. `config/bot.enabled` → `true`?
3. Cloud Logging → recent errors on `whatsappWebhook`?

**Bot replying with weird stuff:**

1. Open the offending conversation in `/admin/bot/conversations`.
2. Look at tool calls in the message log — did Claude call the right tools?
3. Check if KB has the right facts (FAQ pages, events, venues).

**Templates not sending:**

1. `/admin/bot/templates` → status of the relevant template?
2. `bot_send_log` → entries for this trigger?

---

## Section A — Setup-time issues

### A.1 Meta business verification stuck

**Symptom:** Verification submitted >5 days ago, still "Pending."

**Diagnose:**

- Business Manager → Security Center → check for "More info needed" prompts.
- Email associated with Business Manager — Meta may have asked for clarification.

**Fix:**

- Provide any requested docs.
- If silent: open a support ticket via Business Manager → Help.
- Meanwhile: use unverified tier (250 unique recipients/day cap — sufficient for the wedding).

### A.2 Display name rejected

**Symptom:** Display name "Boda en Tarifa" or similar shows as Rejected.

**Diagnose:** Meta thinks the name implies you're someone you're not, or it's vague.

**Fix:**

- Try more specific: "Wedding Concierge — E&M" or "Asistente Boda Velasco-Pérez".
- Avoid generic words ("WhatsApp", "Wedding" alone, "Concierge").
- Re-submit. Approval usually <24h on second try.

### A.3 Phone number rejected ("still active in WhatsApp")

**Symptom:** Adding the phone in WhatsApp Manager fails.

**Diagnose:** The number still has consumer WhatsApp installed somewhere.

**Fix:**

- On the phone with that SIM: Settings → Account → Delete my account.
- Wait 24h.
- Retry registration in WhatsApp Manager.

### A.4 Webhook GET handshake fails

**Symptom:** In Meta Configuration, "Verify and Save" returns an error.

**Diagnose:**

- Check the Cloud Function URL is correct (region pinned, function name matches).
- Check `WHATSAPP_VERIFY_TOKEN` matches what you pasted in Meta.
- Check the function is deployed and reachable: `curl https://...cloudfunctions.net/whatsappWebhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123` should return `test123`.

**Fix:**

- Re-deploy: `firebase deploy --only functions:whatsappWebhook`.
- Re-verify token: `firebase functions:secrets:set WHATSAPP_VERIFY_TOKEN`.
- Make sure you're using the same project as you set the secret on (`firebase use`).

### A.5 HMAC verification failing on POST

**Symptom:** Logs show `signature_failed` for every Meta inbound.

**Diagnose:**

- `WHATSAPP_APP_SECRET` mismatch.
- Body parsing changed it (e.g., reading `req.body` instead of `req.rawBody`).

**Fix:**

- Re-copy App Secret from Meta App → Settings → Basic.
- `firebase functions:secrets:set WHATSAPP_APP_SECRET`.
- Re-deploy.
- Verify that the handler reads `req.rawBody.toString('utf8')` for HMAC, not `JSON.stringify(req.body)`.

### A.6 Test number not receiving inbound

**Symptom:** Meta test number; you send a message from your phone but nothing happens.

**Diagnose:**

- Your sender phone must be in the test recipients list (App Dashboard → WhatsApp → Getting Started → Manage phone number list).

**Fix:**

- Add your phone number to the test recipients list. You receive a verification code; enter it.

---

## Section B — Runtime issues

### B.1 Bot not responding to a specific user

**Symptom:** Guest reports they sent a message and got nothing.

**Diagnose:**

```bash
# In Cloud Logging, filter:
labels.phone:"+34••••••678"
# You'll only get last-4 logs per privacy. Use Firestore instead:
```

In `/admin/bot/conversations/[phone]`, view the thread:

1. Was their message received? (look for inbound log entry).
2. Was a reply sent? (look for outbound).
3. If inbound logged but no outbound: check `outcome` field — could be `rate_limited`, `refused`, or `error`.

| `outcome` | Meaning | Fix |
|---|---|---|
| `rate_limited` | Hit 30/5min cap | Wait 60s. Apologize manually if needed. |
| `refused` (allowlist) | Phone not on allowlist | Add via `/admin/bot/unknown-inbound`. |
| `error` | Something blew up | See B.2. |
| (no entry) | Inbound never reached the function | See B.7 (webhook health). |

### B.2 Bot replied with the fallback error message

**Symptom:** Conversation shows: "Perdona, tengo un microcorte. Inténtalo en un momento o escribe `ayuda` para opciones rápidas."

**Diagnose:**

- Cloud Logs for that `requestId` will show the underlying error.
- Most common: Anthropic timeout or transient error.

**Fix:**

- If sporadic (1 in 100): no action.
- If frequent (>5%): check Anthropic status page; raise spend cap if it's quota-related.

### B.3 Bot hallucinating facts

**Symptom:** Bot tells someone the wrong time / place / dress code.

**Diagnose:**

- View the offending message in `/admin/bot/conversations`.
- Check `toolCalls` — did Claude call the right tool?
- If yes, check the tool's output. If wrong, the data source is stale (Firestore content).
- If Claude didn't call the tool and answered from memory, the system prompt isn't constraining enough.

**Fix:**

1. Update the data source (Firestore `events/`, `venues/`, etc.) — KB rebuilds automatically within 30s.
2. If Claude is bypassing tools systematically, tighten Block C in the system prompt: "DO NOT answer from memory if a tool exists for this."
3. Add a golden example to the eval suite covering this case.

### B.4 KB not updating

**Symptom:** You edited an FAQ entry but the bot still gives the old answer.

**Diagnose:**

- Check `bot_kb_version` doc — `version` should have incremented.
- Check `getKb()` in-process cache — is the function instance warm with stale KB?

**Fix:**

- Manually trigger rebuild: in admin, "Force KB Rebuild" button on Settings page (calls `botRebuildKb` Callable).
- If still stale: redeploy `whatsappWebhook` to bust function-instance memory.

### B.5 Flow submission not arriving

**Symptom:** Guest completes a Flow but no confirmation, no Firestore record.

**Diagnose:**

- Cloud Logs for `whatsappWebhook` around the time of submission. Look for `kind: 'flow_submission'`.
- If not present: Meta isn't sending it. Check Webhook Configuration → fields subscribed (`messages` includes Flow submissions).
- If present but no Firestore write: check the handler logs for validation errors.

**Fix:**

- Validation error: the Flow JSON contract drifted. Verify the Flow's published version matches the Zod schema in `bot/whatsapp/flows.ts`.
- Webhook subscription: ensure `messages` field is subscribed.

### B.6 Photos not uploading

**Symptom:** Guest sends a photo; bot acks but `feed_posts` has no record / Cloudinary doesn't show it.

**Diagnose:**

- Cloud Logs for the `requestId` of that inbound.
- Common errors:
  - Meta media URL fetch failed (auth issue).
  - Cloudinary upload failed (preset name wrong, format unsupported).
  - Firestore write failed (rules issue).

**Fix:**

- Cloudinary preset: verify name `wedding_photos_pending` exists and is **Unsigned**.
- Meta auth: verify `WHATSAPP_ACCESS_TOKEN` is current.
- Format: HEIC photos may fail Cloudinary's auto-detection. Add to allowed formats.

### B.7 Webhook silent (Meta sends but function never runs)

**Symptom:** No webhook invocations in Cloud Logging. Guests messaging the bot get nothing.

**Diagnose:**

- Test handshake: `curl https://...cloudfunctions.net/whatsappWebhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test`
- If 404 or 5xx: function not deployed or has a deploy error.

**Fix:**

- Re-deploy: `firebase deploy --only functions:whatsappWebhook`.
- Check IAM: Cloud Function should have `invoker: 'public'` (or the relevant unauthenticated invoker setting).
- Check Meta Webhook configuration → "Verified" should still be true.

### B.8 Quality rating dropped

**Symptom:** WABA quality went from HIGH to MEDIUM or worse. Banner alert in admin.

**Diagnose:**

- Phone Numbers → click your number → see the "Quality" panel.
- Causes: user blocks/reports, marketing-style content sent as Utility, messaging frequency too high.

**Fix:**

- Pause all non-essential broadcasts.
- Review recent template sends — any that look spammy?
- Wait 24-48h; rating typically self-recovers.
- If it drops to LOW, Meta restricts your tier (lower daily limits). For our scale, even Tier 1 (250/day) is sufficient.

### B.9 Anthropic spend approaching cap

**Symptom:** Anthropic dashboard shows usage approaching the €200 monthly cap.

**Diagnose:**

- Check usage by day in Anthropic console.
- If sudden spike: likely cache miss (KB version churning), keep-warm scheduled too often, or runaway loop.

**Fix:**

- Verify cache hit rate via logs. Should be ≥85% on system prompt.
- Lower history window from 8 turns to 4: edit `config/bot.history.turnsInContext`.
- Pause `keepKbWarm` outside event window.
- Drop to Haiku 4.5 for low-confidence routing (1-step decisions before Sonnet).

### B.10 Templates not approving

**Symptom:** Submitted a template; status remains "In Review" >24h or shows "Rejected."

**Diagnose:**

- WhatsApp Manager → Templates → click the template → see rejection reason.
- Common reasons:
  - Variables at start/end of body.
  - Marketing-y wording in a Utility template.
  - Non-transactional content.

**Fix:**

- Edit and re-submit (Meta allows 2 free re-submits).
- If still rejected, ask Meta support via Business Manager → Help. Mention you're a small wedding project.

### B.11 Scheduled function didn't fire

**Symptom:** Event reminder didn't go out; album reveal failed at 05:00.

**Diagnose:**

- Cloud Scheduler console → check the job ran.
- Cloud Logging for the function name.
- `bot_send_log` for the expected entry.

**Fix:**

- If function ran but found no audience: check `bot_send_log` dedupe — was it already sent?
- If function didn't run: check Cloud Scheduler. Re-deploy the scheduled function.
- If it ran but errored: examine logs, fix bug, manually trigger the missed send via admin broadcast.

### B.12 Manual broadcast failing for some recipients

**Symptom:** Broadcast shows "150 audience, 142 sent, 8 failed."

**Diagnose:**

- `/admin/bot/broadcasts/[id]` → see per-recipient error.
- Common errors:
  - `131026` Message Undeliverable — guest's phone has WhatsApp issues.
  - `131056` Pair rate limit — back off, retry.
  - `132000` Template parameter mismatch — variables don't match approved template.

**Fix:**

- For `131026`: contact the guest manually.
- For `131056`: re-run the broadcast for failed recipients only ("Retry failures" button).
- For `132000`: bug — fix variable mapping in code, redeploy, retry.

### B.13 Conversation history truncated

**Symptom:** Bot seems to forget what the user said two turns ago.

**Diagnose:**

- `config/bot.history.turnsInContext` — default 8.

**Fix:**

- Bump to 12 or 16 if needed (check cost impact).
- For most cases 8 is plenty.

---

## Section C — Data issues

### C.1 Guest not in allowlist but should be

**Symptom:** Bot tells a guest "no te encuentro en la lista" but the operator knows they're invited.

**Diagnose:**

- Check `guests/{phone}` exists with the correct E.164 phone.
- Check `botEnrolled: true`.

**Fix:**

- `/admin/bot/unknown-inbound` → add their entry to allowlist.
- Or directly in Firestore: create the `guests/{phone}` doc with required fields.

### C.2 Phone format mismatch

**Symptom:** A phone exists in `guests/` but the bot still says unknown.

**Diagnose:**

- Compare the doc ID with the inbound phone format. Mismatch examples:
  - Stored: `34612345678` (no `+`); inbound: `+34612345678`.
  - Stored: `+34 612 345 678` (with spaces); inbound: `+34612345678`.

**Fix:**

- Run normalization migration: `npx ts-node functions/scripts/migrate-normalize-phones.ts`.
- All phones in the guests collection must be E.164 with `+` and no spaces.

### C.3 Wrong language for a guest

**Symptom:** Bot keeps replying in Spanish to an English-speaking guest (or vice versa).

**Diagnose:**

- `guests/{phone}.language` field — set correctly?

**Fix:**

- Edit in admin or directly in Firestore.
- Bot updates auto-detect on next inbound.

---

## Section D — Operator dashboard issues

### D.1 Can't log in to admin

**Symptom:** Firebase Auth login works but admin pages say "Not authorized."

**Diagnose:**

- `admins/{uid}` doc must exist.

**Fix:**

- Have another operator add you: `admins/{uid}` doc with `enabled: true, role: 'operator'`.
- If you're the only admin and locked out: Cloud Console → Firestore → manually add the doc (you need GCP access).

### D.2 Escalation reply failed

**Symptom:** Click "Send via bot" but the message doesn't arrive at the guest.

**Diagnose:**

- Cloud Logs for `botReplyToEscalation` Callable.
- Was CSW closed? Did the template path trigger?

**Fix:**

- If CSW is closed and the `escalation_followup` template isn't approved, the reply can't go through. Approve the template or wait for the guest to re-engage.
- Alternative: send via your personal WhatsApp directly.

### D.3 Broadcast composer audience count wrong

**Symptom:** Operator selects "All guests" and dashboard shows audience count of 0.

**Diagnose:**

- Filter logic in `audience.ts` is hitting the `botEnrolled: true` filter.
- All guests might have `botEnrolled` unset (not yet migrated).

**Fix:**

- Run migration: `npx ts-node functions/scripts/migrate-bot-enrollment.ts`.

---

## Section E — "Help, the wedding is in 4 hours"

### E.1 Bot down completely

**Triage:**

1. Settings → `enabled: false` (acts as confirmation it's at least reachable).
2. Set `enabled: true` again.
3. Send yourself a test message.
4. If still down: redeploy from a checked-out main branch.

**Fallback if you can't fix in 30 min:** put a banner on `bodaentarifa.com` saying "Si tienes preguntas urgentes, llámanos a +34 ..." and disable the bot. Manage manually for the day.

### E.2 Sending wrong info en masse

1. **Kill switch** immediately: `config/bot.enabled = false`.
2. Identify what's wrong (KB stale? template variable?).
3. Fix the data.
4. Send a `manual_announcement` correcting any guests who got the wrong info.
5. Re-enable.

### E.3 Spam / abuse

1. Identify the source phone.
2. Block via `guests/{phone}.botEnrolled = false`. Bot won't respond to them anymore.
3. Add to a manual blocklist if needed.

---

## Section F — Diagnostic queries

Useful Firestore queries when investigating:

```js
// Recent conversations sorted by activity
db.collection('bot_conversations')
  .orderBy('lastMessageAt', 'desc')
  .limit(20)
  .get()

// All open escalations
db.collection('bot_escalations')
  .where('status', '==', 'open')
  .orderBy('createdAt', 'asc')
  .get()

// Failed sends in last hour
db.collection('bot_send_log')
  .where('status', '==', 'failed')
  .where('sentAt', '>', new Date(Date.now() - 3600_000))
  .get()

// Unknown phones in last 24h, sorted by repeat count
db.collection('bot_unknown_inbound')
  .where('resolved', '==', false)
  .orderBy('count', 'desc')
  .get()

// All photos awaiting moderation
db.collection('feed_posts')
  .where('source', '==', 'whatsapp')
  .where('status', '==', 'pending_moderation')
  .orderBy('createdAt', 'desc')
  .get()

// Pending retries
db.collection('bot_outbound_pending')
  .where('nextAttemptAt', '<=', new Date())
  .get()
```

Cloud Logging queries (Cloud Console → Logging → Logs Explorer):

```
# All bot logs in last hour
resource.type="cloud_function"
resource.labels.function_name=~"bot|whatsapp"
timestamp >= "<TIMESTAMP_1H_AGO>"

# All errors
resource.labels.function_name=~"bot|whatsapp"
severity >= "ERROR"

# A specific request
labels.requestId="550e8400-e29b-41d4-a716-446655440000"

# All escalations created
jsonPayload.event="escalation_created"
```

---

## Section G — Last-resort recovery

If everything is broken and the wedding is imminent:

1. **Disable the bot.** Set `config/bot.enabled = false`. Bot stops responding.
2. **Send a manual broadcast** via the existing wedding website's contact channel (or via your personal WhatsApp to a few guests, asking them to spread the word): "El asistente de la boda no está disponible. Para preguntas urgentes: +34 [your number]."
3. **Field questions personally.** Frustrating but reliable.
4. **Take a deep breath.** The bot is a "nice to have." The wedding works without it.

The core wedding experience does not depend on the bot. Treat it as you would treat WiFi at the venue: when it works, great; when it doesn't, the party goes on.
