# Op-10 Runbook — Lock the Deploy, Configure Pager

> T-1 freeze. Tag the verified commit, freeze the production stack at it, and confirm Sentry alerts route to your phone — even in Do-Not-Disturb. After Op-10 the bot is in **observe-only mode** through the event window.
>
> **Date target**: T-1 (2026-05-28), immediately after Op-9 sign-off. **Owner**: solo operator. **Time**: ~15 min.
>
> Source: `event-optimization-operator-plan.md` §Op-10.

---

## Pre-flight (2 min)

### 0.1 Op-9 must be GREEN

```bash
# Confirm op-9 sign-off checkboxes are all ticked (visual check).
open bot/docs/op9-runbook.md
```

If Op-9 has any FAIL → do NOT proceed. Op-10 locks in whatever state Op-9 just blessed.

### 0.2 Working tree must be clean

```bash
git status
```

If you have uncommitted changes that you do NOT want in the wedding build: stash or revert. If you have uncommitted changes that you DO want shipped: commit them, redeploy, re-run Op-9. (Yes, that means another 20 min — non-negotiable. The thing you tag must be the thing you smoke-tested.)

### 0.3 Confirm the deployed revision matches HEAD

```bash
# Local HEAD:
git rev-parse --short HEAD

# Deployed revision tag (Gen2 functions carry the K_REVISION env var):
gcloud run services describe whatsappwebhook \
  --region=europe-west1 --project=boda-en-tarifa \
  --format='value(status.latestReadyRevisionName)'
```

These don't share an identifier scheme, but the **deploy timestamp** should match your most recent `firebase deploy`. If you can't remember when you last deployed, redeploy now (`firebase deploy --only functions --project boda-en-tarifa`), then re-run Op-9.

---

## Step 1 — Tag the verified commit (2 min)

```bash
git tag wedding-prod-2026-05-28
git push origin wedding-prod-2026-05-28
```

The tag is human-readable shorthand for "this is the exact code running during the wedding." It's load-bearing in two ways:
1. **Post-mortem**: any debugging you do during/after the event starts from this tag.
2. **Rollback path**: if something is accidentally deployed during the freeze, `git checkout wedding-prod-2026-05-28 && firebase deploy` returns to a known-good state in one command.

Confirm:

```bash
git tag --list "wedding-prod-*"
git push origin --tags  # idempotent — re-push to be sure
```

---

## Step 2 — Configure your phone for Sentry alerts in DND (5 min)

The wedding doesn't take Saturday night off. You need Sentry pages to break through Do-Not-Disturb.

### 2.1 Confirm Sentry's notification rules are aimed at you

In the browser, open the Sentry project → **Settings → Alerts → Rules**. Confirm there's at least one rule that:

- Fires on **"A new issue is created"** OR **"An issue is seen more than N times in M minutes"**.
- Notifies via **Email** (your email) — and/or **Slack/SMS/PagerDuty** if you've wired them.

If there's no rule yet: create one now. Minimal viable rule:
- **When**: "A new issue is created"
- **Filter**: `environment equals prod`
- **Action**: "Send a notification via Mail to <your email>"

### 2.2 Configure your phone to bypass DND for that channel

| Platform | What to do |
|---|---|
| **iOS** | Settings → Focus → Do Not Disturb → People → Allow Notifications From → add Sentry's sender email (or the Slack/PagerDuty app). Also: Allow Notifications From Apps → add Mail + Slack + whichever messenger. |
| **Android** | Settings → Sound & vibration → Do Not Disturb → Apps → add Mail/Slack/etc. as exceptions. |
| **macOS desktop** (if you're carrying a laptop) | System Settings → Focus → Do Not Disturb → Allowed Notifications → add Mail. |

If you use **PagerDuty / Opsgenie**, those apps usually have their own "critical alert" path that bypasses DND by default — just confirm the routing inside the app.

### 2.3 If you have a backup operator (Manuel?) — wire them too

In Sentry → Settings → Teams (or Alerts → Rules → add another notification recipient): add Manuel's email. Two phones is two chances of the page being seen.

---

## Step 3 — Pager test (5 min)

Confirm the routing end-to-end: a real exception → Sentry → your phone alert → you actually feel/hear it.

### Path A (Recommended) — Sentry's built-in test event

This bypasses Cloud Functions entirely. Tests the DSN → Sentry → alert rule → phone path, which is the part that matters at 3am.

1. Sentry → **Settings → Client Keys (DSN)** → find the active DSN.
2. Click **"Send a test event"** (the button is usually right next to the DSN listing).
3. Within ~60s: an alert should land in Sentry's Issues stream tagged as test/sample.
4. The notification rule fires → email/Slack/SMS hits your phone.
5. **Put your phone in DND** (toggle it on briefly) and re-send the test event from the same Sentry UI button. Confirm the alert still breaks through.

### Path B (Optional, more realistic) — trigger via the deployed function

Only do this if Path A succeeded but you want extra confidence the function-level path works too.

Send a deliberately malformed inbound that the webhook will catch + report:

```bash
# Sign a payload with an obviously wrong secret so HMAC verify fails;
# this lands as a `bot.webhook.signature_rejected` log line and (if the
# code path captures it) a Sentry event.
WHATSAPP_APP_SECRET=wrong-secret-on-purpose \
  npx tsx functions/scripts/simulate-webhook.ts \
  --url https://europe-west1-boda-en-tarifa.cloudfunctions.net/whatsappWebhook
```

Expect: 401 from the webhook. Sentry may or may not capture this (HMAC rejection is usually a clean refusal, not an exception). If you want to provoke a real exception, you'd need to ship a temporary `/health/throw` endpoint — **not worth doing during freeze**. Stick with Path A.

### Verification

After the test event fires:

- [ ] Sentry Issues stream shows the test event within 60s
- [ ] Email/Slack/SMS notification reaches your phone
- [ ] Phone in DND mode: alert STILL breaks through
- [ ] Backup operator (if configured) also received it

If any of these fail → fix the alert routing now. **Do not skip this** — the difference between a 5-min issue and a 5-hour issue at the wedding is whether the page reaches you.

---

## Step 4 — Document the freeze (1 min)

Append a one-line note at the top of `event-optimization-operator-plan.md` (or wherever your runbook landing page is) marking the freeze:

> **FROZEN at `wedding-prod-2026-05-28` on YYYY-MM-DD HH:MM by <operator>. No deploys until 2026-06-01 unless an actively-broken issue forces a hotfix.**

This is a contract, not a technical lock — there's nothing preventing `firebase deploy` from running. The contract exists so that you, future-you on Sunday morning, don't "just fix this small thing" and silently break the warm-instance pool.

---

## Sign-off

| Check | Result |
|---|---|
| Op-9 was GREEN before starting Op-10 | ☐ |
| Working tree clean; HEAD = deployed revision | ☐ |
| `wedding-prod-2026-05-28` tag exists locally + pushed to origin | ☐ |
| Sentry alert rule active, targets my email/Slack | ☐ |
| Phone configured to bypass DND for Sentry channel | ☐ |
| Pager test (Path A) succeeded — alert reached phone | ☐ |
| Pager test repeated with DND ON — alert still broke through | ☐ |
| Backup operator (if any) wired and tested | ☐ |
| Freeze note added to operator plan | ☐ |

→ Op-10 **COMPLETE**. Bot is now in **observe-only mode** for the event window.

---

## Things to NOT do during the freeze

Defensive contract for the next ~10 days (from `event-optimization-operator-plan.md` §"Things to NOT do"):

- **Do not deploy code changes** unless something is actively broken on guests.
- **Do not edit YAML KB files** during event days. Every change bumps `bot_kb_version` and busts cache. If a last-minute fact change is unavoidable, make it on T-1 evening at the latest so caches re-warm overnight.
- **Do not "just disable that one keep-warm function for a minute"** — re-cold-starting Anthropic's 1h cache is a 60-min recovery, not a 60-second one.
- **Do not push to `main`** without flagging in the freeze note. If a hotfix is genuinely needed, deploy from a branch and tag the new revision (`wedding-prod-2026-05-DD-hotfix-N`).

---

## If you need to hotfix during the event

1. Decide it's worth it. The bar is: *"a guest is actively unable to use the bot OR Thora is saying something that embarrasses the couple."*
2. Branch from `wedding-prod-2026-05-28`: `git checkout -b hotfix-XXX wedding-prod-2026-05-28`.
3. Make the minimal possible change. No refactors. No "while we're at it".
4. Test on the emulator if at all possible.
5. Deploy: `firebase deploy --only functions:whatsappWebhook --project boda-en-tarifa`.
6. New tag: `git tag wedding-prod-2026-05-DD-hotfix-N && git push --tags`.
7. Update the freeze note with the new tag and the reason.
8. Run an abbreviated Op-9 (3 messages instead of 10) from your phone to confirm the hotfix didn't break the happy path.

If you can't follow steps 1–8 calmly, the right call is usually **kill switch** instead: `config/bot.enabled = false` in Firestore. Bot stops replying within ~10s. Guests message a human directly. Re-enable when fixed.
