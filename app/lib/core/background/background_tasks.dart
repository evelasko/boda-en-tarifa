import 'package:workmanager/workmanager.dart';

import 'package:boda_en_tarifa_app/core/database/app_database.dart';
import 'package:boda_en_tarifa_app/core/media/image_processor.dart';
import 'package:boda_en_tarifa_app/core/remote_config/parsers/trigger_time_parser.dart';
import 'package:boda_en_tarifa_app/features/camera/data/datasources/camera_remote_data_source.dart';
import 'package:boda_en_tarifa_app/features/camera/data/datasources/exposure_local_data_source.dart';

// ---------------------------------------------------------------------------
// Task identifiers
// ---------------------------------------------------------------------------

const String kCameraSyncTask = 'com.bodaentarifa.cameraSyncTask';
const String kCameraSyncPeriodicTask = 'com.bodaentarifa.cameraSyncPeriodic';

// ---------------------------------------------------------------------------
// Top-level callback dispatcher (runs in a separate isolate)
// ---------------------------------------------------------------------------

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((taskName, inputData) async {
    try {
      switch (taskName) {
        case kCameraSyncTask:
        case kCameraSyncPeriodicTask:
          return await _executeCameraSync(inputData);
        default:
          return true;
      }
    } catch (_) {
      return false; // Will retry
    }
  });
}

Future<bool> _executeCameraSync(Map<String, dynamic>? inputData) async {
  final userUid = inputData?['userUid'] as String?;
  if (userUid == null) return true;

  // Open a standalone Drift database (no Riverpod in background isolate)
  final db = AppDatabase();

  try {
    final localDs = ExposureLocalDataSourceImpl(db: db);
    final imageProcessor = ImageProcessor();
    final remoteDs =
        CameraRemoteDataSourceImpl(imageProcessor: imageProcessor);

    // 1. Upload un-uploaded exposures
    final unuploaded = await localDs.getUnuploadedExposures();
    for (final exposure in unuploaded) {
      try {
        final publicId = await remoteDs.uploadExposure(
          filePath: exposure.localPath,
          userUid: userUid,
        );
        await localDs.updateCloudinaryPublicId(exposure.id, publicId);
      } catch (_) {
        // Best effort — will retry next cycle
      }
    }

    // 2. Check time-based development trigger
    final triggerTime = await _getTriggerTime(db);
    if (DateTime.now().isAfter(triggerTime)) {
      final undeveloped = await localDs.getUndevelopedExposures();
      if (undeveloped.isNotEmpty) {
        final ids = undeveloped.map((e) => e.id).toList();
        await localDs.markAsDeveloped(ids);
      }
    }

    return true;
  } finally {
    await db.close();
  }
}

Future<DateTime> _getTriggerTime(AppDatabase db) async {
  final row = await (db.select(db.configCache)
        ..where((t) => t.key.equals('development_trigger_time_json')))
      .getSingleOrNull();

  if (row != null) {
    final parsed = parseDevelopmentTriggerTime(row.value);
    if (parsed != null) return parsed;
  }

  // Fallback default
  return DateTime.parse('2026-05-31T03:00:00Z'); // 05:00 CEST
}

// ---------------------------------------------------------------------------
// BackgroundTaskManager — clean API for app code
// ---------------------------------------------------------------------------

class BackgroundTaskManager {
  /// Initialize Workmanager. Call once during app startup.
  static Future<void> initialize() async {
    // ignore: deprecated_member_use
    await Workmanager().initialize(callbackDispatcher, isInDebugMode: false);
  }

  /// Register the periodic camera sync task (~15 minutes).
  static Future<void> registerCameraSyncTask({required String userUid}) async {
    await Workmanager().registerPeriodicTask(
      kCameraSyncPeriodicTask,
      kCameraSyncPeriodicTask,
      frequency: const Duration(minutes: 15),
      constraints: Constraints(
        networkType: NetworkType.connected,
      ),
      inputData: {'userUid': userUid},
      existingWorkPolicy: ExistingPeriodicWorkPolicy.replace,
    );
  }

  /// Enqueue an immediate one-shot camera sync (e.g., after capture).
  static Future<void> triggerImmediateSync({required String userUid}) async {
    await Workmanager().registerOneOffTask(
      '${kCameraSyncTask}_${DateTime.now().millisecondsSinceEpoch}',
      kCameraSyncTask,
      constraints: Constraints(
        networkType: NetworkType.connected,
      ),
      inputData: {'userUid': userUid},
    );
  }

  /// Cancel all background tasks (e.g., on sign out).
  static Future<void> cancelAll() async {
    await Workmanager().cancelAll();
  }
}
