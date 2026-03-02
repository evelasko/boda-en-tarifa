import 'package:camera/camera.dart';
import 'package:fpdart/fpdart.dart';
import 'package:uuid/uuid.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/error/exceptions.dart';
import 'package:boda_en_tarifa_app/core/error/failures.dart';

import '../../domain/entities/exposure.dart';
import '../../domain/repositories/camera_repository.dart';
import '../datasources/camera_device_data_source.dart';
import '../datasources/camera_remote_data_source.dart';
import '../datasources/exposure_local_data_source.dart';

class CameraRepositoryImpl implements CameraRepository {
  final ExposureLocalDataSource _exposureLocalDataSource;
  final CameraDeviceDataSource _cameraDeviceDataSource;
  final CameraRemoteDataSource _cameraRemoteDataSource;
  final String _userUid;

  static const _uuid = Uuid();

  CameraRepositoryImpl({
    required ExposureLocalDataSource exposureLocalDataSource,
    required CameraDeviceDataSource cameraDeviceDataSource,
    required CameraRemoteDataSource cameraRemoteDataSource,
    required String userUid,
  })  : _exposureLocalDataSource = exposureLocalDataSource,
        _cameraDeviceDataSource = cameraDeviceDataSource,
        _cameraRemoteDataSource = cameraRemoteDataSource,
        _userUid = userUid;

  @override
  FutureEither<Exposure> capturePhoto(CameraController controller) async {
    try {
      // Count only undeveloped exposures for the current roll
      final count = await _exposureLocalDataSource.getUndevelopedCount();
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
      final count = await _exposureLocalDataSource.getUndevelopedCount();
      return Right(count + 1);
    } on CacheException catch (e, st) {
      return Left(CacheFailure(e.message, st));
    } catch (e, st) {
      return Left(CacheFailure(e.toString(), st));
    }
  }

  // ---------------------------------------------------------------------------
  // MFC-53: Background sync & development trigger
  // ---------------------------------------------------------------------------

  @override
  FutureEither<String> uploadExposure(Exposure exposure) async {
    try {
      final publicId = await _cameraRemoteDataSource.uploadExposure(
        filePath: exposure.localPath,
        userUid: _userUid,
      );
      await _exposureLocalDataSource.updateCloudinaryPublicId(
        exposure.id,
        publicId,
      );
      return Right(publicId);
    } on ServerException catch (e, st) {
      return Left(ServerFailure(e.message, st));
    } on CacheException catch (e, st) {
      return Left(CacheFailure(e.message, st));
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }

  @override
  FutureEither<void> markExposuresAsDeveloped(List<String> ids) async {
    try {
      await _exposureLocalDataSource.markAsDeveloped(ids);
      return const Right(null);
    } on CacheException catch (e, st) {
      return Left(CacheFailure(e.message, st));
    } catch (e, st) {
      return Left(CacheFailure(e.toString(), st));
    }
  }

  @override
  FutureEither<List<Exposure>> getUndevelopedExposures() async {
    try {
      final exposures =
          await _exposureLocalDataSource.getUndevelopedExposures();
      return Right(exposures);
    } on CacheException catch (e, st) {
      return Left(CacheFailure(e.message, st));
    } catch (e, st) {
      return Left(CacheFailure(e.toString(), st));
    }
  }

  @override
  FutureEither<int> getUndevelopedCount() async {
    try {
      final count = await _exposureLocalDataSource.getUndevelopedCount();
      return Right(count);
    } on CacheException catch (e, st) {
      return Left(CacheFailure(e.message, st));
    } catch (e, st) {
      return Left(CacheFailure(e.toString(), st));
    }
  }

  @override
  FutureEither<List<Exposure>> getUnuploadedExposures() async {
    try {
      final exposures =
          await _exposureLocalDataSource.getUnuploadedExposures();
      return Right(exposures);
    } on CacheException catch (e, st) {
      return Left(CacheFailure(e.message, st));
    } catch (e, st) {
      return Left(CacheFailure(e.toString(), st));
    }
  }

  @override
  Stream<List<Exposure>> watchUndevelopedExposures() =>
      _exposureLocalDataSource.watchUndevelopedExposures();

  // ---------------------------------------------------------------------------
  // MFC-54: Development Room gallery and publish-to-feed
  // ---------------------------------------------------------------------------

  @override
  FutureEither<List<Exposure>> getDevelopedExposures() async {
    try {
      final exposures =
          await _exposureLocalDataSource.getDevelopedExposures();
      return Right(exposures);
    } on CacheException catch (e, st) {
      return Left(CacheFailure(e.message, st));
    } catch (e, st) {
      return Left(CacheFailure(e.toString(), st));
    }
  }

  @override
  Stream<List<Exposure>> watchDevelopedExposures() =>
      _exposureLocalDataSource.watchDevelopedExposures();

  @override
  FutureEither<void> markExposuresAsPublished(List<String> ids) async {
    try {
      await _exposureLocalDataSource.markAsPublished(ids);
      return const Right(null);
    } on CacheException catch (e, st) {
      return Left(CacheFailure(e.message, st));
    } catch (e, st) {
      return Left(CacheFailure(e.toString(), st));
    }
  }
}
