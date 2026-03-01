import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';

import 'upload_queue.dart';

/// A dismissible banner that shows "X photos esperando Wi-Fi" when uploads are
/// queued and the device has no connectivity.
class UploadBanner extends ConsumerStatefulWidget {
  const UploadBanner({super.key});

  @override
  ConsumerState<UploadBanner> createState() => _UploadBannerState();
}

class _UploadBannerState extends ConsumerState<UploadBanner> {
  bool _dismissed = false;

  @override
  Widget build(BuildContext context) {
    final queueAsync = ref.watch(uploadQueueProvider);
    final connectivityAsync = ref.watch(connectivityProvider);

    final queue = queueAsync.asData?.value;
    final connectivity = connectivityAsync.asData?.value;

    if (queue == null || connectivity == null) return const SizedBox.shrink();

    // Reset dismissed state when queue becomes empty.
    if (queue.isEmpty && _dismissed) {
      _dismissed = false;
    }

    if (_dismissed || queue.isEmpty) return const SizedBox.shrink();

    final hasConnection = !connectivity.contains(ConnectivityResult.none);

    // Determine banner text.
    final String text;
    final IconData icon;
    if (queue.failedCount > 0 && queue.pendingCount == 0) {
      text = '${queue.failedCount} foto${queue.failedCount == 1 ? '' : 's'}'
          ' no se pudo subir';
      icon = Icons.error_outline;
    } else if (!hasConnection) {
      text = '${queue.pendingCount} foto${queue.pendingCount == 1 ? '' : 's'}'
          ' esperando Wi-Fi';
      icon = Icons.wifi_off;
    } else if (queue.isProcessing) {
      text = 'Subiendo foto${queue.pendingCount == 1 ? '' : 's'}...';
      icon = Icons.cloud_upload_outlined;
    } else {
      return const SizedBox.shrink();
    }

    final colors = Theme.of(context).colorScheme;

    return Material(
      color: colors.secondaryContainer,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Icon(icon, size: 18, color: colors.onSecondaryContainer),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  text,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: colors.onSecondaryContainer,
                  ),
                ),
              ),
              if (queue.failedCount > 0)
                TextButton(
                  onPressed: () {
                    ref.read(uploadQueueProvider.notifier).retryFailed();
                  },
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    'Reintentar',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: colors.primary,
                    ),
                  ),
                ),
              IconButton(
                onPressed: () => setState(() => _dismissed = true),
                icon: Icon(
                  Icons.close,
                  size: 18,
                  color: colors.onSecondaryContainer,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
