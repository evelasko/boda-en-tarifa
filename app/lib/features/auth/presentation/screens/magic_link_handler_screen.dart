import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/error/failures.dart';
import '../providers/auth_providers.dart';

/// Handles incoming magic link deep links.
///
/// Extracts the `token` and optional `name` query parameters from the URL,
/// processes authentication (signing out any existing user first), and
/// navigates to the home screen on success or shows an error screen on failure.
class MagicLinkHandlerScreen extends ConsumerStatefulWidget {
  const MagicLinkHandlerScreen({
    super.key,
    this.token,
    this.guestName,
  });

  final String? token;
  final String? guestName;

  @override
  ConsumerState<MagicLinkHandlerScreen> createState() =>
      _MagicLinkHandlerScreenState();
}

class _MagicLinkHandlerScreenState
    extends ConsumerState<MagicLinkHandlerScreen> {
  @override
  void initState() {
    super.initState();
    if (widget.token != null && widget.token!.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(magicLinkProcessorProvider.notifier).process(widget.token!);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final processorState = ref.watch(magicLinkProcessorProvider);
    final colorScheme = Theme.of(context).colorScheme;

    // Navigate to home on successful sign-in.
    ref.listen<AsyncValue<void>>(magicLinkProcessorProvider, (prev, next) {
      if (prev?.isLoading == true && !next.isLoading && !next.hasError) {
        if (context.mounted) context.go('/home');
      }
    });

    // No token in the URL → invalid link.
    if (widget.token == null || widget.token!.isEmpty) {
      return _ErrorView(
        message: 'Enlace no válido. Pide a Enrique y Manuel '
            'que te envíen uno nuevo.',
      );
    }

    // Authentication failed → show appropriate error.
    if (processorState.hasError) {
      final message = switch (processorState.error) {
        AuthFailure() => 'Este enlace ha caducado. Pide a Enrique y Manuel '
            'que te envíen uno nuevo.',
        NetworkFailure() => 'Sin conexión a internet. Comprueba tu conexión '
            'e inténtalo de nuevo.',
        _ => 'Ha ocurrido un error. Inténtalo de nuevo.',
      };
      return _ErrorView(message: message);
    }

    // Loading / initial state → show personalized loading screen.
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.favorite, size: 56, color: colorScheme.secondary),
            const SizedBox(height: 24),
            CircularProgressIndicator(color: colorScheme.primary),
            const SizedBox(height: 20),
            if (widget.guestName != null &&
                widget.guestName!.isNotEmpty) ...[
              Text(
                'Bienvenido/a, ${widget.guestName}',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
            ],
            Text(
              'Verificando tu invitación…',
              style: TextStyle(
                fontSize: 16,
                color: colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Private error view
// ---------------------------------------------------------------------------

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              const Spacer(flex: 3),
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: colorScheme.errorContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.link_off_rounded,
                  size: 40,
                  color: colorScheme.onErrorContainer,
                ),
              ),
              const SizedBox(height: 32),
              Text(
                'Enlace no disponible',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  height: 1.5,
                  color: colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
              const Spacer(flex: 2),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () => context.go('/welcome'),
                  child: const Text(
                    'Ir a inicio de sesión',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
