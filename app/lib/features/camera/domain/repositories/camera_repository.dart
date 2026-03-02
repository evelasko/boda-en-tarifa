import 'package:camera/camera.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/exposure.dart';

abstract class CameraRepository {
  FutureEither<Exposure> capturePhoto(CameraController controller);

  Stream<List<Exposure>> watchExposures();

  FutureEither<int> getNextExposureNumber();
}
