import 'package:fpdart/fpdart.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/error/exceptions.dart';
import 'package:boda_en_tarifa_app/core/error/failures.dart';
import 'package:boda_en_tarifa_app/core/network/network_info.dart';

import '../../domain/entities/guest_profile.dart';
import '../../domain/repositories/directory_repository.dart';
import '../datasources/guest_local_data_source.dart';
import '../datasources/guest_remote_data_source.dart';

class DirectoryRepositoryImpl implements DirectoryRepository {
  final GuestRemoteDataSource _remoteDataSource;
  final GuestLocalDataSource _localDataSource;
  final NetworkInfo _networkInfo;

  DirectoryRepositoryImpl({
    required GuestRemoteDataSource remoteDataSource,
    required GuestLocalDataSource localDataSource,
    required NetworkInfo networkInfo,
  })  : _remoteDataSource = remoteDataSource,
        _localDataSource = localDataSource,
        _networkInfo = networkInfo;

  @override
  FutureEither<List<GuestProfile>> getGuests() async {
    try {
      final cached = await _localDataSource.getAllGuests();

      if (await _networkInfo.isConnected) {
        try {
          final remote = await _remoteDataSource.getVisibleGuests();
          await _localDataSource.replaceAllGuests(remote);
          return Right(remote);
        } on ServerException catch (e, st) {
          if (cached.isNotEmpty) return Right(cached);
          return Left(ServerFailure(e.message, st));
        }
      }

      return Right(cached);
    } on CacheException catch (e, st) {
      return Left(CacheFailure(e.message, st));
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }
}
