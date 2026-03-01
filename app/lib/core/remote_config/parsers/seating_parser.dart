import 'dart:convert';

import '../../models/seating_assignment.dart';

List<SeatingAssignment>? parseSeatingChartJson(String json) {
  try {
    final list = jsonDecode(json) as List<dynamic>;
    return list
        .map((e) => SeatingAssignment.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return null;
  }
}
