import 'package:flutter/material.dart';

class MyProfileScreen extends StatelessWidget {
  const MyProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mi perfil')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.account_circle_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'Mi perfil',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
            ),
            SizedBox(height: 8),
            Text(
              'Tu perfil de invitado y preferencias',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
