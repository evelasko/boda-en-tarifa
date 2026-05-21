# Agent Prompt — Phase 3 Subset Implementation

> Self-contained briefing for a coding agent (LLM) tasked with executing `bot/docs/phase-3-subset-plan.md`. Copy the section under "Prompt" below into a fresh agent session. The agent does NOT have access to this conversation; the prompt assumes nothing.

---

## How to use

1. Make sure the repo is clean (`git status`) and on the branch you want the work to land on.
2. Confirm the prerequisites in the "Operator-side prerequisites" section below.
3. Open a fresh agent session (a new Claude Code conversation, another LLM coding tool, etc.).
4. Paste the entire "Prompt" block as the agent's initial instruction.
5. When the agent finishes, review its summary against the plan's "Final summary the agent should produce" section, then verify the working tree changes before committing.

---

## Operator-side prerequisites

The agent's work assumes these are already in place. Confirm before kicking off:

- The repository is at `/Users/henry/Workbench/White Hibiscus/dev/boda-en-tarifa`.
- Phase 2 is deployed and tested (per `bot/docs/phase-2-test-plan.md`).
- `firebase` CLI is installed and the user is logged into the right project.
- Cloud Functions secrets are set: `WHATSAPP_*`, `ANTHROPIC_API_KEY`.
- Cloudinary account exists with an unsigned upload preset configured (per `bot/docs/pre-implementation-checklist.md` §0). The preset name (default per spec: `wedding_photos_pending`) and the Cloudinary cloud name will be needed by the agent — provide them or confirm the agent should ask.
- The `ANTHROPIC_API_KEY` is available in the local environment for smoke testing (`export ANTHROPIC_API_KEY=sk-...`).

If the Cloudinary preset doesn't exist yet, Task 3 (media handler) can still be coded but cannot be end-to-end tested. The agent should flag this and complete the other tasks.

---

## Prompt

Copy everything from the line below through the end of the file into the agent session.

---

You are an implementation engineer working on a WhatsApp bot for a wedding in Tarifa, Spain. The bot is a Cloud Functions service that receives Meta WhatsApp Cloud API webhooks, runs a Claude (Anthropic) conversational pipeline grounded in a Firestore-backed knowledge base, and replies in Thora's voice — Thora being the couple's dog, the bot's in-fiction author.

The repository is at `/Users/henry/Workbench/White Hibiscus/dev/boda-en-tarifa`. The bot code lives under `functions/src/bot/`. The bot's design and specs live under `bot/specs/` and `bot/docs/`.

### Your task

Implement the four pieces of work described in `bot/docs/phase-3-subset-plan.md`. Read that document in full before doing anything else — it is the authoritative spec for what you're building. The four tasks are:

1. Weather service + tool wire-up
2. Escalation service + tool wire-up
3. Media handler (photo intake — storage and ack only; NO vision / face recognition)
4. KB rebuild Firestore trigger

The plan document describes the goal, spec references, files to create or modify, expected behavior, acceptance criteria, and gotchas for each task. It deliberately contains no code or pseudocode — your job is to translate the prose into working TypeScript that fits the existing patterns.

### Required reading before you start

In order:

1. `bot/docs/phase-3-subset-plan.md` — the plan itself, in full.
2. `bot/docs/implementation-plan.md` — Phase 3 section, for context on how this subset fits into the parent plan.
3. `functions/src/bot/index.ts` and the exports it leads to — to understand the current bot module shape.
4. `functions/src/bot/webhook/handler.ts` — the entry point you'll modify for Task 3.
5. `functions/src/bot/claude/tools.ts` — the tool registry and dispatcher you'll modify for Tasks 1 and 2.
6. `functions/src/bot/handlers/conversation.ts` — the main conversation handler, for understanding the patterns the new media handler should follow.
7. `functions/src/bot/services/guests.ts` and `services/audit.ts` — the data-access patterns you'll mirror in `services/weather.ts`, `services/escalation.ts`, `services/photos.ts`.
8. `functions/src/bot/lib/config.ts` — secret declarations and constants.
9. `functions/.eslintrc.js` and `functions/tsconfig.json` — lint and TS configuration; new code must match these.
10. The relevant spec sections referenced from the plan for each task.

You do NOT need to read every file in `bot/specs/` end to end. The plan's spec references point at specific sections (e.g. "§5.6") — read those when you reach the corresponding task.

### Working environment

- macOS (Darwin). Node 24. Shell is zsh.
- TypeScript with NodeNext ESM. Relative imports require explicit `.js` suffix.
- Run `cd functions && npm run build` to compile, `npm run lint` for lint, `npm test` for the 38 existing jest tests.
- For dev scripts (not deployed), use tsx: `npx tsx functions/scripts/<file>.ts`.
- The Claude pipeline smoke script at `functions/scripts/smoke-pipeline.ts` runs one turn against seeded Firestore data with no Meta involvement — useful for verifying Tasks 1 and 2 without deploying. Requires `ANTHROPIC_API_KEY` env var.

### Conventions you must follow

- File layout: place new code in the closest existing subdirectory under `src/bot/` (`services/`, `handlers/`, `whatsapp/`, `lib/`). The plan tells you exactly which directory each new file belongs in.
- Module system: NodeNext ESM, `.js` suffix on relative imports, `target: es2017`, `strict: true`.
- Lint: double quotes, 2-space indent, max-len 80. `require-jsdoc` and `valid-jsdoc` are disabled — write JSDoc when it explains *why* (a constraint, an invariant, a non-obvious decision), skip when it would just duplicate the TypeScript types.
- Logging: use `firebase-functions/logger`. Event names use the pattern `bot.<subsystem>.<event>` (e.g. `bot.weather.fetch_ok`, `bot.escalation.created`). Always include `requestId` when in scope. Never log full phone numbers (use `maskPhone` from `lib/phone.ts`), full message bodies, Cloudinary URLs (publicId only), or any secret value.
- Error handling: webhook handlers must never let exceptions reach Meta (returns 200 always, except 401 on signature failure). Tool executors return `{output: {error: "<reason>"}, errored: true}` on failure so Claude can apologize rather than improvise.
- Firestore: use `getFirestore()` directly (Admin SDK; bypasses security rules — all bot writes are server-only). Use `FieldValue.serverTimestamp()` for server-set timestamps and `FieldValue.increment()` for counters. Reach for transactions only when read-modify-write is required.
- Secrets: declare in `lib/config.ts` via `defineSecret`. Add to `WEBHOOK_SECRETS` (or another appropriate group) so they get bound to the function. Read via `.value()` inside the handler, never at module load.
- Don't add features beyond what the plan specifies. If you find a tempting refactor, leave it for later and mention it in your wrap-up summary.

### What NOT to touch

The plan's "What NOT to touch" section is binding. In particular:

- Do not modify `claude/system-prompt.ts` (Block A is verbatim spec prose).
- Do not modify `TOOLS` definitions in `claude/tools.ts` — only the executors in the `executeTool` switch.
- Do not implement the other stubbed tools (`lookup_couple_facts`, `lookup_guest_dossier`, `lookup_tarifa_guide`, `lookup_seating`, `moderate_song_request`, `resolve_spotify_track`, `send_location_pin`, `trigger_flow`). They need operator content or external integrations that aren't ready.
- Do not modify the existing webhook signature verification, dedupe, classification, or rate-limit logic.
- Do not modify the existing 38 unit tests unless a task requires it; if you do, document why.

### Order in which to do the work

The four tasks are independent but vary in surface area. Recommended order:

1. **Weather** — smallest, fastest feedback loop (smoke script verifies end-to-end).
2. **KB trigger** — smallest infrastructure piece; no behavior change to the conversation path, easy to verify in isolation.
3. **Escalation** — touches `ToolContext` and the pipeline; modest plumbing change but well-bounded.
4. **Media handler** — largest piece; new external integration (Cloudinary) and biggest set of new files. Save for last when you have momentum.

### Verification per task

The plan lists acceptance criteria for each task. After completing each one:

1. `cd functions && npm run build` — must be clean.
2. `cd functions && npm run lint` — must be clean.
3. `cd functions && npm test` — all 38 existing tests must still pass.
4. Task-specific smoke test from the plan (smoke script for Tasks 1–2; manual deploy for Tasks 3–4).

If a check fails, stop and fix before moving to the next task. Don't carry broken state across task boundaries.

### Edge cases and ambiguity

When you hit something the plan doesn't fully specify:

- Prefer the most spec-aligned default. The specs in `bot/specs/` are the source of truth.
- If two specs disagree, the more recent or more specific one wins. Note the conflict in your wrap-up.
- If you genuinely can't decide, leave a `// TODO(phase-3-subset): <question>` comment with the question and pick the safest default. Don't block on it.
- If you discover that an "out of scope" item is actually a hard dependency for an in-scope task, stop and surface the question rather than expanding scope.

### Deliverable

When you're done:

1. **Do not commit.** Leave the working tree with all changes uncommitted. The operator will review and commit.
2. Produce a written summary covering, per the plan's "Final summary" section:
   - Files created and modified, with exact paths.
   - Build / lint / test status (green or list of remaining issues).
   - Deploy notes — new function names, new secrets required, suggested deploy command.
   - Decisions made under ambiguity — anywhere the spec was unclear and you made a choice.
   - What's NOT done — explicit list of out-of-scope items so the gap is intentional and visible.
   - Suggested commit message following the repo's lowercase, descriptive style (run `git log --oneline -10` to see recent examples).

### What success looks like

- All four tasks have working implementations matching the plan's acceptance criteria.
- The build, lint, and existing test suite are green.
- The Claude pipeline smoke script still works against the new tool implementations.
- The deployed function (after the operator's review and deploy) behaves as the plan specifies for photos, weather questions, escalation requests, and content edits.
- Nothing out of scope was touched.

Get started by reading the plan document at `bot/docs/phase-3-subset-plan.md`. Then build it out task by task, verifying at each step. Good luck.
