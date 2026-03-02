import 'dart:math' as math;

import 'package:flutter/material.dart';

class DevelopmentAnimation extends StatefulWidget {
  const DevelopmentAnimation({super.key, required this.onComplete});

  final VoidCallback onComplete;

  @override
  State<DevelopmentAnimation> createState() => _DevelopmentAnimationState();
}

class _DevelopmentAnimationState extends State<DevelopmentAnimation>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    );
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed && mounted) {
        widget.onComplete();
      }
    });
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _phaseText(double value) {
    if (value < 0.4) return 'Abriendo carrete...';
    if (value < 0.8) return 'Revelando fotos...';
    return '¡Listo!';
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Material(
        color: Colors.transparent,
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            final value = _controller.value;

            // Background transitions from deep red to warm amber
            final bgColor = Color.lerp(
              const Color(0xFF1A0000),
              const Color(0xFF2A1800),
              value,
            )!;

            // Text and icon opacity
            final textOpacity = value < 0.05 ? value / 0.05 : 1.0;

            // Film reel rotation
            final reelRotation = value * 4 * math.pi;

            // Brightness increase in final phase
            final brightness = value > 0.8
                ? ((value - 0.8) / 0.2).clamp(0.0, 1.0) * 0.3
                : 0.0;

            return Container(
              color: bgColor,
              child: Stack(
                children: [
                  // Subtle red vignette
                  Center(
                    child: Container(
                      width: double.infinity,
                      height: double.infinity,
                      decoration: BoxDecoration(
                        gradient: RadialGradient(
                          colors: [
                            Colors.transparent,
                            const Color(0xFF330000).withValues(alpha: 0.5),
                          ],
                          radius: 1.2,
                        ),
                      ),
                    ),
                  ),

                  // Main content
                  Center(
                    child: Opacity(
                      opacity: textOpacity,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Rotating film reel icon
                          Transform.rotate(
                            angle: reelRotation,
                            child: Icon(
                              Icons.camera_roll_outlined,
                              size: 72,
                              color: Color.lerp(
                                const Color(0xFFCC3333),
                                const Color(0xFFFF9800),
                                value,
                              ),
                            ),
                          ),

                          const SizedBox(height: 32),

                          // Phase text
                          Text(
                            _phaseText(value),
                            style: TextStyle(
                              color: Color.lerp(
                                const Color(0xFFCC6666),
                                Colors.white,
                                value,
                              ),
                              fontSize: 22,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                            ),
                          ),

                          const SizedBox(height: 48),

                          // Film strip progress bar
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 48),
                            child: _FilmStripProgress(progress: value),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Brightness overlay for final phase
                  if (brightness > 0)
                    IgnorePointer(
                      child: Container(
                        color: Colors.white.withValues(alpha: brightness),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _FilmStripProgress extends StatelessWidget {
  const _FilmStripProgress({required this.progress});

  final double progress;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 28,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: Stack(
          children: [
            // Background (film strip look)
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A1A),
                border: Border.all(
                  color: const Color(0xFF444444),
                  width: 1,
                ),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                children: List.generate(
                  24,
                  (i) => Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(
                        horizontal: 0.5,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF222222),
                        borderRadius: BorderRadius.circular(1),
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // Progress fill
            FractionallySizedBox(
              widthFactor: progress,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFFCC3333).withValues(alpha: 0.7),
                      const Color(0xFFFF9800).withValues(alpha: 0.7),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
