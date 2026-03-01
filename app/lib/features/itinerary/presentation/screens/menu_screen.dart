import 'package:flutter/material.dart';

class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Menú')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.restaurant_menu_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'Menú',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              'Opciones de menú — selección $id',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
