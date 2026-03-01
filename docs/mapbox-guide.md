# Mapbox Custom Map — Implementation Guide

> **SDK:** `mapbox_maps_flutter` v2.19.1
> **Docs:** https://docs.mapbox.com/flutter/maps/
> **Flutter SDK:** 3.22.3+ / Dart 3.4.4+
> **Android minSdk:** 21

This guide walks through building the custom wedding map: a styled Mapbox map showing venue markers, the user's live location (blue dot), walking directions, and offline tile support for Tarifa's spotty connectivity.

---

## Table of Contents

1. [Account & Token Setup](#1-account--token-setup)
2. [Installation & Platform Config](#2-installation--platform-config)
3. [Basic Map Widget](#3-basic-map-widget)
4. [Custom Map Style (Mapbox Studio)](#4-custom-map-style-mapbox-studio)
5. [Camera & Initial Position](#5-camera--initial-position)
6. [Custom Venue Markers (Point Annotations)](#6-custom-venue-markers-point-annotations)
7. [Marker Tap Interaction](#7-marker-tap-interaction)
8. [User Location (Blue Dot)](#8-user-location-blue-dot)
9. [Directions & Route Lines](#9-directions--route-lines)
10. [Offline Map Support](#10-offline-map-support)
11. [Putting It All Together](#11-putting-it-all-together)

---

## 1. Account & Token Setup

### Create your Mapbox account

1. Sign up at https://account.mapbox.com/auth/signup/
2. Go to **Account → Tokens** (https://account.mapbox.com/access-tokens/)
3. Your **Default public token** (`pk.xxx`) is sufficient for map rendering

### Secret token (for SDK download — required)

The `mapbox_maps_flutter` package is distributed via Mapbox's private registry. You need a **secret token** with the `Downloads:Read` scope:

1. On the Tokens page, click **Create a token**
2. Name it (e.g., `flutter-sdk-download`)
3. Under **Secret scopes**, check `Downloads:Read`
4. Click **Create token** and copy the `sk.xxx` value — you'll only see it once

### Configure the secret token

**For Android** — create or edit `~/.gradle/gradle.properties`:
```properties
SDK_REGISTRY_TOKEN=sk.your_secret_token_here
```

**For iOS** — create or edit `~/.netrc`:
```
machine api.mapbox.com
  login mapbox
  password sk.your_secret_token_here
```
Set permissions: `chmod 0600 ~/.netrc`

### Store your public token

The project uses `flutter_dotenv`. Add your public token to `app/.env`:
```
MAPBOX_ACCESS_TOKEN=pk.your_public_token_here
```

The `.env.example` already has a placeholder for this.

---

## 2. Installation & Platform Config

### pubspec.yaml (already configured)

```yaml
dependencies:
  mapbox_maps_flutter: ^2.19.1
```

### Android setup

**`app/android/app/build.gradle`** — ensure minSdk is 21+:
```groovy
android {
    defaultConfig {
        minSdkVersion 21
    }
}
```

**`app/android/app/src/main/AndroidManifest.xml`** — add location permissions:
```xml
<manifest>
    <!-- Coarse is sufficient for map display; Fine for GPS accuracy -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <application ...>
        <!-- ... -->
    </application>
</manifest>
```

**`app/android/build.gradle`** (project-level) — add the Mapbox Maven repository:
```groovy
allprojects {
    repositories {
        google()
        mavenCentral()
        maven {
            url 'https://api.mapbox.com/downloads/v2/releases/maven'
            authentication {
                basic(BasicAuthentication)
            }
            credentials {
                username = "mapbox"
                password = project.properties['SDK_REGISTRY_TOKEN'] ?: ""
            }
        }
    }
}
```

### iOS setup

**`app/ios/Runner/Info.plist`** — add location usage description:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show where you are relative to wedding venues.</string>
```

---

## 3. Basic Map Widget

### Initialize the SDK in `main.dart`

```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load();

  // Set the access token globally before any map widget is created
  MapboxOptions.setAccessToken(dotenv.env['MAPBOX_ACCESS_TOKEN']!);

  runApp(const MyApp());
}
```

### Minimal MapWidget

```dart
import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class WeddingMap extends StatefulWidget {
  const WeddingMap({super.key});

  @override
  State<WeddingMap> createState() => _WeddingMapState();
}

class _WeddingMapState extends State<WeddingMap> {
  MapboxMap? mapboxMap;

  void _onMapCreated(MapboxMap map) {
    mapboxMap = map;
  }

  @override
  Widget build(BuildContext context) {
    return MapWidget(
      key: const ValueKey('wedding-map'),
      onMapCreated: _onMapCreated,
      cameraOptions: CameraOptions(
        center: Point(coordinates: Position(-5.6050, 36.0140)), // Tarifa center
        zoom: 14.0,
      ),
    );
  }
}
```

---

## 4. Custom Map Style (Mapbox Studio)

The architecture spec calls for a custom-illustrated map overlay. There are two approaches:

### Option A: Custom Style in Mapbox Studio (recommended)

1. Go to https://studio.mapbox.com/
2. Click **New style** → pick a base (e.g., `Light`, `Outdoors`)
3. Customize colors, fonts, labels, and layers to match the wedding aesthetic
4. Optionally add a **Raster source** (Image Overlay) with your custom illustration:
   - Upload your illustrated map image
   - Position it over the Tarifa coordinates using corner anchors
5. **Publish** the style and copy the style URL: `mapbox://styles/your-username/your-style-id`

### Option B: Use a built-in style

```dart
MapWidget(
  styleUri: MapboxStyles.OUTDOORS,  // or LIGHT, DARK, SATELLITE_STREETS, etc.
  // ...
)
```

### Using a custom style URL

```dart
MapWidget(
  styleUri: 'mapbox://styles/your-username/your-style-id',
  cameraOptions: CameraOptions(
    center: Point(coordinates: Position(-5.6050, 36.0140)),
    zoom: 14.0,
  ),
  onMapCreated: _onMapCreated,
)
```

### Adding a custom image overlay programmatically

If you want to overlay an illustrated map image at runtime:

```dart
void _onStyleLoaded(StyleLoadedEventData data) async {
  // Add the image source
  await mapboxMap?.style.addSource(ImageSource(
    id: 'wedding-illustration',
    url: 'https://your-cdn.com/wedding-map-illustration.png',
    coordinates: [
      [-5.6200, 36.0250], // top-left [lng, lat]
      [-5.5900, 36.0250], // top-right
      [-5.5900, 36.0000], // bottom-right
      [-5.6200, 36.0000], // bottom-left
    ],
  ));

  // Add a raster layer to display it
  await mapboxMap?.style.addLayer(RasterLayer(
    id: 'wedding-illustration-layer',
    sourceId: 'wedding-illustration',
    rasterOpacity: 0.85,
  ));
}
```

---

## 5. Camera & Initial Position

### Tarifa wedding area coordinates

```dart
// Center of the wedding area
const tarifaCenter = Position(-5.6050, 36.0140);

// Venue coordinates from venues.json
const chiringuito = Position(-5.6080, 36.0125);  // Chiringuito El Mirante
const playa       = Position(-5.6120, 36.0100);  // Playa de los Lances
const finca       = Position(-5.5980, 36.0200);  // Finca La Tarifa
```

### Set initial camera

```dart
CameraOptions(
  center: Point(coordinates: tarifaCenter),
  zoom: 13.5,       // Shows all 3 venues comfortably
  bearing: 0,       // North up
  pitch: 0,         // Top-down view (set 30-60 for tilted/3D feel)
)
```

### Animate camera to a venue

```dart
Future<void> flyToVenue(Venue venue) async {
  await mapboxMap?.flyTo(
    CameraOptions(
      center: Point(coordinates: Position(venue.longitude, venue.latitude)),
      zoom: 16.0,
      pitch: 45.0,
    ),
    MapAnimationOptions(duration: 1500), // 1.5 seconds
  );
}
```

### Fit camera to show all venues

```dart
Future<void> showAllVenues(List<Venue> venues) async {
  final coordinates = venues
      .map((v) => Point(coordinates: Position(v.longitude, v.latitude)))
      .toList();

  final camera = await mapboxMap?.cameraForCoordinates(
    coordinates.map((p) => p.toJson()).toList(),
    MbxEdgeInsets(top: 80, left: 40, bottom: 80, right: 40),
    null, // bearing
    null, // pitch
  );

  if (camera != null) {
    await mapboxMap?.flyTo(camera, MapAnimationOptions(duration: 1000));
  }
}
```

---

## 6. Custom Venue Markers (Point Annotations)

### Prepare marker assets

Place your custom marker PNGs in `app/assets/markers/`:
```
assets/markers/
├── marker-chiringuito.png   (e.g., cocktail glass icon)
├── marker-playa.png         (e.g., beach icon)
├── marker-finca.png         (e.g., house/celebration icon)
└── marker-default.png       (fallback)
```

Register them in `pubspec.yaml`:
```yaml
flutter:
  assets:
    - assets/markers/
```

### Add venue markers

```dart
import 'dart:typed_data';
import 'package:flutter/services.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class VenueMarkerManager {
  PointAnnotationManager? _annotationManager;
  final Map<String, PointAnnotation> _annotations = {};

  Future<void> initialize(MapboxMap mapboxMap) async {
    _annotationManager =
        await mapboxMap.annotations.createPointAnnotationManager();
  }

  Future<void> addVenueMarkers(List<Venue> venues) async {
    if (_annotationManager == null) return;

    for (final venue in venues) {
      final markerAsset = _markerAssetForVenue(venue.id);
      final ByteData bytes = await rootBundle.load(markerAsset);
      final Uint8List imageData = bytes.buffer.asUint8List();

      final options = PointAnnotationOptions(
        geometry: Point(
          coordinates: Position(venue.longitude, venue.latitude),
        ),
        image: imageData,
        iconSize: 1.0,
        iconAnchor: IconAnchor.BOTTOM,
        // Optional: add a text label below the marker
        textField: venue.name,
        textOffset: [0, 1.5],
        textSize: 12.0,
        textColor: Colors.black.value,
      );

      final annotation = await _annotationManager!.create(options);
      _annotations[venue.id] = annotation;
    }
  }

  String _markerAssetForVenue(String venueId) {
    switch (venueId) {
      case 'chiringuito':
        return 'assets/markers/marker-chiringuito.png';
      case 'playa':
        return 'assets/markers/marker-playa.png';
      case 'finca':
        return 'assets/markers/marker-finca.png';
      default:
        return 'assets/markers/marker-default.png';
    }
  }

  void dispose() {
    _annotationManager = null;
    _annotations.clear();
  }
}
```

### Add multiple markers at once (better performance)

```dart
Future<void> addVenueMarkersBatch(List<Venue> venues) async {
  if (_annotationManager == null) return;

  final Uint8List defaultIcon = await _loadImage('assets/markers/marker-default.png');

  final options = venues.map((venue) {
    return PointAnnotationOptions(
      geometry: Point(
        coordinates: Position(venue.longitude, venue.latitude),
      ),
      image: defaultIcon,
      iconSize: 1.0,
      iconAnchor: IconAnchor.BOTTOM,
    );
  }).toList();

  await _annotationManager!.createMulti(options);
}

Future<Uint8List> _loadImage(String assetPath) async {
  final bytes = await rootBundle.load(assetPath);
  return bytes.buffer.asUint8List();
}
```

---

## 7. Marker Tap Interaction

### Listen for annotation clicks

```dart
class VenueAnnotationClickListener extends OnPointAnnotationClickListener {
  final void Function(PointAnnotation annotation) onTap;

  VenueAnnotationClickListener({required this.onTap});

  @override
  void onPointAnnotationClick(PointAnnotation annotation) {
    onTap(annotation);
  }
}
```

### Wire it up

```dart
Future<void> initialize(MapboxMap mapboxMap) async {
  _annotationManager =
      await mapboxMap.annotations.createPointAnnotationManager();

  _annotationManager!.addOnPointAnnotationClickListener(
    VenueAnnotationClickListener(
      onTap: (annotation) {
        // Find which venue was tapped by matching coordinates
        final tappedVenue = _findVenueByAnnotation(annotation);
        if (tappedVenue != null) {
          _showVenueBottomSheet(tappedVenue);
        }
      },
    ),
  );
}

Venue? _findVenueByAnnotation(PointAnnotation annotation) {
  final coords = annotation.geometry?.coordinates;
  if (coords == null) return null;

  for (final entry in _venueMap.entries) {
    final venue = entry.value;
    if ((venue.latitude - coords.lat).abs() < 0.0001 &&
        (venue.longitude - coords.lng).abs() < 0.0001) {
      return venue;
    }
  }
  return null;
}
```

### Venue bottom sheet

```dart
void _showVenueBottomSheet(BuildContext context, Venue venue) {
  showModalBottomSheet(
    context: context,
    builder: (ctx) => Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(venue.name, style: Theme.of(ctx).textTheme.titleLarge),
          if (venue.walkingDirections != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.directions_walk, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(venue.walkingDirections!)),
              ],
            ),
          ],
          if (venue.terrainNote != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.terrain, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text(venue.terrainNote!)),
              ],
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.navigation),
              label: const Text('Como llegar'),
              onPressed: () => _openInNativeMaps(venue),
            ),
          ),
        ],
      ),
    ),
  );
}
```

### "Como llegar" — open native maps

```dart
import 'dart:io';
import 'package:url_launcher/url_launcher.dart';

Future<void> _openInNativeMaps(Venue venue) async {
  final lat = venue.latitude;
  final lng = venue.longitude;
  final label = Uri.encodeComponent(venue.name);

  final Uri url;
  if (Platform.isIOS) {
    // Apple Maps
    url = Uri.parse('https://maps.apple.com/?daddr=$lat,$lng&dirflg=w&q=$label');
  } else {
    // Google Maps
    url = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=walking');
  }

  if (await canLaunchUrl(url)) {
    await launchUrl(url, mode: LaunchMode.externalApplication);
  }
}
```

---

## 8. User Location (Blue Dot)

### Request permissions first

Use the `geolocator` or `permission_handler` package to request location permission before enabling the puck.

```yaml
# pubspec.yaml
dependencies:
  geolocator: ^13.0.2       # or latest
  permission_handler: ^11.4.0  # or latest
```

### Request permission

```dart
import 'package:geolocator/geolocator.dart';

Future<bool> requestLocationPermission() async {
  bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) return false;

  LocationPermission permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied) return false;
  }
  if (permission == LocationPermission.deniedForever) return false;

  return true;
}
```

### Enable the 2D location puck (blue dot)

```dart
Future<void> enableLocationPuck(MapboxMap mapboxMap) async {
  final hasPermission = await requestLocationPermission();
  if (!hasPermission) return;

  // Enable the default 2D blue dot puck
  await mapboxMap.location.updateSettings(
    LocationComponentSettings(
      enabled: true,
      pulsingEnabled: true,        // Pulsing ring effect
      puckBearingEnabled: true,    // Rotate puck with device heading
      puckBearing: PuckBearing.HEADING,
    ),
  );
}
```

### Use a 3D model puck (optional, fun for a wedding)

```dart
await mapboxMap.location.updateSettings(
  LocationComponentSettings(
    enabled: true,
    puckBearingEnabled: true,
    puckBearing: PuckBearing.HEADING,
    locationPuck: LocationPuck(
      locationPuck3D: LocationPuck3D(
        modelUri:
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Embedded/Duck.gltf',
        modelScale: [15, 15, 15],
      ),
    ),
  ),
);
```

### Get user's current position (for camera centering)

```dart
Future<Position?> getUserPosition(MapboxMap mapboxMap) async {
  // Method 1: Use Geolocator directly
  final pos = await Geolocator.getCurrentPosition();
  return Position(pos.longitude, pos.latitude);
}
```

### "Center on me" button

```dart
FloatingActionButton(
  onPressed: () async {
    final pos = await Geolocator.getCurrentPosition();
    await mapboxMap?.flyTo(
      CameraOptions(
        center: Point(coordinates: Position(pos.longitude, pos.latitude)),
        zoom: 15.0,
      ),
      MapAnimationOptions(duration: 800),
    );
  },
  child: const Icon(Icons.my_location),
)
```

---

## 9. Directions & Route Lines

For walking directions between the user's location and a venue, you have two approaches:

### Option A: Mapbox Directions API + draw a polyline (in-app route)

Call the Directions API from your app, decode the geometry, and draw it on the map.

**API endpoint:**
```
GET https://api.mapbox.com/directions/v5/mapbox/walking/{lng1},{lat1};{lng2},{lat2}
    ?geometries=geojson
    &overview=full
    &access_token=YOUR_TOKEN
```

**Fetch the route:**
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<List<Position>> fetchWalkingRoute({
  required Position origin,
  required Position destination,
  required String accessToken,
}) async {
  final url = Uri.parse(
    'https://api.mapbox.com/directions/v5/mapbox/walking/'
    '${origin.lng},${origin.lat};${destination.lng},${destination.lat}'
    '?geometries=geojson&overview=full&access_token=$accessToken',
  );

  final response = await http.get(url);
  if (response.statusCode != 200) {
    throw Exception('Directions API error: ${response.statusCode}');
  }

  final data = jsonDecode(response.body);
  final route = data['routes'][0];
  final coordinates = route['geometry']['coordinates'] as List;

  // Also available: route['duration'] (seconds), route['distance'] (meters)

  return coordinates
      .map<Position>((c) => Position(c[0] as double, c[1] as double))
      .toList();
}
```

**Draw the route as a GeoJSON line layer:**
```dart
Future<void> drawRoute(MapboxMap mapboxMap, List<Position> routeCoords) async {
  final geoJson = {
    'type': 'Feature',
    'geometry': {
      'type': 'LineString',
      'coordinates': routeCoords.map((p) => [p.lng, p.lat]).toList(),
    },
    'properties': {},
  };

  // Remove old route if exists
  try {
    await mapboxMap.style.removeStyleLayer('route-layer');
    await mapboxMap.style.removeStyleSource('route-source');
  } catch (_) {}

  // Add the GeoJSON source
  await mapboxMap.style.addSource(
    GeoJsonSource(id: 'route-source', data: jsonEncode(geoJson)),
  );

  // Add a line layer
  await mapboxMap.style.addLayer(
    LineLayer(
      id: 'route-layer',
      sourceId: 'route-source',
      lineColor: Colors.blue.value,
      lineWidth: 4.0,
      lineOpacity: 0.8,
      lineCap: LineCap.ROUND,
      lineJoin: LineJoin.ROUND,
    ),
  );
}
```

**Clear the route:**
```dart
Future<void> clearRoute(MapboxMap mapboxMap) async {
  try {
    await mapboxMap.style.removeStyleLayer('route-layer');
    await mapboxMap.style.removeStyleSource('route-source');
  } catch (_) {}
}
```

### Option B: Launch native maps (fallback — from architecture spec)

This is the simpler approach and the documented fallback. See the `_openInNativeMaps()` method in [Section 7](#7-marker-tap-interaction). It hands off navigation to Apple Maps or Google Maps.

### Walking time display

```dart
Future<String> getWalkingTime(Position origin, Position destination, String token) async {
  final url = Uri.parse(
    'https://api.mapbox.com/directions/v5/mapbox/walking/'
    '${origin.lng},${origin.lat};${destination.lng},${destination.lat}'
    '?access_token=$token',
  );

  final response = await http.get(url);
  final data = jsonDecode(response.body);
  final durationSeconds = data['routes'][0]['duration'] as double;
  final minutes = (durationSeconds / 60).ceil();
  return '$minutes min a pie';
}
```

---

## 10. Offline Map Support

Tarifa has poor cell service, so downloading map tiles during onboarding is critical.

### Concepts

- **Style Pack**: All non-tile resources (fonts, sprites, style JSON). ~2-5 MB per style.
- **Tile Region**: Actual map tiles for a geographic area + zoom range. Size depends on area/zoom.
- **TileStore**: Local database storing downloaded tiles.
- **OfflineManager**: Coordinates downloads of style packs and tile regions.

### Define the Tarifa region

```dart
// Bounding box covering all wedding venues + surroundings
// Generous enough to cover walking routes in Tarifa
final tarifaBounds = {
  'type': 'Polygon',
  'coordinates': [
    [
      [-5.6300, 36.0300], // NW
      [-5.5800, 36.0300], // NE
      [-5.5800, 35.9950], // SE
      [-5.6300, 35.9950], // SW
      [-5.6300, 36.0300], // close polygon
    ]
  ],
};
```

### Download tiles for offline use

```dart
import 'dart:async';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class OfflineMapService {
  TileStore? _tileStore;
  OfflineManager? _offlineManager;

  static const _tileRegionId = 'tarifa-wedding';
  static const _styleUri = MapboxStyles.OUTDOORS; // or your custom style URL

  /// Initialize the offline manager and tile store
  Future<void> initialize() async {
    _offlineManager = await OfflineManager.create();
    _tileStore = await TileStore.createDefault();
    // Reset disk quota to default (250 MB)
    _tileStore?.setDiskQuota(null);
  }

  /// Download the style pack (fonts, sprites, icons)
  Stream<double> downloadStylePack() {
    final controller = StreamController<double>.broadcast();

    final options = StylePackLoadOptions(
      glyphsRasterizationMode:
          GlyphsRasterizationMode.IDEOGRAPHS_RASTERIZED_LOCALLY,
      metadata: {'tag': 'tarifa-wedding'},
      acceptExpired: false,
    );

    _offlineManager?.loadStylePack(_styleUri, options, (progress) {
      final pct =
          progress.completedResourceCount / progress.requiredResourceCount;
      if (!controller.isClosed) {
        controller.add(pct);
      }
    }).then((_) {
      controller.close();
    });

    return controller.stream;
  }

  /// Download map tiles for the Tarifa area
  Stream<double> downloadTileRegion() {
    final controller = StreamController<double>.broadcast();

    final options = TileRegionLoadOptions(
      geometry: tarifaBounds,
      descriptorsOptions: [
        TilesetDescriptorOptions(
          styleURI: _styleUri,
          minZoom: 10,   // Zoomed-out overview
          maxZoom: 17,   // Street-level detail
        ),
      ],
      acceptExpired: false,
      networkRestriction: NetworkRestriction.NONE,
    );

    _tileStore?.loadTileRegion(_tileRegionId, options, (progress) {
      final pct =
          progress.completedResourceCount / progress.requiredResourceCount;
      if (!controller.isClosed) {
        controller.add(pct);
      }
    }).then((_) {
      controller.close();
    });

    return controller.stream;
  }

  /// Check if tiles are already downloaded
  Future<bool> isRegionDownloaded() async {
    try {
      final regions = await _tileStore?.allTileRegions();
      return regions?.any((r) => r.id == _tileRegionId) ?? false;
    } catch (_) {
      return false;
    }
  }

  /// Remove downloaded tiles (cleanup)
  Future<void> removeTileRegion() async {
    await _tileStore?.removeTileRegion(_tileRegionId);
    await _offlineManager?.removeStylePack(_styleUri);
  }

  void dispose() {
    _tileStore = null;
    _offlineManager = null;
  }
}
```

### Integrate into onboarding flow

```dart
class OnboardingMapDownloadStep extends ConsumerStatefulWidget {
  // ...
}

class _OnboardingMapDownloadStepState
    extends ConsumerState<OnboardingMapDownloadStep> {
  final _offlineService = OfflineMapService();
  double _progress = 0.0;
  bool _isDownloading = false;
  bool _isComplete = false;

  @override
  void initState() {
    super.initState();
    _offlineService.initialize().then((_) => _checkExisting());
  }

  Future<void> _checkExisting() async {
    final exists = await _offlineService.isRegionDownloaded();
    if (exists) setState(() => _isComplete = true);
  }

  Future<void> _startDownload() async {
    setState(() => _isDownloading = true);

    // Download style pack first, then tiles
    await for (final pct in _offlineService.downloadStylePack()) {
      setState(() => _progress = pct * 0.3); // 30% of total
    }
    await for (final pct in _offlineService.downloadTileRegion()) {
      setState(() => _progress = 0.3 + pct * 0.7); // remaining 70%
    }

    setState(() {
      _isDownloading = false;
      _isComplete = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.download_for_offline, size: 64),
        const SizedBox(height: 16),
        const Text('Descargando mapa para uso offline'),
        const SizedBox(height: 24),
        if (_isDownloading)
          LinearProgressIndicator(value: _progress)
        else if (_isComplete)
          const Text('Mapa descargado')
        else
          ElevatedButton(
            onPressed: _startDownload,
            child: const Text('Descargar mapa'),
          ),
      ],
    );
  }

  @override
  void dispose() {
    _offlineService.dispose();
    super.dispose();
  }
}
```

---

## 11. Putting It All Together

Here's the complete `MapScreen` widget bringing all pieces together:

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:boda_en_tarifa/core/models/venue.dart';
import 'package:boda_en_tarifa/features/itinerary/presentation/providers/itinerary_providers.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen> {
  MapboxMap? _mapboxMap;
  PointAnnotationManager? _annotationManager;
  final Map<String, Venue> _markerVenueMap = {};

  // Tarifa center
  static const _tarifaCenter = Position(-5.6050, 36.0140);

  void _onMapCreated(MapboxMap mapboxMap) async {
    _mapboxMap = mapboxMap;

    // 1. Enable user location (blue dot)
    await _enableLocation();

    // 2. Create annotation manager and add venue markers
    _annotationManager =
        await mapboxMap.annotations.createPointAnnotationManager();
    _annotationManager!.addOnPointAnnotationClickListener(
      _VenueClickListener(onTap: _onMarkerTapped),
    );

    // 3. Load venues and add markers
    final venues = ref.read(venueMapProvider).valueOrNull?.values.toList();
    if (venues != null) {
      await _addVenueMarkers(venues);
    }
  }

  Future<void> _enableLocation() async {
    final hasPermission = await _requestLocationPermission();
    if (!hasPermission) return;

    await _mapboxMap?.location.updateSettings(
      LocationComponentSettings(
        enabled: true,
        pulsingEnabled: true,
        puckBearingEnabled: true,
        puckBearing: PuckBearing.HEADING,
      ),
    );
  }

  Future<bool> _requestLocationPermission() async {
    if (!await Geolocator.isLocationServiceEnabled()) return false;
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always;
  }

  Future<void> _addVenueMarkers(List<Venue> venues) async {
    final defaultIcon = await _loadAssetImage('assets/markers/marker-default.png');

    for (final venue in venues) {
      final annotation = await _annotationManager!.create(
        PointAnnotationOptions(
          geometry: Point(
            coordinates: Position(venue.longitude, venue.latitude),
          ),
          image: defaultIcon,
          iconSize: 1.0,
          iconAnchor: IconAnchor.BOTTOM,
        ),
      );
      _markerVenueMap[annotation.id] = venue;
    }
  }

  Future<Uint8List> _loadAssetImage(String path) async {
    final bytes = await rootBundle.load(path);
    return bytes.buffer.asUint8List();
  }

  void _onMarkerTapped(PointAnnotation annotation) {
    final venue = _markerVenueMap[annotation.id];
    if (venue == null) return;

    showModalBottomSheet(
      context: context,
      builder: (ctx) => _VenueSheet(
        venue: venue,
        onDirections: () => _openNativeMaps(venue),
      ),
    );
  }

  Future<void> _openNativeMaps(Venue venue) async {
    final label = Uri.encodeComponent(venue.name);
    final Uri url;
    if (Platform.isIOS) {
      url = Uri.parse(
          'https://maps.apple.com/?daddr=${venue.latitude},${venue.longitude}&dirflg=w&q=$label');
    } else {
      url = Uri.parse(
          'https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}&travelmode=walking');
    }
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _centerOnUser() async {
    try {
      final pos = await Geolocator.getCurrentPosition();
      await _mapboxMap?.flyTo(
        CameraOptions(
          center: Point(coordinates: Position(pos.longitude, pos.latitude)),
          zoom: 15.0,
        ),
        MapAnimationOptions(duration: 800),
      );
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          MapWidget(
            key: const ValueKey('wedding-map'),
            styleUri: MapboxStyles.OUTDOORS,
            cameraOptions: CameraOptions(
              center: Point(coordinates: _tarifaCenter),
              zoom: 13.5,
            ),
            onMapCreated: _onMapCreated,
          ),
          Positioned(
            bottom: 24,
            right: 16,
            child: FloatingActionButton(
              mini: true,
              onPressed: _centerOnUser,
              child: const Icon(Icons.my_location),
            ),
          ),
        ],
      ),
    );
  }
}

// --- Supporting classes ---

class _VenueClickListener extends OnPointAnnotationClickListener {
  final void Function(PointAnnotation) onTap;
  _VenueClickListener({required this.onTap});

  @override
  void onPointAnnotationClick(PointAnnotation annotation) => onTap(annotation);
}

class _VenueSheet extends StatelessWidget {
  final Venue venue;
  final VoidCallback onDirections;

  const _VenueSheet({required this.venue, required this.onDirections});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(venue.name, style: Theme.of(context).textTheme.titleLarge),
          if (venue.walkingDirections != null) ...[
            const SizedBox(height: 12),
            Row(children: [
              const Icon(Icons.directions_walk, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(venue.walkingDirections!)),
            ]),
          ],
          if (venue.terrainNote != null) ...[
            const SizedBox(height: 8),
            Row(children: [
              const Icon(Icons.terrain, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(venue.terrainNote!)),
            ]),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.navigation),
              label: const Text('Como llegar'),
              onPressed: onDirections,
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## Quick Reference

| What | API / Class |
|---|---|
| Map widget | `MapWidget(cameraOptions:, styleUri:, onMapCreated:)` |
| Map controller | `MapboxMap` (from `onMapCreated` callback) |
| Set access token | `MapboxOptions.setAccessToken(token)` |
| Camera animate | `mapboxMap.flyTo(CameraOptions(...), MapAnimationOptions(...))` |
| Camera fit bounds | `mapboxMap.cameraForCoordinates(...)` |
| Point markers | `mapboxMap.annotations.createPointAnnotationManager()` |
| Marker click | `annotationManager.addOnPointAnnotationClickListener(...)` |
| User location | `mapboxMap.location.updateSettings(LocationComponentSettings(...))` |
| GeoJSON source | `mapboxMap.style.addSource(GeoJsonSource(...))` |
| Line layer | `mapboxMap.style.addLayer(LineLayer(...))` |
| Offline tiles | `TileStore.createDefault()` → `tileStore.loadTileRegion(...)` |
| Offline styles | `OfflineManager.create()` → `offlineManager.loadStylePack(...)` |
| Built-in styles | `MapboxStyles.OUTDOORS`, `.LIGHT`, `.DARK`, `.SATELLITE_STREETS` |
| Directions API | `GET https://api.mapbox.com/directions/v5/mapbox/walking/...` |

---

## References

- Official docs: https://docs.mapbox.com/flutter/maps/
- Package on pub.dev: https://pub.dev/packages/mapbox_maps_flutter
- Example app (GitHub): https://github.com/mapbox/mapbox-maps-flutter/tree/main/example
- Annotations guide: https://docs.mapbox.com/flutter/maps/guides/markers-and-annotations/annotations/
- User location guide: https://docs.mapbox.com/flutter/maps/guides/user-location/
- Offline example: https://docs.mapbox.com/flutter/maps/examples/offline/
- Directions API: https://docs.mapbox.com/api/navigation/directions/
- Mapbox Studio: https://studio.mapbox.com/
