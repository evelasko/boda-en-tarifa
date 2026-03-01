import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/notice.dart';
import '../repositories/notice_board_repository.dart';

class CreateNotice {
  final NoticeBoardRepository _repository;

  CreateNotice({required NoticeBoardRepository repository})
      : _repository = repository;

  FutureEither<void> call(Notice notice) => _repository.createNotice(notice);
}
