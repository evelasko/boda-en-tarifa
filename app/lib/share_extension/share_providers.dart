import 'package:flutter_riverpod/flutter_riverpod.dart';

// ---------------------------------------------------------------------------
// Share confirmation state — read by the scaffold to show a snackbar.
// ---------------------------------------------------------------------------

enum ShareConfirmationType { enqueued, authRequired }

class ShareConfirmation {
  final ShareConfirmationType type;
  final int imageCount;

  const ShareConfirmation({required this.type, required this.imageCount});
}

final shareConfirmationProvider =
    NotifierProvider<ShareConfirmationNotifier, ShareConfirmation?>(
  ShareConfirmationNotifier.new,
);

class ShareConfirmationNotifier extends Notifier<ShareConfirmation?> {
  @override
  ShareConfirmation? build() => null;

  void set(ShareConfirmation? value) => state = value;
}

/// Holds file paths received via share extension while unauthenticated.
/// Drained into the upload queue once the user logs in.
final pendingSharePathsProvider =
    NotifierProvider<PendingSharePathsNotifier, List<String>>(
  PendingSharePathsNotifier.new,
);

class PendingSharePathsNotifier extends Notifier<List<String>> {
  @override
  List<String> build() => [];

  void add(List<String> paths) => state = [...state, ...paths];

  void clear() => state = [];
}
