import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fpdart/fpdart.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:boda_en_tarifa_app/core/error/failures.dart';

import '../../data/datasources/gated_content_remote_data_source.dart';
import '../../data/repositories/gated_content_repository_impl.dart';
import '../../domain/entities/gated_content_payload.dart';
import '../../domain/repositories/gated_content_repository.dart';

part 'gated_content_providers.g.dart';

@Riverpod(keepAlive: true)
GatedContentRepository gatedContentRepository(Ref ref) {
  return GatedContentRepositoryImpl(
    remoteDataSource: GatedContentRemoteDataSourceImpl(
      firestore: FirebaseFirestore.instance,
    ),
  );
}

@riverpod
Future<Either<Failure, GatedContentDoc>> gatedContentDoc(
  Ref ref,
  String docPath,
) {
  return ref.watch(gatedContentRepositoryProvider).getContent(docPath);
}
