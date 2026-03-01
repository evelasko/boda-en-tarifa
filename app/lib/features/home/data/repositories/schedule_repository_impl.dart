import 'dart:async';

import 'package:fpdart/fpdart.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/error/failures.dart';
import 'package:boda_en_tarifa_app/core/models/event_schedule.dart';

import '../../domain/repositories/schedule_repository.dart';
import '../datasources/schedule_local_data_source.dart';
import '../datasources/schedule_remote_data_source.dart';

class ScheduleRepositoryImpl implements ScheduleRepository {
  final ScheduleLocalDataSource _localDataSource;
  final ScheduleRemoteDataSource _remoteDataSource;

  ScheduleRepositoryImpl({
    required ScheduleLocalDataSource localDataSource,
    required ScheduleRemoteDataSource remoteDataSource,
  })  : _localDataSource = localDataSource,
        _remoteDataSource = remoteDataSource;

  @override
  FutureEither<EventSchedule?> getCurrentEvent() async {
    try {
      final schedules = await _localDataSource.getSchedules();
      _triggerBackgroundRefresh();
      return Right(_findCurrentEvent(schedules, DateTime.now()));
    } catch (e, st) {
      return Left(CacheFailure(e.toString(), st));
    }
  }

  @override
  FutureEither<List<EventSchedule>> getSchedule() async {
    try {
      final schedules = await _localDataSource.getSchedules();
      _triggerBackgroundRefresh();
      return Right(schedules);
    } catch (e, st) {
      return Left(CacheFailure(e.toString(), st));
    }
  }

  @override
  Stream<EventSchedule?> watchCurrentEvent() {
    return _localDataSource.watchSchedules().map(
          (schedules) => _findCurrentEvent(schedules, DateTime.now()),
        );
  }

  /// Returns the event that is currently happening, or null if we're between
  /// events. Schedules must be sorted by startTime ascending.
  static EventSchedule? _findCurrentEvent(
    List<EventSchedule> schedules,
    DateTime now,
  ) {
    for (final event in schedules) {
      if (!event.startTime.isAfter(now) && event.endTime.isAfter(now)) {
        return event;
      }
    }
    return null;
  }

  /// Best-effort background refresh — errors are silently ignored since
  /// the Drift watch stream will pick up any successfully persisted data.
  void _triggerBackgroundRefresh() {
    unawaited(
      _remoteDataSource.fetchAndGetSchedules().catchError(
            (_) => <EventSchedule>[],
          ),
    );
  }
}
