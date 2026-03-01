import 'dart:async';

import 'package:http/http.dart' as http;
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';

import '../../data/datasources/weather_remote_data_source.dart';
import '../../data/repositories/weather_repository_impl.dart';
import '../../domain/entities/weather_info.dart';
import '../../domain/repositories/weather_repository.dart';
import '../../domain/usecases/get_weather.dart';

part 'weather_providers.g.dart';

@Riverpod(keepAlive: true)
http.Client httpClient(Ref ref) {
  final client = http.Client();
  ref.onDispose(client.close);
  return client;
}

@Riverpod(keepAlive: true)
WeatherRemoteDataSource weatherRemoteDataSource(Ref ref) {
  return WeatherRemoteDataSourceImpl(
    httpClient: ref.watch(httpClientProvider),
    remoteConfig: ref.watch(remoteConfigProvider),
  );
}

@Riverpod(keepAlive: true)
WeatherRepository weatherRepository(Ref ref) {
  return WeatherRepositoryImpl(
    remoteDataSource: ref.watch(weatherRemoteDataSourceProvider),
    networkInfo: ref.watch(networkInfoProvider),
  );
}

@Riverpod(keepAlive: true)
GetWeather getWeatherUseCase(Ref ref) {
  return GetWeather(ref.watch(weatherRepositoryProvider));
}

@Riverpod(keepAlive: true)
class Weather extends _$Weather {
  Timer? _refreshTimer;

  static const _refreshInterval = Duration(minutes: 30);

  @override
  Future<WeatherInfo> build() async {
    ref.onDispose(() => _refreshTimer?.cancel());
    _startPeriodicRefresh();
    return _fetch();
  }

  Future<WeatherInfo> _fetch() async {
    final result = await ref.read(getWeatherUseCaseProvider)();
    return result.fold(
      (failure) => throw failure,
      (weather) => weather,
    );
  }

  void _startPeriodicRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(_refreshInterval, (_) {
      ref.invalidateSelf();
    });
  }
}
