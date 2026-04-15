# Magic Link Authentication — End-to-End Integration Spec

> **Version:** 1.1
> **Date:** 2026-04-15
> **Issue:** MFC-17
> **Workstreams:** Dashboard (web), Firebase Cloud Functions, Flutter App, Ops scripts

This document describes the complete Magic Link authentication flow from link generation through profile claiming. It is the single source of truth referenced by all three workstreams.

For detailed implementation patterns, see:

- `app/specs/technical-architecture.md` — Sections 10.1 (Claim Your Profile), 10.2 (Magic Link via Custom Token), 10.3 (Social Auth), 10.4 (Access Control)
- `app/specs/developer-journeys.md` — Epic 1 (Onboarding, Authentication & Permissions)
- `firebase/docs/firestore-data-model.md` — `guests/` and `magic_link_issues/` schemas
- `docs/phone-magic-link-rollout-runbook.md` — staged rollout and rollback
- `specs/testing-policy.md` — §8.1 magic-link verification checklist

---

## 1. Overview

The Magic Link system uses **Firebase Custom Tokens** (not Firebase Email Link Auth) to achieve zero-friction onboarding. An admin generates a personalized deep link for each guest, shares it via WhatsApp/SMS, and the guest taps the link to land directly inside the app — authenticated and ready for onboarding.

This is a **profile-claiming** process: guests are pre-registered in the Firestore `guests/` collection (document ID **equals** the guest’s Firebase Auth UID) before sign-in. Magic links mint a **custom token for that UID**; delivery is via WhatsApp/SMS using `phoneE164` and/or `whatsappNumber` on the guest doc — **email is optional** and not used for allowlist matching.

---

## 2. Full Sequence

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MAGIC LINK FLOW                                  │
│                                                                         │
│  ┌───────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │ Dashboard │───▶│ generateLink │───▶│  Guest taps  │───▶│ Flutter   │ │
│  │ (Admin)   │    │ (Fn or API)  │    │  deep link   │    │ App       │ │
│  └───────────┘    └──────────────┘    └──────────────┘    └─────┬─────┘ │
│                                                                 │       │
│                                                                 ▼       │
│                                                          signInWith     │
│                                                          CustomToken()  │
│                                                                 │       │
│                                                                 ▼       │
│                                                          ┌────────────┐ │
│                                                          │beforeUser  │ │
│                                                          │Created     │ │
│                                                          └─────┬──────┘ │
│                                                                │        │
│                                              ┌─────────────────┼───┐    │
│                                              │                 │   │    │
│                                              ▼                 ▼   │    │
│                                        guests/{uid}      No doc    │    │
│                                        exists?           authorized│    │
│                                        profileClaimed    = false   │    │
│                                        + claims          │         │    │
│                                        authorized=true │         │    │
│                                              │                     │    │
│                                              ▼                     ▼    │
│                                        Setup Wizard     "Invitation"    │
│                                        (new user)        not found"     │
│                                        OR Home (return)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Stage 1 — Magic Link Generation (Dashboard or ops)

1. An admin opens the dashboard guest list (or runs ops scripts against production with a service account).
2. **Dashboard path:** Next.js calls `POST /api/admin/guests/{uid}/magic-link` with an admin ID token (same issuance semantics as the callable).
3. **Callable path:** Admin client calls the `generateMagicLink` HTTPS callable with `{ guestUid }`.
4. The generator validates the caller is an admin, loads `guests/{guestUid}`, applies **rate limits**, optionally **revokes** prior active issuance rows for that guest, writes a row to `magic_link_issues/{linkId}`, and calls `createCustomToken(guestUid, { magicLinkId: linkId })`.
5. The response includes `deepLinkUrl` (and on the web route, optional `whatsappShareUrl` / `smsShareUrl` when phone fields are present).
6. The admin shares the link via WhatsApp/SMS (prefilled share URLs) or copy-paste.

### Stage 2 — Deep Link Handling (Flutter App)

1. The guest taps the link on their device.
2. iOS Universal Links / Android App Links route the URL directly into the Flutter app.
3. If the app is not installed, the link falls back to the web domain, which redirects to the appropriate app store.
4. The app extracts the `token` query parameter from the deep link URL.
5. The app calls `FirebaseAuth.instance.signInWithCustomToken(token)`.
6. On success, Firebase Auth creates or updates the user. Firebase invokes the **blocking** Identity trigger **`beforeUserCreated`** (implemented in this repo as the exported Cloud Function `onUserCreate`) **before** the user record is committed.

### Stage 3 — Blocking validation (`beforeUserCreated` / `onUserCreate`)

1. The function runs for each new user sign-up attempt (including the first sign-in via custom token for that UID).
2. It reads `uid` from the blocking event payload.
3. It loads **`guests/{uid}`** by document ID (no email query).
4. **If the document exists** and `profileClaimed` is `false`:
   - Updates the guest document: `profileClaimed: true`, `updatedAt: serverTimestamp()`.
   - Returns `{ customClaims: { authorized: true } }` (and `admin: true` if `guests.isAdmin === true`).
5. **If the document exists** and `profileClaimed` is already `true`:
   - Does not change the guest document.
   - Returns `{ customClaims: { authorized: true } }` (and `admin` when applicable).
6. **If the document does not exist**:
   - Returns `{ customClaims: { authorized: false } }`.
   - The client should treat missing allowlist as **no access** (see §5.4).
7. **Issuance lifecycle (best-effort):** After a successful allowlist match, the function finds the newest **active** `magic_link_issues` row for that `guestUid` (`usedAt == null`, `revokedAt == null`) and sets `usedAt` to an ISO timestamp for audit. Failures here are logged but do **not** block sign-in.

### Stage 4 — Profile Claiming (Flutter App)

1. After `signInWithCustomToken` succeeds, the app fetches the user's ID token (which now contains custom claims).
2. If `authorized == true` and `profileClaimed` was just set to `true` (first-time user):
   - The app navigates to the **Setup Wizard** (communication preference, privacy settings, device permissions).
   - On wizard completion, a local flag is stored in Drift/SharedPreferences to prevent re-showing.
3. If `authorized == true` and the user has completed onboarding before (returning user):
   - The app skips the wizard and navigates to the Home tab.
4. If `authorized == false`:
   - The app shows the "Invitation not found" screen with contact info for the couple.

---

## 3. Deep Link URL Structure

### Format

```
https://bodaentarifa.com/login?token={customAuthToken}&name={guestName}
```

### Parameters

| Parameter | Type   | Required | Description                                           |
|-----------|--------|----------|-------------------------------------------------------|
| `token`   | string | Yes      | Firebase Custom Auth Token (JWT, signed by Admin SDK) |
| `name`    | string | No       | URL-encoded guest name for personalization             |

### Token specification

| Property | Value |
|----------|--------|
| Format | JWT signed by the Firebase Admin SDK (custom token) |
| Subject | The guest’s Firebase Auth `uid` |
| Additional claims | `magicLinkId`: UUID of the `magic_link_issues` row created at issuance (for correlation and future strict policies) |
| **Firebase-enforced expiry** | Custom tokens have a **fixed maximum lifetime of one hour** from minting (Firebase Auth platform limit). Guests must sign in within that window. |
| **Operational “link validity” window** | Server-side `expiresAt` on `magic_link_issues` defaults to **`MAGIC_LINK_TTL_MINUTES`** (default **60**) from issuance, aligned with the hour cap. Tune via environment variables on Functions and the Next.js admin API. |
| Reuse within one hour | The same JWT can be used for multiple `signInWithCustomToken` attempts until Firebase rejects it as expired. Issuance rows track `usedAt` for audit; optional `singleUse` flag is stored for policy documentation. |

### Issuance audit collection (`magic_link_issues`)

Each generation creates **`magic_link_issues/{linkId}`** (UUID) with at least:

| Field | Purpose |
|-------|---------|
| `guestUid` | Guest UID / token subject |
| `issuedBy` | Admin UID who minted the link |
| `issuedAt` / `expiresAt` | ISO timestamps for auditing and cleanup hints |
| `usedAt` / `revokedAt` / `revokedReason` | Lifecycle: consumed sign-in, or superseded when a newer link is issued |
| `singleUse` | Mirrors env `MAGIC_LINK_SINGLE_USE_ENABLED` (reserved for stricter policies) |

**Rate limits** (callable and web): counts of rows in `magic_link_issues` with `issuedAt` within `MAGIC_LINK_RATE_LIMIT_WINDOW_MINUTES` per guest and per admin; exceeding limits returns **resource exhausted** / HTTP 429.

**Revoke previous:** When `MAGIC_LINK_REVOKE_PREVIOUS_ENABLED` is true (default), active rows for that guest are marked `revokedAt` / `revokedReason: superseded` before inserting the new row. **Note:** Older JWTs may remain valid until Firebase’s one-hour custom-token expiry unless additional validation is added at sign-in.

Canonical Firestore field definitions: `firebase/docs/firestore-data-model.md` (including `magic_link_issues`).

### Domain Configuration

For the deep link to open the app automatically:

**iOS (Universal Links):**

- Host an `apple-app-site-association` file at `https://bodaentarifa.com/.well-known/apple-app-site-association`
- Content:
  ```json
  {
    "applinks": {
      "apps": [],
      "details": [
        {
          "appID": "{TEAM_ID}.com.whitehibiscus.bodaentarifa",
          "paths": ["/login*"]
        }
      ]
    }
  }
  ```
- The file must be served over HTTPS with `Content-Type: application/json`

**Android (App Links):**

- Host an `assetlinks.json` file at `https://bodaentarifa.com/.well-known/assetlinks.json`
- Content:
  ```json
  [
    {
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "com.whitehibiscus.bodaentarifa",
        "sha256_cert_fingerprints": ["{SHA256_FINGERPRINT}"]
      }
    }
  ]
  ```

**Fallback (app not installed):**

- The web domain serves a landing page at `/login` that detects the platform and redirects to the appropriate app store.
- The `token` parameter is preserved in the redirect so the app can consume it after installation via deferred deep linking (if supported) or prompt the user to tap the link again.

### Flutter Deep Link Packages

| Package           | Purpose                                              |
|-------------------|------------------------------------------------------|
| `app_links`       | Intercepts Universal Links / App Links on cold and warm start |
| `go_router`       | Route-level deep link handling via `redirect`        |

---

## 4. Data Contracts

### 4.1 `generateMagicLink` (HTTPS callable, Cloud Functions)

**Caller:** Tooling that uses the Firebase client SDK with an authenticated user whose ID token includes **`admin: true`** (e.g. future automation). The **dashboard UI** uses the Next.js route in §4.2 instead of this callable.

**Input:**

```typescript
interface GenerateMagicLinkRequest {
  guestUid: string;  // Document ID in guests/ (Firebase Auth UID for that guest)
}
```

**Output:**

```typescript
interface GenerateMagicLinkResponse {
  deepLinkUrl: string;   // https://{DEEP_LINK_DOMAIN}/login?token=...&name=...
  issuedAt: string;      // ISO-8601 when the row was written
  expiresAt: string;     // ISO-8601 operational expiry (see §3)
  linkId: string;        // UUID; document ID in magic_link_issues/
}
```

**Behavior (summary):**

1. Requires `request.auth` and `request.auth.token.admin === true`.
2. Loads `guests/{guestUid}`; errors if missing.
3. Enforces per-guest and per-admin **rate limits** via `magic_link_issues` counts (env: `MAGIC_LINK_RATE_LIMIT_*`).
4. Optionally revokes prior active issuance rows (`MAGIC_LINK_REVOKE_PREVIOUS_ENABLED`, default true).
5. Creates `magic_link_issues/{linkId}` then `createCustomToken(guestUid, { magicLinkId: linkId })`.
6. Returns `deepLinkUrl`, `issuedAt`, `expiresAt`, `linkId`.

**Environment variables (Functions):** `MAGIC_LINK_TTL_MINUTES`, `MAGIC_LINK_REVOKE_PREVIOUS_ENABLED`, `MAGIC_LINK_SINGLE_USE_ENABLED`, `MAGIC_LINK_RATE_LIMIT_WINDOW_MINUTES`, `MAGIC_LINK_RATE_LIMIT_PER_GUEST`, `MAGIC_LINK_RATE_LIMIT_PER_ADMIN`, `DEEP_LINK_DOMAIN`.

**Errors:**

| Code | Condition |
|------|-----------|
| `unauthenticated` | Caller is not authenticated |
| `permission-denied` | Caller does not have `admin` custom claim |
| `invalid-argument` | Missing or invalid `guestUid` |
| `not-found` | No `guests/{guestUid}` document |
| `resource-exhausted` | Rate limit exceeded |
| `internal` | Token mint or Firestore batch failed |

### 4.2 Admin API — `POST /api/admin/guests/{uid}/magic-link` (Next.js)

**Caller:** Web admin UI (Bearer ID token; admin allowlist in `config/admins`).

**Output (JSON):** Same minting and `magic_link_issues` behavior as §4.1, plus delivery helpers when guest phone fields exist:

| Field | Description |
|-------|-------------|
| `magicLinkUrl` | Login URL with `token` query param |
| `issuedAt`, `expiresAt`, `linkId` | Issuance metadata (parity with callable) |
| `whatsappShareUrl` | `https://wa.me/{whatsappNumber}?text=...` when `whatsappNumber` is set (digits without `+`, see data model) |
| `smsShareUrl` | `sms:{phoneE164}?body=...` when `phoneE164` is set (E.164 with `+`) |

**HTTP errors:** `401` / `403` for auth; `404` guest missing; `429` rate limit; `500` on failure.

Uses the same **`MAGIC_LINK_*`** environment variables as the Functions deployment where the admin app runs.

### 4.3 `onUserCreate` — blocking `beforeUserCreated` (Identity)

**Trigger:** Firebase Authentication **blocking** event **`beforeUserCreated`** (Gen2 Identity API). In code the export is named `onUserCreate`.

**Input (from trigger):** Blocking identity event payload including at least `uid` (and optionally `email`, `phoneNumber`, etc.). **Allowlist logic uses only `uid` vs `guests/{uid}`.**

**Behavior:**

1. Loads `guests/{uid}` by document ID.
2. **Document exists:** update `profileClaimed` on first claim; return `{ customClaims: { authorized: true, admin?: true } }` from the blocking handler (Firebase applies these claims to the new user — **not** a separate `setCustomUserClaims` call in this flow).
3. **Document missing:** return `{ customClaims: { authorized: false } }`.
4. Best-effort: mark the latest active `magic_link_issues` row as used (`usedAt`), see Stage 3.

**Writes:**

| Target | Field | Value |
|--------|--------|--------|
| `guests/{uid}` | `profileClaimed` | `true` on first successful claim |
| `guests/{uid}` | `updatedAt` | `serverTimestamp()` |
| `magic_link_issues/*` | `usedAt`, `updatedAt` | Set when an active row is found (audit) |
| Auth user (via blocking return) | `authorized`, `admin` | Booleans as above |

### 4.4 Flutter App — Deep Link Consumption

**Reads from deep link URL:**

| Parameter | Usage                                              |
|-----------|-----------------------------------------------------|
| `token`   | Passed to `FirebaseAuth.instance.signInWithCustomToken(token)` |
| `name`    | Displayed on welcome screen during token exchange   |

**Expects from Firebase Auth after signInWithCustomToken:**

| Field                       | Type    | Usage                                        |
|-----------------------------|---------|----------------------------------------------|
| `User.uid`                  | string  | Used to read `guests/{uid}` document          |
| `IdTokenResult.claims.authorized` | bool | Determines access: `true` = proceed, `false` = deny |

**Reads from Firestore after authentication:**

| Document           | Field           | Usage                                            |
|--------------------|-----------------|--------------------------------------------------|
| `guests/{uid}`     | `profileClaimed`| `true` + first visit = show Setup Wizard; `true` + returning = skip to Home |
| `guests/{uid}`     | `fullName`      | Display in app UI                                |
| `guests/{uid}`     | All fields      | Populate profile and settings                    |

### 4.5 Ops script — `scripts/generate-magic-links.ts`

**Caller:** Operators with a service account JSON (`GOOGLE_APPLICATION_CREDENTIALS` or path argument).

**Behavior:** Queries Firestore for unclaimed guests (optional filter `--guest-email` or `--guest-phone`), mints `createCustomToken(uid)` **without** `magic_link_issues` rows or rate-limit counters. Outputs CSV columns including `whatsappShareUrl`, `smsShareUrl`, and `magicLinkUrl` for bulk send workflows.

**Note:** For parity with §4.1–4.2 (audit + rate limits + revoke), prefer the **admin API** or **`generateMagicLink`** callable; use this script when you explicitly want a lightweight bulk export. Custom tokens are still bound by Firebase’s **one-hour** expiry.

---

## 5. Error Scenarios

### 5.1 Token Expired

**Condition:** The Custom Auth Token has exceeded Firebase’s maximum lifetime (**one hour** from minting), or the client attempts sign-in after that window.

**System behavior:** `signInWithCustomToken()` throws `FirebaseAuthException` with code `invalid-custom-token` or the token's internal expiry check fails.

**User-facing:** A screen stating:
> "This link has expired. Please ask Enrique & Manuel to send you a fresh link."

**Logging:** `AuthFailure("Token expired", stackTrace)` logged at `warning` level with the guest UID (extracted from the token if possible).

### 5.2 Token Malformed or Invalid

**Condition:** The `token` parameter is missing, truncated, or not a valid JWT.

**System behavior:** `signInWithCustomToken()` throws `FirebaseAuthException` with code `invalid-custom-token`.

**User-facing:** Same screen as 5.1:
> "This link has expired. Please ask Enrique & Manuel to send you a fresh link."

**Logging:** `AuthFailure("Invalid token: ${errorCode}", stackTrace)` logged at `error` level. Include the raw error code for debugging but never log the token value.

### 5.3 Profile Already Claimed (same UID)

**Condition:** The guest already claimed their profile (`profileClaimed == true` on `guests/{uid}`) and taps another valid magic link or returns via the same UID (e.g. previously signed in with Google/Apple **using the same Firebase Auth UID** as the pre-created guest document).

**System behavior:** `signInWithCustomToken()` targets the same `uid`. **`beforeUserCreated`** finds `guests/{uid}`, leaves `profileClaimed` unchanged, and returns `authorized: true`.

**Note:** Social sign-in for a UID that **does not** match a pre-created `guests/{uid}` document will yield `authorized: false` under the UID-first allowlist (unless a separate admin migration creates that document).

**User-facing:** The app detects the profile is already claimed and the user has completed onboarding. It navigates directly to the Home tab. If the user has not completed onboarding (edge case), it shows the Setup Wizard.

**Logging:** `info` level log noting profile merge: `"Profile already claimed for UID {uid}, skipping claim step"`.

### 5.4 UID Not in Firestore Allowlist

**Condition:** The authenticated UID does not match any document in the `guests/` collection.

**System behavior:** `onUserCreate` sets custom claim `{ authorized: false }`.

**User-facing:** A hard wall screen:
> "Invitation not found. This app is for invited guests of Enrique & Manuel's wedding. If you believe this is an error, please contact us."
>
> [Contact the couple] (opens WhatsApp)

**Logging:** `AuthFailure("UID not in allowlist: ${uid}", stackTrace)` logged at `warning` level.

### 5.5 Network Failure During Token Exchange

**Condition:** The device loses connectivity during `signInWithCustomToken()` or the subsequent Firestore reads.

**System behavior:** `signInWithCustomToken()` throws a network-related exception.

**User-facing:**
> "No internet connection. Please check your Wi-Fi or mobile data and try again."
>
> [Retry]

The retry button re-attempts the `signInWithCustomToken()` call with the same token. A maximum of 3 automatic retries with exponential backoff (1s, 2s, 4s) should be attempted before showing the manual retry screen.

**Logging:** `NetworkFailure("Token exchange failed: ${error}", stackTrace)` logged at `warning` level.

### 5.6 Link generation rate limited

**Condition:** Too many `magic_link_issues` rows were created for the same guest or the same admin inside the configured sliding window.

**System behavior:** `generateMagicLink` responds with `resource-exhausted`; the admin API responds with **HTTP 429**.

**User-facing:** Admin UI should show a “try again later” message; backoff before bulk re-sends.

---

## 6. Workstream Responsibilities

### Dashboard (web)

| Responsibility | Details |
|----------------|---------|
| Guest list UI | Display guests from `guests/` with claim status; search by name, email, or phone |
| Link generation | `POST /api/admin/guests/{uid}/magic-link` (primary UI path) |
| Link display | Show URL, copy; open WhatsApp / SMS when share URLs are returned |
| Guest CRUD | Collect optional `email`, `phoneE164` (E.164), `whatsappNumber` (international digits without `+` for `wa.me`) per `firebase/docs/firestore-data-model.md` |
| Admin authentication | Firebase sign-in + `config/admins` allowlist for dashboard admin API |

### Firebase Cloud Functions

| Function | Trigger | Input | Output / Side Effects |
|----------|---------|-------|------------------------|
| `generateMagicLink` | HTTPS callable | `{ guestUid }` | `{ deepLinkUrl, issuedAt, expiresAt, linkId }` + `magic_link_issues` row |
| `onUserCreate` | `beforeUserCreated` (blocking) | Identity event (`uid`, …) | Returns `customClaims`; updates `guests/{uid}`; marks `magic_link_issues` used (best-effort) |
| `cleanupExpiredMagicLinks` | Scheduled | — | Deletes stale **unauthorized** Auth users; respects `MAGIC_LINK_CLEANUP_DRY_RUN`; consults `magic_link_issues` for pending unexpired links |

### Flutter App

| Responsibility                  | Details                                                      |
|---------------------------------|--------------------------------------------------------------|
| Deep link interception          | `app_links` package, handle cold start and warm start        |
| Token extraction and exchange   | Parse `token` from URL, call `signInWithCustomToken()`       |
| Claims check                    | Read `authorized` from ID token claims (and/or infer from `guests/{uid}` after sign-in, per app implementation) |
| Onboarding routing              | New user → Setup Wizard; returning user → Home               |
| Error screens                   | Token expired, invalid token, not found, network failure     |
| Local onboarding flag           | Store completion in Drift/SharedPreferences                  |

### Ops / scripts

| Responsibility | Details |
|----------------|---------|
| Bulk link CSV | `scripts/generate-magic-links.ts` — optional `--guest-email` / `--guest-phone`; see `scripts/README.md` |
| Preflight audit | `scripts/audit-guests.ts` — phone + UID consistency checks |
| Guest backup | `scripts/export-guests-backup.ts` — JSON export before cutover |
| Justfile shortcuts | `just ops-guest-audit`, `just ops-guest-backup`, `just ops-magic-links*` |

---

## 7. Firestore Guests Collection Schema

Reference: `app/specs/technical-architecture.md` Section 7.1

```
guests/{uid}
├── email: string?             # Optional metadata (not auth-critical)
├── phoneE164: string?         # Canonical phone number for SMS delivery
├── fullName: string           # Display name
├── photoUrl: string?          # Profile photo (may be pre-set by couple)
├── whatsappNumber: string?    # International digits without + (WhatsApp / wa.me)
├── funFact: string?           # Personalization
├── relationToGrooms: string   # e.g., "friend", "family"
├── relationshipStatus: string # "soltero" | "enPareja" | "buscando"
├── side: string               # "novioA" | "novioB" | "ambos"
├── profileClaimed: bool       # Set to true by onUserCreate
├── createdAt: timestamp       # Set when admin creates the record
└── updatedAt: timestamp       # Updated on profile claim or edit
```

Fields intended as **admin-only** (immutable by guest) are listed in `firebase/docs/firestore-data-model.md`. Firestore security rules in `firebase/firestore.rules` must stay aligned with that list (including `phoneE164` where applicable).

---

## 8. Security Considerations

- **Custom Tokens vs. Email Link Auth:** This system deliberately uses Firebase Custom Tokens rather than Firebase Email Link Auth. Custom Tokens allow frictionless sharing via WhatsApp/SMS (no inbox required). **Phone numbers are for delivery and guest metadata only; allowlist is UID + `guests/{uid}`.**
- **Token in URL:** The custom token is passed as the `token` query parameter. It appears in browser history or referrer logs if the user opens the link in a web view — mitigate with **short mint-to-use time**, ops discipline, and optional revoke/resend.
- **Firebase custom token TTL:** Maximum **one hour** from minting. Operational `expiresAt` on `magic_link_issues` should match how you communicate freshness to guests.
- **Issuance audit:** `magic_link_issues` supports rate limiting, superseded links, cleanup hints, and post-incident forensics.
- **No password storage:** No passwords are ever created, stored, or transmitted.
- **Allowlist enforcement:** Blocking `beforeUserCreated` sets `authorized` from `guests/{uid}`. Firestore rules still require authenticated reads/writes; guests without a document cannot be meaningfully authorized for app data.
- **Admin-only link generation:** Callable requires `admin` JWT claim; Next.js route uses server-side admin verification (`requireAdmin` + `config/admins`).

### Remote Config rollout keys (product / ops coordination)

Template defaults live in `firebase/remoteconfig.template.json` (see `firebase/docs/remote-config-keys.md`):

- `auth_uid_first_enabled` — documents UID-first policy for humans and tooling.
- `auth_single_use_links_enabled` — feature gate for stricter single-use semantics when implemented end-to-end.
- `auth_link_ttl_minutes` — suggested default minutes for ops playbooks (must not exceed Firebase’s one-hour custom-token cap).
