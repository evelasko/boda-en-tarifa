# Boda en Tarifa — Scripts

CLI utilities for managing the wedding app backend.

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
npx tsx generate-magic-links.ts --guest guest@example.com

# Dry-run for a single guest
npx tsx generate-magic-links.ts --dry-run --guest guest@example.com
```

You can also pass the service account key path as a positional argument instead of the environment variable:

```bash
npx tsx generate-magic-links.ts /path/to/service-account-key.json
```

### Output

**Normal run** — CSV to stdout:

```
fullName,email,magicLinkUrl
María García,maria@example.com,https://bodaentarifa.com/login?token=eyJ...&name=Mar%C3%ADa+Garc%C3%ADa
```

**Dry run** — lists guests without generating tokens:

```
fullName,email
María García,maria@example.com
```

Pipe to a file for distribution:

```bash
npm run generate-links > magic-links.csv
```

### Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | List unclaimed guests without minting tokens |
| `--guest <email>` | Generate a link for a single guest by email |

### Security

- The generated CSV contains sensitive auth tokens — treat it as confidential
- Service account key files are excluded from git via root `.gitignore` patterns (`**/service-account*.json`, `**/firebase-adminsdk*.json`)
- Firebase Custom Tokens expire after **1 hour** (fixed by the Admin SDK) — generate links close to when you plan to send them
