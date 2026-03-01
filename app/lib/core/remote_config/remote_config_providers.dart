import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/event_schedule.dart';
import '../models/quick_contacts.dart';
import '../models/seating_assignment.dart';
import '../models/time_gated_content.dart';
import '../models/venue.dart';
import 'remote_config_service.dart';

part 'remote_config_providers.g.dart';

/// Must be overridden in ProviderScope with the pre-initialized instance.
final remoteConfigServiceProvider = Provider<RemoteConfigService>((ref) {
  throw UnimplementedError(
    'remoteConfigServiceProvider must be overridden in ProviderScope',
  );
});

@Riverpod(keepAlive: true)
Future<List<EventSchedule>> eventSchedules(Ref ref) {
  return ref.watch(remoteConfigServiceProvider).getSchedules();
}

@Riverpod(keepAlive: true)
Future<List<Venue>> venues(Ref ref) {
  return ref.watch(remoteConfigServiceProvider).getVenues();
}

@Riverpod(keepAlive: true)
Future<List<TimeGatedContent>> timeGates(Ref ref) {
  return ref.watch(remoteConfigServiceProvider).getTimeGates();
}

@Riverpod(keepAlive: true)
Future<List<SeatingAssignment>> seatingAssignments(Ref ref) {
  return ref.watch(remoteConfigServiceProvider).getSeatingAssignments();
}

@Riverpod(keepAlive: true)
Future<QuickContacts> quickContacts(Ref ref) async {
  final contacts =
      await ref.watch(remoteConfigServiceProvider).getQuickContacts();
  return contacts ??
      const QuickContacts(taxis: [], coordinators: []);
}

@Riverpod(keepAlive: true)
Future<Map<String, List<String>>> windTips(Ref ref) async {
  final tips = await ref.watch(remoteConfigServiceProvider).getWindTips();
  return tips ?? const {};
}

@Riverpod(keepAlive: true)
Future<DateTime> developmentTriggerTime(Ref ref) async {
  final time =
      await ref.watch(remoteConfigServiceProvider).getDevelopmentTriggerTime();
  return time ?? DateTime.parse('2026-05-31T05:00:00+02:00');
}
