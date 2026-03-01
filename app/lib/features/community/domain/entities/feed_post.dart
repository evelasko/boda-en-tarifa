import 'package:freezed_annotation/freezed_annotation.dart';

import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';

part 'feed_post.freezed.dart';
part 'feed_post.g.dart';

enum FeedPostSource {
  @JsonValue('unfiltered')
  unfiltered,
  @JsonValue('import')
  imported,
  @JsonValue('shareExtension')
  shareExtension,
}

@freezed
abstract class FeedPost with _$FeedPost {
  const factory FeedPost({
    required String id,
    required String authorUid,
    required String authorName,
    String? authorPhotoUrl,
    required List<String> imageUrls,
    String? caption,
    required FeedPostSource source,
    @Default(false) bool isHidden,
    @TimestampConverter() required DateTime createdAt,
  }) = _FeedPost;

  factory FeedPost.fromJson(Map<String, dynamic> json) =>
      _$FeedPostFromJson(json);
}
