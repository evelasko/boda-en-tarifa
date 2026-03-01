import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/directory_providers.dart';
import '../widgets/filter_chips.dart';
import '../widgets/guest_grid.dart';

class DirectoryScreen extends ConsumerStatefulWidget {
  const DirectoryScreen({super.key});

  @override
  ConsumerState<DirectoryScreen> createState() => _DirectoryScreenState();
}

class _DirectoryScreenState extends ConsumerState<DirectoryScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filteredGuests = ref.watch(filteredGuestsProvider);
    final searchQuery = ref.watch(searchQueryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Invitados')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(directoryGuestsProvider);
          await ref.read(directoryGuestsProvider.future);
        },
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: TextField(
                  controller: _searchController,
                  onChanged: (value) {
                    ref.read(searchQueryProvider.notifier).update(value);
                  },
                  decoration: InputDecoration(
                    hintText: 'Buscar invitado...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              ref.read(searchQueryProvider.notifier).clear();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: DirectoryFilterChips(),
              ),
            ),
            filteredGuests.when(
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (_, _) => const SliverFillRemaining(
                child: _EmptyState(
                  icon: Icons.cloud_off_rounded,
                  message:
                      'Conéctate para cargar el directorio de invitados.',
                ),
              ),
              data: (guests) {
                if (guests.isEmpty) {
                  final hasFilters = searchQuery.isNotEmpty ||
                      ref.read(activeFiltersProvider).hasActiveFilters;

                  return SliverFillRemaining(
                    child: _EmptyState(
                      icon: hasFilters
                          ? Icons.search_off_rounded
                          : Icons.cloud_off_rounded,
                      message: hasFilters
                          ? 'No se encontraron invitados.'
                          : 'Conéctate para cargar el directorio de invitados.',
                    ),
                  );
                }
                return GuestGrid(guests: guests);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.icon, required this.message});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(height: 16),
            Text(
              message,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
