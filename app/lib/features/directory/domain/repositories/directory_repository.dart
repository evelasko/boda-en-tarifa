import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/guest_profile.dart';

abstract class DirectoryRepository {
  /// Loads guests using offline-first strategy: returns cached data when
  /// offline, fetches and caches fresh data when online.
  FutureEither<List<GuestProfile>> getGuests();
}
