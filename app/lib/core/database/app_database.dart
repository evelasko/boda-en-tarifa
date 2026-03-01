import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'app_database.g.dart';

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

@DataClassName('EventScheduleRow')
class EventSchedules extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get description => text()();
  DateTimeColumn get startTime => dateTime()();
  DateTimeColumn get endTime => dateTime()();
  TextColumn get venueId => text()();
  TextColumn get ctaLabel => text().nullable()();
  TextColumn get ctaDeepLink => text().nullable()();
  IntColumn get dayNumber => integer()();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('VenueRow')
class Venues extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  RealColumn get latitude => real()();
  RealColumn get longitude => real()();
  TextColumn get walkingDirections => text().nullable()();
  TextColumn get terrainNote => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class CachedGuests extends Table {
  TextColumn get uid => text()();
  TextColumn get fullName => text()();
  TextColumn get photoUrl => text().nullable()();
  TextColumn get side => text()();
  TextColumn get relationToGrooms => text()();
  TextColumn get relationshipStatus => text()();
  TextColumn get whatsappNumber => text().nullable()();
  TextColumn get funFact => text().nullable()();

  @override
  Set<Column> get primaryKey => {uid};
}

class Exposures extends Table {
  TextColumn get id => text()();
  TextColumn get localPath => text()();
  TextColumn get cloudinaryPublicId => text().nullable()();
  IntColumn get exposureNumber => integer()();
  DateTimeColumn get capturedAt => dateTime()();
  BoolColumn get isDeveloped =>
      boolean().withDefault(const Constant(false))();
  BoolColumn get isPublished =>
      boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

class PendingWrites extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get collection => text()();
  TextColumn get documentId => text()();
  TextColumn get payload => text()();
  TextColumn get operation => text()();
  DateTimeColumn get createdAt => dateTime()();
}

class TimeGates extends Table {
  TextColumn get id => text()();
  TextColumn get contentType => text()();
  TextColumn get title => text()();
  DateTimeColumn get unlockAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('SeatingAssignmentRow')
class SeatingAssignments extends Table {
  TextColumn get guestId => text()();
  TextColumn get guestName => text()();
  TextColumn get assignedTable => text()();
  IntColumn get seatNumber => integer()();

  @override
  Set<Column> get primaryKey => {guestId};
}

class ConfigCache extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {key};
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

@DriftDatabase(tables: [
  EventSchedules,
  Venues,
  CachedGuests,
  Exposures,
  PendingWrites,
  TimeGates,
  SeatingAssignments,
  ConfigCache,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase._({required QueryExecutor executor}) : super(executor);

  factory AppDatabase() => AppDatabase._(executor: _openConnection());

  AppDatabase.forTesting(super.executor);

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            await m.createTable(timeGates);
            await m.createTable(seatingAssignments);
            await m.createTable(configCache);
          }
        },
      );
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'boda_en_tarifa.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
