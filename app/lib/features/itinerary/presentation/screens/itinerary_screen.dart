import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../widgets/recommendations_view.dart';
import '../widgets/timeline_view.dart';

class ItineraryScreen extends StatelessWidget {
  const ItineraryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Agenda'),
          bottom: TabBar(
            labelStyle: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
            unselectedLabelStyle: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
            labelColor: colors.primary,
            unselectedLabelColor: colors.onSurfaceVariant,
            indicatorColor: colors.primary,
            indicatorSize: TabBarIndicatorSize.label,
            dividerColor: colors.outlineVariant,
            tabs: const [
              Tab(text: 'Programa'),
              Tab(text: 'Mapa'),
              Tab(text: 'Recomendaciones'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            TimelineView(),
            _PlaceholderTab(
              icon: Icons.map_outlined,
              label: 'Mapa',
              subtitle: 'Próximamente',
            ),
            RecommendationsView(),
          ],
        ),
      ),
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({
    required this.icon,
    required this.label,
    required this.subtitle,
  });

  final IconData icon;
  final String label;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: colors.onSurfaceVariant),
          const SizedBox(height: 16),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: colors.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
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
