import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:boda_en_tarifa_app/core/database/app_database.dart';
import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';
import 'package:boda_en_tarifa_app/features/community/domain/entities/feed_post.dart';

import 'cloudinary_uploader.dart';
import 'image_processor.dart';

// ---------------------------------------------------------------------------
// Upload queue item model
// ---------------------------------------------------------------------------

enum UploadItemStatus { pending, processing, failed }

class UploadQueueItem {
  final int? driftId;
  final String localPath;
  final String authorUid;
  final String authorName;
  final String? authorPhotoUrl;
  final String? caption;
  final FeedPostSource source;
  final UploadItemStatus status;
  final int attempts;
  final DateTime createdAt;

  const UploadQueueItem({
    this.driftId,
    required this.localPath,
    required this.authorUid,
    required this.authorName,
    this.authorPhotoUrl,
    this.caption,
    required this.source,
    this.status = UploadItemStatus.pending,
    this.attempts = 0,
    required this.createdAt,
  });

  UploadQueueItem copyWith({
    int? driftId,
    String? localPath,
    UploadItemStatus? status,
    int? attempts,
  }) {
    return UploadQueueItem(
      driftId: driftId ?? this.driftId,
      localPath: localPath ?? this.localPath,
      authorUid: authorUid,
      authorName: authorName,
      authorPhotoUrl: authorPhotoUrl,
      caption: caption,
      source: source,
      status: status ?? this.status,
      attempts: attempts ?? this.attempts,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'localPath': localPath,
        'authorUid': authorUid,
        'authorName': authorName,
        'authorPhotoUrl': authorPhotoUrl,
        'caption': caption,
        'source': source.name,
      };

  factory UploadQueueItem.fromJson(Map<String, dynamic> json, int driftId) {
    return UploadQueueItem(
      driftId: driftId,
      localPath: json['localPath'] as String,
      authorUid: json['authorUid'] as String,
      authorName: json['authorName'] as String,
      authorPhotoUrl: json['authorPhotoUrl'] as String?,
      caption: json['caption'] as String?,
      source: FeedPostSource.values.firstWhere(
        (s) => s.name == json['source'],
        orElse: () => FeedPostSource.imported,
      ),
      createdAt: DateTime.now(),
    );
  }
}

// ---------------------------------------------------------------------------
// Upload queue state
// ---------------------------------------------------------------------------

class UploadQueueState {
  final List<UploadQueueItem> items;
  final bool isProcessing;

  const UploadQueueState({
    this.items = const [],
    this.isProcessing = false,
  });

  int get pendingCount =>
      items.where((i) => i.status != UploadItemStatus.failed).length;

  int get failedCount =>
      items.where((i) => i.status == UploadItemStatus.failed).length;

  bool get isEmpty => items.isEmpty;

  UploadQueueState copyWith({
    List<UploadQueueItem>? items,
    bool? isProcessing,
  }) {
    return UploadQueueState(
      items: items ?? this.items,
      isProcessing: isProcessing ?? this.isProcessing,
    );
  }
}

// ---------------------------------------------------------------------------
// Upload queue provider
// ---------------------------------------------------------------------------

final uploadQueueProvider =
    AsyncNotifierProvider<UploadQueueNotifier, UploadQueueState>(
  UploadQueueNotifier.new,
);

class UploadQueueNotifier extends AsyncNotifier<UploadQueueState> {
  static const int _maxAttempts = 3;
  static const String _pendingWriteCollection = 'upload_queue';

  late final AppDatabase _db;
  late final FirebaseFirestore _firestore;
  late final ImageProcessor _imageProcessor;
  late final CloudinaryUploader _cloudinaryUploader;

  @override
  FutureOr<UploadQueueState> build() async {
    _db = ref.read(appDatabaseProvider);
    _firestore = ref.read(firestoreProvider);
    _imageProcessor = ImageProcessor();
    _cloudinaryUploader = CloudinaryUploader();

    // Listen to connectivity changes and flush queue on reconnect.
    ref.listen(connectivityProvider, (prev, next) {
      final results = next.asData?.value;
      if (results == null) return;
      final hasConnection = !results.contains(ConnectivityResult.none);
      if (hasConnection) {
        _processQueue();
      }
    });

    // Restore persisted items from Drift.
    final restoredItems = await _restoreFromDrift();

    final initialState = UploadQueueState(items: restoredItems);

    // If there are restored items, start processing after build completes.
    if (restoredItems.isNotEmpty) {
      Future.microtask(() => _processQueue());
    }

    return initialState;
  }

  /// Enqueues one or more images for upload.
  Future<void> enqueue({
    required List<String> filePaths,
    required String authorUid,
    required String authorName,
    String? authorPhotoUrl,
    String? caption,
    FeedPostSource source = FeedPostSource.imported,
  }) async {
    final currentState = state.asData?.value ?? const UploadQueueState();
    final newItems = <UploadQueueItem>[];

    for (final path in filePaths) {
      final item = UploadQueueItem(
        localPath: path,
        authorUid: authorUid,
        authorName: authorName,
        authorPhotoUrl: authorPhotoUrl,
        caption: caption,
        source: source,
        createdAt: DateTime.now(),
      );

      // Persist to Drift.
      final driftId = await _persistToDrift(item);
      newItems.add(item.copyWith(driftId: driftId));
    }

    state = AsyncData(currentState.copyWith(
      items: [...currentState.items, ...newItems],
    ));

    _processQueue();
  }

  /// Retries all permanently failed items.
  Future<void> retryFailed() async {
    final currentState = state.asData?.value;
    if (currentState == null) return;

    final updatedItems = currentState.items.map((item) {
      if (item.status == UploadItemStatus.failed) {
        return item.copyWith(status: UploadItemStatus.pending, attempts: 0);
      }
      return item;
    }).toList();

    state = AsyncData(currentState.copyWith(items: updatedItems));
    _processQueue();
  }

  // -------------------------------------------------------------------------
  // Internal processing
  // -------------------------------------------------------------------------

  bool _processing = false;

  Future<void> _processQueue() async {
    if (_processing) return;
    _processing = true;

    try {
      while (true) {
        final currentState = state.asData?.value;
        if (currentState == null) break;

        // Find the next pending item.
        final nextIndex = currentState.items.indexWhere(
          (i) => i.status == UploadItemStatus.pending,
        );
        if (nextIndex == -1) break;

        // Check connectivity before attempting.
        final isConnected =
            await ref.read(networkInfoProvider).isConnected;
        if (!isConnected) break;

        // Mark as processing.
        final items = List<UploadQueueItem>.from(currentState.items);
        items[nextIndex] =
            items[nextIndex].copyWith(status: UploadItemStatus.processing);
        state = AsyncData(currentState.copyWith(
          items: items,
          isProcessing: true,
        ));

        final item = items[nextIndex];

        try {
          // 1. Process image (EXIF strip, resize, compress).
          final processedPath = await _imageProcessor.process(item.localPath);

          // 2. Upload to Cloudinary.
          final publicId = await _cloudinaryUploader.upload(processedPath);

          // 3. Create feed_posts document in Firestore.
          await _firestore.collection('feed_posts').add({
            'authorUid': item.authorUid,
            'authorName': item.authorName,
            'authorPhotoUrl': item.authorPhotoUrl,
            'imageUrls': [publicId],
            'caption': item.caption,
            'source': item.source.name,
            'isHidden': false,
            'createdAt': FieldValue.serverTimestamp(),
          });

          // 4. Clean up: remove processed temp file.
          final processedFile = File(processedPath);
          if (await processedFile.exists()) {
            await processedFile.delete();
          }

          // 5. Remove from Drift and in-memory queue.
          if (item.driftId != null) {
            await _removeFromDrift(item.driftId!);
          }

          final updatedItems = List<UploadQueueItem>.from(
            state.asData?.value.items ?? [],
          );
          updatedItems.removeWhere((i) => i.driftId == item.driftId);
          state = AsyncData(UploadQueueState(
            items: updatedItems,
            isProcessing: updatedItems.any(
              (i) => i.status == UploadItemStatus.processing,
            ),
          ));
        } catch (_) {
          // Upload failed — apply retry logic.
          final newAttempts = item.attempts + 1;
          final updatedItems = List<UploadQueueItem>.from(
            state.asData?.value.items ?? [],
          );

          final idx =
              updatedItems.indexWhere((i) => i.driftId == item.driftId);
          if (idx != -1) {
            if (newAttempts >= _maxAttempts) {
              // Permanently failed.
              updatedItems[idx] = updatedItems[idx].copyWith(
                status: UploadItemStatus.failed,
                attempts: newAttempts,
              );
            } else {
              // Will retry after backoff.
              updatedItems[idx] = updatedItems[idx].copyWith(
                status: UploadItemStatus.pending,
                attempts: newAttempts,
              );

              // Exponential backoff: 2^attempts seconds.
              final backoffSeconds = 1 << newAttempts; // 2, 4, 8
              await Future<void>.delayed(
                Duration(seconds: backoffSeconds),
              );
            }
          }

          state = AsyncData(UploadQueueState(
            items: updatedItems,
            isProcessing: false,
          ));
        }
      }
    } finally {
      _processing = false;
      final currentState = state.asData?.value;
      if (currentState != null) {
        state = AsyncData(currentState.copyWith(isProcessing: false));
      }
    }
  }

  // -------------------------------------------------------------------------
  // Drift persistence
  // -------------------------------------------------------------------------

  Future<int> _persistToDrift(UploadQueueItem item) async {
    return _db.into(_db.pendingWrites).insert(
          PendingWritesCompanion.insert(
            collection: _pendingWriteCollection,
            documentId: '',
            payload: jsonEncode(item.toJson()),
            operation: 'upload',
            createdAt: item.createdAt,
          ),
        );
  }

  Future<void> _removeFromDrift(int driftId) async {
    await (_db.delete(_db.pendingWrites)
          ..where((t) => t.id.equals(driftId)))
        .go();
  }

  Future<List<UploadQueueItem>> _restoreFromDrift() async {
    final rows = await (_db.select(_db.pendingWrites)
          ..where((t) => t.collection.equals(_pendingWriteCollection)))
        .get();

    final items = <UploadQueueItem>[];
    for (final row in rows) {
      try {
        final json = jsonDecode(row.payload) as Map<String, dynamic>;
        // Only restore items whose local file still exists.
        if (File(json['localPath'] as String).existsSync()) {
          items.add(UploadQueueItem.fromJson(json, row.id));
        } else {
          // File gone — clean up the Drift row.
          await _removeFromDrift(row.id);
        }
      } catch (_) {
        // Corrupt row — clean up.
        await _removeFromDrift(row.id);
      }
    }
    return items;
  }
}
