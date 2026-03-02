// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'camera_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(exposureLocalDataSource)
final exposureLocalDataSourceProvider = ExposureLocalDataSourceProvider._();

final class ExposureLocalDataSourceProvider
    extends
        $FunctionalProvider<
          ExposureLocalDataSource,
          ExposureLocalDataSource,
          ExposureLocalDataSource
        >
    with $Provider<ExposureLocalDataSource> {
  ExposureLocalDataSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'exposureLocalDataSourceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$exposureLocalDataSourceHash();

  @$internal
  @override
  $ProviderElement<ExposureLocalDataSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ExposureLocalDataSource create(Ref ref) {
    return exposureLocalDataSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ExposureLocalDataSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ExposureLocalDataSource>(value),
    );
  }
}

String _$exposureLocalDataSourceHash() =>
    r'201f7de8d16934f9937b3f65a145d8e7b4236316';

@ProviderFor(cameraDeviceDataSource)
final cameraDeviceDataSourceProvider = CameraDeviceDataSourceProvider._();

final class CameraDeviceDataSourceProvider
    extends
        $FunctionalProvider<
          CameraDeviceDataSource,
          CameraDeviceDataSource,
          CameraDeviceDataSource
        >
    with $Provider<CameraDeviceDataSource> {
  CameraDeviceDataSourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'cameraDeviceDataSourceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$cameraDeviceDataSourceHash();

  @$internal
  @override
  $ProviderElement<CameraDeviceDataSource> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  CameraDeviceDataSource create(Ref ref) {
    return cameraDeviceDataSource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(CameraDeviceDataSource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<CameraDeviceDataSource>(value),
    );
  }
}

String _$cameraDeviceDataSourceHash() =>
    r'b81f008cc832b427fd070f51b9a6c98e803dd21f';

@ProviderFor(cameraRepository)
final cameraRepositoryProvider = CameraRepositoryProvider._();

final class CameraRepositoryProvider
    extends
        $FunctionalProvider<
          CameraRepository,
          CameraRepository,
          CameraRepository
        >
    with $Provider<CameraRepository> {
  CameraRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'cameraRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$cameraRepositoryHash();

  @$internal
  @override
  $ProviderElement<CameraRepository> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  CameraRepository create(Ref ref) {
    return cameraRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(CameraRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<CameraRepository>(value),
    );
  }
}

String _$cameraRepositoryHash() => r'7098abe6889e2b1862104a39c324b402b86a1af5';

@ProviderFor(CameraControllerNotifier)
final cameraControllerProvider = CameraControllerNotifierProvider._();

final class CameraControllerNotifierProvider
    extends $AsyncNotifierProvider<CameraControllerNotifier, CameraController> {
  CameraControllerNotifierProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'cameraControllerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$cameraControllerNotifierHash();

  @$internal
  @override
  CameraControllerNotifier create() => CameraControllerNotifier();
}

String _$cameraControllerNotifierHash() =>
    r'1459bd353761f4488459fce22534b56cf2718f20';

abstract class _$CameraControllerNotifier
    extends $AsyncNotifier<CameraController> {
  FutureOr<CameraController> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref =
        this.ref as $Ref<AsyncValue<CameraController>, CameraController>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<CameraController>, CameraController>,
              AsyncValue<CameraController>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}

@ProviderFor(exposureStream)
final exposureStreamProvider = ExposureStreamProvider._();

final class ExposureStreamProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Exposure>>,
          List<Exposure>,
          Stream<List<Exposure>>
        >
    with $FutureModifier<List<Exposure>>, $StreamProvider<List<Exposure>> {
  ExposureStreamProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'exposureStreamProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$exposureStreamHash();

  @$internal
  @override
  $StreamProviderElement<List<Exposure>> $createElement(
    $ProviderPointer pointer,
  ) => $StreamProviderElement(pointer);

  @override
  Stream<List<Exposure>> create(Ref ref) {
    return exposureStream(ref);
  }
}

String _$exposureStreamHash() => r'9761bebbb5fa46730959e744ac4a6feb3eb1496a';

@ProviderFor(exposureCount)
final exposureCountProvider = ExposureCountProvider._();

final class ExposureCountProvider extends $FunctionalProvider<int, int, int>
    with $Provider<int> {
  ExposureCountProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'exposureCountProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$exposureCountHash();

  @$internal
  @override
  $ProviderElement<int> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  int create(Ref ref) {
    return exposureCount(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(int value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<int>(value),
    );
  }
}

String _$exposureCountHash() => r'772151cb3aab849f22272ca8882705d7fd11c8ea';
