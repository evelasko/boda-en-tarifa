import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/models/event_schedule.dart';
import '../../../../core/models/venue.dart';
import '../providers/itinerary_providers.dart';
import 'timeline_card.dart';

class TimelineView extends ConsumerStatefulWidget {
  const TimelineView({super.key});

  @override
  ConsumerState<TimelineView> createState() => _TimelineViewState();
}

class _TimelineViewState extends ConsumerState<TimelineView> {
  final _scrollController = ScrollController();
  final _activeKey = GlobalKey();
  bool _hasScrolled = false;

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToActiveEvent() {
    if (_hasScrolled) return;
    final keyContext = _activeKey.currentContext;
    if (keyContext == null) return;

    _hasScrolled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      Scrollable.ensureVisible(
        keyContext,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeOutCubic,
        alignment: 0.3,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final groupedAsync = ref.watch(groupedSchedulesProvider);
    final venueMapAsync = ref.watch(venueMapProvider);
    final currentId = ref.watch(currentEventIdProvider);

    return groupedAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, _) => const _ErrorView(),
      data: (grouped) {
        if (grouped.isEmpty) return const _EmptyView();

        return venueMapAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, _) => _buildTimeline(grouped, {}, currentId),
          data: (venues) => _buildTimeline(grouped, venues, currentId),
        );
      },
    );
  }

  Widget _buildTimeline(
    Map<int, List<EventSchedule>> grouped,
    Map<String, Venue> venues,
    String? currentId,
  ) {
    final colors = Theme.of(context).colorScheme;
    final items = <Widget>[];

    for (final entry in grouped.entries) {
      items.add(_DayHeader(
        label: kDayLabels[entry.key] ?? 'Día ${entry.key}',
      ));

      for (var i = 0; i < entry.value.length; i++) {
        final event = entry.value[i];
        final isLast = i == entry.value.length - 1;
        final isActive = event.id == currentId;

        final now = DateTime.now();
        final EventTimeState timeState;
        if (isActive) {
          timeState = EventTimeState.active;
        } else if (event.endTime.isBefore(now) || event.endTime.isAtSameMomentAs(now)) {
          timeState = EventTimeState.past;
        } else {
          timeState = EventTimeState.future;
        }

        final card = TimelineCard(
          event: event,
          venue: venues[event.venueId],
          timeState: timeState,
        );

        items.add(
          _TimelineRow(
            key: isActive ? _activeKey : null,
            isLast: isLast,
            timeState: timeState,
            lineColor: colors.outlineVariant,
            activeColor: colors.primary,
            child: card,
          ),
        );
      }
    }

    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToActiveEvent());

    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(0, 8, 16, 40),
      children: items,
    );
  }
}

class _DayHeader extends StatelessWidget {
  const _DayHeader({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 0, 8),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: colors.onSurface,
        ),
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    super.key,
    required this.isLast,
    required this.timeState,
    required this.lineColor,
    required this.activeColor,
    required this.child,
  });

  final bool isLast;
  final EventTimeState timeState;
  final Color lineColor;
  final Color activeColor;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isActive = timeState == EventTimeState.active;
    final nodeColor = isActive ? activeColor : lineColor;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: isActive ? 14 : 10,
                  height: isActive ? 14 : 10,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isActive ? activeColor : Colors.white,
                    border: Border.all(color: nodeColor, width: 2.5),
                    boxShadow: isActive
                        ? [
                            BoxShadow(
                              color: activeColor.withValues(alpha: 0.3),
                              blurRadius: 8,
                            ),
                          ]
                        : null,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: lineColor,
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: child,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.event_outlined, size: 56, color: colors.onSurfaceVariant),
          const SizedBox(height: 12),
          Text(
            'Aún no hay eventos programados',
            style: GoogleFonts.inter(
              fontSize: 15,
              color: colors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: colors.onSurfaceVariant),
          const SizedBox(height: 12),
          Text(
            'No se pudo cargar el programa',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: colors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
