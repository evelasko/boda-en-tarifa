class QuickContact {
  final String id;
  final String label;
  final String phoneNumber;
  final String? whatsappNumber;

  const QuickContact({
    required this.id,
    required this.label,
    required this.phoneNumber,
    this.whatsappNumber,
  });

  factory QuickContact.fromJson(Map<String, dynamic> json) => QuickContact(
        id: json['id'] as String,
        label: json['label'] as String,
        phoneNumber: json['phoneNumber'] as String,
        whatsappNumber: json['whatsappNumber'] as String?,
      );
}

class QuickContacts {
  final List<QuickContact> taxis;
  final List<QuickContact> coordinators;

  const QuickContacts({required this.taxis, required this.coordinators});
}
