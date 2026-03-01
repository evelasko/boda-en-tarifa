import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/weather_info.dart';

abstract class WeatherRepository {
  FutureEither<WeatherInfo> getWeather();
}
