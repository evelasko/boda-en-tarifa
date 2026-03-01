import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';

import '../repositories/profile_repository.dart';

class UpdateProfile {
  final ProfileRepository _repository;

  const UpdateProfile(this._repository);

  /// Persists editable profile fields to Firestore and updates
  /// the local Drift cache optimistically.
  FutureEither<void> call({
    required String uid,
    String? photoUrl,
    String? funFact,
    RelationshipStatus? relationshipStatus,
    bool? isDirectoryVisible,
  }) async {
    // Optimistic local write first
    await _repository.updateCachedGuest(
      uid: uid,
      photoUrl: photoUrl,
      funFact: funFact,
      relationshipStatus: relationshipStatus,
    );

    return _repository.updateProfile(
      uid: uid,
      photoUrl: photoUrl,
      funFact: funFact,
      relationshipStatus: relationshipStatus,
      isDirectoryVisible: isDirectoryVisible,
    );
  }
}
