// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'exposure.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Exposure _$ExposureFromJson(Map<String, dynamic> json) => _Exposure(
  id: json['id'] as String,
  localPath: json['localPath'] as String,
  cloudinaryPublicId: json['cloudinaryPublicId'] as String?,
  exposureNumber: (json['exposureNumber'] as num).toInt(),
  capturedAt: DateTime.parse(json['capturedAt'] as String),
  isDeveloped: json['isDeveloped'] as bool? ?? false,
  isPublished: json['isPublished'] as bool? ?? false,
);

Map<String, dynamic> _$ExposureToJson(_Exposure instance) => <String, dynamic>{
  'id': instance.id,
  'localPath': instance.localPath,
  'cloudinaryPublicId': instance.cloudinaryPublicId,
  'exposureNumber': instance.exposureNumber,
  'capturedAt': instance.capturedAt.toIso8601String(),
  'isDeveloped': instance.isDeveloped,
  'isPublished': instance.isPublished,
};
