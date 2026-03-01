// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recommendations_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(recommendations)
final recommendationsProvider = RecommendationsProvider._();

final class RecommendationsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Recommendation>>,
          List<Recommendation>,
          FutureOr<List<Recommendation>>
        >
    with
        $FutureModifier<List<Recommendation>>,
        $FutureProvider<List<Recommendation>> {
  RecommendationsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'recommendationsProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$recommendationsHash();

  @$internal
  @override
  $FutureProviderElement<List<Recommendation>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Recommendation>> create(Ref ref) {
    return recommendations(ref);
  }
}

String _$recommendationsHash() => r'5baae1d5f7dfbda0fc0f093b8c18da58806231ce';
