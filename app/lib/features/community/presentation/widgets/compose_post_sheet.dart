import 'dart:io';

import 'package:cloudinary_public/cloudinary_public.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import 'package:boda_en_tarifa_app/core/cloudinary/cloudinary_config.dart';
import 'package:boda_en_tarifa_app/features/auth/presentation/providers/auth_providers.dart';

import '../../domain/entities/feed_post.dart';
import '../providers/feed_providers.dart';

class ComposePostSheet extends ConsumerStatefulWidget {
  const ComposePostSheet({super.key, required this.images});

  final List<XFile> images;

  /// Pick images and show the compose sheet.
  static Future<void> pickAndShow(BuildContext context) async {
    final picker = ImagePicker();
    final images = await picker.pickMultiImage();
    if (images.isEmpty) return;
    if (!context.mounted) return;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => ComposePostSheet(images: images),
    );
  }

  @override
  ConsumerState<ComposePostSheet> createState() => _ComposePostSheetState();
}

class _ComposePostSheetState extends ConsumerState<ComposePostSheet> {
  final _captionController = TextEditingController();
  bool _isPosting = false;

  @override
  void dispose() {
    _captionController.dispose();
    super.dispose();
  }

  Future<void> _post() async {
    final user = ref.read(authStateProvider).asData?.value;
    if (user == null) return;

    setState(() => _isPosting = true);

    try {
      // Upload images to Cloudinary
      final publicIds = <String>[];
      for (final image in widget.images) {
        final response = await cloudinary.uploadFile(
          CloudinaryFile.fromFile(
            image.path,
            tags: ['feed_post'],
          ),
        );
        publicIds.add(response.publicId);
      }

      // Create the feed post
      final post = FeedPost(
        id: '',
        authorUid: user.uid,
        authorName: user.fullName,
        authorPhotoUrl: user.photoUrl,
        imageUrls: publicIds,
        caption: _captionController.text.trim().isEmpty
            ? null
            : _captionController.text.trim(),
        source: FeedPostSource.imported,
        createdAt: DateTime.now(),
      );

      final repo = ref.read(feedRepositoryProvider);
      final result = await repo.createFeedPost(post);

      if (!mounted) return;

      result.fold(
        (failure) {
          setState(() => _isPosting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(failure.message)),
          );
        },
        (_) => Navigator.of(context).pop(),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isPosting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al subir las fotos: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + bottomInset),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: colors.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            // Header
            Row(
              children: [
                Icon(Icons.add_photo_alternate, color: colors.primary, size: 22),
                const SizedBox(width: 10),
                Text(
                  'Nueva publicación',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: colors.onSurface,
                  ),
                ),
                const Spacer(),
                Text(
                  '${widget.images.length} foto${widget.images.length == 1 ? '' : 's'}',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Image preview strip
            SizedBox(
              height: 80,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: widget.images.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, index) => ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    File(widget.images[index].path),
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Caption field
            TextField(
              controller: _captionController,
              maxLines: 3,
              maxLength: 300,
              decoration: InputDecoration(
                hintText: 'Añade un pie de foto...',
                hintStyle: GoogleFonts.inter(
                  fontSize: 14,
                  color: colors.onSurfaceVariant,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: colors.outlineVariant),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: colors.outlineVariant),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: colors.primary, width: 2),
                ),
              ),
              style: GoogleFonts.inter(fontSize: 14),
            ),
            const SizedBox(height: 16),
            // Post button
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _isPosting ? null : _post,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isPosting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(
                        'Publicar',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
