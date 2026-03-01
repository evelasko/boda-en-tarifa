// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'time_gated_content.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$TimeGatedContent {

 String get id; ContentType get contentType; String get title; DateTime get unlockAt; String? get eventId; String? get firestoreDocPath;
/// Create a copy of TimeGatedContent
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$TimeGatedContentCopyWith<TimeGatedContent> get copyWith => _$TimeGatedContentCopyWithImpl<TimeGatedContent>(this as TimeGatedContent, _$identity);

  /// Serializes this TimeGatedContent to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is TimeGatedContent&&(identical(other.id, id) || other.id == id)&&(identical(other.contentType, contentType) || other.contentType == contentType)&&(identical(other.title, title) || other.title == title)&&(identical(other.unlockAt, unlockAt) || other.unlockAt == unlockAt)&&(identical(other.eventId, eventId) || other.eventId == eventId)&&(identical(other.firestoreDocPath, firestoreDocPath) || other.firestoreDocPath == firestoreDocPath));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,contentType,title,unlockAt,eventId,firestoreDocPath);

@override
String toString() {
  return 'TimeGatedContent(id: $id, contentType: $contentType, title: $title, unlockAt: $unlockAt, eventId: $eventId, firestoreDocPath: $firestoreDocPath)';
}


}

/// @nodoc
abstract mixin class $TimeGatedContentCopyWith<$Res>  {
  factory $TimeGatedContentCopyWith(TimeGatedContent value, $Res Function(TimeGatedContent) _then) = _$TimeGatedContentCopyWithImpl;
@useResult
$Res call({
 String id, ContentType contentType, String title, DateTime unlockAt, String? eventId, String? firestoreDocPath
});




}
/// @nodoc
class _$TimeGatedContentCopyWithImpl<$Res>
    implements $TimeGatedContentCopyWith<$Res> {
  _$TimeGatedContentCopyWithImpl(this._self, this._then);

  final TimeGatedContent _self;
  final $Res Function(TimeGatedContent) _then;

/// Create a copy of TimeGatedContent
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? contentType = null,Object? title = null,Object? unlockAt = null,Object? eventId = freezed,Object? firestoreDocPath = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,contentType: null == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as ContentType,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,unlockAt: null == unlockAt ? _self.unlockAt : unlockAt // ignore: cast_nullable_to_non_nullable
as DateTime,eventId: freezed == eventId ? _self.eventId : eventId // ignore: cast_nullable_to_non_nullable
as String?,firestoreDocPath: freezed == firestoreDocPath ? _self.firestoreDocPath : firestoreDocPath // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [TimeGatedContent].
extension TimeGatedContentPatterns on TimeGatedContent {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _TimeGatedContent value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _TimeGatedContent() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _TimeGatedContent value)  $default,){
final _that = this;
switch (_that) {
case _TimeGatedContent():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _TimeGatedContent value)?  $default,){
final _that = this;
switch (_that) {
case _TimeGatedContent() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  ContentType contentType,  String title,  DateTime unlockAt,  String? eventId,  String? firestoreDocPath)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _TimeGatedContent() when $default != null:
return $default(_that.id,_that.contentType,_that.title,_that.unlockAt,_that.eventId,_that.firestoreDocPath);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  ContentType contentType,  String title,  DateTime unlockAt,  String? eventId,  String? firestoreDocPath)  $default,) {final _that = this;
switch (_that) {
case _TimeGatedContent():
return $default(_that.id,_that.contentType,_that.title,_that.unlockAt,_that.eventId,_that.firestoreDocPath);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  ContentType contentType,  String title,  DateTime unlockAt,  String? eventId,  String? firestoreDocPath)?  $default,) {final _that = this;
switch (_that) {
case _TimeGatedContent() when $default != null:
return $default(_that.id,_that.contentType,_that.title,_that.unlockAt,_that.eventId,_that.firestoreDocPath);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _TimeGatedContent implements TimeGatedContent {
  const _TimeGatedContent({required this.id, required this.contentType, required this.title, required this.unlockAt, this.eventId, this.firestoreDocPath});
  factory _TimeGatedContent.fromJson(Map<String, dynamic> json) => _$TimeGatedContentFromJson(json);

@override final  String id;
@override final  ContentType contentType;
@override final  String title;
@override final  DateTime unlockAt;
@override final  String? eventId;
@override final  String? firestoreDocPath;

/// Create a copy of TimeGatedContent
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$TimeGatedContentCopyWith<_TimeGatedContent> get copyWith => __$TimeGatedContentCopyWithImpl<_TimeGatedContent>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$TimeGatedContentToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _TimeGatedContent&&(identical(other.id, id) || other.id == id)&&(identical(other.contentType, contentType) || other.contentType == contentType)&&(identical(other.title, title) || other.title == title)&&(identical(other.unlockAt, unlockAt) || other.unlockAt == unlockAt)&&(identical(other.eventId, eventId) || other.eventId == eventId)&&(identical(other.firestoreDocPath, firestoreDocPath) || other.firestoreDocPath == firestoreDocPath));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,contentType,title,unlockAt,eventId,firestoreDocPath);

@override
String toString() {
  return 'TimeGatedContent(id: $id, contentType: $contentType, title: $title, unlockAt: $unlockAt, eventId: $eventId, firestoreDocPath: $firestoreDocPath)';
}


}

/// @nodoc
abstract mixin class _$TimeGatedContentCopyWith<$Res> implements $TimeGatedContentCopyWith<$Res> {
  factory _$TimeGatedContentCopyWith(_TimeGatedContent value, $Res Function(_TimeGatedContent) _then) = __$TimeGatedContentCopyWithImpl;
@override @useResult
$Res call({
 String id, ContentType contentType, String title, DateTime unlockAt, String? eventId, String? firestoreDocPath
});




}
/// @nodoc
class __$TimeGatedContentCopyWithImpl<$Res>
    implements _$TimeGatedContentCopyWith<$Res> {
  __$TimeGatedContentCopyWithImpl(this._self, this._then);

  final _TimeGatedContent _self;
  final $Res Function(_TimeGatedContent) _then;

/// Create a copy of TimeGatedContent
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? contentType = null,Object? title = null,Object? unlockAt = null,Object? eventId = freezed,Object? firestoreDocPath = freezed,}) {
  return _then(_TimeGatedContent(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,contentType: null == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as ContentType,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,unlockAt: null == unlockAt ? _self.unlockAt : unlockAt // ignore: cast_nullable_to_non_nullable
as DateTime,eventId: freezed == eventId ? _self.eventId : eventId // ignore: cast_nullable_to_non_nullable
as String?,firestoreDocPath: freezed == firestoreDocPath ? _self.firestoreDocPath : firestoreDocPath // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
