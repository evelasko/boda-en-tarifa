import 'package:camera/camera.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/exposure.dart';

abstract class CameraRepository {
  FutureEither<Exposure> capturePhoto(CameraController controller);

  Stream<List<Exposure>> watchExposures();

  FutureEither<int> getNextExposureNumber();

  // MFC-53: Background sync & development trigger
  FutureEither<String> uploadExposure(Exposure exposure);
  FutureEither<void> markExposuresAsDeveloped(List<String> ids);
  FutureEither<List<Exposure>> getUndevelopedExposures();
  FutureEither<int> getUndevelopedCount();
  FutureEither<List<Exposure>> getUnuploadedExposures();
  Stream<List<Exposure>> watchUndevelopedExposures();
}
