// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'seating_assignment.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SeatingAssignment {

 String get guestId; String get guestName; String get tableName; int get seatNumber;
/// Create a copy of SeatingAssignment
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SeatingAssignmentCopyWith<SeatingAssignment> get copyWith => _$SeatingAssignmentCopyWithImpl<SeatingAssignment>(this as SeatingAssignment, _$identity);

  /// Serializes this SeatingAssignment to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SeatingAssignment&&(identical(other.guestId, guestId) || other.guestId == guestId)&&(identical(other.guestName, guestName) || other.guestName == guestName)&&(identical(other.tableName, tableName) || other.tableName == tableName)&&(identical(other.seatNumber, seatNumber) || other.seatNumber == seatNumber));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,guestId,guestName,tableName,seatNumber);

@override
String toString() {
  return 'SeatingAssignment(guestId: $guestId, guestName: $guestName, tableName: $tableName, seatNumber: $seatNumber)';
}


}

/// @nodoc
abstract mixin class $SeatingAssignmentCopyWith<$Res>  {
  factory $SeatingAssignmentCopyWith(SeatingAssignment value, $Res Function(SeatingAssignment) _then) = _$SeatingAssignmentCopyWithImpl;
@useResult
$Res call({
 String guestId, String guestName, String tableName, int seatNumber
});




}
/// @nodoc
class _$SeatingAssignmentCopyWithImpl<$Res>
    implements $SeatingAssignmentCopyWith<$Res> {
  _$SeatingAssignmentCopyWithImpl(this._self, this._then);

  final SeatingAssignment _self;
  final $Res Function(SeatingAssignment) _then;

/// Create a copy of SeatingAssignment
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? guestId = null,Object? guestName = null,Object? tableName = null,Object? seatNumber = null,}) {
  return _then(_self.copyWith(
guestId: null == guestId ? _self.guestId : guestId // ignore: cast_nullable_to_non_nullable
as String,guestName: null == guestName ? _self.guestName : guestName // ignore: cast_nullable_to_non_nullable
as String,tableName: null == tableName ? _self.tableName : tableName // ignore: cast_nullable_to_non_nullable
as String,seatNumber: null == seatNumber ? _self.seatNumber : seatNumber // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [SeatingAssignment].
extension SeatingAssignmentPatterns on SeatingAssignment {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SeatingAssignment value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SeatingAssignment() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SeatingAssignment value)  $default,){
final _that = this;
switch (_that) {
case _SeatingAssignment():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SeatingAssignment value)?  $default,){
final _that = this;
switch (_that) {
case _SeatingAssignment() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String guestId,  String guestName,  String tableName,  int seatNumber)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SeatingAssignment() when $default != null:
return $default(_that.guestId,_that.guestName,_that.tableName,_that.seatNumber);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String guestId,  String guestName,  String tableName,  int seatNumber)  $default,) {final _that = this;
switch (_that) {
case _SeatingAssignment():
return $default(_that.guestId,_that.guestName,_that.tableName,_that.seatNumber);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String guestId,  String guestName,  String tableName,  int seatNumber)?  $default,) {final _that = this;
switch (_that) {
case _SeatingAssignment() when $default != null:
return $default(_that.guestId,_that.guestName,_that.tableName,_that.seatNumber);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SeatingAssignment implements SeatingAssignment {
  const _SeatingAssignment({required this.guestId, required this.guestName, required this.tableName, required this.seatNumber});
  factory _SeatingAssignment.fromJson(Map<String, dynamic> json) => _$SeatingAssignmentFromJson(json);

@override final  String guestId;
@override final  String guestName;
@override final  String tableName;
@override final  int seatNumber;

/// Create a copy of SeatingAssignment
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SeatingAssignmentCopyWith<_SeatingAssignment> get copyWith => __$SeatingAssignmentCopyWithImpl<_SeatingAssignment>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SeatingAssignmentToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SeatingAssignment&&(identical(other.guestId, guestId) || other.guestId == guestId)&&(identical(other.guestName, guestName) || other.guestName == guestName)&&(identical(other.tableName, tableName) || other.tableName == tableName)&&(identical(other.seatNumber, seatNumber) || other.seatNumber == seatNumber));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,guestId,guestName,tableName,seatNumber);

@override
String toString() {
  return 'SeatingAssignment(guestId: $guestId, guestName: $guestName, tableName: $tableName, seatNumber: $seatNumber)';
}


}

/// @nodoc
abstract mixin class _$SeatingAssignmentCopyWith<$Res> implements $SeatingAssignmentCopyWith<$Res> {
  factory _$SeatingAssignmentCopyWith(_SeatingAssignment value, $Res Function(_SeatingAssignment) _then) = __$SeatingAssignmentCopyWithImpl;
@override @useResult
$Res call({
 String guestId, String guestName, String tableName, int seatNumber
});




}
/// @nodoc
class __$SeatingAssignmentCopyWithImpl<$Res>
    implements _$SeatingAssignmentCopyWith<$Res> {
  __$SeatingAssignmentCopyWithImpl(this._self, this._then);

  final _SeatingAssignment _self;
  final $Res Function(_SeatingAssignment) _then;

/// Create a copy of SeatingAssignment
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? guestId = null,Object? guestName = null,Object? tableName = null,Object? seatNumber = null,}) {
  return _then(_SeatingAssignment(
guestId: null == guestId ? _self.guestId : guestId // ignore: cast_nullable_to_non_nullable
as String,guestName: null == guestName ? _self.guestName : guestName // ignore: cast_nullable_to_non_nullable
as String,tableName: null == tableName ? _self.tableName : tableName // ignore: cast_nullable_to_non_nullable
as String,seatNumber: null == seatNumber ? _self.seatNumber : seatNumber // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
