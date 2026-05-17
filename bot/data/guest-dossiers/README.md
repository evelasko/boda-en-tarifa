# Guest dossiers — author conventions

Per-guest knowledge that lets Thora recognize faces in inbound photos and add personal touches in conversation. Authored by Enrique and Manuel; loaded into the bot's KB system prompt at build time. Schema reference: `bot/specs/guest-dossier-schema.md`.

---

## Folder structure

Each guest gets their own folder, named after a slug. Folder = canonical source of truth.

```
bot/data/guest-dossiers/
├── README.md                 (this file)
├── .gitignore                (excludes raw photos from git)
├── javier-otero/
│   ├── dossier.yaml          ← operator-authored
│   ├── photo-1.jpg           ← source originals from your phone
│   └── photo-2.jpg
├── tia-pilar/
│   ├── dossier.yaml
│   └── photo-1.jpg
└── ...
```

Conventions:
- **Folder name**: `{name-slug}` — lowercase, hyphens, no accents. E.g., `javier-otero`, `tia-pilar`, `abuela-maria`. If two guests share a name, append a disambiguator: `maria-garcia-prima` vs. `maria-garcia-tia`.
- **YAML inside**: always `dossier.yaml`. The folder name carries the identity.
- **Photos**: 1–3 source originals. Filenames don't matter functionally — they become the Cloudinary `public_id` suffix — but `photo-1.jpg`, `photo-2.jpg`, `photo-3.jpg` is the suggested convention. Order in the final `reference_photos` array matches alphabetical filename order.

---

## Quick start: adding a new guest

1. **Create the folder**:
   ```bash
   mkdir bot/data/guest-dossiers/{name-slug}
   ```
2. **Copy the worked example as a template**:
   ```bash
   cp bot/data/guest-dossiers/javier-otero/dossier.yaml \
      bot/data/guest-dossiers/{name-slug}/dossier.yaml
   ```
3. **Edit** `dossier.yaml` to fill in the guest's actual facts. Update `guestId`, `name`, `preferred_name`, `recognizable_for`, `relationship`, `safe_facts`, `safe_jokes`, `do_not_mention`, etc.
4. **Drop 1–3 photos** in the folder. Frontal, well-lit, recent. No sunglasses, no extreme angles. ≥1000px on the long side preferred (Cloudinary will accept anything and the KB build job resizes at fetch time).
5. **Run the upload script** (see below) — e.g. `just bot-upload-photos {name-slug}`.

---

## Upload script — `upload-reference-photos.mjs`

Syncs photos from each folder to Cloudinary and writes signed URLs back into `dossier.yaml`'s `reference_photos` array.

### One-time setup

From the repo root:

```bash
just setup-bot-scripts
```

(Equivalent: `npm --prefix bot/scripts install`.)

This installs the `cloudinary` + `yaml` dependencies under `bot/scripts/node_modules/`. The `yaml` package is critical because it has a **comment-preserving Document API** — your section dividers inside each `dossier.yaml` survive automated edits.

### Cloudinary credentials

The script reads `bot/.env`. It accepts either form:

```env
# Form A — single combined URL
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Form B — three separate vars
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Invocations

Use the `just` recipes from the repo root:

```bash
# Sync a single guest's photos
just bot-upload-photos javier-otero

# Sync every guest folder
just bot-upload-photos --all

# Dry-run (no Cloudinary uploads, no YAML writes — just preview)
just bot-upload-photos-dry javier-otero
just bot-upload-photos-dry --all

# Mix flags freely
just bot-upload-photos javier-otero --dry-run
```

Under the hood each recipe runs `node bot/scripts/upload-reference-photos.mjs <args>` from the repo root. If `just` isn't available you can invoke `node` directly the same way:

```bash
node bot/scripts/upload-reference-photos.mjs javier-otero
node bot/scripts/upload-reference-photos.mjs --all --dry-run
```

### What it does

- Reads `bot/.env` for Cloudinary credentials.
- For each `.jpg / .jpeg / .png / .webp` in `bot/data/guest-dossiers/{slug}/`, uploads to Cloudinary at `bot/reference/{slug}/{filename-without-ext}` with:
  - `type: authenticated` — signed-URL access only, not publicly browsable.
  - `overwrite: true` — re-runs replace, not duplicate.
- Generates a signed URL (no auto-expiry; tied to API secret).
- Updates `dossier.yaml`'s `reference_photos` array. Comments and structure preserved.

### Behavior to know

- **Idempotent**. Same filenames → same `public_id`s → same URLs. Re-run any time.
- **Local is source of truth**. Delete a photo locally → it disappears from the YAML on next sync.
- **No resizing here**. Originals upload as-is. The KB build job (Phase 5 of `bot/docs/implementation-plan.md`) applies `w_512,c_limit,f_jpg,q_75` Cloudinary URL transforms at fetch time.
- **Orphaned assets**: if you rename a file locally, the OLD public_id (under its old name) keeps living on Cloudinary as an orphan. Not harmful, but periodically clean up via the Cloudinary console if you want a tidy media library.

### Time-bound URLs (future upgrade)

Today's URLs are non-expiring (signed-URL pattern, validity until API secret rotation). If you want time-bound URLs (e.g., auto-expire 90 days post-wedding), the upgrade path is Cloudinary's **Auth Token** feature — requires console setup and a tweak to the script's URL generation. Not needed for v1.

---

## Photos and git

`.gitignore` in this folder **excludes raw images from git**:

- Photos are large (multiple MB each × ~30 guests × up to 3 photos = could easily exceed 100 MB).
- They're biometric-adjacent data — Cloudinary holds the canonical, access-controlled copy.
- The YAML's `reference_photos` URLs are the durable reference.

**Commit**: `dossier.yaml` files, this README, the `.gitignore`.
**Don't commit**: raw photos. They live in your local working tree + Cloudinary.

---

## Authoring tips

### `safe_jokes` ceiling

**Mild roast level only.** Never risqué. Never about appearance flaws beyond what the guest themselves jokes about. Never family-feud material. Examples of OK:

- "siempre se duerme en la sobremesa"
- "no admite que pierde a las cartas"
- "sigue creyendo que el Sevilla va a ganar la Champions"

Examples of NOT OK (do not put these in `safe_jokes`):

- Anything sexual
- Anything about body / weight / appearance unless they themselves invented the nickname (e.g., "Flako" — origin from the guest's own circle)
- Anything about past partners / divorces / family feuds
- Outbursts, temper, mental health

If something is on the line, put it in `do_not_mention` instead. Thora will internalize but never speak it.

### `recognition_confidence_floor`

Default `0.75` is right for most. Bump higher when misnaming is worse:

- `0.85` — siblings, twins, anyone with a near-look-alike at the wedding.
- `0.90` — elderly relatives, where calling them by the wrong name lands poorly.

### Photos: what works

- **Frontal**. Three-quarter or profile only as a *supplement* to a frontal.
- **Recent**. Don't use photos from 5 years ago if the person looks different now.
- **Well-lit**. Outdoor daylight ideal; harsh shadows hurt recognition.
- **No sunglasses**. Faces matter.
- **Single subject preferred** for at least one photo. Group photos can be supplements but won't ground the recognition.
- **Multiple expressions / angles** if you have them (relaxed face + smiling, for example).

### Cross-references

When you author a dossier for someone whose partner is also a guest (e.g., Javi → Johsanna), mention it in the dossier's `safe_facts`:
> "en pareja con Johsanna (también invitada)"

When you author Johsanna's dossier, mention it the other way too. Thora benefits from both perspectives at runtime.

---

## When you're done with a guest

1. Verify `dossier.yaml`'s `reference_photos` contains 1–3 signed URLs.
2. The KB build job ingests it automatically on the next bot deploy / KB rebuild.
3. Run an evaluation pass (`functions/test/bot/eval.spec.ts`, when Phase 6 exists) to verify Thora recognizes the guest in a sample photo.

If you want to drop a guest entirely (post-launch), delete the folder. The next `upload --all` won't see it; the next KB rebuild will exclude it. Cloudinary orphans persist until you delete them in the console.
