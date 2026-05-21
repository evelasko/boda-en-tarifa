# Phase 3 — Subset Implementation Plan

> Scope: the **no-content-needed** pieces of Phase 3 of `implementation-plan.md` — work the implementer can do entirely in parallel with operator content authoring (`pre-implementation-checklist.md` §1) and Meta template/Flow approval (§2). This document is meant to be self-contained: an implementer (human or LLM) can plan and execute the work from this single doc plus the linked specs.

## Why this subset

Phase 3 in the implementation plan covers tools, media, and Flows. About a third of it depends on operator-authored content (couple dossier, guest dossiers, Tarifa guide) or Meta-approved assets (templates, Flows) that haven't landed yet. The remaining two-thirds is pure code that exercises infrastructure the bot already has (Firestore, Cloud Functions, Anthropic) plus two new external integrations (Open-Meteo, Cloudinary).

This plan tackles four independent units:

1. **Weather service** — Open-Meteo client, in-process cache, wires the `get_current_weather` tool from stub to real.
2. **Escalation service** — writes `bot_escalations/{auto}` docs, links unresolved id on the conversation root, wires `escalate_to_operator` tool.
3. **Media handler** — photo intake: Meta media download → Cloudinary upload → `feed_posts/{auto}` writer → Thora ack. (Vision / face recognition is explicitly NOT in scope — that needs operator dossiers.)
4. **KB rebuild trigger** — Firestore trigger that bumps `bot_kb_version/_singleton_` whenever watched content collections change, so the bot's in-process KB cache auto-invalidates.

Each unit ships independently and the four can be done in any order.

---

## Context the implementer needs first

### Current state (post-Phase 2)

- The repository is at `/Users/henry/Workbench/White Hibiscus/dev/boda-en-tarifa`.
- Phase 2 is complete: webhook scaffold, Claude pipeline with 3-block cached system prompt, tool registry with 14 tools (4 wired, 10 stubbed), conversation handlers (allowlist + rate limit + command + KB + audit), Firestore guest resolution via `phoneE164` query (preserves existing `guests/{uid}` keying), bilingual handling, and a smoke script for testing the pipeline locally.
- The function `whatsappWebhook` is deployed to production and answering messages.
- Firestore collections `events` (6 docs) and `venues` (4 docs) are seeded from `web/src/content/wedding-content.json`.
- `bot_kb_version/_singleton_` does not yet exist — `getKb()` treats absence as "version 0, always rebuild."

### Spec documents

The bot's design is captured across these files (read once before starting; reference as you go):

- `bot/specs/02-conversation-design.md` — Thora persona, escalation policy (§5), photo handling (§9 row "Photo received"), edge cases.
- `bot/specs/04-data-model.md` — Firestore schemas for `bot_escalations` (§2), `feed_posts` (§1), `bot_kb_version` (§2). Indexes in §3, security rules in §4.
- `bot/specs/07-knowledge-base.md` — `get_current_weather` (§5.6), `escalate_to_operator` (§5.10), vision pipeline (§11), caching strategy (§7).
- `bot/specs/08-integration-contract.md` — Cloudinary integration (§6), Open-Meteo (§7), Anthropic API (§8), Firestore triggers (§3.4).
- `bot/specs/09-security-privacy.md` — secret handling, what NOT to log.
- `bot/docs/implementation-plan.md` — Phase 3 section (the parent plan this subset slots into).

### Architectural conventions

The Phase 2 scaffold establishes patterns to follow:

- **File layout.** `functions/src/bot/` is the bot subsystem root. Sub-directories: `claude/` (pipeline, tools, system prompt, KB, language), `conversation/` (state, rate limit), `handlers/` (per-inbound-type entry points), `lib/` (config, phone, i18n, time, validation), `services/` (Firestore-facing data access), `webhook/` (signature, dedupe, classify, top-level dispatcher), `whatsapp/` (Meta API clients). New subsystems should slot into the closest existing directory rather than create new ones.
- **Module system.** NodeNext ESM with `.js` suffix on relative imports (e.g. `import {x} from "../lib/config.js"`). TS `target: es2017`, `strict: true`.
- **Lint rules.** Double quotes, 2-space indent, max-len 80 (disabled file-wide only for `claude/system-prompt.ts` because it carries verbatim spec prose). `require-jsdoc` and `valid-jsdoc` are disabled globally — write JSDoc when it explains *why*, skip when it would just duplicate types.
- **Logging.** Use `logger.info|warn|error` from `firebase-functions/logger`. Event names use the pattern `bot.<subsystem>.<event>` (e.g. `bot.weather.cache_hit`, `bot.escalation.created`). Always include `requestId` when available. Never log full inbound text or phone numbers — use `maskPhone()` from `lib/phone.ts`.
- **Secrets.** Defined in `lib/config.ts` via `defineSecret`. Bound to functions via `secrets: WEBHOOK_SECRETS` (or a similar group). Read via `.value()` inside the handler, never at module load.
- **Error handling.** The webhook layer always returns 200 to Meta (otherwise Meta retries and we get duplicate processing). Internal failures are logged and either ack a fallback to the user or stay silent depending on the failure mode. Tools that fail return `{output: {error: "<reason>"}, errored: true}` so Claude can apologize rather than improvise around a missing result.
- **Firestore writes.** All bot collections are server-only (security rules disallow client writes). Use Admin SDK directly via `getFirestore()`. Use `FieldValue.serverTimestamp()` for timestamps the server should set. Use `FieldValue.increment()` for counters. Use transactions only when read-modify-write is required.
- **Guest identity.** Internal `Guest.id` is the Firebase Auth UID (the doc id under `guests/{uid}`). Phone-keyed bot collections (`bot_conversations/{phone}`, `bot_dedupe/{messageId}`, `bot_rate/{phone}_{bucket}`) stay phone-keyed because they're messaging artifacts. When a bot record references a guest, the field value is the canonical uid. `displayName(guest)` resolves to `preferredName ?? fullName.split(/\s+/)[0]`.

### Verification commands

After every meaningful change:

- `cd functions && npm run build` — TypeScript compile (no errors).
- `cd functions && npm run lint` — ESLint must pass.
- `cd functions && npm test` — 38 existing jest tests must still pass.
- For dev scripts (which are excluded from lint): standalone typecheck via `npx tsc --noEmit --module nodenext --moduleResolution nodenext --target es2017 --strict --esModuleInterop scripts/<file>.ts`.

For the Claude pipeline smoke test:
- `ANTHROPIC_API_KEY=sk-... npx tsx functions/scripts/smoke-pipeline.ts --text "..." --lang es` — runs one turn against seeded Firestore data, no Meta involvement.

For a deployed function smoke test:
- `firebase deploy --only functions:whatsappWebhook`
- `firebase functions:log --only whatsappWebhook -f`
- Send a real WhatsApp message from an allowlisted phone.

---

## Task 1 — Weather service + tool wire-up

### Goal

Replace the `get_current_weather` tool stub in `claude/tools.ts` with a real Open-Meteo-backed implementation. Output structure matches the spec so Claude can compose a grounded reply (temperature, conditions in both languages, wind speed, wind direction, wind name).

### Spec references

- `bot/specs/07-knowledge-base.md` §5.6 — tool definition and return shape.
- `bot/specs/08-integration-contract.md` §7 — Open-Meteo endpoint, query parameters, response shape, wind-name rule.

### Files to create

- `functions/src/bot/services/weather.ts` — exposes `getCurrentWeather()` returning the structured shape; owns the Open-Meteo HTTP call and the cache.

### Files to modify

- `functions/src/bot/claude/tools.ts` — replace the `execGetCurrentWeather` stub branch in the `executeTool` dispatcher.

### Behavior

The service exposes a single function that fetches Tarifa's current weather from Open-Meteo. Tarifa coordinates: 36.0143 N, −5.6044 E. Endpoint is `https://api.open-meteo.com/v1/forecast`. The query asks for `current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m`, `timezone=Europe/Madrid`. No auth.

The function returns an object with: `temperature_c` (number), `conditions` (bilingual `{es, en}` string), `wind_speed_kmh` (number), `wind_direction` (number, degrees), `wind_name` (one of `Levante`, `Poniente`, `Variable`).

Wind name derivation rule from the spec: 60–120° → Levante, 240–300° → Poniente, otherwise Variable.

Weather code (Open-Meteo's WMO code) needs to be mapped to a short bilingual conditions string. A small lookup table covering the common cases (clear, partly cloudy, cloudy, fog, drizzle, rain, snow, thunderstorm) is enough. Unknown codes fall back to "variable" / "variable".

In-process caching: 30 minutes. Implement as a module-level cached object holding `{ data, fetchedAt }`. On each call, check the timestamp; serve cache if fresh, otherwise refetch. Spec mentions an optional Firestore-backed cache at `config/weather_cache` — keep it in-process for v1; revisit only if cold-start variance matters in production.

Error handling: if the fetch fails (network, non-200 status, malformed payload), the function should throw. The tool executor catches and returns `{output: {error: "weather_unavailable"}, errored: true}` so Claude apologizes gracefully rather than inventing weather data.

### Tool wire-up

In `claude/tools.ts`, the `executeTool` switch currently routes `"get_current_weather"` to the generic `stub()` helper. Replace that branch with a call to the new service. Translate any thrown error into the standard tool-error shape.

### Acceptance criteria

- A real HTTP request to Open-Meteo returns a sensible payload (manually verifiable via `curl` once the URL is composed).
- The smoke script run with `--text "qué tiempo hace en Tarifa?"` produces a reply with real numbers and the correct wind name.
- A second turn within 30 minutes hits the in-process cache (verifiable via log `bot.weather.cache_hit` vs `bot.weather.fetch_ok`).
- Build, lint, and existing tests pass.

### Notes / gotchas

- Open-Meteo response shape: `current.temperature_2m` is a number; `current.wind_direction_10m` is in degrees, `current.wind_speed_10m` is in km/h when no `wind_speed_unit` is specified (it defaults to km/h). Confirm against a sample response.
- Don't import `axios` for this — use built-in `fetch` (Node 24 has it). Existing code uses axios only for Meta because of the per-call response-shape pre-validation; for Open-Meteo a single `fetch` plus a Zod parse is cleaner.
- Add a small Zod schema to validate the Open-Meteo payload at the boundary; the helper in `lib/validation.ts` exists for this pattern.

---

## Task 2 — Escalation service + tool wire-up

### Goal

Replace the `escalate_to_operator` tool stub with a real implementation that writes a `bot_escalations/{auto}` doc, links it on the conversation root, and lets Claude's reply text inform the user that their request was routed.

### Spec references

- `bot/specs/02-conversation-design.md` §5 — escalation policy, what counts as an escalation, urgency tags, user-facing copy ("Te paso con mis humanos…").
- `bot/specs/04-data-model.md` §2 — `BotEscalation` schema (all required fields).
- `bot/specs/07-knowledge-base.md` §5.10 — `escalate_to_operator` tool definition.

### Files to create

- `functions/src/bot/services/escalation.ts` — exposes `createEscalation(args)` and `linkEscalationToConversation(phone, escalationId)`.

### Files to modify

- `functions/src/bot/claude/tools.ts` — replace the `execEscalateToOperator` stub. This will need additional context (guest uid, guest phone, guest language, triggering inbound message id and text) that aren't currently on `ToolContext`.
- `functions/src/bot/claude/tools.ts` — extend the `ToolContext` interface to carry: `guestId` (uid), `guestLanguage` (already present as `language` — fine), `inboundMessageId` (Meta wamid), `inboundText` (current user message).
- `functions/src/bot/claude/pipeline.ts` — `runTurn` accepts these extra fields on `PipelineInput` and forwards them into the `ToolContext` it builds.
- `functions/src/bot/handlers/conversation.ts` — `handleInboundText` already has all this in scope; forward the extra fields into the `runTurn` call.

### Behavior

The service exposes a function that takes: `guestId`, `guestPhone`, `guestLanguage`, `reason`, `summary`, `urgency`, `triggeringMessageId`, `triggeringMessageText`. It creates a new doc in `bot_escalations` (auto-id) with all the fields from the `BotEscalation` interface, `status: "open"`, `createdAt` via server timestamp, `conversationPhone` equal to `guestPhone`.

A second function updates the corresponding `bot_conversations/{phone}` root with `unresolvedEscalationId` pointing at the new escalation's id. This is what enables the admin UI's "this conversation has an open escalation" badge in Phase 4.

The tool executor calls both in sequence (create, then link), then returns `{output: {ok: true, escalation_id: <id>}}`.

Side-effect tracking already supported by the pipeline: the existing `ToolResult.sideEffect` union has an `escalation_recorded` variant. Populate it so the handler can log/observe that an escalation happened on this turn.

### ToolContext extension

The current `ToolContext` carries `phone`, `language`, `requestId`. Add the four fields named above. Every caller of `executeTool` needs to construct the richer context — there's only one (the pipeline) so this is a small, contained change.

### Acceptance criteria

- A turn where Claude calls `escalate_to_operator` creates a `bot_escalations` doc with all spec fields populated (verify in Firestore console).
- The `bot_conversations/{phone}` root gets `unresolvedEscalationId` set.
- Claude's user-facing reply is on-persona (the spec's "Te paso con mis humanos…" or its EN equivalent — Claude composes this from the system prompt, no template needed).
- The audit log entry for the outbound has `outcome: "escalated"` (extend `appendMessage` outcome enum if it doesn't include this — check the type definition before adding).
- Build, lint, and tests pass.

### Notes / gotchas

- The spec's `BotEscalation` includes `guestLanguage` — use the resolved per-turn language, not the stored field, because the stored field may have been updated mid-turn.
- `urgency` defaults to `normal` per spec; the tool input schema already enums it. Validate via the schema before writing.
- Multiple escalations per conversation are allowed; `unresolvedEscalationId` always points at the most recent open one. Phase 4 admin UI will let operators close them.
- The webhook handler currently logs `bot.conversation.side_effects_pending` for any side effect. The escalation case now becomes a real side effect — keep the log line but consider renaming to reflect that escalations are no longer pending.

---

## Task 3 — Media handler (photo intake)

### Goal

Process inbound image messages: download from Meta, upload to Cloudinary, create a `feed_posts/{auto}` doc with `status: "pending_moderation"`, ack the user in Thora's voice based on their stored `photoConsent` value.

**Out of scope for this task:** vision / face recognition (Claude analyzing the photo against dossier reference photos to identify guests). That's a Phase 3.5 follow-up that requires operator dossier content (`pre-implementation-checklist.md` §1.2). For now, the handler just stores the photo and acks — no Claude turn, no recognition. Video, audio, document, and sticker stay deferred too; only `mediaType === "image"` is handled.

### Spec references

- `bot/specs/02-conversation-design.md` §4 row "Photo / album", §9 (edge cases for media), §11 (forbidden topics around photo content).
- `bot/specs/04-data-model.md` §1 — `FeedPost` schema.
- `bot/specs/07-knowledge-base.md` §11 — vision pipeline (steps 1–3, 6 — recognition steps 4–5 are skipped here).
- `bot/specs/08-integration-contract.md` §6 — Cloudinary integration; §1.3 — media message payload shape.

### Files to create

- `functions/src/bot/handlers/media.ts` — top-level dispatcher for `kind === "media"` events. Routes by `mediaType`.
- `functions/src/bot/whatsapp/media.ts` — Meta Graph API client for media: fetches the media URL by id, downloads the binary with auth header.
- `functions/src/bot/services/photos.ts` — writer for `feed_posts/{auto}`; takes the Cloudinary upload result + guest context and creates the doc.
- `functions/src/bot/lib/cloudinary.ts` — small client wrapping the Cloudinary unsigned upload REST endpoint.

### Files to modify

- `functions/src/bot/webhook/handler.ts` — the current `dispatchEvent` skips non-text inbound with `bot.webhook.skip_non_text_phase1`. Replace that for the `media` kind with a call into the new media handler. Keep `unsupported`, `status`, `interactive` skip behavior unchanged.
- `functions/src/bot/lib/config.ts` — add `CLOUDINARY_API_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET` (or whatever the operator named the unsigned preset — see `pre-implementation-checklist.md` §0). Add to `WEBHOOK_SECRETS` binding.
- `functions/src/bot/services/audit.ts` — verify `BotMessageType` includes `"image"` and that `appendMessage` writes `cloudinaryPublicId` correctly. The current scaffold supports these fields; double-check.

### Behavior

The handler runs through this sequence for an inbound image:

1. **Dedupe** — same as text inbound: claim via `claimMessageId` from `webhook/dedupe.ts`. Already done by the webhook before dispatch.
2. **Allowlist** — call `decideInbound(phone)` (same module the conversation handler uses). Unknown phone gets the polite refusal and a `bot_unknown_inbound` log entry; no upload.
3. **Rate limit** — same `recordInboundAndCheck(phone)` as text. Over-limit triggers the throttle notice once per bucket.
4. **Touch guest** — `touchGuestOnInbound(guest)` so the CSW window updates.
5. **Conversation root** — `upsertConversationRoot({phone, guestId, language})`.
6. **Audit inbound** — append an inbound message of `type: "image"` with the Meta `mediaId` and the message id.
7. **Download from Meta** — two-step: fetch `GET /{media_id}` to get a temporary URL, then download that URL with the access token in the Authorization header. Read into a buffer.
8. **Upload to Cloudinary** — POST to `https://api.cloudinary.com/v1_1/{cloud}/auto/upload` with multipart form data: `file` (the buffer), `upload_preset`, optional `tags=whatsapp,bot,pending_moderation`. Read back `public_id`, `secure_url`, `width`, `height`, `format`.
9. **Write feed_posts** — create a doc with: `guestId`, `source: "whatsapp"`, `cloudinaryPublicId`, `cloudinaryUrl` (secure_url), `mimeType`, `width`, `height`, `status: "pending_moderation"`, `consent` (from guest's `photoConsent`: granted/declined/pending), `weddingDay` (computed from `createdAt` via `dayOfWedding` from `lib/time.ts`), `createdAt` (server timestamp).
10. **Ack the user** — send a Thora-voiced text via `sendText`. The copy depends on consent:
    - Consent granted (or default for Phase 3): warm ack referencing the album reveal on Sunday May 31 at 20:00.
    - Consent declined: "Recibida 🐾 Queda guardada para mis humanos. No va al álbum compartido."
    - Consent unknown: neutral ack, mention that the operator will follow up out-of-band.

    These strings should live in `lib/i18n.ts` as new bilingual constants (so they're consistent with the existing fallback/refusal copy).
11. **Audit outbound** — append the outbound text with `cloudinaryPublicId` and `outcome: "replied"`.

If any step fails (download, upload, Firestore write), log loudly with the requestId; if the upload itself failed, ack the user with the "I got your photo but something went wrong saving it, can you re-send?" copy from `02-conversation-design.md` §9.

### Non-image media types

For Phase 3, keep audio/video/document/sticker as skip-with-log. Distinct log events per type are useful for ops review:

- Audio → ack with "🐾 No tengo orejas digitales — escríbemelo y te ayudo." (per spec §9).
- Document → ack with "🐾 Veo el documento pero no leo PDFs. ¿De qué se trata?" (per spec §9).
- Sticker → light "🐾" ack (per spec §9).
- Video → same as audio for now; revisit if there's demand.

These acks are short enough that the handler can just route them to a small switch on `mediaType` and call `sendText` directly without a service.

### Acceptance criteria

- Sending a photo from your allowlisted phone produces a `feed_posts/{auto}` doc with `status: "pending_moderation"` and a valid `cloudinaryUrl` you can open in a browser.
- The audit log shows inbound `type: "image"` and outbound `type: "text"` with the right cloudinary references.
- Ack arrives in your language within a few seconds.
- Sending an audio message produces the "no ears" ack.
- Build, lint, tests pass.

### Notes / gotchas

- **Cloudinary preset** must exist with the name the code expects. Per `pre-implementation-checklist.md` §0, the operator set this up during Phase 1 setup. Confirm by checking the Cloudinary console or asking the operator. The spec says preset name `wedding_photos_pending`; verify or update the config constant.
- **Media URL is single-use and short-lived.** Download immediately; don't queue the URL for later.
- **Auth header on download.** The URL returned from `GET /{media_id}` requires the same `Authorization: Bearer <token>` header on the actual download request, even though it's a different domain.
- **File size**: Meta caps images at ~5MB, videos at ~16MB. Don't try to read more than 20MB into memory.
- **Privacy.** Never log the Cloudinary URL at INFO level — it grants access to the photo. Use `bot.media.uploaded` with just `publicId` and `bytes`.
- **No Claude call.** This handler doesn't invoke the pipeline. Recognition (which would need Claude + the dossier reference photos in the system prompt) is the deferred Phase 3.5 work.

---

## Task 4 — KB rebuild Firestore trigger

### Goal

Auto-invalidate the bot's in-process KB cache when any watched content collection is edited, so the next bot turn rebuilds the KB block from fresh data without a manual redeploy.

### Spec references

- `bot/specs/07-knowledge-base.md` §2 — sources of truth table and refresh trigger column.
- `bot/specs/08-integration-contract.md` §3.4 — Firestore trigger definition.
- `bot/specs/04-data-model.md` §2 — `BotKbVersion` schema for the singleton doc.

### Files to create

- `functions/src/bot/triggers/onContentChangeBuildKb.ts` — the trigger function. New `triggers/` subdirectory under `src/bot/`.

### Files to modify

- `functions/src/bot/index.ts` — re-export the trigger so it's bundled with the bot.
- `functions/src/index.ts` (the project root) — re-export from the bot's index, the same way `whatsappWebhook` is currently exported.

### Behavior

The function listens to writes on the watched collections: `events/{id}`, `venues/{id}`, `faq/{id}`, `time_gated_content/{id}`, and `config/{id}`. Use `onDocumentWritten` from `firebase-functions/v2/firestore` for create/update/delete coverage.

On any write event:

1. Read the current `bot_kb_version/_singleton_` doc. If absent, treat as version 0.
2. Compute a new version: `version + 1`.
3. Compute a fresh hash. Hashing the full rebuilt KB string is the most correct approach, but slow (each trigger rebuilds the KB). A cheaper alternative: hash the change descriptor (`<collection>/<docId>:<timestamp>`) so the doc is unique-per-event without rebuilding. Pick the cheap path for now; document the choice in a comment. The bot's `getKb()` reacts to version change, not hash change — the hash is informational for the admin UI.
4. Write the singleton doc with: `version` (incremented), `hash`, `updatedAt` (server timestamp), `changedSource` (e.g. `"events/event_dinner_fri"`).

The bot's existing `getKb()` already consults this version on each turn — bumping the version invalidates the in-process cache automatically on the next inbound.

### Deploy considerations

- Trigger region: `europe-west1` (match `BOT_REGION` from `lib/config.ts`).
- The function should declare it does not need secrets — it's purely a Firestore→Firestore op.
- Watched collections: register one trigger per collection path using a glob like `events/{eventId}`. Firebase v2 triggers each have their own deployment unit, so there will be 5 separate functions. Name them descriptively: `botKbBumpOnEvents`, `botKbBumpOnVenues`, etc.

### Avoiding recursion

`config/{id}` is one of the watched collections, and `config/bot` is also written by the admin UI (Phase 4) and by the bot itself when settings change. Bumping the KB version on every `config/bot` write is fine — the next turn will rebuild, see no semantic change, and the cache settles. There's no actual recursion since the trigger writes to `bot_kb_version`, which is NOT in the watched set. Confirm `bot_kb_version` is not under any watched path.

### Acceptance criteria

- After deploying, editing an `events/{id}` doc in the Firebase console bumps `bot_kb_version/_singleton_.version` within a few seconds.
- The next bot turn after the bump produces a reply that reflects the change (verifiable by, e.g., adding a description to an event and asking about it).
- `bot_kb_version.changedSource` accurately identifies which doc triggered the rebuild.
- Build, lint, tests pass.
- Cold start of `whatsappWebhook` no longer needs to rebuild from scratch on every cold start if the singleton is fresh — the in-process cache picks up via the version check.

### Notes / gotchas

- Multiple triggers firing in quick succession (e.g. an operator bulk-edits events) cause multiple version increments. That's fine — bot turns just pick up the latest. No transactionality needed because the version monotonically grows.
- The cheap-hash approach (hash the change descriptor) means the hash doesn't actually represent KB content. That's deliberate — the bot's cache check is version-based, and the hash is just for observability. If we later want it for cache validation, we can switch to hashing the rebuilt KB.
- The trigger uses Admin SDK to write `bot_kb_version`, which bypasses security rules — consistent with all other bot writes.
- Add the trigger functions to whatever deploy command you use. If the operator deploys with `firebase deploy --only functions:whatsappWebhook`, the triggers won't ship. Either change the deploy target to a group (e.g. `functions:bot`) or document the new function names in the deploy doc.

---

## Cross-cutting requirements

These apply to all four tasks.

### Order of operations within a session

Build → lint → tests after every meaningful change. If anything fails, stop and fix before moving on. The Phase 2 scaffold passes all three; regressions are blockers.

### What NOT to touch

These are intentionally out of scope; leave them as-is:

- **System prompt** (`claude/system-prompt.ts`). Block A is verbatim spec prose; do not paraphrase or "improve" it. If a tool's behavior changes such that the prompt needs updating, surface it as a question rather than editing.
- **KB structure** (`claude/kb.ts`). The current renderer covers schedule + venues + lockdown + locked-state sections. Don't add new sections — the richer sections need operator content that hasn't landed.
- **Tool definitions** (`claude/tools.ts` — the `TOOLS` constant). These match the spec's `input_schema`s and Claude is calibrated against them. Only modify the executors, not the schemas.
- **Stubbed tools** other than the two named in this plan (`lookup_couple_facts`, `lookup_guest_dossier`, `lookup_tarifa_guide`, `lookup_seating`, `moderate_song_request`, `resolve_spotify_track`, `send_location_pin`, `trigger_flow`). These need either operator content, Meta approval, or separate work streams.
- **Templates and Flows.** Phase 3 in the parent plan includes template registry and Flow handlers. Both are blocked on Meta approval; not in this subset.
- **Mid-conversation language switch debounce.** Known follow-up; not in this subset.
- **Allowlist or rate-limit behavior.** Phase 2 covers these; behavior is correct as scoped.
- **Existing tests** (`functions/test/bot/*.test.cjs`). Don't break them. If a change requires updating an assertion, document why in the commit/summary.

### Logging conventions reminder

Every new log event follows `bot.<subsystem>.<event>`. Structured fields go in the second argument. Always include `requestId` when one is in scope. Never log full phone numbers (`maskPhone` first), full message bodies, Cloudinary URLs (publicId only), Anthropic API responses, or any secret value.

### Adding new secrets

When a task introduces a new secret (Cloudinary in Task 3): declare it in `lib/config.ts` via `defineSecret`, add it to the appropriate secret-binding group (`WEBHOOK_SECRETS` for anything the webhook needs), and document that the operator must `firebase functions:secrets:set <NAME>` before the next deploy. Do not invent placeholder values; if the secret is unset at runtime the function should fail loudly.

### Verification per task

Each task's own acceptance criteria lists the smoke tests. After completing all four, do a final integration pass:

- `firebase deploy --only functions:whatsappWebhook,functions:botKbBumpOnEvents,functions:botKbBumpOnVenues,functions:botKbBumpOnFaq,functions:botKbBumpOnTimeGated,functions:botKbBumpOnConfig` (or whatever the chosen trigger function names are).
- Send a photo → verify the new `feed_posts` doc.
- Send "what's the weather?" → verify a real weather reply.
- Send "I need to talk to a real person" → verify a `bot_escalations` doc.
- Edit an event → verify the version bump and that the next turn reflects the edit.

---

## Final summary the agent should produce

When the work is done, the agent's wrap-up should include:

1. **Files created and modified** — exact paths.
2. **Build / lint / test status** — green or list of remaining issues.
3. **Deploy notes** — any new functions, new secrets required, deploy command suggestions.
4. **Decisions made under ambiguity** — anywhere the spec was unclear and a choice was made; surface so the operator can review.
5. **What's NOT done** — explicit list of the out-of-scope items so it's clear the gap is intentional.
6. **Suggested commit message** following the repo's lowercase, descriptive style (see recent commits via `git log --oneline -10`).
