import 'package:fpdart/fpdart.dart';

import 'package:boda_en_tarifa_app/core/error/failures.dart';

typedef FutureEither<T> = Future<Either<Failure, T>>;
