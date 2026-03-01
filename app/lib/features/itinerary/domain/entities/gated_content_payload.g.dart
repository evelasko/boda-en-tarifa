// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'gated_content_payload.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_GatedContentDoc _$GatedContentDocFromJson(Map<String, dynamic> json) =>
    _GatedContentDoc(
      id: json['id'] as String,
      contentType: json['contentType'] as String,
      payload: json['payload'] as Map<String, dynamic>,
      unlockAt: DateTime.parse(json['unlockAt'] as String),
    );

Map<String, dynamic> _$GatedContentDocToJson(_GatedContentDoc instance) =>
    <String, dynamic>{
      'id': instance.id,
      'contentType': instance.contentType,
      'payload': instance.payload,
      'unlockAt': instance.unlockAt.toIso8601String(),
    };

_MenuPayload _$MenuPayloadFromJson(Map<String, dynamic> json) => _MenuPayload(
  items: (json['items'] as List<dynamic>)
      .map((e) => MenuItem.fromJson(e as Map<String, dynamic>))
      .toList(),
  notes: json['notes'] as String?,
);

Map<String, dynamic> _$MenuPayloadToJson(_MenuPayload instance) =>
    <String, dynamic>{'items': instance.items, 'notes': instance.notes};

_MenuItem _$MenuItemFromJson(Map<String, dynamic> json) => _MenuItem(
  name: json['name'] as String,
  description: json['description'] as String?,
  dietary:
      (json['dietary'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
);

Map<String, dynamic> _$MenuItemToJson(_MenuItem instance) => <String, dynamic>{
  'name': instance.name,
  'description': instance.description,
  'dietary': instance.dietary,
};
