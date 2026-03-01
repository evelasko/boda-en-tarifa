import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';
import 'package:boda_en_tarifa_app/features/auth/presentation/providers/auth_providers.dart';

import '../providers/profile_providers.dart';
import '../widgets/profile_editor.dart';

/// Self-service profile editing screen.
/// Guests can update their photo, fun fact, relationship status,
/// and directory visibility. Protected fields are read-only.
class MyProfileScreen extends ConsumerStatefulWidget {
  const MyProfileScreen({super.key});

  @override
  ConsumerState<MyProfileScreen> createState() => _MyProfileScreenState();
}

class _MyProfileScreenState extends ConsumerState<MyProfileScreen> {
  late TextEditingController _funFactController;
  late RelationshipStatus _relationshipStatus;
  late bool _isDirectoryVisible;

  File? _pendingPhoto;
  bool _hasChanges = false;

  AppUser? _currentUser;

  @override
  void initState() {
    super.initState();
    _funFactController = TextEditingController();
    _relationshipStatus = RelationshipStatus.soltero;
    _isDirectoryVisible = true;
  }

  @override
  void dispose() {
    _funFactController.dispose();
    super.dispose();
  }

  void _initFromUser(AppUser user) {
    if (_currentUser?.uid == user.uid && _hasChanges) return;

    _currentUser = user;
    _funFactController.text = user.funFact ?? '';
    _relationshipStatus = user.relationshipStatus;
    _isDirectoryVisible = user.isDirectoryVisible;
    _hasChanges = false;
  }

  void _markChanged() {
    if (!_hasChanges) setState(() => _hasChanges = true);
  }

  Future<void> _pickPhoto() async {
    final file = await pickProfilePhoto(context);
    if (file != null) {
      setState(() {
        _pendingPhoto = file;
        _hasChanges = true;
      });
    }
  }

  Future<void> _save() async {
    final user = _currentUser;
    if (user == null) return;

    final editor = ref.read(profileEditorProvider.notifier);

    // Upload photo first if changed
    String? newPhotoUrl;
    if (_pendingPhoto != null) {
      newPhotoUrl = await editor.uploadPhoto(_pendingPhoto!);
      if (newPhotoUrl == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Error al subir la foto')),
          );
        }
        return;
      }
    }

    final funFactChanged = _funFactController.text != (user.funFact ?? '');
    final statusChanged = _relationshipStatus != user.relationshipStatus;
    final visibilityChanged = _isDirectoryVisible != user.isDirectoryVisible;

    final success = await editor.saveProfile(
      uid: user.uid,
      photoUrl: newPhotoUrl,
      funFact: funFactChanged ? _funFactController.text : null,
      relationshipStatus: statusChanged ? _relationshipStatus : null,
      isDirectoryVisible: visibilityChanged ? _isDirectoryVisible : null,
    );

    if (!mounted) return;

    if (success) {
      setState(() {
        _pendingPhoto = null;
        _hasChanges = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cambios guardados')),
      );
    } else {
      final editorState = ref.read(profileEditorProvider);
      final errorMsg = editorState.error?.toString() ?? 'Error desconocido';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $errorMsg')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final editorState = ref.watch(profileEditorProvider);
    final isLoading = editorState.isLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('Mi perfil')),
      body: authState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (user) {
          if (user == null) {
            return const Center(child: Text('No se pudo cargar el perfil'));
          }

          _initFromUser(user);
          return _buildForm(context, user, isLoading);
        },
      ),
    );
  }

  Widget _buildForm(BuildContext context, AppUser user, bool isLoading) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Photo (tappable)
          ProfilePhoto(
            photoUrl: user.photoUrl,
            localFile: _pendingPhoto,
            radius: 72,
            onTap: isLoading ? null : _pickPhoto,
          ),

          const SizedBox(height: 24),

          // Read-only: name
          Text(
            user.fullName,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 4),

          // Read-only: relation
          Text(
            user.relationToGrooms,
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),

          const SizedBox(height: 8),

          // Read-only: side badge
          GuestSideChip(side: user.side),

          const SizedBox(height: 32),

          // ── Editable fields ──────────────────────────────────────
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Editar perfil',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Fun fact
          TextFormField(
            controller: _funFactController,
            decoration: const InputDecoration(
              labelText: 'Dato curioso',
              hintText: 'Cuéntanos algo divertido sobre ti...',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.auto_awesome),
            ),
            maxLines: 3,
            maxLength: 200,
            enabled: !isLoading,
            onChanged: (_) => _markChanged(),
          ),

          const SizedBox(height: 16),

          // Relationship status
          RelationshipStatusDropdown(
            value: _relationshipStatus,
            onChanged: isLoading
                ? (_) {}
                : (status) {
                    setState(() {
                      _relationshipStatus = status;
                      _hasChanges = true;
                    });
                  },
          ),

          const SizedBox(height: 20),

          // Directory visibility toggle
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Visible en el directorio'),
            subtitle: const Text(
              'Si lo desactivas, tu perfil no aparecerá en la lista de invitados',
            ),
            value: _isDirectoryVisible,
            onChanged: isLoading
                ? null
                : (value) {
                    setState(() {
                      _isDirectoryVisible = value;
                      _hasChanges = true;
                    });
                  },
          ),

          const SizedBox(height: 32),

          // Save button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (_hasChanges && !isLoading) ? _save : null,
              child: isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Guardar cambios'),
            ),
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
