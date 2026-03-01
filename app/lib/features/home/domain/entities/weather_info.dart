import 'package:freezed_annotation/freezed_annotation.dart';

part 'weather_info.freezed.dart';

enum WindType { levante, poniente, other }

@freezed
abstract class WeatherInfo with _$WeatherInfo {
  const factory WeatherInfo({
    required double temperatureCelsius,
    required double windSpeedKmh,
    required double windDirectionDegrees,
    required WindType windType,
    required String description,
    required String tip,
  }) = _WeatherInfo;
}
