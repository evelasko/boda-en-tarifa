import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../domain/entities/quick_contact.dart';

class TaxiModal extends StatelessWidget {
  const TaxiModal({super.key, required this.taxis});

  final List<QuickContact> taxis;

  static Future<void> show(BuildContext context, List<QuickContact> taxis) {
    return showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => TaxiModal(taxis: taxis),
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
                Icon(Icons.local_taxi, color: colors.primary, size: 22),
                const SizedBox(width: 10),
                Text(
                  'Taxis en Tarifa',
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
                'Pulsa para llamar directamente',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: colors.onSurfaceVariant,
                ),
              ),
            ),
            const SizedBox(height: 16),
            ...taxis.map((taxi) => _TaxiTile(contact: taxi)),
          ],
        ),
      ),
    );
  }
}

class _TaxiTile extends StatelessWidget {
  const _TaxiTile({required this.contact});

  final QuickContact contact;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: colors.primaryContainer,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => _call(context),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Icon(Icons.phone, size: 20, color: colors.primary),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        contact.label,
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: colors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatPhone(contact.phoneNumber),
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right,
                  color: colors.onSurfaceVariant,
                  size: 20,
                ),
              ],
            ),
          ),
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

  /// Formats "34956684174" as "+34 956 684 174" for display.
  String _formatPhone(String raw) {
    if (raw.length < 4) return '+$raw';
    final cc = raw.substring(0, 2);
    final rest = raw.substring(2);
    final buffer = StringBuffer('+$cc ');
    for (var i = 0; i < rest.length; i++) {
      if (i > 0 && i % 3 == 0) buffer.write(' ');
      buffer.write(rest[i]);
    }
    return buffer.toString();
  }
}
