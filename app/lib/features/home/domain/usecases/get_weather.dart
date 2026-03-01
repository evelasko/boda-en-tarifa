import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/weather_info.dart';
import '../repositories/weather_repository.dart';

class GetWeather {
  final WeatherRepository _repository;

  const GetWeather(this._repository);

  FutureEither<WeatherInfo> call() {
    return _repository.getWeather();
  }
}
