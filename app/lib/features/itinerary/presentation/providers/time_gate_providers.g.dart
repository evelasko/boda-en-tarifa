// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'time_gate_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(timeGateStates)
final timeGateStatesProvider = TimeGateStatesProvider._();

final class TimeGateStatesProvider
    extends
        $FunctionalProvider<
          List<TimeGateState>,
          List<TimeGateState>,
          List<TimeGateState>
        >
    with $Provider<List<TimeGateState>> {
  TimeGateStatesProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'timeGateStatesProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$timeGateStatesHash();

  @$internal
  @override
  $ProviderElement<List<TimeGateState>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  List<TimeGateState> create(Ref ref) {
    return timeGateStates(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(List<TimeGateState> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<List<TimeGateState>>(value),
    );
  }
}

String _$timeGateStatesHash() => r'e281191df07e6dea8ad40e3b29325c11acf8272a';

@ProviderFor(timeGatesForEvent)
final timeGatesForEventProvider = TimeGatesForEventFamily._();

final class TimeGatesForEventProvider
    extends
        $FunctionalProvider<
          List<TimeGateState>,
          List<TimeGateState>,
          List<TimeGateState>
        >
    with $Provider<List<TimeGateState>> {
  TimeGatesForEventProvider._({
    required TimeGatesForEventFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'timeGatesForEventProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$timeGatesForEventHash();

  @override
  String toString() {
    return r'timeGatesForEventProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $ProviderElement<List<TimeGateState>> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  List<TimeGateState> create(Ref ref) {
    final argument = this.argument as String;
    return timeGatesForEvent(ref, argument);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(List<TimeGateState> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<List<TimeGateState>>(value),
    );
  }

  @override
  bool operator ==(Object other) {
    return other is TimeGatesForEventProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$timeGatesForEventHash() => r'ccfdcfc374ad1b43789757ba902e2715e657c713';

final class TimeGatesForEventFamily extends $Family
    with $FunctionalFamilyOverride<List<TimeGateState>, String> {
  TimeGatesForEventFamily._()
    : super(
        retry: null,
        name: r'timeGatesForEventProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  TimeGatesForEventProvider call(String eventId) =>
      TimeGatesForEventProvider._(argument: eventId, from: this);

  @override
  String toString() => r'timeGatesForEventProvider';
}

/// Selects the single most relevant time gate for the home screen:
/// - Locked and < 30 minutes to unlock, OR
/// - Unlocked and < 2 hours since unlock

@ProviderFor(homeTimeGate)
final homeTimeGateProvider = HomeTimeGateProvider._();

/// Selects the single most relevant time gate for the home screen:
/// - Locked and < 30 minutes to unlock, OR
/// - Unlocked and < 2 hours since unlock

final class HomeTimeGateProvider
    extends $FunctionalProvider<TimeGateState?, TimeGateState?, TimeGateState?>
    with $Provider<TimeGateState?> {
  /// Selects the single most relevant time gate for the home screen:
  /// - Locked and < 30 minutes to unlock, OR
  /// - Unlocked and < 2 hours since unlock
  HomeTimeGateProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'homeTimeGateProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$homeTimeGateHash();

  @$internal
  @override
  $ProviderElement<TimeGateState?> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  TimeGateState? create(Ref ref) {
    return homeTimeGate(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(TimeGateState? value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<TimeGateState?>(value),
    );
  }
}

String _$homeTimeGateHash() => r'05d2c97e334ae49d3ae4acdbcb3b4097947ba088';
