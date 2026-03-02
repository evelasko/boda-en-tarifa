import 'dart:async';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:receive_sharing_intent/receive_sharing_intent.dart';

import 'package:boda_en_tarifa_app/core/media/upload_queue.dart';
import 'package:boda_en_tarifa_app/features/auth/presentation/providers/auth_providers.dart';
import 'package:boda_en_tarifa_app/features/community/domain/entities/feed_post.dart';

import 'share_providers.dart';

// ---------------------------------------------------------------------------
// Share handler — listens for incoming share intents and enqueues images.
// ---------------------------------------------------------------------------

final shareHandlerProvider =
    AsyncNotifierProvider<ShareHandler, void>(ShareHandler.new);

class ShareHandler extends AsyncNotifier<void> {
  StreamSubscription<List<SharedMediaFile>>? _streamSub;

  @override
  FutureOr<void> build() {
    // Listen to media shared while the app is already running.
    _streamSub = ReceiveSharingIntent.instance.getMediaStream().listen(
          (files) => _handleSharedFiles(files),
          onError: (_) {},
        );

    // Handle media shared when the app was cold-started via share sheet.
    ReceiveSharingIntent.instance.getInitialMedia().then((files) {
      if (files.isNotEmpty) _handleSharedFiles(files);
    });

    // When the user logs in, drain any staged paths from unauthenticated shares.
    ref.listen(authStateProvider, (prev, next) {
      final user = next.asData?.value;
      if (user == null) return;

      final pendingPaths = ref.read(pendingSharePathsProvider);
      if (pendingPaths.isEmpty) return;

      ref.read(uploadQueueProvider.notifier).enqueue(
            filePaths: pendingPaths,
            authorUid: user.uid,
            authorName: user.fullName,
            authorPhotoUrl: user.photoUrl,
            source: FeedPostSource.shareExtension,
          );

      ref.read(shareConfirmationProvider.notifier).set(ShareConfirmation(
            type: ShareConfirmationType.enqueued,
            imageCount: pendingPaths.length,
          ));

      ref.read(pendingSharePathsProvider.notifier).clear();
    });

    ref.onDispose(() => _streamSub?.cancel());
  }

  Future<void> _handleSharedFiles(List<SharedMediaFile> files) async {
    // Filter to images that still exist on disk.
    final imageFiles = files
        .where((f) => f.type == SharedMediaType.image)
        .where((f) => File(f.path).existsSync())
        .toList();

    if (imageFiles.isEmpty) {
      ReceiveSharingIntent.instance.reset();
      return;
    }

    final paths = imageFiles.map((f) => f.path).toList();
    final user = ref.read(authStateProvider).asData?.value;

    if (user == null) {
      // Stage for post-login processing.
      ref.read(pendingSharePathsProvider.notifier).add(paths);
      ref.read(shareConfirmationProvider.notifier).set(ShareConfirmation(
            type: ShareConfirmationType.authRequired,
            imageCount: paths.length,
          ));
      ReceiveSharingIntent.instance.reset();
      return;
    }

    await ref.read(uploadQueueProvider.notifier).enqueue(
          filePaths: paths,
          authorUid: user.uid,
          authorName: user.fullName,
          authorPhotoUrl: user.photoUrl,
          source: FeedPostSource.shareExtension,
        );

    ref.read(shareConfirmationProvider.notifier).set(ShareConfirmation(
          type: ShareConfirmationType.enqueued,
          imageCount: paths.length,
        ));

    ReceiveSharingIntent.instance.reset();
  }
}
