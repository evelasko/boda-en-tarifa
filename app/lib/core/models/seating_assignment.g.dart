// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'seating_assignment.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_SeatingAssignment _$SeatingAssignmentFromJson(Map<String, dynamic> json) =>
    _SeatingAssignment(
      guestId: json['guestId'] as String,
      guestName: json['guestName'] as String,
      tableName: json['tableName'] as String,
      seatNumber: (json['seatNumber'] as num).toInt(),
    );

Map<String, dynamic> _$SeatingAssignmentToJson(_SeatingAssignment instance) =>
    <String, dynamic>{
      'guestId': instance.guestId,
      'guestName': instance.guestName,
      'tableName': instance.tableName,
      'seatNumber': instance.seatNumber,
    };
