import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:fpdart/fpdart.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../repositories/camera_repository.dart';

part 'check_development_trigger.freezed.dart';

@freezed
sealed class DevelopmentResult with _$DevelopmentResult {
  const factory DevelopmentResult.notReady() = DevelopmentNotReady;
  const factory DevelopmentResult.developed({
    required List<String> exposureIds,
  }) = DevelopmentTriggered;
}

class CheckDevelopmentTrigger {
  final CameraRepository _repository;

  static const int rollSize = 24;

  CheckDevelopmentTrigger({required CameraRepository repository})
      : _repository = repository;

  FutureEither<DevelopmentResult> call({
    required DateTime triggerTime,
    required DateTime now,
  }) async {
    final undevelopedResult = await _repository.getUndevelopedExposures();

    return undevelopedResult.fold(
      Left.new,
      (undeveloped) async {
        if (undeveloped.isEmpty) {
          return const Right(DevelopmentResult.notReady());
        }

        final shouldDevelop =
            undeveloped.length >= rollSize || now.isAfter(triggerTime);

        if (!shouldDevelop) {
          return const Right(DevelopmentResult.notReady());
        }

        final ids = undeveloped.map((e) => e.id).toList();
        final developResult =
            await _repository.markExposuresAsDeveloped(ids);

        return developResult.fold(
          Left.new,
          (_) => Right(DevelopmentResult.developed(exposureIds: ids)),
        );
      },
    );
  }
}
