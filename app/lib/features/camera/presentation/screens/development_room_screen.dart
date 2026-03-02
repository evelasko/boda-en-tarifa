import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:boda_en_tarifa_app/features/auth/presentation/providers/auth_providers.dart';

import '../../domain/entities/exposure.dart';
import '../providers/camera_providers.dart';
import '../widgets/exposure_grid.dart';
import '../widgets/publish_button.dart';

class DevelopmentRoomScreen extends ConsumerWidget {
  const DevelopmentRoomScreen({super.key, required this.onBackToViewfinder});

  final VoidCallback onBackToViewfinder;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exposuresAsync = ref.watch(developedExposureStreamProvider);
    final selectedIds = ref.watch(selectedExposuresProvider);
    final publishState = ref.watch(publishControllerProvider);

    // Listen for publish success
    ref.listen(publishControllerProvider, (prev, next) {
      if (next case AsyncData(value: final result?)
          when result.totalPublished > 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${result.totalPublished} foto(s) publicada(s) al feed',
            ),
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text('Tu carrete revelado'),
        actions: [
          // Select All / Clear toggle
          if (exposuresAsync case AsyncData(value: final exposures))
            TextButton(
              onPressed: () {
                final notifier =
                    ref.read(selectedExposuresProvider.notifier);
                final unpublished =
                    exposures.where((e) => !e.isPublished).toList();
                if (selectedIds.length == unpublished.length &&
                    unpublished.isNotEmpty) {
                  notifier.clearSelection();
                } else {
                  notifier.selectAll(
                    unpublished.map((e) => e.id).toList(),
                  );
                }
              },
              child: Text(
                _allUnpublishedSelected(exposuresAsync, selectedIds)
                    ? 'Ninguna'
                    : 'Todas',
                style: const TextStyle(color: Colors.amber),
              ),
            ),
        ],
      ),
      body: exposuresAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
        error: (e, _) => Center(
          child:
              Text('Error: $e', style: const TextStyle(color: Colors.white60)),
        ),
        data: (exposures) {
          if (exposures.isEmpty) {
            return const Center(
              child: Text(
                'No hay fotos reveladas.',
                style: TextStyle(color: Colors.white60, fontSize: 16),
              ),
            );
          }

          final allPublished = exposures.every((e) => e.isPublished);

          if (allPublished) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle, color: Colors.green, size: 72),
                  const SizedBox(height: 16),
                  const Text(
                    'Todas las fotos publicadas',
                    style: TextStyle(color: Colors.white, fontSize: 18),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Puedes seguir sacando fotos con un nuevo carrete.',
                    style: TextStyle(color: Colors.white60, fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  OutlinedButton.icon(
                    onPressed: onBackToViewfinder,
                    icon: const Icon(Icons.camera_alt, color: Colors.white70),
                    label: const Text(
                      'Nuevo carrete',
                      style: TextStyle(color: Colors.white70),
                    ),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white38),
                    ),
                  ),
                ],
              ),
            );
          }

          return ExposureGrid(
            exposures: exposures,
            selectedIds: selectedIds,
            onToggle: (id) =>
                ref.read(selectedExposuresProvider.notifier).toggle(id),
            onViewFullScreen: (exposure) =>
                _showFullScreen(context, exposure),
          );
        },
      ),
      bottomNavigationBar: _buildBottomBar(
        exposuresAsync,
        selectedIds,
        publishState,
        ref,
      ),
    );
  }

  bool _allUnpublishedSelected(
    AsyncValue<List<Exposure>> exposuresAsync,
    Set<String> selectedIds,
  ) {
    final exposures = exposuresAsync.asData?.value;
    if (exposures == null) return false;
    final unpublished = exposures.where((e) => !e.isPublished).toList();
    return unpublished.isNotEmpty && selectedIds.length == unpublished.length;
  }

  Widget? _buildBottomBar(
    AsyncValue<List<Exposure>> exposuresAsync,
    Set<String> selectedIds,
    AsyncValue<dynamic> publishState,
    WidgetRef ref,
  ) {
    final exposures = exposuresAsync.asData?.value;
    if (exposures == null) return null;

    final unpublished = exposures.where((e) => !e.isPublished).toList();
    if (unpublished.isEmpty) return null;

    return PublishButton(
      selectedCount: selectedIds.length,
      isLoading: publishState.isLoading,
      onPublish: selectedIds.isEmpty
          ? null
          : () {
              final user = ref.read(authStateProvider).asData?.value;
              if (user == null) return;

              final selected = unpublished
                  .where((e) => selectedIds.contains(e.id))
                  .toList();

              ref.read(publishControllerProvider.notifier).publish(
                    selectedExposures: selected,
                    authorUid: user.uid,
                    authorName: user.fullName,
                    authorPhotoUrl: user.photoUrl,
                  );
            },
    );
  }

  void _showFullScreen(BuildContext context, Exposure exposure) {
    showDialog(
      context: context,
      builder: (context) => Dialog.fullscreen(
        backgroundColor: Colors.black,
        child: GestureDetector(
          onTap: () => Navigator.of(context).pop(),
          child: Stack(
            fit: StackFit.expand,
            children: [
              InteractiveViewer(
                child: Center(
                  child: File(exposure.localPath).existsSync()
                      ? Image.file(File(exposure.localPath))
                      : exposure.cloudinaryPublicId != null
                          ? Image.network(
                              'https://res.cloudinary.com/demo/image/upload/${exposure.cloudinaryPublicId}',
                            )
                          : const Icon(
                              Icons.broken_image,
                              color: Colors.white38,
                              size: 64,
                            ),
                ),
              ),
              Positioned(
                top: 48,
                right: 16,
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.white, size: 28),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
              Positioned(
                bottom: 32,
                left: 0,
                right: 0,
                child: Text(
                  'Foto #${exposure.exposureNumber}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
