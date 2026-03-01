import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:boda_en_tarifa_app/core/providers/core_providers.dart';
import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';

import '../../data/datasources/guest_local_data_source.dart';
import '../../data/datasources/guest_remote_data_source.dart';
import '../../data/repositories/directory_repository_impl.dart';
import '../../domain/entities/guest_profile.dart';
import '../../domain/repositories/directory_repository.dart';

part 'directory_providers.g.dart';

// ---------------------------------------------------------------------------
// Data layer providers
// ---------------------------------------------------------------------------

@Riverpod(keepAlive: true)
GuestRemoteDataSource guestRemoteDataSource(Ref ref) {
  return GuestRemoteDataSourceImpl(
    firestore: ref.watch(firestoreProvider),
  );
}

@Riverpod(keepAlive: true)
GuestLocalDataSource guestLocalDataSource(Ref ref) {
  return GuestLocalDataSourceImpl(
    db: ref.watch(appDatabaseProvider),
  );
}

@Riverpod(keepAlive: true)
DirectoryRepository directoryRepository(Ref ref) {
  return DirectoryRepositoryImpl(
    remoteDataSource: ref.watch(guestRemoteDataSourceProvider),
    localDataSource: ref.watch(guestLocalDataSourceProvider),
    networkInfo: ref.watch(networkInfoProvider),
  );
}

// ---------------------------------------------------------------------------
// Directory guests (offline-first fetch)
// ---------------------------------------------------------------------------

@riverpod
Future<List<GuestProfile>> directoryGuests(Ref ref) async {
  final repo = ref.watch(directoryRepositoryProvider);
  final result = await repo.getGuests();
  return result.fold(
    (failure) => throw failure,
    (guests) => guests,
  );
}

// ---------------------------------------------------------------------------
// Search & filter state
// ---------------------------------------------------------------------------

@riverpod
class SearchQuery extends _$SearchQuery {
  @override
  String build() => '';

  void update(String value) => state = value;

  void clear() => state = '';
}

class DirectoryFilters {
  final Set<RelationshipStatus> relationshipStatuses;
  final Set<GuestSide> sides;

  const DirectoryFilters({
    this.relationshipStatuses = const {},
    this.sides = const {},
  });

  DirectoryFilters copyWith({
    Set<RelationshipStatus>? relationshipStatuses,
    Set<GuestSide>? sides,
  }) {
    return DirectoryFilters(
      relationshipStatuses: relationshipStatuses ?? this.relationshipStatuses,
      sides: sides ?? this.sides,
    );
  }

  bool get hasActiveFilters =>
      relationshipStatuses.isNotEmpty || sides.isNotEmpty;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DirectoryFilters &&
          runtimeType == other.runtimeType &&
          relationshipStatuses.length == other.relationshipStatuses.length &&
          relationshipStatuses.containsAll(other.relationshipStatuses) &&
          sides.length == other.sides.length &&
          sides.containsAll(other.sides);

  @override
  int get hashCode => Object.hash(
        Object.hashAllUnordered(relationshipStatuses),
        Object.hashAllUnordered(sides),
      );
}

@riverpod
class ActiveFilters extends _$ActiveFilters {
  @override
  DirectoryFilters build() => const DirectoryFilters();

  void toggleRelationship(RelationshipStatus status) {
    final updated = Set<RelationshipStatus>.from(state.relationshipStatuses);
    if (updated.contains(status)) {
      updated.remove(status);
    } else {
      updated.add(status);
    }
    state = state.copyWith(relationshipStatuses: updated);
  }

  void toggleSide(GuestSide side) {
    final updated = Set<GuestSide>.from(state.sides);
    if (updated.contains(side)) {
      updated.remove(side);
    } else {
      updated.add(side);
    }
    state = state.copyWith(sides: updated);
  }

  void clear() => state = const DirectoryFilters();
}

// ---------------------------------------------------------------------------
// Filtered results (client-side search + filter)
// ---------------------------------------------------------------------------

@riverpod
Future<List<GuestProfile>> filteredGuests(Ref ref) async {
  final guests = await ref.watch(directoryGuestsProvider.future);
  final query = ref.watch(searchQueryProvider).toLowerCase();
  final filters = ref.watch(activeFiltersProvider);

  return guests.where((guest) {
    if (query.isNotEmpty &&
        !guest.fullName.toLowerCase().contains(query)) {
      return false;
    }
    if (filters.relationshipStatuses.isNotEmpty &&
        !filters.relationshipStatuses.contains(guest.relationshipStatus)) {
      return false;
    }
    if (filters.sides.isNotEmpty && !filters.sides.contains(guest.side)) {
      return false;
    }
    return true;
  }).toList();
}
