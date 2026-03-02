import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import 'app/app.dart';
import 'core/background/background_tasks.dart';
import 'core/database/app_database.dart';
import 'core/map/mapbox_config.dart';
import 'core/providers/core_providers.dart';
import 'core/remote_config/remote_config_providers.dart';
import 'core/remote_config/remote_config_service.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

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
