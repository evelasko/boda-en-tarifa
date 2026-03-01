import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/app_user.dart';

abstract class AuthRepository {
  FutureEither<AppUser> signInWithCustomToken(String token);
  FutureEither<AppUser> signInWithGoogle();
  FutureEither<AppUser> signInWithApple();
  FutureEither<void> signOut();
  FutureEither<AppUser?> getCurrentUser();
  Stream<AppUser?> onAuthStateChange();
}
