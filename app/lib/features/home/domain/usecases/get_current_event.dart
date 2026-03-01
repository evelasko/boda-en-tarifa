import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/models/event_schedule.dart';

import '../repositories/schedule_repository.dart';

class GetCurrentEvent {
  final ScheduleRepository _repository;

  GetCurrentEvent(this._repository);

  FutureEither<EventSchedule?> call() => _repository.getCurrentEvent();

  Stream<EventSchedule?> watch() => _repository.watchCurrentEvent();
}
