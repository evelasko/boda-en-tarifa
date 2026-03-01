import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';

import '../../data/datasources/feed_remote_data_source.dart';
import '../../data/repositories/feed_repository_impl.dart';
import '../../domain/entities/feed_post.dart';
import '../../domain/repositories/feed_repository.dart';

part 'feed_providers.g.dart';

// ---------------------------------------------------------------------------
// Data layer providers
// ---------------------------------------------------------------------------

@Riverpod(keepAlive: true)
FeedRemoteDataSource feedRemoteDataSource(Ref ref) {
  return FeedRemoteDataSourceImpl(
    firestore: ref.watch(firestoreProvider),
  );
}

@Riverpod(keepAlive: true)
FeedRepository feedRepository(Ref ref) {
  return FeedRepositoryImpl(
    remoteDataSource: ref.watch(feedRemoteDataSourceProvider),
  );
}

// ---------------------------------------------------------------------------
// Pagination limit
// ---------------------------------------------------------------------------

@riverpod
class FeedPageLimit extends _$FeedPageLimit {
  @override
  int build() => 15;

  void increase() {
    state += 15;
  }
}

// ---------------------------------------------------------------------------
// Live feed stream (real-time, paginated via limit)
// ---------------------------------------------------------------------------

@riverpod
Stream<List<FeedPost>> liveFeed(Ref ref) {
  final limit = ref.watch(feedPageLimitProvider);
  final repo = ref.watch(feedRepositoryProvider);
  return repo.watchFeedPosts(limit: limit);
}
