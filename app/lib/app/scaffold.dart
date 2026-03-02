import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:boda_en_tarifa_app/core/media/upload_banner.dart';
import 'package:boda_en_tarifa_app/features/camera/presentation/providers/camera_providers.dart';

class AppScaffold extends ConsumerWidget {
  const AppScaffold({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.read(cameraControllerProvider);
    return Scaffold(
      body: Column(
        children: [
          const UploadBanner(),
          Expanded(child: navigationShell),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) => navigationShell.goBranch(
          index,
          initialLocation: index == navigationShell.currentIndex,
        ),
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Inicio',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.people_outlined),
            activeIcon: Icon(Icons.people),
            label: 'Comunidad',
          ),
          BottomNavigationBarItem(
            icon: _buildCameraIcon(context, isActive: false),
            activeIcon: _buildCameraIcon(context, isActive: true),
            label: 'Cámara',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today_outlined),
            activeIcon: Icon(Icons.calendar_today),
            label: 'Agenda',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.contacts_outlined),
            activeIcon: Icon(Icons.contacts),
            label: 'Invitados',
          ),
        ],
      ),
    );
  }

  Widget _buildCameraIcon(BuildContext context, {required bool isActive}) {
    final color = Theme.of(context).colorScheme.secondary;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: isActive ? 0.4 : 0.25),
            blurRadius: isActive ? 14 : 8,
            offset: Offset(0, isActive ? 4 : 2),
          ),
        ],
      ),
      child: const Icon(Icons.camera_alt, color: Colors.white, size: 22),
    );
  }
}
