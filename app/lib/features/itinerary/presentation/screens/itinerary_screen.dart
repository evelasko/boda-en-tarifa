import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../widgets/custom_map.dart';
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
            CustomMapWidget(),
            RecommendationsView(),
          ],
        ),
      ),
    );
  }
}
