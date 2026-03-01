import 'package:freezed_annotation/freezed_annotation.dart';

part 'gated_content_payload.freezed.dart';
part 'gated_content_payload.g.dart';

@freezed
abstract class GatedContentDoc with _$GatedContentDoc {
  const factory GatedContentDoc({
    required String id,
    required String contentType,
    required Map<String, dynamic> payload,
    required DateTime unlockAt,
  }) = _GatedContentDoc;

  factory GatedContentDoc.fromJson(Map<String, dynamic> json) =>
      _$GatedContentDocFromJson(json);
}

@freezed
abstract class MenuPayload with _$MenuPayload {
  const factory MenuPayload({
    required List<MenuItem> items,
    String? notes,
  }) = _MenuPayload;

  factory MenuPayload.fromJson(Map<String, dynamic> json) =>
      _$MenuPayloadFromJson(json);
}

@freezed
abstract class MenuItem with _$MenuItem {
  const factory MenuItem({
    required String name,
    String? description,
    @Default([]) List<String> dietary,
  }) = _MenuItem;

  factory MenuItem.fromJson(Map<String, dynamic> json) =>
      _$MenuItemFromJson(json);
}
