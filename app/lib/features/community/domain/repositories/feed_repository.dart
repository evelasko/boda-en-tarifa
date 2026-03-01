import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/feed_post.dart';

abstract class FeedRepository {
  Stream<List<FeedPost>> watchFeedPosts({int limit});

  FutureEither<void> createFeedPost(FeedPost post);

  FutureEither<void> hideFeedPost(String postId);
}
