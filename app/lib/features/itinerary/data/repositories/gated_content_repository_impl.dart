import 'package:fpdart/fpdart.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/error/exceptions.dart';
import 'package:boda_en_tarifa_app/core/error/failures.dart';

import '../../domain/entities/gated_content_payload.dart';
import '../../domain/repositories/gated_content_repository.dart';
import '../datasources/gated_content_remote_data_source.dart';

class GatedContentRepositoryImpl implements GatedContentRepository {
  final GatedContentRemoteDataSource _remoteDataSource;

  GatedContentRepositoryImpl({
    required GatedContentRemoteDataSource remoteDataSource,
  }) : _remoteDataSource = remoteDataSource;

  @override
  FutureEither<GatedContentDoc> getContent(String firestoreDocPath) async {
    try {
      final doc = await _remoteDataSource.getContent(firestoreDocPath);
      return Right(doc);
    } on ServerException catch (e, st) {
      if (e.message == 'Contenido no disponible aún') {
        return Left(PermissionFailure(e.message, st));
      }
      return Left(ServerFailure(e.message, st));
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }
}
