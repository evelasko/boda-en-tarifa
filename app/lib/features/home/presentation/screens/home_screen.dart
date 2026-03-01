import 'package:flutter/material.dart';

import '../widgets/quick_action_buttons.dart';
import '../widgets/wind_weather_widget.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inicio')),
      body: const Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  WindWeatherWidget(),
                  SizedBox(height: 24),
                  _PlaceholderSection(),
                ],
              ),
            ),
          ),
          QuickActionButtons(),
        ],
      ),
    );
  }
}

class _PlaceholderSection extends StatelessWidget {
  const _PlaceholderSection();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        children: [
          Icon(Icons.home_outlined, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            'Inicio',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
          ),
          SizedBox(height: 8),
          Text(
            'Feed de la boda: fotos, actualizaciones y novedades',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
