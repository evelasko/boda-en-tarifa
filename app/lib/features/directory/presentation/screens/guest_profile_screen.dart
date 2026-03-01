import 'package:flutter/material.dart';

class GuestProfileScreen extends StatelessWidget {
  const GuestProfileScreen({super.key, required this.uid});

  final String uid;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil de invitado')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.person_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'Perfil de invitado',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              'UID: $uid',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
