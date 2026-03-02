import 'package:drift/drift.dart';

import 'package:boda_en_tarifa_app/core/database/app_database.dart';
import 'package:boda_en_tarifa_app/core/error/exceptions.dart';

import '../../domain/entities/exposure.dart';

abstract class ExposureLocalDataSource {
  Future<void> insertExposure(Exposure exposure);
  Stream<List<Exposure>> watchAllExposures();
  Future<int> getExposureCount();
}

class ExposureLocalDataSourceImpl implements ExposureLocalDataSource {
  final AppDatabase _db;

  ExposureLocalDataSourceImpl({required AppDatabase db}) : _db = db;

  @override
  Future<void> insertExposure(Exposure exposure) async {
    try {
      await _db.into(_db.exposures).insert(
            ExposuresCompanion.insert(
              id: exposure.id,
              localPath: exposure.localPath,
              cloudinaryPublicId: Value(exposure.cloudinaryPublicId),
              exposureNumber: exposure.exposureNumber,
              capturedAt: exposure.capturedAt,
            ),
          );
    } catch (e) {
      throw CacheException('Error al guardar exposición: $e');
    }
  }

  @override
  Stream<List<Exposure>> watchAllExposures() {
    final query = _db.select(_db.exposures)
      ..orderBy([(t) => OrderingTerm.desc(t.capturedAt)]);
    return query.watch().map(
          (rows) => rows.map(_rowToEntity).toList(),
        );
  }

  @override
  Future<int> getExposureCount() async {
    try {
      final rows = await _db.select(_db.exposures).get();
      return rows.length;
    } catch (e) {
      throw CacheException('Error al contar exposiciones: $e');
    }
  }

  Exposure _rowToEntity(ExposureRow row) {
    return Exposure(
      id: row.id,
      localPath: row.localPath,
      cloudinaryPublicId: row.cloudinaryPublicId,
      exposureNumber: row.exposureNumber,
      capturedAt: row.capturedAt,
      isDeveloped: row.isDeveloped,
      isPublished: row.isPublished,
    );
  }
}
