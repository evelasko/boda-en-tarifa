import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/gated_content_payload.dart';

abstract class GatedContentRepository {
  FutureEither<GatedContentDoc> getContent(String firestoreDocPath);
}
