import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppScaffold extends StatelessWidget {
  const AppScaffold({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
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
