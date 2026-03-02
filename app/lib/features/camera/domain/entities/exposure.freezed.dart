// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'exposure.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Exposure {

 String get id; String get localPath; String? get cloudinaryPublicId; int get exposureNumber; DateTime get capturedAt; bool get isDeveloped; bool get isPublished;
/// Create a copy of Exposure
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ExposureCopyWith<Exposure> get copyWith => _$ExposureCopyWithImpl<Exposure>(this as Exposure, _$identity);

  /// Serializes this Exposure to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Exposure&&(identical(other.id, id) || other.id == id)&&(identical(other.localPath, localPath) || other.localPath == localPath)&&(identical(other.cloudinaryPublicId, cloudinaryPublicId) || other.cloudinaryPublicId == cloudinaryPublicId)&&(identical(other.exposureNumber, exposureNumber) || other.exposureNumber == exposureNumber)&&(identical(other.capturedAt, capturedAt) || other.capturedAt == capturedAt)&&(identical(other.isDeveloped, isDeveloped) || other.isDeveloped == isDeveloped)&&(identical(other.isPublished, isPublished) || other.isPublished == isPublished));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,localPath,cloudinaryPublicId,exposureNumber,capturedAt,isDeveloped,isPublished);

@override
String toString() {
  return 'Exposure(id: $id, localPath: $localPath, cloudinaryPublicId: $cloudinaryPublicId, exposureNumber: $exposureNumber, capturedAt: $capturedAt, isDeveloped: $isDeveloped, isPublished: $isPublished)';
}


}

/// @nodoc
abstract mixin class $ExposureCopyWith<$Res>  {
  factory $ExposureCopyWith(Exposure value, $Res Function(Exposure) _then) = _$ExposureCopyWithImpl;
@useResult
$Res call({
 String id, String localPath, String? cloudinaryPublicId, int exposureNumber, DateTime capturedAt, bool isDeveloped, bool isPublished
});




}
/// @nodoc
class _$ExposureCopyWithImpl<$Res>
    implements $ExposureCopyWith<$Res> {
  _$ExposureCopyWithImpl(this._self, this._then);

  final Exposure _self;
  final $Res Function(Exposure) _then;

/// Create a copy of Exposure
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? localPath = null,Object? cloudinaryPublicId = freezed,Object? exposureNumber = null,Object? capturedAt = null,Object? isDeveloped = null,Object? isPublished = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,localPath: null == localPath ? _self.localPath : localPath // ignore: cast_nullable_to_non_nullable
as String,cloudinaryPublicId: freezed == cloudinaryPublicId ? _self.cloudinaryPublicId : cloudinaryPublicId // ignore: cast_nullable_to_non_nullable
as String?,exposureNumber: null == exposureNumber ? _self.exposureNumber : exposureNumber // ignore: cast_nullable_to_non_nullable
as int,capturedAt: null == capturedAt ? _self.capturedAt : capturedAt // ignore: cast_nullable_to_non_nullable
as DateTime,isDeveloped: null == isDeveloped ? _self.isDeveloped : isDeveloped // ignore: cast_nullable_to_non_nullable
as bool,isPublished: null == isPublished ? _self.isPublished : isPublished // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [Exposure].
extension ExposurePatterns on Exposure {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Exposure value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Exposure() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Exposure value)  $default,){
final _that = this;
switch (_that) {
case _Exposure():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Exposure value)?  $default,){
final _that = this;
switch (_that) {
case _Exposure() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String localPath,  String? cloudinaryPublicId,  int exposureNumber,  DateTime capturedAt,  bool isDeveloped,  bool isPublished)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Exposure() when $default != null:
return $default(_that.id,_that.localPath,_that.cloudinaryPublicId,_that.exposureNumber,_that.capturedAt,_that.isDeveloped,_that.isPublished);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String localPath,  String? cloudinaryPublicId,  int exposureNumber,  DateTime capturedAt,  bool isDeveloped,  bool isPublished)  $default,) {final _that = this;
switch (_that) {
case _Exposure():
return $default(_that.id,_that.localPath,_that.cloudinaryPublicId,_that.exposureNumber,_that.capturedAt,_that.isDeveloped,_that.isPublished);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String localPath,  String? cloudinaryPublicId,  int exposureNumber,  DateTime capturedAt,  bool isDeveloped,  bool isPublished)?  $default,) {final _that = this;
switch (_that) {
case _Exposure() when $default != null:
return $default(_that.id,_that.localPath,_that.cloudinaryPublicId,_that.exposureNumber,_that.capturedAt,_that.isDeveloped,_that.isPublished);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Exposure implements Exposure {
  const _Exposure({required this.id, required this.localPath, this.cloudinaryPublicId, required this.exposureNumber, required this.capturedAt, this.isDeveloped = false, this.isPublished = false});
  factory _Exposure.fromJson(Map<String, dynamic> json) => _$ExposureFromJson(json);

@override final  String id;
@override final  String localPath;
@override final  String? cloudinaryPublicId;
@override final  int exposureNumber;
@override final  DateTime capturedAt;
@override@JsonKey() final  bool isDeveloped;
@override@JsonKey() final  bool isPublished;

/// Create a copy of Exposure
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ExposureCopyWith<_Exposure> get copyWith => __$ExposureCopyWithImpl<_Exposure>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ExposureToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Exposure&&(identical(other.id, id) || other.id == id)&&(identical(other.localPath, localPath) || other.localPath == localPath)&&(identical(other.cloudinaryPublicId, cloudinaryPublicId) || other.cloudinaryPublicId == cloudinaryPublicId)&&(identical(other.exposureNumber, exposureNumber) || other.exposureNumber == exposureNumber)&&(identical(other.capturedAt, capturedAt) || other.capturedAt == capturedAt)&&(identical(other.isDeveloped, isDeveloped) || other.isDeveloped == isDeveloped)&&(identical(other.isPublished, isPublished) || other.isPublished == isPublished));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,localPath,cloudinaryPublicId,exposureNumber,capturedAt,isDeveloped,isPublished);

@override
String toString() {
  return 'Exposure(id: $id, localPath: $localPath, cloudinaryPublicId: $cloudinaryPublicId, exposureNumber: $exposureNumber, capturedAt: $capturedAt, isDeveloped: $isDeveloped, isPublished: $isPublished)';
}


}

/// @nodoc
abstract mixin class _$ExposureCopyWith<$Res> implements $ExposureCopyWith<$Res> {
  factory _$ExposureCopyWith(_Exposure value, $Res Function(_Exposure) _then) = __$ExposureCopyWithImpl;
@override @useResult
$Res call({
 String id, String localPath, String? cloudinaryPublicId, int exposureNumber, DateTime capturedAt, bool isDeveloped, bool isPublished
});




}
/// @nodoc
class __$ExposureCopyWithImpl<$Res>
    implements _$ExposureCopyWith<$Res> {
  __$ExposureCopyWithImpl(this._self, this._then);

  final _Exposure _self;
  final $Res Function(_Exposure) _then;

/// Create a copy of Exposure
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? localPath = null,Object? cloudinaryPublicId = freezed,Object? exposureNumber = null,Object? capturedAt = null,Object? isDeveloped = null,Object? isPublished = null,}) {
  return _then(_Exposure(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,localPath: null == localPath ? _self.localPath : localPath // ignore: cast_nullable_to_non_nullable
as String,cloudinaryPublicId: freezed == cloudinaryPublicId ? _self.cloudinaryPublicId : cloudinaryPublicId // ignore: cast_nullable_to_non_nullable
as String?,exposureNumber: null == exposureNumber ? _self.exposureNumber : exposureNumber // ignore: cast_nullable_to_non_nullable
as int,capturedAt: null == capturedAt ? _self.capturedAt : capturedAt // ignore: cast_nullable_to_non_nullable
as DateTime,isDeveloped: null == isDeveloped ? _self.isDeveloped : isDeveloped // ignore: cast_nullable_to_non_nullable
as bool,isPublished: null == isPublished ? _self.isPublished : isPublished // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
