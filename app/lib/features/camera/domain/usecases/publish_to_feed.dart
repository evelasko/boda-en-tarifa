import 'package:fpdart/fpdart.dart';

import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/features/community/domain/entities/feed_post.dart';
import 'package:boda_en_tarifa_app/features/community/domain/repositories/feed_repository.dart';

import '../entities/exposure.dart';
import '../repositories/camera_repository.dart';

class PublishToFeed {
  final CameraRepository _cameraRepository;
  final FeedRepository _feedRepository;

  PublishToFeed({
    required CameraRepository cameraRepository,
    required FeedRepository feedRepository,
  })  : _cameraRepository = cameraRepository,
        _feedRepository = feedRepository;

  /// Publishes selected exposures to the community feed.
  ///
  /// - Path A: exposures with cloudinaryPublicId are published directly via
  ///   FeedRepository.createFeedPost().
  /// - Path B: exposures without cloudinaryPublicId are returned in
  ///   [PublishResult.needsUpload] so the caller can enqueue them via
  ///   UploadQueueNotifier (presentation-layer concern).
  ///
  /// All exposures are marked isPublished = true locally regardless of path.
  FutureEither<PublishResult> call({
    required List<Exposure> exposures,
    required String authorUid,
    required String authorName,
    String? authorPhotoUrl,
  }) async {
    final directPublish = <Exposure>[];
    final needsUpload = <Exposure>[];

    for (final exposure in exposures) {
      if (exposure.cloudinaryPublicId != null) {
        directPublish.add(exposure);
      } else {
        needsUpload.add(exposure);
      }
    }

    // Path A: create feed_posts directly for already-uploaded exposures
    final failedDirect = <Exposure>[];
    for (final exposure in directPublish) {
      final post = FeedPost(
        id: '',
        authorUid: authorUid,
        authorName: authorName,
        authorPhotoUrl: authorPhotoUrl,
        imageUrls: [exposure.cloudinaryPublicId!],
        source: FeedPostSource.unfiltered,
        createdAt: DateTime.now(),
      );

      final result = await _feedRepository.createFeedPost(post);
      if (result.isLeft()) {
        failedDirect.add(exposure);
      }
    }

    // Move failed direct publishes to upload queue path as fallback
    needsUpload.addAll(failedDirect);

    // Mark all selected exposures as published locally
    final allIds = exposures.map((e) => e.id).toList();
    final markResult =
        await _cameraRepository.markExposuresAsPublished(allIds);

    return markResult.fold(
      Left.new,
      (_) => Right(PublishResult(
        publishedDirectly: directPublish.length - failedDirect.length,
        enqueuedForUpload: needsUpload.length,
        needsUpload: needsUpload,
      )),
    );
  }
}

class PublishResult {
  final int publishedDirectly;
  final int enqueuedForUpload;
  final List<Exposure> needsUpload;

  const PublishResult({
    required this.publishedDirectly,
    required this.enqueuedForUpload,
    required this.needsUpload,
  });

  int get totalPublished => publishedDirectly + enqueuedForUpload;
}
