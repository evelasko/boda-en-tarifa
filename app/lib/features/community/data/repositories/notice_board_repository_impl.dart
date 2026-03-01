import 'package:fpdart/fpdart.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/error/exceptions.dart';
import 'package:boda_en_tarifa_app/core/error/failures.dart';

import '../../domain/entities/notice.dart';
import '../../domain/repositories/notice_board_repository.dart';
import '../datasources/notice_board_remote_data_source.dart';

class NoticeBoardRepositoryImpl implements NoticeBoardRepository {
  final NoticeBoardRemoteDataSource _remoteDataSource;

  NoticeBoardRepositoryImpl({
    required NoticeBoardRemoteDataSource remoteDataSource,
  }) : _remoteDataSource = remoteDataSource;

  @override
  Stream<List<Notice>> watchNotices() => _remoteDataSource.watchNotices();

  @override
  FutureEither<void> createNotice(Notice notice) async {
    try {
      await _remoteDataSource.createNotice(notice);
      return const Right(null);
    } on ServerException catch (e, st) {
      return Left(ServerFailure(e.message, st));
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }
}
