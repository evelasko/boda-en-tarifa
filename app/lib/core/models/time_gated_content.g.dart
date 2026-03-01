// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'time_gated_content.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_TimeGatedContent _$TimeGatedContentFromJson(Map<String, dynamic> json) =>
    _TimeGatedContent(
      id: json['id'] as String,
      contentType: $enumDecode(_$ContentTypeEnumMap, json['contentType']),
      title: json['title'] as String,
      unlockAt: DateTime.parse(json['unlockAt'] as String),
      eventId: json['eventId'] as String?,
      firestoreDocPath: json['firestoreDocPath'] as String?,
    );

Map<String, dynamic> _$TimeGatedContentToJson(_TimeGatedContent instance) =>
    <String, dynamic>{
      'id': instance.id,
      'contentType': _$ContentTypeEnumMap[instance.contentType]!,
      'title': instance.title,
      'unlockAt': instance.unlockAt.toIso8601String(),
      'eventId': instance.eventId,
      'firestoreDocPath': instance.firestoreDocPath,
    };

const _$ContentTypeEnumMap = {
  ContentType.menu: 'menu',
  ContentType.seating: 'seating',
  ContentType.unknown: 'unknown',
};
