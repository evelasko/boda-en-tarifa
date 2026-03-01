import 'dart:convert';

import '../../models/quick_contacts.dart';

QuickContacts? parseQuickContactsJson(String json) {
  try {
    final decoded = jsonDecode(json) as Map<String, dynamic>;
    return QuickContacts.fromJson(decoded);
  } catch (_) {
    return null;
  }
}
