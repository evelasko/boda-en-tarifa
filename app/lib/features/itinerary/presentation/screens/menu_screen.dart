import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/models/time_gated_content.dart';
import '../../../../core/remote_config/remote_config_providers.dart';
import '../../domain/entities/gated_content_payload.dart';
import '../providers/gated_content_providers.dart';

class MenuScreen extends ConsumerWidget {
  const MenuScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final gatesAsync = ref.watch(timeGatesProvider);
    final gates = gatesAsync.asData?.value;
    final gate = gates?.where((g) => g.id == id).firstOrNull;

    final title = gate?.title ?? 'Menú';

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: gate == null
          ? const _LoadingView()
          : _GatedContentBody(gate: gate),
    );
  }
}

class _GatedContentBody extends ConsumerWidget {
  const _GatedContentBody({required this.gate});
  final TimeGatedContent gate;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final docPath = gate.firestoreDocPath;
    if (docPath == null || docPath.isEmpty) {
      return const _EmptyContent();
    }

    final contentAsync = ref.watch(gatedContentDocProvider(docPath));

    return contentAsync.when(
      loading: () => const _LoadingView(),
      error: (_, _) => const _PermissionDeniedView(),
      data: (either) => either.fold(
        (failure) => const _PermissionDeniedView(),
        (doc) => _ContentView(gate: gate, doc: doc),
      ),
    );
  }
}

class _ContentView extends StatelessWidget {
  const _ContentView({required this.gate, required this.doc});
  final TimeGatedContent gate;
  final GatedContentDoc doc;

  @override
  Widget build(BuildContext context) {
    if (gate.contentType == ContentType.menu) {
      return _MenuContentView(payload: doc.payload);
    }
    if (gate.contentType == ContentType.seating) {
      return _SeatingContentView(payload: doc.payload);
    }
    return const _EmptyContent();
  }
}

class _MenuContentView extends StatelessWidget {
  const _MenuContentView({required this.payload});
  final Map<String, dynamic> payload;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    MenuPayload? menuPayload;
    try {
      menuPayload = MenuPayload.fromJson(payload);
    } catch (_) {}

    if (menuPayload == null || menuPayload.items.isEmpty) {
      return const _EmptyContent();
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: menuPayload.items.length + (menuPayload.notes != null ? 1 : 0),
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        if (index == menuPayload!.items.length && menuPayload.notes != null) {
          return Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              menuPayload.notes!,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontStyle: FontStyle.italic,
                color: colors.onSurfaceVariant,
              ),
            ),
          );
        }

        final item = menuPayload.items[index];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: colors.outlineVariant),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.name,
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: colors.onSurface,
                ),
              ),
              if (item.description != null && item.description!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  item.description!,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: colors.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
              ],
              if (item.dietary.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  children: item.dietary.map((d) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: colors.secondaryContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        d,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: colors.onSecondaryContainer,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _SeatingContentView extends StatelessWidget {
  const _SeatingContentView({required this.payload});
  final Map<String, dynamic> payload;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final table = payload['assignedTable'] as String?;
    final seat = payload['seatNumber'];

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.table_restaurant_outlined,
                size: 64, color: colors.primary),
            const SizedBox(height: 24),
            if (table != null)
              Text(
                'Mesa $table',
                style: GoogleFonts.inter(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: colors.onSurface,
                ),
              ),
            if (seat != null) ...[
              const SizedBox(height: 8),
              Text(
                'Asiento $seat',
                style: GoogleFonts.inter(
                  fontSize: 20,
                  color: colors.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator());
  }
}

class _PermissionDeniedView extends StatelessWidget {
  const _PermissionDeniedView();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_outline, size: 56, color: colors.onSurfaceVariant),
            const SizedBox(height: 16),
            Text(
              'Contenido no disponible aún',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Se desbloqueará cuando llegue el momento',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: colors.onSurfaceVariant.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyContent extends StatelessWidget {
  const _EmptyContent();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Center(
      child: Text(
        'Aún no hay contenido disponible',
        style: GoogleFonts.inter(
          fontSize: 15,
          color: colors.onSurfaceVariant,
        ),
      ),
    );
  }
}
