// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'schedule_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(scheduleLocalDataSource)
final scheduleLocalDataSourceProvider = ScheduleLocalDataSourceProvider._();

final class ScheduleLocalDataSourceProvider
    extends
        $FunctionalProvider<
          ScheduleLocalDataSource,
          ScheduleLocalDataSource,
          ScheduleLocalDataSource
        >
    with $Provider<ScheduleLocalDataSource> {
  ScheduleLocalDataSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'scheduleLocalDataSourceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$scheduleLocalDataSourceHash();

  @$internal
  @override
  $ProviderElement<ScheduleLocalDataSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ScheduleLocalDataSource create(Ref ref) {
    return scheduleLocalDataSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ScheduleLocalDataSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ScheduleLocalDataSource>(value),
    );
  }
}

String _$scheduleLocalDataSourceHash() =>
    r'f2338ba6f9ec494c7c416665e2ce24d018ae02c9';

@ProviderFor(scheduleRemoteDataSource)
final scheduleRemoteDataSourceProvider = ScheduleRemoteDataSourceProvider._();

final class ScheduleRemoteDataSourceProvider
    extends
        $FunctionalProvider<
          ScheduleRemoteDataSource,
          ScheduleRemoteDataSource,
          ScheduleRemoteDataSource
        >
    with $Provider<ScheduleRemoteDataSource> {
  ScheduleRemoteDataSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'scheduleRemoteDataSourceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$scheduleRemoteDataSourceHash();

  @$internal
  @override
  $ProviderElement<ScheduleRemoteDataSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ScheduleRemoteDataSource create(Ref ref) {
    return scheduleRemoteDataSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ScheduleRemoteDataSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ScheduleRemoteDataSource>(value),
    );
  }
}

String _$scheduleRemoteDataSourceHash() =>
    r'f1c983b30d8d00d09cf77df4a46ca1e2efcfb1b3';

@ProviderFor(scheduleRepository)
final scheduleRepositoryProvider = ScheduleRepositoryProvider._();

final class ScheduleRepositoryProvider
    extends
        $FunctionalProvider<
          ScheduleRepository,
          ScheduleRepository,
          ScheduleRepository
        >
    with $Provider<ScheduleRepository> {
  ScheduleRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'scheduleRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$scheduleRepositoryHash();

  @$internal
  @override
  $ProviderElement<ScheduleRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ScheduleRepository create(Ref ref) {
    return scheduleRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ScheduleRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ScheduleRepository>(value),
    );
  }
}

String _$scheduleRepositoryHash() =>
    r'50b1b3880e87363ec0fee5bd216b5be905a05ba7';

@ProviderFor(getCurrentEventUseCase)
final getCurrentEventUseCaseProvider = GetCurrentEventUseCaseProvider._();

final class GetCurrentEventUseCaseProvider
    extends
        $FunctionalProvider<GetCurrentEvent, GetCurrentEvent, GetCurrentEvent>
    with $Provider<GetCurrentEvent> {
  GetCurrentEventUseCaseProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'getCurrentEventUseCaseProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$getCurrentEventUseCaseHash();

  @$internal
  @override
  $ProviderElement<GetCurrentEvent> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  GetCurrentEvent create(Ref ref) {
    return getCurrentEventUseCase(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(GetCurrentEvent value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<GetCurrentEvent>(value),
    );
  }
}

String _$getCurrentEventUseCaseHash() =>
    r'801a8a426cc24d82e482b529b721cb6332579276';

/// Watches `config/timeline_override` in Firestore.
/// Returns the overridden event ID, or null when no override is active.

@ProviderFor(timelineOverride)
final timelineOverrideProvider = TimelineOverrideProvider._();

/// Watches `config/timeline_override` in Firestore.
/// Returns the overridden event ID, or null when no override is active.

final class TimelineOverrideProvider
    extends $FunctionalProvider<AsyncValue<String?>, String?, Stream<String?>>
    with $FutureModifier<String?>, $StreamProvider<String?> {
  /// Watches `config/timeline_override` in Firestore.
  /// Returns the overridden event ID, or null when no override is active.
  TimelineOverrideProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'timelineOverrideProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$timelineOverrideHash();

  @$internal
  @override
  $StreamProviderElement<String?> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<String?> create(Ref ref) {
    return timelineOverride(ref);
  }
}

String _$timelineOverrideHash() => r'd8c9ef345682ae8ccd32b4e4f736b5b22e88df6b';

/// The main provider for the hero banner. Combines:
/// 1. Drift-backed schedule data (reactive via watch)
/// 2. A periodic timer to re-evaluate the current event
/// 3. Admin override from Firestore

@ProviderFor(HeroBanner)
final heroBannerProvider = HeroBannerProvider._();

/// The main provider for the hero banner. Combines:
/// 1. Drift-backed schedule data (reactive via watch)
/// 2. A periodic timer to re-evaluate the current event
/// 3. Admin override from Firestore
final class HeroBannerProvider
    extends $StreamNotifierProvider<HeroBanner, HeroBannerState> {
  /// The main provider for the hero banner. Combines:
  /// 1. Drift-backed schedule data (reactive via watch)
  /// 2. A periodic timer to re-evaluate the current event
  /// 3. Admin override from Firestore
  HeroBannerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'heroBannerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$heroBannerHash();

  @$internal
  @override
  HeroBanner create() => HeroBanner();
}

String _$heroBannerHash() => r'f3a7baff3fdfdb4fb4ad93d7426634b65c5c0145';

/// The main provider for the hero banner. Combines:
/// 1. Drift-backed schedule data (reactive via watch)
/// 2. A periodic timer to re-evaluate the current event
/// 3. Admin override from Firestore

abstract class _$HeroBanner extends $StreamNotifier<HeroBannerState> {
  Stream<HeroBannerState> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<HeroBannerState>, HeroBannerState>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<HeroBannerState>, HeroBannerState>,
              AsyncValue<HeroBannerState>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}

/// Whether the current user has admin privileges (custom claim).

@ProviderFor(isAdmin)
final isAdminProvider = IsAdminProvider._();

/// Whether the current user has admin privileges (custom claim).

final class IsAdminProvider
    extends $FunctionalProvider<AsyncValue<bool>, bool, FutureOr<bool>>
    with $FutureModifier<bool>, $FutureProvider<bool> {
  /// Whether the current user has admin privileges (custom claim).
  IsAdminProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'isAdminProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$isAdminHash();

  @$internal
  @override
  $FutureProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<bool> create(Ref ref) {
    return isAdmin(ref);
  }
}

String _$isAdminHash() => r'6c03b6d3928c55f627b88d238fab26bd76d63341';
