import 'dart:convert';

import '../../models/time_gated_content.dart';

List<TimeGatedContent>? parseTimeGatesJson(String json) {
  try {
    final list = jsonDecode(json) as List<dynamic>;
    return list
        .map((e) => TimeGatedContent.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return null;
  }
}
