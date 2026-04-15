# Boda en Tarifa — Scripts

CLI utilities for managing the wedding app backend.

## Prefer root justfile commands

From repository root, you can run these workflows without `cd`:

- `just data-seed`
- `just data-clear CONFIRM=1`
- `just data-reset CONFIRM=1`
- `just ops-magic-links`
- `just ops-magic-links-dry`
- `just ops-magic-links-emulator` (requires emulators + seed; no service account)
- `just ops-magic-links-emulator-dry`
- `just ops-guest-audit`
- `just ops-guest-backup`

## Emulator data scripts

Seed and clear deterministic Firebase emulator data for local app simulator testing.

### Prerequisites

- Firebase emulators running for project `demo-boda-en-tarifa` (or pass `--project`)
- Environment variables exported in the shell used to run scripts:
  - `FIRESTORE_EMULATOR_HOST` (e.g. `127.0.0.1:8080`)
  - `FIREBASE_AUTH_EMULATOR_HOST` (e.g. `127.0.0.1:9099`)

### Usage

```bash
cd scripts
npm install

# Seed core dataset (Auth + Firestore)
npm run seed:emulator

# Clear seeded data
npm run clear:emulator

# Include optional web RSVP dataset
npm run seed:emulator -- --include-rsvp
npm run clear:emulator -- --include-rsvp

# Include optional migration-case fixtures
npm run seed:emulator -- --include-migration-case
npm run clear:emulator -- --include-migration-case

# Override project id
npm run seed:emulator -- --project demo-boda-en-tarifa
```

### App simulator workflow (seeded emulator data)

Use this flow when you want to run the Flutter app against seeded local Firebase emulators.

1) In terminal A (repo root), start emulators:

```bash
firebase emulators:start --project demo-boda-en-tarifa --only auth,firestore,functions
```

2) In terminal B, clear and reseed deterministic data:

```bash
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099

npm --prefix scripts run clear:emulator
npm --prefix scripts run seed:emulator
```

3) Launch the app in simulator with emulator mode enabled:

```bash
cd app
flutter run \
  --dart-define=USE_FIREBASE_EMULATORS=true \
  --dart-define=FIREBASE_EMULATOR_HOST=127.0.0.1 \
  --dart-define=FIRESTORE_EMULATOR_PORT=8080 \
  --dart-define=FIREBASE_AUTH_EMULATOR_PORT=9099
```

The app keeps production-safe defaults when `USE_FIREBASE_EMULATORS` is not set to `true`.

### Magic links for seeded emulator users (iOS simulator / auth flow)

After emulators are running and data is seeded, generate custom-token login URLs for every Auth user in the seed dataset (same UIDs as `seed-emulator.ts`):

```bash
# From repo root (ports match justfile defaults)
just ops-magic-links-emulator

# Dry-run: list uid / email / name without minting tokens
just ops-magic-links-emulator-dry

# Single guest by email
just ops-magic-links-emulator -- --guest-email ana.mar@example.test

# If you seeded with --include-migration-case, include the migrated Auth user too
just ops-magic-links-emulator -- --include-migration-case
```

Or with npm only:

```bash
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
npm --prefix scripts run generate-links:emulator -- --project demo-boda-en-tarifa
```

CSV columns (normal run): `uid`, `email`, `fullName`, `magicLinkUrl`. Open `magicLinkUrl` on the device or paste into the simulator to exercise the magic-link auth path. Email/password sign-in for seeded users still uses password `Test1234!` from the seed script.

### Suggested seeded smoke checks

- Sign in as a claimed seed user and verify profile loads (`ana.mar@example.test` / `Test1234!`).
- Verify directory visibility excludes hidden profiles.
- Verify feed renders and hidden posts do not appear in normal user views.
- Verify notices render with denormalized author metadata.
- Verify seating assignment appears for a seeded guest.
- Verify unclaimed guest path behaves as expected (`sofia.pending@example.test`).

## generate-magic-links

Bulk-generates Magic Link URLs for unclaimed guest profiles in Firestore. Each link contains a Firebase Custom Auth Token that lets a guest sign in with zero friction.

### Prerequisites

- Node.js 20+
- A Firebase service account key JSON file (never commit this)
- `npm install` in this directory

### Setup

```bash
cd scripts
npm install
```

Set the path to your service account key:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

Optionally override the deep link domain (defaults to `bodaentarifa.com`):

```bash
export DEEP_LINK_DOMAIN=bodaentarifa.com
```

### Usage

```bash
# Generate links for all unclaimed guests (CSV output)
npm run generate-links

# Preview which guests would get links (no tokens minted)
npm run generate-links:dry

# Generate a link for a single guest by email
npx tsx generate-magic-links.ts --guest-email guest@example.com

# Generate a link for a single guest by phone
npx tsx generate-magic-links.ts --guest-phone +34600111222

# Dry-run for a single guest
npx tsx generate-magic-links.ts --dry-run --guest-email guest@example.com
```

You can also pass the service account key path as a positional argument instead of the environment variable:

```bash
npx tsx generate-magic-links.ts /path/to/service-account-key.json
```

### Output

**Normal run** — CSV to stdout:

```
fullName,email,phoneE164,whatsappNumber,whatsappShareUrl,smsShareUrl,magicLinkUrl
María García,maria@example.com,+34600111222,34600111222,https://wa.me/...,sms:+34600111222?body=...,https://bodaentarifa.com/login?token=eyJ...
```

**Dry run** — lists guests without generating tokens:

```
fullName,email,phoneE164,whatsappNumber
María García,maria@example.com,+34600111222,34600111222
```

Pipe to a file for distribution:

```bash
npm run generate-links > magic-links.csv
```

### Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | List unclaimed guests without minting tokens |
| `--guest-email <email>` | Generate a link for a single guest by email |
| `--guest-phone <phone>` | Generate a link for a single guest by phone |

### Security

- The generated CSV contains sensitive auth tokens — treat it as confidential
- Service account key files are excluded from git via root `.gitignore` patterns (`**/service-account*.json`, `**/firebase-adminsdk*.json`)
- Firebase Custom Tokens expire after **1 hour** (fixed by the Admin SDK) — generate links close to when you plan to send them

## audit-guests

Preflight data audit for UID-first, phone-delivered onboarding.

```bash
cd scripts
npm run audit:guests

# Fail on warnings too (for cutover gates)
npm run audit:guests -- --strict
```

Checks include:
- Guests missing both email and valid phone fields
- Invalid `phoneE164` / `whatsappNumber` formats
- Duplicate delivery phone numbers across guests

## export-guests-backup

Creates a JSON backup of the full `guests` collection before migration/cutover.

```bash
cd scripts
npm run backup:guests

# Custom output path
npm run backup:guests -- --output ./backups/guests-pre-cutover.json
```
