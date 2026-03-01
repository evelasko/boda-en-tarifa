import 'dart:async';
import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'
    show AsyncNotifier, AsyncNotifierProvider;
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:boda_en_tarifa_app/core/database/app_database.dart';
import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';
import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';

import 'auth_providers.dart';

part 'onboarding_providers.g.dart';

/// Reads onboarding completion status from local Drift ConfigCache.
/// Returns false if auth state is not yet available.
@Riverpod(keepAlive: true)
Future<bool> onboardingComplete(Ref ref) async {
  final user = ref.watch(authStateProvider).asData?.value;
  if (user == null) return false;

  final db = ref.watch(appDatabaseProvider);
  final row = await (db.select(db.configCache)
        ..where((t) => t.key.equals('onboarding_complete_${user.uid}')))
      .getSingleOrNull();

  return row?.value == 'true';
}

// ---------------------------------------------------------------------------
// Onboarding controller (manual provider — no code-gen needed)
// ---------------------------------------------------------------------------

final onboardingControllerProvider =
    AsyncNotifierProvider<OnboardingController, void>(
        OnboardingController.new);

/// Manages the onboarding wizard completion: saves profile data to Firestore
/// and marks onboarding as complete in local storage.
class OnboardingController extends AsyncNotifier<void> {
  @override
  FutureOr<void> build() {}

  /// Saves wizard data to Firestore and marks onboarding complete locally.
  /// Returns true on success, false on failure.
  Future<bool> completeOnboarding({
    required String uid,
    String? whatsappNumber,
    required bool isDirectoryVisible,
    String? funFact,
    RelationshipStatus? relationshipStatus,
  }) async {
    if (state.isLoading) return false;
    state = const AsyncLoading();

    try {
      final firestore = ref.read(firestoreProvider);
      final db = ref.read(appDatabaseProvider);

      // Build Firestore update map
      final updates = <String, dynamic>{
        'isDirectoryVisible': isDirectoryVisible,
        'profileClaimed': true,
        'updatedAt': FieldValue.serverTimestamp(),
      };
      if (whatsappNumber != null && whatsappNumber.isNotEmpty) {
        updates['whatsappNumber'] = whatsappNumber;
      }
      if (funFact != null && funFact.isNotEmpty) {
        updates['funFact'] = funFact;
      }
      if (relationshipStatus != null) {
        updates['relationshipStatus'] = relationshipStatus.name;
      }

      // Try Firestore write; if offline, queue in PendingWrites
      try {
        await firestore.collection('guests').doc(uid).update(updates);
      } catch (_) {
        // Queue for later sync when back online
        final queuePayload = Map<String, dynamic>.from(updates)
          ..remove('updatedAt');
        await db.into(db.pendingWrites).insert(
              PendingWritesCompanion.insert(
                collection: 'guests',
                documentId: uid,
                payload: jsonEncode(queuePayload),
                operation: 'update',
                createdAt: DateTime.now(),
              ),
            );
      }

      // Mark onboarding complete locally
      await db.into(db.configCache).insert(
            ConfigCacheCompanion.insert(
              key: 'onboarding_complete_$uid',
              value: 'true',
              updatedAt: DateTime.now(),
            ),
            mode: InsertMode.insertOrReplace,
          );

      // Invalidate providers so the router picks up the change
      ref.invalidate(onboardingCompleteProvider);
      ref.invalidate(authStateProvider);

      state = const AsyncData(null);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}
