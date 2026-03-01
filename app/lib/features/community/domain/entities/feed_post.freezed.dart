// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'feed_post.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$FeedPost {

 String get id; String get authorUid; String get authorName; String? get authorPhotoUrl; List<String> get imageUrls; String? get caption; FeedPostSource get source; bool get isHidden;@TimestampConverter() DateTime get createdAt;
/// Create a copy of FeedPost
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$FeedPostCopyWith<FeedPost> get copyWith => _$FeedPostCopyWithImpl<FeedPost>(this as FeedPost, _$identity);

  /// Serializes this FeedPost to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is FeedPost&&(identical(other.id, id) || other.id == id)&&(identical(other.authorUid, authorUid) || other.authorUid == authorUid)&&(identical(other.authorName, authorName) || other.authorName == authorName)&&(identical(other.authorPhotoUrl, authorPhotoUrl) || other.authorPhotoUrl == authorPhotoUrl)&&const DeepCollectionEquality().equals(other.imageUrls, imageUrls)&&(identical(other.caption, caption) || other.caption == caption)&&(identical(other.source, source) || other.source == source)&&(identical(other.isHidden, isHidden) || other.isHidden == isHidden)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,authorUid,authorName,authorPhotoUrl,const DeepCollectionEquality().hash(imageUrls),caption,source,isHidden,createdAt);

@override
String toString() {
  return 'FeedPost(id: $id, authorUid: $authorUid, authorName: $authorName, authorPhotoUrl: $authorPhotoUrl, imageUrls: $imageUrls, caption: $caption, source: $source, isHidden: $isHidden, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $FeedPostCopyWith<$Res>  {
  factory $FeedPostCopyWith(FeedPost value, $Res Function(FeedPost) _then) = _$FeedPostCopyWithImpl;
@useResult
$Res call({
 String id, String authorUid, String authorName, String? authorPhotoUrl, List<String> imageUrls, String? caption, FeedPostSource source, bool isHidden,@TimestampConverter() DateTime createdAt
});




}
/// @nodoc
class _$FeedPostCopyWithImpl<$Res>
    implements $FeedPostCopyWith<$Res> {
  _$FeedPostCopyWithImpl(this._self, this._then);

  final FeedPost _self;
  final $Res Function(FeedPost) _then;

/// Create a copy of FeedPost
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? authorUid = null,Object? authorName = null,Object? authorPhotoUrl = freezed,Object? imageUrls = null,Object? caption = freezed,Object? source = null,Object? isHidden = null,Object? createdAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,authorUid: null == authorUid ? _self.authorUid : authorUid // ignore: cast_nullable_to_non_nullable
as String,authorName: null == authorName ? _self.authorName : authorName // ignore: cast_nullable_to_non_nullable
as String,authorPhotoUrl: freezed == authorPhotoUrl ? _self.authorPhotoUrl : authorPhotoUrl // ignore: cast_nullable_to_non_nullable
as String?,imageUrls: null == imageUrls ? _self.imageUrls : imageUrls // ignore: cast_nullable_to_non_nullable
as List<String>,caption: freezed == caption ? _self.caption : caption // ignore: cast_nullable_to_non_nullable
as String?,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as FeedPostSource,isHidden: null == isHidden ? _self.isHidden : isHidden // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [FeedPost].
extension FeedPostPatterns on FeedPost {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _FeedPost value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _FeedPost() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _FeedPost value)  $default,){
final _that = this;
switch (_that) {
case _FeedPost():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _FeedPost value)?  $default,){
final _that = this;
switch (_that) {
case _FeedPost() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String authorUid,  String authorName,  String? authorPhotoUrl,  List<String> imageUrls,  String? caption,  FeedPostSource source,  bool isHidden, @TimestampConverter()  DateTime createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _FeedPost() when $default != null:
return $default(_that.id,_that.authorUid,_that.authorName,_that.authorPhotoUrl,_that.imageUrls,_that.caption,_that.source,_that.isHidden,_that.createdAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String authorUid,  String authorName,  String? authorPhotoUrl,  List<String> imageUrls,  String? caption,  FeedPostSource source,  bool isHidden, @TimestampConverter()  DateTime createdAt)  $default,) {final _that = this;
switch (_that) {
case _FeedPost():
return $default(_that.id,_that.authorUid,_that.authorName,_that.authorPhotoUrl,_that.imageUrls,_that.caption,_that.source,_that.isHidden,_that.createdAt);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String authorUid,  String authorName,  String? authorPhotoUrl,  List<String> imageUrls,  String? caption,  FeedPostSource source,  bool isHidden, @TimestampConverter()  DateTime createdAt)?  $default,) {final _that = this;
switch (_that) {
case _FeedPost() when $default != null:
return $default(_that.id,_that.authorUid,_that.authorName,_that.authorPhotoUrl,_that.imageUrls,_that.caption,_that.source,_that.isHidden,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _FeedPost implements FeedPost {
  const _FeedPost({required this.id, required this.authorUid, required this.authorName, this.authorPhotoUrl, required final  List<String> imageUrls, this.caption, required this.source, this.isHidden = false, @TimestampConverter() required this.createdAt}): _imageUrls = imageUrls;
  factory _FeedPost.fromJson(Map<String, dynamic> json) => _$FeedPostFromJson(json);

@override final  String id;
@override final  String authorUid;
@override final  String authorName;
@override final  String? authorPhotoUrl;
 final  List<String> _imageUrls;
@override List<String> get imageUrls {
  if (_imageUrls is EqualUnmodifiableListView) return _imageUrls;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_imageUrls);
}

@override final  String? caption;
@override final  FeedPostSource source;
@override@JsonKey() final  bool isHidden;
@override@TimestampConverter() final  DateTime createdAt;

/// Create a copy of FeedPost
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$FeedPostCopyWith<_FeedPost> get copyWith => __$FeedPostCopyWithImpl<_FeedPost>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$FeedPostToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _FeedPost&&(identical(other.id, id) || other.id == id)&&(identical(other.authorUid, authorUid) || other.authorUid == authorUid)&&(identical(other.authorName, authorName) || other.authorName == authorName)&&(identical(other.authorPhotoUrl, authorPhotoUrl) || other.authorPhotoUrl == authorPhotoUrl)&&const DeepCollectionEquality().equals(other._imageUrls, _imageUrls)&&(identical(other.caption, caption) || other.caption == caption)&&(identical(other.source, source) || other.source == source)&&(identical(other.isHidden, isHidden) || other.isHidden == isHidden)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,authorUid,authorName,authorPhotoUrl,const DeepCollectionEquality().hash(_imageUrls),caption,source,isHidden,createdAt);

@override
String toString() {
  return 'FeedPost(id: $id, authorUid: $authorUid, authorName: $authorName, authorPhotoUrl: $authorPhotoUrl, imageUrls: $imageUrls, caption: $caption, source: $source, isHidden: $isHidden, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$FeedPostCopyWith<$Res> implements $FeedPostCopyWith<$Res> {
  factory _$FeedPostCopyWith(_FeedPost value, $Res Function(_FeedPost) _then) = __$FeedPostCopyWithImpl;
@override @useResult
$Res call({
 String id, String authorUid, String authorName, String? authorPhotoUrl, List<String> imageUrls, String? caption, FeedPostSource source, bool isHidden,@TimestampConverter() DateTime createdAt
});




}
/// @nodoc
class __$FeedPostCopyWithImpl<$Res>
    implements _$FeedPostCopyWith<$Res> {
  __$FeedPostCopyWithImpl(this._self, this._then);

  final _FeedPost _self;
  final $Res Function(_FeedPost) _then;

/// Create a copy of FeedPost
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? authorUid = null,Object? authorName = null,Object? authorPhotoUrl = freezed,Object? imageUrls = null,Object? caption = freezed,Object? source = null,Object? isHidden = null,Object? createdAt = null,}) {
  return _then(_FeedPost(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,authorUid: null == authorUid ? _self.authorUid : authorUid // ignore: cast_nullable_to_non_nullable
as String,authorName: null == authorName ? _self.authorName : authorName // ignore: cast_nullable_to_non_nullable
as String,authorPhotoUrl: freezed == authorPhotoUrl ? _self.authorPhotoUrl : authorPhotoUrl // ignore: cast_nullable_to_non_nullable
as String?,imageUrls: null == imageUrls ? _self._imageUrls : imageUrls // ignore: cast_nullable_to_non_nullable
as List<String>,caption: freezed == caption ? _self.caption : caption // ignore: cast_nullable_to_non_nullable
as String?,source: null == source ? _self.source : source // ignore: cast_nullable_to_non_nullable
as FeedPostSource,isHidden: null == isHidden ? _self.isHidden : isHidden // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}

// dart format on
