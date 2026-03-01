import 'package:flutter/material.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key, this.magicLinkToken});

  /// When the app is opened via a magic link deep link, the token is
  /// passed here so authentication can proceed automatically.
  final String? magicLinkToken;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.favorite,
              size: 64,
              color: Theme.of(context).colorScheme.secondary,
            ),
            const SizedBox(height: 16),
            const Text(
              'Boda en Tarifa',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            const Text(
              'Inicia sesión para acceder a la app',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            if (magicLinkToken != null) ...[
              const SizedBox(height: 24),
              const CircularProgressIndicator(),
              const SizedBox(height: 12),
              const Text(
                'Verificando tu invitación…',
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
