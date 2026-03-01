import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';

import '../providers/directory_providers.dart';

class DirectoryFilterChips extends ConsumerWidget {
  const DirectoryFilterChips({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filters = ref.watch(activeFiltersProvider);
    final theme = Theme.of(context);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          ...RelationshipStatus.values.map((status) {
            final isSelected =
                filters.relationshipStatuses.contains(status);
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(_relationshipLabel(status)),
                selected: isSelected,
                onSelected: (_) => ref
                    .read(activeFiltersProvider.notifier)
                    .toggleRelationship(status),
                selectedColor: theme.colorScheme.primaryContainer,
                checkmarkColor: theme.colorScheme.primary,
                side: BorderSide(
                  color: isSelected
                      ? theme.colorScheme.primary
                      : theme.colorScheme.outline,
                ),
              ),
            );
          }),
          ...GuestSide.values.map((side) {
            final isSelected = filters.sides.contains(side);
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(_sideLabel(side)),
                selected: isSelected,
                onSelected: (_) => ref
                    .read(activeFiltersProvider.notifier)
                    .toggleSide(side),
                selectedColor: theme.colorScheme.secondaryContainer,
                checkmarkColor: theme.colorScheme.secondary,
                side: BorderSide(
                  color: isSelected
                      ? theme.colorScheme.secondary
                      : theme.colorScheme.outline,
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  String _relationshipLabel(RelationshipStatus status) {
    return switch (status) {
      RelationshipStatus.soltero => 'Soltero/a',
      RelationshipStatus.enPareja => 'En pareja',
      RelationshipStatus.buscando => 'Buscando',
    };
  }

  String _sideLabel(GuestSide side) {
    return switch (side) {
      GuestSide.novioA => 'Amigos de Enrique',
      GuestSide.novioB => 'Amigos de Manuel',
      GuestSide.ambos => 'Ambos',
    };
  }
}
