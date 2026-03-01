import 'dart:convert';

Map<String, List<String>>? parseWindTipsJson(String json) {
  try {
    final decoded = jsonDecode(json) as Map<String, dynamic>;
    return decoded.map(
      (key, value) => MapEntry(
        key,
        (value as List<dynamic>).cast<String>(),
      ),
    );
  } catch (_) {
    return null;
  }
}
