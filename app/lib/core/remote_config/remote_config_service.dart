import 'package:drift/drift.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:flutter/services.dart';

import '../database/app_database.dart';
import '../models/event_schedule.dart';
import '../models/quick_contacts.dart';
import '../models/seating_assignment.dart';
import '../models/time_gated_content.dart';
import '../models/venue.dart';
import 'parsers/parsers.dart';

class RemoteConfigService {
  final FirebaseRemoteConfig _remoteConfig;
  final AppDatabase _db;

  RemoteConfigService({
    required FirebaseRemoteConfig remoteConfig,
    required AppDatabase db,
  })  : _remoteConfig = remoteConfig,
        _db = db;

  Future<void> initialize() async {
    await _remoteConfig.setConfigSettings(RemoteConfigSettings(
      fetchTimeout: const Duration(minutes: 1),
      minimumFetchInterval: const Duration(minutes: 15),
    ));
    await _setDefaultsFromAssets();
    await fetchAndPersist();
  }

  Future<bool> fetchAndPersist() async {
    try {
      await _remoteConfig.fetchAndActivate();
    } catch (_) {
      // Fetch failed — fall through to persist whatever is activated
      // (either previously fetched values or bundled defaults).
    }

    return _persistActivatedValues();
  }

  // ---------------------------------------------------------------------------
  // Read methods — serve data from Drift cache
  // ---------------------------------------------------------------------------

  Future<List<EventSchedule>> getSchedules() async {
    final rows = await _db.select(_db.eventSchedules).get();
    return rows
        .map((r) => EventSchedule(
              id: r.id,
              title: r.title,
              description: r.description,
              startTime: r.startTime,
              endTime: r.endTime,
              venueId: r.venueId,
              ctaLabel: r.ctaLabel,
              ctaDeepLink: r.ctaDeepLink,
              dayNumber: r.dayNumber,
            ))
        .toList();
  }

  Future<List<Venue>> getVenues() async {
    final rows = await _db.select(_db.venues).get();
    return rows
        .map((r) => Venue(
              id: r.id,
              name: r.name,
              latitude: r.latitude,
              longitude: r.longitude,
              walkingDirections: r.walkingDirections,
              terrainNote: r.terrainNote,
            ))
        .toList();
  }

  Future<List<TimeGatedContent>> getTimeGates() async {
    final rows = await _db.select(_db.timeGates).get();
    return rows
        .map((r) => TimeGatedContent(
              id: r.id,
              contentType: r.contentType,
              title: r.title,
              unlockAt: r.unlockAt,
            ))
        .toList();
  }

  Future<List<SeatingAssignment>> getSeatingAssignments() async {
    final rows = await _db.select(_db.seatingAssignments).get();
    return rows
        .map((r) => SeatingAssignment(
              guestId: r.guestId,
              guestName: r.guestName,
              tableName: r.assignedTable,
              seatNumber: r.seatNumber,
            ))
        .toList();
  }

  Future<QuickContacts?> getQuickContacts() async {
    final row = await (_db.select(_db.configCache)
          ..where((t) => t.key.equals('quick_contacts_json')))
        .getSingleOrNull();
    if (row == null) return null;
    return parseQuickContactsJson(row.value);
  }

  Future<Map<String, List<String>>?> getWindTips() async {
    final row = await (_db.select(_db.configCache)
          ..where((t) => t.key.equals('wind_tips_json')))
        .getSingleOrNull();
    if (row == null) return null;
    return parseWindTipsJson(row.value);
  }

  Future<DateTime?> getDevelopmentTriggerTime() async {
    final row = await (_db.select(_db.configCache)
          ..where((t) => t.key.equals('development_trigger_time_json')))
        .getSingleOrNull();
    if (row == null) return null;
    return parseDevelopmentTriggerTime(row.value);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  Future<void> _setDefaultsFromAssets() async {
    final defaults = <String, String>{};

    const assetMap = {
      'event_schedule_json': 'assets/defaults/event_schedule.json',
      'venues_json': 'assets/defaults/venues.json',
      'time_gates_json': 'assets/defaults/time_gates.json',
      'seating_chart_json': 'assets/defaults/seating_chart.json',
      'quick_contacts_json': 'assets/defaults/quick_contacts.json',
      'wind_tips_json': 'assets/defaults/wind_tips.json',
      'development_trigger_time_json':
          'assets/defaults/development_trigger_time.json',
    };

    for (final entry in assetMap.entries) {
      try {
        final content = await rootBundle.loadString(entry.value);
        defaults[entry.key] = content;
      } catch (_) {
        // Asset missing — skip this key
      }
    }

    await _remoteConfig.setDefaults(defaults);
  }

  Future<bool> _persistActivatedValues() async {
    final now = DateTime.now();

    String rc(String key) => _remoteConfig.getString(key);

    // Parse all keys
    final schedules = parseEventScheduleJson(rc('event_schedule_json'));
    final venues = parseVenuesJson(rc('venues_json'));
    final timeGates = parseTimeGatesJson(rc('time_gates_json'));
    final seating = parseSeatingChartJson(rc('seating_chart_json'));
    final contactsRaw = rc('quick_contacts_json');
    final windTipsRaw = rc('wind_tips_json');
    final triggerTimeRaw = rc('development_trigger_time_json');

    // Persist structured tables in parallel
    final futures = <Future<void>>[];

    if (schedules != null) {
      futures.add(_persistSchedules(schedules));
    }
    if (venues != null) {
      futures.add(_persistVenues(venues));
    }
    if (timeGates != null) {
      futures.add(_persistTimeGates(timeGates));
    }
    if (seating != null) {
      futures.add(_persistSeatingAssignments(seating));
    }

    // Persist raw JSON to ConfigCache
    if (contactsRaw.isNotEmpty) {
      futures.add(_upsertConfigCache('quick_contacts_json', contactsRaw, now));
    }
    if (windTipsRaw.isNotEmpty) {
      futures.add(_upsertConfigCache('wind_tips_json', windTipsRaw, now));
    }
    if (triggerTimeRaw.isNotEmpty) {
      futures.add(_upsertConfigCache(
          'development_trigger_time_json', triggerTimeRaw, now));
    }

    await Future.wait(futures);
    return true;
  }

  Future<void> _persistSchedules(List<EventSchedule> items) async {
    await _db.transaction(() async {
      await _db.delete(_db.eventSchedules).go();
      await _db.batch((batch) {
        for (final item in items) {
          batch.insert(
            _db.eventSchedules,
            EventSchedulesCompanion.insert(
              id: item.id,
              title: item.title,
              description: item.description,
              startTime: item.startTime,
              endTime: item.endTime,
              venueId: item.venueId,
              ctaLabel: Value(item.ctaLabel),
              ctaDeepLink: Value(item.ctaDeepLink),
              dayNumber: item.dayNumber,
            ),
          );
        }
      });
    });
  }

  Future<void> _persistVenues(List<Venue> items) async {
    await _db.transaction(() async {
      await _db.delete(_db.venues).go();
      await _db.batch((batch) {
        for (final item in items) {
          batch.insert(
            _db.venues,
            VenuesCompanion.insert(
              id: item.id,
              name: item.name,
              latitude: item.latitude,
              longitude: item.longitude,
              walkingDirections: Value(item.walkingDirections),
              terrainNote: Value(item.terrainNote),
            ),
          );
        }
      });
    });
  }

  Future<void> _persistTimeGates(List<TimeGatedContent> items) async {
    await _db.transaction(() async {
      await _db.delete(_db.timeGates).go();
      await _db.batch((batch) {
        for (final item in items) {
          batch.insert(
            _db.timeGates,
            TimeGatesCompanion.insert(
              id: item.id,
              contentType: item.contentType,
              title: item.title,
              unlockAt: item.unlockAt,
            ),
          );
        }
      });
    });
  }

  Future<void> _persistSeatingAssignments(List<SeatingAssignment> items) async {
    await _db.transaction(() async {
      await _db.delete(_db.seatingAssignments).go();
      await _db.batch((batch) {
        for (final item in items) {
          batch.insert(
            _db.seatingAssignments,
            SeatingAssignmentsCompanion.insert(
              guestId: item.guestId,
              guestName: item.guestName,
              assignedTable: item.tableName,
              seatNumber: item.seatNumber,
            ),
          );
        }
      });
    });
  }

  Future<void> _upsertConfigCache(
      String key, String value, DateTime now) async {
    await _db.into(_db.configCache).insertOnConflictUpdate(
          ConfigCacheCompanion.insert(
            key: key,
            value: value,
            updatedAt: now,
          ),
        );
  }
}
