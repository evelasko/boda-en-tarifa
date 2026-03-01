import 'package:drift/drift.dart';

import 'package:boda_en_tarifa_app/core/database/app_database.dart';
import 'package:boda_en_tarifa_app/core/models/event_schedule.dart';

abstract class ScheduleLocalDataSource {
  Future<List<EventSchedule>> getSchedules();
  Stream<List<EventSchedule>> watchSchedules();
}

class ScheduleLocalDataSourceImpl implements ScheduleLocalDataSource {
  final AppDatabase _db;

  ScheduleLocalDataSourceImpl({required AppDatabase db}) : _db = db;

  @override
  Future<List<EventSchedule>> getSchedules() async {
    final query = _db.select(_db.eventSchedules)
      ..orderBy([(t) => OrderingTerm.asc(t.startTime)]);
    final rows = await query.get();
    return rows.map(_rowToEntity).toList();
  }

  @override
  Stream<List<EventSchedule>> watchSchedules() {
    final query = _db.select(_db.eventSchedules)
      ..orderBy([(t) => OrderingTerm.asc(t.startTime)]);
    return query.watch().map(
          (rows) => rows.map(_rowToEntity).toList(),
        );
  }

  EventSchedule _rowToEntity(EventScheduleRow row) {
    return EventSchedule(
      id: row.id,
      title: row.title,
      description: row.description,
      startTime: row.startTime,
      endTime: row.endTime,
      venueId: row.venueId,
      ctaLabel: row.ctaLabel,
      ctaDeepLink: row.ctaDeepLink,
      dayNumber: row.dayNumber,
    );
  }
}
