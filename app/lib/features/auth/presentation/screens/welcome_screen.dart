import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../../core/error/failures.dart';
import '../providers/auth_providers.dart';

enum _SignInMethod { google, apple, magicLink }

class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key, this.magicLinkToken});

  final String? magicLinkToken;

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  _SignInMethod? _activeMethod;

  @override
  void initState() {
    super.initState();
    if (widget.magicLinkToken != null) {
      _activeMethod = _SignInMethod.magicLink;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref
            .read(signInControllerProvider.notifier)
            .signInWithMagicLink(widget.magicLinkToken!);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final signInState = ref.watch(signInControllerProvider);
    final isLoading = signInState.isLoading;
    final colorScheme = Theme.of(context).colorScheme;

    ref.listen<AsyncValue<void>>(signInControllerProvider, (_, next) {
      if (next.hasError) {
        final error = next.error;
        if (error is AuthFailure && context.mounted) {
          context.go('/access-denied');
          return;
        }
        if (error is NetworkFailure && context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Sin conexión a internet'),
              action: SnackBarAction(
                label: 'Reintentar',
                onPressed: () {},
              ),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
      if (!next.isLoading && _activeMethod != null && mounted) {
        setState(() => _activeMethod = null);
      }
    });

    // Full-screen loading state while a magic link is being verified.
    if (_activeMethod == _SignInMethod.magicLink && isLoading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.favorite, size: 56, color: colorScheme.secondary),
              const SizedBox(height: 24),
              CircularProgressIndicator(color: colorScheme.primary),
              const SizedBox(height: 20),
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

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              const Spacer(flex: 3),

              // ── Hearts decoration ──────────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.favorite,
                    size: 14,
                    color: colorScheme.secondary.withValues(alpha: 0.35),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.favorite, size: 28, color: colorScheme.secondary),
                  const SizedBox(width: 8),
                  Icon(
                    Icons.favorite,
                    size: 14,
                    color: colorScheme.secondary.withValues(alpha: 0.35),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // ── Couple's names ─────────────────────────────────────────
              Text(
                'Enrique',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 44,
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onPrimaryContainer,
                ),
              ),
              Text(
                '&',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 28,
                  fontWeight: FontWeight.w400,
                  fontStyle: FontStyle.italic,
                  color: colorScheme.secondary,
                ),
              ),
              Text(
                'Manuel',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 44,
                  fontWeight: FontWeight.w700,
                  color: colorScheme.onPrimaryContainer,
                ),
              ),
              const SizedBox(height: 12),

              // ── Event tagline ──────────────────────────────────────────
              Text(
                'TARIFA · 2026',
                style: TextStyle(
                  fontSize: 14,
                  letterSpacing: 4,
                  fontWeight: FontWeight.w500,
                  color: colorScheme.onSurface.withValues(alpha: 0.45),
                ),
              ),

              const Spacer(flex: 2),

              // ── Invitation copy ────────────────────────────────────────
              Text(
                'You were invited! Sign in with the email '
                'your invitation was sent to.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  height: 1.5,
                  color: colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 28),

              // ── Sign in with Google ────────────────────────────────────
              _GoogleSignInButton(
                isLoading:
                    isLoading && _activeMethod == _SignInMethod.google,
                onPressed: isLoading
                    ? null
                    : () {
                        setState(
                          () => _activeMethod = _SignInMethod.google,
                        );
                        ref
                            .read(signInControllerProvider.notifier)
                            .signInWithGoogle();
                      },
              ),
              const SizedBox(height: 12),

              // ── Sign in with Apple ─────────────────────────────────────
              _AppleSignInButton(
                isLoading:
                    isLoading && _activeMethod == _SignInMethod.apple,
                onPressed: isLoading
                    ? null
                    : () {
                        setState(
                          () => _activeMethod = _SignInMethod.apple,
                        );
                        ref
                            .read(signInControllerProvider.notifier)
                            .signInWithApple();
                      },
              ),

              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Private button widgets
// ---------------------------------------------------------------------------

class _GoogleSignInButton extends StatelessWidget {
  const _GoogleSignInButton({required this.onPressed, required this.isLoading});

  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF1F1F1F),
          disabledBackgroundColor: Colors.white70,
          disabledForegroundColor: const Color(0x611F1F1F),
          elevation: 0,
          side: BorderSide(color: Colors.grey.shade300),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isLoading)
              const _ButtonSpinner()
            else
              const Text(
                'G',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF4285F4),
                ),
              ),
            const SizedBox(width: 12),
            const Text(
              'Iniciar sesión con Google',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}

class _AppleSignInButton extends StatelessWidget {
  const _AppleSignInButton({required this.onPressed, required this.isLoading});

  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
          disabledBackgroundColor: Colors.black54,
          disabledForegroundColor: Colors.white54,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isLoading)
              const _ButtonSpinner(color: Colors.white60)
            else
              const Icon(Icons.apple, size: 24),
            const SizedBox(width: 12),
            const Text(
              'Iniciar sesión con Apple',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}

class _ButtonSpinner extends StatelessWidget {
  const _ButtonSpinner({this.color});

  final Color? color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: color ?? Colors.grey.shade500,
      ),
    );
  }
}
