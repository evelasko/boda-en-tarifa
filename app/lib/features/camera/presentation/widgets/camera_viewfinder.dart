import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/camera_providers.dart';

class CameraViewfinder extends ConsumerWidget {
  const CameraViewfinder({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controllerAsync = ref.watch(cameraControllerProvider);

    return controllerAsync.when(
      loading: () => const ColoredBox(
        color: Colors.black,
        child: Center(child: CircularProgressIndicator(color: Colors.white)),
      ),
      error: (error, _) => ColoredBox(
        color: Colors.black,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.white54, size: 48),
              const SizedBox(height: 16),
              Text(
                error.toString(),
                style: const TextStyle(color: Colors.white70),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => ref.invalidate(cameraControllerProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      ),
      data: (controller) => _Preview(controller: controller),
    );
  }
}

class _Preview extends StatelessWidget {
  const _Preview({required this.controller});

  final CameraController controller;

  @override
  Widget build(BuildContext context) {
    if (!controller.value.isInitialized) {
      return const ColoredBox(color: Colors.black);
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final previewAspect = controller.value.aspectRatio;
        final screenAspect = constraints.maxWidth / constraints.maxHeight;

        return ClipRect(
          child: OverflowBox(
            maxWidth: screenAspect > previewAspect
                ? constraints.maxWidth
                : constraints.maxHeight * previewAspect,
            maxHeight: screenAspect > previewAspect
                ? constraints.maxWidth / previewAspect
                : constraints.maxHeight,
            child: CameraPreview(controller),
          ),
        );
      },
    );
  }
}
