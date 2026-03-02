import 'package:camera/camera.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/exposure.dart';
import '../repositories/camera_repository.dart';

class CapturePhoto {
  final CameraRepository _repository;

  CapturePhoto({required CameraRepository repository})
      : _repository = repository;

  FutureEither<Exposure> call(CameraController controller) =>
      _repository.capturePhoto(controller);
}
