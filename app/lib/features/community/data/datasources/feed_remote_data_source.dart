import 'package:cloud_firestore/cloud_firestore.dart';

import 'package:boda_en_tarifa_app/core/error/exceptions.dart';

import '../../domain/entities/feed_post.dart';

abstract class FeedRemoteDataSource {
  Stream<List<FeedPost>> watchFeedPosts({required int limit});

  Future<void> createFeedPost(FeedPost post);

  Future<void> hideFeedPost(String postId);
}

class FeedRemoteDataSourceImpl implements FeedRemoteDataSource {
  final FirebaseFirestore _firestore;

  FeedRemoteDataSourceImpl({required FirebaseFirestore firestore})
      : _firestore = firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('feed_posts');

  @override
  Stream<List<FeedPost>> watchFeedPosts({required int limit}) {
    return _collection
        .where('isHidden', isEqualTo: false)
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) {
              return FeedPost.fromJson({...doc.data(), 'id': doc.id});
            }).toList());
  }

  @override
  Future<void> createFeedPost(FeedPost post) async {
    try {
      await _collection.add({
        'authorUid': post.authorUid,
        'authorName': post.authorName,
        'authorPhotoUrl': post.authorPhotoUrl,
        'imageUrls': post.imageUrls,
        'caption': post.caption,
        'source': _sourceToJson(post.source),
        'isHidden': false,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } on FirebaseException catch (e) {
      throw ServerException(
        e.message ?? 'Error al crear la publicación',
      );
    }
  }

  @override
  Future<void> hideFeedPost(String postId) async {
    try {
      await _collection.doc(postId).update({'isHidden': true});
    } on FirebaseException catch (e) {
      throw ServerException(
        e.message ?? 'Error al ocultar la publicación',
      );
    }
  }

  static String _sourceToJson(FeedPostSource source) => switch (source) {
        FeedPostSource.unfiltered => 'unfiltered',
        FeedPostSource.imported => 'import',
        FeedPostSource.shareExtension => 'shareExtension',
      };
}
