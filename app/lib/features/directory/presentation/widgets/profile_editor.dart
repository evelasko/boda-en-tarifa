import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'package:boda_en_tarifa_app/core/cloudinary/cloudinary_config.dart';
import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';

// ---------------------------------------------------------------------------
// Profile photo widget (shared between read-only and edit views)
// ---------------------------------------------------------------------------

class ProfilePhoto extends StatelessWidget {
  const ProfilePhoto({
    super.key,
    required this.photoUrl,
    this.radius = 64,
    this.onTap,
    this.localFile,
  });

  final String? photoUrl;
  final double radius;
  final VoidCallback? onTap;

  /// If a local file was just picked, show it instead of the network image.
  final File? localFile;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final diameter = radius * 2;

    Widget image;
    if (localFile != null) {
      image = ClipOval(
        child: Image.file(
          localFile!,
          width: diameter,
          height: diameter,
          fit: BoxFit.cover,
        ),
      );
    } else if (photoUrl != null && photoUrl!.isNotEmpty) {
      final url = resolvePhotoUrl(photoUrl!, width: diameter.toInt());
      image = CachedNetworkImage(
        imageUrl: url,
        imageBuilder: (_, provider) => CircleAvatar(
          radius: radius,
          backgroundImage: provider,
        ),
        placeholder: (_, _) => CircleAvatar(
          radius: radius,
          backgroundColor: theme.colorScheme.primaryContainer,
          child: Icon(Icons.person, size: radius, color: theme.colorScheme.primary),
        ),
        errorWidget: (_, _, _) => _placeholder(theme),
      );
    } else {
      image = _placeholder(theme);
    }

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: Stack(
          children: [
            image,
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: theme.colorScheme.secondary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: const Icon(Icons.camera_alt, size: 18, color: Colors.white),
              ),
            ),
          ],
        ),
      );
    }

    return image;
  }

  Widget _placeholder(ThemeData theme) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: theme.colorScheme.primaryContainer,
      child: Icon(Icons.person, size: radius, color: theme.colorScheme.primary),
    );
  }
}

// ---------------------------------------------------------------------------
// Relationship status badge
// ---------------------------------------------------------------------------

class RelationshipStatusBadge extends StatelessWidget {
  const RelationshipStatusBadge({super.key, required this.status});

  final RelationshipStatus status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (label, icon, color) = switch (status) {
      RelationshipStatus.soltero => ('Soltero/a', Icons.person, theme.colorScheme.primary),
      RelationshipStatus.enPareja => ('En pareja', Icons.favorite, theme.colorScheme.secondary),
      RelationshipStatus.buscando => ('Buscando', Icons.search, theme.colorScheme.tertiary),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: theme.textTheme.labelMedium?.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Guest side chip
// ---------------------------------------------------------------------------

class GuestSideChip extends StatelessWidget {
  const GuestSideChip({super.key, required this.side});

  final GuestSide side;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final label = switch (side) {
      GuestSide.novioA => 'Lado de Enrique',
      GuestSide.novioB => 'Lado de Manuel',
      GuestSide.ambos => 'De los dos',
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelMedium?.copyWith(
          color: theme.colorScheme.onSurface,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Relationship status dropdown
// ---------------------------------------------------------------------------

class RelationshipStatusDropdown extends StatelessWidget {
  const RelationshipStatusDropdown({
    super.key,
    required this.value,
    required this.onChanged,
  });

  final RelationshipStatus value;
  final ValueChanged<RelationshipStatus> onChanged;

  static const _labels = {
    RelationshipStatus.soltero: 'Soltero/a',
    RelationshipStatus.enPareja: 'En pareja',
    RelationshipStatus.buscando: 'Buscando',
  };

  @override
  Widget build(BuildContext context) {
    return DropdownMenu<RelationshipStatus>(
      initialSelection: value,
      expandedInsets: EdgeInsets.zero,
      label: const Text('Estado sentimental'),
      onSelected: (v) {
        if (v != null) onChanged(v);
      },
      dropdownMenuEntries: RelationshipStatus.values
          .map((s) => DropdownMenuEntry(value: s, label: _labels[s]!))
          .toList(),
    );
  }
}

// ---------------------------------------------------------------------------
// Photo picker helper
// ---------------------------------------------------------------------------

Future<File?> pickProfilePhoto(BuildContext context) async {
  final source = await showModalBottomSheet<ImageSource>(
    context: context,
    builder: (ctx) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.camera_alt),
            title: const Text('Hacer foto'),
            onTap: () => Navigator.pop(ctx, ImageSource.camera),
          ),
          ListTile(
            leading: const Icon(Icons.photo_library),
            title: const Text('Elegir de la galería'),
            onTap: () => Navigator.pop(ctx, ImageSource.gallery),
          ),
        ],
      ),
    ),
  );

  if (source == null) return null;

  final picker = ImagePicker();
  final xFile = await picker.pickImage(
    source: source,
    maxWidth: 1200,
    maxHeight: 1200,
    imageQuality: 85,
  );

  if (xFile == null) return null;
  return File(xFile.path);
}
