// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'gated_content_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(gatedContentRepository)
final gatedContentRepositoryProvider = GatedContentRepositoryProvider._();

final class GatedContentRepositoryProvider
    extends
        $FunctionalProvider<
          GatedContentRepository,
          GatedContentRepository,
          GatedContentRepository
        >
    with $Provider<GatedContentRepository> {
  GatedContentRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'gatedContentRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$gatedContentRepositoryHash();

  @$internal
  @override
  $ProviderElement<GatedContentRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  GatedContentRepository create(Ref ref) {
    return gatedContentRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(GatedContentRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<GatedContentRepository>(value),
    );
  }
}

String _$gatedContentRepositoryHash() =>
    r'49bdc78c2b085124eb915dfbc0ddc7137a6618e6';

@ProviderFor(gatedContentDoc)
final gatedContentDocProvider = GatedContentDocFamily._();

final class GatedContentDocProvider
    extends
        $FunctionalProvider<
          AsyncValue<Either<Failure, GatedContentDoc>>,
          Either<Failure, GatedContentDoc>,
          FutureOr<Either<Failure, GatedContentDoc>>
        >
    with
        $FutureModifier<Either<Failure, GatedContentDoc>>,
        $FutureProvider<Either<Failure, GatedContentDoc>> {
  GatedContentDocProvider._({
    required GatedContentDocFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'gatedContentDocProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$gatedContentDocHash();

  @override
  String toString() {
    return r'gatedContentDocProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<Either<Failure, GatedContentDoc>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<Either<Failure, GatedContentDoc>> create(Ref ref) {
    final argument = this.argument as String;
    return gatedContentDoc(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is GatedContentDocProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$gatedContentDocHash() => r'7792bc059c5a0653715fb89a5c726d7ffc9f82ca';

final class GatedContentDocFamily extends $Family
    with
        $FunctionalFamilyOverride<
          FutureOr<Either<Failure, GatedContentDoc>>,
          String
        > {
  GatedContentDocFamily._()
    : super(
        retry: null,
        name: r'gatedContentDocProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  GatedContentDocProvider call(String docPath) =>
      GatedContentDocProvider._(argument: docPath, from: this);

  @override
  String toString() => r'gatedContentDocProvider';
}
