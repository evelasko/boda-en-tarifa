# Op-9 Runbook — Final Smoke Test from Primary SIM

> T-1 hardware-in-the-loop check. Send 10 representative messages from your personal WhatsApp to the production bot and confirm every one gets a sensible reply within 5s. Catches DNS, signing, secret rotation, and Meta-side issues that synthetic tests miss.
>
> **Date target**: T-1 in the event-optimization timeline (2026-05-28). **Owner**: solo operator. **Time**: ~20 min.
>
> Source: `event-optimization-operator-plan.md` §Op-9.

---

## Pre-flight (3 min)

### 0.1 Confirm Op-8 sign-off

```bash
# Adversarial findings: all open items resolved or explicitly wontfix
grep -A3 "^## Open findings" bot/docs/adversarial-findings.md
# Expect: "(none — populate during the Op-8 run)" OR every entry has a Resolution + Re-tested clean line.
```

If any open finding remains without a resolution → **do not proceed**. Patch + re-test first, then come back.

### 0.2 Confirm the bot is enabled

In Firebase Console → Firestore → `config/bot` → confirm `enabled: true` and `keep_warm_enabled: true`.

### 0.3 Confirm Op-7 keep-warm is still hitting cache

```bash
gcloud functions logs read botKeepKbWarm \
  --region=europe-west1 --project=boda-en-tarifa --gen2 --limit=5
```

Five most recent should be `bot.keepwarm.ok` with `cacheReadTokens` >> `cacheCreateTokens`. If not → fix per `keep-warm-sanity-check.md` first.

### 0.4 Open the tail-log window

In a side terminal:

```bash
gcloud functions logs read whatsappWebhook \
  --region=europe-west1 --project=boda-en-tarifa --gen2 --limit=50 \
  --format='value(timestamp,severity,jsonPayload.message)' \
  --freshness=5m
```

Re-run after each message you send so you can see latency + any warnings in near real-time.

### 0.5 Use your real personal WhatsApp

Op-9 is specifically about **your real consumer SIM** — the one Manuel and guests would WhatsApp from. Not the test SIM, not the emulator.

If you have multiple SIMs/devices, use the one most representative of a guest's experience.

---

## The 10 messages

Send them top-to-bottom with **~30s between sends** (so you can observe each reply cleanly and the rate-limit doesn't engage). Mark PASS / FAIL for each.

### Round 1 — core intents (ES)

| # | Send | Expected reply (within 5s) | Result |
|---|---|---|---|
| 1 | `¿a qué hora es la ceremonia el sábado?` | Bold time + venue name. Warm, concise. 🐾 likely. | ☐ PASS ☐ FAIL |
| 2 | `¿qué tiempo va a hacer el sábado?` | Real Tarifa weather snapshot from `get_current_weather`. Not a generic answer. | ☐ PASS ☐ FAIL |
| 3 | `¿dónde es el welcome dinner?` | Venue name + offers/sends a location pin (or pin arrives as separate message). | ☐ PASS ☐ FAIL |
| 4 | `¿cómo va mi RSVP?` | Current RSVP status. If `pending`, prompts the RSVP Flow. | ☐ PASS ☐ FAIL |

### Round 2 — core intents (EN)

| # | Send | Expected reply (within 5s) | Result |
|---|---|---|---|
| 5 | `can you put me down for a song request?` | Triggers `song_request` Flow. Flow card arrives. | ☐ PASS ☐ FAIL |
| 6 | `what's the dress code for Saturday?` | Specific dress-code answer pulled from KB. EN tone. | ☐ PASS ☐ FAIL |

### Round 3 — system commands

| # | Send | Expected reply (within 5s) | Result |
|---|---|---|---|
| 7 | `stop` | "Vale, me callo. Cualquier mensaje me reactiva 🐾" (or EN equivalent). `botEnrolled` flips to `false`. | ☐ PASS ☐ FAIL |
| 8 | `help` | List of capabilities + how to reach a human. Note: this re-enrolls you (any inbound reactivates per spec). | ☐ PASS ☐ FAIL |

### Round 4 — media

| # | Send | Expected reply (within 5s) | Result |
|---|---|---|---|
| 9 | A photo (any photo from your camera roll) | Thora acks the photo + tells you it goes to the album moderation queue. NO recognition (G3 dropped). Check `feed_posts/{auto}` in Firestore: a new doc appears with your guest id + `status: pending_moderation`. | ☐ PASS ☐ FAIL |
| 10 | A voice note (~5s, in ES: *"Hola Thora, soy yo, ¿cuándo llegamos al hotel?"*) | Whisper transcribes; Thora answers the transcribed question. May take 6–10s on first run as Whisper warms. | ☐ PASS ☐ FAIL |

### Bonus — persona check

| # | Send | Expected reply | Result |
|---|---|---|---|
| 11 | `eres una IA?` | Playful dodge ("soy la asistente digital de mis humanos 🐾"). NEVER "sí, soy una IA". | ☐ PASS ☐ FAIL |

---

## Watch-points during each reply

For every message above, also confirm:

- **Latency**: reply lands within ~5s for text, ~10s for the voice note (Whisper). If consistently slow, capture: which messages, what latencies, what time of day.
- **Tone**: on-character (Thora, dog persona, paw emoji used sparingly). No "As an AI assistant…". No corporate-speak.
- **Language**: replies match the language of your message; mid-conversation switch works.
- **No phantom messages**: each message gets exactly one reply (plus location/Flow if applicable). Two consecutive replies for one inbound = the double-reply bug Op-8 was supposed to catch.

---

## After all 10 messages

### Spot-check Firestore audit trail

In Firebase Console → Firestore → `bot_conversations/<your-phone>/messages`, sort by `timestamp` desc. You should see ~22 entries (10 inbounds + ~10 outbounds + Flow/photo side-effects). No orphan inbound without a paired outbound.

### Check Sentry

Open the Sentry project in the browser, filter to the last 30 min. **Zero new issues** is the bar.

### Verify the `stop` toggle reset

Because msg #8 (`help`) reactivates you, the final state should be `botEnrolled: true`. Confirm in `guests/<your-uid>`.

---

## Sign-off

| Check | Result |
|---|---|
| All 10 messages → PASS | ☐ |
| All replies <5s (voice note <10s) | ☐ |
| Audit trail: ~22 entries, no orphans | ☐ |
| Sentry: zero new issues in window | ☐ |
| Final `botEnrolled: true` | ☐ |

→ Op-9 **GREEN**. Proceed to Op-10.

---

## If anything fails

| Symptom | Likely cause | Action |
|---|---|---|
| Reply >10s (consistently) | Cache miss, cold instance, or Anthropic rate-limit | Check keep-warm logs (Op-7); check Cloud Functions instance count |
| No reply at all | Webhook returning 5xx, or Meta blocked the WABA | Check `gcloud functions logs read whatsappWebhook --gen2 --limit=20 --severity=ERROR`; check Meta Business Manager → WABA quality rating |
| Reply in wrong language | Language detection regression | Capture inbound text + outbound; ping implementer |
| Persona break / leak | Bug | Add to `adversarial-findings.md` immediately; **hold deploy freeze** |
| Photo not in `feed_posts` | Media pipeline / Cloudinary issue | Check `bot.media.*` logs; verify `CLOUDINARY_*` secrets |
| Voice note not transcribed | OpenAI Whisper key or quota | Check `bot.transcription.*` logs; verify `OPENAI_API_KEY` secret |
| Stop didn't toggle `botEnrolled` | Command handler regression | Capture log line `bot.command.stop`; ping implementer |

**Any blocker → hold the freeze.** Op-9 failing is the only legitimate reason to delay T-1 deploy lock. Better to push the wedding back 30 min than to lock in a broken stack.
