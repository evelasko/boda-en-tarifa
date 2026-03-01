import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';

import '../../data/datasources/notice_board_remote_data_source.dart';
import '../../data/repositories/notice_board_repository_impl.dart';
import '../../domain/entities/notice.dart';
import '../../domain/repositories/notice_board_repository.dart';

part 'notice_board_providers.g.dart';

// ---------------------------------------------------------------------------
// Data layer providers
// ---------------------------------------------------------------------------

@Riverpod(keepAlive: true)
NoticeBoardRemoteDataSource noticeBoardRemoteDataSource(Ref ref) {
  return NoticeBoardRemoteDataSourceImpl(
    firestore: ref.watch(firestoreProvider),
  );
}

@Riverpod(keepAlive: true)
NoticeBoardRepository noticeBoardRepository(Ref ref) {
  return NoticeBoardRepositoryImpl(
    remoteDataSource: ref.watch(noticeBoardRemoteDataSourceProvider),
  );
}

// ---------------------------------------------------------------------------
// Notice board stream (real-time)
// ---------------------------------------------------------------------------

@riverpod
Stream<List<Notice>> noticeBoard(Ref ref) {
  final repo = ref.watch(noticeBoardRepositoryProvider);
  return repo.watchNotices();
}
