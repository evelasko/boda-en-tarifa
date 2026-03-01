import 'package:flutter/material.dart';

class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mapa')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.map_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'Mapa',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
            ),
            SizedBox(height: 8),
            Text(
              'Mapa de ubicaciones de la boda',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
