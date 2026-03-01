import 'package:boda_en_tarifa_app/core/models/event_schedule.dart';
import 'package:boda_en_tarifa_app/core/remote_config/remote_config_service.dart';

abstract class ScheduleRemoteDataSource {
  /// Triggers a Remote Config fetch, persists to Drift, and returns the
  /// updated schedule list.
  Future<List<EventSchedule>> fetchAndGetSchedules();
}

class ScheduleRemoteDataSourceImpl implements ScheduleRemoteDataSource {
  final RemoteConfigService _remoteConfigService;

  ScheduleRemoteDataSourceImpl({
    required RemoteConfigService remoteConfigService,
  }) : _remoteConfigService = remoteConfigService;

  @override
  Future<List<EventSchedule>> fetchAndGetSchedules() async {
    await _remoteConfigService.fetchAndPersist();
    return _remoteConfigService.getSchedules();
  }
}
