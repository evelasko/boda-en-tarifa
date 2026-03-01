// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'guest_profile.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_GuestProfile _$GuestProfileFromJson(Map<String, dynamic> json) =>
    _GuestProfile(
      uid: json['uid'] as String,
      fullName: json['fullName'] as String,
      photoUrl: json['photoUrl'] as String?,
      side: $enumDecode(_$GuestSideEnumMap, json['side']),
      relationToGrooms: json['relationToGrooms'] as String,
      relationshipStatus: $enumDecode(
        _$RelationshipStatusEnumMap,
        json['relationshipStatus'],
      ),
      whatsappNumber: json['whatsappNumber'] as String?,
      funFact: json['funFact'] as String?,
    );

Map<String, dynamic> _$GuestProfileToJson(_GuestProfile instance) =>
    <String, dynamic>{
      'uid': instance.uid,
      'fullName': instance.fullName,
      'photoUrl': instance.photoUrl,
      'side': _$GuestSideEnumMap[instance.side]!,
      'relationToGrooms': instance.relationToGrooms,
      'relationshipStatus':
          _$RelationshipStatusEnumMap[instance.relationshipStatus]!,
      'whatsappNumber': instance.whatsappNumber,
      'funFact': instance.funFact,
    };

const _$GuestSideEnumMap = {
  GuestSide.novioA: 'novioA',
  GuestSide.novioB: 'novioB',
  GuestSide.ambos: 'ambos',
};

const _$RelationshipStatusEnumMap = {
  RelationshipStatus.soltero: 'soltero',
  RelationshipStatus.enPareja: 'enPareja',
  RelationshipStatus.buscando: 'buscando',
};
