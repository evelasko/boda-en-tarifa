import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../domain/entities/notice.dart';

class NoticeCard extends StatelessWidget {
  const NoticeCard({super.key, required this.notice});

  final Notice notice;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
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
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Author row
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: colors.primary.withValues(alpha: 0.15),
                backgroundImage: notice.authorPhotoUrl != null
                    ? NetworkImage(notice.authorPhotoUrl!)
                    : null,
                child: notice.authorPhotoUrl == null
                    ? Text(
                        notice.authorName.isNotEmpty
                            ? notice.authorName[0].toUpperCase()
                            : '?',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: colors.primary,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notice.authorName,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: colors.onSurface,
                      ),
                    ),
                    Text(
                      _formatRelativeTime(notice.createdAt),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Body text
          Text(
            notice.body,
            style: GoogleFonts.inter(
              fontSize: 14,
              height: 1.4,
              color: colors.onSurface,
            ),
          ),
          const SizedBox(height: 12),
          // Contact button
          _ContactButton(notice: notice),
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

class _ContactButton extends StatelessWidget {
  const _ContactButton({required this.notice});

  final Notice notice;

  bool get _hasWhatsapp =>
      notice.authorWhatsappNumber != null &&
      notice.authorWhatsappNumber!.isNotEmpty;

  bool get _hasEmail =>
      notice.authorEmail != null && notice.authorEmail!.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    if (!_hasWhatsapp && !_hasEmail) return const SizedBox.shrink();

    final isWhatsapp = _hasWhatsapp;
    final color =
        isWhatsapp ? const Color(0xFF25D366) : Theme.of(context).colorScheme.primary;
    final icon = isWhatsapp ? Icons.chat : Icons.email_outlined;
    final label = isWhatsapp ? 'Mensaje por WhatsApp' : 'Enviar Email';

    return SizedBox(
      width: double.infinity,
      child: Material(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => isWhatsapp ? _openWhatsApp() : _openEmail(),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 18, color: color),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openWhatsApp() async {
    final uri = Uri.parse('https://wa.me/${notice.authorWhatsappNumber}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openEmail() async {
    final subject = Uri.encodeComponent('Boda en Tarifa');
    final uri = Uri.parse('mailto:${notice.authorEmail}?subject=$subject');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
