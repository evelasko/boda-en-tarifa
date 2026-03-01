import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/models/time_gated_content.dart';
import '../../../../core/providers/ticker_provider.dart';
import '../../../../core/remote_config/remote_config_providers.dart';

part 'time_gate_providers.g.dart';

enum TimeGateStatus { locked, unlocked }

class TimeGateState {
  final TimeGatedContent gate;
  final TimeGateStatus status;
  final Duration remaining;

  const TimeGateState({
    required this.gate,
    required this.status,
    required this.remaining,
  });
}

@riverpod
List<TimeGateState> timeGateStates(Ref ref) {
  final gates = ref.watch(timeGatesProvider).asData?.value;
  if (gates == null) return [];

  // Watch the ticker to recompute every second
  final now = ref.watch(tickerProvider).asData?.value ?? DateTime.now();

  return gates.map((gate) {
    final remaining = gate.unlockAt.difference(now);
    final status =
        remaining.isNegative ? TimeGateStatus.unlocked : TimeGateStatus.locked;
    return TimeGateState(
      gate: gate,
      status: status,
      remaining: remaining.isNegative ? Duration.zero : remaining,
    );
  }).toList();
}

@riverpod
List<TimeGateState> timeGatesForEvent(Ref ref, String eventId) {
  final states = ref.watch(timeGateStatesProvider);
  return states.where((s) => s.gate.eventId == eventId).toList();
}

/// Selects the single most relevant time gate for the home screen:
/// - Locked and < 30 minutes to unlock, OR
/// - Unlocked and < 2 hours since unlock
@riverpod
TimeGateState? homeTimeGate(Ref ref) {
  final states = ref.watch(timeGateStatesProvider);
  if (states.isEmpty) return null;

  final now = ref.watch(tickerProvider).asData?.value ?? DateTime.now();

  // Priority 1: locked gates within 30 minutes
  final soonToUnlock = states
      .where((s) =>
          s.status == TimeGateStatus.locked &&
          s.remaining <= const Duration(minutes: 30))
      .toList();
  if (soonToUnlock.isNotEmpty) {
    soonToUnlock.sort((a, b) => a.remaining.compareTo(b.remaining));
    return soonToUnlock.first;
  }

  // Priority 2: recently unlocked (< 2 hours ago)
  final recentlyUnlocked = states
      .where((s) =>
          s.status == TimeGateStatus.unlocked &&
          now.difference(s.gate.unlockAt) < const Duration(hours: 2))
      .toList();
  if (recentlyUnlocked.isNotEmpty) {
    recentlyUnlocked.sort(
        (a, b) => b.gate.unlockAt.compareTo(a.gate.unlockAt));
    return recentlyUnlocked.first;
  }

  return null;
}
