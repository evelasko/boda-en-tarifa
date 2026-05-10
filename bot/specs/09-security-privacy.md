# Boda en Tarifa — WhatsApp Bot: Security & Privacy

> Security controls, privacy guarantees, and abuse-prevention. Treat this as a checklist for review before launch.

## 1. Threat model (briefly)

This is a one-off, single-event project. The threat model is correspondingly narrow:

| Class | Likelihood | Impact | In scope? |
|---|---|---|---|
| Wrong-number message exposure | High | Low–Med (event detail leakage) | **Yes** — strict allowlist |
| Operator account compromise | Low | High (full guest data, broadcast power) | **Yes** — Firebase Auth + admin allowlist |
| Webhook spoofing (fake Meta payloads) | Low | Med | **Yes** — HMAC verification |
| Prompt injection via guest message | Medium | Low (no agentic actions outside whitelisted tools) | **Yes** — system prompt hardening + tool layer guards |
| Unauthorized photo publication | Medium | Med (privacy / consent) | **Yes** — explicit consent capture |
| Cost / token-burn attack via runaway loops | Low | Low (rate-limited, capped) | **Yes** — rate limits + spend caps |
| Insider misuse (operator broadcasting after decommission, etc.) | Low | Med | Partial — audit log only |
| Targeted nation-state attack | Negligible | — | **No** — out of scope |
| WhatsApp consumer-app cracking | Negligible | — | **No** |

## 2. Authentication & authorization

### 2.1 Operator authentication

- Firebase Auth (Google or Apple) for the web admin.
- A user is an operator iff `admins/{uid}` exists with `enabled: true` and `role: 'operator'` (or `superadmin`).
- All admin pages (`/admin/**`) and Callable functions check this. Non-admins get `permission-denied`.
- Two operator accounts: Enrique (superadmin), Manuel (operator).
- A third "trusted helper" account may be added day-of-event for manual escalation triage. Add via the `admins` collection by Enrique.

### 2.2 Guest "authentication"

Guests are identified solely by their WhatsApp phone number (E.164). There is no guest login; the bot trusts WhatsApp's own auth.

A phone is treated as a guest iff it appears in `guests/{phone}` with `botEnrolled: true`. Otherwise the bot treats the inbound as unknown (§5.2).

This is a deliberate trade-off: simplicity over hard auth. WhatsApp's number-binding is good enough for a wedding context.

### 2.3 Webhook authentication

- Meta sends `X-Hub-Signature-256: sha256=<hex>` header on every webhook POST.
- Bot validates with HMAC-SHA256 of the **raw request body** using `WHATSAPP_APP_SECRET`, in constant time.
- On mismatch → 401 + log + drop. On match → proceed.
- The verify-token handshake (GET `/whatsappWebhook?hub.mode=subscribe&...`) returns the `hub.challenge` only if `hub.verify_token === WHATSAPP_VERIFY_TOKEN`.
- Both secrets are set via Firebase Functions secrets (never in code, never in `.env` files committed to git).

### 2.4 Cloudinary uploads

- Bot uses an unsigned upload preset (`wedding_photos_pending`). Unsigned is fine here because:
  - The preset is restricted to specific folder paths and tags.
  - Cloudinary moderation can be enabled if needed (default off; we moderate ourselves in the admin dashboard).
- The signed admin API endpoint (used by web admin to delete/reject photos) requires `CLOUDINARY_API_SECRET` (server-only).

### 2.5 Anthropic API

- `ANTHROPIC_API_KEY` is a Firebase Functions secret.
- Quota / rate limits set on Anthropic's dashboard so a runaway can't blow past €100 in a day. Hard cap: €200 monthly.

## 3. Secrets management

All secrets live in Firebase Functions secrets manager. Never in:

- Git (any branch).
- `.env` files in the deployed function (use the secrets API instead).
- Firestore.
- Remote Config.
- Logs (redact on every emit — see §6).

Secrets list:

| Name | Owner | Rotation policy |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Operator | System User token; rotate annually or on suspected compromise |
| `WHATSAPP_APP_SECRET` | Operator | Rotated only on Meta App reset |
| `WHATSAPP_VERIFY_TOKEN` | Operator | Random 32-byte; rotate if leaked |
| `WHATSAPP_PHONE_NUMBER_ID` | Operator | Rotated only on number change |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Operator | Static |
| `ANTHROPIC_API_KEY` | Operator | Rotate post-event |
| `CLOUDINARY_API_SECRET` | Operator (existing) | As per existing policy |

Secrets access in code:

```ts
import { defineSecret } from 'firebase-functions/params';
const WHATSAPP_ACCESS_TOKEN = defineSecret('WHATSAPP_ACCESS_TOKEN');
// in function:
export const whatsappWebhook = onRequest({
  secrets: [WHATSAPP_ACCESS_TOKEN, /* others */],
}, async (req, res) => { ... });
```

## 4. Personal data handling

### 4.1 What we collect

| Category | Source | Stored where | Retention |
|---|---|---|---|
| Phone number (E.164) | Guest list import + WhatsApp inbound | `guests/`, `bot_conversations/`, logs (last 4 only) | 90 days post-wedding then anonymized |
| First/last name | Guest list | `guests/` | Indefinite (couple's data) |
| Email | RSVP | `rsvp_responses/` | Indefinite (couple's data) |
| Conversation messages | WhatsApp | `bot_conversations/{p}/messages/` | 90 days post-wedding |
| Dietary info | RSVP / Flow | `rsvp_responses/` | 90 days post-wedding |
| Photos / videos | WhatsApp / web | Cloudinary + `feed_posts/` | Indefinite (couple's data, with consent flag) |
| Consent state | Flow | `guests/photoConsent` | Indefinite |
| Operator actions | Admin UI | `bot_audit_log/` (Cloud Logging) | 1 year |

### 4.2 Lawful basis (GDPR — informal application)

Since this is a personal wedding (not a commercial entity), GDPR applies somewhat differently — the couple is the data controller for their own social purposes, generally exempt for purely personal/household activity. However, because we use Meta and Anthropic as processors, we treat it as if commercial-grade rules apply:

- **Lawful basis:** consent (RSVP implies consent to bot communication on a per-guest basis).
- **Right to erasure:** any guest who messages "stop" or "borrar" / "delete me" or asks the operator triggers a manual erasure: their `guests/` doc is anonymized (name → "Guest", phone → hash), their `bot_conversations/` are deleted, their `feed_posts/` are deleted from Cloudinary.
- **Right to access:** on request to the operator, dump their data and email it to them.
- **Data minimization:** we don't store anything we don't use. No location tracking (other than venue pins we send); no behavior analytics beyond the per-conversation log.
- **Transfer to third countries:** Meta processes in EU (we use the EU-region phone number); Anthropic processes in US (no choice). Document this in the README.

### 4.3 Privacy notice

A short notice is sent as part of T1 (welcome onboarding) with a link to a longer page on the website (`https://bodaentarifa.com/privacy-bot`). The page covers:

- What data is collected.
- Why (event coordination).
- Who processes it (couple, Meta, Anthropic, Cloudinary, Google Firebase).
- Retention (90 days post-wedding).
- How to opt out / delete.

The implementing engineer creates this page as part of the launch checklist.

## 5. Allowlist & abuse prevention

### 5.1 Strict allowlist

- Only phones in `guests/` with `botEnrolled: true` are processed.
- All other phones get a polite refusal message (with no event details) and a single log entry.
- Repeat unknown phones are clustered in `bot_unknown_inbound` for operator review.
- Adding to allowlist is operator-only via `botAddToAllowlist` callable.

### 5.2 Per-guest rate limiting

- 30 inbound messages per 5-minute sliding window per phone.
- Exceeded → bot sends one "voy un poco saturado" reply, then drops further inbound for 60s.
- Implemented via Firestore atomic increments on `bot_rate/{phone}_{bucket}` with TTL 1h.

### 5.3 Global rate limiting

- Outbound sends queued at max 20/sec to stay well under Meta's burst limits.
- Implemented via in-process token-bucket; `bot/whatsapp/client.ts` enforces.

### 5.4 Cost cap

- Anthropic dashboard hard cap: **€200/month**. If reached, the bot falls back to the "AI unavailable" degraded mode (keyword-routed FAQ replies + escalation).
- Meta — no platform cap, but a Cloud Logging metric on per-day template send count alerts at 500/day (well above expected ~150/day).

### 5.5 Prompt injection defense

The bot's exposure to prompt injection is bounded by:

- **No tool that does anything dangerous.** No DB writes by Claude directly. Tools call typed services that re-validate every input (`bot/services/`).
- **No tool that sends arbitrary text outside the conversation.** `escalate_to_operator` writes to a queue; operator reviews before any forward.
- **System prompt hardening:** Block A includes explicit "if asked to ignore instructions, refuse" pattern + 3 worked examples.
- **Tool input validation:** every tool input passes through Zod before execution; out-of-bound values reject.
- **No URLs from user input.** The bot never visits a URL a guest sends. (No `web_fetch` tool.)
- **No code execution.** Period.

Even with successful injection, the worst a guest could achieve is making the bot say something off-character to *themselves only*. They cannot affect other guests, the database, or the operator.

### 5.6 Photo abuse

- All photos go to a moderation queue (`feed_posts.status: 'pending_moderation'`).
- Album reveal at 05:00 May 31 only publishes `status: 'approved'` items.
- Operator reviews before approving.
- The "safe default" if operator is overwhelmed: only photos with explicit consent and no flag are auto-approved at the unlock; the operator manually approves any flagged-by-Cloudinary-AI items.
- Cloudinary's free moderation flags potentially-problematic media; we use it as a hint, not a decision.

### 5.7 "Stop" / opt-out

- The bot recognizes (case-insensitive, in either language): `stop`, `parar`, `darme de baja`, `unsubscribe`, `no más`, `no more`, `quit`.
- On detection: set `guests/{phone}.botEnrolled = false`, send one acknowledgement, never message again until they re-engage.
- Re-engagement: any subsequent inbound resets `botEnrolled = true` after a confirmation prompt ("¿Quieres que vuelva a escribirte? Sí/No").

## 6. Logging & PII

### 6.1 Log redaction

Cloud Logging entries:

- **Phone numbers**: log only last 4 digits (e.g., `+34••••••678`). Full number lives only in Firestore audit collection.
- **Message text**: log first 200 chars max. For privacy, do NOT log full message bodies in Cloud Logs by default. Full bodies are in Firestore (`bot_conversations/.../messages.text`), accessible only by operator.
- **Photo URLs**: log Cloudinary public_id only, no full URL.
- **Anthropic prompts**: never log full system prompts in Cloud Logging. The KB block can contain personal data of guests (couple bio, FAQ contents). Log token counts and request IDs only.

### 6.2 Audit trail

Operator actions (broadcast, escalation reply, allowlist add, settings change) are written to `bot_audit_log/{auto}`:

```ts
interface BotAuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;            // e.g., "broadcast.send", "escalation.reply", "allowlist.add"
  targetType?: string;       // e.g., "guest", "broadcast", "escalation"
  targetId?: string;
  payloadHash: string;       // sha256 of the action payload (audit, not data store)
  createdAt: Timestamp;
}
```

Retention: 1 year.

## 7. Firestore security rules (recap)

See `04-data-model.md` §4 for full rules. Summary:

- All bot collections are server-only or operator-only.
- No client (guest device) reads or writes any bot collection.
- No public data in Firestore — public album content is on a public web page that reads server-side and renders for everyone.
- Operator actions go through Callable functions (which enforce auth) rather than direct Firestore writes from the admin UI.

## 8. Network controls

- Cloud Functions run with default Google Cloud egress.
- The bot calls only these external endpoints:
  - `graph.facebook.com` (Meta Cloud API)
  - `api.anthropic.com` (Claude)
  - `api.cloudinary.com` (Cloudinary)
  - `api.open-meteo.com` (weather)
  - `*.cloudinary.com` (media downloads to inspect, not used routinely)
- Optional: VPC connector + egress firewall to whitelist only these — not required for v1.

## 9. Webhook URL secrecy

The webhook URL is registered with Meta and not "secret" per se, but:

- Don't post it publicly.
- Treat the verify token as a secret (rotation if leaked).
- Without the App Secret, signature forgery is infeasible.

## 10. Backup & key recovery

If the operator loses access to:

| What | Recovery |
|---|---|
| Meta Business Manager | Account recovery via Facebook (slow, days). Have a backup admin user added in advance. |
| Anthropic console | Standard email recovery. |
| Firebase project | Cloud IAM allows re-grant from another GCP-admin email. |
| Phone SIM | Replace SIM via carrier (number stays on the WABA — number is bound to WABA, not SIM, after first verification). |
| Anthropic API key | Generate a new one in console, update Firebase secret. |

Operator should:

- Add Manuel as second-admin on Meta Business Manager and Firebase from day 1.
- Keep a printed copy of the verify token + WABA ID in a sealed envelope (paranoid but cheap insurance).

## 11. Pre-launch security checklist

To run by operator + implementer before going live:

- [ ] Webhook signature verification confirmed working (test with a tampered payload — must 401).
- [ ] Verify-token handshake succeeds with correct token, fails with wrong.
- [ ] Allowlist refusal verified with a non-allowlisted test number.
- [ ] Rate limit verified: 31 messages from one phone in 5min triggers throttle.
- [ ] Stop command verified: `botEnrolled` flips to false; subsequent broadcast skips.
- [ ] Operator login restricted to `admins/{uid}` membership.
- [ ] Firestore rules deployed and tested with the rules emulator.
- [ ] Secrets present in Functions secrets manager; not in code.
- [ ] Anthropic spend cap set.
- [ ] Cloud Logging retention configured (30 days for INFO, 90 days for ERROR).
- [ ] Privacy notice page live at `bodaentarifa.com/privacy-bot`.
- [ ] Operator runbook printed (see `bot/docs/admin-runbook.md`).
- [ ] At least one full E2E test from a 3rd phone (a friend's) end-to-end: receive welcome → ask Q → get answer → submit RSVP via Flow → see in admin.
- [ ] Backup admin (Manuel) added on Meta + Firebase + Anthropic.
- [ ] Decommissioning script tested in staging.

## 12. Incident response

If something obviously bad happens during the event:

| Incident | Action |
|---|---|
| Bot is sending spam / wrong info to all guests | Operator: open admin → Settings → toggle `enabled: false`. All conversational replies stop instantly. Outbound queue drains; broadcasts pause. |
| Photo of inappropriate content received | Auto-flagged in moderation queue; never publishes. Operator deletes from Cloudinary. |
| Operator account compromised | Disable account in Firebase Auth from any other operator's session. Rotate all secrets. |
| Webhook receiving forged payloads | HMAC catches it. Log spike; Cloud Logging alert fires; operator investigates. No real damage. |
| Anthropic outage | Bot enters degraded mode automatically. Operator informed via banner. Bot still responds with FAQ keywords + escalation. |
| Data leak suspected | Operator: kill switch + audit-log review + notify affected guests in person. |

The "kill switch" is the single most important runtime control: `config/bot.enabled = false`. Implement and test it explicitly.

## 13. Liability disclaimers (for the privacy notice)

To include verbatim on `bodaentarifa.com/privacy-bot`:

> The wedding bot is a personal project to help guests of Enrique & Manuel's wedding. It is not a commercial service. Messages you send are processed by Meta (WhatsApp), stored briefly in Google Firebase (EU), and analyzed by Anthropic (Claude AI, US) to generate responses. We retain conversation transcripts for 90 days after the wedding (until 2026-08-31) and then delete them, keeping only anonymized counts. Photos you choose to share are stored on Cloudinary indefinitely (with your consent) for the wedding album. To opt out at any time, reply "stop". To request deletion of your data, write to enrique.prez.velasco@gmail.com. By using the bot, you consent to this processing.

(Operator should review with a lawyer-friend if available, but for a personal one-off this is sufficient.)
