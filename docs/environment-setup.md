# Environment Setup Guide

Step-by-step instructions for configuring a working development environment for the **Boda en Tarifa** project from scratch.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 24+ | [nodejs.org](https://nodejs.org) or `nvm install 24` |
| Flutter | 3.10+ | [flutter.dev/docs/get-started/install](https://flutter.dev/docs/get-started/install) |
| Firebase CLI | latest | `npm install -g firebase-tools` |
| Git | any | [git-scm.com](https://git-scm.com) |

## 1. Firebase Project

The Firebase project **boda-en-tarifa** already exists. Verify it in the [Firebase Console](https://console.firebase.google.com).

### Required services (enable in Console if not already active)

- **Firestore** — database region `eur3` (europe-west)
- **Authentication** — providers: Google Sign-In, Apple Sign-In, Custom Token (for Magic Links)
- **Cloud Functions** — requires the Blaze (pay-as-you-go) billing plan
- **Firebase Hosting** — for the web dashboard deployment
- **Cloud Messaging** — for push notifications to the Flutter app
- **Remote Config** — for runtime configuration (event schedule, venues, etc.)

### Authentication provider setup

1. **Google Sign-In** — enable in Console → Authentication → Sign-in method → Google. Use "Boda en Tarifa" as the public-facing name and `info@bodaentarifa.com` as the support email.
2. **Apple Sign-In** — enable in Console → Authentication → Sign-in method → Apple. Requires an Apple Developer account with a Services ID (`com.bodaentarifa.app.service`), Team ID, Key ID, and the `.p8` private key.
3. **Custom Token** — no console configuration needed. Cloud Functions use the Admin SDK to mint tokens for the Magic Link flow.

> **Important:** Email/Password sign-in should remain **disabled**. Authentication is exclusively through social providers and Magic Links.

## 2. Firebase Service Account

A Firebase Admin SDK service account is needed by Cloud Functions, the web dashboard server-side routes, and administrative scripts.

### Generate the key

1. Go to [Firebase Console → Project Settings → Service Accounts](https://console.firebase.google.com/project/boda-en-tarifa/settings/serviceaccounts/adminsdk)
2. Click **Generate New Private Key**
3. Save the downloaded JSON file somewhere secure outside the repository (e.g., `~/.config/firebase/boda-en-tarifa-service-account.json`)

### Reference the key

| Workstream | How to reference |
|------------|-----------------|
| **Cloud Functions** | The Admin SDK auto-discovers credentials in the Cloud Functions runtime. For local emulator testing, set `GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json` in your shell or in `functions/.env`. |
| **Web Dashboard** | Set `FIREBASE_SERVICE_ACCOUNT_KEY` in `web/.env.local` to the file path or the JSON content. |
| **Scripts** | Set `GOOGLE_APPLICATION_CREDENTIALS` as a shell environment variable. |

> **Never commit** the service account JSON file. The root `.gitignore` already excludes `**/service-account*.json` and `**/firebase-adminsdk*.json`.

## 3. Flutter App (`app/`)

### Environment file

```bash
cp app/.env.example app/.env
```

Fill in the values from the Firebase Console (Project Settings → General → Your apps):

| Variable | Where to find it |
|----------|-----------------|
| `FIREBASE_ANDROID_API_KEY` | Firebase Console → Android app config |
| `FIREBASE_IOS_API_KEY` | Firebase Console → iOS app config |
| `FIREBASE_PROJECT_ID` | Pre-filled: `boda-en-tarifa` |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Cloud Messaging |
| `FIREBASE_APP_ID_ANDROID` | Firebase Console → Android app config |
| `FIREBASE_APP_ID_IOS` | Firebase Console → iOS app config |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard |
| `MAPBOX_ACCESS_TOKEN` | Mapbox Account → Access Tokens |
| `DEEP_LINK_DOMAIN` | Pre-filled: `boda-en-tarifa.com` |

### Firebase app registration

If the Android and iOS apps aren't registered yet:

1. Firebase Console → Project Settings → Add app
2. **Android** — package name: `com.bodaentarifa.app`
3. **iOS** — bundle ID: `com.bodaentarifa.app`
4. Download the generated `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
5. Place them in `app/android/app/` and `app/ios/Runner/` respectively

### Build with environment variables

The Flutter app injects env vars at build time. The recommended approach:

```bash
# Using --dart-define-from-file
flutter run --dart-define-from-file=.env

# Or if using the envied package (code generation)
dart run build_runner build
flutter run
```

## 4. Web Dashboard (`web/`)

### Environment file

```bash
cp web/.env.example web/.env.local
```

Fill in the values:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Pre-filled: `boda-en-tarifa.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Pre-filled: `boda-en-tarifa` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Pre-filled: `boda-en-tarifa.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Web app config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console → Web app config |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Console → Web app config (Analytics) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Path to the service account JSON (see §2) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard → API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard → API Keys |
| `GOOGLE_SHEETS_API_KEY` | Google Cloud Console → APIs & Services → Credentials |
| `APPLE_SIWA_KEY_ID` | Apple Developer → Keys |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → Auth Tokens |

### Install and run

```bash
cd web
npm install
npm run dev
```

The dev server starts at `http://localhost:3000`.

## 5. Cloud Functions (`functions/`)

### Environment file

```bash
cp functions/.env.example functions/.env
```

Fill in the values:

| Variable | Where to find it |
|----------|-----------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard → API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard → API Keys |
| `DEEP_LINK_DOMAIN` | Pre-filled: `boda-en-tarifa.com` |

### Install and build

```bash
cd functions
npm install
npm run build
```

### Deploy functions

```bash
firebase deploy --only functions
```

### Set environment variables in production

For deployed Cloud Functions, set secrets using Firebase:

```bash
firebase functions:secrets:set CLOUDINARY_API_SECRET
```

## 6. Mapbox Access Token

1. Create or log in to a [Mapbox account](https://account.mapbox.com)
2. Go to **Access Tokens**
3. Create a **public token** with default scopes — this goes into `app/.env` as `MAPBOX_ACCESS_TOKEN`
4. If offline tile downloads require a **secret token**, create one with the `downloads:read` scope and store it server-side only

## 7. Firebase Emulators (Local Development)

The emulator suite is pre-configured in `firebase.json`:

| Emulator | Port |
|----------|------|
| Auth | 9099 |
| Functions | 5001 |
| Firestore | 8080 |
| Hosting | 5002 |
| Pub/Sub | 8085 |
| Eventarc | 9299 |
| Emulator UI | auto |

### Start the emulators

```bash
firebase emulators:start
```

The Emulator UI opens automatically in the browser.

### Connect the web app to emulators

To point the Next.js dev server at local emulators, add the emulator connection in your Firebase client code when `NODE_ENV === "development"`.

## 8. Firebase Configuration Files

These files are checked into the repository:

| File | Purpose |
|------|---------|
| `firebase.json` | Top-level Firebase config: Firestore rules path, Functions source, Hosting settings, emulator ports |
| `.firebaserc` | Maps project aliases to the Firebase project ID (`boda-en-tarifa`) |
| `firebase/firestore.rules` | Firestore security rules (currently permissive — will be tightened per-feature) |
| `firebase/firestore.indexes.json` | Composite index definitions (empty initially, populated as features require them) |
| `firebase/storage.rules` | Cloud Storage security rules |
| `firebase/remoteconfig.template.json` | Remote Config template (empty initially) |

## 9. Verifying Your Setup

Run these commands to confirm everything is working:

```bash
# Firebase CLI is authenticated and pointing at the right project
firebase projects:list
firebase use boda-en-tarifa

# Web dashboard builds successfully
cd web && npm run build

# Cloud Functions compile
cd functions && npm run build

# Flutter app compiles (requires Flutter SDK + platform tools)
cd app && flutter pub get && flutter analyze

# Emulators start without errors
firebase emulators:start
```

## Security Checklist

- [ ] `.env`, `.env.local`, and `.env.*.local` are in `.gitignore` (root, `app/`, `web/`, `functions/`)
- [ ] Service account JSON files are excluded via `**/service-account*.json` pattern
- [ ] Only `.env.example` files (with placeholder values) are committed
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` never contains the actual key in committed files
- [ ] Apple `.p8` private key files are stored securely outside the repo
- [ ] Production secrets are managed via Firebase Functions secrets or hosting environment variables, not `.env` files
