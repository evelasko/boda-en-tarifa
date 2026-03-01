import 'package:fpdart/fpdart.dart';

import 'package:boda_en_tarifa_app/core/error/exceptions.dart';
import 'package:boda_en_tarifa_app/core/error/failures.dart';
import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/network/network_info.dart';

import '../../domain/entities/weather_info.dart';
import '../../domain/repositories/weather_repository.dart';
import '../datasources/weather_remote_data_source.dart';

class WeatherRepositoryImpl implements WeatherRepository {
  final WeatherRemoteDataSource _remoteDataSource;
  final NetworkInfo _networkInfo;

  WeatherRepositoryImpl({
    required WeatherRemoteDataSource remoteDataSource,
    required NetworkInfo networkInfo,
  })  : _remoteDataSource = remoteDataSource,
        _networkInfo = networkInfo;

  @override
  FutureEither<WeatherInfo> getWeather() async {
    if (!await _networkInfo.isConnected) {
      return const Left(
        NetworkFailure('Sin conexión — el tiempo no está disponible.'),
      );
    }
    try {
      final weather = await _remoteDataSource.getWeather();
      return Right(weather);
    } on ServerException catch (e, st) {
      return Left(ServerFailure(e.message, st));
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }
}
