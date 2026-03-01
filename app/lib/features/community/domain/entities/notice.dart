import 'package:freezed_annotation/freezed_annotation.dart';

import 'package:boda_en_tarifa_app/features/auth/domain/entities/app_user.dart';

part 'notice.freezed.dart';
part 'notice.g.dart';

@freezed
abstract class Notice with _$Notice {
  const factory Notice({
    required String id,
    required String authorUid,
    required String authorName,
    String? authorPhotoUrl,
    required String body,
    String? authorWhatsappNumber,
    String? authorEmail,
    @TimestampConverter() required DateTime createdAt,
  }) = _Notice;

  factory Notice.fromJson(Map<String, dynamic> json) =>
      _$NoticeFromJson(json);
}
