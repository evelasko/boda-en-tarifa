import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:boda_en_tarifa_app/share_extension/share_handler.dart';

import 'router.dart';
import 'theme.dart';

class BodaEnTarifaApp extends ConsumerWidget {
  const BodaEnTarifaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final routerConfig = ref.watch(routerProvider);

    // Eagerly initialize the share handler so it starts listening
    // for incoming share intents immediately.
    ref.watch(shareHandlerProvider);

    return MaterialApp.router(
      title: 'Boda en Tarifa',
      theme: AppTheme.lightTheme,
      routerConfig: routerConfig,
      debugShowCheckedModeBanner: false,
    );
  }
}
