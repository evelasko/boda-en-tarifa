// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'map_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(offlineTileManager)
final offlineTileManagerProvider = OfflineTileManagerProvider._();

final class OfflineTileManagerProvider
    extends
        $FunctionalProvider<
          OfflineTileManager,
          OfflineTileManager,
          OfflineTileManager
        >
    with $Provider<OfflineTileManager> {
  OfflineTileManagerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'offlineTileManagerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$offlineTileManagerHash();

  @$internal
  @override
  $ProviderElement<OfflineTileManager> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  OfflineTileManager create(Ref ref) {
    return offlineTileManager(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(OfflineTileManager value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<OfflineTileManager>(value),
    );
  }
}

String _$offlineTileManagerHash() =>
    r'27ec24889440e0a1256decd6399422e38d458680';

@ProviderFor(mapTilesReady)
final mapTilesReadyProvider = MapTilesReadyProvider._();

final class MapTilesReadyProvider
    extends $FunctionalProvider<AsyncValue<bool>, bool, FutureOr<bool>>
    with $FutureModifier<bool>, $FutureProvider<bool> {
  MapTilesReadyProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'mapTilesReadyProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$mapTilesReadyHash();

  @$internal
  @override
  $FutureProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<bool> create(Ref ref) {
    return mapTilesReady(ref);
  }
}

String _$mapTilesReadyHash() => r'642e35c5df54e12f60eac2ec8398c5787ccfe558';

/// Resolves the active venue based on the current event (or admin override).
/// Returns null when no event is active.

@ProviderFor(activeVenue)
final activeVenueProvider = ActiveVenueProvider._();

/// Resolves the active venue based on the current event (or admin override).
/// Returns null when no event is active.

final class ActiveVenueProvider
    extends $FunctionalProvider<AsyncValue<Venue?>, Venue?, FutureOr<Venue?>>
    with $FutureModifier<Venue?>, $FutureProvider<Venue?> {
  /// Resolves the active venue based on the current event (or admin override).
  /// Returns null when no event is active.
  ActiveVenueProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'activeVenueProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$activeVenueHash();

  @$internal
  @override
  $FutureProviderElement<Venue?> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<Venue?> create(Ref ref) {
    return activeVenue(ref);
  }
}

String _$activeVenueHash() => r'9081473bfea8c64384a773a5218d67202e5e8496';
