import 'package:freezed_annotation/freezed_annotation.dart';

part 'seating_assignment.freezed.dart';
part 'seating_assignment.g.dart';

@freezed
abstract class SeatingAssignment with _$SeatingAssignment {
  const factory SeatingAssignment({
    required String guestId,
    required String guestName,
    required String tableName,
    required int seatNumber,
  }) = _SeatingAssignment;

  factory SeatingAssignment.fromJson(Map<String, dynamic> json) =>
      _$SeatingAssignmentFromJson(json);
}
