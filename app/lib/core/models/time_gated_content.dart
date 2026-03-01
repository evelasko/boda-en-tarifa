import 'package:freezed_annotation/freezed_annotation.dart';

part 'time_gated_content.freezed.dart';
part 'time_gated_content.g.dart';

@JsonEnum(valueField: 'value')
enum ContentType {
  @JsonValue('menu')
  menu('menu'),
  @JsonValue('seating')
  seating('seating'),
  @JsonValue('unknown')
  unknown('unknown');

  const ContentType(this.value);
  final String value;
}

@freezed
abstract class TimeGatedContent with _$TimeGatedContent {
  const factory TimeGatedContent({
    required String id,
    required ContentType contentType,
    required String title,
    required DateTime unlockAt,
    String? eventId,
    String? firestoreDocPath,
  }) = _TimeGatedContent;

  factory TimeGatedContent.fromJson(Map<String, dynamic> json) =>
      _$TimeGatedContentFromJson(json);
}
