# Deep Linking & Push Notifications — Setup & Configuration Guide

> **Project:** Boda en Tarifa (Flutter + Next.js + Firebase)
> **Date:** March 2026
> **Bundle IDs:** `com.example.bodaEnTarifaApp` (iOS) / `com.example.boda_en_tarifa_app` (Android)
> **Domain:** `bodaentarifa.com`

This guide covers every step required to fully configure deep linking (Universal Links on iOS, App Links on Android) and push notifications (Firebase Cloud Messaging + local notifications) for both platforms. It reflects the current state of the codebase and identifies what is already done vs. what remains.

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Deep Linking — iOS Universal Links](#2-deep-linking--ios-universal-links)
3. [Deep Linking — Android App Links](#3-deep-linking--android-app-links)
4. [Deep Linking — Web Domain Configuration](#4-deep-linking--web-domain-configuration)
5. [Deep Linking — Flutter App Code](#5-deep-linking--flutter-app-code)
6. [Deep Linking — Testing & Verification](#6-deep-linking--testing--verification)
7. [Push Notifications — Firebase Project Setup](#7-push-notifications--firebase-project-setup)
8. [Push Notifications — iOS (APNs + FCM)](#8-push-notifications--ios-apns--fcm)
9. [Push Notifications — Android (FCM)](#9-push-notifications--android-fcm)
10. [Push Notifications — Flutter App Code](#10-push-notifications--flutter-app-code)
11. [Push Notifications — Cloud Functions (Server-Side)](#11-push-notifications--cloud-functions-server-side)
12. [Push Notifications — Testing & Debugging](#12-push-notifications--testing--debugging)
13. [Production Checklist](#13-production-checklist)

---

## 1. Current State Audit

### What is already configured

| Area | Status | Details |
|------|--------|---------|
| iOS `Runner.entitlements` | Done | `applinks:bodaentarifa.com` and App Group |
| iOS `Info.plist` | Partial | Has App Group and share URL scheme; missing `UIBackgroundModes` for remote notifications |
| Android `AndroidManifest.xml` | Partial | Has `intent-filter` for `https://bodaentarifa.com/login`; missing FCM-related entries |
| Firebase config files | Done | `google-services.json`, `GoogleService-Info.plist`, `firebase_options.dart` all present |
| `pubspec.yaml` dependencies | Done | `firebase_messaging: ^16.1.1`, `flutter_local_notifications: ^20.1.0`, `go_router: ^17.1.0` all present |
| GoRouter deep link handling | Done | `/login` route extracts `token` and `name` query parameters |
| Web domain `.well-known` files | **Not done** | `apple-app-site-association` and `assetlinks.json` not yet created |
| FCM initialization in Dart | **Not done** | `firebase_messaging` imported but never initialized |
| Local notifications setup | **Not done** | `flutter_local_notifications` imported but never initialized |
| APNs key in Firebase Console | **Not done** | Required for iOS push notifications |

---

## 2. Deep Linking — iOS Universal Links

### 2.1 Apple Developer Console

1. **Sign in** to [Apple Developer](https://developer.apple.com/account).

2. **Register an App ID** (if not already done):
   - Go to **Certificates, Identifiers & Profiles > Identifiers**.
   - Click **+** to register a new App ID.
   - Set the Bundle ID to your production ID (e.g., `com.whitehibiscus.bodaentarifa`).
   - Under **Capabilities**, enable **Associated Domains**.
   - Save.

3. **Confirm Associated Domains** is enabled:
   - Select your App ID from the list.
   - Scroll to **Associated Domains** — it should show a checkmark.
   - If not, enable it and save.

> **Note:** Your current Bundle ID is `com.example.bodaEnTarifaApp`. For production, you will need to change this to a proper reverse-domain identifier (e.g., `com.whitehibiscus.bodaentarifa`). Update it in Xcode under **Runner > General > Identity > Bundle Identifier**, and regenerate `GoogleService-Info.plist` with the new Bundle ID.

### 2.2 Xcode Configuration

Your `Runner.entitlements` already contains:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:bodaentarifa.com</string>
</array>
```

This is correct. If you want to also support `www.bodaentarifa.com`, add a second entry:

```xml
<array>
    <string>applinks:bodaentarifa.com</string>
    <string>applinks:www.bodaentarifa.com</string>
</array>
```

**For development/debugging**, you can use the `?mode=developer` suffix to bypass Apple's CDN caching of the AASA file:

```xml
<string>applinks:bodaentarifa.com?mode=developer</string>
```

Remove `?mode=developer` before shipping to production.

### 2.3 Info.plist — No Changes Needed for Deep Linking

Universal Links on iOS do not require any `Info.plist` changes. The `Runner.entitlements` file is sufficient. The `CFBundleURLTypes` entries you already have are for the share extension custom URL scheme and are unrelated to Universal Links.

---

## 3. Deep Linking — Android App Links

### 3.1 AndroidManifest.xml

Your current configuration is already correct:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="bodaentarifa.com" android:path="/login" />
</intent-filter>
```

Key points:

- `android:autoVerify="true"` tells Android to verify the link against the `assetlinks.json` file on the domain.
- `android:path="/login"` restricts deep linking to only the `/login` path. If you add other deep link paths in the future, add separate `<data>` elements or use `android:pathPrefix`.

### 3.2 Obtain the SHA-256 Certificate Fingerprint

You need this for the `assetlinks.json` file.

**Debug keystore:**

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Release keystore** (replace with your actual keystore path):

```bash
keytool -list -v -keystore /path/to/your/release.keystore -alias your-alias
```

**If using Google Play App Signing** (recommended):

1. Go to **Google Play Console > Your App > Setup > App signing**.
2. Copy the **SHA-256 certificate fingerprint** from the **App signing key certificate** section.
3. Use this fingerprint in `assetlinks.json` — this is the one that matters for production.

Record the SHA-256 fingerprint; you will need it in Section 4.

---

## 4. Deep Linking — Web Domain Configuration

Both iOS and Android require files hosted on your web domain to verify that your app is authorized to handle links from that domain.

### 4.1 Apple App Site Association (AASA)

Create the file `web/public/.well-known/apple-app-site-association` (no `.json` extension):

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": [
          "YOUR_TEAM_ID.com.whitehibiscus.bodaentarifa"
        ],
        "components": [
          {
            "/": "/login",
            "?": { "token": "?*" }
          }
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": [
      "YOUR_TEAM_ID.com.whitehibiscus.bodaentarifa"
    ]
  }
}
```

**How to find your Team ID:**

1. Sign in to [Apple Developer](https://developer.apple.com/account).
2. Go to **Membership Details**.
3. Your **Team ID** is a 10-character alphanumeric string (e.g., `S8QB4VV633`).

**Requirements:**

- The file must be served over HTTPS.
- Content-Type must be `application/json`.
- No `.json` extension on the filename.
- Must be accessible at `https://bodaentarifa.com/.well-known/apple-app-site-association`.
- No redirects — the file must be served directly.

**Next.js hosting note:** Files placed in `web/public/.well-known/` are served at `/.well-known/` automatically by Next.js. Vercel handles the correct Content-Type for JSON files in this directory. However, verify after deployment that:

- The URL `https://bodaentarifa.com/.well-known/apple-app-site-association` returns status 200.
- The `Content-Type` header is `application/json`.
- There are no redirects in the chain.

### 4.2 Android Asset Links

Create the file `web/public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.example.boda_en_tarifa_app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

Replace `YOUR_SHA256_FINGERPRINT_HERE` with the SHA-256 fingerprint from Section 3.2.

If you use both debug and release certificates during development, you can include multiple fingerprints:

```json
"sha256_cert_fingerprints": [
  "DEBUG_SHA256_FINGERPRINT",
  "RELEASE_SHA256_FINGERPRINT"
]
```

**Requirements:**

- Must be served at `https://bodaentarifa.com/.well-known/assetlinks.json`.
- Content-Type must be `application/json`.
- Must return HTTP 200 (no redirects).

### 4.3 Verify the Well-Known Files

After deploying, validate with these tools:

- **iOS:** [Apple's AASA Validator](https://search.developer.apple.com/appsearch-validation-tool/) — enter `https://bodaentarifa.com`.
- **Android:** [Google Digital Asset Links Tester](https://developers.google.com/digital-asset-links/tools/generator) — enter your domain, package name, and fingerprint.

Alternatively, test from the command line:

```bash
# iOS AASA
curl -I https://bodaentarifa.com/.well-known/apple-app-site-association

# Android Asset Links
curl -I https://bodaentarifa.com/.well-known/assetlinks.json
```

---

## 5. Deep Linking — Flutter App Code

### 5.1 GoRouter Configuration (Already Done)

Your router at `app/lib/app/router.dart` already handles the `/login` deep link path:

```dart
GoRoute(
  path: '/login',
  builder: (context, state) => MagicLinkHandlerScreen(
    token: state.uri.queryParameters['token'],
    guestName: state.uri.queryParameters['name'],
  ),
),
```

GoRouter natively supports deep linking — when the OS delivers a URL to the app, GoRouter matches it against the declared routes. No additional package (like `app_links`) is needed unless you want manual control over link handling outside GoRouter.

### 5.2 Adding `app_links` (Optional but Recommended)

Your spec references `app_links` for explicit cold-start and warm-start link handling. If you want fine-grained control (e.g., logging, analytics, or intercepting links before GoRouter), add it:

```bash
flutter pub add app_links
```

Then create a provider that listens for incoming links and navigates programmatically:

```dart
import 'package:app_links/app_links.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final appLinksProvider = Provider<AppLinks>((ref) {
  final appLinks = AppLinks();

  appLinks.uriLinkStream.listen((uri) {
    final router = ref.read(routerProvider);
    router.go(uri.path + (uri.query.isNotEmpty ? '?${uri.query}' : ''));
  });

  appLinks.getInitialLink().then((uri) {
    if (uri != null) {
      final router = ref.read(routerProvider);
      router.go(uri.path + (uri.query.isNotEmpty ? '?${uri.query}' : ''));
    }
  });

  return appLinks;
});
```

**However**, for most cases GoRouter's built-in deep link support is sufficient, and adding `app_links` introduces complexity. Use it only if you have a concrete need beyond route matching.

### 5.3 Cold Start vs. Warm Start

GoRouter handles both scenarios:

- **Cold start:** When the app launches from a deep link, GoRouter's `initialLocation` is overridden by the incoming URL.
- **Warm start:** When the app is already running and a new deep link arrives, GoRouter navigates to the matching route automatically.

Your `android:launchMode="singleTop"` in `AndroidManifest.xml` ensures that warm-start deep links don't create a new Activity.

---

## 6. Deep Linking — Testing & Verification

### 6.1 iOS Simulator

Universal Links do not work on the iOS Simulator. You must test on a real device.

**Workaround for Simulator testing:**

```bash
xcrun simctl openurl booted "https://bodaentarifa.com/login?token=test123&name=TestGuest"
```

This only works if the associated-domains validation can be completed (which requires the AASA file to be deployed and accessible).

### 6.2 Real iOS Device

1. Deploy the `.well-known/apple-app-site-association` file to `bodaentarifa.com`.
2. Install the app on a real device.
3. Open Safari and type `https://bodaentarifa.com/login?token=test&name=Test`.
4. A banner should appear at the top saying "Open in Boda en Tarifa" — tap it.
5. Alternatively, long-press the link to see "Open in App" in the context menu.

> **Important:** iOS caches AASA files. After changes, wait up to 24 hours or use `?mode=developer` on the associated domain (see Section 2.2).

### 6.3 Android Emulator / Device

```bash
adb shell am start -a android.intent.action.VIEW \
  -c android.intent.category.BROWSABLE \
  -d "https://bodaentarifa.com/login?token=test123&name=TestGuest" \
  com.example.boda_en_tarifa_app
```

### 6.4 Verify App Link Verification (Android)

```bash
# Check verification status
adb shell pm get-app-links com.example.boda_en_tarifa_app

# Force re-verify
adb shell pm verify-app-links --re-verify com.example.boda_en_tarifa_app
```

---

## 7. Push Notifications — Firebase Project Setup

### 7.1 Verify Firebase Project Configuration

Your Firebase project `boda-en-tarifa` (ID: `501055602355`) is already configured with both iOS and Android apps. Verify in the [Firebase Console](https://console.firebase.google.com/project/boda-en-tarifa):

1. Go to **Project Settings > General**.
2. Confirm both apps are listed:
   - Android: `com.example.boda_en_tarifa_app`
   - iOS: `com.example.bodaEnTarifaApp`

### 7.2 Enable Cloud Messaging API

1. In Firebase Console, go to **Project Settings > Cloud Messaging**.
2. Ensure the **Firebase Cloud Messaging API (V1)** is enabled (this is the current API; legacy HTTP API is deprecated).
3. If it shows "Disabled", click the link to enable it in Google Cloud Console.

---

## 8. Push Notifications — iOS (APNs + FCM)

Firebase Cloud Messaging on iOS requires Apple Push Notification service (APNs) as the transport layer. You must configure the connection between FCM and APNs.

### 8.1 Create an APNs Authentication Key (Recommended over Certificates)

Apple recommends using an APNs Authentication Key (.p8 file) rather than APNs certificates. A single key works for all your apps and doesn't expire.

1. Sign in to [Apple Developer](https://developer.apple.com/account).
2. Go to **Certificates, Identifiers & Profiles > Keys**.
3. Click **+** to create a new key.
4. Name it something descriptive (e.g., `Boda en Tarifa FCM`).
5. Check **Apple Push Notifications service (APNs)**.
6. Click **Continue**, then **Register**.
7. **Download the `.p8` file immediately** — you can only download it once.
8. Note the **Key ID** displayed on the confirmation page.
9. Note your **Team ID** (from Membership Details).

### 8.2 Upload APNs Key to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/project/boda-en-tarifa/settings/cloudmessaging).
2. Navigate to **Project Settings > Cloud Messaging**.
3. Under **Apple app configuration**, find your iOS app.
4. Click **Upload** under **APNs authentication key**.
5. Upload the `.p8` file you downloaded.
6. Enter the **Key ID** and your **Team ID**.
7. Click **Upload**.

### 8.3 Enable Push Notifications Capability in Xcode

1. Open the iOS project in Xcode: `open app/ios/Runner.xcworkspace`.
2. Select the **Runner** target.
3. Go to the **Signing & Capabilities** tab.
4. Click **+ Capability**.
5. Add **Push Notifications**.
6. Add **Background Modes** (if not already present).
7. Under Background Modes, check:
   - **Remote notifications**
   - **Background fetch** (if you want background content updates)

This will update `Runner.entitlements` automatically. You can verify by checking that the following exists in the file:

```xml
<key>aps-environment</key>
<string>development</string>
```

(This automatically switches to `production` when building for App Store distribution.)

### 8.4 Update Info.plist for Background Notifications

Add the `UIBackgroundModes` key to `app/ios/Runner/Info.plist` if not already present. Add this before the closing `</dict>`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

### 8.5 Update AppDelegate for FCM (Critical)

The Flutter `firebase_messaging` plugin handles most native setup automatically via its podspec. However, you should verify that your `AppDelegate.swift` has the correct superclass. Open `app/ios/Runner/AppDelegate.swift`:

```swift
import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)

    // FCM: Required for iOS 10+ notification handling
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self as UNUserNotificationCenterDelegate
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

`FlutterAppDelegate` already conforms to `UNUserNotificationCenterDelegate`, so setting the delegate to `self` ensures that foreground notifications are delivered to the Flutter layer.

### 8.6 Podfile — No Changes Needed

Your `Podfile` already has `use_frameworks!` which is required by Firebase. The `firebase_messaging` pod is automatically included via Flutter's plugin system.

---

## 9. Push Notifications — Android (FCM)

### 9.1 google-services.json (Already Done)

Your `app/android/app/google-services.json` is already in place with the correct project configuration.

### 9.2 build.gradle Configuration (Already Done)

Your `app/android/app/build.gradle.kts` already applies the Google Services plugin:

```kotlin
plugins {
    id("com.android.application")
    id("com.google.gms.google-services")  // ← Already present
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}
```

### 9.3 AndroidManifest.xml — Add Notification Configuration

Add the following to `app/android/app/src/main/AndroidManifest.xml` inside the `<application>` tag, after the `<activity>` block:

```xml
<!-- FCM: Default notification channel for background messages -->
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="wedding_updates" />

<!-- FCM: Default notification icon (uses your app icon) -->
<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@mipmap/ic_launcher" />

<!-- FCM: Default notification color -->
<meta-data
    android:name="com.google.firebase.messaging.default_notification_color"
    android:resource="@color/notification_color" />
```

Create the color resource file at `app/android/app/src/main/res/values/colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="notification_color">#E4A085</color>
</resources>
```

### 9.4 Add POST_NOTIFICATIONS Permission (Android 13+)

Add to the `<manifest>` tag in `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

This is required for Android 13 (API 33) and above. The actual permission prompt is handled in Dart code (see Section 10).

### 9.5 Custom Notification Icon (Optional but Recommended)

Android notification icons must be monochrome (white on transparent). Create one at each density:

```
app/android/app/src/main/res/
├── drawable-mdpi/ic_notification.png      (24x24)
├── drawable-hdpi/ic_notification.png      (36x36)
├── drawable-xhdpi/ic_notification.png     (48x48)
├── drawable-xxhdpi/ic_notification.png    (72x72)
└── drawable-xxxhdpi/ic_notification.png   (96x96)
```

Then reference it in the `<meta-data>` above:

```xml
<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/ic_notification" />
```

---

## 10. Push Notifications — Flutter App Code

This is the largest section since FCM is not yet initialized in the app.

### 10.1 Create the Notification Service

Create `app/lib/core/notifications/notification_service.dart`:

```dart
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Top-level handler for background FCM messages.
/// Must be a top-level function (not a class method or closure).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // If you need to perform work here (e.g., update local DB), initialize
  // Firebase first: await Firebase.initializeApp(...);
  // For now, the system notification tray handles display automatically.
}

class NotificationService {
  NotificationService();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const _androidChannel = AndroidNotificationChannel(
    'wedding_updates',
    'Actualizaciones de la boda',
    description: 'Notificaciones sobre eventos, fotos y novedades de la boda',
    importance: Importance.high,
  );

  /// Initialize FCM and local notifications. Call once at app startup.
  Future<void> initialize({
    required void Function(String route) onNavigate,
  }) async {
    // 1. Register the background handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // 2. Initialize local notifications
    await _initLocalNotifications(onNavigate);

    // 3. Create the Android notification channel
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_androidChannel);

    // 4. Listen for foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // 5. Handle notification taps when app is in background (but not terminated)
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      final route = message.data['route'];
      if (route != null) {
        onNavigate(route);
      }
    });

    // 6. Handle notification tap that launched the app from terminated state
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      final route = initialMessage.data['route'];
      if (route != null) {
        onNavigate(route);
      }
    }
  }

  /// Request notification permissions from the user.
  /// Returns the authorization status.
  Future<AuthorizationStatus> requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    return settings.authorizationStatus;
  }

  /// Get the FCM registration token for this device.
  Future<String?> getToken() async {
    if (Platform.isIOS) {
      // On iOS, wait for the APNs token before requesting FCM token
      final apnsToken = await _messaging.getAPNSToken();
      if (apnsToken == null) return null;
    }
    return await _messaging.getToken();
  }

  /// Listen for token refreshes (e.g., after app restore, OS update).
  Stream<String> get onTokenRefresh => _messaging.onTokenRefresh;

  /// Subscribe to a topic (e.g., 'wedding' for broadcast notifications).
  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
  }

  /// Unsubscribe from a topic.
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
  }

  Future<void> _initLocalNotifications(
    void Function(String route) onNavigate,
  ) async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const darwinSettings = DarwinInitializationSettings(
      requestSoundPermission: false,
      requestBadgePermission: false,
      requestAlertPermission: false,
    );

    final settings = InitializationSettings(
      android: androidSettings,
      iOS: darwinSettings,
    );

    await _localNotifications.initialize(
      settings: settings,
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload != null) {
          onNavigate(payload);
        }
      },
    );
  }

  /// Display a foreground FCM message as a local notification.
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _androidChannel.id,
          _androidChannel.name,
          channelDescription: _androidChannel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: message.data['route'],
    );
  }
}
```

### 10.2 Create the Riverpod Provider

Create `app/lib/core/notifications/notification_providers.dart`:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'notification_service.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});
```

### 10.3 Initialize in `main.dart`

Update `app/lib/main.dart` to initialize the notification service:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import 'app/app.dart';
import 'core/database/app_database.dart';
import 'core/map/mapbox_config.dart';
import 'core/notifications/notification_service.dart';
import 'core/providers/core_providers.dart';
import 'core/remote_config/remote_config_providers.dart';
import 'core/remote_config/remote_config_service.dart';
import 'firebase_options.dart';

// Must be top-level for background message handling
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Register background message handler early
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  MapboxOptions.setAccessToken(MapboxConfig.accessToken);

  final appDatabase = AppDatabase();

  final remoteConfigService = RemoteConfigService(
    remoteConfig: FirebaseRemoteConfig.instance,
    db: appDatabase,
  );
  await remoteConfigService.initialize();

  runApp(
    ProviderScope(
      overrides: [
        appDatabaseProvider.overrideWithValue(appDatabase),
        remoteConfigServiceProvider.overrideWithValue(remoteConfigService),
      ],
      child: const BodaEnTarifaApp(),
    ),
  );
}
```

### 10.4 Initialize Notification Service in the App Widget

Update `app/lib/app/app.dart` to eagerly initialize the notification service:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:boda_en_tarifa_app/core/notifications/notification_providers.dart';
import 'package:boda_en_tarifa_app/share_extension/share_handler.dart';

import 'router.dart';
import 'theme.dart';

class BodaEnTarifaApp extends ConsumerStatefulWidget {
  const BodaEnTarifaApp({super.key});

  @override
  ConsumerState<BodaEnTarifaApp> createState() => _BodaEnTarifaAppState();
}

class _BodaEnTarifaAppState extends ConsumerState<BodaEnTarifaApp> {
  @override
  void initState() {
    super.initState();
    _initNotifications();
  }

  Future<void> _initNotifications() async {
    final notificationService = ref.read(notificationServiceProvider);
    final router = ref.read(routerProvider);

    await notificationService.initialize(
      onNavigate: (route) => router.go(route),
    );
  }

  @override
  Widget build(BuildContext context) {
    final routerConfig = ref.watch(routerProvider);

    ref.watch(shareHandlerProvider);

    return MaterialApp.router(
      title: 'Boda en Tarifa',
      theme: AppTheme.lightTheme,
      routerConfig: routerConfig,
      debugShowCheckedModeBanner: false,
    );
  }
}
```

### 10.5 Request Permission and Save Token

The best place to request permission is during the onboarding wizard (after the user has seen the app and understands why they would want notifications). Create or update a provider that handles this flow:

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../notifications/notification_providers.dart';

/// Request notification permission and save the FCM token.
/// Call this during onboarding or from a settings screen.
final notificationPermissionProvider =
    FutureProvider.autoDispose<AuthorizationStatus>((ref) async {
  final service = ref.read(notificationServiceProvider);

  final status = await service.requestPermission();

  if (status == AuthorizationStatus.authorized ||
      status == AuthorizationStatus.provisional) {
    final token = await service.getToken();
    if (token != null) {
      // Save the token to Firestore for server-side targeting.
      // Example: ref.read(firestoreProvider).collection('guests')
      //   .doc(currentUserUid).update({'fcmTokens': FieldValue.arrayUnion([token])});
    }

    // Subscribe to the broadcast topic
    await service.subscribeToTopic('wedding');

    // Listen for token refreshes
    service.onTokenRefresh.listen((newToken) {
      // Update the token in Firestore
    });
  }

  return status;
});
```

### 10.6 Token Storage Strategy

FCM tokens can change. Store them in Firestore on the guest document so your Cloud Functions can target specific devices:

```
guests/{uid}
├── ... existing fields ...
└── fcmTokens: string[]    # Array of active FCM tokens (one per device)
```

When a token refreshes, remove the old one and add the new one. When a user signs out, remove their tokens.

---

## 11. Push Notifications — Cloud Functions (Server-Side)

### 11.1 Send to a Topic

Use this for broadcast notifications (e.g., "The wedding album is ready!"):

```typescript
import { getMessaging } from 'firebase-admin/messaging';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const sendWeddingNotification = onCall(async (request) => {
  if (!request.auth?.token.admin) {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { title, body, route } = request.data;

  const message = {
    topic: 'wedding',
    notification: { title, body },
    data: { route: route ?? '/home' },
    android: {
      priority: 'high' as const,
      notification: {
        channelId: 'wedding_updates',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  const response = await getMessaging().send(message);
  return { messageId: response };
});
```

### 11.2 Send to a Specific Device

Use this for targeted notifications (e.g., "Your photo was liked"):

```typescript
export const sendNotificationToUser = onCall(async (request) => {
  const { targetUid, title, body, route } = request.data;

  // Read the user's FCM tokens from Firestore
  const guestDoc = await getFirestore().doc(`guests/${targetUid}`).get();
  const tokens: string[] = guestDoc.data()?.fcmTokens ?? [];

  if (tokens.length === 0) return { sent: 0 };

  const message = {
    tokens,
    notification: { title, body },
    data: { route: route ?? '/home' },
  };

  const response = await getMessaging().sendEachForMulticast(message);

  // Clean up invalid tokens
  const tokensToRemove: string[] = [];
  response.responses.forEach((resp, idx) => {
    if (resp.error) {
      const code = resp.error.code;
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        tokensToRemove.push(tokens[idx]);
      }
    }
  });

  if (tokensToRemove.length > 0) {
    await getFirestore().doc(`guests/${targetUid}`).update({
      fcmTokens: FieldValue.arrayRemove(tokensToRemove),
    });
  }

  return { sent: response.successCount, failed: response.failureCount };
});
```

---

## 12. Push Notifications — Testing & Debugging

### 12.1 Firebase Console (Quickest)

1. Go to [Firebase Console](https://console.firebase.google.com/project/boda-en-tarifa/messaging).
2. Click **Messaging** in the left nav.
3. Click **Create your first campaign > Firebase Notification messages**.
4. Enter a title and body.
5. Click **Send test message**.
6. Paste the FCM token from your app logs.
7. Click **Test**.

### 12.2 cURL (FCM v1 API)

```bash
# Get an access token first
ACCESS_TOKEN=$(gcloud auth print-access-token)

curl -X POST \
  "https://fcm.googleapis.com/v1/projects/boda-en-tarifa/messages:send" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "topic": "wedding",
      "notification": {
        "title": "Test Notification",
        "body": "This is a test from cURL"
      },
      "data": {
        "route": "/home"
      }
    }
  }'
```

### 12.3 Debug Logging

Add temporary logging to verify the flow:

```dart
// In your notification initialization
final token = await FirebaseMessaging.instance.getToken();
debugPrint('FCM Token: $token');

FirebaseMessaging.onMessage.listen((message) {
  debugPrint('Foreground message: ${message.notification?.title}');
});

FirebaseMessaging.onMessageOpenedApp.listen((message) {
  debugPrint('Background tap: ${message.data}');
});
```

### 12.4 Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| iOS: No notifications at all | APNs key not uploaded to Firebase | Upload `.p8` key (Section 8.2) |
| iOS: No foreground notifications | `UNUserNotificationCenterDelegate` not set | Verify `AppDelegate.swift` (Section 8.5) |
| iOS: Token is null | APNs token not ready | Wait for APNs token before calling `getToken()` (handled in service code) |
| Android: No notifications in foreground | FCM only shows notification-type messages in the system tray when backgrounded | Use `flutter_local_notifications` to display foreground messages (handled in service code) |
| Android 13+: No notifications | POST_NOTIFICATIONS permission not granted | Request permission in Dart (handled in service code) |
| Notification tap doesn't navigate | Missing `data` payload with route | Include `route` in the `data` field of FCM message |
| Token refresh not handled | Old tokens become invalid | Listen to `onTokenRefresh` stream and update Firestore |

---

## 13. Production Checklist

### Deep Linking

- [ ] **Bundle IDs updated** — Change from `com.example.*` to production IDs (e.g., `com.whitehibiscus.bodaentarifa`)
- [ ] **AASA file deployed** — `https://bodaentarifa.com/.well-known/apple-app-site-association` returns 200 with correct JSON
- [ ] **assetlinks.json deployed** — `https://bodaentarifa.com/.well-known/assetlinks.json` returns 200 with correct JSON
- [ ] **SHA-256 fingerprint** — Uses the Google Play App Signing key (not the upload key)
- [ ] **Team ID in AASA** — Matches your Apple Developer account
- [ ] **AASA validated** — Passes Apple's validation tool
- [ ] **Asset Links validated** — Passes Google's Digital Asset Links tester
- [ ] **Tested on real iOS device** — Universal Link opens app from Safari
- [ ] **Tested on real Android device** — App Link opens app from Chrome
- [ ] **Cold start deep link works** — App was terminated, link opens correct screen
- [ ] **Warm start deep link works** — App was in background, link navigates correctly
- [ ] **Fallback page configured** — `bodaentarifa.com/login` shows a web page when app is not installed
- [ ] **Remove `?mode=developer`** — From `Runner.entitlements` before App Store submission

### Push Notifications

- [ ] **APNs key uploaded** — `.p8` file uploaded to Firebase Console
- [ ] **Push Notifications capability** — Enabled in Xcode
- [ ] **Background Modes** — `remote-notification` checked in Xcode
- [ ] **Info.plist updated** — `UIBackgroundModes` includes `remote-notification`
- [ ] **AppDelegate.swift** — `UNUserNotificationCenter.current().delegate` set
- [ ] **Android notification channel** — `wedding_updates` channel created
- [ ] **Android POST_NOTIFICATIONS** — Permission added to manifest
- [ ] **FCM initialized in Dart** — `NotificationService.initialize()` called at startup
- [ ] **Background handler registered** — `FirebaseMessaging.onBackgroundMessage()` with top-level function
- [ ] **Permission requested** — During onboarding or settings
- [ ] **Token saved to Firestore** — `fcmTokens` array on guest document
- [ ] **Token refresh handled** — Old token removed, new token added
- [ ] **Topic subscription** — User subscribed to `wedding` topic after auth
- [ ] **Foreground display** — Local notification shown via `flutter_local_notifications`
- [ ] **Notification tap navigation** — `onMessageOpenedApp` and `getInitialMessage` route correctly
- [ ] **Cloud Function deployed** — `sendWeddingNotification` callable function
- [ ] **Invalid token cleanup** — Server removes stale tokens on send failure
- [ ] **Tested on real iOS device** — Notification received and tapped
- [ ] **Tested on real Android device** — Notification received and tapped
- [ ] **Tested background state** — Notification appears when app is backgrounded
- [ ] **Tested terminated state** — Notification appears and tap launches app correctly
- [ ] **Custom notification icon** — Monochrome icon displays correctly on Android

### Firebase Configuration (Pre-Production)

- [ ] **Update Bundle IDs** — In Firebase Console, update iOS and Android app registrations
- [ ] **Regenerate config files** — Download new `google-services.json` and `GoogleService-Info.plist`
- [ ] **Update `firebase_options.dart`** — Run `flutterfire configure` to regenerate
- [ ] **Firestore rules** — Allow read/write of `fcmTokens` field on guest documents
- [ ] **Cloud Messaging API v1** — Enabled in Google Cloud Console

---

## Appendix A: File Summary

| File | Action | Purpose |
|------|--------|---------|
| `web/public/.well-known/apple-app-site-association` | **Create** | iOS Universal Links verification |
| `web/public/.well-known/assetlinks.json` | **Create** | Android App Links verification |
| `app/ios/Runner/Runner.entitlements` | Verify | Associated Domains (already done) |
| `app/ios/Runner/Info.plist` | **Update** | Add `UIBackgroundModes` for remote notifications |
| `app/ios/Runner/AppDelegate.swift` | **Update** | Set `UNUserNotificationCenter` delegate |
| `app/android/app/src/main/AndroidManifest.xml` | **Update** | Add FCM metadata and POST_NOTIFICATIONS permission |
| `app/android/app/src/main/res/values/colors.xml` | **Create** | Notification accent color |
| `app/lib/core/notifications/notification_service.dart` | **Create** | FCM + local notifications service |
| `app/lib/core/notifications/notification_providers.dart` | **Create** | Riverpod provider for notification service |
| `app/lib/main.dart` | **Update** | Register background message handler |
| `app/lib/app/app.dart` | **Update** | Initialize notification service at startup |

## Appendix B: Key External Resources

- [Flutter Deep Linking Cookbook](https://docs.flutter.dev/ui/navigation/deep-linking)
- [Flutter FCM Setup Guide](https://firebase.google.com/docs/cloud-messaging/flutter/client)
- [Apple Universal Links Documentation](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [APNs Key Configuration](https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns)
- [FCM v1 API Reference](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
- [flutter_local_notifications README](https://pub.dev/packages/flutter_local_notifications)
- [firebase_messaging README](https://pub.dev/packages/firebase_messaging)
