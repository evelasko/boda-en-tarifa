import 'dart:async';

import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import '../database/app_database.dart';
import 'mapbox_config.dart';

abstract class OfflineTileManager {
  Future<bool> areTilesDownloaded();
  Stream<double> downloadTileRegion();
  Future<void> deleteTileRegion();
}

class OfflineTileManagerImpl implements OfflineTileManager {
  final AppDatabase _db;

  static const _cacheKey = 'mapbox_tiles_downloaded';

  OfflineTileManagerImpl({required AppDatabase db}) : _db = db;

  @override
  Future<bool> areTilesDownloaded() async {
    final row = await (_db.select(_db.configCache)
          ..where((t) => t.key.equals(_cacheKey)))
        .getSingleOrNull();
    return row?.value == 'true';
  }

  @override
  Stream<double> downloadTileRegion() {
    final controller = StreamController<double>.broadcast();

    _download(controller).then((_) {
      if (!controller.isClosed) controller.close();
    }).catchError((Object e) {
      if (!controller.isClosed) {
        controller.addError(e);
        controller.close();
      }
    });

    return controller.stream;
  }

  Future<void> _download(StreamController<double> controller) async {
    final offlineManager = await OfflineManager.create();
    final tileStore = await TileStore.createDefault();

    // Phase 1: download style pack (~30 % of progress)
    final styleCompleter = Completer<void>();
    final styleOptions = StylePackLoadOptions(
      glyphsRasterizationMode:
          GlyphsRasterizationMode.IDEOGRAPHS_RASTERIZED_LOCALLY,
      metadata: {'tag': MapboxConfig.tileRegionId},
      acceptExpired: false,
    );

    offlineManager
        .loadStylePack(MapboxConfig.styleUrl, styleOptions, (progress) {
      if (progress.requiredResourceCount > 0 && !controller.isClosed) {
        final pct =
            progress.completedResourceCount / progress.requiredResourceCount;
        controller.add(pct * 0.3);
      }
    }).then((_) {
      styleCompleter.complete();
    }).catchError((Object e) {
      if (!styleCompleter.isCompleted) styleCompleter.completeError(e);
    });

    await styleCompleter.future;

    // Phase 2: download tile region (~70 % of progress)
    final tileCompleter = Completer<void>();
    final tileOptions = TileRegionLoadOptions(
      geometry: MapboxConfig.boundingBoxGeoJson,
      descriptorsOptions: [
        TilesetDescriptorOptions(
          styleURI: MapboxConfig.styleUrl,
          minZoom: MapboxConfig.minDownloadZoom,
          maxZoom: MapboxConfig.maxDownloadZoom,
        ),
      ],
      acceptExpired: false,
      networkRestriction: NetworkRestriction.NONE,
    );

    tileStore
        .loadTileRegion(MapboxConfig.tileRegionId, tileOptions, (progress) {
      if (progress.requiredResourceCount > 0 && !controller.isClosed) {
        final pct =
            progress.completedResourceCount / progress.requiredResourceCount;
        controller.add(0.3 + pct * 0.7);
      }
    }).then((_) {
      tileCompleter.complete();
    }).catchError((Object e) {
      if (!tileCompleter.isCompleted) tileCompleter.completeError(e);
    });

    await tileCompleter.future;

    // Persist completion flag
    await _db.into(_db.configCache).insertOnConflictUpdate(
          ConfigCacheCompanion.insert(
            key: _cacheKey,
            value: 'true',
            updatedAt: DateTime.now(),
          ),
        );
  }

  @override
  Future<void> deleteTileRegion() async {
    final tileStore = await TileStore.createDefault();
    await tileStore.removeRegion(MapboxConfig.tileRegionId);

    final offlineManager = await OfflineManager.create();
    await offlineManager.removeStylePack(MapboxConfig.styleUrl);

    await (_db.delete(_db.configCache)
          ..where((t) => t.key.equals(_cacheKey)))
        .go();
  }
}
