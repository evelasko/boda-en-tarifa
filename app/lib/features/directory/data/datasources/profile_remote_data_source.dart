import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../auth/domain/entities/app_user.dart';

abstract class ProfileRemoteDataSource {
  Future<AppUser> getGuestProfile(String uid);

  Future<void> updateProfile({
    required String uid,
    String? photoUrl,
    String? funFact,
    RelationshipStatus? relationshipStatus,
    bool? isDirectoryVisible,
  });
}

class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final FirebaseFirestore _firestore;

  ProfileRemoteDataSourceImpl({required FirebaseFirestore firestore})
      : _firestore = firestore;

  @override
  Future<AppUser> getGuestProfile(String uid) async {
    final doc = await _firestore.collection('guests').doc(uid).get();

    if (!doc.exists) {
      throw Exception('Invitado no encontrado');
    }

    return AppUser.fromJson({...doc.data()!, 'uid': uid});
  }

  @override
  Future<void> updateProfile({
    required String uid,
    String? photoUrl,
    String? funFact,
    RelationshipStatus? relationshipStatus,
    bool? isDirectoryVisible,
  }) async {
    final updates = <String, dynamic>{
      'updatedAt': FieldValue.serverTimestamp(),
    };

    if (photoUrl != null) updates['photoUrl'] = photoUrl;
    if (funFact != null) updates['funFact'] = funFact;
    if (relationshipStatus != null) {
      updates['relationshipStatus'] = relationshipStatus.name;
    }
    if (isDirectoryVisible != null) {
      updates['isDirectoryVisible'] = isDirectoryVisible;
    }

    await _firestore.collection('guests').doc(uid).update(updates);
  }
}
