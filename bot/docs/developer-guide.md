# WhatsApp Bot — Developer Guide

> Conventions, local development, testing, and deployment for the bot subsystem. Optimized for an LLM implementer who has read the spec docs in `bot/specs/`.

## 1. Repository layout

```
bot/                              # specs and docs (this folder)
  specs/                          # design contracts — read first
  docs/                           # operational + dev guides

functions/                        # Firebase Cloud Functions runtime
  src/
    bot/                          # NEW — the bot code goes here
      index.ts                    # exports webhook + scheduled funcs
      webhook/
      handlers/
      claude/
      services/
      whatsapp/
      conversation/
      broadcast/
      scheduled/
      lib/
    auth/                         # existing
    camera/                       # existing
    config/                       # existing
    notifications/                # existing — bot/scheduled/ supersedes parts of this
    index.ts                      # extend exports to include bot
  test/
    bot/                          # NEW — unit + integration + eval
  package.json
  tsconfig.json

web/                              # Next.js admin (existing) + new bot pages
  src/app/admin/bot/              # NEW

firebase/                         # existing — extend rules + indexes
  firestore.rules
  firestore.indexes.json
  remoteconfig.template.json

scripts/                          # repo-level scripts (existing)
prompts/                          # repo-level (existing)
```

## 2. Conventions

### 2.1 TypeScript

- Strict mode (`"strict": true` in tsconfig). Already configured in existing functions tsconfig.
- No `any` except in third-party shim layers. Use `unknown` and narrow.
- All cross-module function signatures use named arg objects: `fn({ to, body })` not `fn(to, body)`.
- Prefer `interface` for data shapes that participate in DI; `type` for unions and aliases.
- All public functions in `services/` have JSDoc with one-line purpose only (no over-commenting).

### 2.2 Naming

- Files: `kebab-case.ts` for utilities, `camelCase.ts` for functions/handlers (matches existing functions code style).
- Functions: `camelCase`.
- Types/interfaces: `PascalCase`.
- Firestore doc keys: `lower_snake_case` (already convention in repo).
- Phone numbers: variable named `phone` is always E.164 with `+`. Anything else has explicit prefix: `rawPhone`, `metaWaId` (Meta uses no `+`).

### 2.3 Errors

- Throw typed errors: `class BotError extends Error { code: string }`.
- Codes follow `bot/<domain>/<symptom>`: e.g., `bot/whatsapp/send_failed`, `bot/claude/timeout`.
- Webhook handler catches all and returns 200 anyway (see `03-architecture.md` §6.5).
- Callable functions throw `functions.https.HttpsError` with appropriate codes.

### 2.4 Validation

- Every Firestore write goes through Zod. Schemas live in `bot/lib/validation.ts`.
- Every external input (Meta payload, Flow submission, Callable args) is validated at the entry point.
- Use Zod's `.parse()` to throw on invalid; `.safeParse()` only when failure is expected.

### 2.5 Logging

- Use Cloud Logging (`firebase-functions/logger` already imported elsewhere).
- Structured logs: `logger.info('event', {requestId, phone: maskPhone(p), ...})`.
- Always include `requestId`. Generate at webhook entry, propagate through.
- Phone redaction: `maskPhone('+34612345678') === '+34••••••678'`. Helper in `bot/lib/phone.ts`.
- Never log full message bodies, full prompts, or secrets.

### 2.6 Time

- Always use `Europe/Madrid` for user-facing formatting.
- Always use `Date` or Firestore `Timestamp` for storage; never strings.
- Helper: `bot/lib/time.ts` exports `formatES(date)`, `formatEN(date)`, `inMadrid(date)`.

## 3. Local development

### 3.1 Prerequisites

- Node 24 (matches `functions/package.json` engines).
- Firebase CLI: `npm install -g firebase-tools`.
- Java 17+ (Firebase emulators need it).
- Logged into the right project: `firebase use boda-tarifa-dev`.

### 3.2 Install

```bash
cd functions
npm install
```

New dependencies needed:

```bash
npm install @anthropic-ai/sdk axios zod nanoid
npm install -D ts-node @types/node
```

### 3.3 Run the emulator

```bash
cd functions
npm run build:watch    # in one terminal
firebase emulators:start --only functions,firestore,auth   # in another
```

### 3.4 Simulating webhook calls

The Meta webhook is hard to hit locally without ngrok. Use the simulator script:

```bash
# Send a fake inbound text
npx ts-node functions/scripts/simulate-webhook.ts text \
  --phone +34612345678 --body "¿a qué hora es la ceremonia?"

# Send a fake inbound photo
npx ts-node functions/scripts/simulate-webhook.ts image \
  --phone +34612345678 --media-id 1234567

# Send a fake Flow submission
npx ts-node functions/scripts/simulate-webhook.ts flow \
  --phone +34612345678 --flow rsvp_full --payload @./test/fixtures/rsvp_es.json
```

The script POSTs to the local emulator endpoint with a valid HMAC signature using the dev `WHATSAPP_APP_SECRET`.

### 3.5 Testing the live Meta integration

For real end-to-end testing with the test number:

1. Run `firebase emulators:start` won't work — Meta can't reach your laptop.
2. Deploy to the dev project: `firebase deploy --only functions:whatsappWebhook --project boda-tarifa-dev`.
3. Configure Meta to point to the dev URL.
4. Send messages from a test recipient phone (added in Step 12 of setup).

OR use ngrok for a quick local round-trip:

```bash
ngrok http 5001    # forwards to Firebase emulator default port
# Set Meta webhook URL to the ngrok forwarding URL.
# Note: rotate ngrok URL on every restart.
```

## 4. Testing

### 4.1 Unit tests

```bash
cd functions
npm test                   # runs jest with the dev config
```

Test files live in `functions/test/bot/` mirroring the source structure.

Coverage targets:

- `bot/services/` — 90%+
- `bot/whatsapp/` — 80%+
- `bot/claude/pipeline.ts` — 70%+ (integration territory)
- `bot/handlers/` — 70%+
- `bot/lib/` — 90%+

### 4.2 Integration tests

```bash
npm run test:integration
```

Uses Firebase emulator + recorded fixtures. Tests:

- Webhook → handler → Firestore writes.
- Scheduled function tick → idempotent send.
- Flow submission → Firestore RSVP record.

### 4.3 Conversation evals

```bash
RUN_LIVE_EVALS=1 ANTHROPIC_API_KEY=sk-... npm run eval
```

This calls real Anthropic with the full system prompt and runs the 25 evaluation cases. Cost: ~€0.30 per run.

Run before merging any change to:

- `bot/claude/system-prompt.ts`
- `bot/claude/kb.ts`
- `bot/claude/tools.ts`
- Any FAQ / events / venues content

The harness rubric is itself Claude (Haiku 4.5) — it judges whether the response matches the spec. False negatives are reviewed manually; false positives ideally don't happen because the rubric is strict.

### 4.4 Manual smoke test

Daily during implementation:

1. Send a test phone a "hola".
2. Get an English speaker to send "hi".
3. Try one schedule question, one venue question, one off-topic question.
4. Try the stop command.
5. Check the admin dashboard reflects everything.

Should take 5 minutes.

## 5. Deployment

### 5.1 Dev → staging → prod

Three Firebase projects:

| Project | Purpose | Phone | Anthropic key |
|---|---|---|---|
| `boda-tarifa-dev` | Local + emulator + ngrok | Meta test number | dev key |
| `boda-tarifa-staging` | Pre-prod with real WABA | dev WABA | dev key (lower cap) |
| `boda-tarifa-prod` | Live wedding | prod WABA | prod key |

Deploy:

```bash
firebase use boda-tarifa-staging
cd functions
npm run build
firebase deploy --only functions
firebase deploy --only firestore:rules,firestore:indexes
```

Production: same with `firebase use boda-tarifa-prod`. Always deploy staging first, smoke test, then prod.

### 5.2 What to deploy

Each phase of the implementation plan adds new functions. Use `--only functions:<name>` to deploy incrementally:

```bash
# Phase 1
firebase deploy --only functions:whatsappWebhook

# Phase 5 (scheduled functions)
firebase deploy --only functions:botEventReminderTick,functions:botKeepKbWarm
```

### 5.3 Rollback

If a deploy breaks production:

```bash
firebase functions:list                # see versions
firebase functions:rollback whatsappWebhook --project boda-tarifa-prod
```

The kill switch (`config/bot.enabled = false`) is a quicker mitigation than rollback for runtime issues.

### 5.4 Secrets bind

Any function that uses a secret must declare it in its definition:

```ts
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const WHATSAPP_ACCESS_TOKEN = defineSecret('WHATSAPP_ACCESS_TOKEN');
const WHATSAPP_APP_SECRET = defineSecret('WHATSAPP_APP_SECRET');

export const whatsappWebhook = onRequest({
  region: 'europe-west1',
  secrets: [WHATSAPP_ACCESS_TOKEN, WHATSAPP_APP_SECRET, /* ... */],
  memory: '1GiB',
  timeoutSeconds: 60,
  minInstances: 0,    // bumped to 5 during event window via Remote Config
  maxInstances: 50,
  invoker: 'public',
}, async (req, res) => { /* ... */ });
```

## 6. Code patterns

### 6.1 Webhook handler skeleton

```ts
export const whatsappWebhook = onRequest({...}, async (req, res) => {
  const requestId = crypto.randomUUID();
  const log = createLogger({ requestId, function: 'whatsappWebhook' });

  if (req.method === 'GET') {
    return handleHandshake(req, res, log);
  }

  // Always 200 within 10s
  try {
    const rawBody = req.rawBody.toString('utf8');
    const sig = req.get('x-hub-signature-256') ?? '';
    if (!verifySignature(rawBody, sig, WHATSAPP_APP_SECRET.value())) {
      log.warn('signature_failed');
      res.status(401).send('Unauthorized');
      return;
    }
    res.status(200).send('OK');   // ack first, process async

    // Fire-and-forget background processing
    await processWebhookEvent(JSON.parse(rawBody), { requestId, log });
  } catch (err) {
    log.error('webhook_failed', { err });
    res.status(200).send('OK');   // never let Meta retry due to our bug
  }
});
```

Note: in Cloud Functions Gen2 with `onRequest`, async work after `res.send()` is not guaranteed to complete. Either use `res.write()` with `setImmediate` carefully, OR (preferred) do a *synchronous* Firestore write of a "pending" record and fan out to a 2nd function via Pub/Sub. For the simple case where processing < 10s, just do everything before sending the 200 — Meta's timeout is 10s so we have headroom.

### 6.2 Tool layer pattern

```ts
// bot/services/seating.ts
export async function lookupSeating(
  guestId: string,
  ctx: ToolContext,
): Promise<{ table_id: string; table_label: string; tablemate_summary: string } | { error: 'locked'; unlock_at: string } | { error: 'not_found' }> {
  const unlockAt = await getSeatingUnlockTime();
  if (Date.now() < unlockAt.getTime()) {
    return { error: 'locked', unlock_at: unlockAt.toISOString() };
  }
  const seating = await admin.firestore()
    .collection('seating').doc(guestId).get();
  if (!seating.exists) return { error: 'not_found' };
  const d = seating.data()!;
  return {
    table_id: d.tableId,
    table_label: d.tableLabel,
    tablemate_summary: d.tablemates.join(', '),
  };
}
```

Tool dispatcher in `claude/pipeline.ts`:

```ts
const TOOL_HANDLERS: Record<string, ToolHandler> = {
  lookup_seating: (input, ctx) => lookupSeating(ctx.guestId, ctx),
  lookup_events: (input, ctx) => lookupEvents(input, ctx),
  // ...
};

async function executeToolCall(toolUse: ToolUseBlock, ctx: ToolContext) {
  const handler = TOOL_HANDLERS[toolUse.name];
  if (!handler) {
    return { type: 'tool_result', tool_use_id: toolUse.id,
             content: JSON.stringify({ error: 'unknown_tool' }), is_error: true };
  }
  try {
    const result = await handler(toolUse.input, ctx);
    return { type: 'tool_result', tool_use_id: toolUse.id,
             content: JSON.stringify(result) };
  } catch (err) {
    log.error('tool_call_failed', { name: toolUse.name, err });
    return { type: 'tool_result', tool_use_id: toolUse.id,
             content: JSON.stringify({ error: 'tool_failed', message: String(err) }),
             is_error: true };
  }
}
```

### 6.3 Send wrapper pattern

```ts
// bot/whatsapp/send.ts
export async function sendText(opts: {
  to: E164;
  body: string;
  requestId: string;
}): Promise<{ metaMessageId: string }> {
  return await retry(async () => {
    const resp = await client.post(`/${PHONE_NUMBER_ID.value()}/messages`, {
      messaging_product: 'whatsapp',
      to: opts.to.slice(1),  // Meta wants no `+`
      type: 'text',
      text: { body: opts.body },
    });
    return { metaMessageId: resp.data.messages[0].id };
  }, {
    retries: 3,
    onError: (err, attempt) => log.warn('send_retry', { err, attempt }),
  });
}
```

### 6.4 Idempotency wrapper

```ts
// bot/webhook/dedupe.ts
export async function claimMessageId(messageId: string): Promise<boolean> {
  const ref = admin.firestore().collection('bot_dedupe').doc(messageId);
  const ttl = new Date(Date.now() + 24 * 60 * 60 * 1000);
  try {
    await ref.create({
      messageId,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      ttlExpiresAt: ttl,
      processedSuccessfully: false,
    });
    return true;
  } catch (err: any) {
    if (err.code === 6 /* ALREADY_EXISTS */) return false;
    throw err;
  }
}

export async function markProcessed(messageId: string) {
  await admin.firestore().collection('bot_dedupe').doc(messageId)
    .update({ processedSuccessfully: true });
}
```

## 7. Performance gotchas

- **Firestore cold reads** add 100–200ms each. Batch where you can; cache in-process for the function's lifetime.
- **Anthropic latency** is 2–5s for Sonnet 4.6 with cache hits. Keep `max_tokens` modest (1024 default).
- **Meta API latency** is 200–800ms p95. The send wrapper retries 3× with backoff so worst case ≈4s.
- **Cold starts**: ~3-5s for Node 24 functions. During event, set `minInstances: 5` for `whatsappWebhook` to eliminate.

## 8. Common LLM-implementer pitfalls

If you're an LLM implementing this codebase, avoid:

1. **Inventing fields** in Firestore docs not specified in `04-data-model.md`. Stick to the schema; ask before extending.
2. **Hard-coding event names or venue names** in source. Always read from Firestore.
3. **Bypassing the tool layer** to read Firestore from inside Claude's response. Tools are typed for a reason.
4. **Logging full message text** in Cloud Logs. Use the redacting helpers.
5. **Forgetting idempotency** on outbound proactive sends. Every scheduled function must check `bot_send_log`.
6. **Returning non-200** from the webhook. Always 200, even on internal failure.
7. **Trusting Meta payloads without validation.** Always Zod-parse.
8. **Adding new tools mid-implementation** without updating Block C in the system prompt.
9. **Re-using a Flow token nonce.** Always generate fresh on each Flow trigger.
10. **Mixing E.164 with Meta's no-`+` format** (`wa_id`). Convert at the boundary; internal code uses E.164.

## 9. Working with the docs

- `bot/specs/` is the **contract**. If a spec is wrong, propose a change to the spec doc, get operator approval, then implement.
- `bot/docs/` is the **runbook**. Update when operational reality changes.
- The decision log in `bot/specs/00-overview.md` §4 captures load-bearing choices. If you challenge one, propose an update there.
- When in doubt, prefer the more specific doc (e.g., `05-message-templates.md` over `01-prd.md`).

## 10. Getting started checklist for a fresh implementer

If you're an LLM picking up this project from scratch:

- [ ] Read `bot/specs/00-overview.md` end to end.
- [ ] Skim `bot/specs/01-prd.md` to internalize goals.
- [ ] Read `bot/specs/03-architecture.md` end to end.
- [ ] Read `bot/specs/04-data-model.md` and `bot/specs/08-integration-contract.md` carefully — they're the contracts you'll code against.
- [ ] Read `bot/specs/02-conversation-design.md` and `bot/specs/07-knowledge-base.md` together — the bot's "soul."
- [ ] Skim `bot/specs/05-message-templates.md` and `bot/specs/06-whatsapp-flows.md`.
- [ ] Read `bot/specs/09-security-privacy.md`.
- [ ] Read this guide (`bot/docs/developer-guide.md`).
- [ ] Read `bot/docs/implementation-plan.md` to understand the phased approach.
- [ ] Verify operator has completed `bot/docs/setup-guide.md` Steps 1-10.
- [ ] Begin Phase 1 of the implementation plan.

Total reading time: ~90 minutes for an LLM. After that, you should be able to start implementing without further questions.
