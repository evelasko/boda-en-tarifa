import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../domain/entities/recommendation.dart';

part 'recommendations_provider.g.dart';

@Riverpod(keepAlive: true)
Future<List<Recommendation>> recommendations(Ref ref) async {
  final jsonString =
      await rootBundle.loadString('assets/data/recommendations.json');
  final jsonList = json.decode(jsonString) as List<dynamic>;
  return jsonList
      .map((e) => Recommendation.fromJson(e as Map<String, dynamic>))
      .toList();
}
