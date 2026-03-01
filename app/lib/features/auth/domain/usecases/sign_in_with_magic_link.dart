import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/app_user.dart';
import '../repositories/auth_repository.dart';

class SignInWithMagicLink {
  final AuthRepository _repository;

  const SignInWithMagicLink(this._repository);

  FutureEither<AppUser> call(String token) {
    return _repository.signInWithCustomToken(token);
  }
}
