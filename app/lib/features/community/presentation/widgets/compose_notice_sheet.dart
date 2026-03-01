import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:boda_en_tarifa_app/features/auth/presentation/providers/auth_providers.dart';

import '../../domain/entities/notice.dart';
import '../providers/notice_board_providers.dart';

class ComposeNoticeSheet extends ConsumerStatefulWidget {
  const ComposeNoticeSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const ComposeNoticeSheet(),
    );
  }

  @override
  ConsumerState<ComposeNoticeSheet> createState() => _ComposeNoticeSheetState();
}

class _ComposeNoticeSheetState extends ConsumerState<ComposeNoticeSheet> {
  final _controller = TextEditingController();
  bool _isPosting = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _post() async {
    final body = _controller.text.trim();
    if (body.isEmpty) return;

    final user = ref.read(authStateProvider).asData?.value;
    if (user == null) return;

    setState(() => _isPosting = true);

    final notice = Notice(
      id: '',
      authorUid: user.uid,
      authorName: user.fullName,
      authorPhotoUrl: user.photoUrl,
      body: body,
      authorWhatsappNumber: user.whatsappNumber,
      authorEmail: user.email,
      createdAt: DateTime.now(),
    );

    final repo = ref.read(noticeBoardRepositoryProvider);
    final result = await repo.createNotice(notice);

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
                Icon(Icons.edit_note, color: colors.primary, size: 22),
                const SizedBox(width: 10),
                Text(
                  'Nuevo aviso',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: colors.onSurface,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Text field
            TextField(
              controller: _controller,
              maxLines: 4,
              maxLength: 500,
              autofocus: true,
              decoration: InputDecoration(
                hintText:
                    'Ej: Aterrizo en Málaga, tengo 2 plazas libres!',
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
