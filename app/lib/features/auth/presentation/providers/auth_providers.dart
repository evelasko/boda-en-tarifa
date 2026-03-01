import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart'
    show AsyncNotifier, AsyncNotifierProvider;
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';

import '../../data/datasources/auth_remote_data_source.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/entities/app_user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/usecases/sign_in_with_apple.dart';
import '../../domain/usecases/sign_in_with_google.dart';
import '../../domain/usecases/sign_in_with_magic_link.dart';
import '../../domain/usecases/sign_out.dart';

part 'auth_providers.g.dart';

@Riverpod(keepAlive: true)
AuthRemoteDataSource authRemoteDataSource(Ref ref) {
  return AuthRemoteDataSourceImpl(
    firebaseAuth: ref.watch(firebaseAuthProvider),
    firestore: ref.watch(firestoreProvider),
  );
}

@Riverpod(keepAlive: true)
AuthRepository authRepository(Ref ref) {
  return AuthRepositoryImpl(
    remoteDataSource: ref.watch(authRemoteDataSourceProvider),
    networkInfo: ref.watch(networkInfoProvider),
  );
}

@Riverpod(keepAlive: true)
SignInWithMagicLink signInWithMagicLinkUseCase(Ref ref) {
  return SignInWithMagicLink(ref.watch(authRepositoryProvider));
}

@Riverpod(keepAlive: true)
SignInWithGoogle signInWithGoogleUseCase(Ref ref) {
  return SignInWithGoogle(ref.watch(authRepositoryProvider));
}

@Riverpod(keepAlive: true)
SignInWithApple signInWithAppleUseCase(Ref ref) {
  return SignInWithApple(ref.watch(authRepositoryProvider));
}

@Riverpod(keepAlive: true)
SignOut signOutUseCase(Ref ref) {
  return SignOut(ref.watch(authRepositoryProvider));
}

/// Auth state stream that provides the full AppUser entity.
/// Emits null when the user is not authenticated.
@Riverpod(keepAlive: true)
Stream<AppUser?> authState(Ref ref) {
  return ref.watch(authRepositoryProvider).onAuthStateChange();
}

// ---------------------------------------------------------------------------
// Magic link deep link processor (manual provider — no code-gen needed)
// ---------------------------------------------------------------------------

final magicLinkProcessorProvider =
    AsyncNotifierProvider<MagicLinkProcessor, void>(MagicLinkProcessor.new);

/// Handles the full magic link deep link flow: sign out existing user if
/// needed, then sign in with the custom token from the deep link URL.
class MagicLinkProcessor extends AsyncNotifier<void> {
  @override
  FutureOr<void> build() {}

  Future<void> process(String token) async {
    if (state.isLoading) return;
    state = const AsyncLoading();

    // Sign out the current user first if already authenticated, so the new
    // magic link token can authenticate a (potentially different) guest.
    final currentUser = ref.read(authStateProvider).asData?.value;
    if (currentUser != null) {
      await ref.read(signOutUseCaseProvider)();
    }

    final result = await ref.read(signInWithMagicLinkUseCaseProvider)(token);
    state = result.fold(
      (f) => AsyncError(f, f.stackTrace ?? StackTrace.current),
      (_) => const AsyncData(null),
    );
  }
}

// ---------------------------------------------------------------------------
// Sign-in controller (manual provider — no code-gen needed)
// ---------------------------------------------------------------------------

final signInControllerProvider =
    AsyncNotifierProvider<SignInController, void>(SignInController.new);

/// Manages the loading / error state while the user signs in via any method.
class SignInController extends AsyncNotifier<void> {
  @override
  FutureOr<void> build() {}

  Future<void> signInWithGoogle() async {
    if (state.isLoading) return;
    state = const AsyncLoading();
    final result = await ref.read(signInWithGoogleUseCaseProvider)();
    state = result.fold(
      (f) => AsyncError(f, f.stackTrace ?? StackTrace.current),
      (_) => const AsyncData(null),
    );
  }

  Future<void> signInWithApple() async {
    if (state.isLoading) return;
    state = const AsyncLoading();
    final result = await ref.read(signInWithAppleUseCaseProvider)();
    state = result.fold(
      (f) => AsyncError(f, f.stackTrace ?? StackTrace.current),
      (_) => const AsyncData(null),
    );
  }

  Future<void> signInWithMagicLink(String token) async {
    if (state.isLoading) return;
    state = const AsyncLoading();
    final result = await ref.read(signInWithMagicLinkUseCaseProvider)(token);
    state = result.fold(
      (f) => AsyncError(f, f.stackTrace ?? StackTrace.current),
      (_) => const AsyncData(null),
    );
  }
}
