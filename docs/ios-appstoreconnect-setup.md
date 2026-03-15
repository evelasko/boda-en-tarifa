# iOS App Store Connect Setup Guide — Boda en Tarifa

## Prerequisites

- Apple Developer Program membership (paid, $99/year)
- Your Apple Team ID: `2SKBCUTH6B`
- Xcode installed with latest iOS SDK
- Access to [Apple Developer Portal](https://developer.apple.com) and [App Store Connect](https://appstoreconnect.apple.com)

---

## 1. Choose a Production Bundle ID

Your current bundle ID is `com.example.bodaEnTarifaApp` — this **must** be changed before any App Store submission. Pick a reverse-domain identifier, e.g.:

```
com.whitehibiscus.bodaentarifa
```

Then update it in **three places**:

1. **Xcode** → Runner target → General → Bundle Identifier
2. **`ios/Runner.xcodeproj/project.pbxproj`** — all `PRODUCT_BUNDLE_IDENTIFIER` entries
3. **Firebase Console** → re-download `GoogleService-Info.plist` with the new bundle ID

---

## 2. Register Identifiers (Apple Developer Portal)

Go to **Certificates, Identifiers & Profiles → Identifiers**.

### 2a. Main App ID

Click **+** → **App IDs** → **App**

| Field | Value |
|-------|-------|
| Description | Boda en Tarifa |
| Bundle ID | Explicit: `com.whitehibiscus.bodaentarifa` |

**Enable these Capabilities:**

| Capability | Why |
|------------|-----|
| **App Groups** | Share Extension ↔ main app communication |
| **Associated Domains** | Universal links for magic link auth (`applinks:bodaentarifa.com`) |
| **Push Notifications** | FCM / APNs for event reminders |
| **Sign In with Apple** | Apple social login |

### 2b. Share Extension App ID

Click **+** → **App IDs** → **App**

| Field | Value |
|-------|-------|
| Description | Boda en Tarifa Share Extension |
| Bundle ID | Explicit: `com.whitehibiscus.bodaentarifa.ShareExtension` |

**Enable:**

| Capability | Why |
|------------|-----|
| **App Groups** | Same group as main app for shared container |

### 2c. App Group ID

Go to **Identifiers → App Groups** → Click **+**

| Field | Value |
|-------|-------|
| Description | Boda en Tarifa Shared |
| Identifier | `group.com.whitehibiscus.bodaentarifa` |

Then go back to both App IDs above → edit → App Groups → assign this group.

Update `CUSTOM_GROUP_ID` in your Xcode build settings to `group.com.whitehibiscus.bodaentarifa`.

---

## 3. Certificates

Go to **Certificates, Identifiers & Profiles → Certificates**.

### 3a. Development Certificate

Click **+** → **Apple Development**

- Create a CSR from Keychain Access (Keychain Access → Certificate Assistant → Request a Certificate from a CA)
- Upload the CSR, download the certificate, double-click to install in Keychain

### 3b. Distribution Certificate

Click **+** → **Apple Distribution**

- Same CSR process
- This is used for App Store and TestFlight builds

> **Tip:** If you use Xcode's "Automatically manage signing", Xcode handles these for you. But for CI/CD you'll need manual certificates.

### 3c. APNs Key (for Push Notifications via Firebase)

Go to **Keys** → Click **+**

| Field | Value |
|-------|-------|
| Key Name | Boda en Tarifa APNs |
| Enable | Apple Push Notifications service (APNs) |

- Download the `.p8` file — **save it securely, you can only download it once**
- Note the **Key ID** displayed

Then go to **Firebase Console → Project Settings → Cloud Messaging → Apple app configuration**:

- Upload the `.p8` file
- Enter the **Key ID**
- Enter your **Team ID**: `2SKBCUTH6B`

---

## 4. Provisioning Profiles

Go to **Certificates, Identifiers & Profiles → Profiles**.

### 4a. Development Profile (Main App)

Click **+** → **iOS App Development**

| Field | Value |
|-------|-------|
| App ID | `com.whitehibiscus.bodaentarifa` |
| Certificate | Your Apple Development certificate |
| Devices | Select your test devices |
| Name | `Boda en Tarifa Dev` |

### 4b. Development Profile (Share Extension)

Click **+** → **iOS App Development**

| Field | Value |
|-------|-------|
| App ID | `com.whitehibiscus.bodaentarifa.ShareExtension` |
| Certificate | Your Apple Development certificate |
| Devices | Same test devices |
| Name | `Boda en Tarifa ShareExt Dev` |

### 4c. Distribution Profile (Main App)

Click **+** → **App Store Connect**

| Field | Value |
|-------|-------|
| App ID | `com.whitehibiscus.bodaentarifa` |
| Certificate | Your Apple Distribution certificate |
| Name | `Boda en Tarifa Dist` |

### 4d. Distribution Profile (Share Extension)

Click **+** → **App Store Connect**

| Field | Value |
|-------|-------|
| App ID | `com.whitehibiscus.bodaentarifa.ShareExtension` |
| Certificate | Your Apple Distribution certificate |
| Name | `Boda en Tarifa ShareExt Dist` |

---

## 5. Create the App in App Store Connect

Go to [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** → **New App**

| Field | Value |
|-------|-------|
| Platform | iOS |
| Name | Boda en Tarifa |
| Primary Language | Spanish (Spain) |
| Bundle ID | Select `com.whitehibiscus.bodaentarifa` |
| SKU | `bodaentarifa` (any unique string) |
| User Access | Full Access |

---

## 6. Configure Capabilities in Xcode

Open `app/ios/Runner.xcworkspace` in Xcode.

### Runner Target → Signing & Capabilities

Click **+ Capability** and add each:

#### Push Notifications

- Just add the capability — no extra config needed in Xcode
- The APNs key uploaded to Firebase handles the server-side

#### Sign In with Apple

- Add the capability
- No additional entitlements needed beyond what Xcode adds

#### Associated Domains

- Add the capability
- Add domain: `applinks:bodaentarifa.com`
- Already configured in your `Runner.entitlements`

#### App Groups

- Add the capability
- Add group: `group.com.whitehibiscus.bodaentarifa`
- Apply the same group to the **ShareExtension** target

#### Background Modes (if not already added)

- Enable **Remote notifications** (for silent push / FCM)
- Enable **Background fetch** (for offline sync of Firestore data)

### ShareExtension Target → Signing & Capabilities

- **App Groups** → same `group.com.whitehibiscus.bodaentarifa`

---

## 7. Configure Associated Domains (Server Side)

For universal links (magic link auth) to work, host an `apple-app-site-association` file at:

```
https://bodaentarifa.com/.well-known/apple-app-site-association
```

Contents:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["2SKBCUTH6B.com.whitehibiscus.bodaentarifa"],
        "paths": ["/auth/*", "/invite/*", "/link/*"]
      }
    ]
  }
}
```

- Must be served over HTTPS with `Content-Type: application/json`
- No redirects allowed
- In your Next.js web app, place this at `web/public/.well-known/apple-app-site-association`

---

## 8. Firebase Console Configuration

### 8a. Update iOS App Bundle ID

Go to **Firebase Console → Project Settings → Your apps → iOS app**

If the bundle ID was registered as `com.example.bodaEnTarifaApp`:

- Delete the old iOS app entry
- Add a new iOS app with the production bundle ID
- Download the new `GoogleService-Info.plist`
- Replace `app/ios/Runner/GoogleService-Info.plist`

### 8b. Verify Firebase Services

| Service | Status | Action |
|---------|--------|--------|
| Authentication | Enabled | Ensure Apple and Google sign-in providers are enabled |
| Cloud Firestore | Enabled | — |
| Cloud Messaging | Enabled | Upload APNs key (step 3c) |
| Remote Config | Enable | Needed for time-gated content |
| Dynamic Links | Deprecated | Use Associated Domains instead for magic links |

### 8c. Google Sign-In

In Firebase Console → Authentication → Sign-in method → Google:

- The `REVERSED_CLIENT_ID` URL scheme is already in your `Info.plist`
- After changing bundle ID, the `CLIENT_ID` and `REVERSED_CLIENT_ID` will change — update `GoogleService-Info.plist`

---

## 9. Sign In with Apple — Firebase Setup

Firebase Console → Authentication → Sign-in method → **Apple** → Enable

Configure the service:

1. **Services ID**: Create one at developer.apple.com → Identifiers → Services IDs
   - Identifier: `com.whitehibiscus.bodaentarifa.auth`
   - Enable **Sign In with Apple**
   - Configure domains: `bodaentarifa.com` and the Firebase auth callback URL
2. Copy the Firebase OAuth redirect URL (shown when you enable Apple provider) and add it to the Services ID configuration

---

## 10. Mapbox Configuration

Mapbox requires an access token. Ensure:

1. **Secret token** (for downloading SDK): stored in `~/.netrc`:

   ```
   machine api.mapbox.com
   login mapbox
   password sk-your-secret-token
   ```

2. **Public token** (for runtime): stored in `Info.plist` or passed via environment:

   ```xml
   <key>MBXAccessToken</key>
   <string>pk.your-public-token</string>
   ```

Check if this is already in your `Info.plist` — if not, add it.

---

## 11. Privacy Manifest & App Tracking

Starting iOS 17, Apple requires a **Privacy Manifest** (`PrivacyInfo.xcprivacy`). Flutter and CocoaPods deps may include their own, but verify.

Create `ios/Runner/PrivacyInfo.xcprivacy` if missing:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>C617.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
  </array>
  <key>NSPrivacyCollectedDataTypes</key>
  <array/>
  <key>NSPrivacyTracking</key>
  <false/>
</dict>
</plist>
```

---

## 12. App Store Connect — App Information

### 12a. General App Info

| Field | Value |
|-------|-------|
| Category | Lifestyle (primary), Social Networking (secondary) |
| Content Rights | Does not contain third-party content |
| Age Rating | 4+ (no objectionable content) |

### 12b. App Privacy (Data Collection)

Based on your app's features, declare:

| Data Type | Collection | Linked to Identity | Tracking |
|-----------|------------|-------------------|----------|
| Email Address | Yes (auth) | Yes | No |
| Name | Yes (profile) | Yes | No |
| Photos | Yes (camera/gallery) | Yes | No |
| Coarse Location | Yes (map) | No | No |
| User ID | Yes (Firebase UID) | Yes | No |

### 12c. Required Info.plist Privacy Strings

Already partially configured. Ensure all of these are present:

```xml
<!-- Camera -->
<key>NSCameraUsageDescription</key>
<string>Necesitamos acceso a la cámara para que puedas tomar fotos durante la boda.</string>

<!-- Photo Library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Necesitamos acceso a tus fotos para que puedas compartir recuerdos de la boda.</string>

<!-- Location -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Necesitamos tu ubicación para mostrar dónde estás en relación a los lugares de la boda.</string>
```

---

## 13. TestFlight Setup

### 13a. Internal Testing

1. Build and archive: `flutter build ipa`
2. Upload via Xcode Organizer or `xcrun altool`
3. In App Store Connect → TestFlight → Internal Testing group
4. Add testers by Apple ID email
5. Builds are available within minutes after processing

### 13b. External Testing (optional)

1. Create an External Testing group
2. Submit the build for Beta App Review (required for external testers)
3. Add testers by email — they receive a TestFlight invite

---

## 14. Checklist Summary

### Apple Developer Portal

- [ ] Register main App ID with capabilities
- [ ] Register ShareExtension App ID
- [ ] Register App Group ID
- [ ] Create Apple Development certificate
- [ ] Create Apple Distribution certificate
- [ ] Create APNs Key (.p8) and upload to Firebase
- [ ] Create 4 provisioning profiles (dev + dist x 2 targets)

### App Store Connect

- [ ] Create app listing
- [ ] Set primary language (Spanish)
- [ ] Set category (Lifestyle)
- [ ] Fill in app privacy declarations
- [ ] Set up TestFlight internal testing group

### Xcode

- [ ] Update bundle ID from `com.example.*` to production ID
- [ ] Add Push Notifications capability
- [ ] Add Sign In with Apple capability
- [ ] Add Associated Domains capability
- [ ] Add App Groups capability
- [ ] Add Background Modes (Remote notifications)
- [ ] Verify entitlements match for ShareExtension target

### Firebase

- [ ] Re-register iOS app with production bundle ID
- [ ] Download new `GoogleService-Info.plist`
- [ ] Upload APNs key for Cloud Messaging
- [ ] Enable Apple sign-in provider
- [ ] Verify Google sign-in provider config

### Server (Next.js web)

- [ ] Host `apple-app-site-association` at `/.well-known/`
- [ ] Configure Sign In with Apple service ID redirect

### Runtime

- [ ] Add all privacy usage strings to `Info.plist`
- [ ] Add Mapbox access token to `Info.plist`
- [ ] Create `PrivacyInfo.xcprivacy` manifest
- [ ] Set `CUSTOM_GROUP_ID` build variable
