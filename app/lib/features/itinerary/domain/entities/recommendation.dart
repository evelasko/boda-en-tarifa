import 'package:freezed_annotation/freezed_annotation.dart';

part 'recommendation.freezed.dart';
part 'recommendation.g.dart';

@freezed
abstract class Recommendation with _$Recommendation {
  const factory Recommendation({
    required String name,
    required String description,
    String? category,
    String? mapUrl,
    String? imageUrl,
  }) = _Recommendation;

  factory Recommendation.fromJson(Map<String, dynamic> json) =>
      _$RecommendationFromJson(json);
}
