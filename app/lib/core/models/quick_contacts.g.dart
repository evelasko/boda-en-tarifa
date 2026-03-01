// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'quick_contacts.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ContactEntry _$ContactEntryFromJson(Map<String, dynamic> json) =>
    _ContactEntry(
      name: json['name'] as String,
      phone: json['phone'] as String,
      whatsappUrl: json['whatsappUrl'] as String?,
      role: json['role'] as String?,
    );

Map<String, dynamic> _$ContactEntryToJson(_ContactEntry instance) =>
    <String, dynamic>{
      'name': instance.name,
      'phone': instance.phone,
      'whatsappUrl': instance.whatsappUrl,
      'role': instance.role,
    };

_QuickContacts _$QuickContactsFromJson(Map<String, dynamic> json) =>
    _QuickContacts(
      taxis: (json['taxis'] as List<dynamic>)
          .map((e) => ContactEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
      coordinators: (json['coordinators'] as List<dynamic>)
          .map((e) => ContactEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$QuickContactsToJson(_QuickContacts instance) =>
    <String, dynamic>{
      'taxis': instance.taxis,
      'coordinators': instance.coordinators,
    };
