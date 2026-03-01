import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';

abstract class ProfileRepository {
  /// Fetches a guest profile by [uid] from Firestore.
  FutureEither<AppUser> getGuestProfile(String uid);

  /// Updates the guest-editable profile fields in Firestore.
  /// Only [photoUrl], [funFact], [relationshipStatus], and
  /// [isDirectoryVisible] can be changed by guests.
  FutureEither<void> updateProfile({
    required String uid,
    String? photoUrl,
    String? funFact,
    RelationshipStatus? relationshipStatus,
    bool? isDirectoryVisible,
  });

  /// Updates the local Drift cache for this guest.
  Future<void> updateCachedGuest({
    required String uid,
    String? photoUrl,
    String? funFact,
    RelationshipStatus? relationshipStatus,
  });
}
