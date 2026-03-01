import 'package:boda_en_tarifa_app/core/either/typedefs.dart';

import '../repositories/auth_repository.dart';

class SignOut {
  final AuthRepository _repository;

  const SignOut(this._repository);

  FutureEither<void> call() {
    return _repository.signOut();
  }
}
