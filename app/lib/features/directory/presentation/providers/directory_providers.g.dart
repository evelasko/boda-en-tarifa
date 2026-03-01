// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'directory_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(guestRemoteDataSource)
final guestRemoteDataSourceProvider = GuestRemoteDataSourceProvider._();

final class GuestRemoteDataSourceProvider
    extends
        $FunctionalProvider<
          GuestRemoteDataSource,
          GuestRemoteDataSource,
          GuestRemoteDataSource
        >
    with $Provider<GuestRemoteDataSource> {
  GuestRemoteDataSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'guestRemoteDataSourceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$guestRemoteDataSourceHash();

  @$internal
  @override
  $ProviderElement<GuestRemoteDataSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  GuestRemoteDataSource create(Ref ref) {
    return guestRemoteDataSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(GuestRemoteDataSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<GuestRemoteDataSource>(value),
    );
  }
}

String _$guestRemoteDataSourceHash() =>
    r'b02f071df93aaa770e6d9d9e45442ef40015115d';

@ProviderFor(guestLocalDataSource)
final guestLocalDataSourceProvider = GuestLocalDataSourceProvider._();

final class GuestLocalDataSourceProvider
    extends
        $FunctionalProvider<
          GuestLocalDataSource,
          GuestLocalDataSource,
          GuestLocalDataSource
        >
    with $Provider<GuestLocalDataSource> {
  GuestLocalDataSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'guestLocalDataSourceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$guestLocalDataSourceHash();

  @$internal
  @override
  $ProviderElement<GuestLocalDataSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  GuestLocalDataSource create(Ref ref) {
    return guestLocalDataSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(GuestLocalDataSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<GuestLocalDataSource>(value),
    );
  }
}

String _$guestLocalDataSourceHash() =>
    r'986d7fd19f272e2e89f38d142d99e7a6b21c5dcb';

@ProviderFor(directoryRepository)
final directoryRepositoryProvider = DirectoryRepositoryProvider._();

final class DirectoryRepositoryProvider
    extends
        $FunctionalProvider<
          DirectoryRepository,
          DirectoryRepository,
          DirectoryRepository
        >
    with $Provider<DirectoryRepository> {
  DirectoryRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'directoryRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$directoryRepositoryHash();

  @$internal
  @override
  $ProviderElement<DirectoryRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  DirectoryRepository create(Ref ref) {
    return directoryRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(DirectoryRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<DirectoryRepository>(value),
    );
  }
}

String _$directoryRepositoryHash() =>
    r'200769d28a2499925c3fe7b67e37691e233030c7';

@ProviderFor(directoryGuests)
final directoryGuestsProvider = DirectoryGuestsProvider._();

final class DirectoryGuestsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<GuestProfile>>,
          List<GuestProfile>,
          FutureOr<List<GuestProfile>>
        >
    with
        $FutureModifier<List<GuestProfile>>,
        $FutureProvider<List<GuestProfile>> {
  DirectoryGuestsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'directoryGuestsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$directoryGuestsHash();

  @$internal
  @override
  $FutureProviderElement<List<GuestProfile>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<GuestProfile>> create(Ref ref) {
    return directoryGuests(ref);
  }
}

String _$directoryGuestsHash() => r'34c43f16e82a59e4ab2db67589d30948d1cb12a6';

@ProviderFor(SearchQuery)
final searchQueryProvider = SearchQueryProvider._();

final class SearchQueryProvider extends $NotifierProvider<SearchQuery, String> {
  SearchQueryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'searchQueryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$searchQueryHash();

  @$internal
  @override
  SearchQuery create() => SearchQuery();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(String value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<String>(value),
    );
  }
}

String _$searchQueryHash() => r'1f7487578a481f855770a91719d9d7f2792ac37e';

abstract class _$SearchQuery extends $Notifier<String> {
  String build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<String, String>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<String, String>,
              String,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}

@ProviderFor(ActiveFilters)
final activeFiltersProvider = ActiveFiltersProvider._();

final class ActiveFiltersProvider
    extends $NotifierProvider<ActiveFilters, DirectoryFilters> {
  ActiveFiltersProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'activeFiltersProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$activeFiltersHash();

  @$internal
  @override
  ActiveFilters create() => ActiveFilters();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(DirectoryFilters value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<DirectoryFilters>(value),
    );
  }
}

String _$activeFiltersHash() => r'92c670f9d8a27baaa35bdcc815b6360e43b80ebc';

abstract class _$ActiveFilters extends $Notifier<DirectoryFilters> {
  DirectoryFilters build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<DirectoryFilters, DirectoryFilters>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<DirectoryFilters, DirectoryFilters>,
              DirectoryFilters,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}

@ProviderFor(filteredGuests)
final filteredGuestsProvider = FilteredGuestsProvider._();

final class FilteredGuestsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<GuestProfile>>,
          List<GuestProfile>,
          FutureOr<List<GuestProfile>>
        >
    with
        $FutureModifier<List<GuestProfile>>,
        $FutureProvider<List<GuestProfile>> {
  FilteredGuestsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'filteredGuestsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$filteredGuestsHash();

  @$internal
  @override
  $FutureProviderElement<List<GuestProfile>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<GuestProfile>> create(Ref ref) {
    return filteredGuests(ref);
  }
}

String _$filteredGuestsHash() => r'4cc317f0b5ab43c8ff6f9c149bb8672a9e77f214';
