import 'package:camera/camera.dart';
import 'package:fpdart/fpdart.dart';
import 'package:uuid/uuid.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/error/exceptions.dart';
import 'package:boda_en_tarifa_app/core/error/failures.dart';

import '../../domain/entities/exposure.dart';
import '../../domain/repositories/camera_repository.dart';
import '../datasources/camera_device_data_source.dart';
import '../datasources/exposure_local_data_source.dart';

class CameraRepositoryImpl implements CameraRepository {
  final ExposureLocalDataSource _exposureLocalDataSource;
  final CameraDeviceDataSource _cameraDeviceDataSource;

  static const _uuid = Uuid();

  CameraRepositoryImpl({
    required ExposureLocalDataSource exposureLocalDataSource,
    required CameraDeviceDataSource cameraDeviceDataSource,
  })  : _exposureLocalDataSource = exposureLocalDataSource,
        _cameraDeviceDataSource = cameraDeviceDataSource;

  @override
  FutureEither<Exposure> capturePhoto(CameraController controller) async {
    try {
      final count = await _exposureLocalDataSource.getExposureCount();
      final exposureNumber = count + 1;

      final localPath =
          await _cameraDeviceDataSource.captureImage(controller);

      final exposure = Exposure(
        id: _uuid.v4(),
        localPath: localPath,
        exposureNumber: exposureNumber,
        capturedAt: DateTime.now(),
      );

      await _exposureLocalDataSource.insertExposure(exposure);

      return Right(exposure);
    } on CacheException catch (e, st) {
      return Left(CacheFailure(e.message, st));
    } catch (e, st) {
      return Left(CacheFailure(e.toString(), st));
    }
  }

  @override
  Stream<List<Exposure>> watchExposures() =>
      _exposureLocalDataSource.watchAllExposures();

  @override
  FutureEither<int> getNextExposureNumber() async {
    try {
      final count = await _exposureLocalDataSource.getExposureCount();
      return Right(count + 1);
    } on CacheException catch (e, st) {
      return Left(CacheFailure(e.message, st));
    } catch (e, st) {
      return Left(CacheFailure(e.toString(), st));
    }
  }
}
