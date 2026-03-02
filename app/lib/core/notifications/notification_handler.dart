import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:boda_en_tarifa_app/app/router.dart';
import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';
import 'package:boda_en_tarifa_app/features/auth/presentation/providers/auth_providers.dart';

import 'local_notification_config.dart';
import 'notification_service.dart';

// ---------------------------------------------------------------------------
// Top-level background message handler (required by firebase_messaging).
// Must NOT be a class method. Keep lightweight — no Riverpod access.
// ---------------------------------------------------------------------------

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase is auto-initialized by the plugin.
  // No heavy processing here.
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService(
    messaging: FirebaseMessaging.instance,
    firestore: ref.watch(firestoreProvider),
  );
});

final localNotificationConfigProvider =
    Provider<LocalNotificationConfig>((ref) {
  return LocalNotificationConfig();
});

// ---------------------------------------------------------------------------
// Notification handler — orchestrates FCM, local display, and deep links.
// Eagerly watched in the root widget (like ShareHandler).
// ---------------------------------------------------------------------------

final notificationHandlerProvider =
    AsyncNotifierProvider<NotificationHandler, void>(NotificationHandler.new);

class NotificationHandler extends AsyncNotifier<void> {
  StreamSubscription<RemoteMessage>? _onMessageSub;
  StreamSubscription<RemoteMessage>? _onMessageOpenedAppSub;
  StreamSubscription<String>? _tokenRefreshSub;

  @override
  FutureOr<void> build() async {
    final service = ref.read(notificationServiceProvider);
    final localConfig = ref.read(localNotificationConfigProvider);

    // 1. Initialize FCM presentation + local notifications plugin.
    await service.initialize();
    await localConfig.initialize(onNotificationTap: _handleNotificationTap);

    // 2. Foreground messages → show local notification.
    _onMessageSub = FirebaseMessaging.onMessage.listen((message) {
      localConfig.show(message);
    });

    // 3. Notification tap when app was in background (not terminated).
    _onMessageOpenedAppSub =
        FirebaseMessaging.onMessageOpenedApp.listen(_navigateFromMessage);

    // 4. Notification that launched the app from terminated state.
    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      // Delay briefly so the router finishes initializing.
      Future.delayed(const Duration(milliseconds: 500), () {
        _navigateFromMessage(initialMessage);
      });
    }

    // 5. If user is already authenticated (e.g., app restart), subscribe now.
    final currentUser = ref.read(authStateProvider).asData?.value;
    if (currentUser != null) {
      await _onUserSignedIn(currentUser.uid);
    }

    // 6. React to future auth state changes.
    ref.listen(authStateProvider, (prev, next) {
      final user = next.asData?.value;
      final prevUser = prev?.asData?.value;

      if (user != null && prevUser == null) {
        _onUserSignedIn(user.uid);
      } else if (user == null && prevUser != null) {
        _onUserSignedOut();
      }
    });

    ref.onDispose(() {
      _onMessageSub?.cancel();
      _onMessageOpenedAppSub?.cancel();
      _tokenRefreshSub?.cancel();
    });
  }

  // ── Auth-reactive helpers ───────────────────────────────────────────────

  Future<void> _onUserSignedIn(String uid) async {
    final service = ref.read(notificationServiceProvider);

    await service.subscribeToWeddingTopic();

    final token = await service.getToken();
    if (token != null) {
      await service.storeToken(uid: uid, token: token);
    }

    _tokenRefreshSub?.cancel();
    _tokenRefreshSub = service.onTokenRefresh.listen((newToken) {
      service.storeToken(uid: uid, token: newToken);
    });
  }

  Future<void> _onUserSignedOut() async {
    final service = ref.read(notificationServiceProvider);
    await service.unsubscribeFromWeddingTopic();
    _tokenRefreshSub?.cancel();
    _tokenRefreshSub = null;
  }

  // ── Navigation helpers ──────────────────────────────────────────────────

  void _navigateFromMessage(RemoteMessage message) {
    final route = message.data['route'] as String?;
    if (route == null || route.isEmpty) return;
    _navigate(route);
  }

  void _handleNotificationTap(String? payload) {
    if (payload == null || payload.isEmpty) return;
    _navigate(payload);
  }

  void _navigate(String route) {
    ref.read(routerProvider).go(route);
  }
}
