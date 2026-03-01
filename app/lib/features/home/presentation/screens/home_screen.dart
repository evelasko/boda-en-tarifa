import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../itinerary/presentation/providers/time_gate_providers.dart';
import '../../../itinerary/presentation/widgets/time_gated_card.dart';
import '../widgets/hero_banner.dart';
import '../widgets/quick_action_buttons.dart';
import '../widgets/wind_weather_widget.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inicio')),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const HeroBannerWidget(),
                  const AdminOverrideControls(),
                  const SizedBox(height: 16),
                  const _TimeGatedHomeCard(),
                  const WindWeatherWidget(),
                  const SizedBox(height: 24),
                  const _PlaceholderSection(),
                ],
              ),
            ),
          ),
          const QuickActionButtons(),
        ],
      ),
    );
  }
}

class _TimeGatedHomeCard extends ConsumerWidget {
  const _TimeGatedHomeCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gateState = ref.watch(homeTimeGateProvider);
    if (gateState == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TimeGatedCard(state: gateState),
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
