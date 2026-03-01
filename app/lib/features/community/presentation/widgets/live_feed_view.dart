import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:boda_en_tarifa_app/features/auth/presentation/providers/auth_providers.dart';

import '../providers/feed_providers.dart';
import 'compose_post_sheet.dart';
import 'feed_post_card.dart';

class LiveFeedView extends ConsumerWidget {
  const LiveFeedView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(liveFeedProvider);
    final colors = Theme.of(context).colorScheme;
    final currentUid = ref.watch(authStateProvider).asData?.value?.uid;
    final pageLimit = ref.watch(feedPageLimitProvider);

    return Scaffold(
      body: feed.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: colors.error),
              const SizedBox(height: 12),
              Text(
                'Error al cargar el muro',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  color: colors.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        data: (posts) {
          if (posts.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.photo_library_outlined,
                    size: 64,
                    color: colors.outlineVariant,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Sin fotos todavía',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Sé el primero en compartir una foto',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            );
          }

          final hasMore = posts.length >= pageLimit;

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(liveFeedProvider);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: posts.length + (hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == posts.length) {
                  return _LoadMoreButton(
                    onTap: () =>
                        ref.read(feedPageLimitProvider.notifier).increase(),
                  );
                }

                final post = posts[index];
                return Padding(
                  padding: EdgeInsets.only(bottom: index < posts.length - 1 ? 16 : 0),
                  child: FeedPostCard(
                    post: post,
                    currentUid: currentUid,
                    onHide: () async {
                      final repo = ref.read(feedRepositoryProvider);
                      final result = await repo.hideFeedPost(post.id);
                      result.fold(
                        (failure) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(failure.message)),
                            );
                          }
                        },
                        (_) {},
                      );
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => ComposePostSheet.pickAndShow(context),
        backgroundColor: colors.primary,
        foregroundColor: colors.onPrimary,
        child: const Icon(Icons.add_a_photo),
      ),
    );
  }
}

class _LoadMoreButton extends StatelessWidget {
  const _LoadMoreButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Center(
        child: TextButton.icon(
          onPressed: onTap,
          icon: const Icon(Icons.expand_more),
          label: Text(
            'Cargar más',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          style: TextButton.styleFrom(
            foregroundColor: colors.primary,
          ),
        ),
      ),
    );
  }
}
