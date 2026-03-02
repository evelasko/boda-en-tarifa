import 'dart:io';

import 'package:camera/camera.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

abstract class CameraDeviceDataSource {
  Future<CameraController> initialize();
  Future<String> captureImage(CameraController controller);
  Future<void> disposeController(CameraController controller);
}

class CameraDeviceDataSourceImpl implements CameraDeviceDataSource {
  static const _uuid = Uuid();

  @override
  Future<CameraController> initialize() async {
    final cameras = await availableCameras();
    final rearCamera = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.back,
      orElse: () => cameras.first,
    );

    final controller = CameraController(
      rearCamera,
      ResolutionPreset.high,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    await controller.initialize();
    await controller.setFlashMode(FlashMode.off);

    return controller;
  }

  @override
  Future<String> captureImage(CameraController controller) async {
    final xFile = await controller.takePicture();
    final docsDir = await getApplicationDocumentsDirectory();
    final exposuresDir = Directory(p.join(docsDir.path, 'exposures'));

    if (!exposuresDir.existsSync()) {
      await exposuresDir.create(recursive: true);
    }

    final fileName = '${_uuid.v4()}.jpg';
    final destPath = p.join(exposuresDir.path, fileName);
    await File(xFile.path).copy(destPath);
    await File(xFile.path).delete();

    return destPath;
  }

  @override
  Future<void> disposeController(CameraController controller) async {
    if (controller.value.isInitialized) {
      await controller.dispose();
    }
  }
}
