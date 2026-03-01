import 'dart:convert';

import '../../models/event_schedule.dart';

List<EventSchedule>? parseEventScheduleJson(String json) {
  try {
    final list = jsonDecode(json) as List<dynamic>;
    return list
        .map((e) => EventSchedule.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return null;
  }
}
