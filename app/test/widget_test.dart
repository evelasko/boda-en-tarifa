import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:boda_en_tarifa_app/app/app.dart';

void main() {
  testWidgets('App renders with bottom navigation', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: BodaEnTarifaApp()),
    );

    expect(find.text('Inicio'), findsWidgets);
    expect(find.text('Comunidad'), findsWidgets);
    expect(find.text('Cámara'), findsWidgets);
    expect(find.text('Agenda'), findsWidgets);
    expect(find.text('Invitados'), findsWidgets);
  });
}
