// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'notice.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Notice {

 String get id; String get authorUid; String get authorName; String? get authorPhotoUrl; String get body; String? get authorWhatsappNumber; String? get authorEmail;@TimestampConverter() DateTime get createdAt;
/// Create a copy of Notice
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$NoticeCopyWith<Notice> get copyWith => _$NoticeCopyWithImpl<Notice>(this as Notice, _$identity);

  /// Serializes this Notice to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Notice&&(identical(other.id, id) || other.id == id)&&(identical(other.authorUid, authorUid) || other.authorUid == authorUid)&&(identical(other.authorName, authorName) || other.authorName == authorName)&&(identical(other.authorPhotoUrl, authorPhotoUrl) || other.authorPhotoUrl == authorPhotoUrl)&&(identical(other.body, body) || other.body == body)&&(identical(other.authorWhatsappNumber, authorWhatsappNumber) || other.authorWhatsappNumber == authorWhatsappNumber)&&(identical(other.authorEmail, authorEmail) || other.authorEmail == authorEmail)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,authorUid,authorName,authorPhotoUrl,body,authorWhatsappNumber,authorEmail,createdAt);

@override
String toString() {
  return 'Notice(id: $id, authorUid: $authorUid, authorName: $authorName, authorPhotoUrl: $authorPhotoUrl, body: $body, authorWhatsappNumber: $authorWhatsappNumber, authorEmail: $authorEmail, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $NoticeCopyWith<$Res>  {
  factory $NoticeCopyWith(Notice value, $Res Function(Notice) _then) = _$NoticeCopyWithImpl;
@useResult
$Res call({
 String id, String authorUid, String authorName, String? authorPhotoUrl, String body, String? authorWhatsappNumber, String? authorEmail,@TimestampConverter() DateTime createdAt
});




}
/// @nodoc
class _$NoticeCopyWithImpl<$Res>
    implements $NoticeCopyWith<$Res> {
  _$NoticeCopyWithImpl(this._self, this._then);

  final Notice _self;
  final $Res Function(Notice) _then;

/// Create a copy of Notice
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? authorUid = null,Object? authorName = null,Object? authorPhotoUrl = freezed,Object? body = null,Object? authorWhatsappNumber = freezed,Object? authorEmail = freezed,Object? createdAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,authorUid: null == authorUid ? _self.authorUid : authorUid // ignore: cast_nullable_to_non_nullable
as String,authorName: null == authorName ? _self.authorName : authorName // ignore: cast_nullable_to_non_nullable
as String,authorPhotoUrl: freezed == authorPhotoUrl ? _self.authorPhotoUrl : authorPhotoUrl // ignore: cast_nullable_to_non_nullable
as String?,body: null == body ? _self.body : body // ignore: cast_nullable_to_non_nullable
as String,authorWhatsappNumber: freezed == authorWhatsappNumber ? _self.authorWhatsappNumber : authorWhatsappNumber // ignore: cast_nullable_to_non_nullable
as String?,authorEmail: freezed == authorEmail ? _self.authorEmail : authorEmail // ignore: cast_nullable_to_non_nullable
as String?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [Notice].
extension NoticePatterns on Notice {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Notice value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Notice() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Notice value)  $default,){
final _that = this;
switch (_that) {
case _Notice():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Notice value)?  $default,){
final _that = this;
switch (_that) {
case _Notice() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String authorUid,  String authorName,  String? authorPhotoUrl,  String body,  String? authorWhatsappNumber,  String? authorEmail, @TimestampConverter()  DateTime createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Notice() when $default != null:
return $default(_that.id,_that.authorUid,_that.authorName,_that.authorPhotoUrl,_that.body,_that.authorWhatsappNumber,_that.authorEmail,_that.createdAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String authorUid,  String authorName,  String? authorPhotoUrl,  String body,  String? authorWhatsappNumber,  String? authorEmail, @TimestampConverter()  DateTime createdAt)  $default,) {final _that = this;
switch (_that) {
case _Notice():
return $default(_that.id,_that.authorUid,_that.authorName,_that.authorPhotoUrl,_that.body,_that.authorWhatsappNumber,_that.authorEmail,_that.createdAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String authorUid,  String authorName,  String? authorPhotoUrl,  String body,  String? authorWhatsappNumber,  String? authorEmail, @TimestampConverter()  DateTime createdAt)?  $default,) {final _that = this;
switch (_that) {
case _Notice() when $default != null:
return $default(_that.id,_that.authorUid,_that.authorName,_that.authorPhotoUrl,_that.body,_that.authorWhatsappNumber,_that.authorEmail,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Notice implements Notice {
  const _Notice({required this.id, required this.authorUid, required this.authorName, this.authorPhotoUrl, required this.body, this.authorWhatsappNumber, this.authorEmail, @TimestampConverter() required this.createdAt});
  factory _Notice.fromJson(Map<String, dynamic> json) => _$NoticeFromJson(json);

@override final  String id;
@override final  String authorUid;
@override final  String authorName;
@override final  String? authorPhotoUrl;
@override final  String body;
@override final  String? authorWhatsappNumber;
@override final  String? authorEmail;
@override@TimestampConverter() final  DateTime createdAt;

/// Create a copy of Notice
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$NoticeCopyWith<_Notice> get copyWith => __$NoticeCopyWithImpl<_Notice>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$NoticeToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Notice&&(identical(other.id, id) || other.id == id)&&(identical(other.authorUid, authorUid) || other.authorUid == authorUid)&&(identical(other.authorName, authorName) || other.authorName == authorName)&&(identical(other.authorPhotoUrl, authorPhotoUrl) || other.authorPhotoUrl == authorPhotoUrl)&&(identical(other.body, body) || other.body == body)&&(identical(other.authorWhatsappNumber, authorWhatsappNumber) || other.authorWhatsappNumber == authorWhatsappNumber)&&(identical(other.authorEmail, authorEmail) || other.authorEmail == authorEmail)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,authorUid,authorName,authorPhotoUrl,body,authorWhatsappNumber,authorEmail,createdAt);

@override
String toString() {
  return 'Notice(id: $id, authorUid: $authorUid, authorName: $authorName, authorPhotoUrl: $authorPhotoUrl, body: $body, authorWhatsappNumber: $authorWhatsappNumber, authorEmail: $authorEmail, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$NoticeCopyWith<$Res> implements $NoticeCopyWith<$Res> {
  factory _$NoticeCopyWith(_Notice value, $Res Function(_Notice) _then) = __$NoticeCopyWithImpl;
@override @useResult
$Res call({
 String id, String authorUid, String authorName, String? authorPhotoUrl, String body, String? authorWhatsappNumber, String? authorEmail,@TimestampConverter() DateTime createdAt
});




}
/// @nodoc
class __$NoticeCopyWithImpl<$Res>
    implements _$NoticeCopyWith<$Res> {
  __$NoticeCopyWithImpl(this._self, this._then);

  final _Notice _self;
  final $Res Function(_Notice) _then;

/// Create a copy of Notice
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? authorUid = null,Object? authorName = null,Object? authorPhotoUrl = freezed,Object? body = null,Object? authorWhatsappNumber = freezed,Object? authorEmail = freezed,Object? createdAt = null,}) {
  return _then(_Notice(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,authorUid: null == authorUid ? _self.authorUid : authorUid // ignore: cast_nullable_to_non_nullable
as String,authorName: null == authorName ? _self.authorName : authorName // ignore: cast_nullable_to_non_nullable
as String,authorPhotoUrl: freezed == authorPhotoUrl ? _self.authorPhotoUrl : authorPhotoUrl // ignore: cast_nullable_to_non_nullable
as String?,body: null == body ? _self.body : body // ignore: cast_nullable_to_non_nullable
as String,authorWhatsappNumber: freezed == authorWhatsappNumber ? _self.authorWhatsappNumber : authorWhatsappNumber // ignore: cast_nullable_to_non_nullable
as String?,authorEmail: freezed == authorEmail ? _self.authorEmail : authorEmail // ignore: cast_nullable_to_non_nullable
as String?,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}

// dart format on
