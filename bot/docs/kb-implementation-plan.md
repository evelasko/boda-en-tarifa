# KB Implementation Plan

> Focused sub-plan for the bot's knowledge-base authoring + build pipeline. Sits underneath the broader `bot/docs/implementation-plan.md` (which covers Phases 1–11 end-to-end) and replaces the half-finished Phase-3 KB scope described there.
>
> **Authored**: 2026-05-22 (Friday). **First broadcast**: 2026-05-23 (Saturday, T-7). **Wedding**: 2026-05-30. **Owner**: implementer (Claude) + operator (Enrique) review.

---

## 1. Goal

Ship a complete, version-controlled, AI-authorable knowledge base that drives Thora's conversational quality. The KB must be **pristine on Saturday May 23** for the first guest broadcast — every wedding fact a guest could reasonably ask Thora about is in the system prompt and answered correctly.

Three sub-goals, each with a hard date:

| # | Goal | Target |
|---|---|---|
| **G1** | All non-dossier KB sources authored in `bot/data/`, synced to Firestore, and rendered into Block B as cached text. | **Sat May 23, EOD launch** |
| **G2** | Existing guest dossiers (~19, more in progress) rendered as text in Block B; the bot riffs on `safe_facts` / `safe_jokes` and respects `do_not_mention`. Un-dossier'd guests handled gracefully (scene-level commentary only). | **Sat May 23, EOD launch** (same ship; partial dossiers are fine) |
| **G3** | Reference photos embedded as `image` content blocks in Block B; vision-based face recognition active per spec §11. | **Tue May 26** |

G1+G2 ship together as one deploy on May 23. G3 is an additive deploy a few days later.

---

## 2. Timeline

| Date | Day | Milestone |
|---|---|---|
| **Fri May 22** | T-8 (today) | Plan finalized; implementation starts. |
| **Sat May 23** | T-7 | **G1+G2 ship.** First guest broadcast goes out (per `pre-implementation-checklist.md` §5.1–5.2). KB is text-only, dossier-partial. |
| **Sun May 24** | T-6 | Remaining dossier YAMLs completed by operator; one re-sync brings them into the cached KB on the next turn. |
| **Mon May 25** | T-5 | Operator + implementer review of conversations to date; KB tweaks via PR. |
| **Tue May 26** | T-4 | **G3 ships.** Reference photos uploaded, Block B switches to mixed text+image content, vision recognition live. |
| **Wed May 27 – Fri May 29** | T-3 to T-1 | Iteration, eval passes, polish. |
| **Sat May 30** | T-day | Wedding. |

---

## 3. Load-bearing decisions (locked)

| # | Decision | Notes |
|---|---|---|
| **K1** | YAML/JSON in `bot/data/` is **canonical** for every KB Firestore source — including `events/` and `venues/`. | Web admin doesn't exist; YAML is the authoring surface. |
| **K2** | One sync script (`bot/scripts/sync-kb.mjs`) pushes local data → Firestore. **Upserts by default; `--prune` is opt-in.** | Wedding timeline ≠ safe deletes. |
| **K3** | Folder name in `bot/data/guest-dossiers/{slug}/` = `guests/{slug}` doc ID = `guest_dossier/{slug}` doc ID. **`guestId` field is removed from dossier YAML.** | Single key end-to-end. |
| **K4** | Sync script reads `guests/{slug}` to validate existence and denormalize `phoneE164` + `firstName` + `lastName` + `language` into the `guest_dossier/{slug}` doc on write. | Bot reads from `guest_dossier/` only at runtime. |
| **K5** | Moderation hints are **light**. Tool contract widens from `{approved, reason?}` to `{verdict: 'accept' \| 'tease_then_accept' \| 'decline_softly', hint?}`. Default verdict is `accept`. | Guests must feel heard. |
| **K6** | `config/bot.moderation_hints` (and any future KB-contributing slice of `config/bot`) moves to its own doc **`config/bot_kb_extras`**. The operational `config/bot` stops bumping `bot_kb_version`. | Avoids cache thrash on every operational toggle. |
| **K7** | Time-gated content for the bot is **just seating**, hardcoded in `kb.ts`. No `bot/data/time-gated-content.yaml`. | One value; YAML overkill. |
| **K8** | "Today's situation" block moves from Block B (cached) to the **per-turn user message** (uncached). | Dynamic block was the only reason cache would invalidate during the event. |
| **K9** | Stage 3 (multimodal) is an **additive deploy**, not a blocking dependency on G1+G2 ship. If photos slip beyond May 26, the bot still works — just with no face recognition. | Risk insulation. |

---

## 4. Stage 1+2 — Text KB with partial dossiers (Sat May 23)

### 4.1 Local data files to author

All new files go in `bot/data/`. **Convention**: snake_case in YAML / JSON; sync script translates to the camelCase already used in Firestore where the existing collections require it (events, venues — read by `services/events.ts` and `services/venues.ts`).

| File | Format | Target Firestore | Notes |
|---|---|---|---|
| `bot/data/events.yaml` | YAML (list of events) | `events/{id}` (overwrite) | One-time export from current Firestore as seed, then YAML is canonical. |
| `bot/data/venues.yaml` | YAML (list of venues) | `venues/{id}` (overwrite) | Same one-time export. Must include `carbones_13`, `casa_explora`, `chiringuito_bora`, `100_fun` per pre-implementation-checklist §1.5. |
| `bot/data/accommodations.yaml` | YAML (list) | `accommodations/{id}` | Partner hotels w/ approximate prices. |
| `bot/data/faq.yaml` | YAML (list, ES+EN) | `faq/{id}` | Replaces `bot/data/qa.json` (delete that stub). Seed entries per `pre-implementation-checklist.md` §1.10. |
| `bot/data/couple-dossier.yaml` | YAML | `config/couple` | Mirror of facts in `bot/specs/couple-dossier.md` §1 + disclosure rules from §2. |
| `bot/data/dress-codes.yaml` | YAML | `config/dress_codes` | Per-event dress code, ES + EN. |
| `bot/data/wind-tips.yaml` | YAML | `config/wind_tips` | 3–5 short tips per wind type (Levante strong, Poniente strong). |
| `bot/data/travel.yaml` | YAML | `config/travel` | Bus details (100% Fun pickup, 17:30 Sat, be there 17:15), airport notes, taxi number. |
| `bot/data/bot-kb-extras.yaml` | YAML | `config/bot_kb_extras` | New doc. Currently houses **only** `moderation_hints` (moved from `config/bot`). Future KB-side slices land here. |
| `bot/data/tarifa-guide.yaml` | YAML | `config/tarifa_guide` | **Exists.** Stays minimal per K1 directive. Sync script flattens YAML structure to a single doc. |
| `bot/data/song-moderation-hints.json` | JSON | merged into `bot/data/bot-kb-extras.yaml` | **Delete this standalone file.** Contents move into `bot-kb-extras.yaml` under `moderation_hints:`. |
| `bot/data/guest-dossiers/{slug}/dossier.yaml` | YAML per guest | `guest_dossier/{slug}` | **Exists.** Remove `guestId:` field from each file. Folder name is canonical. |

#### 4.1.1 Schema sketches

Each schema is documented inline at the top of its file (so the operator can edit the YAML without leaving the file). Indicative shapes below — implementer to lock exact field names against existing Firestore docs for events/venues.

**`bot/data/events.yaml`**
```yaml
# Wedding events. Renders into KB §3.2.
# Target: events/{id} — one Firestore doc per entry.
# Field-name translation: snake_case here → camelCase on Firestore write.

events:
  - id: ceremony
    name_es: "Ceremonia"
    name_en: "Ceremony"
    start_at: "2026-05-30T18:00:00+02:00"
    end_at: "2026-05-30T19:00:00+02:00"
    venue_id: carbones_13
    dress_code_id: ceremony_dress
    transport_notes: "Autobús desde 100% Fun, 17:30 Sat (estar allí 17:15)."
    whom: all
    description_es: "Ceremonia en Carbones 13, frente al mar."
    description_en: "Ceremony at Carbones 13, oceanfront."
  - id: pre_wedding
    # ...
```

**`bot/data/faq.yaml`**
```yaml
# Frequently asked questions. Renders into KB §3.4.
# Target: faq/{id}.

faq:
  - id: parking_carbones
    question_es: "¿Hay aparcamiento en Carbones 13?"
    question_en: "Is there parking at Carbones 13?"
    answer_es: "Sí, hay aparcamiento gratuito a 200 m..."
    answer_en: "Yes, free parking 200 m away..."
    tags: [parking, logistics, ceremony]
    active: true
    order: 10
```

**`bot/data/couple-dossier.yaml`**
```yaml
# Couple dossier (Enrique & Manuel). Renders into KB §3 "## Couple".
# Target: config/couple (single doc).
# Source of human-readable notes: bot/specs/couple-dossier.md.

timeline:
  together_since: "2016"
  met: "university (Enrique was Manuel's teacher)"
  engaged: "January 2023, Las Vegas"
  married: "2026-05-30, Tarifa"

names:
  enrique:
    canonical: "Enrique"
    friends: "Henry"
    family: "Kike"
  manuel:
    canonical: "Manuel"
    friends: "Manu"
    family: "Manolo"

facts:
  - "..."

disclosure:
  - fact: "10 years together"
    share: open
    framing: "Llevan 10 años juntos."
  - fact: "honeymoon"
    share: off_limits
    framing: "Eso mejor que se lo guarden 🐾"
  # ... full table from couple-dossier.md §2
```

**`bot/data/bot-kb-extras.yaml`**
```yaml
# KB-contributing slices that were previously embedded in config/bot.
# Carved out so operational toggle writes don't bump bot_kb_version.
# Target: config/bot_kb_extras (single doc).

moderation_hints:
  hard_avoid:
    artists: ["Las Ketchup"]
    songs:
      - title: "Paquito el Chocolatero"
  mild_tease:
    themes:
      - "pop rock español clásico (Dani Martín, etc.) — saturados, pero acéptalo"
  framing_note: "Por defecto: acepta cualquier petición. Estas listas son preferencias suaves para colorear la respuesta, no bloqueos rígidos."
```

**Dossier YAML — change to existing files**

Remove the `guestId:` line from every `bot/data/guest-dossiers/*/dossier.yaml`. The header comment can stay or update to:

```yaml
# Guest Dossier — Ada Francoy
# Path: bot/data/guest-dossiers/ada-ada-francoy/dossier.yaml
# Folder name = guests/{id} doc ID = guest_dossier/{id} doc ID.
# Phone + name + language denormalized from guests/{id} on sync.
```

### 4.2 Spec doc updates (small, do alongside)

These keep the spec docs honest with the new conventions. All edits are <10 lines each.

| File | Change |
|---|---|
| `bot/specs/07-knowledge-base.md` §2 | `guest_dossier/{guestId}` (was `{phone}`); add note that local YAML is canonical and `config/bot_kb_extras` holds moderation hints. |
| `bot/specs/guest-dossier-schema.md` §2, §3 | Drop `guestId` field from schema; document folder-name = doc-ID convention; document phone-denormalized-on-sync. |
| `bot/specs/04-data-model.md` §1 | Correct the `guests/` doc-ID note to reflect the slug convention with `phoneE164` as a field. |
| `bot/specs/04-data-model.md` §2 | Add `config/bot_kb_extras` schema (one paragraph). |
| `bot/specs/07-knowledge-base.md` §3.1 | Move "Today's situation" out of the Block B layout listing into a new "Per-turn (uncached) blocks" subsection. |

### 4.3 Sync script — `bot/scripts/sync-kb.mjs`

Single-file ESM module, mirroring the style of the existing `upload-reference-photos.mjs`. Runs from repo root via `just sync-kb`.

**CLI surface:**

```
node bot/scripts/sync-kb.mjs [options] [sources...]

Options:
  --all              Sync every source. Default if no sources passed.
  --dry-run          Validate + show diff; no Firestore writes.
  --diff             Show what would change vs. current Firestore state. Implies dry-run.
  --prune            Delete Firestore docs absent from local data. OFF by default.
  --only <names>     Comma-separated source names (e.g. "faq,dress-codes").
  --verbose          Log every read/write.

Sources (positional or --only):
  events, venues, accommodations, faq, couple, dress-codes,
  wind-tips, travel, tarifa-guide, bot-kb-extras, guest-dossiers

Examples:
  just sync-kb --all                  # sync everything
  just sync-kb --only guest-dossiers  # sync just dossiers
  just sync-kb --diff                 # preview all changes
  just sync-kb --prune --only faq     # sync FAQ and delete obsolete entries
```

`just` recipes added to the repo's `Justfile`:
- `sync-kb` → `node bot/scripts/sync-kb.mjs --all`
- `sync-kb-dry` → `node bot/scripts/sync-kb.mjs --all --dry-run`
- `sync-kb-diff` → `node bot/scripts/sync-kb.mjs --all --diff`

**Credentials:**

Reads `bot/.env` for `FIREBASE_SERVICE_ACCOUNT_PATH` pointing to a JSON key file (already exists in operator setup per `setup-guide.md`). Add this var to `bot/.env` if missing. The script uses `firebase-admin` SDK initialized from that key.

**Behavior per source:**

1. **Validate the file**: parse YAML/JSON, run a Zod schema check, fail loudly with line numbers on any violation. No partial writes.
2. **Compute diff** against current Firestore state (read all target docs first). Print a per-doc verdict: `ADD`, `UPDATE`, `UNCHANGED`, or `PRUNE` (only with `--prune`).
3. **Apply** via Firestore batch writes (one batch per source, max 500 ops per batch; chunk if needed). On any batch failure, abort the source and continue to the next (idempotent re-runs).
4. **Log a summary line per source**: `events: 12 docs (3 added, 4 updated, 5 unchanged)`.

**Special case — guest dossiers:**

For each `bot/data/guest-dossiers/{slug}/dossier.yaml`:
1. Read the YAML.
2. **Read `guests/{slug}` from Firestore.** If it doesn't exist, append `{slug}` to a `missing_guests` list and skip the write. Don't fail the whole sync.
3. Denormalize `phoneE164`, `firstName`, `lastName`, `language` from the guests doc into the dossier write payload.
4. Write to `guest_dossier/{slug}` (upsert).
5. After all dossiers processed, print the `missing_guests` list if non-empty. Exit non-zero if any are missing (forces operator to reconcile before launch).

**Special case — `--prune` for guest dossiers:**

Pruning means: any `guest_dossier/{slug}` in Firestore not represented by a local folder gets deleted. Useful for cleanup but never enabled by default.

**Output:**

Plain text to stdout, JSON summary to `bot/scripts/.last-sync.json` (gitignored) for the next run to diff against if needed.

### 4.4 KB builder changes (`functions/src/bot/claude/kb.ts`)

Extend `renderKb()` from its current scaffold (events + venues + locked content) to render every section listed in `07-knowledge-base.md` §3.1.

**Functions to add** (one per section, kept small for testability):

```ts
async function renderCouple(): Promise<string>          // reads config/couple
async function renderEvents(): Promise<string>          // already exists (rename/keep)
async function renderVenues(): Promise<string>          // already exists
async function renderWelcomeBora(): Promise<string>     // static text per spec §3.1
async function renderTravel(): Promise<string>          // reads config/travel
async function renderDressCodes(): Promise<string>      // reads config/dress_codes
async function renderWeatherWind(): Promise<string>     // static primer + reads config/wind_tips
async function renderAccommodations(): Promise<string>  // reads accommodations/
async function renderTarifaGuide(): Promise<string>     // reads config/tarifa_guide
async function renderGuestDossiers(): Promise<string>   // reads guest_dossier/* — TEXT ONLY in Stage 2
async function renderFaq(): Promise<string>             // reads faq/
async function renderSurprises(): string                // static, already exists
async function renderLocked(): string                   // static, already exists
async function renderModerationHints(): Promise<string> // reads config/bot_kb_extras.moderation_hints
```

`renderKb()` becomes the assembly: parallel `Promise.all` for all reads, then string concat in the canonical section order from spec §3.1. Failure of any single section logs a warning and emits a `<section unavailable>` placeholder rather than failing the whole build — Thora can still operate degraded.

**"Today's situation" — per-turn, NOT in Block B.**

Move the dynamic block out of `kb.ts`. Add a new function in `functions/src/bot/claude/pipeline.ts` (or a new `claude/today.ts`):

```ts
export async function renderTodaysSituation(now: Date): Promise<string>
```

It's appended to the per-turn user content (right before the recent-history block), per spec §4.2. Stays uncached. Cheap to recompute on every turn.

**`renderGuestDossiers()` — Stage 2 (text only):**

```
## Guest dossiers ({N} dossiered, plus ~{M} un-dossiered guests Thora handles scene-level)

### Guest: ada-ada-francoy
- Name: Ada Francoy
- Preferred: Adita
- Relationship: amiga cercana del círculo de Enrique y Manuel; amistad consolidada en Cuba
- Visual hint: energía luminosa y expresiva; suele llevar pelota de cristal en playa
- Safe facts:
  - escritora de cuentos infantiles y creadora de teatro para niños
  - ...
- Safe jokes (pre-authorized only):
  - si el tardeo funciona, Adita aguanta hasta el amanecer; si no, desaparece elegantemente
- Do not mention:
  - conversaciones de política
- Recognition floor: 0.85 (no reference photos yet — text-only this stage)

### Guest: javier-otero
...
```

**Stage 2 graceful handling of un-dossier'd guests:**

The Block A rule already covers this ("If no recognition → scene-level comment"). Two reinforcements:

1. In `renderGuestDossiers()` opening line, count and surface: "{N} dossiered, ~{M} other guests are not dossier'd — handle warmly at scene level only, never invent personalization for them."
2. The conversation handler's per-turn user content can include a one-liner: `Guest dossier present: yes/no` (cheap signal computed from `guest_dossier/{slug}` existence).

### 4.5 Firestore triggers (`functions/src/bot/triggers/onContentChangeBuildKb.ts`)

Currently exists with five triggers (`events`, `venues`, `faq`, `time_gated_content`, `config/*` wildcard). Two surgical changes:

**Add:**
- `botKbBumpOnGuestDossier` → watches `guest_dossier/{id}`.
- `botKbBumpOnAccommodations` → watches `accommodations/{id}`.

**Refactor — replace the wildcard `config/{configId}` trigger with per-doc triggers:**
- `botKbBumpOnConfigCouple` → `config/couple`
- `botKbBumpOnConfigTarifaGuide` → `config/tarifa_guide`
- `botKbBumpOnConfigDressCodes` → `config/dress_codes`
- `botKbBumpOnConfigWindTips` → `config/wind_tips`
- `botKbBumpOnConfigTravel` → `config/travel`
- `botKbBumpOnConfigBotKbExtras` → `config/bot_kb_extras`

The wildcard `botKbBumpOnConfig` (currently in the file) is **deleted** — it's the over-bump source. Operational writes to `config/bot` stop triggering KB rebuilds.

Each new trigger is one `onDocumentWritten` registration calling `bumpKbVersion("config/<name>")`. ~10 lines each.

### 4.6 Moderation tool contract update

**File:** `functions/src/bot/claude/tools.ts` + `functions/src/bot/services/songs.ts` (new in Phase 3).

**Old:**
```ts
moderate_song_request(title, artist?) → { approved: bool, reason?: string }
```

**New:**
```ts
moderate_song_request(title, artist?) → {
  verdict: 'accept' | 'tease_then_accept' | 'decline_softly',
  hint?: string  // operator note Thora can paraphrase, e.g. "saturados de Dani Martín"
}
```

**Service logic (`services/songs.ts.moderateSongRequest`):**

1. Read `config/bot_kb_extras.moderation_hints` (in-memory cached for the function instance).
2. Normalize artist + title (lowercase, strip accents).
3. If artist matches `hard_avoid.artists` (exact or fuzzy substring) → `decline_softly`, `hint` = "{artist} no entra en la lista de mis humanos".
4. If title matches `hard_avoid.songs` (exact or fuzzy) → `decline_softly`, `hint` = "esa canción la han vetado mis humanos".
5. If either matches `mild_tease.themes` (substring or keyword match) → `tease_then_accept`, `hint` = "{theme summary} — mis humanos suspiran cuando lo ven en la lista".
6. Otherwise → `accept`, no hint.

**Block A rule update** (in `system-prompt.ts`):

Add one paragraph under "# Song-request moderation":

```
When a guest sends a song request, ALWAYS call moderate_song_request first.
- verdict 'accept' (default): record warmly. The guest must feel heard.
- verdict 'tease_then_accept': accept the song AND drop the hint with a gentle wink ("otro Dani Martín — te apunto, pero mis humanos suspiran 🐾"). Still record.
- verdict 'decline_softly': don't record. Deflect with the hint in Thora's voice, then offer to record a different song. Escalate to operator only if the guest pushes back twice.
```

### 4.7 Acceptance criteria for G1 + G2 ship (Sat May 23)

The May 23 deploy is green when **all** of:

1. `just sync-kb --diff` runs cleanly against a populated `bot/data/` and reports `0 missing guests` (or, if some guest dossiers are intentionally pending, the operator has acknowledged the list).
2. `just sync-kb --all` completes without errors; per-source summary lines printed.
3. `bot_kb_version` is at version ≥ N (N being the count of `--all` writes).
4. A test inbound to Thora produces a reply that demonstrably uses content from each newly-added section. Specifically:
   - "¿dónde aparco en Carbones?" → answer references the venue card.
   - "¿qué dress code el sábado?" → answer cites `config/dress_codes`.
   - "¿qué se puede hacer en Bolonia?" → answer cites the Tarifa guide entry.
   - "¿hay alergia gluten en el menú?" → answer cites the FAQ entry on dietary, deflects on menu.
   - For a dossier'd guest, mentioning a `safe_fact` ("¿Javi sigue con el kite?") → Thora confirms in her voice.
   - For an un-dossier'd guest sending a photo → Thora replies scene-level only, never invents a name.
5. `claudeUsage.cachedReadTokens / inputTokens > 0.7` on the 2nd turn of a conversation (proof prompt caching is working with the new Block B).
6. Sync script's dry-run + diff modes are documented in the script's own `--help` output and in `bot/data/guest-dossiers/README.md` (linked from there).
7. Spec doc updates from §4.2 are committed in the same PR.
8. The operator has run a 5-message manual smoke test from a test phone and given an explicit thumbs-up.

---

## 5. Stage 3 — Multimodal Block B (Tue May 26)

Additive deploy on top of G1+G2. Photos may slip; if they do, Stage 3 ships without them and recognition stays text-hint-only. The bot does not regress.

### 5.1 `system-prompt.ts` refactor

**Change return type:**

```ts
// before
export function buildSystem(args): Anthropic.Messages.TextBlockParam[]

// after
export function buildSystem(args): Anthropic.Messages.ContentBlockParam[]
```

**Change Block B from a single text block to a sequence:**

```ts
// args.kbBlock becomes args.kbContent: Anthropic.Messages.ContentBlockParam[]
// produced by kb.ts (see §5.2).
return [
  { type: "text", text: BLOCK_A, cache_control: { type: "ephemeral" } },
  ...args.kbContent,   // many text + image blocks; LAST one carries cache_control
  { type: "text", text: BLOCK_C, cache_control: { type: "ephemeral" } },
];
```

**`kb.ts` change:**

Replace `getKb(): { text, version, hash }` with `getKbContent(): { content: ContentBlockParam[], version, hash }`. Internal rendering composes the section markdown as one text block, then for each dossier'd guest appends 1–3 image blocks (base64 inline) right after that guest's text. The LAST content item gets `cache_control: { type: "ephemeral" }`.

Section ordering preserved. Only the dossier section grows.

### 5.2 Reference photo fetch + transform

New file: `functions/src/bot/claude/kb-photos.ts`.

```ts
async function fetchAndEncodePhotos(urls: string[]): Promise<
  Anthropic.Messages.ImageBlockParam[]
>
```

Steps:
1. For each Cloudinary URL in `reference_photos`, append the transform suffix `w_512,c_limit,f_jpg,q_75` (per `bot/data/guest-dossiers/README.md`).
2. Fetch the binary with axios; timeout 5s per photo; retry once.
3. Convert to base64; wrap as `{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: <base64> } }`.
4. **Cache the encoded payload in module-level memory** keyed by `(url, transform)` so repeat KB rebuilds on the same function instance don't re-fetch.
5. Cold start re-fetches; ~30 dossiers × 2 photos × 5s timeout = worst-case 5 min cold-start KB build, but with parallel `Promise.all` it's well under 30s. Pre-warming via the keep-warm function handles this.

### 5.3 Token-budget verification

Before deploy, write a tiny script `bot/scripts/measure-kb-tokens.mjs` that:
1. Runs `renderKbContent()` against staging.
2. Calls Anthropic's `messages.count_tokens` endpoint with the full system content.
3. Prints token counts per block and total.
4. Fails the deploy if total > 90k tokens (the budget from spec §3.2 KQ7).

### 5.4 Acceptance criteria for G3 ship (Tue May 26)

1. `bot/data/guest-dossiers/*/dossier.yaml` `reference_photos` arrays are populated for ≥10 dossiered guests.
2. `measure-kb-tokens.mjs` reports total system-prompt size < 90k tokens.
3. A test inbound photo of a dossier'd guest produces a Thora reply that names them (when confidence ≥ floor) or uses soft phrasing (when borderline). Reproduced for ≥3 different dossier'd guests.
4. A test inbound photo of an un-dossier'd guest produces a scene-level reply with no name.
5. Cache hit rate on Block B remains > 70% across a 10-turn conversation post-deploy.
6. Total response latency (p50) under 6s with photos in cache; under 12s on cold start.

---

## 6. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sync script writes wrong data to Firestore due to YAML/JSON typo. | Medium | High | Mandatory Zod validation per source before any write; `--dry-run` + `--diff` available; one-off `firestore:export` taken before first `--all` run. |
| Dossier folder name doesn't match a `guests/{slug}` doc → sync skips that guest silently. | Medium | High | Sync exits non-zero with the missing-guest list. Operator must reconcile before launch. |
| Operational write to `config/bot` accidentally still bumps KB version. | Low (after refactor) | Low | The wildcard trigger is **deleted**, not just narrowed. Only the per-doc triggers remain. |
| Anthropic ephemeral cache misses on Block B due to a non-deterministic render (timestamp, set ordering, etc.). | Medium | Medium | All renderers iterate Firestore reads via `orderBy('id', 'asc')` (or equivalent); no timestamps in Block B; canonical line endings. Add a unit test that calls `renderKb()` twice and asserts byte-identical output. |
| Reference photo fetch is flaky on Cloudinary side → cold start fails. | Medium | Medium | Photos cached in module memory; keep-warm function pre-warms; fallback to text-only if any photo fails (log warning, no crash). |
| Total system-prompt tokens exceed Anthropic's cacheable limit. | Low | High | Pre-deploy `measure-kb-tokens.mjs` blocks deploy at 90k. If we approach the limit, drop to 1 photo per dossier (from 2–3) or downsize to 384px. |
| Operator edits a YAML, forgets to run `just sync-kb`, KB is stale. | Medium | Low | `pre-commit` hook (optional) reminds to run sync; `admin-runbook.md` lists the sync command as the standard "I edited content, what now?" answer. |
| Moderation tool's new contract breaks the existing pipeline because no handler exists yet (Phase 3 hadn't built it). | Low | Low | Tool + service are built fresh in this plan; no breakage. |

---

## 7. Out of scope (explicitly deferred)

- **Web admin UI for KB editing.** Not building. YAML + sync script is the operator tooling.
- **Bi-directional sync (Firestore → YAML).** One-way only. If operator wants to undo, they revert the YAML in git and re-sync.
- **Per-section selective KB rebuilds.** The KB is small enough that full rebuild on any version bump is fine.
- **Auth Token / time-bound URLs for reference photos.** Signed-URL pattern is sufficient for the event window per `bot/data/guest-dossiers/README.md` §"Time-bound URLs".
- **Embedding-based face recognition.** Reference-photo-in-prompt (D18) is the chosen approach.
- **FAQ editing on the fly during the event.** Operator edits YAML on laptop, runs sync. ~30s round trip.

---

## 8. Execution order (single-day path for Stage 1+2)

Recommended order for the implementer working through Stage 1+2 today (Fri May 22) into Sat May 23:

1. **Spec edits first** (§4.2) — small, locks the conventions.
2. **Dossier YAML cleanup** — remove `guestId:` from each existing dossier file. ~2 min per file × 19 files.
3. **Author the new local data files** (§4.1) — events, venues, accommodations, faq, couple, dress-codes, wind-tips, travel, bot-kb-extras. Most content already exists in spec docs (couple-dossier.md, pre-implementation-checklist.md notes) — translate it to YAML.
4. **Build the sync script** (§4.3) — validation + dry-run first, writes last.
5. **Trigger refactor** (§4.5) — narrow `config/*` to per-doc; add guest_dossier + accommodations triggers.
6. **KB renderer extensions** (§4.4) — one render function per section, all wired into `renderKb()`.
7. **Per-turn "Today's situation"** (§4.4 last bullet) — extract from KB, append in pipeline.
8. **Moderation tool contract** (§4.6) — tool + service + Block A paragraph.
9. **Run `just sync-kb --diff`** end-to-end, fix any validation issues.
10. **Run `just sync-kb --all`**, verify Firestore state.
11. **Manual smoke test** — at least the 6 prompts in acceptance criterion §4.7.4.
12. **Operator review** — operator runs the same 6 prompts from a test phone. Sign-off.
13. **Deploy.** Sat May 23 broadcast can fire.

Stage 3 (Tue May 26) execution order is short:

1. Confirm reference photos uploaded (operator's existing `upload-reference-photos.mjs`).
2. Refactor `system-prompt.ts` + `kb.ts` to mixed content blocks (§5.1).
3. Implement `kb-photos.ts` (§5.2).
4. Run `measure-kb-tokens.mjs`, confirm < 90k.
5. Deploy. Manual photo smoke test from a test phone.

---

## 9. Where this plan ends

This plan covers everything from "design finalized" to "Thora's KB is complete and live." It does not cover:

- Templates and Flows submission (separate track per `pre-implementation-checklist.md` §2).
- Scheduled functions (eventReminder, contentUnlock, filmDeveloped, keepKbWarm, etc. — Phase 5 of the broader implementation-plan).
- Admin UI features (Phase 4 — explicitly deferred for the wedding).
- Pre-launch eval harness (Phase 6).

Those continue per `bot/docs/implementation-plan.md`. The KB pipeline ships first because every other phase depends on it being correct.
