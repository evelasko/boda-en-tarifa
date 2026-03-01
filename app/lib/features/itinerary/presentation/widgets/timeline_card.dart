import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/models/event_schedule.dart';
import '../../../../core/models/venue.dart';

enum EventTimeState { past, active, future }

class TimelineCard extends StatelessWidget {
  const TimelineCard({
    super.key,
    required this.event,
    required this.venue,
    required this.timeState,
    this.onCtaTap,
  });

  final EventSchedule event;
  final Venue? venue;
  final EventTimeState timeState;
  final VoidCallback? onCtaTap;

  static String _formatTime(DateTime dt) =>
      '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final opacity = timeState == EventTimeState.past ? 0.55 : 1.0;

    return Opacity(
      opacity: opacity,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOut,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: timeState == EventTimeState.active
                ? colors.primary
                : colors.outlineVariant,
            width: timeState == EventTimeState.active ? 2 : 1,
          ),
          boxShadow: [
            if (timeState == EventTimeState.active)
              BoxShadow(
                color: colors.primary.withValues(alpha: 0.15),
                blurRadius: 16,
                offset: const Offset(0, 4),
              )
            else
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (timeState == EventTimeState.active) ...[
                  _PulsingDot(color: colors.primary),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Text(
                    event.title,
                    style: GoogleFonts.inter(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      color: colors.onSurface,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.access_time_rounded, size: 15, color: colors.primary),
                const SizedBox(width: 5),
                Text(
                  '${_formatTime(event.startTime)} – ${_formatTime(event.endTime)}',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: colors.primary,
                  ),
                ),
              ],
            ),
            if (venue != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.place_outlined, size: 15, color: colors.onSurfaceVariant),
                  const SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      venue!.name,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ],
            if (event.description.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                event.description,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: colors.onSurfaceVariant,
                  height: 1.5,
                ),
              ),
            ],
            if (event.ctaLabel != null && event.ctaLabel!.isNotEmpty) ...[
              const SizedBox(height: 12),
              GestureDetector(
                onTap: onCtaTap,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: colors.primaryContainer,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    event.ctaLabel!,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: colors.primary,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PulsingDot extends StatefulWidget {
  const _PulsingDot({required this.color});
  final Color color;

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _animation = Tween(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (_, _) => Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: widget.color.withValues(alpha: _animation.value),
        ),
      ),
    );
  }
}
