// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'quick_contacts.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$ContactEntry {

 String get name; String get phone; String? get whatsappUrl; String? get role;
/// Create a copy of ContactEntry
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ContactEntryCopyWith<ContactEntry> get copyWith => _$ContactEntryCopyWithImpl<ContactEntry>(this as ContactEntry, _$identity);

  /// Serializes this ContactEntry to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is ContactEntry&&(identical(other.name, name) || other.name == name)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.whatsappUrl, whatsappUrl) || other.whatsappUrl == whatsappUrl)&&(identical(other.role, role) || other.role == role));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,phone,whatsappUrl,role);

@override
String toString() {
  return 'ContactEntry(name: $name, phone: $phone, whatsappUrl: $whatsappUrl, role: $role)';
}


}

/// @nodoc
abstract mixin class $ContactEntryCopyWith<$Res>  {
  factory $ContactEntryCopyWith(ContactEntry value, $Res Function(ContactEntry) _then) = _$ContactEntryCopyWithImpl;
@useResult
$Res call({
 String name, String phone, String? whatsappUrl, String? role
});




}
/// @nodoc
class _$ContactEntryCopyWithImpl<$Res>
    implements $ContactEntryCopyWith<$Res> {
  _$ContactEntryCopyWithImpl(this._self, this._then);

  final ContactEntry _self;
  final $Res Function(ContactEntry) _then;

/// Create a copy of ContactEntry
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? name = null,Object? phone = null,Object? whatsappUrl = freezed,Object? role = freezed,}) {
  return _then(_self.copyWith(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,whatsappUrl: freezed == whatsappUrl ? _self.whatsappUrl : whatsappUrl // ignore: cast_nullable_to_non_nullable
as String?,role: freezed == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [ContactEntry].
extension ContactEntryPatterns on ContactEntry {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _ContactEntry value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _ContactEntry() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _ContactEntry value)  $default,){
final _that = this;
switch (_that) {
case _ContactEntry():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _ContactEntry value)?  $default,){
final _that = this;
switch (_that) {
case _ContactEntry() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String name,  String phone,  String? whatsappUrl,  String? role)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _ContactEntry() when $default != null:
return $default(_that.name,_that.phone,_that.whatsappUrl,_that.role);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String name,  String phone,  String? whatsappUrl,  String? role)  $default,) {final _that = this;
switch (_that) {
case _ContactEntry():
return $default(_that.name,_that.phone,_that.whatsappUrl,_that.role);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String name,  String phone,  String? whatsappUrl,  String? role)?  $default,) {final _that = this;
switch (_that) {
case _ContactEntry() when $default != null:
return $default(_that.name,_that.phone,_that.whatsappUrl,_that.role);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _ContactEntry implements ContactEntry {
  const _ContactEntry({required this.name, required this.phone, this.whatsappUrl, this.role});
  factory _ContactEntry.fromJson(Map<String, dynamic> json) => _$ContactEntryFromJson(json);

@override final  String name;
@override final  String phone;
@override final  String? whatsappUrl;
@override final  String? role;

/// Create a copy of ContactEntry
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ContactEntryCopyWith<_ContactEntry> get copyWith => __$ContactEntryCopyWithImpl<_ContactEntry>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ContactEntryToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _ContactEntry&&(identical(other.name, name) || other.name == name)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.whatsappUrl, whatsappUrl) || other.whatsappUrl == whatsappUrl)&&(identical(other.role, role) || other.role == role));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,phone,whatsappUrl,role);

@override
String toString() {
  return 'ContactEntry(name: $name, phone: $phone, whatsappUrl: $whatsappUrl, role: $role)';
}


}

/// @nodoc
abstract mixin class _$ContactEntryCopyWith<$Res> implements $ContactEntryCopyWith<$Res> {
  factory _$ContactEntryCopyWith(_ContactEntry value, $Res Function(_ContactEntry) _then) = __$ContactEntryCopyWithImpl;
@override @useResult
$Res call({
 String name, String phone, String? whatsappUrl, String? role
});




}
/// @nodoc
class __$ContactEntryCopyWithImpl<$Res>
    implements _$ContactEntryCopyWith<$Res> {
  __$ContactEntryCopyWithImpl(this._self, this._then);

  final _ContactEntry _self;
  final $Res Function(_ContactEntry) _then;

/// Create a copy of ContactEntry
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? name = null,Object? phone = null,Object? whatsappUrl = freezed,Object? role = freezed,}) {
  return _then(_ContactEntry(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,whatsappUrl: freezed == whatsappUrl ? _self.whatsappUrl : whatsappUrl // ignore: cast_nullable_to_non_nullable
as String?,role: freezed == role ? _self.role : role // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$QuickContacts {

 List<ContactEntry> get taxis; List<ContactEntry> get coordinators;
/// Create a copy of QuickContacts
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$QuickContactsCopyWith<QuickContacts> get copyWith => _$QuickContactsCopyWithImpl<QuickContacts>(this as QuickContacts, _$identity);

  /// Serializes this QuickContacts to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is QuickContacts&&const DeepCollectionEquality().equals(other.taxis, taxis)&&const DeepCollectionEquality().equals(other.coordinators, coordinators));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(taxis),const DeepCollectionEquality().hash(coordinators));

@override
String toString() {
  return 'QuickContacts(taxis: $taxis, coordinators: $coordinators)';
}


}

/// @nodoc
abstract mixin class $QuickContactsCopyWith<$Res>  {
  factory $QuickContactsCopyWith(QuickContacts value, $Res Function(QuickContacts) _then) = _$QuickContactsCopyWithImpl;
@useResult
$Res call({
 List<ContactEntry> taxis, List<ContactEntry> coordinators
});




}
/// @nodoc
class _$QuickContactsCopyWithImpl<$Res>
    implements $QuickContactsCopyWith<$Res> {
  _$QuickContactsCopyWithImpl(this._self, this._then);

  final QuickContacts _self;
  final $Res Function(QuickContacts) _then;

/// Create a copy of QuickContacts
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? taxis = null,Object? coordinators = null,}) {
  return _then(_self.copyWith(
taxis: null == taxis ? _self.taxis : taxis // ignore: cast_nullable_to_non_nullable
as List<ContactEntry>,coordinators: null == coordinators ? _self.coordinators : coordinators // ignore: cast_nullable_to_non_nullable
as List<ContactEntry>,
  ));
}

}


/// Adds pattern-matching-related methods to [QuickContacts].
extension QuickContactsPatterns on QuickContacts {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _QuickContacts value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _QuickContacts() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _QuickContacts value)  $default,){
final _that = this;
switch (_that) {
case _QuickContacts():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _QuickContacts value)?  $default,){
final _that = this;
switch (_that) {
case _QuickContacts() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<ContactEntry> taxis,  List<ContactEntry> coordinators)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _QuickContacts() when $default != null:
return $default(_that.taxis,_that.coordinators);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<ContactEntry> taxis,  List<ContactEntry> coordinators)  $default,) {final _that = this;
switch (_that) {
case _QuickContacts():
return $default(_that.taxis,_that.coordinators);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<ContactEntry> taxis,  List<ContactEntry> coordinators)?  $default,) {final _that = this;
switch (_that) {
case _QuickContacts() when $default != null:
return $default(_that.taxis,_that.coordinators);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _QuickContacts implements QuickContacts {
  const _QuickContacts({required final  List<ContactEntry> taxis, required final  List<ContactEntry> coordinators}): _taxis = taxis,_coordinators = coordinators;
  factory _QuickContacts.fromJson(Map<String, dynamic> json) => _$QuickContactsFromJson(json);

 final  List<ContactEntry> _taxis;
@override List<ContactEntry> get taxis {
  if (_taxis is EqualUnmodifiableListView) return _taxis;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_taxis);
}

 final  List<ContactEntry> _coordinators;
@override List<ContactEntry> get coordinators {
  if (_coordinators is EqualUnmodifiableListView) return _coordinators;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_coordinators);
}


/// Create a copy of QuickContacts
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$QuickContactsCopyWith<_QuickContacts> get copyWith => __$QuickContactsCopyWithImpl<_QuickContacts>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$QuickContactsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _QuickContacts&&const DeepCollectionEquality().equals(other._taxis, _taxis)&&const DeepCollectionEquality().equals(other._coordinators, _coordinators));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_taxis),const DeepCollectionEquality().hash(_coordinators));

@override
String toString() {
  return 'QuickContacts(taxis: $taxis, coordinators: $coordinators)';
}


}

/// @nodoc
abstract mixin class _$QuickContactsCopyWith<$Res> implements $QuickContactsCopyWith<$Res> {
  factory _$QuickContactsCopyWith(_QuickContacts value, $Res Function(_QuickContacts) _then) = __$QuickContactsCopyWithImpl;
@override @useResult
$Res call({
 List<ContactEntry> taxis, List<ContactEntry> coordinators
});




}
/// @nodoc
class __$QuickContactsCopyWithImpl<$Res>
    implements _$QuickContactsCopyWith<$Res> {
  __$QuickContactsCopyWithImpl(this._self, this._then);

  final _QuickContacts _self;
  final $Res Function(_QuickContacts) _then;

/// Create a copy of QuickContacts
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? taxis = null,Object? coordinators = null,}) {
  return _then(_QuickContacts(
taxis: null == taxis ? _self._taxis : taxis // ignore: cast_nullable_to_non_nullable
as List<ContactEntry>,coordinators: null == coordinators ? _self._coordinators : coordinators // ignore: cast_nullable_to_non_nullable
as List<ContactEntry>,
  ));
}


}

// dart format on
