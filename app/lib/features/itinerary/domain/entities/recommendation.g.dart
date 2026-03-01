// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recommendation.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Recommendation _$RecommendationFromJson(Map<String, dynamic> json) =>
    _Recommendation(
      name: json['name'] as String,
      description: json['description'] as String,
      category: json['category'] as String?,
      mapUrl: json['mapUrl'] as String?,
      imageUrl: json['imageUrl'] as String?,
    );

Map<String, dynamic> _$RecommendationToJson(_Recommendation instance) =>
    <String, dynamic>{
      'name': instance.name,
      'description': instance.description,
      'category': instance.category,
      'mapUrl': instance.mapUrl,
      'imageUrl': instance.imageUrl,
    };
