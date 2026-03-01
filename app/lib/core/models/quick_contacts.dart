import 'package:freezed_annotation/freezed_annotation.dart';

part 'quick_contacts.freezed.dart';
part 'quick_contacts.g.dart';

@freezed
abstract class ContactEntry with _$ContactEntry {
  const factory ContactEntry({
    required String name,
    required String phone,
    String? whatsappUrl,
    String? role,
  }) = _ContactEntry;

  factory ContactEntry.fromJson(Map<String, dynamic> json) =>
      _$ContactEntryFromJson(json);
}

@freezed
abstract class QuickContacts with _$QuickContacts {
  const factory QuickContacts({
    required List<ContactEntry> taxis,
    required List<ContactEntry> coordinators,
  }) = _QuickContacts;

  factory QuickContacts.fromJson(Map<String, dynamic> json) =>
      _$QuickContactsFromJson(json);
}
