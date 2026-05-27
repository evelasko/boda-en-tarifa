#!/usr/bin/env node
/**
 * op8-load-harness.mjs — fire N concurrent virtual guests at the live
 * `whatsappWebhook`, each sending one HMAC-signed inbound every ~30s
 * for the configured duration. Aggregates per-request latency and HTTP
 * status into a final report.
 * ============================================================================
 *
 * Op-8 framing (`bot/docs/event-optimization-operator-plan.md` §Op-8):
 * this is a **concurrency-bug hunt**, not a production load test. The
 * goal is to provoke race conditions in dedupe, rate-limit, audit
 * transactions, and Claude pipeline under simultaneous load — bugs that
 * never surface during single-user manual testing.
 *
 * Defaults (per the operator plan):
 *   - 15 concurrent virtual guests
 *   - 1 message per guest every 30 s
 *   - 10 minutes total
 *   ⇒ ~300 turns through the full pipeline
 *
 * Cost shape: each turn ≈ ~3k input tokens cached + ~150 output tokens
 * on Sonnet. Expected total: ~$2.50–$3.50 of Anthropic spend per run.
 *
 * Prerequisites:
 *   1. The 15 synthetic test phones must already exist as allowlisted
 *      guests. Run `op8-seed-test-phones.mjs` first.
 *   2. WHATSAPP_APP_SECRET env var (the Meta App Secret) — required to
 *      sign payloads so the webhook's HMAC check accepts them.
 *   3. The deployed `whatsappWebhook` URL. Discover it via:
 *        firebase functions:list --project boda-en-tarifa
 *      Default below points at the standard Gen2 europe-west1 URL.
 *
 * Usage:
 *   WHATSAPP_APP_SECRET=$(firebase functions:secrets:access WHATSAPP_APP_SECRET) \
 *     node bot/scripts/op8-load-harness.mjs
 *
 *   # Shorter dry-run to verify wiring (2 guests, 1 min):
 *   WHATSAPP_APP_SECRET=... node bot/scripts/op8-load-harness.mjs \
 *     --concurrency 2 --duration-min 1
 *
 *   # Hit a custom URL (staging, emulator, etc.):
 *   WHATSAPP_APP_SECRET=... node bot/scripts/op8-load-harness.mjs \
 *     --url http://127.0.0.1:5001/demo-boda-en-tarifa/europe-west1/whatsappWebhook
 *
 * Watching while it runs (split-window setup recommended):
 *   - bot/docs/op8-observability.md has the exact gcloud log queries
 *     and Firestore dedupe-check commands to run alongside.
 *
 * Exit codes:
 *   0 — clean run, all guests completed
 *   1 — at least one virtual guest hit a fatal error (network, auth)
 *   2 — CLI usage error
 */

import { createHmac, randomUUID } from 'node:crypto';

const DEFAULT_URL =
  'https://europe-west1-boda-en-tarifa.cloudfunctions.net/whatsappWebhook';

// Mirrors the seed script. If you change the count or phone pattern
// there, change it here too.
const SEED_PHONE = (i) => `+34900000${String(100 + i).padStart(3, '0')}`;
const SEED_NAME = (i) => `Op8 Test Phone ${String(i + 1).padStart(2, '0')}`;
const SEED_LANG = (i) => (i % 2 === 0 ? 'es' : 'en');

// Realistic prompt pool — drawn from the golden examples in
// bot/specs/02-conversation-design.md §7. Even mix of intents so each
// virtual guest exercises a different code path on each turn.
const PROMPTS_ES = [
  '¿a qué hora es la ceremonia?',
  '¿dónde es el welcome dinner?',
  '¿qué tiempo va a hacer el sábado?',
  '¿qué hago mañana antes de la boda?',
  '¿cómo me visto el viernes?',
  'no me acuerdo de la dirección de la finca',
  '¿hay autobús desde el hotel?',
  '¿tenéis menú vegano?',
  '¿de qué se conocieron Enrique y Manuel?',
  'recuérdame el dress code de la ceremonia',
  'hola Thora',
  '¿cuándo abrís las mesas?',
];

const PROMPTS_EN = [
  "what time's the ceremony?",
  "where's the welcome dinner?",
  'how should I dress on Friday?',
  "what's the weather like Saturday?",
  'is there a bus from the hotel?',
  'remind me of the venue address please',
  'do you have a vegan menu option?',
  'hey Thora',
  'tell me how Enrique and Manuel met',
  'when does the ceremony start, again?',
  'is the dress code black tie?',
  'what should I bring tomorrow?',
];

// ─────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag, fallback) => {
    const i = argv.indexOf(flag);
    if (i === -1) return fallback;
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) {
      die(`flag ${flag} requires a value`);
    }
    return v;
  };
  const url = get('--url', DEFAULT_URL);
  const concurrency = Number(get('--concurrency', '15'));
  const durationMin = Number(get('--duration-min', '10'));
  const intervalSec = Number(get('--interval-sec', '30'));
  const jitterSec = Number(get('--jitter-sec', '5'));

  if (!Number.isFinite(concurrency) || concurrency < 1 || concurrency > 99) {
    die('--concurrency must be 1–99');
  }
  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    die('--duration-min must be > 0');
  }
  if (!Number.isFinite(intervalSec) || intervalSec < 5) {
    die('--interval-sec must be ≥ 5');
  }

  return { url, concurrency, durationMin, intervalSec, jitterSec };
}

function die(msg) {
  process.stderr.write(`op8-load-harness: ${msg}\n`);
  process.exit(2);
}

// ─────────────────────────────────────────────────
// HMAC-signed Meta webhook payload (matches simulate-webhook.ts)
// ─────────────────────────────────────────────────

function buildPayload({ fromPhone, fromName, text, messageId }) {
  const waId = fromPhone.replace('+', '');
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WABA_ID',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+15550000001',
                phone_number_id: 'PHONE_NUMBER_ID',
              },
              contacts: [{ profile: { name: fromName }, wa_id: waId }],
              messages: [
                {
                  from: waId,
                  id: messageId,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: 'text',
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

async function fireOne({ url, secret, virtualGuest }) {
  const prompts = virtualGuest.lang === 'es' ? PROMPTS_ES : PROMPTS_EN;
  const text = prompts[Math.floor(Math.random() * prompts.length)];
  const messageId = `wamid.op8.${virtualGuest.index}.${randomUUID().slice(0, 12)}`;
  const payload = buildPayload({
    fromPhone: virtualGuest.phone,
    fromName: virtualGuest.name,
    text,
    messageId,
  });
  const body = JSON.stringify(payload);
  const sig = 'sha256=' + createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sig },
      body,
    });
    const dt = Date.now() - t0;
    // Consume body so the connection can be reused; we don't inspect it.
    await res.text();
    return { ok: res.ok, status: res.status, ms: dt, messageId, error: null };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - t0,
      messageId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─────────────────────────────────────────────────
// Virtual guest loop
// ─────────────────────────────────────────────────

async function runVirtualGuest({ url, secret, virtualGuest, deadline, intervalSec, jitterSec, results }) {
  // Random initial offset so all 15 guests don't fire at the same wall-clock instant.
  const initialOffset = Math.random() * intervalSec * 1000;
  await sleep(initialOffset);
  while (Date.now() < deadline) {
    const r = await fireOne({ url, secret, virtualGuest });
    results.push({ guestIndex: virtualGuest.index, ...r });
    const wait = intervalSec * 1000 + (Math.random() - 0.5) * 2 * jitterSec * 1000;
    await sleep(Math.max(1000, wait));
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────
// Reporting
// ─────────────────────────────────────────────────

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

function report(results, args) {
  const total = results.length;
  const ok = results.filter((r) => r.ok).length;
  const errors = results.filter((r) => !r.ok);
  const latencies = results.filter((r) => r.ok).map((r) => r.ms).sort((a, b) => a - b);
  const byStatus = new Map();
  for (const r of results) byStatus.set(r.status, (byStatus.get(r.status) || 0) + 1);

  console.log('');
  console.log('═'.repeat(72));
  console.log('Op-8 load harness — final report');
  console.log('═'.repeat(72));
  console.log(`Target            : ${args.url}`);
  console.log(`Concurrency       : ${args.concurrency} virtual guests`);
  console.log(`Duration          : ${args.durationMin} min (interval ${args.intervalSec}s ± ${args.jitterSec}s)`);
  console.log('─'.repeat(72));
  console.log(`Total requests    : ${total}`);
  console.log(`2xx               : ${ok}  (${pct(ok, total)})`);
  console.log(`Non-2xx / errors  : ${total - ok}  (${pct(total - ok, total)})`);
  console.log('Status breakdown  :');
  for (const [status, count] of [...byStatus.entries()].sort()) {
    console.log(`  ${status === 0 ? 'NETWORK' : String(status).padEnd(7)} ${count}`);
  }
  console.log('─'.repeat(72));
  console.log('Latency (2xx only, ms):');
  console.log(`  p50  ${percentile(latencies, 50)}`);
  console.log(`  p95  ${percentile(latencies, 95)}`);
  console.log(`  p99  ${percentile(latencies, 99)}`);
  console.log(`  max  ${latencies[latencies.length - 1] ?? 0}`);
  console.log('─'.repeat(72));
  if (errors.length > 0) {
    console.log(`First ${Math.min(10, errors.length)} error sample(s):`);
    for (const e of errors.slice(0, 10)) {
      console.log(`  guest=${e.guestIndex} status=${e.status} ms=${e.ms}  ${e.error ?? '(no error message)'}`);
    }
    console.log('─'.repeat(72));
  }
  console.log('Op-8 §Op-8 pass criteria:');
  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  console.log(`  latency p50 < 3000 ms      : ${p50 < 3000 ? '✓' : '✗'}  (${p50})`);
  console.log(`  latency p95 < 8000 ms      : ${p95 < 8000 ? '✓' : '✗'}  (${p95})`);
  console.log(`  zero 5xx                   : ${(byStatus.get(500) ?? 0) + (byStatus.get(502) ?? 0) + (byStatus.get(503) ?? 0) === 0 ? '✓' : '✗'}`);
  console.log(`  zero network/timeout       : ${(byStatus.get(0) ?? 0) === 0 ? '✓' : '✗'}`);
  console.log(`  ≥95 % 2xx                  : ${ok / total >= 0.95 ? '✓' : '✗'}  (${pct(ok, total)})`);
  console.log('═'.repeat(72));
  console.log('Next: follow bot/docs/op8-observability.md to check');
  console.log('  1) bot_dedupe uniqueness, 2) no double-replies in bot_conversations,');
  console.log('  3) Sentry exceptions during the run window, 4) cache hit rate.');
}

function pct(n, total) {
  return total === 0 ? '0.0%' : (100 * n / total).toFixed(1) + '%';
}

// ─────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) die('WHATSAPP_APP_SECRET env var is required');

  const virtualGuests = Array.from({ length: args.concurrency }, (_, i) => ({
    index: i + 1,
    phone: SEED_PHONE(i),
    name: SEED_NAME(i),
    lang: SEED_LANG(i),
  }));

  console.log(`Op-8 load harness — starting`);
  console.log(`  url          : ${args.url}`);
  console.log(`  concurrency  : ${args.concurrency} virtual guests`);
  console.log(`  duration     : ${args.durationMin} min`);
  console.log(`  cadence      : 1 turn / ${args.intervalSec}s (± ${args.jitterSec}s jitter) per guest`);
  console.log(`  expected ~ ${args.concurrency * Math.floor(args.durationMin * 60 / args.intervalSec)} total turns`);
  console.log('');

  const deadline = Date.now() + args.durationMin * 60 * 1000;
  const results = [];
  let lastTick = Date.now();

  // Periodic progress beacon every 30s so the operator knows we're alive.
  const tick = setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - lastTick) / 1000);
    const remainingSec = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
    const recentOk = results.filter((r) => r.ok).length;
    console.log(`  [tick +${elapsedSec}s] turns=${results.length} ok=${recentOk} remaining≈${remainingSec}s`);
  }, 30_000);

  try {
    await Promise.all(
      virtualGuests.map((vg) =>
        runVirtualGuest({
          url: args.url,
          secret,
          virtualGuest: vg,
          deadline,
          intervalSec: args.intervalSec,
          jitterSec: args.jitterSec,
          results,
        })
      )
    );
  } finally {
    clearInterval(tick);
  }

  report(results, args);
  // Non-zero exit if any virtual guest hit a transport-level error,
  // matching the spirit of the operator plan's pass criteria.
  const hadFatal = results.some((r) => r.status === 0);
  process.exit(hadFatal ? 1 : 0);
}

main().catch((err) => {
  console.error('op8-load-harness fatal:', err);
  process.exit(1);
});
