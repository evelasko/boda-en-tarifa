import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../../core/map/mapbox_config.dart';
import '../../../../core/models/venue.dart';
import '../providers/itinerary_providers.dart';
import '../providers/map_providers.dart';
import 'venue_bottom_sheet.dart';

class CustomMapWidget extends ConsumerStatefulWidget {
  const CustomMapWidget({super.key});

  @override
  ConsumerState<CustomMapWidget> createState() => _CustomMapWidgetState();
}

class _CustomMapWidgetState extends ConsumerState<CustomMapWidget> {
  MapboxMap? _mapboxMap;
  PointAnnotationManager? _annotationManager;
  Cancelable? _tapCancelable;
  final Map<String, Venue> _annotationVenueMap = {};
  String? _activeVenueId;

  @override
  void dispose() {
    _tapCancelable?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tilesReady = ref.watch(mapTilesReadyProvider);

    return Stack(
      children: [
        MapWidget(
          key: const ValueKey('wedding-map'),
          styleUri: MapboxConfig.styleUrl,
          cameraOptions: CameraOptions(
            center: Point(
              coordinates: Position(
                MapboxConfig.centerLng,
                MapboxConfig.centerLat,
              ),
            ),
            zoom: MapboxConfig.defaultZoom,
          ),
          onMapCreated: _onMapCreated,
        ),
        tilesReady.when(
          data: (ready) =>
              ready ? const SizedBox.shrink() : const _OfflineBanner(),
          loading: () => const SizedBox.shrink(),
          error: (_, _) => const SizedBox.shrink(),
        ),
      ],
    );
  }

  Future<void> _onMapCreated(MapboxMap mapboxMap) async {
    _mapboxMap = mapboxMap;

    await _enableLocationPuck();
    await _setupAnnotations(mapboxMap);
    await _loadVenueMarkers();

    ref.listenManual(activeVenueProvider, (_, next) {
      final venue = next.asData?.value;
      if (venue?.id != _activeVenueId) {
        _activeVenueId = venue?.id;
        _refreshMarkers();
      }
    });
  }

  Future<void> _enableLocationPuck() async {
    final status = await Permission.locationWhenInUse.request();
    if (!status.isGranted) return;

    await _mapboxMap?.location.updateSettings(
      LocationComponentSettings(
        enabled: true,
        pulsingEnabled: true,
        puckBearingEnabled: true,
        puckBearing: PuckBearing.HEADING,
      ),
    );
  }

  Future<void> _setupAnnotations(MapboxMap mapboxMap) async {
    _annotationManager =
        await mapboxMap.annotations.createPointAnnotationManager();
    _tapCancelable = _annotationManager!.tapEvents(
      onTap: _onMarkerTapped,
    );
  }

  Future<void> _loadVenueMarkers() async {
    final venueMap = ref.read(venueMapProvider).asData?.value;
    if (venueMap == null || venueMap.isEmpty) return;

    final activeVenue = ref.read(activeVenueProvider).asData?.value;
    _activeVenueId = activeVenue?.id;

    for (final venue in venueMap.values) {
      await _addMarker(venue, isActive: venue.id == _activeVenueId);
    }
  }

  Future<void> _addMarker(Venue venue, {required bool isActive}) async {
    if (_annotationManager == null) return;

    final annotation = await _annotationManager!.create(
      PointAnnotationOptions(
        geometry: Point(
          coordinates: Position(venue.longitude, venue.latitude),
        ),
        iconSize: isActive ? 1.4 : 1.0,
        iconColor: isActive
            ? Colors.orange.toARGB32()
            : Colors.red.toARGB32(),
        textField: venue.name,
        textOffset: [0.0, 1.8],
        textSize: isActive ? 13.0 : 11.0,
        textColor: Colors.black.toARGB32(),
        textHaloColor: Colors.white.toARGB32(),
        textHaloWidth: 1.5,
      ),
    );

    _annotationVenueMap[annotation.id] = venue;
  }

  Future<void> _refreshMarkers() async {
    if (_annotationManager == null) return;

    await _annotationManager!.deleteAll();
    _annotationVenueMap.clear();

    await _loadVenueMarkers();
  }

  void _onMarkerTapped(PointAnnotation annotation) {
    final venue = _annotationVenueMap[annotation.id];
    if (venue == null) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => VenueBottomSheet(venue: venue),
    );
  }
}

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: theme.colorScheme.tertiaryContainer,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(
                Icons.cloud_download_outlined,
                size: 20,
                color: theme.colorScheme.onTertiaryContainer,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'El mapa sin conexión se descargará automáticamente.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: theme.colorScheme.onTertiaryContainer,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
