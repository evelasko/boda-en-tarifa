import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/app_user.dart';
import '../repositories/auth_repository.dart';

class SignInWithGoogle {
  final AuthRepository _repository;

  const SignInWithGoogle(this._repository);

  FutureEither<AppUser> call() {
    return _repository.signInWithGoogle();
  }
}
