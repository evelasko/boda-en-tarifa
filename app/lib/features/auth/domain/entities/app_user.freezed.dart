// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'app_user.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AppUser {

 String get uid; String get email; String get fullName; String? get photoUrl; String? get whatsappNumber; String? get funFact; String get relationToGrooms; RelationshipStatus get relationshipStatus; GuestSide get side; bool get profileClaimed; bool get isDirectoryVisible;@TimestampConverter() DateTime get createdAt;@TimestampConverter() DateTime get updatedAt;
/// Create a copy of AppUser
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AppUserCopyWith<AppUser> get copyWith => _$AppUserCopyWithImpl<AppUser>(this as AppUser, _$identity);

  /// Serializes this AppUser to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AppUser&&(identical(other.uid, uid) || other.uid == uid)&&(identical(other.email, email) || other.email == email)&&(identical(other.fullName, fullName) || other.fullName == fullName)&&(identical(other.photoUrl, photoUrl) || other.photoUrl == photoUrl)&&(identical(other.whatsappNumber, whatsappNumber) || other.whatsappNumber == whatsappNumber)&&(identical(other.funFact, funFact) || other.funFact == funFact)&&(identical(other.relationToGrooms, relationToGrooms) || other.relationToGrooms == relationToGrooms)&&(identical(other.relationshipStatus, relationshipStatus) || other.relationshipStatus == relationshipStatus)&&(identical(other.side, side) || other.side == side)&&(identical(other.profileClaimed, profileClaimed) || other.profileClaimed == profileClaimed)&&(identical(other.isDirectoryVisible, isDirectoryVisible) || other.isDirectoryVisible == isDirectoryVisible)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,uid,email,fullName,photoUrl,whatsappNumber,funFact,relationToGrooms,relationshipStatus,side,profileClaimed,isDirectoryVisible,createdAt,updatedAt);

@override
String toString() {
  return 'AppUser(uid: $uid, email: $email, fullName: $fullName, photoUrl: $photoUrl, whatsappNumber: $whatsappNumber, funFact: $funFact, relationToGrooms: $relationToGrooms, relationshipStatus: $relationshipStatus, side: $side, profileClaimed: $profileClaimed, isDirectoryVisible: $isDirectoryVisible, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class $AppUserCopyWith<$Res>  {
  factory $AppUserCopyWith(AppUser value, $Res Function(AppUser) _then) = _$AppUserCopyWithImpl;
@useResult
$Res call({
 String uid, String email, String fullName, String? photoUrl, String? whatsappNumber, String? funFact, String relationToGrooms, RelationshipStatus relationshipStatus, GuestSide side, bool profileClaimed, bool isDirectoryVisible,@TimestampConverter() DateTime createdAt,@TimestampConverter() DateTime updatedAt
});




}
/// @nodoc
class _$AppUserCopyWithImpl<$Res>
    implements $AppUserCopyWith<$Res> {
  _$AppUserCopyWithImpl(this._self, this._then);

  final AppUser _self;
  final $Res Function(AppUser) _then;

/// Create a copy of AppUser
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? uid = null,Object? email = null,Object? fullName = null,Object? photoUrl = freezed,Object? whatsappNumber = freezed,Object? funFact = freezed,Object? relationToGrooms = null,Object? relationshipStatus = null,Object? side = null,Object? profileClaimed = null,Object? isDirectoryVisible = null,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_self.copyWith(
uid: null == uid ? _self.uid : uid // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,fullName: null == fullName ? _self.fullName : fullName // ignore: cast_nullable_to_non_nullable
as String,photoUrl: freezed == photoUrl ? _self.photoUrl : photoUrl // ignore: cast_nullable_to_non_nullable
as String?,whatsappNumber: freezed == whatsappNumber ? _self.whatsappNumber : whatsappNumber // ignore: cast_nullable_to_non_nullable
as String?,funFact: freezed == funFact ? _self.funFact : funFact // ignore: cast_nullable_to_non_nullable
as String?,relationToGrooms: null == relationToGrooms ? _self.relationToGrooms : relationToGrooms // ignore: cast_nullable_to_non_nullable
as String,relationshipStatus: null == relationshipStatus ? _self.relationshipStatus : relationshipStatus // ignore: cast_nullable_to_non_nullable
as RelationshipStatus,side: null == side ? _self.side : side // ignore: cast_nullable_to_non_nullable
as GuestSide,profileClaimed: null == profileClaimed ? _self.profileClaimed : profileClaimed // ignore: cast_nullable_to_non_nullable
as bool,isDirectoryVisible: null == isDirectoryVisible ? _self.isDirectoryVisible : isDirectoryVisible // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [AppUser].
extension AppUserPatterns on AppUser {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AppUser value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AppUser() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AppUser value)  $default,){
final _that = this;
switch (_that) {
case _AppUser():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AppUser value)?  $default,){
final _that = this;
switch (_that) {
case _AppUser() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String uid,  String email,  String fullName,  String? photoUrl,  String? whatsappNumber,  String? funFact,  String relationToGrooms,  RelationshipStatus relationshipStatus,  GuestSide side,  bool profileClaimed,  bool isDirectoryVisible, @TimestampConverter()  DateTime createdAt, @TimestampConverter()  DateTime updatedAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AppUser() when $default != null:
return $default(_that.uid,_that.email,_that.fullName,_that.photoUrl,_that.whatsappNumber,_that.funFact,_that.relationToGrooms,_that.relationshipStatus,_that.side,_that.profileClaimed,_that.isDirectoryVisible,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String uid,  String email,  String fullName,  String? photoUrl,  String? whatsappNumber,  String? funFact,  String relationToGrooms,  RelationshipStatus relationshipStatus,  GuestSide side,  bool profileClaimed,  bool isDirectoryVisible, @TimestampConverter()  DateTime createdAt, @TimestampConverter()  DateTime updatedAt)  $default,) {final _that = this;
switch (_that) {
case _AppUser():
return $default(_that.uid,_that.email,_that.fullName,_that.photoUrl,_that.whatsappNumber,_that.funFact,_that.relationToGrooms,_that.relationshipStatus,_that.side,_that.profileClaimed,_that.isDirectoryVisible,_that.createdAt,_that.updatedAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String uid,  String email,  String fullName,  String? photoUrl,  String? whatsappNumber,  String? funFact,  String relationToGrooms,  RelationshipStatus relationshipStatus,  GuestSide side,  bool profileClaimed,  bool isDirectoryVisible, @TimestampConverter()  DateTime createdAt, @TimestampConverter()  DateTime updatedAt)?  $default,) {final _that = this;
switch (_that) {
case _AppUser() when $default != null:
return $default(_that.uid,_that.email,_that.fullName,_that.photoUrl,_that.whatsappNumber,_that.funFact,_that.relationToGrooms,_that.relationshipStatus,_that.side,_that.profileClaimed,_that.isDirectoryVisible,_that.createdAt,_that.updatedAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AppUser implements AppUser {
  const _AppUser({required this.uid, required this.email, required this.fullName, this.photoUrl, this.whatsappNumber, this.funFact, required this.relationToGrooms, required this.relationshipStatus, required this.side, required this.profileClaimed, required this.isDirectoryVisible, @TimestampConverter() required this.createdAt, @TimestampConverter() required this.updatedAt});
  factory _AppUser.fromJson(Map<String, dynamic> json) => _$AppUserFromJson(json);

@override final  String uid;
@override final  String email;
@override final  String fullName;
@override final  String? photoUrl;
@override final  String? whatsappNumber;
@override final  String? funFact;
@override final  String relationToGrooms;
@override final  RelationshipStatus relationshipStatus;
@override final  GuestSide side;
@override final  bool profileClaimed;
@override final  bool isDirectoryVisible;
@override@TimestampConverter() final  DateTime createdAt;
@override@TimestampConverter() final  DateTime updatedAt;

/// Create a copy of AppUser
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AppUserCopyWith<_AppUser> get copyWith => __$AppUserCopyWithImpl<_AppUser>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AppUserToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AppUser&&(identical(other.uid, uid) || other.uid == uid)&&(identical(other.email, email) || other.email == email)&&(identical(other.fullName, fullName) || other.fullName == fullName)&&(identical(other.photoUrl, photoUrl) || other.photoUrl == photoUrl)&&(identical(other.whatsappNumber, whatsappNumber) || other.whatsappNumber == whatsappNumber)&&(identical(other.funFact, funFact) || other.funFact == funFact)&&(identical(other.relationToGrooms, relationToGrooms) || other.relationToGrooms == relationToGrooms)&&(identical(other.relationshipStatus, relationshipStatus) || other.relationshipStatus == relationshipStatus)&&(identical(other.side, side) || other.side == side)&&(identical(other.profileClaimed, profileClaimed) || other.profileClaimed == profileClaimed)&&(identical(other.isDirectoryVisible, isDirectoryVisible) || other.isDirectoryVisible == isDirectoryVisible)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,uid,email,fullName,photoUrl,whatsappNumber,funFact,relationToGrooms,relationshipStatus,side,profileClaimed,isDirectoryVisible,createdAt,updatedAt);

@override
String toString() {
  return 'AppUser(uid: $uid, email: $email, fullName: $fullName, photoUrl: $photoUrl, whatsappNumber: $whatsappNumber, funFact: $funFact, relationToGrooms: $relationToGrooms, relationshipStatus: $relationshipStatus, side: $side, profileClaimed: $profileClaimed, isDirectoryVisible: $isDirectoryVisible, createdAt: $createdAt, updatedAt: $updatedAt)';
}


}

/// @nodoc
abstract mixin class _$AppUserCopyWith<$Res> implements $AppUserCopyWith<$Res> {
  factory _$AppUserCopyWith(_AppUser value, $Res Function(_AppUser) _then) = __$AppUserCopyWithImpl;
@override @useResult
$Res call({
 String uid, String email, String fullName, String? photoUrl, String? whatsappNumber, String? funFact, String relationToGrooms, RelationshipStatus relationshipStatus, GuestSide side, bool profileClaimed, bool isDirectoryVisible,@TimestampConverter() DateTime createdAt,@TimestampConverter() DateTime updatedAt
});




}
/// @nodoc
class __$AppUserCopyWithImpl<$Res>
    implements _$AppUserCopyWith<$Res> {
  __$AppUserCopyWithImpl(this._self, this._then);

  final _AppUser _self;
  final $Res Function(_AppUser) _then;

/// Create a copy of AppUser
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? uid = null,Object? email = null,Object? fullName = null,Object? photoUrl = freezed,Object? whatsappNumber = freezed,Object? funFact = freezed,Object? relationToGrooms = null,Object? relationshipStatus = null,Object? side = null,Object? profileClaimed = null,Object? isDirectoryVisible = null,Object? createdAt = null,Object? updatedAt = null,}) {
  return _then(_AppUser(
uid: null == uid ? _self.uid : uid // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,fullName: null == fullName ? _self.fullName : fullName // ignore: cast_nullable_to_non_nullable
as String,photoUrl: freezed == photoUrl ? _self.photoUrl : photoUrl // ignore: cast_nullable_to_non_nullable
as String?,whatsappNumber: freezed == whatsappNumber ? _self.whatsappNumber : whatsappNumber // ignore: cast_nullable_to_non_nullable
as String?,funFact: freezed == funFact ? _self.funFact : funFact // ignore: cast_nullable_to_non_nullable
as String?,relationToGrooms: null == relationToGrooms ? _self.relationToGrooms : relationToGrooms // ignore: cast_nullable_to_non_nullable
as String,relationshipStatus: null == relationshipStatus ? _self.relationshipStatus : relationshipStatus // ignore: cast_nullable_to_non_nullable
as RelationshipStatus,side: null == side ? _self.side : side // ignore: cast_nullable_to_non_nullable
as GuestSide,profileClaimed: null == profileClaimed ? _self.profileClaimed : profileClaimed // ignore: cast_nullable_to_non_nullable
as bool,isDirectoryVisible: null == isDirectoryVisible ? _self.isDirectoryVisible : isDirectoryVisible // ignore: cast_nullable_to_non_nullable
as bool,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime,updatedAt: null == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}

// dart format on
