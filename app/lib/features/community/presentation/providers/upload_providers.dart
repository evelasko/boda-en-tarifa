import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:boda_en_tarifa_app/core/media/upload_queue.dart';

/// Provider exposing the count of pending (non-failed) items in the upload queue.
final pendingUploadCountProvider = Provider<int>((ref) {
  final queue = ref.watch(uploadQueueProvider).asData?.value;
  return queue?.pendingCount ?? 0;
});

/// Provider exposing the count of permanently failed items.
final failedUploadCountProvider = Provider<int>((ref) {
  final queue = ref.watch(uploadQueueProvider).asData?.value;
  return queue?.failedCount ?? 0;
});

/// Provider exposing whether the queue is currently uploading.
final isUploadingProvider = Provider<bool>((ref) {
  final queue = ref.watch(uploadQueueProvider).asData?.value;
  return queue?.isProcessing ?? false;
});
