// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'event_schedule.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$EventSchedule {

 String get id; String get title; String get description; DateTime get startTime; DateTime get endTime; String get venueId; String? get ctaLabel; String? get ctaDeepLink; int get dayNumber;
/// Create a copy of EventSchedule
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EventScheduleCopyWith<EventSchedule> get copyWith => _$EventScheduleCopyWithImpl<EventSchedule>(this as EventSchedule, _$identity);

  /// Serializes this EventSchedule to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EventSchedule&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.startTime, startTime) || other.startTime == startTime)&&(identical(other.endTime, endTime) || other.endTime == endTime)&&(identical(other.venueId, venueId) || other.venueId == venueId)&&(identical(other.ctaLabel, ctaLabel) || other.ctaLabel == ctaLabel)&&(identical(other.ctaDeepLink, ctaDeepLink) || other.ctaDeepLink == ctaDeepLink)&&(identical(other.dayNumber, dayNumber) || other.dayNumber == dayNumber));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,description,startTime,endTime,venueId,ctaLabel,ctaDeepLink,dayNumber);

@override
String toString() {
  return 'EventSchedule(id: $id, title: $title, description: $description, startTime: $startTime, endTime: $endTime, venueId: $venueId, ctaLabel: $ctaLabel, ctaDeepLink: $ctaDeepLink, dayNumber: $dayNumber)';
}


}

/// @nodoc
abstract mixin class $EventScheduleCopyWith<$Res>  {
  factory $EventScheduleCopyWith(EventSchedule value, $Res Function(EventSchedule) _then) = _$EventScheduleCopyWithImpl;
@useResult
$Res call({
 String id, String title, String description, DateTime startTime, DateTime endTime, String venueId, String? ctaLabel, String? ctaDeepLink, int dayNumber
});




}
/// @nodoc
class _$EventScheduleCopyWithImpl<$Res>
    implements $EventScheduleCopyWith<$Res> {
  _$EventScheduleCopyWithImpl(this._self, this._then);

  final EventSchedule _self;
  final $Res Function(EventSchedule) _then;

/// Create a copy of EventSchedule
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = null,Object? description = null,Object? startTime = null,Object? endTime = null,Object? venueId = null,Object? ctaLabel = freezed,Object? ctaDeepLink = freezed,Object? dayNumber = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,startTime: null == startTime ? _self.startTime : startTime // ignore: cast_nullable_to_non_nullable
as DateTime,endTime: null == endTime ? _self.endTime : endTime // ignore: cast_nullable_to_non_nullable
as DateTime,venueId: null == venueId ? _self.venueId : venueId // ignore: cast_nullable_to_non_nullable
as String,ctaLabel: freezed == ctaLabel ? _self.ctaLabel : ctaLabel // ignore: cast_nullable_to_non_nullable
as String?,ctaDeepLink: freezed == ctaDeepLink ? _self.ctaDeepLink : ctaDeepLink // ignore: cast_nullable_to_non_nullable
as String?,dayNumber: null == dayNumber ? _self.dayNumber : dayNumber // ignore: cast_nullable_to_non_nullable
as int,
  ));
}

}


/// Adds pattern-matching-related methods to [EventSchedule].
extension EventSchedulePatterns on EventSchedule {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _EventSchedule value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _EventSchedule() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _EventSchedule value)  $default,){
final _that = this;
switch (_that) {
case _EventSchedule():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _EventSchedule value)?  $default,){
final _that = this;
switch (_that) {
case _EventSchedule() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String title,  String description,  DateTime startTime,  DateTime endTime,  String venueId,  String? ctaLabel,  String? ctaDeepLink,  int dayNumber)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _EventSchedule() when $default != null:
return $default(_that.id,_that.title,_that.description,_that.startTime,_that.endTime,_that.venueId,_that.ctaLabel,_that.ctaDeepLink,_that.dayNumber);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String title,  String description,  DateTime startTime,  DateTime endTime,  String venueId,  String? ctaLabel,  String? ctaDeepLink,  int dayNumber)  $default,) {final _that = this;
switch (_that) {
case _EventSchedule():
return $default(_that.id,_that.title,_that.description,_that.startTime,_that.endTime,_that.venueId,_that.ctaLabel,_that.ctaDeepLink,_that.dayNumber);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String title,  String description,  DateTime startTime,  DateTime endTime,  String venueId,  String? ctaLabel,  String? ctaDeepLink,  int dayNumber)?  $default,) {final _that = this;
switch (_that) {
case _EventSchedule() when $default != null:
return $default(_that.id,_that.title,_that.description,_that.startTime,_that.endTime,_that.venueId,_that.ctaLabel,_that.ctaDeepLink,_that.dayNumber);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _EventSchedule implements EventSchedule {
  const _EventSchedule({required this.id, required this.title, required this.description, required this.startTime, required this.endTime, required this.venueId, this.ctaLabel, this.ctaDeepLink, required this.dayNumber});
  factory _EventSchedule.fromJson(Map<String, dynamic> json) => _$EventScheduleFromJson(json);

@override final  String id;
@override final  String title;
@override final  String description;
@override final  DateTime startTime;
@override final  DateTime endTime;
@override final  String venueId;
@override final  String? ctaLabel;
@override final  String? ctaDeepLink;
@override final  int dayNumber;

/// Create a copy of EventSchedule
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EventScheduleCopyWith<_EventSchedule> get copyWith => __$EventScheduleCopyWithImpl<_EventSchedule>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EventScheduleToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _EventSchedule&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.description, description) || other.description == description)&&(identical(other.startTime, startTime) || other.startTime == startTime)&&(identical(other.endTime, endTime) || other.endTime == endTime)&&(identical(other.venueId, venueId) || other.venueId == venueId)&&(identical(other.ctaLabel, ctaLabel) || other.ctaLabel == ctaLabel)&&(identical(other.ctaDeepLink, ctaDeepLink) || other.ctaDeepLink == ctaDeepLink)&&(identical(other.dayNumber, dayNumber) || other.dayNumber == dayNumber));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,title,description,startTime,endTime,venueId,ctaLabel,ctaDeepLink,dayNumber);

@override
String toString() {
  return 'EventSchedule(id: $id, title: $title, description: $description, startTime: $startTime, endTime: $endTime, venueId: $venueId, ctaLabel: $ctaLabel, ctaDeepLink: $ctaDeepLink, dayNumber: $dayNumber)';
}


}

/// @nodoc
abstract mixin class _$EventScheduleCopyWith<$Res> implements $EventScheduleCopyWith<$Res> {
  factory _$EventScheduleCopyWith(_EventSchedule value, $Res Function(_EventSchedule) _then) = __$EventScheduleCopyWithImpl;
@override @useResult
$Res call({
 String id, String title, String description, DateTime startTime, DateTime endTime, String venueId, String? ctaLabel, String? ctaDeepLink, int dayNumber
});




}
/// @nodoc
class __$EventScheduleCopyWithImpl<$Res>
    implements _$EventScheduleCopyWith<$Res> {
  __$EventScheduleCopyWithImpl(this._self, this._then);

  final _EventSchedule _self;
  final $Res Function(_EventSchedule) _then;

/// Create a copy of EventSchedule
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = null,Object? description = null,Object? startTime = null,Object? endTime = null,Object? venueId = null,Object? ctaLabel = freezed,Object? ctaDeepLink = freezed,Object? dayNumber = null,}) {
  return _then(_EventSchedule(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,startTime: null == startTime ? _self.startTime : startTime // ignore: cast_nullable_to_non_nullable
as DateTime,endTime: null == endTime ? _self.endTime : endTime // ignore: cast_nullable_to_non_nullable
as DateTime,venueId: null == venueId ? _self.venueId : venueId // ignore: cast_nullable_to_non_nullable
as String,ctaLabel: freezed == ctaLabel ? _self.ctaLabel : ctaLabel // ignore: cast_nullable_to_non_nullable
as String?,ctaDeepLink: freezed == ctaDeepLink ? _self.ctaDeepLink : ctaDeepLink // ignore: cast_nullable_to_non_nullable
as String?,dayNumber: null == dayNumber ? _self.dayNumber : dayNumber // ignore: cast_nullable_to_non_nullable
as int,
  ));
}


}

// dart format on
