import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'ticker_provider.g.dart';

@Riverpod(keepAlive: true)
Stream<DateTime> ticker(Ref ref) {
  return Stream.periodic(
    const Duration(seconds: 1),
    (_) => DateTime.now(),
  );
}
