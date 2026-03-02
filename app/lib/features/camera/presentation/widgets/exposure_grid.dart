import 'dart:io';

import 'package:flutter/material.dart';

import '../../domain/entities/exposure.dart';

class ExposureGrid extends StatelessWidget {
  const ExposureGrid({
    super.key,
    required this.exposures,
    required this.selectedIds,
    required this.onToggle,
    required this.onViewFullScreen,
  });

  final List<Exposure> exposures;
  final Set<String> selectedIds;
  final ValueChanged<String> onToggle;
  final ValueChanged<Exposure> onViewFullScreen;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(4),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemCount: exposures.length,
      itemBuilder: (context, index) {
        final exposure = exposures[index];
        final isSelected = selectedIds.contains(exposure.id);
        final isPublished = exposure.isPublished;

        return GestureDetector(
          onTap: isPublished ? null : () => onToggle(exposure.id),
          onLongPress: () => onViewFullScreen(exposure),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Photo thumbnail
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: _ExposureImage(exposure: exposure),
              ),

              // Selection overlay
              if (isSelected)
                Container(
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: Colors.amber, width: 2),
                  ),
                ),

              // Published badge
              if (isPublished)
                Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.check_circle,
                      color: Colors.green,
                      size: 32,
                    ),
                  ),
                ),

              // Checkbox indicator (only for unpublished)
              if (!isPublished)
                Positioned(
                  top: 6,
                  right: 6,
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isSelected
                          ? Colors.amber
                          : Colors.black.withValues(alpha: 0.5),
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, size: 18, color: Colors.black)
                        : null,
                  ),
                ),

              // Exposure number label
              Positioned(
                bottom: 6,
                left: 6,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '#${exposure.exposureNumber}',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ExposureImage extends StatelessWidget {
  const _ExposureImage({required this.exposure});

  final Exposure exposure;

  @override
  Widget build(BuildContext context) {
    final localFile = File(exposure.localPath);

    // Prefer local file, fall back to Cloudinary URL
    if (localFile.existsSync()) {
      return Image.file(
        localFile,
        fit: BoxFit.cover,
        cacheWidth: 400,
      );
    }

    if (exposure.cloudinaryPublicId != null) {
      return Image.network(
        'https://res.cloudinary.com/demo/image/upload/${exposure.cloudinaryPublicId}',
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => const _MissingPhoto(),
      );
    }

    return const _MissingPhoto();
  }
}

class _MissingPhoto extends StatelessWidget {
  const _MissingPhoto();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.grey.shade900,
      child: const Center(
        child: Icon(Icons.broken_image, color: Colors.white38, size: 32),
      ),
    );
  }
}
