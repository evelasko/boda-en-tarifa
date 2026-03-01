import 'dart:async';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:boda_en_tarifa_app/core/cloudinary/cloudinary_config.dart'
    as cloudinary;
import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';
import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';
import 'package:boda_en_tarifa_app/features/auth/presentation/providers/auth_providers.dart';

import '../../data/datasources/profile_remote_data_source.dart';
import '../../data/repositories/profile_repository_impl.dart';
import '../../domain/repositories/profile_repository.dart';
import '../../domain/usecases/update_profile.dart';

// ---------------------------------------------------------------------------
// Data layer providers
// ---------------------------------------------------------------------------

final profileRemoteDataSourceProvider =
    Provider<ProfileRemoteDataSource>((ref) {
  return ProfileRemoteDataSourceImpl(
    firestore: ref.watch(firestoreProvider),
  );
});

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepositoryImpl(
    remoteDataSource: ref.watch(profileRemoteDataSourceProvider),
    database: ref.watch(appDatabaseProvider),
  );
});

final updateProfileUseCaseProvider = Provider<UpdateProfile>((ref) {
  return UpdateProfile(ref.watch(profileRepositoryProvider));
});

// ---------------------------------------------------------------------------
// Guest profile (read-only, by UID)
// ---------------------------------------------------------------------------

/// Fetches any guest's profile by UID from Firestore.
final guestProfileProvider =
    FutureProvider.family<AppUser, String>((ref, uid) async {
  final repository = ref.watch(profileRepositoryProvider);
  final result = await repository.getGuestProfile(uid);
  return result.fold(
    (failure) => throw Exception(failure.message),
    (user) => user,
  );
});

// ---------------------------------------------------------------------------
// Profile editor (mutation controller)
// ---------------------------------------------------------------------------

final profileEditorProvider =
    AsyncNotifierProvider<ProfileEditor, void>(ProfileEditor.new);

/// Manages loading/error/success state for profile editing operations.
class ProfileEditor extends AsyncNotifier<void> {
  @override
  FutureOr<void> build() {}

  /// Saves updated profile fields to Firestore (with optimistic Drift write).
  Future<bool> saveProfile({
    required String uid,
    String? photoUrl,
    String? funFact,
    RelationshipStatus? relationshipStatus,
    bool? isDirectoryVisible,
  }) async {
    if (state.isLoading) return false;
    state = const AsyncLoading();

    final updateProfile = ref.read(updateProfileUseCaseProvider);

    final result = await updateProfile(
      uid: uid,
      photoUrl: photoUrl,
      funFact: funFact,
      relationshipStatus: relationshipStatus,
      isDirectoryVisible: isDirectoryVisible,
    );

    return result.fold(
      (failure) {
        state = AsyncError(failure, failure.stackTrace ?? StackTrace.current);
        return false;
      },
      (_) {
        state = const AsyncData(null);
        // Refresh the auth state so the current user's data is up to date
        ref.invalidate(authStateProvider);
        return true;
      },
    );
  }

  /// Uploads a photo to Cloudinary and returns the public ID.
  Future<String?> uploadPhoto(File imageFile) async {
    state = const AsyncLoading();
    try {
      final publicId = await cloudinary.uploadProfilePhoto(imageFile);
      state = const AsyncData(null);
      return publicId;
    } catch (e, st) {
      state = AsyncError(e, st);
      return null;
    }
  }
}
