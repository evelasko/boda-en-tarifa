import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/camera_providers.dart';

class FilmCounter extends ConsumerWidget {
  const FilmCounter({super.key});

  static const _maxExposures = 24;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(exposureCountProvider);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black54,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '${count.toString().padLeft(2, '0')}/$_maxExposures',
        style: const TextStyle(
          color: Color(0xFFFF9800),
          fontSize: 18,
          fontFamily: 'monospace',
          fontWeight: FontWeight.bold,
          letterSpacing: 2,
        ),
      ),
    );
  }
}
