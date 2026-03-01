import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/recommendations_provider.dart';
import 'recommendation_card.dart';

class RecommendationsView extends ConsumerWidget {
  const RecommendationsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recommendationsAsync = ref.watch(recommendationsProvider);

    return recommendationsAsync.when(
      data: (recommendations) => _RecommendationsList(
        recommendations: recommendations,
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, _) => const _ErrorView(),
    );
  }
}

class _RecommendationsList extends StatelessWidget {
  const _RecommendationsList({required this.recommendations});

  final List recommendations;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                colors.primaryContainer,
                colors.surface,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: colors.outlineVariant),
          ),
          child: Row(
            children: [
              Text('🌊', style: GoogleFonts.inter(fontSize: 20)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Nuestros sitios favoritos en Tarifa — para que disfrutéis como locales.',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                    color: colors.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        for (final recommendation in recommendations) ...[
          RecommendationCard(recommendation: recommendation),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 48,
            color: colors.onSurfaceVariant,
          ),
          const SizedBox(height: 12),
          Text(
            'No se pudieron cargar las recomendaciones',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: colors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
