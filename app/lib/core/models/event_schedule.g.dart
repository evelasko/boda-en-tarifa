// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'event_schedule.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_EventSchedule _$EventScheduleFromJson(Map<String, dynamic> json) =>
    _EventSchedule(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      venueId: json['venueId'] as String,
      ctaLabel: json['ctaLabel'] as String?,
      ctaDeepLink: json['ctaDeepLink'] as String?,
      dayNumber: (json['dayNumber'] as num).toInt(),
    );

Map<String, dynamic> _$EventScheduleToJson(_EventSchedule instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'startTime': instance.startTime.toIso8601String(),
      'endTime': instance.endTime.toIso8601String(),
      'venueId': instance.venueId,
      'ctaLabel': instance.ctaLabel,
      'ctaDeepLink': instance.ctaDeepLink,
      'dayNumber': instance.dayNumber,
    };
