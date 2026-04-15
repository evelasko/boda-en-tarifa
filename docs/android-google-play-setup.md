# Android Google Play Console Setup Guide — Plus One

## Prerequisites

- Google Play Developer account (one-time $25 fee)
- Access to [Google Play Console](https://play.google.com/console)
- Access to [Firebase Console](https://console.firebase.google.com) (project: `boda-en-tarifa`)
- Java 17+ installed (required by the project's Gradle config)
- Android Studio or command-line build tools

### Application Identity

| Field | Value |
|-------|-------|
| Application ID | `com.misfitcoders.plusone` |
| Public App Name | Plus One |
| Firebase Project | `boda-en-tarifa` |

---

## 1. Create the Upload Signing Key

Google Play requires all apps to be signed. You need a **release keystore**.

### 1a. Generate the Keystore

```bash
keytool -genkey -v \
  -keystore ~/upload-keystore.jks \
  -keyalg RSA -keysize 2048 \
  -validity 10000 \
  -alias upload
```

You'll be prompted for:
- Keystore password
- Key password
- Your name, organization, location

**Store this file and passwords securely — if you lose them, you cannot update your app.**

### 1b. Create `key.properties`

Create the file `android/key.properties` (do **not** commit this to git):

```properties
storePassword=<your-keystore-password>
keyPassword=<your-key-password>
keyAlias=upload
storeFile=<absolute-path-to>/upload-keystore.jks
```

### 1c. Add to `.gitignore`

Ensure these lines exist in your `.gitignore`:

```
android/key.properties
*.jks
*.keystore
```

### 1d. Configure Release Signing in Gradle

Edit `android/app/build.gradle.kts` to load the keystore and use it for release builds:

```kotlin
import java.util.Properties
import java.io.FileInputStream

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...

    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

---

## 2. Enable Google Play App Signing

Google Play manages the final app signing key — your upload key is only used to authenticate uploads.

1. Go to **Google Play Console → Your App → Setup → App signing**
2. Choose **Use Google-generated key** (recommended)
3. Upload your **upload certificate** (not the keystore):

   ```bash
   keytool -export -rfc \
     -keystore ~/upload-keystore.jks \
     -alias upload \
     -file ~/upload_certificate.pem
   ```

4. Upload `upload_certificate.pem` to the Play Console

This means if you ever lose your upload key, Google can reset it for you.

---

## 3. Create the App in Google Play Console

Go to [Google Play Console](https://play.google.com/console) → **All apps** → **Create app**

| Field | Value |
|-------|-------|
| App name | Plus One |
| Default language | Spanish (Spain) — es-ES |
| App or game | App |
| Free or paid | Free |
| Declarations | Accept developer program policies |

---

## 4. Complete the App Dashboard Setup

Google Play requires you to fill out several sections before you can publish. Navigate through **Setup** in the left sidebar:

### 4a. App Access

Select **All or some functionality is restricted** — the app requires authentication (magic link / Google / guest allowlist).

Add instructions for the review team:
> "This app is a private wedding app. Use the test credentials provided to access all features."

Provide a test account (create a guest allowlist entry in Firebase for the reviewer).

### 4b. Ads Declaration

Select **No, my app does not contain ads**.

### 4c. Content Rating

Complete the **IARC questionnaire**:
- No violence, sexual content, or controlled substances
- Expected rating: **PEGI 3 / Everyone**

### 4d. Target Audience

Select **18 and over** — this is a wedding app for adults, simplifies compliance.

### 4e. News App

Select **No, my app is not a news app**.

### 4f. COVID-19 Apps

Select **No**.

### 4g. Data Safety

Based on your app's features, declare:

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Email address | Yes | No | Account management, authentication |
| Name | Yes | No | App functionality (profile display) |
| Photos | Yes | No | App functionality (wedding media) |
| Approximate location | Yes | No | App functionality (venue map) |
| App interactions | Yes | No | Analytics |
| Other user-generated content | Yes | No | App functionality (comments, reactions) |

**Security practices:**
- Data is encrypted in transit: **Yes** (HTTPS / Firebase)
- Data can be deleted: **Yes** (user can request account deletion)
- Independent security review: **No**

### 4h. Government Apps

Select **No**.

---

## 5. Firebase Console Configuration

### 5a. Verify Android App Registration

The Firebase project already has the Android app registered as `com.misfitcoders.plusone`. Verify this in **Firebase Console → Project Settings → Your apps**.

The `google-services.json` in your project should already match. No re-registration needed.

### 5b. Add SHA Certificate Fingerprints

Firebase and Google Sign-In require your app's SHA fingerprints.

**Debug SHA-1** (for development):

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

**Release SHA-1** (for production):

```bash
keytool -list -v \
  -keystore ~/upload-keystore.jks \
  -alias upload
```

**Play App Signing SHA-1** (after enabling Play App Signing):
- Find it in Google Play Console → Setup → App signing → App signing key certificate → SHA-1
- This is the most important one — Google re-signs your app with this key

Add **all three** SHA-1 fingerprints to Firebase Console → Project Settings → Android app → SHA certificate fingerprints.

### 5c. Verify Firebase Services

| Service | Action |
|---------|--------|
| Authentication | Ensure Google sign-in provider is enabled; add SHA-1 fingerprints |
| Cloud Firestore | No extra Android config needed |
| Cloud Messaging | Works automatically via `google-services.json` (no APNs equivalent on Android) |
| Remote Config | No extra config needed |

---

## 6. Google Sign-In Configuration

Google Sign-In on Android requires:

1. **SHA-1 fingerprints** registered in Firebase (step 5b) — all three (debug, upload, Play signing)
2. **OAuth consent screen** configured in [Google Cloud Console](https://console.cloud.google.com):
   - Go to **APIs & Services → OAuth consent screen**
   - User Type: External
   - Fill in app name, support email, developer contact
   - Add scopes: `email`, `profile`, `openid`
   - Add test users during development
3. The `google_sign_in` Flutter plugin handles the rest via the `google-services.json` client ID

---

## 7. Android App Links (Deep Linking)

Your manifest already has deep link intent filters with `autoVerify="true"` for `https://bodaentarifa.com/login`. For verified App Links to work:

### 7a. Host the Digital Asset Links File

Create and serve this file at:

```
https://bodaentarifa.com/.well-known/assetlinks.json
```

Contents:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.misfitcoders.plusone",
      "sha256_cert_fingerprints": [
        "<YOUR_PLAY_APP_SIGNING_SHA256>",
        "<YOUR_UPLOAD_KEY_SHA256>",
        "<YOUR_DEBUG_KEY_SHA256>"
      ]
    }
  }
]
```

Get your SHA-256 fingerprints:

```bash
# Upload key
keytool -list -v -keystore ~/upload-keystore.jks -alias upload | grep SHA256

# Debug key
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android | grep SHA256

# Play App Signing key — find in Google Play Console → Setup → App signing
```

### 7b. Serve from Next.js

Place the file at `web/public/.well-known/assetlinks.json`.

- Must be served over HTTPS
- Must return `Content-Type: application/json`
- No redirects allowed

### 7c. Verify App Links

Test with:

```bash
adb shell am start -a android.intent.action.VIEW \
  -c android.intent.category.BROWSABLE \
  -d "https://bodaentarifa.com/login?token=test123"
```

---

## 8. Push Notifications (FCM)

Android push notifications via Firebase Cloud Messaging require minimal extra setup beyond what's already configured:

### 8a. Notification Channel (Android 8+)

You may want to create a notification channel in your Flutter code. The `firebase_messaging` and `flutter_local_notifications` plugins handle this, but verify a default channel exists.

### 8b. Notification Icon

Create a notification icon (monochrome, white on transparent):

```
android/app/src/main/res/drawable/ic_notification.png
```

Reference it in your `AndroidManifest.xml` inside the `<application>` tag:

```xml
<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/ic_notification" />
<meta-data
    android:name="com.google.firebase.messaging.default_notification_color"
    android:resource="@color/notification_color" />
```

### 8c. POST_NOTIFICATIONS Permission (Android 13+)

Add to your main `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

The `permission_handler` plugin will handle the runtime request.

---

## 9. Declare All Permissions

Your main `AndroidManifest.xml` currently only declares location permissions. Add the full set:

```xml
<!-- Location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Camera -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Storage (for image_picker on older Android versions) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />

<!-- Media (Android 13+ scoped storage) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<!-- Notifications (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Network -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Background work (workmanager) -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Hardware feature declarations -->
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />
```

Setting `android:required="false"` on features ensures the app is available on devices without cameras or GPS (tablets, etc.).

---

## 10. ProGuard / R8 Rules

For release builds, R8 (the Android code shrinker) is enabled by default. Some dependencies may need keep rules.

Create `android/app/proguard-rules.pro` if it doesn't exist:

```proguard
# Firebase
-keep class com.google.firebase.** { *; }

# Google Sign-In
-keep class com.google.android.gms.** { *; }

# Mapbox
-keep class com.mapbox.** { *; }
-dontwarn com.mapbox.**

# Flutter
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Drift / SQLite
-keep class org.sqlite.** { *; }
```

Reference it in `build.gradle.kts`:

```kotlin
buildTypes {
    release {
        signingConfig = signingConfigs.getByName("release")
        isMinifyEnabled = true
        isShrinkResources = true
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
    }
}
```

---

## 11. Build the Release App Bundle

Google Play requires an **AAB** (Android App Bundle), not an APK.

```bash
cd app
flutter build appbundle --release
```

The output is at:

```
build/app/outputs/bundle/release/app-release.aab
```

---

## 12. Google Play Console — Store Listing

### 12a. Main Store Listing

| Field | Value / Guidance |
|-------|-----------------|
| App name | Plus One |
| Short description (80 chars) | Your wedding companion — itinerary, map, camera, and more |
| Full description (4000 chars) | Describe features: itinerary, map, camera, media feed, RSVP |
| App icon | 512x512 PNG, 32-bit, no transparency |
| Feature graphic | 1024x500 PNG or JPEG |
| Phone screenshots | Min 2, max 8 — 16:9 or 9:16, min 320px, max 3840px |
| Tablet screenshots | Optional but recommended — 7" and 10" |

### 12b. App Category

| Field | Value |
|-------|-------|
| App type | Application |
| Category | Lifestyle |
| Tags | Events, Social |

---

## 13. Release Tracks

Google Play has multiple release tracks:

### 13a. Internal Testing (recommended first)

- Up to 100 testers
- No review required
- Available within minutes
- Go to **Testing → Internal testing → Create new release**
- Upload your `.aab`
- Add testers by email

### 13b. Closed Testing (Alpha/Beta)

- Larger tester groups
- Requires brief review
- Go to **Testing → Closed testing → Create track**

### 13c. Production

- Full app review required
- Go to **Production → Create new release**
- Upload your `.aab`
- Add release notes (in Spanish)

---

## 14. Mapbox Configuration

Ensure your Mapbox secret token is available for Gradle to download the SDK.

Add to `~/.gradle/gradle.properties` (user-level, not project-level):

```properties
MAPBOX_DOWNLOADS_TOKEN=sk-your-secret-token
```

And in `android/build.gradle.kts` or `settings.gradle.kts`, ensure the Mapbox Maven repo is configured:

```kotlin
maven {
    url = uri("https://api.mapbox.com/downloads/v2/releases/maven")
    credentials.username = "mapbox"
    credentials.password = providers.gradleProperty("MAPBOX_DOWNLOADS_TOKEN").get()
    authentication { create<BasicAuthentication>("basic") }
}
```

The public Mapbox token for runtime should be set in your Flutter code or as an Android resource.

---

## 15. Account Deletion Requirement

Google Play requires apps with account creation to offer **in-app account deletion** (policy enforced since December 2023).

Ensure your app provides:
- An in-app option to delete the user's account and data
- This should call Firebase Auth's `deleteUser()` and remove all Firestore user data
- Must also be accessible from a web URL (provide this URL in the Data Safety section)

---

## 16. Checklist Summary

### Google Play Console

- [ ] Create app listing (name: Plus One)
- [ ] Set default language (Spanish — es-ES)
- [ ] Complete App Access declaration (restricted — auth required)
- [ ] Complete Ads declaration (no ads)
- [ ] Complete Content Rating questionnaire
- [ ] Complete Target Audience declaration (18+)
- [ ] Complete Data Safety form
- [ ] Upload store listing assets (icon, screenshots, feature graphic)
- [ ] Set up Internal Testing track
- [ ] Enable Google Play App Signing

### Signing

- [ ] Generate upload keystore (`upload-keystore.jks`)
- [ ] Create `android/key.properties` (not committed to git)
- [ ] Add `.jks` and `key.properties` to `.gitignore`
- [ ] Configure release signing in `build.gradle.kts`
- [ ] Upload upload certificate to Play Console
- [ ] Note the Play App Signing SHA-256 after first upload

### Firebase

- [ ] Verify Android app is registered as `com.misfitcoders.plusone`
- [ ] Verify `google-services.json` matches
- [ ] Add debug SHA-1 fingerprint
- [ ] Add upload key SHA-1 fingerprint
- [ ] Add Play App Signing SHA-1 fingerprint (after first upload)
- [ ] Verify Google Sign-In provider has correct OAuth client

### Android Project

- [ ] Add all permissions to `AndroidManifest.xml`
- [ ] Add notification icon and meta-data
- [ ] Create `proguard-rules.pro` for R8
- [ ] Enable `isMinifyEnabled` and `isShrinkResources` for release
- [ ] Configure Mapbox download token in Gradle

### Server (Next.js web)

- [ ] Host `assetlinks.json` at `/.well-known/`
- [ ] Include all three SHA-256 fingerprints for `com.misfitcoders.plusone`
- [ ] Provide account deletion web URL for Data Safety

### Build & Upload

- [ ] Build release AAB: `flutter build appbundle --release`
- [ ] Upload to Internal Testing track
- [ ] Test deep links with `adb`
- [ ] Test push notifications on a physical device
- [ ] Verify Google Sign-In works with all SHA fingerprints
