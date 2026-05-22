# Guest Dossier Schema

> Per-guest knowledge that lets Thora (a) recognize faces in inbound photos and (b) personalize references when guests are mentioned or pictured. Loaded into the KB system prompt (cached). Author: Enrique & Manuel; target ~30 most-photographed guests; un-dossier'd guests fall back to scene-level commenting.

---

## 1. Why this exists

Thora uses Claude Sonnet 4.6 with vision. By embedding a small set of **reference photos** (option `(a)` from the design session) plus structured facts in the system prompt, Thora can:

- Name guests in photo acks ("¡Carlitos! Qué guapo sales, ¿y la gorra?")
- Riff on pre-authorized roast material ("…el que siempre llega tarde 🐾")
- Add personal touches when the guest is mentioned ("ah, tu primo el del Border Collie")

Without a dossier, Thora is still warm — she just won't name or roast.

---

## 2. Storage

- **Local source of truth**: `bot/data/guest-dossiers/{slug}/dossier.yaml`. The folder name `{slug}` is the canonical guest identifier and must match the existing `guests/{slug}` document ID in Firestore (which is the Firebase Auth UID for that guest). The sync script (`bot/scripts/sync-kb.mjs`) validates this match on every run — a folder whose slug doesn't exist in `guests/` is reported as a missing-guest error and skipped.
- **Firestore path (runtime)**: `guest_dossier/{slug}` — same ID as the corresponding `guests/{slug}` doc. The sync script reads `guests/{slug}` and **denormalizes** `phoneE164`, `firstName`, `lastName`, and `language` into the dossier doc on write, so the bot never needs a cross-collection read at runtime.
- **Reference photos**: hosted on Cloudinary under a dedicated `bot/reference/` folder, signed access (not public). Used only by the KB build job, never served to guests.
- **KB build job**: `bot/claude/kb.ts.getKbContent()` reads all `guest_dossier/*` docs, fetches the reference photos, base64-encodes them, and includes them as `image` content blocks in Block B of the cached system prompt.

---

## 3. Schema

Identity is carried by the **folder name** in `bot/data/guest-dossiers/{slug}/` — the YAML itself does NOT include a `guestId` field. On sync, the script writes the dossier to `guest_dossier/{slug}` and copies `phoneE164` + `firstName` + `lastName` + `language` from `guests/{slug}` as denormalized convenience fields.

```ts
interface GuestDossier {
  // Identity is the folder slug (not a YAML field).

  name: string;                           // full, e.g., "María García"
  preferred_name?: string;                // what Thora calls them, e.g., "Mari"

  // Recognition
  reference_photos: string[];             // 1-3 Cloudinary URLs (frontal, recent, well-lit). Empty in Stage 2 (text-only).
  recognizable_for?: string;              // short visual hint, e.g., "pelirroja, gafas de pasta"
  recognition_confidence_floor: number;   // 0-1; default 0.75; below → no naming

  // Relationship to couple
  relationship: string;                   // free-form, e.g., "primo de Enrique"
  hometown?: string;
  language?: 'es' | 'en';                 // optional override; sync script also denormalizes from guests/

  // Personality / facts Thora can riff on
  safe_facts: string[];                   // open facts: profession, hobbies, kids' names, pet, etc.
  safe_jokes: string[];                   // pre-authorized roast material — Thora may use these
  do_not_mention: string[];               // hard no-go (exes, sensitive topics, illnesses)

  // Personal-intro mode (for Tarifa concierge "personal connection" path)
  personal_intro_for?: string[];          // categories where this person is a contact — e.g., ['kite_wind', 'scuba']
  personal_intro_blurb?: string;          // 1-line what Thora says when intro-ing them

  // Metadata
  active: boolean;                        // false → ignored by KB build
  updatedAt: Timestamp;                   // sync script overrides with serverTimestamp() on write

  // Denormalized from guests/{slug} on sync — do NOT author by hand.
  // Re-syncing refreshes these from the guests doc.
  phoneE164?: string;
  firstName?: string;
  lastName?: string;
}
```

---

## 4. Field guidance

### 4.1 `safe_facts`

Open, non-controversial facts Thora can casually reference. Examples:
- "abogado de empresas"
- "tiene un Border Collie llamado Pipo"
- "fan obsesivo del Sevilla FC"
- "vive en Berlín desde 2020"

### 4.2 `safe_jokes`

**Pre-authorized roast material**. Anything in here, Thora may use as a gentle tease. Anything outside, Thora must NOT improvise on.

Ceiling: **roast level**, not risqué. Mixed-age, mixed-culture audience.

Examples (good):
- "siempre se duerme en las sobremesas"
- "no admite que pierde a las cartas"
- "sigue creyendo que el Sevilla va a ganar la Champions"

Examples (bad — do not authorize):
- "siempre se emborracha y..."
- Anything sexual, anything about appearance flaws, anything family-feud-related.

### 4.3 `do_not_mention`

Hard exclusions. Anything Claude sees in this list must never appear in output even if the topic comes up naturally.

Examples:
- "su ex Patricia"
- "el accidente del 2023"
- "el cáncer de su madre"

### 4.4 `recognition_confidence_floor`

How confident Claude must be before naming this person from a photo.

- **0.75** (default): for distinctively-featured people (red hair, very unique style).
- **0.85**: for people with siblings or look-alikes at the wedding.
- **0.90**: for elderly relatives where misnaming would be hurtful.

If confidence is below the floor, Thora falls back to non-identifying scene comment ("qué guapa sale esta sonrisa 🐾").

### 4.5 `personal_intro_for`

If this guest is someone Enrique/Manuel are willing to introduce other guests to (e.g., your kitesurf instructor, your scuba buddy, the restaurant owner who'll give you a deal), list the Tarifa-guide categories where they apply.

When another guest asks for that category, Thora may offer to broker an introduction (soft escalation to operator).

---

## 5. Worked examples

### G-D1: Carlos (Enrique's primo, gets roasted plenty)

Folder: `bot/data/guest-dossiers/carlos-velasco/`

```yaml
# Identity carried by folder name "carlos-velasco" — matches guests/carlos-velasco doc ID.
name: "Carlos Velasco"
preferred_name: "Carlitos"
reference_photos:
  - https://res.cloudinary.com/.../bot/reference/carlos-1.jpg
  - https://res.cloudinary.com/.../bot/reference/carlos-2.jpg
recognizable_for: "barba pelirroja, gorra siempre puesta"
recognition_confidence_floor: 0.75
relationship: "primo de Enrique, lleva contigo desde niño"
hometown: "Sevilla"
language: es
safe_facts:
  - "abogado de empresas"
  - "tiene un Border Collie llamado Pipo"
  - "fan obsesivo del Sevilla FC"
safe_jokes:
  - "siempre se duerme en las sobremesas"
  - "no admite que pierde a las cartas"
  - "siempre llega tarde y siempre con excusa"
do_not_mention:
  - "su ex Patricia"
personal_intro_for: []
active: true
```

### G-D2: Tía Pilar (Manuel's tía, no roasting)

Folder: `bot/data/guest-dossiers/pilar-romero/`

```yaml
# Identity carried by folder name "pilar-romero" — matches guests/pilar-romero doc ID.
name: "Pilar Romero"
preferred_name: "Tía Pilar"
reference_photos:
  - https://res.cloudinary.com/.../bot/reference/pilar-1.jpg
recognizable_for: "pelo plata, gafas siempre, sonrisa fácil"
recognition_confidence_floor: 0.85
relationship: "tía de Manuel, le ha criado prácticamente"
hometown: "Cádiz"
language: es
safe_facts:
  - "profesora jubilada de literatura"
  - "lectora compulsiva, fan de Almudena Grandes"
safe_jokes: []   # gentle elder, no roasting
do_not_mention:
  - "su salud reciente"
personal_intro_for: []
active: true
```

### G-D3: Sofía (Enrique's kitesurf instructor)

Folder: `bot/data/guest-dossiers/sofia-reyes/`

```yaml
# Identity carried by folder name "sofia-reyes" — matches guests/sofia-reyes doc ID.
name: "Sofía Reyes"
preferred_name: "Sofi"
reference_photos:
  - https://res.cloudinary.com/.../bot/reference/sofia-1.jpg
recognizable_for: "rubia, atlética, casi siempre con neopreno o gorra de sol"
recognition_confidence_floor: 0.75
relationship: "amiga de Enrique, fue su profesora de kite"
hometown: "Tarifa"
language: es
safe_facts:
  - "instructora de kite en Valdevaqueros desde hace 8 años"
  - "campeona andaluza junior en 2018"
safe_jokes:
  - "se ríe del estilo de Enrique en el agua"
personal_intro_for:
  - kite_wind
personal_intro_blurb: "Mi humano Enrique se compinche con Sofi — ella le enseñó. Si te animas con kite, le aviso y te pasa precios."
do_not_mention: []
active: true
```

---

## 6. How Thora uses the dossier

### 6.1 Photo recognition

1. Inbound photo → Haiku 4.5 vision call: caption + detected faces.
2. Sonnet 4.6 turn includes the dossier reference photos as system content + the inbound photo as user content.
3. Claude attempts a match per detected face. If confidence ≥ guest's `recognition_confidence_floor`, the name is "unlocked" for the response.
4. Thora composes the ack referencing recognized names, scene context, and any matching `safe_facts` / `safe_jokes`.
5. Misidentification fallback: borderline confidence → soft phrasing ("esta tiene pinta de ser Carla, ¿sí?"). No-confidence → scene-level only.

### 6.2 Conversational reference

When a guest mentions another guest by name in chat, Thora may pull that guest's dossier and:
- Add a personal-touch beat using `safe_facts`.
- NEVER reveal another guest's contact info, attendance status, seating, dietary, or anything from `do_not_mention`.

### 6.3 Personal-intro path (Tarifa concierge)

When a guest asks about a Tarifa-guide category and any dossier has `personal_intro_for` matching that category:

- Thora mentions the option: e.g., "Mi humano se compinche con {name}, le aviso y te pasa precios. ¿Quieres?"
- If guest says yes → soft escalation to operator (low urgency) so the human can broker the intro.

---

## 7. Sizing & prioritization

- **Target**: 30 dossiers max for v1.
- **Priority order**:
  1. Closest family both sides (parents, siblings, key cousins, key aunts/uncles).
  2. Best friends / bridal party-equivalents.
  3. Long-time friends certain to be heavily photographed.
  4. Personal-intro contacts (kite instructor, scuba operator, etc.) even if not heavily photographed.
- **De-prioritize**: distant relatives, plus-ones, guests who won't appear often.
- **Un-dossier'd guests**: Thora is still warm. Vision still describes scenes. She just doesn't name or roast.

---

## 8. Operator workflow

1. **Compile candidate list** from `guests.json` (filter to ~30 most-photographed).
2. **Create per-guest folder** at `bot/data/guest-dossiers/{slug}/` where `{slug}` matches the guest's `guests/{slug}` Firestore doc ID.
3. **Collect reference photos** per guest: 1–3 frontal, well-lit, recent. No sunglasses, no extreme angles. Drop them into the folder.
4. **Fill `dossier.yaml`** using the schema in §3. Start with closest family. Identity is the folder name — do NOT add a `guestId` field.
5. **Upload photos** to Cloudinary signed-URL storage via `node bot/scripts/upload-reference-photos.mjs {slug}` (per `bot/data/guest-dossiers/README.md`).
6. **Sync to Firestore** via `node bot/scripts/sync-kb.mjs --only guest-dossiers`. The script validates each folder against `guests/{slug}`, denormalizes `phoneE164`/`firstName`/`lastName`/`language` into the dossier doc, and writes to `guest_dossier/{slug}`. The corresponding `botKbBumpOnGuestDossier` Firestore trigger bumps `bot_kb_version` automatically — the bot picks up the change on the next turn.
7. **Test** by simulating a photo send from each dossier'd guest, verify Thora names them.

---

## 9. Privacy & ethics

- Reference photos and personal facts are **biometric-adjacent data**. Storage is restricted to operator-controlled Firestore + signed Cloudinary URLs.
- The dossier is **internal to Thora** — never surfaced to other guests via the bot.
- Decommissioning (90 days post-wedding): all `guest_dossier/*` docs are purged along with `bot_conversations/*` per `09-security-privacy.md` retention rules.
- `safe_jokes` content is **pre-authorized by the operator** per guest. Claude must not improvise roast material outside this list.
