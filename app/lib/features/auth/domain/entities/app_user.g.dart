// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AppUser _$AppUserFromJson(Map<String, dynamic> json) => _AppUser(
  uid: json['uid'] as String,
  email: json['email'] as String,
  fullName: json['fullName'] as String,
  photoUrl: json['photoUrl'] as String?,
  whatsappNumber: json['whatsappNumber'] as String?,
  funFact: json['funFact'] as String?,
  relationToGrooms: json['relationToGrooms'] as String,
  relationshipStatus: $enumDecode(
    _$RelationshipStatusEnumMap,
    json['relationshipStatus'],
  ),
  side: $enumDecode(_$GuestSideEnumMap, json['side']),
  profileClaimed: json['profileClaimed'] as bool,
  isDirectoryVisible: json['isDirectoryVisible'] as bool,
  createdAt: const TimestampConverter().fromJson(json['createdAt']),
  updatedAt: const TimestampConverter().fromJson(json['updatedAt']),
);

Map<String, dynamic> _$AppUserToJson(_AppUser instance) => <String, dynamic>{
  'uid': instance.uid,
  'email': instance.email,
  'fullName': instance.fullName,
  'photoUrl': instance.photoUrl,
  'whatsappNumber': instance.whatsappNumber,
  'funFact': instance.funFact,
  'relationToGrooms': instance.relationToGrooms,
  'relationshipStatus':
      _$RelationshipStatusEnumMap[instance.relationshipStatus]!,
  'side': _$GuestSideEnumMap[instance.side]!,
  'profileClaimed': instance.profileClaimed,
  'isDirectoryVisible': instance.isDirectoryVisible,
  'createdAt': const TimestampConverter().toJson(instance.createdAt),
  'updatedAt': const TimestampConverter().toJson(instance.updatedAt),
};

const _$RelationshipStatusEnumMap = {
  RelationshipStatus.soltero: 'soltero',
  RelationshipStatus.enPareja: 'enPareja',
  RelationshipStatus.buscando: 'buscando',
};

const _$GuestSideEnumMap = {
  GuestSide.novioA: 'novioA',
  GuestSide.novioB: 'novioB',
  GuestSide.ambos: 'ambos',
};
