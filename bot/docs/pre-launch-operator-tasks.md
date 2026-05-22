# Pre-Launch Operator Tasks (KB Pipeline)

> Everything you (Enrique) need to do before Saturday May 23 to get Thora's first guest broadcast out cleanly. Scope: the **KB pipeline** that was implemented on 2026-05-22 — these tasks bring the locally-authored data files into Firestore and ship the new functions code to production.
>
> **Wedding**: 2026-05-30. **First broadcast**: 2026-05-23 (T-7). **Today**: 2026-05-22.
>
> Out of scope here: dossier authoring (continues until Sun May 24), reference-photo upload (Stage 3, Tue May 26), Meta template approval, Meta Flow submission, and the broadcast trigger itself. Those are tracked in `bot/docs/pre-implementation-checklist.md`.

---

## Why these tasks matter

The KB pipeline implemented this session has three moving parts:

1. **Local data files in `bot/data/`** — canonical source of truth, version-controlled in git.
2. **`bot/scripts/sync-kb.mjs`** — pushes those files into Firestore.
3. **Firestore triggers + bot Cloud Functions** — read from Firestore, render into Thora's cached system prompt on every turn.

For the first broadcast on May 23, all three need to be in a working state:
- Local files populated (no TODOs that would embarrass Thora).
- Firestore mirroring what's local.
- Functions deployed with the new triggers, renderer, and tool wiring.

Each task below carries the context you need to do it well — what it is, why it matters, where the files live, and what success looks like.

---

## Task index

| # | Task | Blocks broadcast? | Owner |
|---|---|---|---|
| 1 | Pick a Firebase service-account JSON and set credentials | Yes | Operator |
| 2 | Install bot-script deps (`firebase-admin`) | Yes | Operator |
| 3 | Align dossier folder names with `guests/{slug}` doc IDs | Yes | Operator |
| 4 | Fill the critical `TODO` markers in the new YAML files | Yes (the critical subset) | Operator |
| 5 | Preview the sync with `just sync-kb-diff` | Yes | Operator |
| 6 | Run `just sync-kb` for real | Yes | Operator |
| 7 | Deploy the functions (new triggers + renderer + moderation tool) | Yes | Operator |
| 8 | Manual smoke test from a test phone | Yes | Operator |
| 9 | Decide whether to fully fill or hide TODO FAQ entries before broadcast | Yes (UX) | Operator |
| 10 | Set the `welcome_onboarding` template payload variables, if any | Out of KB scope but listed for completeness | Operator |

---

## Task 1 — Pick a Firebase service-account JSON and set credentials

### What

The sync script (`bot/scripts/sync-kb.mjs`) writes to your live Firestore. It uses the Firebase Admin SDK, which needs a service-account JSON key. You almost certainly already have one (the `ops-magic-links` and `ops-guest-audit` scripts use the same mechanism — see `Justfile` `env-check`).

### Why

Without credentials, the script can't authenticate and the sync will fail at startup with a clear error. The script supports two ways to point at the key:

1. **`GOOGLE_APPLICATION_CREDENTIALS`** environment variable (same as the existing ops scripts use). This is the default and most flexible — set it once in your shell profile.
2. **`FIREBASE_SERVICE_ACCOUNT_PATH`** in `bot/.env`. Use this if you'd rather isolate the bot's credentials from other scripts.

### How

**Option A (recommended — reuse the existing ops setup):**

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/abs/path/to/firebase-service-account.json"
just env-check   # should show "✅ GOOGLE_APPLICATION_CREDENTIALS is set"
```

If you want this to persist across shell sessions, add the `export` line to `~/.zshrc` (or `~/.bash_profile`).

**Option B — bot-specific:**

Open `bot/.env` and add:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=/abs/path/to/firebase-service-account.json
```

### Service-account permissions

The key needs Firestore read+write on these collections:

- `events`, `venues`, `accommodations`, `faq` (writes)
- `guest_dossier` (writes)
- `config` (writes — specifically `config/couple`, `config/dress_codes`, `config/wind_tips`, `config/travel`, `config/tarifa_guide`, `config/bot_kb_extras`)
- `guests` (reads only — needed to look up `phoneE164` for dossier denormalization)

A standard Firebase admin service-account (with the `roles/datastore.user` or full Firestore Admin role on your project) covers all of this. If you're using the same key as `ops-guest-audit`, you're set.

### Done when

`just env-check` shows the credential as set, and you have not yet touched any other step.

---

## Task 2 — Install bot-script deps

### What

The sync script depends on `firebase-admin@13.x` and `yaml@2.x`. The `firebase-admin` dep was newly added in this session and isn't in your local `bot/scripts/node_modules/` yet (unless I already ran `npm install` during the implementation, which I did once — verify on your machine).

### Why

Running the script without the dep installed yields `ERR_MODULE_NOT_FOUND` for `firebase-admin`.

### How

From the repo root:

```bash
just setup-bot-scripts
```

That runs `npm --prefix bot/scripts install`. Re-runs are safe — `npm install` is idempotent.

### Done when

```bash
ls bot/scripts/node_modules/firebase-admin
```

shows a directory (no error).

---

## Task 3 — Align dossier folder names with `guests/{slug}` doc IDs

### What

In `bot/data/guest-dossiers/`, every folder name now functions as the canonical guest identifier. The folder name must match the existing `guests/{slug}` Firestore document ID for that guest.

Currently your 18 dossier folders use human-readable slugs (`ada-ada-francoy`, `javier-otero`, etc.) and the sync script will look up `guests/ada-ada-francoy` in Firestore to denormalize the phone number and name.

### Why

You said: *"I will use the same guest document id of each guest in Firestore (guests collection) as the name of each guest's folder."* The `guests/` collection is keyed by Firebase Auth UID (per `functions/src/bot/services/guests.ts` line 13–18). That means your folder names need to match those UIDs — which are typically random strings, not human-readable slugs.

You have two options:

**A. Rename the folders** to match the actual UIDs in your `guests/` collection (typical Firebase Auth UIDs look like `0wHKBfTw3VOXxMmZqJ8jVNkbDgK2`).

**B. Add a parallel guest doc keyed by the slug** (`guests/ada-ada-francoy` etc.) for each dossier'd guest. This works if you have a reason to keep slugs (e.g., the existing folder names are easier to author against).

For 18 guests, **option A is the cleaner long-term move**. The sync script will fail-loudly on any mismatched folder, listing exactly which slugs don't exist in `guests/`.

### How

1. Open the Firebase console → Firestore → `guests` collection. For each of the 18 dossier'd guests, find their existing `guests/{uid}` document.
2. Rename the local folder `bot/data/guest-dossiers/{old-slug}` → `bot/data/guest-dossiers/{actual-uid}`. The file inside (`dossier.yaml`) stays put; only the parent folder name changes.
3. Update the `# Path:` line inside each renamed `dossier.yaml` to reflect the new folder name. The `Target Firestore doc:` line should also be updated.

A useful sanity check: the 18 currently-authored guests are:

```
ada-ada-francoy, agnes-maroto, alberto-andrada, beatriz-caballero,
cristina-alvarez, cristina-sanz, estefania-salgado, fernando-morate,
ismael-alonso, javier-otero, jordi-perez, laura-martin, laura-peralta,
manuel-sanz, manuel-sanz-jr, maria-victoria-diaz, montse-simon,
sergio-castro
```

Each of these needs to map to an existing `guests/{uid}` doc.

### Shortcut for option A

If you have a Firebase Auth user list export with `email + uid + fullName`, you can build a sed script or manual rename map. If you don't, the fastest path is:

1. In Firestore, query `guests` and copy each relevant guest's UID into a notes file.
2. Use `mv` from the terminal:
   ```bash
   cd bot/data/guest-dossiers
   mv ada-ada-francoy 0wHKBfTw3VOXxMmZqJ8jVNkbDgK2   # example UID
   ```
3. After all renames, update the `# Path:` and `# Target Firestore doc:` lines inside each `dossier.yaml`. A short perl one-liner does this in one pass:
   ```bash
   for d in bot/data/guest-dossiers/*/; do
     slug=$(basename "$d")
     perl -i -pe "
       s|^# Path: bot/data/guest-dossiers/[^/]+/dossier\.yaml|# Path: bot/data/guest-dossiers/$slug/dossier.yaml|;
       s|^# Target Firestore doc: guest_dossier/[^ ]+|# Target Firestore doc: guest_dossier/$slug|
     " "$d/dossier.yaml"
   done
   ```

### Done when

`just sync-kb-diff --only guest-dossiers` reports **0** missing guests. Anything > 0 means one or more folder names don't match a `guests/{slug}` doc; reconcile before proceeding.

---

## Task 4 — Fill the critical `TODO` markers in the new YAML files

### What

I created 9 new YAML files in `bot/data/` and seeded them with everything I could extract from `bot/specs/couple-dossier.md`, `bot/docs/pre-implementation-checklist.md`, and the existing dossiers. Anywhere I couldn't infer the answer, I left a `TODO` marker with a comment explaining what's needed.

Not every TODO is launch-blocking — some are nice-to-haves that can be filled in during the week. The "critical" subset below must be filled before the broadcast on May 23, because guests will absolutely ask about these in the first hours.

### Why

Thora's KB-grounded answers are only as good as what's in the KB. A TODO that ships to production becomes a Thora response like "TODO — operator pendiente de confirmar dónde aparcar" — embarrassing and breaks the persona.

### Critical TODOs (must fill before May 23)

| File | Field | What you need |
|---|---|---|
| `bot/data/venues.yaml` | `carbones_13.address`, `lat`, `lng`, `maps_link` | Full address, GPS coords, Google Maps link. Thora sends a location pin from these. |
| `bot/data/venues.yaml` | `tres_mares.address`, `lat`, `lng`, `maps_link` | Same. |
| `bot/data/venues.yaml` | `casa_explora.address`, `lat`, `lng`, `maps_link` | Same. |
| `bot/data/venues.yaml` | `chiringuito_bora.lat`, `lng`, `maps_link` | Same. |
| `bot/data/venues.yaml` | `100_fun.lat`, `lng`, `maps_link` | Critical — Thora sends the bus pickup pin from this. |
| `bot/data/dress-codes.yaml` | `ceremony.code_es`, `code_en` | Decide and write the actual dress-code text. "Beach formal", "cocktail", whatever you've decided. |
| `bot/data/dress-codes.yaml` | `reception.code_es`, `code_en` | Same. |
| `bot/data/faq.yaml` | `parking_carbones.answer_*` | Self-drive parking situation. |
| `bot/data/faq.yaml` | `kids_welcome.answer_*` | Confirm kid policy. |
| `bot/data/faq.yaml` | `gifts_list.answer_*` | Gift list / bank details / nothing — whichever it is. |
| `bot/data/faq.yaml` | `casa_explora_dinner_reservation.answer_*` | Drinks only or dinner reserved? |
| `bot/data/travel.yaml` | `self_drive_ceremony.notes_*` | Parking for the handful who self-drive to Carbones 13. |
| `bot/data/couple-dossier.yaml` | `honeymoon_internal.destination` | **Internal only** — Thora knows so she doesn't accidentally hint. Never shares. Write a real value (even "Vietnam — INTERNAL") so Thora has the context. |

### Nice-to-have TODOs (can ship and update later)

| File | Field | Notes |
|---|---|---|
| `bot/data/accommodations.yaml` | `*.approx_price_range_eur_per_night`, `booking_link`, `notes_*` for Copacabana / Dulce Nombre | Most guests have already booked; less urgent. |
| `bot/data/tarifa-guide.yaml` | various `personal_note: TODO`, kite school instructor name, scuba operator, FIRMM whale-watching, etc. | If empty, the renderer skips that line — Thora just doesn't recommend that specific thing. Won't break anything. |

### How

Open each file, find the TODO, replace with the real value. Re-save. The sync script will pick up the changes on the next run.

### Done when

```bash
grep -n "TODO" bot/data/*.yaml | grep -v "tarifa-guide\|accommodations" | wc -l
```

returns close to 0 (Tarifa guide and accommodation TODOs are acceptable; everything else is critical).

---

## Task 5 — Preview the sync with `just sync-kb-diff`

### What

Before any write to Firestore, run a full preview to see what the sync would do.

### Why

`--diff` reads the current state of every target Firestore doc and shows a per-doc verdict: `ADD`, `UPDATE`, `UNCHANGED`, or `PRUNE`. This is your sanity check that:

1. Validation passes for every file (catches typos early).
2. You didn't accidentally edit the wrong file.
3. Missing-guest folders are reported (Task 3 sanity check).

### How

From the repo root:

```bash
just sync-kb-diff
```

This is equivalent to `node bot/scripts/sync-kb.mjs --all --diff`. No Firestore writes happen.

### Expected output shape

```
sync-kb: events, venues, accommodations, faq, couple, dress-codes, wind-tips, travel, tarifa-guide, bot-kb-extras, guest-dossiers [DRY-RUN] [DIFF]

▶ events
  ADD     events/pre_wedding
  ADD     events/ceremony
  ...
  4 docs (4 added, 0 updated, 0 unchanged)

▶ venues
  ...

▶ guest-dossiers
  ⚠ 0 dossier folder(s) without a matching guests/{slug} doc:
  ADD     guest_dossier/{uid_for_ada_francoy}
  ...
```

### Things to watch for

- A `[validation] <source>: <message>` line means a YAML file is malformed. Fix the file and re-run.
- A "missing dossier folder(s) without a matching guests/{slug} doc" list means Task 3 is incomplete.
- Many `UPDATE` lines on the second run suggests you've drifted from Firestore — usually fine (re-syncing is idempotent), but check that you understand what's changing.

### Done when

The diff output looks plausible, validation passes for every source, and the missing-guests list is empty.

---

## Task 6 — Run `just sync-kb` for real

### What

Same script as Task 5 but actually writes to Firestore.

### Why

This is the moment your locally-authored YAML becomes the bot's runtime KB. Every Firestore write fires a `botKbBumpOn*` trigger which bumps `bot_kb_version`, which causes the bot's in-process KB cache to rebuild on the next inbound turn.

### How

```bash
just sync-kb
```

This runs `node bot/scripts/sync-kb.mjs --all` (no flags). Upserts only; nothing gets deleted.

### Things to watch for

- A non-zero exit code means something failed. The script's standard exit codes:
  - `2` — bad CLI args
  - `3` — validation failure on a YAML file
  - `4` — missing guest folders for dossiers (Task 3 still incomplete)
  - `1` — any other unhandled error
- Each source prints a one-line summary: `events: 4 docs (4 added, 0 updated, 0 unchanged)`. Verify the counts match what you saw in the diff.

### After the sync

In Firebase console → Firestore, you should now see populated collections for `events`, `venues`, `accommodations`, `faq`, `guest_dossier`, and populated docs at `config/couple`, `config/dress_codes`, `config/wind_tips`, `config/travel`, `config/tarifa_guide`, `config/bot_kb_extras`.

Also: `bot_kb_version/_singleton_` should exist with a `version` count equal to the total number of writes.

### Re-running

You can re-run `just sync-kb` any time. Re-runs are idempotent: docs that haven't changed produce 0 writes. If you edit a YAML, just re-run — the bot picks up the change on the next turn.

### Done when

The script exits 0, the summary line for each source shows the expected counts, and Firestore mirrors the local YAML.

---

## Task 7 — Deploy the functions

### What

The functions code under `functions/src/bot/` was modified this session:

- `triggers/onContentChangeBuildKb.ts` — wildcard `config/{configId}` trigger DELETED; 6 new per-doc config triggers ADDED; `guest_dossier` and `accommodations` triggers ADDED.
- `claude/kb.ts` — full renderer for all 14 KB sections.
- `claude/today.ts` — new file; produces the dynamic per-turn block.
- `claude/system-prompt.ts` — Block A gains the song-moderation paragraph.
- `claude/tools.ts` — `moderate_song_request` description widened; real executor instead of stub.
- `services/kb-sources.ts` — new file; readers for couple, dress-codes, wind-tips, travel, tarifa-guide, bot-kb-extras, accommodations, faq, guest-dossiers.
- `services/songs.ts` — new file; the moderation logic.
- `handlers/conversation.ts` — now appends today.ts output to the per-turn user content.
- `bot/index.ts` and root `index.ts` — exports updated.

### Why

Without deploying, your test phone hits the old version of the bot. Even though the KB lives in Firestore (so a partial deploy could read updated content), the renderer doesn't know how to read the new collections, and the new triggers don't exist yet. The deploy is what makes everything coherent.

### Subtle thing about the trigger refactor

The wildcard `botKbBumpOnConfig` Cloud Function will be **deleted** by the deploy (it's not in the exports anymore). Firebase Functions deploy handles this cleanly — it diffs the deployed set against the source and prunes removed functions, prompting you for confirmation.

If you'd rather see the prompt, deploy interactively. If you want to skip the prompt, pass `--force` to the deploy command. I'd recommend running it interactively the first time.

### How

```bash
just fx-build    # one-time: TypeScript compile to verify nothing's broken
just fx-deploy   # deploys functions
```

Or, if you want to be specific:

```bash
firebase deploy --only functions:botKbBumpOnEvents,functions:botKbBumpOnVenues,functions:botKbBumpOnFaq,functions:botKbBumpOnAccommodations,functions:botKbBumpOnGuestDossier,functions:botKbBumpOnTimeGated,functions:botKbBumpOnConfigCouple,functions:botKbBumpOnConfigTarifaGuide,functions:botKbBumpOnConfigDressCodes,functions:botKbBumpOnConfigWindTips,functions:botKbBumpOnConfigTravel,functions:botKbBumpOnConfigBotKbExtras,functions:whatsappWebhook
```

(But `just fx-deploy` will deploy all bot functions, which is fine.)

### When confirming the prune

You'll see something like:

```
The following functions are found in your project but do not exist in your local source code:
  botKbBumpOnConfig
Would you like to proceed with deletion?
```

Answer `Y`. That trigger is the one we deliberately removed (it was over-bumping the KB on every operational `config/bot` write).

### Done when

`firebase deploy --only functions` exits successfully, and `firebase functions:list` shows the new function names.

---

## Task 8 — Manual smoke test from a test phone

### What

End-to-end test of Thora against a real WhatsApp test phone, covering the 6+ scenarios that prove every newly-rendered KB section actually surfaces correctly in replies.

### Why

The build compiles, lint passes, and the sync ran clean — but none of that proves Thora *uses* the new KB content well. This is the only check that does.

### Scenarios (run from a phone that's on the test allowlist)

| # | Prompt | What you're verifying |
|---|---|---|
| 1 | "¿dónde aparco en Carbones?" | Venue card + travel doc rendered. Answer should reference the bus, with self-drive note if filled. |
| 2 | "¿qué dress code el sábado?" | `config/dress_codes` rendered. Should cite the ceremony + reception codes you filled in Task 4. |
| 3 | "¿qué se puede hacer en Bolonia?" | Tarifa guide rendered. Should mention Bolonia beach, ideally with your personal note. |
| 4 | "¿hay opción sin gluten en el menú?" | FAQ entry + menu deflection (D21). Should answer dietary helpfully AND deflect on menu specifics ("menú me lo escondieron 🐾"). |
| 5 | "¿Javi sigue con el kite?" *(only if Javier Otero's dossier is loaded)* | Dossier section rendered with safe_facts. Should confirm kite-related fact in Thora's voice. |
| 6 | Send a photo from a phone whose guest is NOT in any dossier | Should reply scene-level only. NEVER invent a name. |
| 7 | "ponme Paquito el Chocolatero" | Moderation tool returns `decline_softly`; Thora should deflect softly. |
| 8 | "ponme algo de Dani Martín" | Moderation tool returns `tease_then_accept`; Thora should record AND drop a wink. |
| 9 | "ponme Get Lucky de Daft Punk" | Moderation tool returns `accept`; Thora should record warmly. |
| 10 | "¿cuándo me dices dónde me siento?" | Today's-situation block + locked-content rule. Before May 30 19:30: Thora deflects ("el sábado 30 a las 19:30 🐾 Suspense"). |

### How

Plain WhatsApp inbound from the test phone. Read each reply against the expected behavior. If a scenario fails:

- Look at Cloud Logs for the inbound: `firebase functions:log --only whatsappWebhook | tail -100`.
- Check that the relevant Firestore doc has the expected content (Firebase console).
- If the doc looks right but the reply doesn't use it, the renderer or system prompt may need tuning — open a fast PR.

### Cache-hit check (optional but recommended)

After 2-3 turns in a conversation, check the cache hit rate. The bot logs `claudeUsage` per turn (`functions:log` shows it). On turn 2+, `cachedReadTokens / inputTokens` should be > 0.7. If it's not, the KB is changing between turns — usually means a renderer is non-deterministic (timestamps in output, unsorted iteration, etc.).

### Done when

All 10 scenarios produce a sensible reply, no `TODO` text appears anywhere in Thora's responses, and you sign off mentally on shipping.

---

## Task 9 — Decide TODO disposition for any unfilled FAQ entries

### What

If after Task 4 you still have FAQ entries with TODO answers, decide for each: fill it now, or **hide it from the KB** by setting `active: false` in the YAML and re-syncing.

### Why

A live FAQ entry with `answer_es: "TODO — operador..."` will appear in Block B and Thora may quote it verbatim. Hidden entries are still in git history for later editing but invisible to the bot.

### How

Open `bot/data/faq.yaml`. For each TODO entry, either:

- Replace the TODO with the real answer, or
- Add (or change) `active: false`:
  ```yaml
  - id: kids_welcome
    # ... existing fields
    active: false   # hide until operator fills the answer
  ```

Then re-sync:

```bash
just sync-kb --only faq
```

The renderer skips inactive entries (`listFaq()` filters them out — see `functions/src/bot/services/kb-sources.ts`).

### Done when

No active FAQ entry contains the string "TODO" in `answer_es` or `answer_en`.

---

## Task 10 — Welcome-onboarding template payload (OUT of KB scope)

### What

The first guest broadcast on May 23 uses the Meta-approved `welcome_onboarding_es` / `welcome_onboarding_en` template. The template itself was submitted per `pre-implementation-checklist.md` §2.1.1–§2.1.2; this task is just about what variables you bind to it at send time.

### Why

Calling this out because it's the actual broadcast trigger — you can have a perfect KB, but no message goes out until you fire the broadcast.

### How

Method depends on whether the admin UI exists (it doesn't yet for this phase) or whether you're sending via Meta Business Manager / a one-off script. Per the implementation plan, the broadcast is a Phase-8 task using a `botBroadcast` callable function or the Meta UI directly.

This is **not** something the KB pipeline implementation covers. Track it via your existing pre-implementation-checklist §5.1 (D-8 pilot) and §5.2 (D-7 full broadcast).

### Done when

The pilot of ~5 willing recipients responds positively, you can quick-fix anything that's off, then the full broadcast goes out to all `botEnrolled: true` guests.

---

## Quick reference — file map of what was created/modified this session

### New files
```
bot/data/events.yaml                # wedding events
bot/data/venues.yaml                # wedding venues
bot/data/accommodations.yaml        # partner hotels
bot/data/faq.yaml                   # 15 seed FAQ entries
bot/data/couple-dossier.yaml        # Enrique & Manuel + disclosure policy
bot/data/dress-codes.yaml           # dress codes per event
bot/data/wind-tips.yaml             # Levante / Poniente tips
bot/data/travel.yaml                # bus, airports, taxi
bot/data/bot-kb-extras.yaml         # moderation hints (split out of config/bot)

bot/scripts/sync-kb.mjs             # the sync CLI
bot/docs/kb-implementation-plan.md  # the plan we just executed
bot/docs/pre-launch-operator-tasks.md  # this file

functions/src/bot/claude/today.ts             # dynamic per-turn block
functions/src/bot/services/kb-sources.ts      # readers for new KB collections
functions/src/bot/services/songs.ts           # song moderation logic
```

### Modified files
```
bot/specs/07-knowledge-base.md            # source table + new moderation contract
bot/specs/guest-dossier-schema.md         # folder-name convention + denorm
bot/specs/04-data-model.md                # guests doc ID + config/bot_kb_extras

bot/data/guest-dossiers/*/dossier.yaml    # guestId removed (18 files)

functions/src/bot/claude/kb.ts            # full renderer
functions/src/bot/claude/system-prompt.ts # +song-moderation paragraph in Block A
functions/src/bot/claude/tools.ts         # moderate_song_request wired up
functions/src/bot/handlers/conversation.ts # appends today.ts per turn
functions/src/bot/triggers/onContentChangeBuildKb.ts  # trigger refactor
functions/src/bot/index.ts                # exports updated
functions/src/index.ts                    # exports updated

bot/scripts/package.json                  # +firebase-admin
Justfile                                  # +sync-kb / sync-kb-dry / sync-kb-diff recipes
```

### Deleted files
```
bot/data/qa.json                          # replaced by bot/data/faq.yaml
bot/data/song-moderation-hints.json       # folded into bot/data/bot-kb-extras.yaml
```

---

## If something goes wrong

- **Sync fails on a YAML parse**: open the file, look for unmatched quotes, bad indentation, or stray tabs. `node -e "require('./bot/scripts/node_modules/yaml').parse(require('fs').readFileSync('bot/data/<file>','utf8'))"` is a quick local check.
- **Sync fails with "missing guests"**: Task 3 isn't done. Either rename the listed folders or create `guests/{slug}` docs for the missing ones.
- **Deployment fails on a function**: check `functions/src/bot/triggers/onContentChangeBuildKb.ts` matches the exports in `functions/src/bot/index.ts` and `functions/src/index.ts`. If they drift, the deploy errors with "exported member not found."
- **Bot deployed but isn't using new content**: the in-process KB cache may be stale. Force a rebuild by writing a no-op edit to any watched Firestore doc (e.g., set a field then revert it — the trigger fires twice and bumps `bot_kb_version`).
- **Bot's replies still contain "TODO"**: a TODO in an active FAQ or other YAML rendered into Block B. Either fill it or set `active: false` and re-sync.

---

## Time budget rough estimate

| Task | Estimated time |
|---|---|
| 1. Set credentials | 5 min |
| 2. Install deps | 2 min |
| 3. Rename dossier folders (18 of them, with Firestore UID lookup) | 30–60 min |
| 4. Fill critical TODOs (venues, dress codes, key FAQs) | 60–90 min |
| 5. `sync-kb-diff` | 5 min (just to run + read) |
| 6. `sync-kb` | 2 min |
| 7. Deploy functions | 5–10 min |
| 8. Manual smoke test | 30 min |
| 9. FAQ disposition | 10 min |
| 10. Broadcast (separate track) | — |
| **Total** | **~2.5–3.5 hours** |

If you start Task 3 + Task 4 in parallel (Task 4 needs no Firestore access), this drops by ~30 min.

---

## End state on May 23

When all 10 tasks are done:

- Firestore has every KB source populated and correct.
- The bot Cloud Functions are deployed with the new renderer, the new triggers, the new today.ts, and the widened moderation tool.
- A real test phone has had Thora respond plausibly to 10 representative scenarios.
- You're ready to fire the welcome-onboarding broadcast.

The remaining dossiers (~12 more by your estimate) can land Sunday May 24 via a quick `just sync-kb --only guest-dossiers`. The bot will pick them up on the next turn — no redeploy needed.

Reference photos land Tuesday May 26 via Stage 3 of `bot/docs/kb-implementation-plan.md` §5 — also additive, no regression risk if it slips.
