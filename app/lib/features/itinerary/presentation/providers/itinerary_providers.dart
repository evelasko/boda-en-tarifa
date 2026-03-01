import 'dart:async';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/models/event_schedule.dart';
import '../../../../core/models/venue.dart';
import '../../../../core/remote_config/remote_config_providers.dart';

part 'itinerary_providers.g.dart';

@Riverpod(keepAlive: true)
Future<Map<String, Venue>> venueMap(Ref ref) async {
  final venueList = await ref.watch(venuesProvider.future);
  return {for (final v in venueList) v.id: v};
}

@Riverpod(keepAlive: true)
Future<Map<int, List<EventSchedule>>> groupedSchedules(Ref ref) async {
  final schedules = await ref.watch(eventSchedulesProvider.future);
  final sorted = [...schedules]..sort((a, b) => a.startTime.compareTo(b.startTime));

  final grouped = <int, List<EventSchedule>>{};
  for (final event in sorted) {
    grouped.putIfAbsent(event.dayNumber, () => []).add(event);
  }
  return Map.fromEntries(
    grouped.entries.toList()..sort((a, b) => a.key.compareTo(b.key)),
  );
}

/// Re-evaluates every 60 seconds to keep the "active event" highlight current.
@riverpod
class CurrentEventId extends _$CurrentEventId {
  Timer? _timer;

  @override
  String? build() {
    ref.onDispose(() => _timer?.cancel());

    _timer = Timer.periodic(const Duration(seconds: 60), (_) {
      ref.invalidateSelf();
    });

    final schedules = ref.watch(eventSchedulesProvider).asData?.value;
    if (schedules == null || schedules.isEmpty) return null;

    final now = DateTime.now();
    for (final event in schedules) {
      if (!now.isBefore(event.startTime) && now.isBefore(event.endTime)) {
        return event.id;
      }
    }
    return null;
  }
}

/// Day labels for the three wedding days.
const kDayLabels = {
  1: 'Día 1 — 29 de mayo',
  2: 'Día 2 — 30 de mayo',
  3: 'Día 3 — 31 de mayo',
};
