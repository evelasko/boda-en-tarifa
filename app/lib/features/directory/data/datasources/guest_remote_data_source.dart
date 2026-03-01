import 'package:cloud_firestore/cloud_firestore.dart';

import 'package:boda_en_tarifa_app/core/error/exceptions.dart';

import '../../domain/entities/guest_profile.dart';

abstract class GuestRemoteDataSource {
  Future<List<GuestProfile>> getVisibleGuests();
}

class GuestRemoteDataSourceImpl implements GuestRemoteDataSource {
  final FirebaseFirestore _firestore;

  GuestRemoteDataSourceImpl({required FirebaseFirestore firestore})
      : _firestore = firestore;

  @override
  Future<List<GuestProfile>> getVisibleGuests() async {
    try {
      final snapshot = await _firestore
          .collection('guests')
          .where('isDirectoryVisible', isEqualTo: true)
          .get();

      return snapshot.docs.map((doc) {
        final data = doc.data();
        return GuestProfile.fromJson({...data, 'uid': doc.id});
      }).toList();
    } on FirebaseException catch (e) {
      throw ServerException(
        e.message ?? 'Error al cargar el directorio de invitados',
      );
    }
  }
}
