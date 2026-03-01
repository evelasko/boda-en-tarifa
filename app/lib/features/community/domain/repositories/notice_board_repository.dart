import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/notice.dart';

abstract class NoticeBoardRepository {
  Stream<List<Notice>> watchNotices();

  FutureEither<void> createNotice(Notice notice);
}
