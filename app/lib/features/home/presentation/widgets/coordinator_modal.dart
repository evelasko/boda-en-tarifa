import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../domain/entities/quick_contact.dart';

class CoordinatorModal extends StatelessWidget {
  const CoordinatorModal({super.key, required this.coordinators});

  final List<QuickContact> coordinators;

  static Future<void> show(
    BuildContext context,
    List<QuickContact> coordinators,
  ) {
    return showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => CoordinatorModal(coordinators: coordinators),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: colors.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Icon(Icons.people_alt, color: colors.primary, size: 22),
                const SizedBox(width: 10),
                Text(
                  'Coordinadores',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: colors.onSurface,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Llama o escribe por WhatsApp',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: colors.onSurfaceVariant,
                ),
              ),
            ),
            const SizedBox(height: 16),
            ...coordinators.map((c) => _CoordinatorTile(contact: c)),
          ],
        ),
      ),
    );
  }
}

class _CoordinatorTile extends StatelessWidget {
  const _CoordinatorTile({required this.contact});

  final QuickContact contact;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        decoration: BoxDecoration(
          color: colors.primaryContainer,
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: colors.primary.withValues(alpha: 0.15),
              child: Text(
                contact.label.isNotEmpty ? contact.label[0].toUpperCase() : '?',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: colors.primary,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                contact.label,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: colors.onSurface,
                ),
              ),
            ),
            _ActionButton(
              icon: Icons.phone,
              color: colors.primary,
              onTap: () => _call(context),
            ),
            if (contact.whatsappNumber != null) ...[
              const SizedBox(width: 10),
              _ActionButton(
                icon: Icons.chat,
                color: const Color(0xFF25D366),
                onTap: () => _whatsapp(context),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _call(BuildContext context) async {
    final uri = Uri.parse('tel:+${contact.phoneNumber}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _whatsapp(BuildContext context) async {
    final uri = Uri.parse('https://wa.me/${contact.whatsappNumber}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.12),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(icon, size: 20, color: color),
        ),
      ),
    );
  }
}
