// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'check_development_trigger.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;
/// @nodoc
mixin _$DevelopmentResult {





@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DevelopmentResult);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'DevelopmentResult()';
}


}

/// @nodoc
class $DevelopmentResultCopyWith<$Res>  {
$DevelopmentResultCopyWith(DevelopmentResult _, $Res Function(DevelopmentResult) __);
}


/// Adds pattern-matching-related methods to [DevelopmentResult].
extension DevelopmentResultPatterns on DevelopmentResult {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>({TResult Function( DevelopmentNotReady value)?  notReady,TResult Function( DevelopmentTriggered value)?  developed,required TResult orElse(),}){
final _that = this;
switch (_that) {
case DevelopmentNotReady() when notReady != null:
return notReady(_that);case DevelopmentTriggered() when developed != null:
return developed(_that);case _:
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

@optionalTypeArgs TResult map<TResult extends Object?>({required TResult Function( DevelopmentNotReady value)  notReady,required TResult Function( DevelopmentTriggered value)  developed,}){
final _that = this;
switch (_that) {
case DevelopmentNotReady():
return notReady(_that);case DevelopmentTriggered():
return developed(_that);}
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>({TResult? Function( DevelopmentNotReady value)?  notReady,TResult? Function( DevelopmentTriggered value)?  developed,}){
final _that = this;
switch (_that) {
case DevelopmentNotReady() when notReady != null:
return notReady(_that);case DevelopmentTriggered() when developed != null:
return developed(_that);case _:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>({TResult Function()?  notReady,TResult Function( List<String> exposureIds)?  developed,required TResult orElse(),}) {final _that = this;
switch (_that) {
case DevelopmentNotReady() when notReady != null:
return notReady();case DevelopmentTriggered() when developed != null:
return developed(_that.exposureIds);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>({required TResult Function()  notReady,required TResult Function( List<String> exposureIds)  developed,}) {final _that = this;
switch (_that) {
case DevelopmentNotReady():
return notReady();case DevelopmentTriggered():
return developed(_that.exposureIds);}
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>({TResult? Function()?  notReady,TResult? Function( List<String> exposureIds)?  developed,}) {final _that = this;
switch (_that) {
case DevelopmentNotReady() when notReady != null:
return notReady();case DevelopmentTriggered() when developed != null:
return developed(_that.exposureIds);case _:
  return null;

}
}

}

/// @nodoc


class DevelopmentNotReady implements DevelopmentResult {
  const DevelopmentNotReady();
  






@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DevelopmentNotReady);
}


@override
int get hashCode => runtimeType.hashCode;

@override
String toString() {
  return 'DevelopmentResult.notReady()';
}


}




/// @nodoc


class DevelopmentTriggered implements DevelopmentResult {
  const DevelopmentTriggered({required final  List<String> exposureIds}): _exposureIds = exposureIds;
  

 final  List<String> _exposureIds;
 List<String> get exposureIds {
  if (_exposureIds is EqualUnmodifiableListView) return _exposureIds;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_exposureIds);
}


/// Create a copy of DevelopmentResult
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DevelopmentTriggeredCopyWith<DevelopmentTriggered> get copyWith => _$DevelopmentTriggeredCopyWithImpl<DevelopmentTriggered>(this, _$identity);



@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is DevelopmentTriggered&&const DeepCollectionEquality().equals(other._exposureIds, _exposureIds));
}


@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_exposureIds));

@override
String toString() {
  return 'DevelopmentResult.developed(exposureIds: $exposureIds)';
}


}

/// @nodoc
abstract mixin class $DevelopmentTriggeredCopyWith<$Res> implements $DevelopmentResultCopyWith<$Res> {
  factory $DevelopmentTriggeredCopyWith(DevelopmentTriggered value, $Res Function(DevelopmentTriggered) _then) = _$DevelopmentTriggeredCopyWithImpl;
@useResult
$Res call({
 List<String> exposureIds
});




}
/// @nodoc
class _$DevelopmentTriggeredCopyWithImpl<$Res>
    implements $DevelopmentTriggeredCopyWith<$Res> {
  _$DevelopmentTriggeredCopyWithImpl(this._self, this._then);

  final DevelopmentTriggered _self;
  final $Res Function(DevelopmentTriggered) _then;

/// Create a copy of DevelopmentResult
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') $Res call({Object? exposureIds = null,}) {
  return _then(DevelopmentTriggered(
exposureIds: null == exposureIds ? _self._exposureIds : exposureIds // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}


}

// dart format on
