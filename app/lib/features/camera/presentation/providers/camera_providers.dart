import 'package:camera/camera.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';

import '../../data/datasources/camera_device_data_source.dart';
import '../../data/datasources/exposure_local_data_source.dart';
import '../../data/repositories/camera_repository_impl.dart';
import '../../domain/entities/exposure.dart';
import '../../domain/repositories/camera_repository.dart';

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
CameraRepository cameraRepository(Ref ref) {
  return CameraRepositoryImpl(
    exposureLocalDataSource: ref.watch(exposureLocalDataSourceProvider),
    cameraDeviceDataSource: ref.watch(cameraDeviceDataSourceProvider),
  );
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
      (exposure) => exposure,
    );
  }
}

// ---------------------------------------------------------------------------
// Exposure stream & count
// ---------------------------------------------------------------------------

@riverpod
Stream<List<Exposure>> exposureStream(Ref ref) {
  final repo = ref.watch(cameraRepositoryProvider);
  return repo.watchExposures();
}

@riverpod
int exposureCount(Ref ref) {
  final exposures = ref.watch(exposureStreamProvider).asData?.value;
  return exposures?.length ?? 0;
}
