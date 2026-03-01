import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../providers/auth_providers.dart';

class AccessDeniedScreen extends ConsumerStatefulWidget {
  const AccessDeniedScreen({super.key});

  @override
  ConsumerState<AccessDeniedScreen> createState() =>
      _AccessDeniedScreenState();
}

class _AccessDeniedScreenState extends ConsumerState<AccessDeniedScreen> {
  bool _isSigningOut = false;

  Future<void> _handleTryAgain() async {
    setState(() => _isSigningOut = true);
    final result = await ref.read(signOutUseCaseProvider)();
    if (!mounted) return;

    result.fold(
      (_) {
        setState(() => _isSigningOut = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error al cerrar sesión. Inténtalo de nuevo.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      },
      (_) => context.go('/welcome'),
    );
  }

  Future<void> _contactCouple() async {
    // WhatsApp deep link — update the number before launch.
    final uri = Uri.parse(
      'https://wa.me/?text='
      '${Uri.encodeComponent('Hola, necesito ayuda con el acceso a la app de la boda.')}',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

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

              // ── Illustration ───────────────────────────────────────────
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: colorScheme.errorContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.lock_outline_rounded,
                  size: 40,
                  color: colorScheme.onErrorContainer,
                ),
              ),
              const SizedBox(height: 32),

              // ── Title ──────────────────────────────────────────────────
              Text(
                'No hemos encontrado\ntu invitación',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  height: 1.3,
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 16),

              // ── Body copy ──────────────────────────────────────────────
              Text(
                'Contacta con Enrique o Manuel\npara obtener acceso.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  height: 1.5,
                  color: colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),

              const Spacer(flex: 2),

              // ── Try again ──────────────────────────────────────────────
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSigningOut ? null : _handleTryAgain,
                  child: _isSigningOut
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white70,
                          ),
                        )
                      : const Text(
                          'Intentar de nuevo',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 12),

              // ── Contact the couple ─────────────────────────────────────
              TextButton.icon(
                onPressed: _contactCouple,
                icon: const Icon(Icons.chat_outlined, size: 20),
                label: const Text(
                  'Contactar a los novios',
                  style: TextStyle(fontSize: 15),
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
