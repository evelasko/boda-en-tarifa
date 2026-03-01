import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Step 1: Communication Preference.
/// Lets the user choose WhatsApp or Email as their contact method.
/// If WhatsApp is selected, prompts for the phone number.
class CommunicationStep extends StatelessWidget {
  const CommunicationStep({
    super.key,
    required this.preference,
    required this.onPreferenceChanged,
    required this.whatsappController,
  });

  /// Current selection: 'whatsapp', 'email', or null (nothing chosen yet).
  final String? preference;
  final ValueChanged<String?> onPreferenceChanged;
  final TextEditingController whatsappController;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Preferencia de contacto',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Elige cómo quieres que otros invitados puedan contactarte a través del tablón de anuncios.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),

          // WhatsApp option
          _OptionCard(
            icon: Icons.chat,
            title: 'WhatsApp',
            subtitle: 'Los invitados podrán escribirte por WhatsApp',
            isSelected: preference == 'whatsapp',
            onTap: () => onPreferenceChanged('whatsapp'),
          ),

          const SizedBox(height: 12),

          // Email option
          _OptionCard(
            icon: Icons.email_outlined,
            title: 'Email',
            subtitle: 'Los invitados podrán enviarte un email',
            isSelected: preference == 'email',
            onTap: () => onPreferenceChanged('email'),
          ),

          // WhatsApp number input (shown when WhatsApp is selected)
          if (preference == 'whatsapp') ...[
            const SizedBox(height: 24),
            TextFormField(
              controller: whatsappController,
              decoration: const InputDecoration(
                labelText: 'Número de WhatsApp',
                hintText: '34612345678',
                helperText: 'Formato internacional sin el "+" (ej: 34612345678)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.phone),
              ),
              keyboardType: TextInputType.phone,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
              ],
              maxLength: 15,
            ),
          ],
        ],
      ),
    );
  }
}

class _OptionCard extends StatelessWidget {
  const _OptionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color =
        isSelected ? theme.colorScheme.primary : theme.colorScheme.outline;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color,
            width: isSelected ? 2 : 1,
          ),
          color: isSelected
              ? theme.colorScheme.primary.withValues(alpha: 0.08)
              : null,
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? theme.colorScheme.primary
                          : theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: theme.colorScheme.primary),
          ],
        ),
      ),
    );
  }
}
