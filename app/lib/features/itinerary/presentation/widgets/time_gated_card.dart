import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/models/time_gated_content.dart';
import '../providers/gated_content_providers.dart';
import '../providers/time_gate_providers.dart';

class TimeGatedCard extends ConsumerWidget {
  const TimeGatedCard({super.key, required this.state});

  final TimeGateState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (state.status == TimeGateStatus.locked) {
      return _LockedCard(state: state);
    }
    return _UnlockedCard(state: state);
  }
}

// ---------------------------------------------------------------------------
// Locked state — countdown timer
// ---------------------------------------------------------------------------

class _LockedCard extends StatelessWidget {
  const _LockedCard({required this.state});
  final TimeGateState state;

  String _formatCountdown(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    if (h > 0) return '${h}h ${m}m ${s}s';
    if (m > 0) return '${m}m ${s}s';
    return '${s}s';
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.outlineVariant),
      ),
      child: Row(
        children: [
          Opacity(
            opacity: 0.7,
            child: Icon(Icons.lock_outline, size: 24, color: colors.onSurfaceVariant),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  state.gate.title,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: colors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Se desbloquea en ${_formatCountdown(state.remaining)}',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: colors.onSurfaceVariant.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Unlocked state — fetches and previews content
// ---------------------------------------------------------------------------

class _UnlockedCard extends ConsumerWidget {
  const _UnlockedCard({required this.state});
  final TimeGateState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final docPath = state.gate.firestoreDocPath;

    if (docPath == null || docPath.isEmpty) {
      return _buildShell(
        context,
        child: _ContentPreview(gate: state.gate),
      );
    }

    final contentAsync = ref.watch(gatedContentDocProvider(docPath));

    return contentAsync.when(
      loading: () => _buildShell(
        context,
        child: const Center(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        ),
      ),
      error: (_, _) => _buildShell(
        context,
        child: _ErrorContent(gate: state.gate),
      ),
      data: (either) => either.fold(
        (failure) => _buildShell(
          context,
          child: _ErrorContent(gate: state.gate),
        ),
        (doc) => _buildShell(
          context,
          child: _ContentPreview(gate: state.gate, payload: doc.payload),
        ),
      ),
    );
  }

  Widget _buildShell(BuildContext context, {required Widget child}) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.primary.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: colors.primary.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lock_open, size: 20, color: colors.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  state.gate.title,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: colors.onSurface,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _ContentPreview extends StatelessWidget {
  const _ContentPreview({required this.gate, this.payload});
  final TimeGatedContent gate;
  final Map<String, dynamic>? payload;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    String? preview;

    if (payload != null) {
      if (gate.contentType == ContentType.menu) {
        final items = payload!['items'] as List<dynamic>?;
        if (items != null && items.isNotEmpty) {
          final first = items.first as Map<String, dynamic>;
          preview = first['name'] as String?;
        }
      } else if (gate.contentType == ContentType.seating) {
        final table = payload!['assignedTable'] as String?;
        final seat = payload!['seatNumber'];
        if (table != null) {
          preview = seat != null ? 'Mesa $table — Asiento $seat' : 'Mesa $table';
        }
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (preview != null) ...[
          Text(
            preview,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: colors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
        ],
        GestureDetector(
          onTap: () => context.go('/itinerary/menu/${gate.id}'),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: colors.primaryContainer,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'Ver completo',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: colors.primary,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ErrorContent extends StatelessWidget {
  const _ErrorContent({required this.gate});
  final TimeGatedContent gate;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Text(
      'Contenido no disponible aún',
      style: GoogleFonts.inter(
        fontSize: 13,
        color: colors.onSurfaceVariant.withValues(alpha: 0.7),
      ),
    );
  }
}
