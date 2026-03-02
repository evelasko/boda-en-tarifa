import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../domain/usecases/check_development_trigger.dart';
import '../providers/camera_providers.dart';
import '../widgets/camera_viewfinder.dart';
import '../widgets/development_animation.dart';
import '../widgets/film_counter.dart';
import '../widgets/shutter_button.dart';

class CameraScreen extends ConsumerStatefulWidget {
  const CameraScreen({super.key});

  @override
  ConsumerState<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends ConsumerState<CameraScreen>
    with WidgetsBindingObserver {
  bool _showFlash = false;
  bool _showDevelopmentAnimation = false;
  bool _isCapturing = false;
  PermissionStatus? _permissionStatus;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkPermission();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final notifier = ref.read(cameraControllerProvider.notifier);
    switch (state) {
      case AppLifecycleState.inactive:
      case AppLifecycleState.paused:
        notifier.pause();
      case AppLifecycleState.resumed:
        notifier.resume();
      case _:
        break;
    }
  }

  Future<void> _checkPermission() async {
    final status = await Permission.camera.status;
    if (status.isGranted) {
      setState(() => _permissionStatus = status);
      return;
    }

    final result = await Permission.camera.request();
    setState(() => _permissionStatus = result);
  }

  Future<void> _onCaptured() async {
    if (_isCapturing) return;
    _isCapturing = true;

    // Show flash
    setState(() => _showFlash = true);
    Future.delayed(const Duration(milliseconds: 150), () {
      if (mounted) setState(() => _showFlash = false);
    });

    // Check development trigger after capture
    final result = await ref
        .read(developmentTriggerCheckerProvider.notifier)
        .checkAfterCapture();

    if (mounted && result is DevelopmentTriggered) {
      setState(() => _showDevelopmentAnimation = true);
    }

    _isCapturing = false;
  }

  void _onDevelopmentAnimationComplete() {
    if (mounted) {
      setState(() => _showDevelopmentAnimation = false);
    }
    // TODO(MFC-54): Navigate to Development Room gallery
  }

  @override
  Widget build(BuildContext context) {
    // Eagerly init background sync registration and connectivity sync
    ref.watch(cameraSyncRegistrationProvider);
    ref.watch(cameraSyncOnConnectivityProvider);

    // Listen for time-based development trigger
    ref.listen(developmentTriggerCheckerProvider, (prev, next) {
      if (next is DevelopmentTriggered &&
          prev is! DevelopmentTriggered &&
          !_showDevelopmentAnimation) {
        setState(() => _showDevelopmentAnimation = true);
      }
    });

    if (_permissionStatus == null) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    if (!_permissionStatus!.isGranted) {
      return _PermissionDeniedView(
        isPermanentlyDenied: _permissionStatus!.isPermanentlyDenied,
        onRetry: _checkPermission,
      );
    }

    final exposureCount = ref.watch(exposureCountProvider);
    final rollFull = exposureCount >= 24;

    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          const CameraViewfinder(),
          const Positioned(
            top: 60,
            right: 20,
            child: FilmCounter(),
          ),
          Positioned(
            bottom: 48,
            left: 0,
            right: 0,
            child: Center(
              child: IgnorePointer(
                ignoring: rollFull,
                child: Opacity(
                  opacity: rollFull ? 0.4 : 1.0,
                  child: ShutterButton(onCaptured: _onCaptured),
                ),
              ),
            ),
          ),
          if (_showFlash)
            AnimatedOpacity(
              opacity: _showFlash ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 100),
              child: const ColoredBox(color: Colors.white),
            ),

          // Full-screen development animation overlay
          if (_showDevelopmentAnimation)
            Positioned.fill(
              child: DevelopmentAnimation(
                onComplete: _onDevelopmentAnimationComplete,
              ),
            ),
        ],
      ),
    );
  }
}

class _PermissionDeniedView extends StatelessWidget {
  const _PermissionDeniedView({
    required this.isPermanentlyDenied,
    required this.onRetry,
  });

  final bool isPermanentlyDenied;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.camera_alt_outlined,
                size: 64,
                color: Colors.white38,
              ),
              const SizedBox(height: 24),
              const Text(
                'Permiso de cámara necesario',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                isPermanentlyDenied
                    ? 'Abre los ajustes de la app para permitir el acceso a la cámara.'
                    : 'Necesitamos acceso a la cámara para capturar tus fotos.',
                style: const TextStyle(color: Colors.white60, fontSize: 15),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              FilledButton(
                onPressed:
                    isPermanentlyDenied ? openAppSettings : onRetry,
                child: Text(
                  isPermanentlyDenied ? 'Abrir ajustes' : 'Dar permiso',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
