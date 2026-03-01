// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'guest_profile.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$GuestProfile {

 String get uid; String get fullName; String? get photoUrl; GuestSide get side; String get relationToGrooms; RelationshipStatus get relationshipStatus; String? get whatsappNumber; String? get funFact;
/// Create a copy of GuestProfile
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$GuestProfileCopyWith<GuestProfile> get copyWith => _$GuestProfileCopyWithImpl<GuestProfile>(this as GuestProfile, _$identity);

  /// Serializes this GuestProfile to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is GuestProfile&&(identical(other.uid, uid) || other.uid == uid)&&(identical(other.fullName, fullName) || other.fullName == fullName)&&(identical(other.photoUrl, photoUrl) || other.photoUrl == photoUrl)&&(identical(other.side, side) || other.side == side)&&(identical(other.relationToGrooms, relationToGrooms) || other.relationToGrooms == relationToGrooms)&&(identical(other.relationshipStatus, relationshipStatus) || other.relationshipStatus == relationshipStatus)&&(identical(other.whatsappNumber, whatsappNumber) || other.whatsappNumber == whatsappNumber)&&(identical(other.funFact, funFact) || other.funFact == funFact));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,uid,fullName,photoUrl,side,relationToGrooms,relationshipStatus,whatsappNumber,funFact);

@override
String toString() {
  return 'GuestProfile(uid: $uid, fullName: $fullName, photoUrl: $photoUrl, side: $side, relationToGrooms: $relationToGrooms, relationshipStatus: $relationshipStatus, whatsappNumber: $whatsappNumber, funFact: $funFact)';
}


}

/// @nodoc
abstract mixin class $GuestProfileCopyWith<$Res>  {
  factory $GuestProfileCopyWith(GuestProfile value, $Res Function(GuestProfile) _then) = _$GuestProfileCopyWithImpl;
@useResult
$Res call({
 String uid, String fullName, String? photoUrl, GuestSide side, String relationToGrooms, RelationshipStatus relationshipStatus, String? whatsappNumber, String? funFact
});




}
/// @nodoc
class _$GuestProfileCopyWithImpl<$Res>
    implements $GuestProfileCopyWith<$Res> {
  _$GuestProfileCopyWithImpl(this._self, this._then);

  final GuestProfile _self;
  final $Res Function(GuestProfile) _then;

/// Create a copy of GuestProfile
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? uid = null,Object? fullName = null,Object? photoUrl = freezed,Object? side = null,Object? relationToGrooms = null,Object? relationshipStatus = null,Object? whatsappNumber = freezed,Object? funFact = freezed,}) {
  return _then(_self.copyWith(
uid: null == uid ? _self.uid : uid // ignore: cast_nullable_to_non_nullable
as String,fullName: null == fullName ? _self.fullName : fullName // ignore: cast_nullable_to_non_nullable
as String,photoUrl: freezed == photoUrl ? _self.photoUrl : photoUrl // ignore: cast_nullable_to_non_nullable
as String?,side: null == side ? _self.side : side // ignore: cast_nullable_to_non_nullable
as GuestSide,relationToGrooms: null == relationToGrooms ? _self.relationToGrooms : relationToGrooms // ignore: cast_nullable_to_non_nullable
as String,relationshipStatus: null == relationshipStatus ? _self.relationshipStatus : relationshipStatus // ignore: cast_nullable_to_non_nullable
as RelationshipStatus,whatsappNumber: freezed == whatsappNumber ? _self.whatsappNumber : whatsappNumber // ignore: cast_nullable_to_non_nullable
as String?,funFact: freezed == funFact ? _self.funFact : funFact // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [GuestProfile].
extension GuestProfilePatterns on GuestProfile {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _GuestProfile value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _GuestProfile() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _GuestProfile value)  $default,){
final _that = this;
switch (_that) {
case _GuestProfile():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _GuestProfile value)?  $default,){
final _that = this;
switch (_that) {
case _GuestProfile() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String uid,  String fullName,  String? photoUrl,  GuestSide side,  String relationToGrooms,  RelationshipStatus relationshipStatus,  String? whatsappNumber,  String? funFact)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _GuestProfile() when $default != null:
return $default(_that.uid,_that.fullName,_that.photoUrl,_that.side,_that.relationToGrooms,_that.relationshipStatus,_that.whatsappNumber,_that.funFact);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String uid,  String fullName,  String? photoUrl,  GuestSide side,  String relationToGrooms,  RelationshipStatus relationshipStatus,  String? whatsappNumber,  String? funFact)  $default,) {final _that = this;
switch (_that) {
case _GuestProfile():
return $default(_that.uid,_that.fullName,_that.photoUrl,_that.side,_that.relationToGrooms,_that.relationshipStatus,_that.whatsappNumber,_that.funFact);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String uid,  String fullName,  String? photoUrl,  GuestSide side,  String relationToGrooms,  RelationshipStatus relationshipStatus,  String? whatsappNumber,  String? funFact)?  $default,) {final _that = this;
switch (_that) {
case _GuestProfile() when $default != null:
return $default(_that.uid,_that.fullName,_that.photoUrl,_that.side,_that.relationToGrooms,_that.relationshipStatus,_that.whatsappNumber,_that.funFact);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _GuestProfile implements GuestProfile {
  const _GuestProfile({required this.uid, required this.fullName, this.photoUrl, required this.side, required this.relationToGrooms, required this.relationshipStatus, this.whatsappNumber, this.funFact});
  factory _GuestProfile.fromJson(Map<String, dynamic> json) => _$GuestProfileFromJson(json);

@override final  String uid;
@override final  String fullName;
@override final  String? photoUrl;
@override final  GuestSide side;
@override final  String relationToGrooms;
@override final  RelationshipStatus relationshipStatus;
@override final  String? whatsappNumber;
@override final  String? funFact;

/// Create a copy of GuestProfile
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$GuestProfileCopyWith<_GuestProfile> get copyWith => __$GuestProfileCopyWithImpl<_GuestProfile>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$GuestProfileToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _GuestProfile&&(identical(other.uid, uid) || other.uid == uid)&&(identical(other.fullName, fullName) || other.fullName == fullName)&&(identical(other.photoUrl, photoUrl) || other.photoUrl == photoUrl)&&(identical(other.side, side) || other.side == side)&&(identical(other.relationToGrooms, relationToGrooms) || other.relationToGrooms == relationToGrooms)&&(identical(other.relationshipStatus, relationshipStatus) || other.relationshipStatus == relationshipStatus)&&(identical(other.whatsappNumber, whatsappNumber) || other.whatsappNumber == whatsappNumber)&&(identical(other.funFact, funFact) || other.funFact == funFact));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,uid,fullName,photoUrl,side,relationToGrooms,relationshipStatus,whatsappNumber,funFact);

@override
String toString() {
  return 'GuestProfile(uid: $uid, fullName: $fullName, photoUrl: $photoUrl, side: $side, relationToGrooms: $relationToGrooms, relationshipStatus: $relationshipStatus, whatsappNumber: $whatsappNumber, funFact: $funFact)';
}


}

/// @nodoc
abstract mixin class _$GuestProfileCopyWith<$Res> implements $GuestProfileCopyWith<$Res> {
  factory _$GuestProfileCopyWith(_GuestProfile value, $Res Function(_GuestProfile) _then) = __$GuestProfileCopyWithImpl;
@override @useResult
$Res call({
 String uid, String fullName, String? photoUrl, GuestSide side, String relationToGrooms, RelationshipStatus relationshipStatus, String? whatsappNumber, String? funFact
});




}
/// @nodoc
class __$GuestProfileCopyWithImpl<$Res>
    implements _$GuestProfileCopyWith<$Res> {
  __$GuestProfileCopyWithImpl(this._self, this._then);

  final _GuestProfile _self;
  final $Res Function(_GuestProfile) _then;

/// Create a copy of GuestProfile
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? uid = null,Object? fullName = null,Object? photoUrl = freezed,Object? side = null,Object? relationToGrooms = null,Object? relationshipStatus = null,Object? whatsappNumber = freezed,Object? funFact = freezed,}) {
  return _then(_GuestProfile(
uid: null == uid ? _self.uid : uid // ignore: cast_nullable_to_non_nullable
as String,fullName: null == fullName ? _self.fullName : fullName // ignore: cast_nullable_to_non_nullable
as String,photoUrl: freezed == photoUrl ? _self.photoUrl : photoUrl // ignore: cast_nullable_to_non_nullable
as String?,side: null == side ? _self.side : side // ignore: cast_nullable_to_non_nullable
as GuestSide,relationToGrooms: null == relationToGrooms ? _self.relationToGrooms : relationToGrooms // ignore: cast_nullable_to_non_nullable
as String,relationshipStatus: null == relationshipStatus ? _self.relationshipStatus : relationshipStatus // ignore: cast_nullable_to_non_nullable
as RelationshipStatus,whatsappNumber: freezed == whatsappNumber ? _self.whatsappNumber : whatsappNumber // ignore: cast_nullable_to_non_nullable
as String?,funFact: freezed == funFact ? _self.funFact : funFact // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
