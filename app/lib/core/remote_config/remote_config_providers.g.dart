// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'remote_config_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(eventSchedules)
final eventSchedulesProvider = EventSchedulesProvider._();

final class EventSchedulesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<EventSchedule>>,
          List<EventSchedule>,
          FutureOr<List<EventSchedule>>
        >
    with
        $FutureModifier<List<EventSchedule>>,
        $FutureProvider<List<EventSchedule>> {
  EventSchedulesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'eventSchedulesProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$eventSchedulesHash();

  @$internal
  @override
  $FutureProviderElement<List<EventSchedule>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<EventSchedule>> create(Ref ref) {
    return eventSchedules(ref);
  }
}

String _$eventSchedulesHash() => r'ff1c62b33a6f8f2fea7e60d41724632011b024f7';

@ProviderFor(venues)
final venuesProvider = VenuesProvider._();

final class VenuesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Venue>>,
          List<Venue>,
          FutureOr<List<Venue>>
        >
    with $FutureModifier<List<Venue>>, $FutureProvider<List<Venue>> {
  VenuesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'venuesProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$venuesHash();

  @$internal
  @override
  $FutureProviderElement<List<Venue>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Venue>> create(Ref ref) {
    return venues(ref);
  }
}

String _$venuesHash() => r'92077b41f2ed7e0cf9ef3b7699116653a023ca47';

@ProviderFor(timeGates)
final timeGatesProvider = TimeGatesProvider._();

final class TimeGatesProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<TimeGatedContent>>,
          List<TimeGatedContent>,
          FutureOr<List<TimeGatedContent>>
        >
    with
        $FutureModifier<List<TimeGatedContent>>,
        $FutureProvider<List<TimeGatedContent>> {
  TimeGatesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'timeGatesProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$timeGatesHash();

  @$internal
  @override
  $FutureProviderElement<List<TimeGatedContent>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<TimeGatedContent>> create(Ref ref) {
    return timeGates(ref);
  }
}

String _$timeGatesHash() => r'd3e3385c9fed3ce3988050a301bc3190b0c3b3c3';

@ProviderFor(seatingAssignments)
final seatingAssignmentsProvider = SeatingAssignmentsProvider._();

final class SeatingAssignmentsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<SeatingAssignment>>,
          List<SeatingAssignment>,
          FutureOr<List<SeatingAssignment>>
        >
    with
        $FutureModifier<List<SeatingAssignment>>,
        $FutureProvider<List<SeatingAssignment>> {
  SeatingAssignmentsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'seatingAssignmentsProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$seatingAssignmentsHash();

  @$internal
  @override
  $FutureProviderElement<List<SeatingAssignment>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<SeatingAssignment>> create(Ref ref) {
    return seatingAssignments(ref);
  }
}

String _$seatingAssignmentsHash() =>
    r'bfb25becf092eb2c88782cd9751a7cb7831b29bc';

@ProviderFor(quickContacts)
final quickContactsProvider = QuickContactsProvider._();

final class QuickContactsProvider
    extends
        $FunctionalProvider<
          AsyncValue<QuickContacts>,
          QuickContacts,
          FutureOr<QuickContacts>
        >
    with $FutureModifier<QuickContacts>, $FutureProvider<QuickContacts> {
  QuickContactsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'quickContactsProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$quickContactsHash();

  @$internal
  @override
  $FutureProviderElement<QuickContacts> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<QuickContacts> create(Ref ref) {
    return quickContacts(ref);
  }
}

String _$quickContactsHash() => r'cd7df1e859736fd557af0fc1c082c2087ccfdf62';

@ProviderFor(windTips)
final windTipsProvider = WindTipsProvider._();

final class WindTipsProvider
    extends
        $FunctionalProvider<
          AsyncValue<Map<String, List<String>>>,
          Map<String, List<String>>,
          FutureOr<Map<String, List<String>>>
        >
    with
        $FutureModifier<Map<String, List<String>>>,
        $FutureProvider<Map<String, List<String>>> {
  WindTipsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'windTipsProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$windTipsHash();

  @$internal
  @override
  $FutureProviderElement<Map<String, List<String>>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<Map<String, List<String>>> create(Ref ref) {
    return windTips(ref);
  }
}

String _$windTipsHash() => r'6d7cb083fd9a43900383fa1c739a3e9b7acb8515';

@ProviderFor(developmentTriggerTime)
final developmentTriggerTimeProvider = DevelopmentTriggerTimeProvider._();

final class DevelopmentTriggerTimeProvider
    extends
        $FunctionalProvider<AsyncValue<DateTime>, DateTime, FutureOr<DateTime>>
    with $FutureModifier<DateTime>, $FutureProvider<DateTime> {
  DevelopmentTriggerTimeProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'developmentTriggerTimeProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$developmentTriggerTimeHash();

  @$internal
  @override
  $FutureProviderElement<DateTime> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<DateTime> create(Ref ref) {
    return developmentTriggerTime(ref);
  }
}

String _$developmentTriggerTimeHash() =>
    r'1438faf87ac951c675ed4dcfbdff14a452b48997';
