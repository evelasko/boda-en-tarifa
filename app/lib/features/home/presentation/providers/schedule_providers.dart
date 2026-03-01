import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:boda_en_tarifa_app/core/models/event_schedule.dart';
import 'package:boda_en_tarifa_app/core/models/venue.dart';
import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';
import 'package:boda_en_tarifa_app/core/remote_config/remote_config_providers.dart';

import '../../data/datasources/schedule_local_data_source.dart';
import '../../data/datasources/schedule_remote_data_source.dart';
import '../../data/repositories/schedule_repository_impl.dart';
import '../../domain/repositories/schedule_repository.dart';
import '../../domain/usecases/get_current_event.dart';

part 'schedule_providers.g.dart';

// ---------------------------------------------------------------------------
// Data layer wiring
// ---------------------------------------------------------------------------

@Riverpod(keepAlive: true)
ScheduleLocalDataSource scheduleLocalDataSource(Ref ref) {
  return ScheduleLocalDataSourceImpl(
    db: ref.watch(appDatabaseProvider),
  );
}

@Riverpod(keepAlive: true)
ScheduleRemoteDataSource scheduleRemoteDataSource(Ref ref) {
  return ScheduleRemoteDataSourceImpl(
    remoteConfigService: ref.watch(remoteConfigServiceProvider),
  );
}

@Riverpod(keepAlive: true)
ScheduleRepository scheduleRepository(Ref ref) {
  return ScheduleRepositoryImpl(
    localDataSource: ref.watch(scheduleLocalDataSourceProvider),
    remoteDataSource: ref.watch(scheduleRemoteDataSourceProvider),
  );
}

@Riverpod(keepAlive: true)
GetCurrentEvent getCurrentEventUseCase(Ref ref) {
  return GetCurrentEvent(ref.watch(scheduleRepositoryProvider));
}

// ---------------------------------------------------------------------------
// Admin timeline override
// ---------------------------------------------------------------------------

/// Watches `config/timeline_override` in Firestore.
/// Returns the overridden event ID, or null when no override is active.
@Riverpod(keepAlive: true)
Stream<String?> timelineOverride(Ref ref) {
  final firestore = ref.watch(firestoreProvider);
  return firestore.doc('config/timeline_override').snapshots().map((snap) {
    if (!snap.exists) return null;
    final data = snap.data();
    if (data == null) return null;
    final eventId = data['eventId'] as String?;
    final active = data['active'] as bool? ?? false;
    if (!active || eventId == null || eventId.isEmpty) return null;
    return eventId;
  });
}

// ---------------------------------------------------------------------------
// Hero banner state
// ---------------------------------------------------------------------------

/// Encapsulates what the hero banner should display.
class HeroBannerState {
  final EventSchedule? currentEvent;
  final EventSchedule? nextEvent;
  final Venue? venue;
  final bool isOverridden;

  const HeroBannerState({
    this.currentEvent,
    this.nextEvent,
    this.venue,
    this.isOverridden = false,
  });

  bool get isBetweenEvents => currentEvent == null && nextEvent != null;
  bool get isBeforeWedding => currentEvent == null && nextEvent != null;
  bool get isAfterWedding => currentEvent == null && nextEvent == null;
}

/// The main provider for the hero banner. Combines:
/// 1. Drift-backed schedule data (reactive via watch)
/// 2. A periodic timer to re-evaluate the current event
/// 3. Admin override from Firestore
@Riverpod(keepAlive: true)
class HeroBanner extends _$HeroBanner {
  Timer? _tickTimer;

  static const _tickInterval = Duration(seconds: 30);

  @override
  Stream<HeroBannerState> build() async* {
    ref.onDispose(() => _tickTimer?.cancel());

    final localDs = ref.watch(scheduleLocalDataSourceProvider);
    final overrideAsync = ref.watch(timelineOverrideProvider);

    final overrideEventId = overrideAsync.whenData((v) => v).value;

    await for (final schedules in localDs.watchSchedules()) {
      yield _evaluate(schedules, overrideEventId);

      // Re-evaluate periodically so the banner updates as time passes,
      // even if the underlying schedule data hasn't changed.
      _tickTimer?.cancel();
      _tickTimer = Timer.periodic(_tickInterval, (_) {
        state = AsyncData(_evaluate(schedules, overrideEventId));
      });
    }
  }

  HeroBannerState _evaluate(
    List<EventSchedule> schedules,
    String? overrideEventId,
  ) {
    final now = DateTime.now();

    if (overrideEventId != null) {
      final overrideEvent = schedules
          .where((e) => e.id == overrideEventId)
          .firstOrNull;
      if (overrideEvent != null) {
        final venue = _resolveVenue(overrideEvent.venueId);
        return HeroBannerState(
          currentEvent: overrideEvent,
          venue: venue,
          isOverridden: true,
        );
      }
    }

    EventSchedule? current;
    EventSchedule? next;

    for (final event in schedules) {
      if (!event.startTime.isAfter(now) && event.endTime.isAfter(now)) {
        current = event;
      } else if (event.startTime.isAfter(now) && next == null) {
        next = event;
      }
    }

    final activeEvent = current;
    final venue =
        activeEvent != null ? _resolveVenue(activeEvent.venueId) : null;

    return HeroBannerState(
      currentEvent: activeEvent,
      nextEvent: next,
      venue: venue,
    );
  }

  Venue? _resolveVenue(String venueId) {
    final venuesAsync = ref.read(venuesProvider);
    return venuesAsync.whenData((venues) {
      return venues.where((v) => v.id == venueId).firstOrNull;
    }).value;
  }

  /// Admin action: set a manual override to force a specific event.
  Future<void> setOverride(String eventId) async {
    final firestore = ref.read(firestoreProvider);
    await firestore.doc('config/timeline_override').set({
      'eventId': eventId,
      'active': true,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Admin action: clear the manual override.
  Future<void> clearOverride() async {
    final firestore = ref.read(firestoreProvider);
    await firestore.doc('config/timeline_override').set({
      'active': false,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}

// ---------------------------------------------------------------------------
// Admin check
// ---------------------------------------------------------------------------

/// Whether the current user has admin privileges (custom claim).
@Riverpod(keepAlive: true)
Future<bool> isAdmin(Ref ref) async {
  final auth = ref.watch(firebaseAuthProvider);
  final user = auth.currentUser;
  if (user == null) return false;
  final tokenResult = await user.getIdTokenResult();
  return tokenResult.claims?['admin'] == true;
}
