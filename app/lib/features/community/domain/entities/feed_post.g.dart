// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'feed_post.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_FeedPost _$FeedPostFromJson(Map<String, dynamic> json) => _FeedPost(
  id: json['id'] as String,
  authorUid: json['authorUid'] as String,
  authorName: json['authorName'] as String,
  authorPhotoUrl: json['authorPhotoUrl'] as String?,
  imageUrls: (json['imageUrls'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
  caption: json['caption'] as String?,
  source: $enumDecode(_$FeedPostSourceEnumMap, json['source']),
  isHidden: json['isHidden'] as bool? ?? false,
  createdAt: const TimestampConverter().fromJson(json['createdAt']),
);

Map<String, dynamic> _$FeedPostToJson(_FeedPost instance) => <String, dynamic>{
  'id': instance.id,
  'authorUid': instance.authorUid,
  'authorName': instance.authorName,
  'authorPhotoUrl': instance.authorPhotoUrl,
  'imageUrls': instance.imageUrls,
  'caption': instance.caption,
  'source': _$FeedPostSourceEnumMap[instance.source]!,
  'isHidden': instance.isHidden,
  'createdAt': const TimestampConverter().toJson(instance.createdAt),
};

const _$FeedPostSourceEnumMap = {
  FeedPostSource.unfiltered: 'unfiltered',
  FeedPostSource.imported: 'import',
  FeedPostSource.shareExtension: 'shareExtension',
};
