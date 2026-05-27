# Op-8 Observability Cheat Sheet

> Exact commands + console queries to run **alongside** the load harness so you can spot races, leaks, and exceptions in real time.
>
> Open in a separate window from where you're running `op8-load-harness.mjs`.
>
> **Project**: `boda-en-tarifa` · **Region**: `europe-west1`

---

## Before the load run

Note the wall-clock time you start the load harness. Most queries below filter by a time window.

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
# example output: 2026-05-26T14:30:00Z
```

Call this `T_START`. Most queries below take a `--freshness=15m` window — adjust if your run is longer.

---

## 1. Webhook health (Cloud Logging)

### 1.1 Watch for processing errors

This is the **most important** stream during the run. Zero entries = green.

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="whatsappwebhook"
   AND jsonPayload.message="bot.webhook.processing_error"' \
  --project=boda-en-tarifa --freshness=15m \
  --format='value(timestamp,jsonPayload.kind,jsonPayload.err)'
```

If anything appears: **stop the load run**, capture the output, ping the implementer.

### 1.2 Watch for HMAC rejection (should be zero — every request is signed)

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="whatsappwebhook"
   AND jsonPayload.message=~"bot\.webhook\..*reject"' \
  --project=boda-en-tarifa --freshness=15m
```

### 1.3 Per-turn latency sample (Claude pipeline)

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="whatsappwebhook"
   AND jsonPayload.message="bot.claude.pipeline.ok"' \
  --project=boda-en-tarifa --freshness=15m --limit=50 \
  --format='value(jsonPayload.ms,jsonPayload.cachedReadTokens,jsonPayload.inputTokens)'
```

Sanity: most rows should show `cachedReadTokens` close to `inputTokens` — meaning the system prompt is being served from cache. A flurry of cache misses during the run = something is busting the cache.

---

## 2. Dedupe uniqueness (Firestore)

The harness fires each request with a unique `wamid.op8.{guest}.{uuid}` message id. We expect one `bot_dedupe` document per `messageId`, no duplicates.

### 2.1 Count Op-8 dedupe docs since T_START

In Firebase Console → Firestore → `bot_dedupe` collection, sort by `createdAt` desc and visually scan for the `op8.` prefix. Or with gcloud:

```bash
# Count via a one-shot script. Replace T_START with your start time.
cat <<'EOF' | node --input-type=module
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault() });
const T_START = new Date('REPLACE_ME_2026-05-26T14:30:00Z');
const snap = await getFirestore().collection('bot_dedupe')
  .where('createdAt', '>=', Timestamp.fromDate(T_START))
  .get();
const op8 = snap.docs.filter(d => d.id.startsWith('wamid.op8.'));
console.log(`bot_dedupe entries since T_START: ${snap.size}`);
console.log(`op8-prefixed: ${op8.length}`);
const byMsg = new Map();
for (const d of op8) byMsg.set(d.id, (byMsg.get(d.id) ?? 0) + 1);
const dupes = [...byMsg.entries()].filter(([_, c]) => c > 1);
console.log(`duplicate message ids: ${dupes.length} (must be 0)`);
if (dupes.length) console.log(dupes.slice(0,5));
EOF
```

**Pass criteria**: duplicate message ids = 0. (Each Meta message id should appear exactly once.)

---

## 3. Audit-trail correctness (Firestore)

For each test phone the harness drove, we expect: roughly 1 inbound entry + 1 outbound entry per turn fired, with no orphan inbound (an inbound followed by no outbound).

### 3.1 Spot-check one test phone's conversation

```bash
# Replace with one of the seeded phones, e.g. +34900000100
PHONE='+34900000100'
gcloud firestore documents list \
  "projects/boda-en-tarifa/databases/(default)/documents/bot_conversations/${PHONE}/messages" \
  --project=boda-en-tarifa --limit=30
```

Or in the Firebase Console: navigate to `bot_conversations/+34900000100/messages`, sort by `timestamp` desc. You should see an alternating in/out pattern. **Two consecutive `direction: outbound` for the same inbound message id = a double-reply bug.**

### 3.2 Double-reply check across all 15 phones

```bash
cat <<'EOF' | node --input-type=module
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault() });
const phones = Array.from({length: 15}, (_, i) =>
  `+34900000${String(100 + i).padStart(3, '0')}`);
let doublesTotal = 0;
for (const phone of phones) {
  const snap = await getFirestore()
    .collection('bot_conversations').doc(phone)
    .collection('messages')
    .orderBy('timestamp', 'asc').get();
  // Count: for each inbound, how many outbounds reference its messageId.
  const replies = new Map();
  for (const d of snap.docs) {
    const data = d.data();
    if (data.direction === 'outbound' && data.replyToMessageId) {
      replies.set(data.replyToMessageId,
        (replies.get(data.replyToMessageId) ?? 0) + 1);
    }
  }
  const doubles = [...replies.entries()].filter(([_, c]) => c > 1);
  if (doubles.length) {
    console.log(`${phone}: ${doubles.length} double-reply(ies)`);
    doublesTotal += doubles.length;
  }
}
console.log(`\nTotal double-replies across all phones: ${doublesTotal} (must be 0)`);
EOF
```

**Pass criteria**: total double-replies = 0.

---

## 4. Rate-limit behavior (informational)

The harness fires one turn per phone per ~30s — well below any sane rate limit. So `bot.ratelimit.throttled` should appear **zero** times during the run.

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="whatsappwebhook"
   AND jsonPayload.message="bot.ratelimit.throttled"' \
  --project=boda-en-tarifa --freshness=15m
```

If you see throttles: rate-limit window is mis-tuned. Investigate but don't block on it for the wedding (it's defensive, not load-bearing).

---

## 5. Sentry (exceptions)

Open the Sentry project (DSN from `event-optimization-operator-plan.md` §Op-4) in the browser. Filter by:

- **Project**: bot
- **Environment**: production
- **Last**: 15 minutes
- **Issue type**: Unresolved

**Pass criteria**: zero new Sentry issues created during the run window.

If a new issue appears: copy its short-id, paste into `bot/docs/adversarial-findings.md` under "Load test findings", and triage with the implementer.

---

## 6. Outbound send failures (expected, but bounded)

The 15 synthetic test phones (`+34 900 000 1xx`) are not real Meta-routable numbers. Meta will reject the outbound send with an error code. These should appear in `bot_send_log` and in the function logs as warnings, NOT as errors.

```bash
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="whatsappwebhook"
   AND jsonPayload.message=~"bot\.whatsapp\.send.*"' \
  --project=boda-en-tarifa --freshness=15m --limit=30 \
  --format='value(severity,jsonPayload.message,jsonPayload.metaError)'
```

**Expected**: each successful turn produces one log line; rejected sends carry a Meta error code (often `131030 "phone number not in allowed list"` for unverified numbers on test tier — harmless). **Unexpected**: 5xx from Meta, or repeated identical send retries for the same outbound id (would indicate a retry-loop bug).

If you see Meta quality-rating warnings — pause everything and check `event-optimization-operator-plan.md` §Op-3 (backup SIM).

---

## 7. Cache hit rate (sanity reuse of the keep-warm check)

During the load run, the keep-warm pings continue every minute. Cache hits on live turns should remain high. Quick check:

```bash
gcloud functions logs read whatsappWebhook \
  --region=europe-west1 --project=boda-en-tarifa --gen2 --limit=50 \
  | grep "bot.claude.pipeline.ok" \
  | grep -oE '"cachedReadTokens":[0-9]+,"inputTokens":[0-9]+' \
  | head -20
```

Eyeball ratio: in each row, `cachedReadTokens` should be close to `inputTokens` (≥90%). If it drops below 70% during the run, the load is busting the cache somehow — capture and report.

---

## Quick pass/fail dashboard

After the run, fill this in:

| Check | Target | Observed | ✓/✗ |
|---|---|---|---|
| `bot.webhook.processing_error` count | 0 | | |
| `bot.claude.pipeline.ok` p50 latency | <3000 ms | | |
| `bot.claude.pipeline.ok` p95 latency | <8000 ms | | |
| Duplicate `bot_dedupe` message ids | 0 | | |
| Double-reply count across all phones | 0 | | |
| `bot.ratelimit.throttled` count | 0 | | |
| Sentry new issues during window | 0 | | |
| Cache hit rate (cachedReadTokens / inputTokens) | >0.90 | | |
| Meta send 5xx | 0 | | |

If all green → Op-8 §Load portion is signed off. Move to the adversarial portion.
