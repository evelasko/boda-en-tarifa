import 'package:freezed_annotation/freezed_annotation.dart';

part 'event_schedule.freezed.dart';
part 'event_schedule.g.dart';

@freezed
abstract class EventSchedule with _$EventSchedule {
  const factory EventSchedule({
    required String id,
    required String title,
    required String description,
    required DateTime startTime,
    required DateTime endTime,
    required String venueId,
    String? ctaLabel,
    String? ctaDeepLink,
    required int dayNumber,
  }) = _EventSchedule;

  factory EventSchedule.fromJson(Map<String, dynamic> json) =>
      _$EventScheduleFromJson(json);
}
