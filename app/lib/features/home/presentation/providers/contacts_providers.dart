import 'dart:convert';

import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';

import '../../domain/entities/quick_contact.dart';

const _defaultContacts = QuickContacts(
  taxis: [
    QuickContact(
      id: 'taxi-tarifa',
      label: 'Taxi Tarifa',
      phoneNumber: '34956684174',
    ),
    QuickContact(
      id: 'taxi-radio',
      label: 'Radio Taxi Tarifa',
      phoneNumber: '34956681242',
    ),
  ],
  coordinators: [
    QuickContact(
      id: 'coordinadora',
      label: 'Coordinadora',
      phoneNumber: '34600000000',
      whatsappNumber: '34600000000',
    ),
  ],
);

final quickContactsProvider = Provider<QuickContacts>((ref) {
  final remoteConfig = ref.watch(remoteConfigProvider);
  return _parseQuickContacts(remoteConfig);
});

QuickContacts _parseQuickContacts(FirebaseRemoteConfig remoteConfig) {
  try {
    final raw = remoteConfig.getString('quick_contacts_json');
    if (raw.isEmpty) return _defaultContacts;

    final decoded = jsonDecode(raw);

    if (decoded is Map<String, dynamic>) {
      final taxis = (decoded['taxis'] as List<dynamic>?)
              ?.map((e) => QuickContact.fromJson(e as Map<String, dynamic>))
              .toList() ??
          _defaultContacts.taxis;

      final coordinators = (decoded['coordinators'] as List<dynamic>?)
              ?.map((e) => QuickContact.fromJson(e as Map<String, dynamic>))
              .toList() ??
          _defaultContacts.coordinators;

      return QuickContacts(taxis: taxis, coordinators: coordinators);
    }

    return _defaultContacts;
  } catch (_) {
    return _defaultContacts;
  }
}
