// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notice_board_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(noticeBoardRemoteDataSource)
final noticeBoardRemoteDataSourceProvider =
    NoticeBoardRemoteDataSourceProvider._();

final class NoticeBoardRemoteDataSourceProvider
    extends
        $FunctionalProvider<
          NoticeBoardRemoteDataSource,
          NoticeBoardRemoteDataSource,
          NoticeBoardRemoteDataSource
        >
    with $Provider<NoticeBoardRemoteDataSource> {
  NoticeBoardRemoteDataSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'noticeBoardRemoteDataSourceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$noticeBoardRemoteDataSourceHash();

  @$internal
  @override
  $ProviderElement<NoticeBoardRemoteDataSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  NoticeBoardRemoteDataSource create(Ref ref) {
    return noticeBoardRemoteDataSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(NoticeBoardRemoteDataSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<NoticeBoardRemoteDataSource>(value),
    );
  }
}

String _$noticeBoardRemoteDataSourceHash() =>
    r'4f2b6c3f84cf083798f87c106275d836add9249e';

@ProviderFor(noticeBoardRepository)
final noticeBoardRepositoryProvider = NoticeBoardRepositoryProvider._();

final class NoticeBoardRepositoryProvider
    extends
        $FunctionalProvider<
          NoticeBoardRepository,
          NoticeBoardRepository,
          NoticeBoardRepository
        >
    with $Provider<NoticeBoardRepository> {
  NoticeBoardRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'noticeBoardRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$noticeBoardRepositoryHash();

  @$internal
  @override
  $ProviderElement<NoticeBoardRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  NoticeBoardRepository create(Ref ref) {
    return noticeBoardRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(NoticeBoardRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<NoticeBoardRepository>(value),
    );
  }
}

String _$noticeBoardRepositoryHash() =>
    r'67d1110244fe0a251215f7952b6e8b965c9c6e67';

@ProviderFor(noticeBoard)
final noticeBoardProvider = NoticeBoardProvider._();

final class NoticeBoardProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Notice>>,
          List<Notice>,
          Stream<List<Notice>>
        >
    with $FutureModifier<List<Notice>>, $StreamProvider<List<Notice>> {
  NoticeBoardProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'noticeBoardProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$noticeBoardHash();

  @$internal
  @override
  $StreamProviderElement<List<Notice>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<Notice>> create(Ref ref) {
    return noticeBoard(ref);
  }
}

String _$noticeBoardHash() => r'8629ba9f29d80dd16377032991ddee403bcf4a19';
