// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'gated_content_payload.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$GatedContentDoc {

 String get id; String get contentType; Map<String, dynamic> get payload; DateTime get unlockAt;
/// Create a copy of GatedContentDoc
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$GatedContentDocCopyWith<GatedContentDoc> get copyWith => _$GatedContentDocCopyWithImpl<GatedContentDoc>(this as GatedContentDoc, _$identity);

  /// Serializes this GatedContentDoc to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is GatedContentDoc&&(identical(other.id, id) || other.id == id)&&(identical(other.contentType, contentType) || other.contentType == contentType)&&const DeepCollectionEquality().equals(other.payload, payload)&&(identical(other.unlockAt, unlockAt) || other.unlockAt == unlockAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,contentType,const DeepCollectionEquality().hash(payload),unlockAt);

@override
String toString() {
  return 'GatedContentDoc(id: $id, contentType: $contentType, payload: $payload, unlockAt: $unlockAt)';
}


}

/// @nodoc
abstract mixin class $GatedContentDocCopyWith<$Res>  {
  factory $GatedContentDocCopyWith(GatedContentDoc value, $Res Function(GatedContentDoc) _then) = _$GatedContentDocCopyWithImpl;
@useResult
$Res call({
 String id, String contentType, Map<String, dynamic> payload, DateTime unlockAt
});




}
/// @nodoc
class _$GatedContentDocCopyWithImpl<$Res>
    implements $GatedContentDocCopyWith<$Res> {
  _$GatedContentDocCopyWithImpl(this._self, this._then);

  final GatedContentDoc _self;
  final $Res Function(GatedContentDoc) _then;

/// Create a copy of GatedContentDoc
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? contentType = null,Object? payload = null,Object? unlockAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,contentType: null == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as String,payload: null == payload ? _self.payload : payload // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>,unlockAt: null == unlockAt ? _self.unlockAt : unlockAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}

}


/// Adds pattern-matching-related methods to [GatedContentDoc].
extension GatedContentDocPatterns on GatedContentDoc {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _GatedContentDoc value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _GatedContentDoc() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _GatedContentDoc value)  $default,){
final _that = this;
switch (_that) {
case _GatedContentDoc():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _GatedContentDoc value)?  $default,){
final _that = this;
switch (_that) {
case _GatedContentDoc() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String contentType,  Map<String, dynamic> payload,  DateTime unlockAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _GatedContentDoc() when $default != null:
return $default(_that.id,_that.contentType,_that.payload,_that.unlockAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String contentType,  Map<String, dynamic> payload,  DateTime unlockAt)  $default,) {final _that = this;
switch (_that) {
case _GatedContentDoc():
return $default(_that.id,_that.contentType,_that.payload,_that.unlockAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String contentType,  Map<String, dynamic> payload,  DateTime unlockAt)?  $default,) {final _that = this;
switch (_that) {
case _GatedContentDoc() when $default != null:
return $default(_that.id,_that.contentType,_that.payload,_that.unlockAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _GatedContentDoc implements GatedContentDoc {
  const _GatedContentDoc({required this.id, required this.contentType, required final  Map<String, dynamic> payload, required this.unlockAt}): _payload = payload;
  factory _GatedContentDoc.fromJson(Map<String, dynamic> json) => _$GatedContentDocFromJson(json);

@override final  String id;
@override final  String contentType;
 final  Map<String, dynamic> _payload;
@override Map<String, dynamic> get payload {
  if (_payload is EqualUnmodifiableMapView) return _payload;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableMapView(_payload);
}

@override final  DateTime unlockAt;

/// Create a copy of GatedContentDoc
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$GatedContentDocCopyWith<_GatedContentDoc> get copyWith => __$GatedContentDocCopyWithImpl<_GatedContentDoc>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$GatedContentDocToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _GatedContentDoc&&(identical(other.id, id) || other.id == id)&&(identical(other.contentType, contentType) || other.contentType == contentType)&&const DeepCollectionEquality().equals(other._payload, _payload)&&(identical(other.unlockAt, unlockAt) || other.unlockAt == unlockAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,contentType,const DeepCollectionEquality().hash(_payload),unlockAt);

@override
String toString() {
  return 'GatedContentDoc(id: $id, contentType: $contentType, payload: $payload, unlockAt: $unlockAt)';
}


}

/// @nodoc
abstract mixin class _$GatedContentDocCopyWith<$Res> implements $GatedContentDocCopyWith<$Res> {
  factory _$GatedContentDocCopyWith(_GatedContentDoc value, $Res Function(_GatedContentDoc) _then) = __$GatedContentDocCopyWithImpl;
@override @useResult
$Res call({
 String id, String contentType, Map<String, dynamic> payload, DateTime unlockAt
});




}
/// @nodoc
class __$GatedContentDocCopyWithImpl<$Res>
    implements _$GatedContentDocCopyWith<$Res> {
  __$GatedContentDocCopyWithImpl(this._self, this._then);

  final _GatedContentDoc _self;
  final $Res Function(_GatedContentDoc) _then;

/// Create a copy of GatedContentDoc
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? contentType = null,Object? payload = null,Object? unlockAt = null,}) {
  return _then(_GatedContentDoc(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,contentType: null == contentType ? _self.contentType : contentType // ignore: cast_nullable_to_non_nullable
as String,payload: null == payload ? _self._payload : payload // ignore: cast_nullable_to_non_nullable
as Map<String, dynamic>,unlockAt: null == unlockAt ? _self.unlockAt : unlockAt // ignore: cast_nullable_to_non_nullable
as DateTime,
  ));
}


}


/// @nodoc
mixin _$MenuPayload {

 List<MenuItem> get items; String? get notes;
/// Create a copy of MenuPayload
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MenuPayloadCopyWith<MenuPayload> get copyWith => _$MenuPayloadCopyWithImpl<MenuPayload>(this as MenuPayload, _$identity);

  /// Serializes this MenuPayload to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MenuPayload&&const DeepCollectionEquality().equals(other.items, items)&&(identical(other.notes, notes) || other.notes == notes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(items),notes);

@override
String toString() {
  return 'MenuPayload(items: $items, notes: $notes)';
}


}

/// @nodoc
abstract mixin class $MenuPayloadCopyWith<$Res>  {
  factory $MenuPayloadCopyWith(MenuPayload value, $Res Function(MenuPayload) _then) = _$MenuPayloadCopyWithImpl;
@useResult
$Res call({
 List<MenuItem> items, String? notes
});




}
/// @nodoc
class _$MenuPayloadCopyWithImpl<$Res>
    implements $MenuPayloadCopyWith<$Res> {
  _$MenuPayloadCopyWithImpl(this._self, this._then);

  final MenuPayload _self;
  final $Res Function(MenuPayload) _then;

/// Create a copy of MenuPayload
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? items = null,Object? notes = freezed,}) {
  return _then(_self.copyWith(
items: null == items ? _self.items : items // ignore: cast_nullable_to_non_nullable
as List<MenuItem>,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [MenuPayload].
extension MenuPayloadPatterns on MenuPayload {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MenuPayload value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MenuPayload() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MenuPayload value)  $default,){
final _that = this;
switch (_that) {
case _MenuPayload():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MenuPayload value)?  $default,){
final _that = this;
switch (_that) {
case _MenuPayload() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( List<MenuItem> items,  String? notes)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MenuPayload() when $default != null:
return $default(_that.items,_that.notes);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( List<MenuItem> items,  String? notes)  $default,) {final _that = this;
switch (_that) {
case _MenuPayload():
return $default(_that.items,_that.notes);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( List<MenuItem> items,  String? notes)?  $default,) {final _that = this;
switch (_that) {
case _MenuPayload() when $default != null:
return $default(_that.items,_that.notes);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MenuPayload implements MenuPayload {
  const _MenuPayload({required final  List<MenuItem> items, this.notes}): _items = items;
  factory _MenuPayload.fromJson(Map<String, dynamic> json) => _$MenuPayloadFromJson(json);

 final  List<MenuItem> _items;
@override List<MenuItem> get items {
  if (_items is EqualUnmodifiableListView) return _items;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_items);
}

@override final  String? notes;

/// Create a copy of MenuPayload
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MenuPayloadCopyWith<_MenuPayload> get copyWith => __$MenuPayloadCopyWithImpl<_MenuPayload>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MenuPayloadToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MenuPayload&&const DeepCollectionEquality().equals(other._items, _items)&&(identical(other.notes, notes) || other.notes == notes));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,const DeepCollectionEquality().hash(_items),notes);

@override
String toString() {
  return 'MenuPayload(items: $items, notes: $notes)';
}


}

/// @nodoc
abstract mixin class _$MenuPayloadCopyWith<$Res> implements $MenuPayloadCopyWith<$Res> {
  factory _$MenuPayloadCopyWith(_MenuPayload value, $Res Function(_MenuPayload) _then) = __$MenuPayloadCopyWithImpl;
@override @useResult
$Res call({
 List<MenuItem> items, String? notes
});




}
/// @nodoc
class __$MenuPayloadCopyWithImpl<$Res>
    implements _$MenuPayloadCopyWith<$Res> {
  __$MenuPayloadCopyWithImpl(this._self, this._then);

  final _MenuPayload _self;
  final $Res Function(_MenuPayload) _then;

/// Create a copy of MenuPayload
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? items = null,Object? notes = freezed,}) {
  return _then(_MenuPayload(
items: null == items ? _self._items : items // ignore: cast_nullable_to_non_nullable
as List<MenuItem>,notes: freezed == notes ? _self.notes : notes // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$MenuItem {

 String get name; String? get description; List<String> get dietary;
/// Create a copy of MenuItem
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$MenuItemCopyWith<MenuItem> get copyWith => _$MenuItemCopyWithImpl<MenuItem>(this as MenuItem, _$identity);

  /// Serializes this MenuItem to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is MenuItem&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other.dietary, dietary));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,description,const DeepCollectionEquality().hash(dietary));

@override
String toString() {
  return 'MenuItem(name: $name, description: $description, dietary: $dietary)';
}


}

/// @nodoc
abstract mixin class $MenuItemCopyWith<$Res>  {
  factory $MenuItemCopyWith(MenuItem value, $Res Function(MenuItem) _then) = _$MenuItemCopyWithImpl;
@useResult
$Res call({
 String name, String? description, List<String> dietary
});




}
/// @nodoc
class _$MenuItemCopyWithImpl<$Res>
    implements $MenuItemCopyWith<$Res> {
  _$MenuItemCopyWithImpl(this._self, this._then);

  final MenuItem _self;
  final $Res Function(MenuItem) _then;

/// Create a copy of MenuItem
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? name = null,Object? description = freezed,Object? dietary = null,}) {
  return _then(_self.copyWith(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,dietary: null == dietary ? _self.dietary : dietary // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}

}


/// Adds pattern-matching-related methods to [MenuItem].
extension MenuItemPatterns on MenuItem {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _MenuItem value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _MenuItem() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _MenuItem value)  $default,){
final _that = this;
switch (_that) {
case _MenuItem():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _MenuItem value)?  $default,){
final _that = this;
switch (_that) {
case _MenuItem() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String name,  String? description,  List<String> dietary)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _MenuItem() when $default != null:
return $default(_that.name,_that.description,_that.dietary);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String name,  String? description,  List<String> dietary)  $default,) {final _that = this;
switch (_that) {
case _MenuItem():
return $default(_that.name,_that.description,_that.dietary);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String name,  String? description,  List<String> dietary)?  $default,) {final _that = this;
switch (_that) {
case _MenuItem() when $default != null:
return $default(_that.name,_that.description,_that.dietary);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _MenuItem implements MenuItem {
  const _MenuItem({required this.name, this.description, final  List<String> dietary = const []}): _dietary = dietary;
  factory _MenuItem.fromJson(Map<String, dynamic> json) => _$MenuItemFromJson(json);

@override final  String name;
@override final  String? description;
 final  List<String> _dietary;
@override@JsonKey() List<String> get dietary {
  if (_dietary is EqualUnmodifiableListView) return _dietary;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_dietary);
}


/// Create a copy of MenuItem
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$MenuItemCopyWith<_MenuItem> get copyWith => __$MenuItemCopyWithImpl<_MenuItem>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$MenuItemToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _MenuItem&&(identical(other.name, name) || other.name == name)&&(identical(other.description, description) || other.description == description)&&const DeepCollectionEquality().equals(other._dietary, _dietary));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,name,description,const DeepCollectionEquality().hash(_dietary));

@override
String toString() {
  return 'MenuItem(name: $name, description: $description, dietary: $dietary)';
}


}

/// @nodoc
abstract mixin class _$MenuItemCopyWith<$Res> implements $MenuItemCopyWith<$Res> {
  factory _$MenuItemCopyWith(_MenuItem value, $Res Function(_MenuItem) _then) = __$MenuItemCopyWithImpl;
@override @useResult
$Res call({
 String name, String? description, List<String> dietary
});




}
/// @nodoc
class __$MenuItemCopyWithImpl<$Res>
    implements _$MenuItemCopyWith<$Res> {
  __$MenuItemCopyWithImpl(this._self, this._then);

  final _MenuItem _self;
  final $Res Function(_MenuItem) _then;

/// Create a copy of MenuItem
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? name = null,Object? description = freezed,Object? dietary = null,}) {
  return _then(_MenuItem(
name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,dietary: null == dietary ? _self._dietary : dietary // ignore: cast_nullable_to_non_nullable
as List<String>,
  ));
}


}

// dart format on
