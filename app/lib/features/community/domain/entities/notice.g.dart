// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notice.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Notice _$NoticeFromJson(Map<String, dynamic> json) => _Notice(
  id: json['id'] as String,
  authorUid: json['authorUid'] as String,
  authorName: json['authorName'] as String,
  authorPhotoUrl: json['authorPhotoUrl'] as String?,
  body: json['body'] as String,
  authorWhatsappNumber: json['authorWhatsappNumber'] as String?,
  authorEmail: json['authorEmail'] as String?,
  createdAt: const TimestampConverter().fromJson(json['createdAt']),
);

Map<String, dynamic> _$NoticeToJson(_Notice instance) => <String, dynamic>{
  'id': instance.id,
  'authorUid': instance.authorUid,
  'authorName': instance.authorName,
  'authorPhotoUrl': instance.authorPhotoUrl,
  'body': instance.body,
  'authorWhatsappNumber': instance.authorWhatsappNumber,
  'authorEmail': instance.authorEmail,
  'createdAt': const TimestampConverter().toJson(instance.createdAt),
};
