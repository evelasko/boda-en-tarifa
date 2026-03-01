import 'package:firebase_auth/firebase_auth.dart';
import 'package:fpdart/fpdart.dart';

import 'package:boda_en_tarifa_app/core/error/failures.dart';
import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/network/network_info.dart';

import '../../domain/entities/app_user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final NetworkInfo _networkInfo;

  AuthRepositoryImpl({
    required AuthRemoteDataSource remoteDataSource,
    required NetworkInfo networkInfo,
  })  : _remoteDataSource = remoteDataSource,
        _networkInfo = networkInfo;

  @override
  FutureEither<AppUser> signInWithCustomToken(String token) async {
    if (!await _networkInfo.isConnected) {
      return const Left(
        NetworkFailure('No hay conexión a internet. Inténtalo de nuevo.'),
      );
    }
    try {
      final user = await _remoteDataSource.signInWithCustomToken(token);
      return Right(user);
    } on FirebaseAuthException catch (e, st) {
      return Left(_mapAuthException(e, st));
    } on FirebaseException catch (e, st) {
      return Left(ServerFailure(e.message ?? 'Error del servidor', st));
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }

  @override
  FutureEither<AppUser> signInWithGoogle() async {
    if (!await _networkInfo.isConnected) {
      return const Left(
        NetworkFailure('No hay conexión a internet. Inténtalo de nuevo.'),
      );
    }
    try {
      final user = await _remoteDataSource.signInWithGoogle();
      return Right(user);
    } on FirebaseAuthException catch (e, st) {
      return Left(_mapAuthException(e, st));
    } on FirebaseException catch (e, st) {
      return Left(ServerFailure(e.message ?? 'Error del servidor', st));
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }

  @override
  FutureEither<AppUser> signInWithApple() async {
    if (!await _networkInfo.isConnected) {
      return const Left(
        NetworkFailure('No hay conexión a internet. Inténtalo de nuevo.'),
      );
    }
    try {
      final user = await _remoteDataSource.signInWithApple();
      return Right(user);
    } on FirebaseAuthException catch (e, st) {
      return Left(_mapAuthException(e, st));
    } on FirebaseException catch (e, st) {
      return Left(ServerFailure(e.message ?? 'Error del servidor', st));
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }

  @override
  FutureEither<void> signOut() async {
    try {
      await _remoteDataSource.signOut();
      return const Right(null);
    } catch (e, st) {
      return Left(AuthFailure(e.toString(), st));
    }
  }

  @override
  FutureEither<AppUser?> getCurrentUser() async {
    try {
      final user = await _remoteDataSource.getCurrentUser();
      return Right(user);
    } on FirebaseAuthException catch (e, st) {
      return Left(_mapAuthException(e, st));
    } on FirebaseException catch (e, st) {
      return Left(ServerFailure(e.message ?? 'Error del servidor', st));
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }

  @override
  Stream<AppUser?> onAuthStateChange() {
    return _remoteDataSource.onAuthStateChange();
  }

  Failure _mapAuthException(FirebaseAuthException e, StackTrace st) {
    return switch (e.code) {
      'guest-not-found' || 'user-not-found' => AuthFailure(
          'No hemos encontrado tu invitación. Contacta con Enrique o Manuel para obtener acceso.',
          st,
        ),
      'sign-in-cancelled' => AuthFailure('Inicio de sesión cancelado', st),
      _ => AuthFailure(e.message ?? 'Error de autenticación', st),
    };
  }
}
