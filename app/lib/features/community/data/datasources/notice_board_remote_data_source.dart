import 'package:cloud_firestore/cloud_firestore.dart';

import 'package:boda_en_tarifa_app/core/error/exceptions.dart';

import '../../domain/entities/notice.dart';

abstract class NoticeBoardRemoteDataSource {
  Stream<List<Notice>> watchNotices();

  Future<void> createNotice(Notice notice);
}

class NoticeBoardRemoteDataSourceImpl implements NoticeBoardRemoteDataSource {
  final FirebaseFirestore _firestore;

  NoticeBoardRemoteDataSourceImpl({required FirebaseFirestore firestore})
      : _firestore = firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('notices');

  @override
  Stream<List<Notice>> watchNotices() {
    return _collection
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) {
              return Notice.fromJson({...doc.data(), 'id': doc.id});
            }).toList());
  }

  @override
  Future<void> createNotice(Notice notice) async {
    try {
      await _collection.add({
        'authorUid': notice.authorUid,
        'authorName': notice.authorName,
        'authorPhotoUrl': notice.authorPhotoUrl,
        'body': notice.body,
        'authorWhatsappNumber': notice.authorWhatsappNumber,
        'authorEmail': notice.authorEmail,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } on FirebaseException catch (e) {
      throw ServerException(
        e.message ?? 'Error al crear el aviso',
      );
    }
  }
}
