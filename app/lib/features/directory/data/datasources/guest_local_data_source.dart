import 'package:drift/drift.dart';

import 'package:boda_en_tarifa_app/core/database/app_database.dart';
import 'package:boda_en_tarifa_app/core/error/exceptions.dart';
import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';

import '../../domain/entities/guest_profile.dart';

abstract class GuestLocalDataSource {
  Future<List<GuestProfile>> getAllGuests();
  Future<void> replaceAllGuests(List<GuestProfile> guests);
}

class GuestLocalDataSourceImpl implements GuestLocalDataSource {
  final AppDatabase _db;

  GuestLocalDataSourceImpl({required AppDatabase db}) : _db = db;

  @override
  Future<List<GuestProfile>> getAllGuests() async {
    try {
      final rows = await _db.select(_db.cachedGuests).get();
      return rows.map(_rowToProfile).toList();
    } catch (e) {
      throw CacheException('Error al leer invitados en caché: $e');
    }
  }

  @override
  Future<void> replaceAllGuests(List<GuestProfile> guests) async {
    try {
      await _db.transaction(() async {
        await _db.delete(_db.cachedGuests).go();
        await _db.batch((batch) {
          for (final guest in guests) {
            batch.insert(
              _db.cachedGuests,
              CachedGuestsCompanion.insert(
                uid: guest.uid,
                fullName: guest.fullName,
                photoUrl: Value(guest.photoUrl),
                side: guest.side.name,
                relationToGrooms: guest.relationToGrooms,
                relationshipStatus: guest.relationshipStatus.name,
                whatsappNumber: Value(guest.whatsappNumber),
                funFact: Value(guest.funFact),
              ),
            );
          }
        });
      });
    } catch (e) {
      throw CacheException('Error al guardar invitados en caché: $e');
    }
  }

  GuestProfile _rowToProfile(CachedGuest row) {
    return GuestProfile(
      uid: row.uid,
      fullName: row.fullName,
      photoUrl: row.photoUrl,
      side: GuestSide.values.byName(row.side),
      relationToGrooms: row.relationToGrooms,
      relationshipStatus:
          RelationshipStatus.values.byName(row.relationshipStatus),
      whatsappNumber: row.whatsappNumber,
      funFact: row.funFact,
    );
  }
}
