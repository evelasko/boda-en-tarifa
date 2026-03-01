// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'feed_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(feedRemoteDataSource)
final feedRemoteDataSourceProvider = FeedRemoteDataSourceProvider._();

final class FeedRemoteDataSourceProvider
    extends
        $FunctionalProvider<
          FeedRemoteDataSource,
          FeedRemoteDataSource,
          FeedRemoteDataSource
        >
    with $Provider<FeedRemoteDataSource> {
  FeedRemoteDataSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'feedRemoteDataSourceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$feedRemoteDataSourceHash();

  @$internal
  @override
  $ProviderElement<FeedRemoteDataSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  FeedRemoteDataSource create(Ref ref) {
    return feedRemoteDataSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(FeedRemoteDataSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<FeedRemoteDataSource>(value),
    );
  }
}

String _$feedRemoteDataSourceHash() =>
    r'976a880df0c1ee01bdfc0139aab284511287ddfa';

@ProviderFor(feedRepository)
final feedRepositoryProvider = FeedRepositoryProvider._();

final class FeedRepositoryProvider
    extends $FunctionalProvider<FeedRepository, FeedRepository, FeedRepository>
    with $Provider<FeedRepository> {
  FeedRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'feedRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$feedRepositoryHash();

  @$internal
  @override
  $ProviderElement<FeedRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  FeedRepository create(Ref ref) {
    return feedRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(FeedRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<FeedRepository>(value),
    );
  }
}

String _$feedRepositoryHash() => r'bfcffbd8509e64d766602d5d4bf56a249b4766ed';

@ProviderFor(FeedPageLimit)
final feedPageLimitProvider = FeedPageLimitProvider._();

final class FeedPageLimitProvider
    extends $NotifierProvider<FeedPageLimit, int> {
  FeedPageLimitProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'feedPageLimitProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$feedPageLimitHash();

  @$internal
  @override
  FeedPageLimit create() => FeedPageLimit();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(int value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<int>(value),
    );
  }
}

String _$feedPageLimitHash() => r'556201c4c88c2107e3b48b29b2737fe798bae01f';

abstract class _$FeedPageLimit extends $Notifier<int> {
  int build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<int, int>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<int, int>,
              int,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}

@ProviderFor(liveFeed)
final liveFeedProvider = LiveFeedProvider._();

final class LiveFeedProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<FeedPost>>,
          List<FeedPost>,
          Stream<List<FeedPost>>
        >
    with $FutureModifier<List<FeedPost>>, $StreamProvider<List<FeedPost>> {
  LiveFeedProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'liveFeedProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$liveFeedHash();

  @$internal
  @override
  $StreamProviderElement<List<FeedPost>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<FeedPost>> create(Ref ref) {
    return liveFeed(ref);
  }
}

String _$liveFeedHash() => r'31e73e11e39cd11feae35a022c465a3c593291c3';
