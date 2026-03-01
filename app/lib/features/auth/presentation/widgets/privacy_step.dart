import 'package:flutter/material.dart';

import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';
import 'package:boda_en_tarifa_app/features/directory/presentation/widgets/profile_editor.dart';

/// Step 2: Privacy Settings.
/// Controls directory visibility, fun fact, and relationship status.
class PrivacyStep extends StatelessWidget {
  const PrivacyStep({
    super.key,
    required this.isDirectoryVisible,
    required this.onDirectoryVisibleChanged,
    required this.funFactController,
    required this.relationshipStatus,
    required this.onRelationshipStatusChanged,
  });

  final bool isDirectoryVisible;
  final ValueChanged<bool> onDirectoryVisibleChanged;
  final TextEditingController funFactController;
  final RelationshipStatus relationshipStatus;
  final ValueChanged<RelationshipStatus> onRelationshipStatusChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Privacidad y perfil',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Configura cómo apareces en el directorio de invitados. Puedes cambiar esto más tarde desde tu perfil.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),

          // Directory visibility toggle
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Aparecer en el directorio'),
            subtitle: const Text(
              'Si lo desactivas, tu perfil no aparecerá en la lista de invitados',
            ),
            value: isDirectoryVisible,
            onChanged: onDirectoryVisibleChanged,
          ),

          const SizedBox(height: 16),

          // Fun fact text field
          TextFormField(
            controller: funFactController,
            decoration: const InputDecoration(
              labelText: 'Dato curioso',
              hintText: 'Cuéntanos algo divertido sobre ti...',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.auto_awesome),
            ),
            maxLines: 3,
            maxLength: 200,
          ),

          const SizedBox(height: 16),

          // Relationship status dropdown (reuse existing widget)
          RelationshipStatusDropdown(
            value: relationshipStatus,
            onChanged: onRelationshipStatusChanged,
          ),
        ],
      ),
    );
  }
}
