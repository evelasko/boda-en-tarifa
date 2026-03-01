import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../domain/entities/weather_info.dart';
import '../providers/weather_providers.dart';

class WindWeatherWidget extends ConsumerWidget {
  const WindWeatherWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weatherAsync = ref.watch(weatherProvider);

    return weatherAsync.when(
      data: (weather) => _WeatherCard(weather: weather),
      loading: () => const _WeatherCardShimmer(),
      error: (_, _) => const _WeatherUnavailable(),
    );
  }
}

class _WeatherCard extends StatelessWidget {
  const _WeatherCard({required this.weather});

  final WeatherInfo weather;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final windLabel = _windTypeLabel(weather.windType);
    final windIcon = _windTypeIcon(weather.windType);
    final windColor = _windTypeColor(weather.windType, colors);

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            colors.primaryContainer,
            colors.surface,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.outlineVariant),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.wb_sunny_outlined, size: 18, color: colors.primary),
              const SizedBox(width: 8),
              Text(
                'Tiempo en Tarifa',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: colors.onSurfaceVariant,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Temperature
              Text(
                '${weather.temperatureCelsius.round()}°',
                style: GoogleFonts.inter(
                  fontSize: 40,
                  fontWeight: FontWeight.w300,
                  color: colors.onSurface,
                  height: 1,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      weather.description,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: colors.onSurface,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.air, size: 16, color: windColor),
                        const SizedBox(width: 4),
                        Text(
                          '${weather.windSpeedKmh.round()} km/h',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Wind type badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: windColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(windIcon, size: 16, color: windColor),
                const SizedBox(width: 6),
                Text(
                  windLabel,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: windColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Cheeky tip
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: colors.outlineVariant),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('💨', style: GoogleFonts.inter(fontSize: 16)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    weather.tip,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontStyle: FontStyle.italic,
                      color: colors.onSurfaceVariant,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _windTypeLabel(WindType type) => switch (type) {
        WindType.levante => 'Levante',
        WindType.poniente => 'Poniente',
        WindType.other => 'Viento variable',
      };

  IconData _windTypeIcon(WindType type) => switch (type) {
        WindType.levante => Icons.arrow_back,
        WindType.poniente => Icons.arrow_forward,
        WindType.other => Icons.swap_horiz,
      };

  Color _windTypeColor(WindType type, ColorScheme colors) => switch (type) {
        WindType.levante => colors.secondary,
        WindType.poniente => colors.primary,
        WindType.other => colors.tertiary,
      };
}

class _WeatherCardShimmer extends StatelessWidget {
  const _WeatherCardShimmer();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      height: 180,
      decoration: BoxDecoration(
        color: colors.primaryContainer,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.outlineVariant),
      ),
      padding: const EdgeInsets.all(16),
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: colors.primary,
          ),
        ),
      ),
    );
  }
}

class _WeatherUnavailable extends StatelessWidget {
  const _WeatherUnavailable();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.outlineVariant),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Row(
        children: [
          Icon(
            Icons.cloud_off_outlined,
            size: 24,
            color: colors.onSurfaceVariant,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Tiempo no disponible — comprueba tu conexión.',
              style: GoogleFonts.inter(
                fontSize: 13,
                color: colors.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
