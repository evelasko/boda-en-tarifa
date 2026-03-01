import 'dart:convert';

DateTime? parseDevelopmentTriggerTime(String json) {
  try {
    final raw = jsonDecode(json) as String;
    return DateTime.parse(raw);
  } catch (_) {
    return null;
  }
}
