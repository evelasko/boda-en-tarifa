import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:fpdart/fpdart.dart';

import '../repositories/camera_repository.dart';

class SyncExposures {
  final CameraRepository _repository;

  SyncExposures({required CameraRepository repository})
      : _repository = repository;

  /// Uploads all exposures that don't yet have a cloudinaryPublicId.
  /// Best-effort: continues on individual failures.
  /// Returns the count of successfully uploaded exposures.
  FutureEither<int> call() async {
    final unuploadedResult = await _repository.getUnuploadedExposures();

    return unuploadedResult.fold(
      Left.new,
      (exposures) async {
        var uploaded = 0;
        for (final exposure in exposures) {
          final result = await _repository.uploadExposure(exposure);
          result.fold(
            (_) {}, // Best effort — skip failures
            (_) => uploaded++,
          );
        }
        return Right(uploaded);
      },
    );
  }
}
