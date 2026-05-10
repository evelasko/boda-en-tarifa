# WhatsApp Bot — Admin Runbook (Operator)

> Your playbook for the wedding weekend. Read it once before launch, then keep it as a reference. Print or save offline.

This is for **Enrique** (and Manuel as backup). It assumes you're already set up per `bot/docs/setup-guide.md`.

## At a glance

| When | What you do |
|---|---|
| 7 days before | Send onboarding broadcast to all guests |
| 3 days before | Skim escalations once a day, answer anything stuck |
| Day-of, mornings | 5-minute scan over coffee |
| During events | Phone in pocket; bot self-runs; only react to high-urgency pings |
| Sunday 05:00 | Album reveal fires automatically — verify it landed |
| Day after | Send farewell template |
| 90 days after | Run decommission script |

You're aiming to **never** open the admin dashboard during the wedding itself. Everything below assumes that's the goal.

---

## 1. The admin dashboard

URL: `https://bodaentarifa.com/admin/bot` (or whatever the deployed Next.js URL is).

Login: same Firebase Auth as the existing wedding admin.

Layout:

| Page | Purpose |
|---|---|
| `/admin/bot` | Health dashboard — green/yellow/red status |
| `/admin/bot/conversations` | Recent guest threads |
| `/admin/bot/escalations` | Open escalations queue (⚠️ red badge if unread) |
| `/admin/bot/broadcasts` | Past broadcasts; create new |
| `/admin/bot/templates` | Approval status of each template |
| `/admin/bot/flows` | Approval status of each Flow |
| `/admin/bot/unknown-inbound` | Phones not on allowlist that messaged the bot |
| `/admin/bot/faq` | Add/edit FAQ entries (auto-incorporated into KB) |
| `/admin/bot/settings` | The kill switch + tunable config |

Pin the **escalations** page in your browser. It's the only one you'll touch reactively.

---

## 2. Pre-event: launch checklist (Day -7 to Day -1)

### Day -7 (around May 22)

**Onboarding broadcast** — the moment guests first hear from the bot.

1. Open `/admin/bot/broadcasts/new`.
2. Template: `welcome_onboarding`.
3. Audience: **All guests with `botEnrolled: true`** (filter by language separately if you want — the dashboard auto-segments based on each guest's `language` field).
4. Variables: `{{1}}` = first name (auto-filled per guest from `guests.firstName`).
5. Click **Dry Run** first. Review the 3-guest preview. Both ES and EN should look right.
6. Click **Send**. Watch the progress bar.
7. Within 10 minutes, ~80% should be delivered (green status icon). The remaining 20% deliver over the next hour.
8. Refresh `/admin/bot/escalations` 2-3 times in the first hour. Expect a small flurry of "this is new!" replies; bot should handle them.

**What you might see in the first 24h:**

- ~5–15 confused first responses ("¿quién eres?"). Bot handles them.
- 1–3 opt-outs ("stop"). Don't take it personally; the system records and won't message them again.
- 0–2 phones replying that aren't on the list (typo'd a contact). Check `/admin/bot/unknown-inbound` and either add them to the list or ignore.

### Day -6 to -3

Daily 10-minute review. Three places:

1. **Escalations queue** — answer anything blocking. See §4 for response patterns.
2. **Unknown inbound** — clear false positives, add legit ones to allowlist.
3. **FAQ page** — if the same question came up 3× from different guests, add an FAQ entry. KB updates automatically; bot will answer next time.

### Day -2 (May 27)

**Pre-event smoke test.**

1. Schedule a fake test event 5 minutes from now in the events Firestore (use the existing admin UI for events, or do it directly).
2. Verify the reminder template fires correctly to your phone.
3. Delete the fake event.
4. Trigger a content unlock dry-run if you want to be thorough.

Verify:

- Templates: all 22 show **Approved**.
- Flows: all 6 show **Published**.
- Quality rating: at least **Medium** with no warnings.
- Phone number: **Connected**.

### Day -1 (May 28)

**Album content review.**

The Sunday 05:00 reveal will publish whatever's in `feed_posts` with `status: approved`. Spend an hour:

1. Go to the existing photo moderation page.
2. Approve photos you want public.
3. Hide / reject anything that shouldn't be public.

You can also do this on Saturday — the cutoff is essentially Sunday 03:00 (give yourself 2h before reveal).

---

## 3. Event-day cadence (Friday 29 → Sunday 31)

### Mornings (8:00–9:00, ideally with coffee)

5 minutes:

1. Open `/admin/bot/escalations`. Address any open ones (typically 0–3).
2. Open `/admin/bot/conversations`. Skim the last 10. You're not reading every message; you're spot-checking that the bot sounds OK.
3. Glance at `/admin/bot`. All green = move on. Any yellow/red = see §6.

That's it. Close the laptop. Get married.

### During events

Don't carry the laptop. The bot has fired:

- 30-minute event reminders.
- Seating unlock at 18:00 Friday.
- Menu unlock at 12:00 Saturday.
- Daily morning weather brief.

If something high-urgency happens, you'll get a WhatsApp notification (configured in §5).

### Evenings (after the day's events)

Optional 5-min wrap:

1. Glance at moderation queue — any new photos to approve?
2. Glance at escalations — anything still open?
3. Sleep.

### Sunday 05:00 (May 31)

The bot fires `film_developed` automatically. **Verify, don't intervene.**

If you wake up at 9 and want to confirm:

1. Check your own phone — you should have received the template.
2. Tap "Ver el álbum" — verify it loads with photos.
3. If the album page shows zero photos, see §6 ("Album reveal failed").

### Sunday 12:00

Brunch reminder fires automatically.

---

## 4. How to handle escalations

When an escalation arrives, you'll see:

- Guest name + photo (if on file).
- Their language (ES / EN).
- The bot-written summary of what they need.
- Urgency tag (low / normal / high).
- Full conversation history.

### 4.1 The standard reply pattern

1. Click the escalation card.
2. Read the full thread (top to bottom).
3. Type your reply in the operator reply box. Write in the **guest's language**.
4. Click **Send via bot**.
5. The bot delivers it as: `*Enrique:* «your reply»`.
6. Mark **Resolved**.

If the guest is in their **24h CSW** (the indicator says "Open" with a green dot), your reply goes through as a normal session message — fast, free.

If the CSW is **closed** (red dot), the reply is sent via the `escalation_followup` template. This is automatic; you don't choose. The guest can re-open the conversation by replying.

### 4.2 Common escalation scenarios

**Schedule conflict / "I can't make Saturday":**
> Bot summary: María says she can't attend the ceremony due to a flight delay.
> Your reply: "Sin problema María, no te preocupes. Te guardamos sitio para el banquete si llegas. Mándame mensaje cuando aterrices. Un abrazo 💛"

**Plus-one negotiation:**
> Bot summary: Carlos asks if he can bring his new partner.
> Your reply: First decide. If yes: "Carlos, claro que sí. Avísame el nombre y la añado a la lista." If no: "Carlos, gracias por preguntar — el aforo ya está cerrado, pero estarás genial igual. Te quiero."

**"What's Manuel's number":**
> Bot already refused per privacy rules. The escalation is informational. Either:
> - Don't reply (mark as resolved with private note).
> - Reply manually: "El bot acertó — para temas urgentes mejor que me lo cuentes a mí, llego antes."

**Health / accessibility:**
> Bot summary: Tía Pilar mentions she'll have a wheelchair on Saturday.
> Your reply: "Tranquila Pilar, todo accesible. Ana del equipo te acompaña al llegar — te mando su número aparte. Un beso."
> Then: actually send Ana's number through the bot or directly.

**Anger / complaint:**
> Bot summary: A guest is upset about not being seated next to their cousin.
> Your reply: pick up the phone. Some things shouldn't go through the bot.

### 4.3 When NOT to reply

- The bot answered correctly and the user just kept chatting. (You'll see this — the escalation is informational, not actionable. Mark resolved.)
- The user is being aggressive or testing the bot. Mark resolved with note "spam" — bot continues to handle them politely.
- The user thanked the bot ("muchas gracias!") — no reply needed.

### 4.4 Mass replies

If 5 guests ask the same thing in a row, **don't reply 5 times**. Instead:

1. Go to `/admin/bot/faq/new`.
2. Add an FAQ entry covering the question.
3. Save. KB rebuilds in <30 seconds.
4. Mark all 5 escalations resolved (the bot is now equipped to answer if they ask again).

For especially common asks, send a **manual_announcement** broadcast clarifying ("Recordatorio: el cóctel post-ceremonia es en el mismo sitio, no os mováis").

---

## 5. Notifications (so you don't have to watch the dashboard)

Set up Firebase Cloud Logging alerts (Cloud Console → Logging → Alerts):

| Alert | Condition | Notify |
|---|---|---|
| **High-urgency escalation** | `bot_escalations` doc created with `urgency: high` | Email + WhatsApp to Enrique |
| **Quality rating drop** | `phone_number_quality_update` event with `quality < HIGH` | Email |
| **Webhook 5xx** | Function error rate > 5/min | Email |
| **Bot disabled** | `config/bot.enabled` flips to false | Email |
| **Daily summary** | Scheduled 22:00 each event day | Email |

Daily summary email format:

```
Subject: Bot — resumen del día (29 May)

Inbound: 247 messages from 89 unique guests
Replies sent: 230 conversational, 12 escalated, 5 refused
Photos received: 67 (54 approved, 13 pending)
Templates sent: 145 (94 reminders, 51 manual)
Quality rating: HIGH (no changes)
Estimated cost today: €18.40
Open escalations: 2 (oldest: 38 min)

Links:
- Open escalations: https://bodaentarifa.com/admin/bot/escalations
- Daily logs: https://console.cloud.google.com/...
```

---

## 6. Common problems and fixes

### "The bot stopped responding"

1. Check `/admin/bot` — look for red status.
2. Most likely: kill switch on. Settings → toggle `enabled: true`.
3. If `enabled: true` and still silent: Anthropic outage (banner will say so) → wait.
4. If neither: Cloud Functions error → check logs, or call Manuel/implementer.

### "Bot is saying weird things"

1. Open `/admin/bot/conversations` and view the offending thread.
2. If it's a hallucination (made up a fact): screenshot, mark as a bug, add an FAQ correcting the issue, the bot will answer correctly going forward.
3. If it's tone-off but factually right: tolerable for the wedding window. Note for post-mortem.
4. If it's revealing private info: **immediately** flip the kill switch (`enabled: false`) and call the implementer.

### "Album reveal failed"

If at 05:30 Sunday the album page is empty or the template didn't fire:

1. Check `bot_send_log` for `film_developed` entries — did the function run?
2. If not, manually trigger it from `/admin/bot/broadcasts/new` — pick `film_developed` template, audience: all, send.
3. If the album page is empty but `feed_posts` has approved entries, check `config/album.public` — should be `true`. Set manually if not.
4. If utterly broken: send a manual broadcast pointing to a Cloudinary public folder URL as fallback.

### "Templates rejected"

Pre-event you should have caught this. Mid-event, if Meta rejects a template you're trying to use:

1. Use a `manual_announcement` template instead — text-only, generic.
2. Don't try to re-submit a rejected template during the wedding.

### "Too many escalations"

If you're getting >20/hour:

1. Settings page → `escalation.urgencyThresholds.normal.responseMinutesGoal` → bump higher to reduce auto-escalations.
2. Or: edit the system prompt's escalation section to be more conservative. (Implementer can do this in 5 min.)
3. Or: triage by adding a helper to the `admins` collection — they share the load.

### "Guest says they didn't get a message"

1. Search `bot_send_log` for the guest's phone.
2. Status check:
   - `sent` only → Meta accepted but not delivered yet.
   - `delivered` → it landed; user hasn't opened.
   - `read` → they opened it.
   - `failed` → see the error reason. Most common: invalid phone number; user blocked the bot.
3. Reply directly via your own WhatsApp if needed.

### "Quality rating dropped"

Meta dropped you from HIGH to MEDIUM (or worse). Causes:

1. Too many marketing-style messages. (You shouldn't have any.)
2. Several users blocking or reporting the bot.
3. Sending templates outside their declared category.

Recovery:

1. Pause non-essential broadcasts.
2. Wait 24h — usually self-corrects.
3. If MEDIUM persists, contact Meta support via Business Manager.

---

## 7. Manual sends (when you need to reach guests directly)

Sometimes you'll want to message all guests with something the bot doesn't cover. Examples:

- Last-minute logistics change ("the welcome dinner moved 200m up the beach due to wind")
- A heartfelt message
- A clarification that supersedes a faulty bot answer

**Procedure:**

1. `/admin/bot/broadcasts/new`
2. Template: `manual_announcement`
3. `{{1}}` = your message text (≤300 chars)
4. Audience: as needed
5. Dry run → review → send

For a really personal touch, **don't use the bot.** Send from your own WhatsApp to specific guests.

---

## 8. Monitoring during the event

Optional setup if you want at-a-glance visibility:

- Pin `/admin/bot` on a tablet at home base / hotel desk. Auto-refresh every 30s.
- Mute Slack / Email alerts EXCEPT high-urgency escalations.
- Manuel as backup operator: he can handle escalations if you're unreachable.

---

## 9. Day-after (June 1)

- 12:00 — `feedback_request` template fires automatically.
- 14:00 — Send `farewell_thanks` manually:
  1. `/admin/bot/broadcasts/new`
  2. Template: `farewell_thanks`
  3. Audience: all.
  4. Send.
- Skim feedback over the next week.

---

## 10. Decommissioning (90 days post-wedding)

Around 2026-08-31:

1. Run the script: `cd functions && npx ts-node scripts/decommission-bot.ts --confirm`.
2. The script will:
   - Send a final farewell template to remaining `botEnrolled: true` guests.
   - Bulk-delete `bot_conversations/*` messages (keeping aggregates).
   - Anonymize remaining bot collections.
   - Delete approved templates from Meta.
3. Optionally release the WABA phone number.
4. Anthropic key: regenerate or delete.

---

## 11. Emergency contacts

| Issue | Contact |
|---|---|
| Bot misbehaving urgently | Implementer (your engineer/agent) |
| Meta WhatsApp issue | Meta Business support via Business Manager → Help |
| Anthropic outage | Anthropic status page; usually resolves quickly |
| Firebase outage | Google Cloud status page |
| Manuel can't help | Backup operator (designate by Day -7) |

---

## 12. Sanity-check before any broadcast

Always:

- [ ] Right template?
- [ ] Right audience?
- [ ] Right variables (no `{{undefined}}`)?
- [ ] Did dry run look correct?
- [ ] Time of day reasonable (not 03:00)?
- [ ] Will guests in two timezones get it at sensible times?

Better to delay 10 min and double-check than to spam 150 people with `Hola undefined`.

---

## 13. Final note

The bot is a tool to keep you free during the wedding, not a system that needs your attention. Trust it. Address things asynchronously. Don't perform digital wedding-coordination at your own wedding.

When in doubt:

- Kill switch: `config/bot.enabled = false`. You can always handle the rest manually with phone calls.
- Bot disabled is fine. Stressed bride/grooms is not.
