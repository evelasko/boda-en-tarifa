import 'package:freezed_annotation/freezed_annotation.dart';

part 'time_gated_content.freezed.dart';
part 'time_gated_content.g.dart';

@freezed
abstract class TimeGatedContent with _$TimeGatedContent {
  const factory TimeGatedContent({
    required String id,
    required String contentType,
    required String title,
    required DateTime unlockAt,
  }) = _TimeGatedContent;

  factory TimeGatedContent.fromJson(Map<String, dynamic> json) =>
      _$TimeGatedContentFromJson(json);
}
