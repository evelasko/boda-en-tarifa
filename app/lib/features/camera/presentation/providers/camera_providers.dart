import 'dart:async';

import 'package:camera/camera.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:boda_en_tarifa_app/core/background/background_tasks.dart';
import 'package:boda_en_tarifa_app/core/media/image_processor.dart';
import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';
import 'package:boda_en_tarifa_app/core/remote_config/remote_config_providers.dart';
import 'package:boda_en_tarifa_app/features/auth/presentation/providers/auth_providers.dart';

import '../../data/datasources/camera_device_data_source.dart';
import '../../data/datasources/camera_remote_data_source.dart';
import '../../data/datasources/exposure_local_data_source.dart';
import '../../data/repositories/camera_repository_impl.dart';
import '../../domain/entities/exposure.dart';
import '../../domain/repositories/camera_repository.dart';
import '../../domain/usecases/check_development_trigger.dart';
import '../../domain/usecases/sync_exposures.dart';

part 'camera_providers.g.dart';

// ---------------------------------------------------------------------------
// Data layer providers
// ---------------------------------------------------------------------------

@Riverpod(keepAlive: true)
ExposureLocalDataSource exposureLocalDataSource(Ref ref) {
  return ExposureLocalDataSourceImpl(
    db: ref.watch(appDatabaseProvider),
  );
}

@Riverpod(keepAlive: true)
CameraDeviceDataSource cameraDeviceDataSource(Ref ref) {
  return CameraDeviceDataSourceImpl();
}

@Riverpod(keepAlive: true)
CameraRemoteDataSource cameraRemoteDataSource(Ref ref) {
  return CameraRemoteDataSourceImpl(imageProcessor: ImageProcessor());
}

@Riverpod(keepAlive: true)
CameraRepository cameraRepository(Ref ref) {
  final authUser = ref.watch(authStateProvider).asData?.value;
  return CameraRepositoryImpl(
    exposureLocalDataSource: ref.watch(exposureLocalDataSourceProvider),
    cameraDeviceDataSource: ref.watch(cameraDeviceDataSourceProvider),
    cameraRemoteDataSource: ref.watch(cameraRemoteDataSourceProvider),
    userUid: authUser?.uid ?? 'anonymous',
  );
}

// ---------------------------------------------------------------------------
// Use case providers
// ---------------------------------------------------------------------------

@Riverpod(keepAlive: true)
CheckDevelopmentTrigger checkDevelopmentTriggerUseCase(Ref ref) {
  return CheckDevelopmentTrigger(
    repository: ref.watch(cameraRepositoryProvider),
  );
}

@Riverpod(keepAlive: true)
SyncExposures syncExposuresUseCase(Ref ref) {
  return SyncExposures(repository: ref.watch(cameraRepositoryProvider));
}

// ---------------------------------------------------------------------------
// Camera controller (pre-initialized, kept alive across tab switches)
// ---------------------------------------------------------------------------

@Riverpod(keepAlive: true)
class CameraControllerNotifier extends _$CameraControllerNotifier {
  CameraDeviceDataSource get _deviceDataSource =>
      ref.read(cameraDeviceDataSourceProvider);

  CameraRepository get _repository => ref.read(cameraRepositoryProvider);

  @override
  Future<CameraController> build() async {
    final controller = await _deviceDataSource.initialize();
    ref.onDispose(() => _deviceDataSource.disposeController(controller));
    return controller;
  }

  Future<void> pause() async {
    final controller = state.value;
    if (controller != null && controller.value.isInitialized) {
      await controller.pausePreview();
    }
  }

  Future<void> resume() async {
    final controller = state.value;
    if (controller != null && controller.value.isInitialized) {
      await controller.resumePreview();
    } else {
      ref.invalidateSelf();
    }
  }

  Future<Exposure?> capture() async {
    final controller = state.value;
    if (controller == null || !controller.value.isInitialized) return null;

    final result = await _repository.capturePhoto(controller);
    return result.fold(
      (failure) => throw Exception(failure.message),
      (exposure) {
        // Fire-and-forget: silent background upload
        _enqueueSilentUpload();
        return exposure;
      },
    );
  }

  void _enqueueSilentUpload() {
    final authUser = ref.read(authStateProvider).asData?.value;
    if (authUser == null) return;

    // Foreground sync attempt (best effort)
    ref.read(syncExposuresUseCaseProvider)();

    // Background task as fallback
    BackgroundTaskManager.triggerImmediateSync(userUid: authUser.uid);
  }
}

// ---------------------------------------------------------------------------
// Exposure stream & count (undeveloped only for active roll)
// ---------------------------------------------------------------------------

@riverpod
Stream<List<Exposure>> undevelopedExposureStream(Ref ref) {
  final repo = ref.watch(cameraRepositoryProvider);
  return repo.watchUndevelopedExposures();
}

@riverpod
int exposureCount(Ref ref) {
  final exposures =
      ref.watch(undevelopedExposureStreamProvider).asData?.value;
  return exposures?.length ?? 0;
}

// Keep the full exposure stream for other consumers
@riverpod
Stream<List<Exposure>> exposureStream(Ref ref) {
  final repo = ref.watch(cameraRepositoryProvider);
  return repo.watchExposures();
}

// ---------------------------------------------------------------------------
// Development trigger checker (periodic + after-capture)
// ---------------------------------------------------------------------------

@Riverpod(keepAlive: true)
class DevelopmentTriggerChecker extends _$DevelopmentTriggerChecker {
  Timer? _timer;

  @override
  DevelopmentResult? build() {
    // Check immediately on build
    Future.microtask(_check);

    // Check every 5 minutes
    _timer = Timer.periodic(const Duration(minutes: 5), (_) => _check());
    ref.onDispose(() => _timer?.cancel());

    return null;
  }

  Future<void> _check() async {
    final triggerTime =
        await ref.read(developmentTriggerTimeProvider.future);
    final useCase = ref.read(checkDevelopmentTriggerUseCaseProvider);
    final result = await useCase(triggerTime: triggerTime, now: DateTime.now());
    result.fold(
      (_) {}, // Silently fail
      (devResult) => state = devResult,
    );
  }

  /// Called after each capture to check the 24-exposure trigger.
  /// Returns the result so the caller can react (e.g., show animation).
  Future<DevelopmentResult?> checkAfterCapture() async {
    final triggerTime =
        await ref.read(developmentTriggerTimeProvider.future);
    final useCase = ref.read(checkDevelopmentTriggerUseCaseProvider);
    final result = await useCase(triggerTime: triggerTime, now: DateTime.now());
    return result.fold(
      (_) => null,
      (devResult) {
        state = devResult;
        return devResult;
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Background sync registration (watches auth state)
// ---------------------------------------------------------------------------

@Riverpod(keepAlive: true)
Future<void> cameraSyncRegistration(Ref ref) async {
  final authUser = ref.watch(authStateProvider).asData?.value;
  if (authUser != null) {
    await BackgroundTaskManager.registerCameraSyncTask(
      userUid: authUser.uid,
    );
  } else {
    await BackgroundTaskManager.cancelAll();
  }
}

// ---------------------------------------------------------------------------
// Foreground sync on connectivity change
// ---------------------------------------------------------------------------

@Riverpod(keepAlive: true)
void cameraSyncOnConnectivity(Ref ref) {
  ref.listen(connectivityProvider, (prev, next) {
    final results = next.asData?.value;
    if (results == null) return;
    final hasConnection = !results.contains(ConnectivityResult.none);
    if (hasConnection) {
      ref.read(syncExposuresUseCaseProvider)();
    }
  });
}
