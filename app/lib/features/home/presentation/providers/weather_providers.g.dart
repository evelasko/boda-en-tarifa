// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'weather_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(httpClient)
final httpClientProvider = HttpClientProvider._();

final class HttpClientProvider
    extends $FunctionalProvider<http.Client, http.Client, http.Client>
    with $Provider<http.Client> {
  HttpClientProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'httpClientProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$httpClientHash();

  @$internal
  @override
  $ProviderElement<http.Client> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  http.Client create(Ref ref) {
    return httpClient(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(http.Client value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<http.Client>(value),
    );
  }
}

String _$httpClientHash() => r'7ec49beae0f15115de79f9aa98dbd250130e26d8';

@ProviderFor(weatherRemoteDataSource)
final weatherRemoteDataSourceProvider = WeatherRemoteDataSourceProvider._();

final class WeatherRemoteDataSourceProvider
    extends
        $FunctionalProvider<
          WeatherRemoteDataSource,
          WeatherRemoteDataSource,
          WeatherRemoteDataSource
        >
    with $Provider<WeatherRemoteDataSource> {
  WeatherRemoteDataSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'weatherRemoteDataSourceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$weatherRemoteDataSourceHash();

  @$internal
  @override
  $ProviderElement<WeatherRemoteDataSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  WeatherRemoteDataSource create(Ref ref) {
    return weatherRemoteDataSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(WeatherRemoteDataSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<WeatherRemoteDataSource>(value),
    );
  }
}

String _$weatherRemoteDataSourceHash() =>
    r'887e7f23324a2fee6914f47e84b65734754da128';

@ProviderFor(weatherRepository)
final weatherRepositoryProvider = WeatherRepositoryProvider._();

final class WeatherRepositoryProvider
    extends
        $FunctionalProvider<
          WeatherRepository,
          WeatherRepository,
          WeatherRepository
        >
    with $Provider<WeatherRepository> {
  WeatherRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'weatherRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$weatherRepositoryHash();

  @$internal
  @override
  $ProviderElement<WeatherRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  WeatherRepository create(Ref ref) {
    return weatherRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(WeatherRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<WeatherRepository>(value),
    );
  }
}

String _$weatherRepositoryHash() => r'8cb817629d162043f5f2f21fd7dd877735e35eb0';

@ProviderFor(getWeatherUseCase)
final getWeatherUseCaseProvider = GetWeatherUseCaseProvider._();

final class GetWeatherUseCaseProvider
    extends $FunctionalProvider<GetWeather, GetWeather, GetWeather>
    with $Provider<GetWeather> {
  GetWeatherUseCaseProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'getWeatherUseCaseProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$getWeatherUseCaseHash();

  @$internal
  @override
  $ProviderElement<GetWeather> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  GetWeather create(Ref ref) {
    return getWeatherUseCase(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(GetWeather value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<GetWeather>(value),
    );
  }
}

String _$getWeatherUseCaseHash() => r'97b7fd872274aa10a4a977b682a50960f512bbac';

@ProviderFor(Weather)
final weatherProvider = WeatherProvider._();

final class WeatherProvider
    extends $AsyncNotifierProvider<Weather, WeatherInfo> {
  WeatherProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'weatherProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$weatherHash();

  @$internal
  @override
  Weather create() => Weather();
}

String _$weatherHash() => r'1beb37e938b9247ef9eb071c62463b73dda4c920';

abstract class _$Weather extends $AsyncNotifier<WeatherInfo> {
  FutureOr<WeatherInfo> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref = this.ref as $Ref<AsyncValue<WeatherInfo>, WeatherInfo>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<WeatherInfo>, WeatherInfo>,
              AsyncValue<WeatherInfo>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
