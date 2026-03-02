import 'package:drift/drift.dart';

import 'package:boda_en_tarifa_app/core/database/app_database.dart';
import 'package:boda_en_tarifa_app/core/error/exceptions.dart';

import '../../domain/entities/exposure.dart';

abstract class ExposureLocalDataSource {
  Future<void> insertExposure(Exposure exposure);
  Stream<List<Exposure>> watchAllExposures();
  Future<int> getExposureCount();

  // MFC-53: Background sync & development trigger
  Future<List<Exposure>> getUndevelopedExposures();
  Future<int> getUndevelopedCount();
  Stream<List<Exposure>> watchUndevelopedExposures();
  Future<List<Exposure>> getUnuploadedExposures();
  Future<void> markAsDeveloped(List<String> ids);
  Future<void> updateCloudinaryPublicId(String exposureId, String publicId);
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

  // ---------------------------------------------------------------------------
  // MFC-53: Background sync & development trigger queries
  // ---------------------------------------------------------------------------

  @override
  Future<List<Exposure>> getUndevelopedExposures() async {
    try {
      final query = _db.select(_db.exposures)
        ..where((t) => t.isDeveloped.equals(false))
        ..orderBy([(t) => OrderingTerm.asc(t.exposureNumber)]);
      final rows = await query.get();
      return rows.map(_rowToEntity).toList();
    } catch (e) {
      throw CacheException('Error al obtener exposiciones sin revelar: $e');
    }
  }

  @override
  Future<int> getUndevelopedCount() async {
    try {
      final count = _db.exposures.id.count();
      final query = _db.selectOnly(_db.exposures)
        ..addColumns([count])
        ..where(_db.exposures.isDeveloped.equals(false));
      final row = await query.getSingle();
      return row.read(count) ?? 0;
    } catch (e) {
      throw CacheException('Error al contar exposiciones sin revelar: $e');
    }
  }

  @override
  Stream<List<Exposure>> watchUndevelopedExposures() {
    final query = _db.select(_db.exposures)
      ..where((t) => t.isDeveloped.equals(false))
      ..orderBy([(t) => OrderingTerm.asc(t.exposureNumber)]);
    return query.watch().map(
          (rows) => rows.map(_rowToEntity).toList(),
        );
  }

  @override
  Future<List<Exposure>> getUnuploadedExposures() async {
    try {
      final query = _db.select(_db.exposures)
        ..where((t) => t.cloudinaryPublicId.isNull())
        ..orderBy([(t) => OrderingTerm.asc(t.capturedAt)]);
      final rows = await query.get();
      return rows.map(_rowToEntity).toList();
    } catch (e) {
      throw CacheException('Error al obtener exposiciones sin subir: $e');
    }
  }

  @override
  Future<void> markAsDeveloped(List<String> ids) async {
    try {
      await _db.transaction(() async {
        for (final id in ids) {
          await (_db.update(_db.exposures)
                ..where((t) => t.id.equals(id)))
              .write(const ExposuresCompanion(isDeveloped: Value(true)));
        }
      });
    } catch (e) {
      throw CacheException('Error al marcar como reveladas: $e');
    }
  }

  @override
  Future<void> updateCloudinaryPublicId(
    String exposureId,
    String publicId,
  ) async {
    try {
      await (_db.update(_db.exposures)
            ..where((t) => t.id.equals(exposureId)))
          .write(ExposuresCompanion(cloudinaryPublicId: Value(publicId)));
    } catch (e) {
      throw CacheException('Error al actualizar cloudinaryPublicId: $e');
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
