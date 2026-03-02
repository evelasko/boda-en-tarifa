import 'package:flutter/material.dart';

import '../widgets/custom_map.dart';

class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mapa')),
      body: const CustomMapWidget(),
    );
  }
}
