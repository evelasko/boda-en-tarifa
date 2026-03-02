import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/map/offline_tile_manager.dart';
import '../../../../core/models/venue.dart';
import '../../../../core/providers/core_providers.dart';
import '../../../../core/remote_config/remote_config_providers.dart';
import '../../../home/presentation/providers/schedule_providers.dart';
import 'itinerary_providers.dart';

part 'map_providers.g.dart';

@Riverpod(keepAlive: true)
OfflineTileManager offlineTileManager(Ref ref) {
  return OfflineTileManagerImpl(db: ref.watch(appDatabaseProvider));
}

@Riverpod(keepAlive: true)
Future<bool> mapTilesReady(Ref ref) {
  return ref.watch(offlineTileManagerProvider).areTilesDownloaded();
}

/// Resolves the active venue based on the current event (or admin override).
/// Returns null when no event is active.
@riverpod
Future<Venue?> activeVenue(Ref ref) async {
  // Respect admin override first
  final overrideAsync = ref.watch(timelineOverrideProvider);
  final overrideEventId = overrideAsync.whenData((v) => v).value;

  final schedules = ref.watch(eventSchedulesProvider).asData?.value;
  if (schedules == null || schedules.isEmpty) return null;

  final venueMap = await ref.watch(venueMapProvider.future);

  if (overrideEventId != null) {
    final overrideEvent =
        schedules.where((e) => e.id == overrideEventId).firstOrNull;
    if (overrideEvent != null) return venueMap[overrideEvent.venueId];
  }

  final currentEventId = ref.watch(currentEventIdProvider);
  if (currentEventId == null) return null;

  final currentEvent =
      schedules.where((e) => e.id == currentEventId).firstOrNull;
  if (currentEvent == null) return null;

  return venueMap[currentEvent.venueId];
}
