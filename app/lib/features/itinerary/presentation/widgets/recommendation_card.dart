import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../domain/entities/recommendation.dart';

class RecommendationCard extends StatelessWidget {
  const RecommendationCard({super.key, required this.recommendation});

  final Recommendation recommendation;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (recommendation.category != null) ...[
                _CategoryChip(
                  category: recommendation.category!,
                  colorScheme: colors,
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Text(
                  recommendation.name,
                  style: GoogleFonts.inter(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: colors.onSurface,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            recommendation.description,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: colors.onSurfaceVariant,
              height: 1.5,
            ),
          ),
          if (recommendation.mapUrl != null) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () => _openMap(recommendation.mapUrl!),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: colors.primaryContainer,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.map_outlined,
                      size: 16,
                      color: colors.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Ver en Mapa',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: colors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _openMap(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({
    required this.category,
    required this.colorScheme,
  });

  final String category;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    final (color, icon) = _categoryStyle(category);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            category,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  (Color, IconData) _categoryStyle(String category) => switch (category) {
        'Restaurante' => (colorScheme.secondary, Icons.restaurant_outlined),
        'Café' => (colorScheme.tertiary, Icons.coffee_outlined),
        'Bar' => (colorScheme.secondary, Icons.local_bar_outlined),
        'Playa' => (colorScheme.primary, Icons.beach_access_outlined),
        'Actividad' => (colorScheme.tertiary, Icons.directions_walk_outlined),
        _ => (colorScheme.onSurfaceVariant, Icons.place_outlined),
      };
}
