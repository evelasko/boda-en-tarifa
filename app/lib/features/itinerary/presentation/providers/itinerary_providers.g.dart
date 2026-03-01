// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'itinerary_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(venueMap)
final venueMapProvider = VenueMapProvider._();

final class VenueMapProvider
    extends
        $FunctionalProvider<
          AsyncValue<Map<String, Venue>>,
          Map<String, Venue>,
          FutureOr<Map<String, Venue>>
        >
    with
        $FutureModifier<Map<String, Venue>>,
        $FutureProvider<Map<String, Venue>> {
  VenueMapProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'venueMapProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$venueMapHash();

  @$internal
  @override
  $FutureProviderElement<Map<String, Venue>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<Map<String, Venue>> create(Ref ref) {
    return venueMap(ref);
  }
}

String _$venueMapHash() => r'df99c94d538ac800f2f7f9d65d095720127aed41';

@ProviderFor(groupedSchedules)
final groupedSchedulesProvider = GroupedSchedulesProvider._();

final class GroupedSchedulesProvider
    extends
        $FunctionalProvider<
          AsyncValue<Map<int, List<EventSchedule>>>,
          Map<int, List<EventSchedule>>,
          FutureOr<Map<int, List<EventSchedule>>>
        >
    with
        $FutureModifier<Map<int, List<EventSchedule>>>,
        $FutureProvider<Map<int, List<EventSchedule>>> {
  GroupedSchedulesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'groupedSchedulesProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$groupedSchedulesHash();

  @$internal
  @override
  $FutureProviderElement<Map<int, List<EventSchedule>>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<Map<int, List<EventSchedule>>> create(Ref ref) {
    return groupedSchedules(ref);
  }
}

String _$groupedSchedulesHash() => r'50609b894f438256a8af3c67248f36862a450dfb';

/// Re-evaluates every 60 seconds to keep the "active event" highlight current.

@ProviderFor(CurrentEventId)
final currentEventIdProvider = CurrentEventIdProvider._();

/// Re-evaluates every 60 seconds to keep the "active event" highlight current.
final class CurrentEventIdProvider
    extends $NotifierProvider<CurrentEventId, String?> {
  /// Re-evaluates every 60 seconds to keep the "active event" highlight current.
  CurrentEventIdProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'currentEventIdProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$currentEventIdHash();

  @$internal
  @override
  CurrentEventId create() => CurrentEventId();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(String? value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<String?>(value),
    );
  }
}

String _$currentEventIdHash() => r'9372178151ef256972e624f04a7f8d15cda07acb';

/// Re-evaluates every 60 seconds to keep the "active event" highlight current.

abstract class _$CurrentEventId extends $Notifier<String?> {
  String? build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<String?, String?>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<String?, String?>,
              String?,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
