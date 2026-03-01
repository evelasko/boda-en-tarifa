import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:boda_en_tarifa_app/core/models/event_schedule.dart';
import 'package:boda_en_tarifa_app/core/models/venue.dart';
import 'package:boda_en_tarifa_app/core/remote_config/remote_config_providers.dart';

import '../providers/schedule_providers.dart';

class HeroBannerWidget extends ConsumerWidget {
  const HeroBannerWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bannerAsync = ref.watch(heroBannerProvider);

    return bannerAsync.when(
      data: (state) => _HeroBannerContent(state: state),
      loading: () => const _HeroBannerShimmer(),
      error: (_, _) => const _HeroBannerError(),
    );
  }
}

// ---------------------------------------------------------------------------
// Main content — dispatches to current event or in-between view
// ---------------------------------------------------------------------------

class _HeroBannerContent extends StatelessWidget {
  const _HeroBannerContent({required this.state});

  final HeroBannerState state;

  @override
  Widget build(BuildContext context) {
    if (state.currentEvent != null) {
      return _CurrentEventBanner(
        event: state.currentEvent!,
        venue: state.venue,
        isOverridden: state.isOverridden,
      );
    }

    if (state.nextEvent != null) {
      return _InBetweenBanner(nextEvent: state.nextEvent!);
    }

    return const _WeddingCompleteBanner();
  }
}

// ---------------------------------------------------------------------------
// Current event banner
// ---------------------------------------------------------------------------

class _CurrentEventBanner extends StatelessWidget {
  const _CurrentEventBanner({
    required this.event,
    required this.venue,
    this.isOverridden = false,
  });

  final EventSchedule event;
  final Venue? venue;
  final bool isOverridden;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            colors.primary.withValues(alpha: 0.15),
            colors.secondary.withValues(alpha: 0.08),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isOverridden
              ? colors.tertiary.withValues(alpha: 0.5)
              : colors.outlineVariant,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Status bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: colors.primary.withValues(alpha: 0.1),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: colors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  isOverridden ? 'AHORA (MANUAL)' : 'AHORA',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: colors.primary,
                    letterSpacing: 1.2,
                  ),
                ),
                const Spacer(),
                Text(
                  _formatTimeRange(event.startTime, event.endTime),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  event.title,
                  style: GoogleFonts.inter(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: colors.onSurface,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 8),

                // Description
                Text(
                  event.description,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: colors.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 12),

                // Venue chip
                if (venue != null)
                  Row(
                    children: [
                      Icon(
                        Icons.location_on_outlined,
                        size: 16,
                        color: colors.primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        venue!.name,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: colors.primary,
                        ),
                      ),
                    ],
                  ),

                // CTA button
                if (event.ctaLabel != null) ...[
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        // Deep link navigation handled by GoRouter
                      },
                      icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                      label: Text(event.ctaLabel!),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: colors.primary,
                        side: BorderSide(color: colors.primary),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// In-between banner — shows countdown to next event
// ---------------------------------------------------------------------------

class _InBetweenBanner extends StatefulWidget {
  const _InBetweenBanner({required this.nextEvent});

  final EventSchedule nextEvent;

  @override
  State<_InBetweenBanner> createState() => _InBetweenBannerState();
}

class _InBetweenBannerState extends State<_InBetweenBanner> {
  late Timer _countdownTimer;
  late Duration _remaining;

  @override
  void initState() {
    super.initState();
    _updateRemaining();
    _countdownTimer = Timer.periodic(
      const Duration(seconds: 1),
      (_) => _updateRemaining(),
    );
  }

  @override
  void didUpdateWidget(_InBetweenBanner oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.nextEvent.id != widget.nextEvent.id) {
      _updateRemaining();
    }
  }

  @override
  void dispose() {
    _countdownTimer.cancel();
    super.dispose();
  }

  void _updateRemaining() {
    setState(() {
      _remaining = widget.nextEvent.startTime.difference(DateTime.now());
      if (_remaining.isNegative) _remaining = Duration.zero;
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            colors.tertiary.withValues(alpha: 0.1),
            colors.secondary.withValues(alpha: 0.06),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.outlineVariant),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: colors.tertiary.withValues(alpha: 0.08),
            ),
            child: Row(
              children: [
                Icon(Icons.schedule_rounded, size: 16, color: colors.tertiary),
                const SizedBox(width: 6),
                Text(
                  'PRÓXIMO EVENTO',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: colors.tertiary,
                    letterSpacing: 1.2,
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Next event title
                Text(
                  widget.nextEvent.title,
                  style: GoogleFonts.inter(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: colors.onSurface,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  widget.nextEvent.description,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: colors.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 16),

                // Countdown
                _CountdownDisplay(remaining: _remaining),

                const SizedBox(height: 12),

                // Time info
                Row(
                  children: [
                    Icon(
                      Icons.access_time_rounded,
                      size: 15,
                      color: colors.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _formatTimeRange(
                        widget.nextEvent.startTime,
                        widget.nextEvent.endTime,
                      ),
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
    );
  }
}

class _CountdownDisplay extends StatelessWidget {
  const _CountdownDisplay({required this.remaining});

  final Duration remaining;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final hours = remaining.inHours;
    final minutes = remaining.inMinutes.remainder(60);
    final seconds = remaining.inSeconds.remainder(60);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (hours > 0) ...[
          _CountdownUnit(value: hours, label: 'h'),
          const SizedBox(width: 8),
          Text(
            ':',
            style: GoogleFonts.inter(
              fontSize: 28,
              fontWeight: FontWeight.w300,
              color: colors.onSurfaceVariant,
            ),
          ),
          const SizedBox(width: 8),
        ],
        _CountdownUnit(value: minutes, label: 'min'),
        const SizedBox(width: 8),
        Text(
          ':',
          style: GoogleFonts.inter(
            fontSize: 28,
            fontWeight: FontWeight.w300,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(width: 8),
        _CountdownUnit(value: seconds, label: 'seg'),
      ],
    );
  }
}

class _CountdownUnit extends StatelessWidget {
  const _CountdownUnit({required this.value, required this.label});

  final int value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: colors.outlineVariant),
          ),
          child: Text(
            value.toString().padLeft(2, '0'),
            style: GoogleFonts.inter(
              fontSize: 28,
              fontWeight: FontWeight.w600,
              color: colors.onSurface,
              height: 1,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: colors.onSurfaceVariant,
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Wedding complete banner
// ---------------------------------------------------------------------------

class _WeddingCompleteBanner extends StatelessWidget {
  const _WeddingCompleteBanner();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            colors.secondary.withValues(alpha: 0.12),
            colors.primary.withValues(alpha: 0.08),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.outlineVariant),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        children: [
          Text(
            '🎉',
            style: GoogleFonts.inter(fontSize: 40),
          ),
          const SizedBox(height: 12),
          Text(
            '¡Gracias por celebrar con nosotros!',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: colors.onSurface,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Todos los eventos han terminado. Revisa la galería para revivir los mejores momentos.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: colors.onSurfaceVariant,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Admin override controls
// ---------------------------------------------------------------------------

class AdminOverrideControls extends ConsumerWidget {
  const AdminOverrideControls({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAdminAsync = ref.watch(isAdminProvider);
    final bannerAsync = ref.watch(heroBannerProvider);

    return isAdminAsync.when(
      data: (isAdmin) {
        if (!isAdmin) return const SizedBox.shrink();
        return bannerAsync.when(
          data: (state) => _AdminOverridePanel(state: state),
          loading: () => const SizedBox.shrink(),
          error: (_, _) => const SizedBox.shrink(),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}

class _AdminOverridePanel extends ConsumerWidget {
  const _AdminOverridePanel({required this.state});

  final HeroBannerState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).colorScheme;
    final schedulesAsync = ref.watch(eventSchedulesProvider);

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colors.errorContainer.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: colors.error.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.admin_panel_settings,
                  size: 16, color: colors.error),
              const SizedBox(width: 6),
              Text(
                'Control de timeline',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: colors.error,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (state.isOverridden) ...[
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                onPressed: () =>
                    ref.read(heroBannerProvider.notifier).clearOverride(),
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Volver a automático'),
                style: TextButton.styleFrom(
                  foregroundColor: colors.error,
                ),
              ),
            ),
          ],
          schedulesAsync.when(
            data: (schedules) => Wrap(
              spacing: 6,
              runSpacing: 6,
              children: schedules.map((event) {
                final isCurrent = state.currentEvent?.id == event.id;
                return ActionChip(
                  label: Text(
                    event.title,
                    style: GoogleFonts.inter(fontSize: 11),
                  ),
                  backgroundColor: isCurrent
                      ? colors.primary.withValues(alpha: 0.2)
                      : null,
                  side: BorderSide(
                    color: isCurrent
                        ? colors.primary
                        : colors.outlineVariant,
                  ),
                  onPressed: isCurrent
                      ? null
                      : () => ref
                            .read(heroBannerProvider.notifier)
                            .setOverride(event.id),
                );
              }).toList(),
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shimmer / error states
// ---------------------------------------------------------------------------

class _HeroBannerShimmer extends StatelessWidget {
  const _HeroBannerShimmer();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: colors.primaryContainer,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.outlineVariant),
      ),
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

class _HeroBannerError extends StatelessWidget {
  const _HeroBannerError();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: colors.outlineVariant),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Row(
        children: [
          Icon(Icons.error_outline, size: 24, color: colors.error),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'No se pudo cargar el programa — inténtalo de nuevo más tarde.',
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

String _formatTimeRange(DateTime start, DateTime end) {
  String fmt(DateTime dt) =>
      '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  return '${fmt(start)} – ${fmt(end)}';
}
