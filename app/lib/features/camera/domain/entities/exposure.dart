import 'package:freezed_annotation/freezed_annotation.dart';

part 'exposure.freezed.dart';
part 'exposure.g.dart';

@freezed
abstract class Exposure with _$Exposure {
  const factory Exposure({
    required String id,
    required String localPath,
    String? cloudinaryPublicId,
    required int exposureNumber,
    required DateTime capturedAt,
    @Default(false) bool isDeveloped,
    @Default(false) bool isPublished,
  }) = _Exposure;

  factory Exposure.fromJson(Map<String, dynamic> json) =>
      _$ExposureFromJson(json);
}
