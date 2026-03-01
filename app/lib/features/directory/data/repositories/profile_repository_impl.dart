import 'package:drift/drift.dart';
import 'package:fpdart/fpdart.dart';

import 'package:boda_en_tarifa_app/core/database/app_database.dart';
import 'package:boda_en_tarifa_app/core/either/typedefs.dart';
import 'package:boda_en_tarifa_app/core/error/failures.dart';
import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';

import '../../domain/repositories/profile_repository.dart';
import '../datasources/profile_remote_data_source.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  final ProfileRemoteDataSource _remoteDataSource;
  final AppDatabase _database;

  ProfileRepositoryImpl({
    required ProfileRemoteDataSource remoteDataSource,
    required AppDatabase database,
  })  : _remoteDataSource = remoteDataSource,
        _database = database;

  @override
  FutureEither<AppUser> getGuestProfile(String uid) async {
    try {
      final user = await _remoteDataSource.getGuestProfile(uid);
      return Right(user);
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }

  @override
  FutureEither<void> updateProfile({
    required String uid,
    String? photoUrl,
    String? funFact,
    RelationshipStatus? relationshipStatus,
    bool? isDirectoryVisible,
  }) async {
    try {
      await _remoteDataSource.updateProfile(
        uid: uid,
        photoUrl: photoUrl,
        funFact: funFact,
        relationshipStatus: relationshipStatus,
        isDirectoryVisible: isDirectoryVisible,
      );
      return const Right(null);
    } catch (e, st) {
      return Left(ServerFailure(e.toString(), st));
    }
  }

  @override
  Future<void> updateCachedGuest({
    required String uid,
    String? photoUrl,
    String? funFact,
    RelationshipStatus? relationshipStatus,
  }) async {
    try {
      final companion = CachedGuestsCompanion(
        photoUrl: photoUrl != null ? Value(photoUrl) : const Value.absent(),
        funFact: funFact != null ? Value(funFact) : const Value.absent(),
        relationshipStatus: relationshipStatus != null
            ? Value(relationshipStatus.name)
            : const Value.absent(),
      );

      await (_database.update(_database.cachedGuests)
            ..where((t) => t.uid.equals(uid)))
          .write(companion);
    } catch (_) {
      // Cache update is best-effort; don't propagate errors
    }
  }
}
