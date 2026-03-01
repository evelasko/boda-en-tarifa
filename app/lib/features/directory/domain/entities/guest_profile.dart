import 'package:freezed_annotation/freezed_annotation.dart';

import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';

part 'guest_profile.freezed.dart';
part 'guest_profile.g.dart';

@freezed
abstract class GuestProfile with _$GuestProfile {
  const factory GuestProfile({
    required String uid,
    required String fullName,
    String? photoUrl,
    required GuestSide side,
    required String relationToGrooms,
    required RelationshipStatus relationshipStatus,
    String? whatsappNumber,
    String? funFact,
  }) = _GuestProfile;

  factory GuestProfile.fromJson(Map<String, dynamic> json) =>
      _$GuestProfileFromJson(json);
}
