import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

/// Step 3: Device Permissions.
/// Requests camera, photo library, and notification permissions with
/// explanatory cards.
class PermissionsStep extends StatefulWidget {
  const PermissionsStep({super.key});

  @override
  State<PermissionsStep> createState() => _PermissionsStepState();
}

class _PermissionsStepState extends State<PermissionsStep> {
  PermissionStatus _cameraStatus = PermissionStatus.denied;
  PermissionStatus _photosStatus = PermissionStatus.denied;
  PermissionStatus _notificationStatus = PermissionStatus.denied;

  @override
  void initState() {
    super.initState();
    _checkCurrentStatuses();
  }

  Future<void> _checkCurrentStatuses() async {
    final results = await Future.wait([
      Permission.camera.status,
      Permission.photos.status,
      Permission.notification.status,
    ]);
    if (!mounted) return;
    setState(() {
      _cameraStatus = results[0];
      _photosStatus = results[1];
      _notificationStatus = results[2];
    });
  }

  Future<void> _requestPermission(Permission permission) async {
    final status = await permission.request();
    if (!mounted) return;
    setState(() {
      switch (permission) {
        case Permission.camera:
          _cameraStatus = status;
        case Permission.photos:
          _photosStatus = status;
        case Permission.notification:
          _notificationStatus = status;
        default:
          break;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Permisos del dispositivo',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Estos permisos son opcionales pero mejoran tu experiencia. Puedes cambiarlos en cualquier momento desde los ajustes del sistema.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 24),

          _PermissionCard(
            icon: Icons.camera_alt,
            title: 'Cámara',
            description:
                'Necesaria para la cámara desechable (pestaña Cámara). Sin este permiso, solo podrás ver las fotos ya reveladas.',
            status: _cameraStatus,
            onRequest: () => _requestPermission(Permission.camera),
          ),

          const SizedBox(height: 12),

          _PermissionCard(
            icon: Icons.photo_library,
            title: 'Biblioteca de fotos',
            description:
                'Necesaria para importar fotos y compartir imágenes desde la app.',
            status: _photosStatus,
            onRequest: () => _requestPermission(Permission.photos),
          ),

          const SizedBox(height: 12),

          _PermissionCard(
            icon: Icons.notifications_active,
            title: 'Notificaciones',
            description:
                'Recibe avisos sobre eventos, recordatorios y actualizaciones de la boda.',
            status: _notificationStatus,
            onRequest: () => _requestPermission(Permission.notification),
          ),
        ],
      ),
    );
  }
}

class _PermissionCard extends StatelessWidget {
  const _PermissionCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.status,
    required this.onRequest,
  });

  final IconData icon;
  final String title;
  final String description;
  final PermissionStatus status;
  final VoidCallback onRequest;

  bool get _isGranted =>
      status == PermissionStatus.granted ||
      status == PermissionStatus.limited;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _isGranted
              ? theme.colorScheme.primary.withValues(alpha: 0.5)
              : theme.colorScheme.outlineVariant,
        ),
        color: _isGranted
            ? theme.colorScheme.primary.withValues(alpha: 0.08)
            : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            color: _isGranted
                ? theme.colorScheme.primary
                : theme.colorScheme.onSurfaceVariant,
            size: 28,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (_isGranted)
                      Icon(Icons.check_circle,
                          color: theme.colorScheme.primary, size: 20),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                if (!_isGranted) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: onRequest,
                      child: Text(
                        status == PermissionStatus.permanentlyDenied
                            ? 'Abrir ajustes'
                            : 'Permitir',
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
