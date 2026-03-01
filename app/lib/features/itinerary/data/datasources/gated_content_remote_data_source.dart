import 'package:cloud_firestore/cloud_firestore.dart';

import 'package:boda_en_tarifa_app/core/error/exceptions.dart';

import '../../domain/entities/gated_content_payload.dart';

abstract class GatedContentRemoteDataSource {
  Future<GatedContentDoc> getContent(String firestoreDocPath);
}

class GatedContentRemoteDataSourceImpl
    implements GatedContentRemoteDataSource {
  final FirebaseFirestore _firestore;

  GatedContentRemoteDataSourceImpl({required FirebaseFirestore firestore})
      : _firestore = firestore;

  @override
  Future<GatedContentDoc> getContent(String firestoreDocPath) async {
    try {
      final doc = await _firestore.doc(firestoreDocPath).get();
      if (!doc.exists || doc.data() == null) {
        throw const ServerException('Documento no encontrado');
      }
      final data = doc.data()!;
      return GatedContentDoc(
        id: doc.id,
        contentType: data['contentType'] as String? ?? 'unknown',
        payload: data['payload'] as Map<String, dynamic>? ?? {},
        unlockAt: (data['unlockAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
      );
    } on FirebaseException catch (e) {
      if (e.code == 'permission-denied') {
        throw const ServerException('Contenido no disponible aún');
      }
      throw ServerException(e.message ?? 'Error de Firestore');
    }
  }
}
