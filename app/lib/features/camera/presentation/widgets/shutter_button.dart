import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/camera_providers.dart';

class ShutterButton extends ConsumerStatefulWidget {
  const ShutterButton({super.key, this.onCaptured});

  final VoidCallback? onCaptured;

  @override
  ConsumerState<ShutterButton> createState() => _ShutterButtonState();
}

class _ShutterButtonState extends ConsumerState<ShutterButton>
    with SingleTickerProviderStateMixin {
  bool _capturing = false;
  late final AnimationController _animController;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.85).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _onPressed() async {
    if (_capturing) return;

    setState(() => _capturing = true);
    HapticFeedback.mediumImpact();
    _animController.forward();

    try {
      final notifier =
          ref.read(cameraControllerProvider.notifier);
      await notifier.capture();
      widget.onCaptured?.call();
    } finally {
      await _animController.reverse();
      if (mounted) setState(() => _capturing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _onPressed,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        ),
        child: SizedBox(
          width: 76,
          height: 76,
          child: CustomPaint(painter: _ShutterPainter()),
        ),
      ),
    );
  }
}

class _ShutterPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final outerRadius = size.width / 2;
    final innerRadius = outerRadius - 6;
    final fillRadius = innerRadius - 3;

    final outerPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    canvas.drawCircle(center, outerRadius - 1.5, outerPaint);

    final fillPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, fillRadius, fillPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
