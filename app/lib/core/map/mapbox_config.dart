import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

abstract final class MapboxConfig {
  static const accessToken = String.fromEnvironment(
    'MAPBOX_ACCESS_TOKEN',
  );

  static const styleUrl = String.fromEnvironment(
    'MAPBOX_STYLE_URL',
    defaultValue: MapboxStyles.STANDARD,
  );

  /// Tarifa wedding area bounding box.
  static const southWestLat = 36.06231168085012;
  static const southWestLng = -5.687931082634698;
  static const northEastLat = 36.07091477411134;
  static const northEastLng = -5.6699924687430965;

  static const defaultZoom = 14.0;

  static const centerLat = (southWestLat + northEastLat) / 2;
  static const centerLng = (southWestLng + northEastLng) / 2;

  static const tileRegionId = 'tarifa-wedding';

  static const minDownloadZoom = 10;
  static const maxDownloadZoom = 17;

  static Map<String, Object> get boundingBoxGeoJson => {
        'type': 'Polygon',
        'coordinates': [
          [
            [southWestLng, northEastLat],
            [northEastLng, northEastLat],
            [northEastLng, southWestLat],
            [southWestLng, southWestLat],
            [southWestLng, northEastLat],
          ],
        ],
      };
}
