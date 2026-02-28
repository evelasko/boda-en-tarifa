sealed class Failure {
  final String message;
  final StackTrace? stackTrace;

  const Failure(this.message, [this.stackTrace]);
}

class ServerFailure extends Failure {
  const ServerFailure(super.message, [super.stackTrace]);
}

class CacheFailure extends Failure {
  const CacheFailure(super.message, [super.stackTrace]);
}

class NetworkFailure extends Failure {
  const NetworkFailure(super.message, [super.stackTrace]);
}

class AuthFailure extends Failure {
  const AuthFailure(super.message, [super.stackTrace]);
}

class PermissionFailure extends Failure {
  const PermissionFailure(super.message, [super.stackTrace]);
}
