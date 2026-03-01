import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/models/event_schedule.dart';

abstract class ScheduleRepository {
  FutureEither<EventSchedule?> getCurrentEvent();

  FutureEither<List<EventSchedule>> getSchedule();

  Stream<EventSchedule?> watchCurrentEvent();
}
