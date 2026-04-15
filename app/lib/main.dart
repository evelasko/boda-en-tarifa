import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import 'app/app.dart';
import 'core/background/background_tasks.dart';
import 'core/database/app_database.dart';
import 'core/map/mapbox_config.dart';
import 'core/notifications/notification_handler.dart';
import 'core/providers/core_providers.dart';
import 'core/remote_config/remote_config_providers.dart';
import 'core/remote_config/remote_config_service.dart';
import 'firebase_options.dart';

const bool _useFirebaseEmulators = bool.fromEnvironment(
  'USE_FIREBASE_EMULATORS',
  defaultValue: false,
);
const String _firebaseEmulatorHost = String.fromEnvironment(
  'FIREBASE_EMULATOR_HOST',
  defaultValue: '127.0.0.1',
);
const int _firestoreEmulatorPort = int.fromEnvironment(
  'FIRESTORE_EMULATOR_PORT',
  defaultValue: 8080,
);
const int _authEmulatorPort = int.fromEnvironment(
  'FIREBASE_AUTH_EMULATOR_PORT',
  defaultValue: 9099,
);

Future<void> _configureFirebaseEmulatorsIfEnabled() async {
  if (!_useFirebaseEmulators) return;

  FirebaseFirestore.instance.useFirestoreEmulator(
    _firebaseEmulatorHost,
    _firestoreEmulatorPort,
  );
  await FirebaseAuth.instance.useAuthEmulator(
    _firebaseEmulatorHost,
    _authEmulatorPort,
  );
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  await _configureFirebaseEmulatorsIfEnabled();

  // Register FCM background handler (must be top-level function).
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  MapboxOptions.setAccessToken(MapboxConfig.accessToken);

  final appDatabase = AppDatabase();

  final remoteConfigService = RemoteConfigService(
    remoteConfig: FirebaseRemoteConfig.instance,
    db: appDatabase,
  );
  await remoteConfigService.initialize();

  await BackgroundTaskManager.initialize();

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
