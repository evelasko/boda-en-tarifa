import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

/// Wraps FCM operations: initialization, permissions, token lifecycle,
/// topic subscription, and Firestore token storage.
class NotificationService {
  final FirebaseMessaging _messaging;
  final FirebaseFirestore _firestore;

  NotificationService({
    required FirebaseMessaging messaging,
    required FirebaseFirestore firestore,
  })  : _messaging = messaging,
        _firestore = firestore;

  /// Configure iOS foreground notification presentation.
  Future<void> initialize() async {
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  /// Request notification permission. Returns true if authorized.
  Future<bool> requestPermission() async {
    final settings = await _messaging.requestPermission();
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  /// Get the current FCM registration token.
  Future<String?> getToken() => _messaging.getToken();

  /// Stream of token refresh events.
  Stream<String> get onTokenRefresh => _messaging.onTokenRefresh;

  /// Store the FCM token in the guest's Firestore document.
  Future<void> storeToken({
    required String uid,
    required String token,
  }) async {
    await _firestore.collection('guests').doc(uid).update({
      'fcmToken': token,
      'fcmTokenUpdatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Subscribe to the "wedding" FCM topic.
  Future<void> subscribeToWeddingTopic() =>
      _messaging.subscribeToTopic('wedding');

  /// Unsubscribe from the "wedding" FCM topic.
  Future<void> unsubscribeFromWeddingTopic() =>
      _messaging.unsubscribeFromTopic('wedding');
}
