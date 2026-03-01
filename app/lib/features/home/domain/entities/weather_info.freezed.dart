// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'weather_info.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$WeatherInfo {

 double get temperatureCelsius; double get windSpeedKmh; double get windDirectionDegrees; WindType get windType; String get description; String get tip;
/// Create a copy of WeatherInfo
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$WeatherInfoCopyWith<WeatherInfo> get copyWith => _$WeatherInfoCopyWithImpl<WeatherInfo>(this as WeatherInfo, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is WeatherInfo&&(identical(other.temperatureCelsius, temperatureCelsius) || other.temperatureCelsius == temperatureCelsius)&&(identical(other.windSpeedKmh, windSpeedKmh) || other.windSpeedKmh == windSpeedKmh)&&(identical(other.windDirectionDegrees, windDirectionDegrees) || other.windDirectionDegrees == windDirectionDegrees)&&(identical(other.windType, windType) || other.windType == windType)&&(identical(other.description, description) || other.description == description)&&(identical(other.tip, tip) || other.tip == tip));
}


@override
int get hashCode => Object.hash(runtimeType,temperatureCelsius,windSpeedKmh,windDirectionDegrees,windType,description,tip);

@override
String toString() {
  return 'WeatherInfo(temperatureCelsius: $temperatureCelsius, windSpeedKmh: $windSpeedKmh, windDirectionDegrees: $windDirectionDegrees, windType: $windType, description: $description, tip: $tip)';
}


}

/// @nodoc
abstract mixin class $WeatherInfoCopyWith<$Res>  {
  factory $WeatherInfoCopyWith(WeatherInfo value, $Res Function(WeatherInfo) _then) = _$WeatherInfoCopyWithImpl;
@useResult
$Res call({
 double temperatureCelsius, double windSpeedKmh, double windDirectionDegrees, WindType windType, String description, String tip
});




}
/// @nodoc
class _$WeatherInfoCopyWithImpl<$Res>
    implements $WeatherInfoCopyWith<$Res> {
  _$WeatherInfoCopyWithImpl(this._self, this._then);

  final WeatherInfo _self;
  final $Res Function(WeatherInfo) _then;

/// Create a copy of WeatherInfo
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? temperatureCelsius = null,Object? windSpeedKmh = null,Object? windDirectionDegrees = null,Object? windType = null,Object? description = null,Object? tip = null,}) {
  return _then(_self.copyWith(
temperatureCelsius: null == temperatureCelsius ? _self.temperatureCelsius : temperatureCelsius // ignore: cast_nullable_to_non_nullable
as double,windSpeedKmh: null == windSpeedKmh ? _self.windSpeedKmh : windSpeedKmh // ignore: cast_nullable_to_non_nullable
as double,windDirectionDegrees: null == windDirectionDegrees ? _self.windDirectionDegrees : windDirectionDegrees // ignore: cast_nullable_to_non_nullable
as double,windType: null == windType ? _self.windType : windType // ignore: cast_nullable_to_non_nullable
as WindType,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,tip: null == tip ? _self.tip : tip // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [WeatherInfo].
extension WeatherInfoPatterns on WeatherInfo {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _WeatherInfo value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _WeatherInfo() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _WeatherInfo value)  $default,){
final _that = this;
switch (_that) {
case _WeatherInfo():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _WeatherInfo value)?  $default,){
final _that = this;
switch (_that) {
case _WeatherInfo() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( double temperatureCelsius,  double windSpeedKmh,  double windDirectionDegrees,  WindType windType,  String description,  String tip)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _WeatherInfo() when $default != null:
return $default(_that.temperatureCelsius,_that.windSpeedKmh,_that.windDirectionDegrees,_that.windType,_that.description,_that.tip);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( double temperatureCelsius,  double windSpeedKmh,  double windDirectionDegrees,  WindType windType,  String description,  String tip)  $default,) {final _that = this;
switch (_that) {
case _WeatherInfo():
return $default(_that.temperatureCelsius,_that.windSpeedKmh,_that.windDirectionDegrees,_that.windType,_that.description,_that.tip);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( double temperatureCelsius,  double windSpeedKmh,  double windDirectionDegrees,  WindType windType,  String description,  String tip)?  $default,) {final _that = this;
switch (_that) {
case _WeatherInfo() when $default != null:
return $default(_that.temperatureCelsius,_that.windSpeedKmh,_that.windDirectionDegrees,_that.windType,_that.description,_that.tip);case _:
  return null;

}
}

}

/// @nodoc


class _WeatherInfo implements WeatherInfo {
  const _WeatherInfo({required this.temperatureCelsius, required this.windSpeedKmh, required this.windDirectionDegrees, required this.windType, required this.description, required this.tip});
  

@override final  double temperatureCelsius;
@override final  double windSpeedKmh;
@override final  double windDirectionDegrees;
@override final  WindType windType;
@override final  String description;
@override final  String tip;

/// Create a copy of WeatherInfo
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$WeatherInfoCopyWith<_WeatherInfo> get copyWith => __$WeatherInfoCopyWithImpl<_WeatherInfo>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _WeatherInfo&&(identical(other.temperatureCelsius, temperatureCelsius) || other.temperatureCelsius == temperatureCelsius)&&(identical(other.windSpeedKmh, windSpeedKmh) || other.windSpeedKmh == windSpeedKmh)&&(identical(other.windDirectionDegrees, windDirectionDegrees) || other.windDirectionDegrees == windDirectionDegrees)&&(identical(other.windType, windType) || other.windType == windType)&&(identical(other.description, description) || other.description == description)&&(identical(other.tip, tip) || other.tip == tip));
}


@override
int get hashCode => Object.hash(runtimeType,temperatureCelsius,windSpeedKmh,windDirectionDegrees,windType,description,tip);

@override
String toString() {
  return 'WeatherInfo(temperatureCelsius: $temperatureCelsius, windSpeedKmh: $windSpeedKmh, windDirectionDegrees: $windDirectionDegrees, windType: $windType, description: $description, tip: $tip)';
}


}

/// @nodoc
abstract mixin class _$WeatherInfoCopyWith<$Res> implements $WeatherInfoCopyWith<$Res> {
  factory _$WeatherInfoCopyWith(_WeatherInfo value, $Res Function(_WeatherInfo) _then) = __$WeatherInfoCopyWithImpl;
@override @useResult
$Res call({
 double temperatureCelsius, double windSpeedKmh, double windDirectionDegrees, WindType windType, String description, String tip
});




}
/// @nodoc
class __$WeatherInfoCopyWithImpl<$Res>
    implements _$WeatherInfoCopyWith<$Res> {
  __$WeatherInfoCopyWithImpl(this._self, this._then);

  final _WeatherInfo _self;
  final $Res Function(_WeatherInfo) _then;

/// Create a copy of WeatherInfo
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? temperatureCelsius = null,Object? windSpeedKmh = null,Object? windDirectionDegrees = null,Object? windType = null,Object? description = null,Object? tip = null,}) {
  return _then(_WeatherInfo(
temperatureCelsius: null == temperatureCelsius ? _self.temperatureCelsius : temperatureCelsius // ignore: cast_nullable_to_non_nullable
as double,windSpeedKmh: null == windSpeedKmh ? _self.windSpeedKmh : windSpeedKmh // ignore: cast_nullable_to_non_nullable
as double,windDirectionDegrees: null == windDirectionDegrees ? _self.windDirectionDegrees : windDirectionDegrees // ignore: cast_nullable_to_non_nullable
as double,windType: null == windType ? _self.windType : windType // ignore: cast_nullable_to_non_nullable
as WindType,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,tip: null == tip ? _self.tip : tip // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
