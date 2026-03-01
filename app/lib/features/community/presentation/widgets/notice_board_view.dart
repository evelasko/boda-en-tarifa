import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../providers/notice_board_providers.dart';
import 'compose_notice_sheet.dart';
import 'notice_card.dart';

class NoticeBoardView extends ConsumerWidget {
  const NoticeBoardView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notices = ref.watch(noticeBoardProvider);
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      body: notices.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: colors.error),
              const SizedBox(height: 12),
              Text(
                'Error al cargar los avisos',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  color: colors.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        data: (noticeList) {
          if (noticeList.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.forum_outlined,
                    size: 64,
                    color: colors.outlineVariant,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Sin avisos todavía',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Sé el primero en publicar un aviso',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: noticeList.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) =>
                NoticeCard(notice: noticeList[index]),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => ComposeNoticeSheet.show(context),
        backgroundColor: colors.primary,
        foregroundColor: colors.onPrimary,
        child: const Icon(Icons.edit),
      ),
    );
  }
}
