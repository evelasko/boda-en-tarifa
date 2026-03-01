import 'package:fpdart/fpdart.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/error/exceptions.dart';
import 'package:boda_en_tarifa_app/core/error/failures.dart';

import '../../domain/entities/feed_post.dart';
import '../../domain/repositories/feed_repository.dart';
import '../datasources/feed_remote_data_source.dart';

class FeedRepositoryImpl implements FeedRepository {
  final FeedRemoteDataSource _remoteDataSource;

  FeedRepositoryImpl({
    required FeedRemoteDataSource remoteDataSource,
  }) : _remoteDataSource = remoteDataSource;

  @override
  Stream<List<FeedPost>> watchFeedPosts({int limit = 15}) =>
      _remoteDataSource.watchFeedPosts(limit: limit);

  @override
  FutureEither<void> createFeedPost(FeedPost post) async {
    try {
      await _remoteDataSource.createFeedPost(post);
      return const Right(null);
    } on ServerException catch (e, st) {
      return Left(ServerFailure(e.message, st));
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }

  @override
  FutureEither<void> hideFeedPost(String postId) async {
    try {
      await _remoteDataSource.hideFeedPost(postId);
      return const Right(null);
    } on ServerException catch (e, st) {
      return Left(ServerFailure(e.message, st));
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }
}
