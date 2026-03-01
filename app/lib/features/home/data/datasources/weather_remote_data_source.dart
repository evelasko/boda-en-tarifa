import 'dart:convert';
import 'dart:math';

import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:http/http.dart' as http;

import 'package:boda_en_tarifa_app/core/error/exceptions.dart';

import '../../domain/entities/weather_info.dart';

abstract class WeatherRemoteDataSource {
  Future<WeatherInfo> getWeather();
}

class WeatherRemoteDataSourceImpl implements WeatherRemoteDataSource {
  final http.Client _httpClient;
  final FirebaseRemoteConfig _remoteConfig;

  static const _latitude = 36.0137;
  static const _longitude = -5.6049;

  static const _defaultTips = {
    'levante': [
      '¡Es día de Levante! Sujeta el sombrero y olvida la laca.',
      'Levante en Tarifa: el secador natural más potente de Andalucía.',
      'Con este Levante, mejor selfies que fotos de grupo.',
    ],
    'poniente': [
      'Poniente suave hoy — pelo perfecto para las fotos.',
      'Brisa de Poniente: la boda tiene aire acondicionado natural.',
      'Poniente fresquito, ¡noche de baile asegurada!',
    ],
    'other': [
      'Sin viento fuerte hoy — ¡milagro en Tarifa!',
      'Día raro en Tarifa: ni Levante ni Poniente. Aprovecha.',
      'Viento tranquilo, ¡las servilletas se quedan en la mesa!',
    ],
  };

  WeatherRemoteDataSourceImpl({
    required http.Client httpClient,
    required FirebaseRemoteConfig remoteConfig,
  })  : _httpClient = httpClient,
        _remoteConfig = remoteConfig;

  @override
  Future<WeatherInfo> getWeather() async {
    final uri = Uri.parse(
      'https://api.open-meteo.com/v1/forecast'
      '?latitude=$_latitude'
      '&longitude=$_longitude'
      '&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code'
      '&timezone=Europe/Madrid',
    );

    final response = await _httpClient.get(uri);

    if (response.statusCode != 200) {
      throw ServerException(
        'Weather API error: ${response.statusCode}',
      );
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final current = json['current'] as Map<String, dynamic>;

    final temperature = (current['temperature_2m'] as num).toDouble();
    final windSpeed = (current['wind_speed_10m'] as num).toDouble();
    final windDirection = (current['wind_direction_10m'] as num).toDouble();
    final weatherCode = (current['weather_code'] as num).toInt();

    final windType = _classifyWind(windDirection);
    final description = _weatherCodeToDescription(weatherCode);
    final tip = _selectTip(windType);

    return WeatherInfo(
      temperatureCelsius: temperature,
      windSpeedKmh: windSpeed,
      windDirectionDegrees: windDirection,
      windType: windType,
      description: description,
      tip: tip,
    );
  }

  WindType _classifyWind(double degrees) {
    if (degrees >= 60 && degrees <= 120) return WindType.levante;
    if (degrees >= 240 && degrees <= 300) return WindType.poniente;
    return WindType.other;
  }

  String _selectTip(WindType windType) {
    final tipsMap = _parseTipsFromRemoteConfig() ?? _defaultTips;
    final key = windType.name;
    final tips = tipsMap[key];
    if (tips == null || tips.isEmpty) return '';
    return tips[Random().nextInt(tips.length)];
  }

  Map<String, List<String>>? _parseTipsFromRemoteConfig() {
    try {
      final raw = _remoteConfig.getString('wind_tips_json');
      if (raw.isEmpty) return null;

      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      return decoded.map(
        (key, value) => MapEntry(
          key,
          (value as List<dynamic>).cast<String>(),
        ),
      );
    } catch (_) {
      return null;
    }
  }

  static String _weatherCodeToDescription(int code) {
    // WMO Weather interpretation codes (WW)
    return switch (code) {
      0 => 'Cielo despejado',
      1 => 'Mayormente despejado',
      2 => 'Parcialmente nublado',
      3 => 'Nublado',
      45 => 'Niebla',
      48 => 'Niebla con escarcha',
      51 => 'Llovizna ligera',
      53 => 'Llovizna moderada',
      55 => 'Llovizna intensa',
      56 => 'Llovizna helada ligera',
      57 => 'Llovizna helada intensa',
      61 => 'Lluvia ligera',
      63 => 'Lluvia moderada',
      65 => 'Lluvia intensa',
      66 => 'Lluvia helada ligera',
      67 => 'Lluvia helada intensa',
      71 => 'Nevada ligera',
      73 => 'Nevada moderada',
      75 => 'Nevada intensa',
      77 => 'Granizo fino',
      80 => 'Chubascos ligeros',
      81 => 'Chubascos moderados',
      82 => 'Chubascos intensos',
      85 => 'Chubascos de nieve ligeros',
      86 => 'Chubascos de nieve intensos',
      95 => 'Tormenta',
      96 => 'Tormenta con granizo ligero',
      99 => 'Tormenta con granizo intenso',
      _ => 'Desconocido',
    };
  }
}
