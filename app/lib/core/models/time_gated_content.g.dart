// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'time_gated_content.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_TimeGatedContent _$TimeGatedContentFromJson(Map<String, dynamic> json) =>
    _TimeGatedContent(
      id: json['id'] as String,
      contentType: json['contentType'] as String,
      title: json['title'] as String,
      unlockAt: DateTime.parse(json['unlockAt'] as String),
    );

Map<String, dynamic> _$TimeGatedContentToJson(_TimeGatedContent instance) =>
    <String, dynamic>{
      'id': instance.id,
      'contentType': instance.contentType,
      'title': instance.title,
      'unlockAt': instance.unlockAt.toIso8601String(),
    };
