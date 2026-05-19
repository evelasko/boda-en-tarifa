#!/usr/bin/env -S node --import tsx
/**
 * simulate-webhook.ts — dev tool for crafting and POSTing Meta-style
 * webhook payloads against either the Cloud Functions emulator or a
 * deployed instance.
 *
 * Spec: bot/docs/implementation-plan.md Phase 1 DoD ("HMAC verification
 * rejects a tampered payload — verified via simulate-webhook.ts").
 *
 * Usage:
 *
 *   # 1. Default: send a text inbound to the emulator
 *   WHATSAPP_APP_SECRET=foo \
 *     npx tsx functions/scripts/simulate-webhook.ts
 *
 *   # 2. Tamper after signing — must produce 401 from the webhook
 *   WHATSAPP_APP_SECRET=foo \
 *     npx tsx functions/scripts/simulate-webhook.ts --tamper
 *
 *   # 3. Send to a deployed function
 *   WHATSAPP_APP_SECRET=foo \
 *     npx tsx functions/scripts/simulate-webhook.ts \
 *     --url https://europe-west1-<project>.cloudfunctions.net/whatsappWebhook
 *
 *   # 4. Other kinds
 *   ... --kind interactive
 *   ... --kind image
 *   ... --kind status
 *
 *   # 5. Re-send the same Meta message id to exercise dedupe
 *   ... --message-id wamid.repeat-me-123
 *
 *   # 6. GET handshake check (token must match WHATSAPP_VERIFY_TOKEN)
 *   WHATSAPP_VERIFY_TOKEN=tok \
 *     npx tsx functions/scripts/simulate-webhook.ts --handshake
 *
 * Exit codes:
 *   0  HTTP 2xx
 *   1  Non-2xx response or transport error
 *   2  CLI usage error
 */

import {createHmac, randomUUID} from "node:crypto";

interface Args {
  url: string;
  kind: "text" | "interactive" | "image" | "status";
  to: string;
  from: string;
  text: string;
  messageId: string;
  tamper: boolean;
  handshake: boolean;
  verifyToken: string;
  challenge: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string, fallback?: string): string | undefined => {
    const i = argv.indexOf(flag);
    if (i === -1) return fallback;
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) {
      die(`flag ${flag} requires a value`);
    }
    return v;
  };
  const has = (flag: string): boolean => argv.includes(flag);

  const kind = (get("--kind", "text") ?? "text") as Args["kind"];
  if (!["text", "interactive", "image", "status"].includes(kind)) {
    die(`--kind must be one of text|interactive|image|status (got ${kind})`);
  }

  return {
    url: get("--url",
      "http://127.0.0.1:5001/demo-boda-en-tarifa/europe-west1/whatsappWebhook"
    )!,
    kind,
    to: get("--to", "15550000001")!, // business number wa_id
    from: get("--from", "34612345678")!, // guest wa_id
    text: get("--text", "Hola, ¿a qué hora es la ceremonia?")!,
    messageId: get("--message-id", `wamid.sim.${randomUUID()}`)!,
    tamper: has("--tamper"),
    handshake: has("--handshake"),
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
    challenge: get("--challenge", "challenge-" + randomUUID().slice(0, 8))!,
  };
}

function die(msg: string): never {
  process.stderr.write(`simulate-webhook: ${msg}\n`);
  process.exit(2);
}

function buildPayload(args: Args): Record<string, unknown> {
  const metadata = {
    display_phone_number: `+${args.to}`,
    phone_number_id: "PHONE_NUMBER_ID",
  };
  const contacts = [
    {profile: {name: "Simulated Guest"}, wa_id: args.from},
  ];

  const baseMessage = {
    from: args.from,
    id: args.messageId,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };

  let value: Record<string, unknown>;
  switch (args.kind) {
    case "text":
      value = {
        messaging_product: "whatsapp",
        metadata,
        contacts,
        messages: [{...baseMessage, type: "text", text: {body: args.text}}],
      };
      break;
    case "interactive":
      value = {
        messaging_product: "whatsapp",
        metadata,
        contacts,
        messages: [
          {
            ...baseMessage,
            type: "interactive",
            interactive: {
              type: "button_reply",
              button_reply: {id: "btn-yes", title: "Sí"},
            },
          },
        ],
      };
      break;
    case "image":
      value = {
        messaging_product: "whatsapp",
        metadata,
        contacts,
        messages: [
          {
            ...baseMessage,
            type: "image",
            image: {
              id: "MEDIA_ID_" + randomUUID().slice(0, 8),
              mime_type: "image/jpeg",
              sha256: "fake-sha",
            },
          },
        ],
      };
      break;
    case "status":
      value = {
        messaging_product: "whatsapp",
        metadata,
        statuses: [
          {
            id: args.messageId,
            status: "delivered",
            timestamp: baseMessage.timestamp,
            recipient_id: args.from,
          },
        ],
      };
      break;
  }

  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA_ID",
        changes: [{field: "messages", value}],
      },
    ],
  };
}

async function postWebhook(args: Args): Promise<void> {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) die("WHATSAPP_APP_SECRET env var is required for POST");

  const payload = buildPayload(args);
  const bodyForSigning = JSON.stringify(payload);
  const sig = "sha256=" + createHmac("sha256", secret)
    .update(bodyForSigning, "utf8")
    .digest("hex");

  // If --tamper, mutate the body AFTER signing so HMAC must reject.
  const bodyToSend = args.tamper ?
    bodyForSigning.replace(/}$/, ', "tampered": true}') :
    bodyForSigning;

  process.stdout.write(
    `→ POST ${args.url}\n` +
    `  kind=${args.kind} message_id=${args.messageId}` +
    (args.tamper ? " TAMPERED" : "") + "\n"
  );

  const res = await fetch(args.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": sig,
    },
    body: bodyToSend,
  });
  const text = await res.text();
  process.stdout.write(`← ${res.status} ${res.statusText}\n${text}\n`);

  if (args.tamper && res.status === 401) {
    process.stdout.write("✓ tamper correctly rejected with 401\n");
    process.exit(0);
  }
  if (args.tamper) {
    process.stderr.write(
      "✗ tamper should have produced 401; got " + res.status + "\n"
    );
    process.exit(1);
  }
  process.exit(res.status >= 200 && res.status < 300 ? 0 : 1);
}

async function getHandshake(args: Args): Promise<void> {
  if (!args.verifyToken) die("WHATSAPP_VERIFY_TOKEN env var required for --handshake");
  const u = new URL(args.url);
  u.searchParams.set("hub.mode", "subscribe");
  u.searchParams.set("hub.verify_token", args.verifyToken);
  u.searchParams.set("hub.challenge", args.challenge);
  process.stdout.write(`→ GET ${u.toString()}\n`);
  const res = await fetch(u);
  const text = await res.text();
  process.stdout.write(`← ${res.status} ${res.statusText}\n${text}\n`);
  if (res.status === 200 && text === args.challenge) {
    process.stdout.write("✓ challenge echoed correctly\n");
    process.exit(0);
  }
  process.exit(1);
}

async function main(): Promise<void> {
  const args = parseArgs();
  if (args.handshake) {
    await getHandshake(args);
  } else {
    await postWebhook(args);
  }
}

main().catch((err) => {
  process.stderr.write(`simulate-webhook: ${String(err)}\n`);
  process.exit(1);
});
