import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../entities/app_user.dart';
import '../repositories/auth_repository.dart';

class SignInWithApple {
  final AuthRepository _repository;

  const SignInWithApple(this._repository);

  FutureEither<AppUser> call() {
    return _repository.signInWithApple();
  }
}
