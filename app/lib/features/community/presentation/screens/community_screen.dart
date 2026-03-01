import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../widgets/live_feed_view.dart';
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
            LiveFeedView(),
            NoticeBoardView(),
          ],
        ),
      ),
    );
  }
}
