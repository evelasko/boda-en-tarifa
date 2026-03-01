import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:boda_en_tarifa_app/core/cloudinary/cloudinary_config.dart';

import '../../domain/entities/feed_post.dart';

class FeedPostCard extends StatelessWidget {
  const FeedPostCard({
    super.key,
    required this.post,
    required this.currentUid,
    this.onHide,
  });

  final FeedPost post;
  final String? currentUid;
  final VoidCallback? onHide;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return GestureDetector(
      onLongPress: _canHide ? () => _showHideDialog(context) : null,
      child: Container(
        decoration: BoxDecoration(
          color: colors.surface,
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
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Author header
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
              child: Row(
                children: [
                  _AuthorAvatar(post: post),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          post.authorName,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: colors.onSurface,
                          ),
                        ),
                        Row(
                          children: [
                            Text(
                              _formatRelativeTime(post.createdAt),
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: colors.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(width: 6),
                            _SourceBadge(source: post.source),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Image(s)
            _PostImages(imageUrls: post.imageUrls),
            // Caption
            if (post.caption != null && post.caption!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                child: Text(
                  post.caption!,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    height: 1.4,
                    color: colors.onSurface,
                  ),
                ),
              )
            else
              const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  bool get _canHide => currentUid != null && currentUid == post.authorUid;

  void _showHideDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Ocultar publicación'),
        content:
            const Text('Esta publicación dejará de ser visible en el muro.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              onHide?.call();
            },
            child: const Text('Ocultar'),
          ),
        ],
      ),
    );
  }

  static String _formatRelativeTime(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) return 'Ahora';
    if (diff.inMinutes < 60) return 'Hace ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Hace ${diff.inHours} h';
    if (diff.inDays < 7) return 'Hace ${diff.inDays} d';
    return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
  }
}

// ---------------------------------------------------------------------------
// Private sub-widgets
// ---------------------------------------------------------------------------

class _AuthorAvatar extends StatelessWidget {
  const _AuthorAvatar({required this.post});

  final FeedPost post;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final hasPhoto = post.authorPhotoUrl != null;

    return CircleAvatar(
      radius: 18,
      backgroundColor: colors.primary.withValues(alpha: 0.15),
      backgroundImage: hasPhoto
          ? CachedNetworkImageProvider(
              resolvePhotoThumbnail(post.authorPhotoUrl!, size: 72),
            )
          : null,
      child: hasPhoto
          ? null
          : Text(
              post.authorName.isNotEmpty
                  ? post.authorName[0].toUpperCase()
                  : '?',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: colors.primary,
              ),
            ),
    );
  }
}

class _SourceBadge extends StatelessWidget {
  const _SourceBadge({required this.source});

  final FeedPostSource source;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final (icon, label) = switch (source) {
      FeedPostSource.unfiltered => (Icons.camera_alt, 'Cámara'),
      FeedPostSource.imported => (Icons.photo_library, 'Galería'),
      FeedPostSource.shareExtension => (Icons.share, 'Compartido'),
    };

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: colors.onSurfaceVariant),
        const SizedBox(width: 3),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: colors.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _PostImages extends StatelessWidget {
  const _PostImages({required this.imageUrls});

  final List<String> imageUrls;

  @override
  Widget build(BuildContext context) {
    if (imageUrls.isEmpty) return const SizedBox.shrink();

    if (imageUrls.length == 1) {
      return _SingleImage(publicId: imageUrls.first);
    }

    // Multiple images: horizontal page view
    return SizedBox(
      height: 300,
      child: PageView.builder(
        itemCount: imageUrls.length,
        itemBuilder: (context, index) =>
            _SingleImage(publicId: imageUrls[index]),
      ),
    );
  }
}

class _SingleImage extends StatelessWidget {
  const _SingleImage({required this.publicId});

  final String publicId;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return CachedNetworkImage(
      imageUrl: cloudinaryUrl(publicId, width: 1080),
      placeholder: (_, _) => AspectRatio(
        aspectRatio: 1,
        child: Container(
          color: colors.surfaceContainerHighest,
          child: const Center(child: CircularProgressIndicator()),
        ),
      ),
      errorWidget: (_, _, _) => AspectRatio(
        aspectRatio: 1,
        child: Container(
          color: colors.surfaceContainerHighest,
          child: Icon(
            Icons.broken_image_outlined,
            size: 48,
            color: colors.outlineVariant,
          ),
        ),
      ),
      fit: BoxFit.cover,
      width: double.infinity,
    );
  }
}
