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
