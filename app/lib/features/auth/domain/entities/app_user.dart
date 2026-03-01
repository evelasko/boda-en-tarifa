import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'app_user.freezed.dart';
part 'app_user.g.dart';

enum RelationshipStatus {
  @JsonValue('soltero')
  soltero,
  @JsonValue('enPareja')
  enPareja,
  @JsonValue('buscando')
  buscando,
}

enum GuestSide {
  @JsonValue('novioA')
  novioA,
  @JsonValue('novioB')
  novioB,
  @JsonValue('ambos')
  ambos,
}

@freezed
abstract class AppUser with _$AppUser {
  const factory AppUser({
    required String uid,
    required String email,
    required String fullName,
    String? photoUrl,
    String? whatsappNumber,
    String? funFact,
    required String relationToGrooms,
    required RelationshipStatus relationshipStatus,
    required GuestSide side,
    required bool profileClaimed,
    required bool isDirectoryVisible,
    @TimestampConverter() required DateTime createdAt,
    @TimestampConverter() required DateTime updatedAt,
  }) = _AppUser;

  factory AppUser.fromJson(Map<String, dynamic> json) =>
      _$AppUserFromJson(json);
}

/// Converts Firestore [Timestamp] to [DateTime] and back.
class TimestampConverter implements JsonConverter<DateTime, dynamic> {
  const TimestampConverter();

  @override
  DateTime fromJson(dynamic json) {
    if (json is Timestamp) {
      return json.toDate();
    }
    if (json is String) {
      return DateTime.parse(json);
    }
    return DateTime.fromMillisecondsSinceEpoch(json as int);
  }

  @override
  dynamic toJson(DateTime object) => Timestamp.fromDate(object);
}
