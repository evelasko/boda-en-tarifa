import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Android notification channel for wedding notifications.
const AndroidNotificationChannel weddingChannel = AndroidNotificationChannel(
  'wedding_notifications',
  'Notificaciones de la boda',
  description: 'Avisos del evento, recordatorios y novedades',
  importance: Importance.high,
);

/// Configures and manages `flutter_local_notifications` for foreground display.
class LocalNotificationConfig {
  final FlutterLocalNotificationsPlugin _plugin;

  LocalNotificationConfig({
    FlutterLocalNotificationsPlugin? plugin,
  }) : _plugin = plugin ?? FlutterLocalNotificationsPlugin();

  /// Initialize the plugin, create the Android channel, and register the
  /// tap callback.
  Future<void> initialize({
    required void Function(String? payload) onNotificationTap,
  }) async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    final settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(
      settings: settings,
      onDidReceiveNotificationResponse: (response) {
        onNotificationTap(response.payload);
      },
    );

    // Create the notification channel on Android.
    final androidPlugin = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(weddingChannel);
  }

  /// Display a foreground FCM message as a local notification.
  Future<void> show(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    final androidDetails = AndroidNotificationDetails(
      weddingChannel.id,
      weddingChannel.name,
      channelDescription: weddingChannel.description,
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    // Pass the route from the data payload so tap handler can navigate.
    final payload = message.data['route'] as String?;

    await _plugin.show(
      id: notification.hashCode,
      title: notification.title,
      body: notification.body,
      notificationDetails: details,
      payload: payload,
    );
  }
}
