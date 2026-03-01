import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../widgets/notice_board_view.dart';

class CommunityScreen extends StatelessWidget {
  const CommunityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Comunidad'),
          bottom: TabBar(
            labelStyle: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
            unselectedLabelStyle: GoogleFonts.inter(fontSize: 14),
            tabs: const [
              Tab(text: 'Muro'),
              Tab(text: 'Tablón'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _LiveFeedPlaceholder(),
            NoticeBoardView(),
          ],
        ),
      ),
    );
  }
}

class _LiveFeedPlaceholder extends StatelessWidget {
  const _LiveFeedPlaceholder();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.photo_library_outlined, size: 64, color: colors.outlineVariant),
          const SizedBox(height: 16),
          Text(
            'Muro social',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: colors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Próximamente',
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
