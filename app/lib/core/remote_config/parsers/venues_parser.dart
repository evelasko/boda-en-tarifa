import 'dart:convert';

import '../../models/venue.dart';

List<Venue>? parseVenuesJson(String json) {
  try {
    final list = jsonDecode(json) as List<dynamic>;
    return list
        .map((e) => Venue.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return null;
  }
}
