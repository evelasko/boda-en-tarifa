# Magic Link Authentication — End-to-End Integration Spec

> **Version:** 1.0
> **Date:** 2026-02-28
> **Issue:** MFC-17
> **Workstreams:** Dashboard (web), Firebase Cloud Functions, Flutter App

This document describes the complete Magic Link authentication flow from link generation through profile claiming. It is the single source of truth referenced by all three workstreams.

For detailed implementation patterns, see:

- `app/specs/technical-architecture.md` — Sections 10.1 (Claim Your Profile), 10.2 (Magic Link via Custom Token), 10.3 (Social Auth), 10.4 (Access Control)
- `app/specs/developer-journeys.md` — Epic 1 (Onboarding, Authentication & Permissions)

---

## 1. Overview

The Magic Link system uses **Firebase Custom Tokens** (not Firebase Email Link Auth) to achieve zero-friction onboarding. An admin generates a personalized deep link for each guest, shares it via WhatsApp or email, and the guest taps the link to land directly inside the app — authenticated and ready for onboarding.

This is a **profile-claiming** process: guests are pre-registered in the Firestore `guests/` collection before any authentication happens. Authentication simply binds a Firebase Auth identity to an existing guest record.

---

## 2. Full Sequence

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MAGIC LINK FLOW                                  │
│                                                                         │
│  ┌───────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │ Dashboard │───▶│ generateLink │───▶│  Guest taps  │───▶│ Flutter   │ │
│  │ (Admin)   │    │ Cloud Fn     │    │  deep link   │    │ App       │ │
│  └───────────┘    └──────────────┘    └──────────────┘    └─────┬─────┘ │
│                                                                 │       │
│                                                                 ▼       │
│                                                          signInWith     │
│                                                          CustomToken()  │
│                                                                 │       │
│                                                                 ▼       │
│                                                          ┌────────────┐ │
│                                                          │onUserCreate│ │
│                                                          │ Cloud Fn   │ │
│                                                          └─────┬──────┘ │
│                                                                │        │
│                                              ┌─────────────────┼───┐    │
│                                              │                 │   │    │
│                                              ▼                 ▼   │    │
│                                        Email match?      No match  │    │
│                                        profileClaimed    authorized│    │
│                                        = true            = false   │    │
│                                        authorized                  │    │
│                                        = true                      │    │
│                                              │                     │    │
│                                              ▼                     ▼    │
│                                        Setup Wizard     "Invitation"    │
│                                        (new user)        not found"     │
│                                        OR Home (return)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Stage 1 — Magic Link Generation (Dashboard)

1. An admin (the couple or best man) opens the admin dashboard and selects a guest from the Firestore `guests/` allowlist.
2. The dashboard calls the `generateMagicLink` Cloud Function, passing the guest's UID.
3. The Cloud Function uses the Firebase Admin SDK to mint a Custom Auth Token scoped to that guest's UID.
4. The Cloud Function constructs a deep link URL (see Section 3) and returns it.
5. The admin copies the link and shares it via WhatsApp, email, or any messaging channel.

### Stage 2 — Deep Link Handling (Flutter App)

1. The guest taps the link on their device.
2. iOS Universal Links / Android App Links route the URL directly into the Flutter app.
3. If the app is not installed, the link falls back to the web domain, which redirects to the appropriate app store.
4. The app extracts the `token` query parameter from the deep link URL.
5. The app calls `FirebaseAuth.instance.signInWithCustomToken(token)`.
6. On success, Firebase Auth creates or signs in the user, triggering the `onUserCreate` Cloud Function.

### Stage 3 — Cloud Function Validation (onUserCreate)

1. The `onUserCreate` function fires when Firebase Auth creates or signs in a user.
2. It reads the authenticated user's email from the Auth record.
3. It queries the `guests/` collection for a document where `email` matches.
4. **If a match is found** and `profileClaimed` is `false`:
   - Sets `profileClaimed = true` on the guest document.
   - Sets custom claim `{ "authorized": true }` on the Auth user.
5. **If a match is found** and `profileClaimed` is already `true`:
   - Leaves the document unchanged (returning user or profile merge scenario).
   - Ensures custom claim `{ "authorized": true }` is set.
6. **If no match is found**:
   - Sets custom claim `{ "authorized": false }`.
   - The client will show the "Invitation not found" screen.

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

### Token Specification

| Property         | Value                                              |
|------------------|----------------------------------------------------|
| Format           | JWT signed by Firebase Admin SDK service account   |
| Lifetime         | 72 hours (recommended default)                     |
| Configuration    | Via environment variable `MAGIC_LINK_TOKEN_TTL_HOURS` or Firebase Remote Config `magic_link_token_ttl_hours` |
| Scope            | Contains the guest's `uid` as the token subject    |
| Single-use       | No (token can be reused within its lifetime)       |

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

### 4.1 generateMagicLink Cloud Function

**Caller:** Dashboard (web)

**Input (HTTPS callable):**

```typescript
interface GenerateMagicLinkRequest {
  guestUid: string;  // UID of the guest from the guests/ collection
}
```

**Output:**

```typescript
interface GenerateMagicLinkResponse {
  deepLinkUrl: string;  // Full URL: https://bodaentarifa.com/login?token=...&name=...
  expiresAt: string;    // ISO-8601 timestamp of token expiration
}
```

**Behavior:**

1. Validates the caller has admin privileges (`context.auth.token.admin === true`).
2. Reads the guest document from `guests/{guestUid}` to retrieve `email` and `fullName`.
3. Calls `admin.auth().createCustomToken(guestUid)` to mint a Custom Auth Token.
4. Constructs the deep link URL with the token and URL-encoded guest name.
5. Returns the URL and expiration timestamp.

**Errors:**

| Code                  | Condition                              |
|-----------------------|----------------------------------------|
| `unauthenticated`     | Caller is not authenticated            |
| `permission-denied`   | Caller does not have admin claim       |
| `not-found`           | No guest document for the given UID    |
| `internal`            | Token generation failed                |

### 4.2 onUserCreate Cloud Function

**Trigger:** `auth.user().onCreate` (Firebase Authentication)

**Input (from trigger):**

```typescript
interface UserRecord {
  uid: string;
  email: string | undefined;
  displayName: string | undefined;
  // ... other Firebase Auth fields
}
```

**Behavior:**

1. Reads `email` from the `UserRecord`.
2. Queries `guests/` collection: `where("email", "==", email)`.
3. **Match found, `profileClaimed == false`:**
   - Updates guest document: `{ profileClaimed: true, updatedAt: serverTimestamp() }`
   - Sets custom claims: `admin.auth().setCustomUserClaims(uid, { authorized: true })`
4. **Match found, `profileClaimed == true`:**
   - Sets custom claims: `admin.auth().setCustomUserClaims(uid, { authorized: true })`
   - Does not modify the guest document (profile already claimed).
5. **No match:**
   - Sets custom claims: `admin.auth().setCustomUserClaims(uid, { authorized: false })`

**Writes:**

| Target                    | Field              | Value                          |
|---------------------------|--------------------|--------------------------------|
| `guests/{guestUid}`       | `profileClaimed`   | `true`                         |
| `guests/{guestUid}`       | `updatedAt`        | `serverTimestamp()`            |
| Firebase Auth custom claims | `authorized`     | `true` or `false`              |

### 4.3 Flutter App — Deep Link Consumption

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

---

## 5. Error Scenarios

### 5.1 Token Expired

**Condition:** The Custom Auth Token has exceeded its configured lifetime (default: 72 hours).

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

### 5.3 Profile Already Claimed by Another Auth Method

**Condition:** A guest has already authenticated via Google or Apple Sign-In, and now taps a Magic Link.

**System behavior:** `signInWithCustomToken()` creates a new Auth user with the guest's UID. If a user with that UID already exists, Firebase Auth updates the existing user. The `onUserCreate` function finds `profileClaimed == true` and sets `authorized: true` without modifying the guest document.

**User-facing:** The app detects the profile is already claimed and the user has completed onboarding. It navigates directly to the Home tab. If the user has not completed onboarding (edge case), it shows the Setup Wizard.

**Logging:** `info` level log noting profile merge: `"Profile already claimed for UID {uid}, skipping claim step"`.

### 5.4 Email Not in Firestore Allowlist

**Condition:** The authenticated email does not match any document in the `guests/` collection. This can happen if a social auth user signs in with an unregistered email.

**System behavior:** `onUserCreate` sets custom claim `{ authorized: false }`.

**User-facing:** A hard wall screen:
> "Invitation not found. This app is for invited guests of Enrique & Manuel's wedding. If you believe this is an error, please contact us."
>
> [Contact the couple] (opens WhatsApp or email)

**Logging:** `AuthFailure("Email not in allowlist: ${email}", stackTrace)` logged at `warning` level.

### 5.5 Network Failure During Token Exchange

**Condition:** The device loses connectivity during `signInWithCustomToken()` or the subsequent Firestore reads.

**System behavior:** `signInWithCustomToken()` throws a network-related exception.

**User-facing:**
> "No internet connection. Please check your Wi-Fi or mobile data and try again."
>
> [Retry]

The retry button re-attempts the `signInWithCustomToken()` call with the same token. A maximum of 3 automatic retries with exponential backoff (1s, 2s, 4s) should be attempted before showing the manual retry screen.

**Logging:** `NetworkFailure("Token exchange failed: ${error}", stackTrace)` logged at `warning` level.

---

## 6. Workstream Responsibilities

### Dashboard (web)

| Responsibility                        | Details                                                    |
|---------------------------------------|------------------------------------------------------------|
| Guest list UI                         | Display guests from `guests/` collection with claim status |
| Link generation trigger               | Call `generateMagicLink` Cloud Function with guest UID     |
| Link display and copy                 | Show generated URL, provide copy-to-clipboard button       |
| Link sharing                          | Optional: direct WhatsApp share via `https://wa.me/?text=` |
| Admin authentication                  | Google/Apple sign-in, must have `admin: true` custom claim |

### Firebase Cloud Functions

| Function             | Trigger           | Input               | Output / Side Effects                      |
|----------------------|-------------------|----------------------|--------------------------------------------|
| `generateMagicLink`  | HTTPS callable    | `{ guestUid }`       | `{ deepLinkUrl, expiresAt }`               |
| `onUserCreate`       | `auth.user().onCreate` | `UserRecord`    | Sets custom claims, updates `profileClaimed` |

### Flutter App

| Responsibility                  | Details                                                      |
|---------------------------------|--------------------------------------------------------------|
| Deep link interception          | `app_links` package, handle cold start and warm start        |
| Token extraction and exchange   | Parse `token` from URL, call `signInWithCustomToken()`       |
| Claims check                    | Read `authorized` from ID token claims                       |
| Onboarding routing              | New user → Setup Wizard; returning user → Home               |
| Error screens                   | Token expired, invalid token, not found, network failure     |
| Local onboarding flag           | Store completion in Drift/SharedPreferences                  |

---

## 7. Firestore Guests Collection Schema

Reference: `app/specs/technical-architecture.md` Section 7.1

```
guests/{uid}
├── email: string              # Used for allowlist matching
├── fullName: string           # Display name
├── photoUrl: string?          # Profile photo (may be pre-set by couple)
├── whatsappNumber: string?    # For contact preference
├── funFact: string?           # Personalization
├── relationToGrooms: string   # e.g., "friend", "family"
├── relationshipStatus: string # "soltero" | "enPareja" | "buscando"
├── side: string               # "novioA" | "novioB" | "ambos"
├── profileClaimed: bool       # Set to true by onUserCreate
├── createdAt: timestamp       # Set when admin creates the record
└── updatedAt: timestamp       # Updated on profile claim or edit
```

Fields protected from client-side modification (enforced by Firestore rules): `email`, `uid`, `side`, `relationToGrooms`, `profileClaimed`, `createdAt`.

---

## 8. Security Considerations

- **Custom Tokens vs. Email Link Auth:** This system deliberately uses Firebase Custom Tokens rather than Firebase Email Link Auth. Custom Tokens allow frictionless sharing via WhatsApp (no email inbox required) and give full control over the token's scope and lifetime.
- **Token in URL:** The Custom Auth Token is passed as a query parameter. While this means it appears in browser history if the fallback page is visited, the token is short-lived (72h default) and scoped to a single guest UID.
- **No password storage:** No passwords are ever created, stored, or transmitted.
- **Allowlist enforcement:** Both the Cloud Function (custom claims) and Firestore rules (document-level access) enforce the guest allowlist. A user cannot access app data without a matching guest document.
- **Admin-only link generation:** The `generateMagicLink` function validates the caller's `admin` custom claim before minting tokens.
