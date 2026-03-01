// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $EventSchedulesTable extends EventSchedules
    with TableInfo<$EventSchedulesTable, EventScheduleRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $EventSchedulesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _descriptionMeta = const VerificationMeta(
    'description',
  );
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
    'description',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _startTimeMeta = const VerificationMeta(
    'startTime',
  );
  @override
  late final GeneratedColumn<DateTime> startTime = GeneratedColumn<DateTime>(
    'start_time',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _endTimeMeta = const VerificationMeta(
    'endTime',
  );
  @override
  late final GeneratedColumn<DateTime> endTime = GeneratedColumn<DateTime>(
    'end_time',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _venueIdMeta = const VerificationMeta(
    'venueId',
  );
  @override
  late final GeneratedColumn<String> venueId = GeneratedColumn<String>(
    'venue_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _ctaLabelMeta = const VerificationMeta(
    'ctaLabel',
  );
  @override
  late final GeneratedColumn<String> ctaLabel = GeneratedColumn<String>(
    'cta_label',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _ctaDeepLinkMeta = const VerificationMeta(
    'ctaDeepLink',
  );
  @override
  late final GeneratedColumn<String> ctaDeepLink = GeneratedColumn<String>(
    'cta_deep_link',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _dayNumberMeta = const VerificationMeta(
    'dayNumber',
  );
  @override
  late final GeneratedColumn<int> dayNumber = GeneratedColumn<int>(
    'day_number',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    title,
    description,
    startTime,
    endTime,
    venueId,
    ctaLabel,
    ctaDeepLink,
    dayNumber,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'event_schedules';
  @override
  VerificationContext validateIntegrity(
    Insertable<EventScheduleRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
        _descriptionMeta,
        description.isAcceptableOrUnknown(
          data['description']!,
          _descriptionMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_descriptionMeta);
    }
    if (data.containsKey('start_time')) {
      context.handle(
        _startTimeMeta,
        startTime.isAcceptableOrUnknown(data['start_time']!, _startTimeMeta),
      );
    } else if (isInserting) {
      context.missing(_startTimeMeta);
    }
    if (data.containsKey('end_time')) {
      context.handle(
        _endTimeMeta,
        endTime.isAcceptableOrUnknown(data['end_time']!, _endTimeMeta),
      );
    } else if (isInserting) {
      context.missing(_endTimeMeta);
    }
    if (data.containsKey('venue_id')) {
      context.handle(
        _venueIdMeta,
        venueId.isAcceptableOrUnknown(data['venue_id']!, _venueIdMeta),
      );
    } else if (isInserting) {
      context.missing(_venueIdMeta);
    }
    if (data.containsKey('cta_label')) {
      context.handle(
        _ctaLabelMeta,
        ctaLabel.isAcceptableOrUnknown(data['cta_label']!, _ctaLabelMeta),
      );
    }
    if (data.containsKey('cta_deep_link')) {
      context.handle(
        _ctaDeepLinkMeta,
        ctaDeepLink.isAcceptableOrUnknown(
          data['cta_deep_link']!,
          _ctaDeepLinkMeta,
        ),
      );
    }
    if (data.containsKey('day_number')) {
      context.handle(
        _dayNumberMeta,
        dayNumber.isAcceptableOrUnknown(data['day_number']!, _dayNumberMeta),
      );
    } else if (isInserting) {
      context.missing(_dayNumberMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  EventScheduleRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return EventScheduleRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      )!,
      description: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}description'],
      )!,
      startTime: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}start_time'],
      )!,
      endTime: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}end_time'],
      )!,
      venueId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}venue_id'],
      )!,
      ctaLabel: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cta_label'],
      ),
      ctaDeepLink: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cta_deep_link'],
      ),
      dayNumber: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}day_number'],
      )!,
    );
  }

  @override
  $EventSchedulesTable createAlias(String alias) {
    return $EventSchedulesTable(attachedDatabase, alias);
  }
}

class EventScheduleRow extends DataClass
    implements Insertable<EventScheduleRow> {
  final String id;
  final String title;
  final String description;
  final DateTime startTime;
  final DateTime endTime;
  final String venueId;
  final String? ctaLabel;
  final String? ctaDeepLink;
  final int dayNumber;
  const EventScheduleRow({
    required this.id,
    required this.title,
    required this.description,
    required this.startTime,
    required this.endTime,
    required this.venueId,
    this.ctaLabel,
    this.ctaDeepLink,
    required this.dayNumber,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['title'] = Variable<String>(title);
    map['description'] = Variable<String>(description);
    map['start_time'] = Variable<DateTime>(startTime);
    map['end_time'] = Variable<DateTime>(endTime);
    map['venue_id'] = Variable<String>(venueId);
    if (!nullToAbsent || ctaLabel != null) {
      map['cta_label'] = Variable<String>(ctaLabel);
    }
    if (!nullToAbsent || ctaDeepLink != null) {
      map['cta_deep_link'] = Variable<String>(ctaDeepLink);
    }
    map['day_number'] = Variable<int>(dayNumber);
    return map;
  }

  EventSchedulesCompanion toCompanion(bool nullToAbsent) {
    return EventSchedulesCompanion(
      id: Value(id),
      title: Value(title),
      description: Value(description),
      startTime: Value(startTime),
      endTime: Value(endTime),
      venueId: Value(venueId),
      ctaLabel: ctaLabel == null && nullToAbsent
          ? const Value.absent()
          : Value(ctaLabel),
      ctaDeepLink: ctaDeepLink == null && nullToAbsent
          ? const Value.absent()
          : Value(ctaDeepLink),
      dayNumber: Value(dayNumber),
    );
  }

  factory EventScheduleRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return EventScheduleRow(
      id: serializer.fromJson<String>(json['id']),
      title: serializer.fromJson<String>(json['title']),
      description: serializer.fromJson<String>(json['description']),
      startTime: serializer.fromJson<DateTime>(json['startTime']),
      endTime: serializer.fromJson<DateTime>(json['endTime']),
      venueId: serializer.fromJson<String>(json['venueId']),
      ctaLabel: serializer.fromJson<String?>(json['ctaLabel']),
      ctaDeepLink: serializer.fromJson<String?>(json['ctaDeepLink']),
      dayNumber: serializer.fromJson<int>(json['dayNumber']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'title': serializer.toJson<String>(title),
      'description': serializer.toJson<String>(description),
      'startTime': serializer.toJson<DateTime>(startTime),
      'endTime': serializer.toJson<DateTime>(endTime),
      'venueId': serializer.toJson<String>(venueId),
      'ctaLabel': serializer.toJson<String?>(ctaLabel),
      'ctaDeepLink': serializer.toJson<String?>(ctaDeepLink),
      'dayNumber': serializer.toJson<int>(dayNumber),
    };
  }

  EventScheduleRow copyWith({
    String? id,
    String? title,
    String? description,
    DateTime? startTime,
    DateTime? endTime,
    String? venueId,
    Value<String?> ctaLabel = const Value.absent(),
    Value<String?> ctaDeepLink = const Value.absent(),
    int? dayNumber,
  }) => EventScheduleRow(
    id: id ?? this.id,
    title: title ?? this.title,
    description: description ?? this.description,
    startTime: startTime ?? this.startTime,
    endTime: endTime ?? this.endTime,
    venueId: venueId ?? this.venueId,
    ctaLabel: ctaLabel.present ? ctaLabel.value : this.ctaLabel,
    ctaDeepLink: ctaDeepLink.present ? ctaDeepLink.value : this.ctaDeepLink,
    dayNumber: dayNumber ?? this.dayNumber,
  );
  EventScheduleRow copyWithCompanion(EventSchedulesCompanion data) {
    return EventScheduleRow(
      id: data.id.present ? data.id.value : this.id,
      title: data.title.present ? data.title.value : this.title,
      description: data.description.present
          ? data.description.value
          : this.description,
      startTime: data.startTime.present ? data.startTime.value : this.startTime,
      endTime: data.endTime.present ? data.endTime.value : this.endTime,
      venueId: data.venueId.present ? data.venueId.value : this.venueId,
      ctaLabel: data.ctaLabel.present ? data.ctaLabel.value : this.ctaLabel,
      ctaDeepLink: data.ctaDeepLink.present
          ? data.ctaDeepLink.value
          : this.ctaDeepLink,
      dayNumber: data.dayNumber.present ? data.dayNumber.value : this.dayNumber,
    );
  }

  @override
  String toString() {
    return (StringBuffer('EventScheduleRow(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('startTime: $startTime, ')
          ..write('endTime: $endTime, ')
          ..write('venueId: $venueId, ')
          ..write('ctaLabel: $ctaLabel, ')
          ..write('ctaDeepLink: $ctaDeepLink, ')
          ..write('dayNumber: $dayNumber')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    title,
    description,
    startTime,
    endTime,
    venueId,
    ctaLabel,
    ctaDeepLink,
    dayNumber,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is EventScheduleRow &&
          other.id == this.id &&
          other.title == this.title &&
          other.description == this.description &&
          other.startTime == this.startTime &&
          other.endTime == this.endTime &&
          other.venueId == this.venueId &&
          other.ctaLabel == this.ctaLabel &&
          other.ctaDeepLink == this.ctaDeepLink &&
          other.dayNumber == this.dayNumber);
}

class EventSchedulesCompanion extends UpdateCompanion<EventScheduleRow> {
  final Value<String> id;
  final Value<String> title;
  final Value<String> description;
  final Value<DateTime> startTime;
  final Value<DateTime> endTime;
  final Value<String> venueId;
  final Value<String?> ctaLabel;
  final Value<String?> ctaDeepLink;
  final Value<int> dayNumber;
  final Value<int> rowid;
  const EventSchedulesCompanion({
    this.id = const Value.absent(),
    this.title = const Value.absent(),
    this.description = const Value.absent(),
    this.startTime = const Value.absent(),
    this.endTime = const Value.absent(),
    this.venueId = const Value.absent(),
    this.ctaLabel = const Value.absent(),
    this.ctaDeepLink = const Value.absent(),
    this.dayNumber = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  EventSchedulesCompanion.insert({
    required String id,
    required String title,
    required String description,
    required DateTime startTime,
    required DateTime endTime,
    required String venueId,
    this.ctaLabel = const Value.absent(),
    this.ctaDeepLink = const Value.absent(),
    required int dayNumber,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       title = Value(title),
       description = Value(description),
       startTime = Value(startTime),
       endTime = Value(endTime),
       venueId = Value(venueId),
       dayNumber = Value(dayNumber);
  static Insertable<EventScheduleRow> custom({
    Expression<String>? id,
    Expression<String>? title,
    Expression<String>? description,
    Expression<DateTime>? startTime,
    Expression<DateTime>? endTime,
    Expression<String>? venueId,
    Expression<String>? ctaLabel,
    Expression<String>? ctaDeepLink,
    Expression<int>? dayNumber,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (startTime != null) 'start_time': startTime,
      if (endTime != null) 'end_time': endTime,
      if (venueId != null) 'venue_id': venueId,
      if (ctaLabel != null) 'cta_label': ctaLabel,
      if (ctaDeepLink != null) 'cta_deep_link': ctaDeepLink,
      if (dayNumber != null) 'day_number': dayNumber,
      if (rowid != null) 'rowid': rowid,
    });
  }

  EventSchedulesCompanion copyWith({
    Value<String>? id,
    Value<String>? title,
    Value<String>? description,
    Value<DateTime>? startTime,
    Value<DateTime>? endTime,
    Value<String>? venueId,
    Value<String?>? ctaLabel,
    Value<String?>? ctaDeepLink,
    Value<int>? dayNumber,
    Value<int>? rowid,
  }) {
    return EventSchedulesCompanion(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      venueId: venueId ?? this.venueId,
      ctaLabel: ctaLabel ?? this.ctaLabel,
      ctaDeepLink: ctaDeepLink ?? this.ctaDeepLink,
      dayNumber: dayNumber ?? this.dayNumber,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (startTime.present) {
      map['start_time'] = Variable<DateTime>(startTime.value);
    }
    if (endTime.present) {
      map['end_time'] = Variable<DateTime>(endTime.value);
    }
    if (venueId.present) {
      map['venue_id'] = Variable<String>(venueId.value);
    }
    if (ctaLabel.present) {
      map['cta_label'] = Variable<String>(ctaLabel.value);
    }
    if (ctaDeepLink.present) {
      map['cta_deep_link'] = Variable<String>(ctaDeepLink.value);
    }
    if (dayNumber.present) {
      map['day_number'] = Variable<int>(dayNumber.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('EventSchedulesCompanion(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('startTime: $startTime, ')
          ..write('endTime: $endTime, ')
          ..write('venueId: $venueId, ')
          ..write('ctaLabel: $ctaLabel, ')
          ..write('ctaDeepLink: $ctaDeepLink, ')
          ..write('dayNumber: $dayNumber, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $VenuesTable extends Venues with TableInfo<$VenuesTable, VenueRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $VenuesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _latitudeMeta = const VerificationMeta(
    'latitude',
  );
  @override
  late final GeneratedColumn<double> latitude = GeneratedColumn<double>(
    'latitude',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _longitudeMeta = const VerificationMeta(
    'longitude',
  );
  @override
  late final GeneratedColumn<double> longitude = GeneratedColumn<double>(
    'longitude',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _walkingDirectionsMeta = const VerificationMeta(
    'walkingDirections',
  );
  @override
  late final GeneratedColumn<String> walkingDirections =
      GeneratedColumn<String>(
        'walking_directions',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _terrainNoteMeta = const VerificationMeta(
    'terrainNote',
  );
  @override
  late final GeneratedColumn<String> terrainNote = GeneratedColumn<String>(
    'terrain_note',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    name,
    latitude,
    longitude,
    walkingDirections,
    terrainNote,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'venues';
  @override
  VerificationContext validateIntegrity(
    Insertable<VenueRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('latitude')) {
      context.handle(
        _latitudeMeta,
        latitude.isAcceptableOrUnknown(data['latitude']!, _latitudeMeta),
      );
    } else if (isInserting) {
      context.missing(_latitudeMeta);
    }
    if (data.containsKey('longitude')) {
      context.handle(
        _longitudeMeta,
        longitude.isAcceptableOrUnknown(data['longitude']!, _longitudeMeta),
      );
    } else if (isInserting) {
      context.missing(_longitudeMeta);
    }
    if (data.containsKey('walking_directions')) {
      context.handle(
        _walkingDirectionsMeta,
        walkingDirections.isAcceptableOrUnknown(
          data['walking_directions']!,
          _walkingDirectionsMeta,
        ),
      );
    }
    if (data.containsKey('terrain_note')) {
      context.handle(
        _terrainNoteMeta,
        terrainNote.isAcceptableOrUnknown(
          data['terrain_note']!,
          _terrainNoteMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  VenueRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return VenueRow(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      latitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}latitude'],
      )!,
      longitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}longitude'],
      )!,
      walkingDirections: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}walking_directions'],
      ),
      terrainNote: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}terrain_note'],
      ),
    );
  }

  @override
  $VenuesTable createAlias(String alias) {
    return $VenuesTable(attachedDatabase, alias);
  }
}

class VenueRow extends DataClass implements Insertable<VenueRow> {
  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final String? walkingDirections;
  final String? terrainNote;
  const VenueRow({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    this.walkingDirections,
    this.terrainNote,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    map['latitude'] = Variable<double>(latitude);
    map['longitude'] = Variable<double>(longitude);
    if (!nullToAbsent || walkingDirections != null) {
      map['walking_directions'] = Variable<String>(walkingDirections);
    }
    if (!nullToAbsent || terrainNote != null) {
      map['terrain_note'] = Variable<String>(terrainNote);
    }
    return map;
  }

  VenuesCompanion toCompanion(bool nullToAbsent) {
    return VenuesCompanion(
      id: Value(id),
      name: Value(name),
      latitude: Value(latitude),
      longitude: Value(longitude),
      walkingDirections: walkingDirections == null && nullToAbsent
          ? const Value.absent()
          : Value(walkingDirections),
      terrainNote: terrainNote == null && nullToAbsent
          ? const Value.absent()
          : Value(terrainNote),
    );
  }

  factory VenueRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return VenueRow(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      latitude: serializer.fromJson<double>(json['latitude']),
      longitude: serializer.fromJson<double>(json['longitude']),
      walkingDirections: serializer.fromJson<String?>(
        json['walkingDirections'],
      ),
      terrainNote: serializer.fromJson<String?>(json['terrainNote']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'latitude': serializer.toJson<double>(latitude),
      'longitude': serializer.toJson<double>(longitude),
      'walkingDirections': serializer.toJson<String?>(walkingDirections),
      'terrainNote': serializer.toJson<String?>(terrainNote),
    };
  }

  VenueRow copyWith({
    String? id,
    String? name,
    double? latitude,
    double? longitude,
    Value<String?> walkingDirections = const Value.absent(),
    Value<String?> terrainNote = const Value.absent(),
  }) => VenueRow(
    id: id ?? this.id,
    name: name ?? this.name,
    latitude: latitude ?? this.latitude,
    longitude: longitude ?? this.longitude,
    walkingDirections: walkingDirections.present
        ? walkingDirections.value
        : this.walkingDirections,
    terrainNote: terrainNote.present ? terrainNote.value : this.terrainNote,
  );
  VenueRow copyWithCompanion(VenuesCompanion data) {
    return VenueRow(
      id: data.id.present ? data.id.value : this.id,
      name: data.name.present ? data.name.value : this.name,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
      walkingDirections: data.walkingDirections.present
          ? data.walkingDirections.value
          : this.walkingDirections,
      terrainNote: data.terrainNote.present
          ? data.terrainNote.value
          : this.terrainNote,
    );
  }

  @override
  String toString() {
    return (StringBuffer('VenueRow(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('walkingDirections: $walkingDirections, ')
          ..write('terrainNote: $terrainNote')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    name,
    latitude,
    longitude,
    walkingDirections,
    terrainNote,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is VenueRow &&
          other.id == this.id &&
          other.name == this.name &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.walkingDirections == this.walkingDirections &&
          other.terrainNote == this.terrainNote);
}

class VenuesCompanion extends UpdateCompanion<VenueRow> {
  final Value<String> id;
  final Value<String> name;
  final Value<double> latitude;
  final Value<double> longitude;
  final Value<String?> walkingDirections;
  final Value<String?> terrainNote;
  final Value<int> rowid;
  const VenuesCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.walkingDirections = const Value.absent(),
    this.terrainNote = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  VenuesCompanion.insert({
    required String id,
    required String name,
    required double latitude,
    required double longitude,
    this.walkingDirections = const Value.absent(),
    this.terrainNote = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       name = Value(name),
       latitude = Value(latitude),
       longitude = Value(longitude);
  static Insertable<VenueRow> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<double>? latitude,
    Expression<double>? longitude,
    Expression<String>? walkingDirections,
    Expression<String>? terrainNote,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (walkingDirections != null) 'walking_directions': walkingDirections,
      if (terrainNote != null) 'terrain_note': terrainNote,
      if (rowid != null) 'rowid': rowid,
    });
  }

  VenuesCompanion copyWith({
    Value<String>? id,
    Value<String>? name,
    Value<double>? latitude,
    Value<double>? longitude,
    Value<String?>? walkingDirections,
    Value<String?>? terrainNote,
    Value<int>? rowid,
  }) {
    return VenuesCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      walkingDirections: walkingDirections ?? this.walkingDirections,
      terrainNote: terrainNote ?? this.terrainNote,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (latitude.present) {
      map['latitude'] = Variable<double>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = Variable<double>(longitude.value);
    }
    if (walkingDirections.present) {
      map['walking_directions'] = Variable<String>(walkingDirections.value);
    }
    if (terrainNote.present) {
      map['terrain_note'] = Variable<String>(terrainNote.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('VenuesCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('walkingDirections: $walkingDirections, ')
          ..write('terrainNote: $terrainNote, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedGuestsTable extends CachedGuests
    with TableInfo<$CachedGuestsTable, CachedGuest> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedGuestsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _uidMeta = const VerificationMeta('uid');
  @override
  late final GeneratedColumn<String> uid = GeneratedColumn<String>(
    'uid',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _fullNameMeta = const VerificationMeta(
    'fullName',
  );
  @override
  late final GeneratedColumn<String> fullName = GeneratedColumn<String>(
    'full_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _photoUrlMeta = const VerificationMeta(
    'photoUrl',
  );
  @override
  late final GeneratedColumn<String> photoUrl = GeneratedColumn<String>(
    'photo_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _sideMeta = const VerificationMeta('side');
  @override
  late final GeneratedColumn<String> side = GeneratedColumn<String>(
    'side',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _relationToGroomsMeta = const VerificationMeta(
    'relationToGrooms',
  );
  @override
  late final GeneratedColumn<String> relationToGrooms = GeneratedColumn<String>(
    'relation_to_grooms',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _relationshipStatusMeta =
      const VerificationMeta('relationshipStatus');
  @override
  late final GeneratedColumn<String> relationshipStatus =
      GeneratedColumn<String>(
        'relationship_status',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _whatsappNumberMeta = const VerificationMeta(
    'whatsappNumber',
  );
  @override
  late final GeneratedColumn<String> whatsappNumber = GeneratedColumn<String>(
    'whatsapp_number',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _funFactMeta = const VerificationMeta(
    'funFact',
  );
  @override
  late final GeneratedColumn<String> funFact = GeneratedColumn<String>(
    'fun_fact',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    uid,
    fullName,
    photoUrl,
    side,
    relationToGrooms,
    relationshipStatus,
    whatsappNumber,
    funFact,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_guests';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedGuest> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('uid')) {
      context.handle(
        _uidMeta,
        uid.isAcceptableOrUnknown(data['uid']!, _uidMeta),
      );
    } else if (isInserting) {
      context.missing(_uidMeta);
    }
    if (data.containsKey('full_name')) {
      context.handle(
        _fullNameMeta,
        fullName.isAcceptableOrUnknown(data['full_name']!, _fullNameMeta),
      );
    } else if (isInserting) {
      context.missing(_fullNameMeta);
    }
    if (data.containsKey('photo_url')) {
      context.handle(
        _photoUrlMeta,
        photoUrl.isAcceptableOrUnknown(data['photo_url']!, _photoUrlMeta),
      );
    }
    if (data.containsKey('side')) {
      context.handle(
        _sideMeta,
        side.isAcceptableOrUnknown(data['side']!, _sideMeta),
      );
    } else if (isInserting) {
      context.missing(_sideMeta);
    }
    if (data.containsKey('relation_to_grooms')) {
      context.handle(
        _relationToGroomsMeta,
        relationToGrooms.isAcceptableOrUnknown(
          data['relation_to_grooms']!,
          _relationToGroomsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_relationToGroomsMeta);
    }
    if (data.containsKey('relationship_status')) {
      context.handle(
        _relationshipStatusMeta,
        relationshipStatus.isAcceptableOrUnknown(
          data['relationship_status']!,
          _relationshipStatusMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_relationshipStatusMeta);
    }
    if (data.containsKey('whatsapp_number')) {
      context.handle(
        _whatsappNumberMeta,
        whatsappNumber.isAcceptableOrUnknown(
          data['whatsapp_number']!,
          _whatsappNumberMeta,
        ),
      );
    }
    if (data.containsKey('fun_fact')) {
      context.handle(
        _funFactMeta,
        funFact.isAcceptableOrUnknown(data['fun_fact']!, _funFactMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {uid};
  @override
  CachedGuest map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedGuest(
      uid: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}uid'],
      )!,
      fullName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}full_name'],
      )!,
      photoUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}photo_url'],
      ),
      side: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}side'],
      )!,
      relationToGrooms: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}relation_to_grooms'],
      )!,
      relationshipStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}relationship_status'],
      )!,
      whatsappNumber: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}whatsapp_number'],
      ),
      funFact: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}fun_fact'],
      ),
    );
  }

  @override
  $CachedGuestsTable createAlias(String alias) {
    return $CachedGuestsTable(attachedDatabase, alias);
  }
}

class CachedGuest extends DataClass implements Insertable<CachedGuest> {
  final String uid;
  final String fullName;
  final String? photoUrl;
  final String side;
  final String relationToGrooms;
  final String relationshipStatus;
  final String? whatsappNumber;
  final String? funFact;
  const CachedGuest({
    required this.uid,
    required this.fullName,
    this.photoUrl,
    required this.side,
    required this.relationToGrooms,
    required this.relationshipStatus,
    this.whatsappNumber,
    this.funFact,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['uid'] = Variable<String>(uid);
    map['full_name'] = Variable<String>(fullName);
    if (!nullToAbsent || photoUrl != null) {
      map['photo_url'] = Variable<String>(photoUrl);
    }
    map['side'] = Variable<String>(side);
    map['relation_to_grooms'] = Variable<String>(relationToGrooms);
    map['relationship_status'] = Variable<String>(relationshipStatus);
    if (!nullToAbsent || whatsappNumber != null) {
      map['whatsapp_number'] = Variable<String>(whatsappNumber);
    }
    if (!nullToAbsent || funFact != null) {
      map['fun_fact'] = Variable<String>(funFact);
    }
    return map;
  }

  CachedGuestsCompanion toCompanion(bool nullToAbsent) {
    return CachedGuestsCompanion(
      uid: Value(uid),
      fullName: Value(fullName),
      photoUrl: photoUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(photoUrl),
      side: Value(side),
      relationToGrooms: Value(relationToGrooms),
      relationshipStatus: Value(relationshipStatus),
      whatsappNumber: whatsappNumber == null && nullToAbsent
          ? const Value.absent()
          : Value(whatsappNumber),
      funFact: funFact == null && nullToAbsent
          ? const Value.absent()
          : Value(funFact),
    );
  }

  factory CachedGuest.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedGuest(
      uid: serializer.fromJson<String>(json['uid']),
      fullName: serializer.fromJson<String>(json['fullName']),
      photoUrl: serializer.fromJson<String?>(json['photoUrl']),
      side: serializer.fromJson<String>(json['side']),
      relationToGrooms: serializer.fromJson<String>(json['relationToGrooms']),
      relationshipStatus: serializer.fromJson<String>(
        json['relationshipStatus'],
      ),
      whatsappNumber: serializer.fromJson<String?>(json['whatsappNumber']),
      funFact: serializer.fromJson<String?>(json['funFact']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'uid': serializer.toJson<String>(uid),
      'fullName': serializer.toJson<String>(fullName),
      'photoUrl': serializer.toJson<String?>(photoUrl),
      'side': serializer.toJson<String>(side),
      'relationToGrooms': serializer.toJson<String>(relationToGrooms),
      'relationshipStatus': serializer.toJson<String>(relationshipStatus),
      'whatsappNumber': serializer.toJson<String?>(whatsappNumber),
      'funFact': serializer.toJson<String?>(funFact),
    };
  }

  CachedGuest copyWith({
    String? uid,
    String? fullName,
    Value<String?> photoUrl = const Value.absent(),
    String? side,
    String? relationToGrooms,
    String? relationshipStatus,
    Value<String?> whatsappNumber = const Value.absent(),
    Value<String?> funFact = const Value.absent(),
  }) => CachedGuest(
    uid: uid ?? this.uid,
    fullName: fullName ?? this.fullName,
    photoUrl: photoUrl.present ? photoUrl.value : this.photoUrl,
    side: side ?? this.side,
    relationToGrooms: relationToGrooms ?? this.relationToGrooms,
    relationshipStatus: relationshipStatus ?? this.relationshipStatus,
    whatsappNumber: whatsappNumber.present
        ? whatsappNumber.value
        : this.whatsappNumber,
    funFact: funFact.present ? funFact.value : this.funFact,
  );
  CachedGuest copyWithCompanion(CachedGuestsCompanion data) {
    return CachedGuest(
      uid: data.uid.present ? data.uid.value : this.uid,
      fullName: data.fullName.present ? data.fullName.value : this.fullName,
      photoUrl: data.photoUrl.present ? data.photoUrl.value : this.photoUrl,
      side: data.side.present ? data.side.value : this.side,
      relationToGrooms: data.relationToGrooms.present
          ? data.relationToGrooms.value
          : this.relationToGrooms,
      relationshipStatus: data.relationshipStatus.present
          ? data.relationshipStatus.value
          : this.relationshipStatus,
      whatsappNumber: data.whatsappNumber.present
          ? data.whatsappNumber.value
          : this.whatsappNumber,
      funFact: data.funFact.present ? data.funFact.value : this.funFact,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedGuest(')
          ..write('uid: $uid, ')
          ..write('fullName: $fullName, ')
          ..write('photoUrl: $photoUrl, ')
          ..write('side: $side, ')
          ..write('relationToGrooms: $relationToGrooms, ')
          ..write('relationshipStatus: $relationshipStatus, ')
          ..write('whatsappNumber: $whatsappNumber, ')
          ..write('funFact: $funFact')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    uid,
    fullName,
    photoUrl,
    side,
    relationToGrooms,
    relationshipStatus,
    whatsappNumber,
    funFact,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedGuest &&
          other.uid == this.uid &&
          other.fullName == this.fullName &&
          other.photoUrl == this.photoUrl &&
          other.side == this.side &&
          other.relationToGrooms == this.relationToGrooms &&
          other.relationshipStatus == this.relationshipStatus &&
          other.whatsappNumber == this.whatsappNumber &&
          other.funFact == this.funFact);
}

class CachedGuestsCompanion extends UpdateCompanion<CachedGuest> {
  final Value<String> uid;
  final Value<String> fullName;
  final Value<String?> photoUrl;
  final Value<String> side;
  final Value<String> relationToGrooms;
  final Value<String> relationshipStatus;
  final Value<String?> whatsappNumber;
  final Value<String?> funFact;
  final Value<int> rowid;
  const CachedGuestsCompanion({
    this.uid = const Value.absent(),
    this.fullName = const Value.absent(),
    this.photoUrl = const Value.absent(),
    this.side = const Value.absent(),
    this.relationToGrooms = const Value.absent(),
    this.relationshipStatus = const Value.absent(),
    this.whatsappNumber = const Value.absent(),
    this.funFact = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedGuestsCompanion.insert({
    required String uid,
    required String fullName,
    this.photoUrl = const Value.absent(),
    required String side,
    required String relationToGrooms,
    required String relationshipStatus,
    this.whatsappNumber = const Value.absent(),
    this.funFact = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : uid = Value(uid),
       fullName = Value(fullName),
       side = Value(side),
       relationToGrooms = Value(relationToGrooms),
       relationshipStatus = Value(relationshipStatus);
  static Insertable<CachedGuest> custom({
    Expression<String>? uid,
    Expression<String>? fullName,
    Expression<String>? photoUrl,
    Expression<String>? side,
    Expression<String>? relationToGrooms,
    Expression<String>? relationshipStatus,
    Expression<String>? whatsappNumber,
    Expression<String>? funFact,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (uid != null) 'uid': uid,
      if (fullName != null) 'full_name': fullName,
      if (photoUrl != null) 'photo_url': photoUrl,
      if (side != null) 'side': side,
      if (relationToGrooms != null) 'relation_to_grooms': relationToGrooms,
      if (relationshipStatus != null) 'relationship_status': relationshipStatus,
      if (whatsappNumber != null) 'whatsapp_number': whatsappNumber,
      if (funFact != null) 'fun_fact': funFact,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedGuestsCompanion copyWith({
    Value<String>? uid,
    Value<String>? fullName,
    Value<String?>? photoUrl,
    Value<String>? side,
    Value<String>? relationToGrooms,
    Value<String>? relationshipStatus,
    Value<String?>? whatsappNumber,
    Value<String?>? funFact,
    Value<int>? rowid,
  }) {
    return CachedGuestsCompanion(
      uid: uid ?? this.uid,
      fullName: fullName ?? this.fullName,
      photoUrl: photoUrl ?? this.photoUrl,
      side: side ?? this.side,
      relationToGrooms: relationToGrooms ?? this.relationToGrooms,
      relationshipStatus: relationshipStatus ?? this.relationshipStatus,
      whatsappNumber: whatsappNumber ?? this.whatsappNumber,
      funFact: funFact ?? this.funFact,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (uid.present) {
      map['uid'] = Variable<String>(uid.value);
    }
    if (fullName.present) {
      map['full_name'] = Variable<String>(fullName.value);
    }
    if (photoUrl.present) {
      map['photo_url'] = Variable<String>(photoUrl.value);
    }
    if (side.present) {
      map['side'] = Variable<String>(side.value);
    }
    if (relationToGrooms.present) {
      map['relation_to_grooms'] = Variable<String>(relationToGrooms.value);
    }
    if (relationshipStatus.present) {
      map['relationship_status'] = Variable<String>(relationshipStatus.value);
    }
    if (whatsappNumber.present) {
      map['whatsapp_number'] = Variable<String>(whatsappNumber.value);
    }
    if (funFact.present) {
      map['fun_fact'] = Variable<String>(funFact.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedGuestsCompanion(')
          ..write('uid: $uid, ')
          ..write('fullName: $fullName, ')
          ..write('photoUrl: $photoUrl, ')
          ..write('side: $side, ')
          ..write('relationToGrooms: $relationToGrooms, ')
          ..write('relationshipStatus: $relationshipStatus, ')
          ..write('whatsappNumber: $whatsappNumber, ')
          ..write('funFact: $funFact, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ExposuresTable extends Exposures
    with TableInfo<$ExposuresTable, Exposure> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ExposuresTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _localPathMeta = const VerificationMeta(
    'localPath',
  );
  @override
  late final GeneratedColumn<String> localPath = GeneratedColumn<String>(
    'local_path',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cloudinaryPublicIdMeta =
      const VerificationMeta('cloudinaryPublicId');
  @override
  late final GeneratedColumn<String> cloudinaryPublicId =
      GeneratedColumn<String>(
        'cloudinary_public_id',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _exposureNumberMeta = const VerificationMeta(
    'exposureNumber',
  );
  @override
  late final GeneratedColumn<int> exposureNumber = GeneratedColumn<int>(
    'exposure_number',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _capturedAtMeta = const VerificationMeta(
    'capturedAt',
  );
  @override
  late final GeneratedColumn<DateTime> capturedAt = GeneratedColumn<DateTime>(
    'captured_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isDevelopedMeta = const VerificationMeta(
    'isDeveloped',
  );
  @override
  late final GeneratedColumn<bool> isDeveloped = GeneratedColumn<bool>(
    'is_developed',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_developed" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _isPublishedMeta = const VerificationMeta(
    'isPublished',
  );
  @override
  late final GeneratedColumn<bool> isPublished = GeneratedColumn<bool>(
    'is_published',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_published" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    localPath,
    cloudinaryPublicId,
    exposureNumber,
    capturedAt,
    isDeveloped,
    isPublished,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'exposures';
  @override
  VerificationContext validateIntegrity(
    Insertable<Exposure> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('local_path')) {
      context.handle(
        _localPathMeta,
        localPath.isAcceptableOrUnknown(data['local_path']!, _localPathMeta),
      );
    } else if (isInserting) {
      context.missing(_localPathMeta);
    }
    if (data.containsKey('cloudinary_public_id')) {
      context.handle(
        _cloudinaryPublicIdMeta,
        cloudinaryPublicId.isAcceptableOrUnknown(
          data['cloudinary_public_id']!,
          _cloudinaryPublicIdMeta,
        ),
      );
    }
    if (data.containsKey('exposure_number')) {
      context.handle(
        _exposureNumberMeta,
        exposureNumber.isAcceptableOrUnknown(
          data['exposure_number']!,
          _exposureNumberMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_exposureNumberMeta);
    }
    if (data.containsKey('captured_at')) {
      context.handle(
        _capturedAtMeta,
        capturedAt.isAcceptableOrUnknown(data['captured_at']!, _capturedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_capturedAtMeta);
    }
    if (data.containsKey('is_developed')) {
      context.handle(
        _isDevelopedMeta,
        isDeveloped.isAcceptableOrUnknown(
          data['is_developed']!,
          _isDevelopedMeta,
        ),
      );
    }
    if (data.containsKey('is_published')) {
      context.handle(
        _isPublishedMeta,
        isPublished.isAcceptableOrUnknown(
          data['is_published']!,
          _isPublishedMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Exposure map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Exposure(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      localPath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}local_path'],
      )!,
      cloudinaryPublicId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cloudinary_public_id'],
      ),
      exposureNumber: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}exposure_number'],
      )!,
      capturedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}captured_at'],
      )!,
      isDeveloped: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_developed'],
      )!,
      isPublished: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_published'],
      )!,
    );
  }

  @override
  $ExposuresTable createAlias(String alias) {
    return $ExposuresTable(attachedDatabase, alias);
  }
}

class Exposure extends DataClass implements Insertable<Exposure> {
  final String id;
  final String localPath;
  final String? cloudinaryPublicId;
  final int exposureNumber;
  final DateTime capturedAt;
  final bool isDeveloped;
  final bool isPublished;
  const Exposure({
    required this.id,
    required this.localPath,
    this.cloudinaryPublicId,
    required this.exposureNumber,
    required this.capturedAt,
    required this.isDeveloped,
    required this.isPublished,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['local_path'] = Variable<String>(localPath);
    if (!nullToAbsent || cloudinaryPublicId != null) {
      map['cloudinary_public_id'] = Variable<String>(cloudinaryPublicId);
    }
    map['exposure_number'] = Variable<int>(exposureNumber);
    map['captured_at'] = Variable<DateTime>(capturedAt);
    map['is_developed'] = Variable<bool>(isDeveloped);
    map['is_published'] = Variable<bool>(isPublished);
    return map;
  }

  ExposuresCompanion toCompanion(bool nullToAbsent) {
    return ExposuresCompanion(
      id: Value(id),
      localPath: Value(localPath),
      cloudinaryPublicId: cloudinaryPublicId == null && nullToAbsent
          ? const Value.absent()
          : Value(cloudinaryPublicId),
      exposureNumber: Value(exposureNumber),
      capturedAt: Value(capturedAt),
      isDeveloped: Value(isDeveloped),
      isPublished: Value(isPublished),
    );
  }

  factory Exposure.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Exposure(
      id: serializer.fromJson<String>(json['id']),
      localPath: serializer.fromJson<String>(json['localPath']),
      cloudinaryPublicId: serializer.fromJson<String?>(
        json['cloudinaryPublicId'],
      ),
      exposureNumber: serializer.fromJson<int>(json['exposureNumber']),
      capturedAt: serializer.fromJson<DateTime>(json['capturedAt']),
      isDeveloped: serializer.fromJson<bool>(json['isDeveloped']),
      isPublished: serializer.fromJson<bool>(json['isPublished']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'localPath': serializer.toJson<String>(localPath),
      'cloudinaryPublicId': serializer.toJson<String?>(cloudinaryPublicId),
      'exposureNumber': serializer.toJson<int>(exposureNumber),
      'capturedAt': serializer.toJson<DateTime>(capturedAt),
      'isDeveloped': serializer.toJson<bool>(isDeveloped),
      'isPublished': serializer.toJson<bool>(isPublished),
    };
  }

  Exposure copyWith({
    String? id,
    String? localPath,
    Value<String?> cloudinaryPublicId = const Value.absent(),
    int? exposureNumber,
    DateTime? capturedAt,
    bool? isDeveloped,
    bool? isPublished,
  }) => Exposure(
    id: id ?? this.id,
    localPath: localPath ?? this.localPath,
    cloudinaryPublicId: cloudinaryPublicId.present
        ? cloudinaryPublicId.value
        : this.cloudinaryPublicId,
    exposureNumber: exposureNumber ?? this.exposureNumber,
    capturedAt: capturedAt ?? this.capturedAt,
    isDeveloped: isDeveloped ?? this.isDeveloped,
    isPublished: isPublished ?? this.isPublished,
  );
  Exposure copyWithCompanion(ExposuresCompanion data) {
    return Exposure(
      id: data.id.present ? data.id.value : this.id,
      localPath: data.localPath.present ? data.localPath.value : this.localPath,
      cloudinaryPublicId: data.cloudinaryPublicId.present
          ? data.cloudinaryPublicId.value
          : this.cloudinaryPublicId,
      exposureNumber: data.exposureNumber.present
          ? data.exposureNumber.value
          : this.exposureNumber,
      capturedAt: data.capturedAt.present
          ? data.capturedAt.value
          : this.capturedAt,
      isDeveloped: data.isDeveloped.present
          ? data.isDeveloped.value
          : this.isDeveloped,
      isPublished: data.isPublished.present
          ? data.isPublished.value
          : this.isPublished,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Exposure(')
          ..write('id: $id, ')
          ..write('localPath: $localPath, ')
          ..write('cloudinaryPublicId: $cloudinaryPublicId, ')
          ..write('exposureNumber: $exposureNumber, ')
          ..write('capturedAt: $capturedAt, ')
          ..write('isDeveloped: $isDeveloped, ')
          ..write('isPublished: $isPublished')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    localPath,
    cloudinaryPublicId,
    exposureNumber,
    capturedAt,
    isDeveloped,
    isPublished,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Exposure &&
          other.id == this.id &&
          other.localPath == this.localPath &&
          other.cloudinaryPublicId == this.cloudinaryPublicId &&
          other.exposureNumber == this.exposureNumber &&
          other.capturedAt == this.capturedAt &&
          other.isDeveloped == this.isDeveloped &&
          other.isPublished == this.isPublished);
}

class ExposuresCompanion extends UpdateCompanion<Exposure> {
  final Value<String> id;
  final Value<String> localPath;
  final Value<String?> cloudinaryPublicId;
  final Value<int> exposureNumber;
  final Value<DateTime> capturedAt;
  final Value<bool> isDeveloped;
  final Value<bool> isPublished;
  final Value<int> rowid;
  const ExposuresCompanion({
    this.id = const Value.absent(),
    this.localPath = const Value.absent(),
    this.cloudinaryPublicId = const Value.absent(),
    this.exposureNumber = const Value.absent(),
    this.capturedAt = const Value.absent(),
    this.isDeveloped = const Value.absent(),
    this.isPublished = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ExposuresCompanion.insert({
    required String id,
    required String localPath,
    this.cloudinaryPublicId = const Value.absent(),
    required int exposureNumber,
    required DateTime capturedAt,
    this.isDeveloped = const Value.absent(),
    this.isPublished = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       localPath = Value(localPath),
       exposureNumber = Value(exposureNumber),
       capturedAt = Value(capturedAt);
  static Insertable<Exposure> custom({
    Expression<String>? id,
    Expression<String>? localPath,
    Expression<String>? cloudinaryPublicId,
    Expression<int>? exposureNumber,
    Expression<DateTime>? capturedAt,
    Expression<bool>? isDeveloped,
    Expression<bool>? isPublished,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (localPath != null) 'local_path': localPath,
      if (cloudinaryPublicId != null)
        'cloudinary_public_id': cloudinaryPublicId,
      if (exposureNumber != null) 'exposure_number': exposureNumber,
      if (capturedAt != null) 'captured_at': capturedAt,
      if (isDeveloped != null) 'is_developed': isDeveloped,
      if (isPublished != null) 'is_published': isPublished,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ExposuresCompanion copyWith({
    Value<String>? id,
    Value<String>? localPath,
    Value<String?>? cloudinaryPublicId,
    Value<int>? exposureNumber,
    Value<DateTime>? capturedAt,
    Value<bool>? isDeveloped,
    Value<bool>? isPublished,
    Value<int>? rowid,
  }) {
    return ExposuresCompanion(
      id: id ?? this.id,
      localPath: localPath ?? this.localPath,
      cloudinaryPublicId: cloudinaryPublicId ?? this.cloudinaryPublicId,
      exposureNumber: exposureNumber ?? this.exposureNumber,
      capturedAt: capturedAt ?? this.capturedAt,
      isDeveloped: isDeveloped ?? this.isDeveloped,
      isPublished: isPublished ?? this.isPublished,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (localPath.present) {
      map['local_path'] = Variable<String>(localPath.value);
    }
    if (cloudinaryPublicId.present) {
      map['cloudinary_public_id'] = Variable<String>(cloudinaryPublicId.value);
    }
    if (exposureNumber.present) {
      map['exposure_number'] = Variable<int>(exposureNumber.value);
    }
    if (capturedAt.present) {
      map['captured_at'] = Variable<DateTime>(capturedAt.value);
    }
    if (isDeveloped.present) {
      map['is_developed'] = Variable<bool>(isDeveloped.value);
    }
    if (isPublished.present) {
      map['is_published'] = Variable<bool>(isPublished.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ExposuresCompanion(')
          ..write('id: $id, ')
          ..write('localPath: $localPath, ')
          ..write('cloudinaryPublicId: $cloudinaryPublicId, ')
          ..write('exposureNumber: $exposureNumber, ')
          ..write('capturedAt: $capturedAt, ')
          ..write('isDeveloped: $isDeveloped, ')
          ..write('isPublished: $isPublished, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $PendingWritesTable extends PendingWrites
    with TableInfo<$PendingWritesTable, PendingWrite> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PendingWritesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _collectionMeta = const VerificationMeta(
    'collection',
  );
  @override
  late final GeneratedColumn<String> collection = GeneratedColumn<String>(
    'collection',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _documentIdMeta = const VerificationMeta(
    'documentId',
  );
  @override
  late final GeneratedColumn<String> documentId = GeneratedColumn<String>(
    'document_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _operationMeta = const VerificationMeta(
    'operation',
  );
  @override
  late final GeneratedColumn<String> operation = GeneratedColumn<String>(
    'operation',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    collection,
    documentId,
    payload,
    operation,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'pending_writes';
  @override
  VerificationContext validateIntegrity(
    Insertable<PendingWrite> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('collection')) {
      context.handle(
        _collectionMeta,
        collection.isAcceptableOrUnknown(data['collection']!, _collectionMeta),
      );
    } else if (isInserting) {
      context.missing(_collectionMeta);
    }
    if (data.containsKey('document_id')) {
      context.handle(
        _documentIdMeta,
        documentId.isAcceptableOrUnknown(data['document_id']!, _documentIdMeta),
      );
    } else if (isInserting) {
      context.missing(_documentIdMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('operation')) {
      context.handle(
        _operationMeta,
        operation.isAcceptableOrUnknown(data['operation']!, _operationMeta),
      );
    } else if (isInserting) {
      context.missing(_operationMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  PendingWrite map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return PendingWrite(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      collection: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}collection'],
      )!,
      documentId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}document_id'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
      operation: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}operation'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $PendingWritesTable createAlias(String alias) {
    return $PendingWritesTable(attachedDatabase, alias);
  }
}

class PendingWrite extends DataClass implements Insertable<PendingWrite> {
  final int id;
  final String collection;
  final String documentId;
  final String payload;
  final String operation;
  final DateTime createdAt;
  const PendingWrite({
    required this.id,
    required this.collection,
    required this.documentId,
    required this.payload,
    required this.operation,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['collection'] = Variable<String>(collection);
    map['document_id'] = Variable<String>(documentId);
    map['payload'] = Variable<String>(payload);
    map['operation'] = Variable<String>(operation);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  PendingWritesCompanion toCompanion(bool nullToAbsent) {
    return PendingWritesCompanion(
      id: Value(id),
      collection: Value(collection),
      documentId: Value(documentId),
      payload: Value(payload),
      operation: Value(operation),
      createdAt: Value(createdAt),
    );
  }

  factory PendingWrite.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return PendingWrite(
      id: serializer.fromJson<int>(json['id']),
      collection: serializer.fromJson<String>(json['collection']),
      documentId: serializer.fromJson<String>(json['documentId']),
      payload: serializer.fromJson<String>(json['payload']),
      operation: serializer.fromJson<String>(json['operation']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'collection': serializer.toJson<String>(collection),
      'documentId': serializer.toJson<String>(documentId),
      'payload': serializer.toJson<String>(payload),
      'operation': serializer.toJson<String>(operation),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  PendingWrite copyWith({
    int? id,
    String? collection,
    String? documentId,
    String? payload,
    String? operation,
    DateTime? createdAt,
  }) => PendingWrite(
    id: id ?? this.id,
    collection: collection ?? this.collection,
    documentId: documentId ?? this.documentId,
    payload: payload ?? this.payload,
    operation: operation ?? this.operation,
    createdAt: createdAt ?? this.createdAt,
  );
  PendingWrite copyWithCompanion(PendingWritesCompanion data) {
    return PendingWrite(
      id: data.id.present ? data.id.value : this.id,
      collection: data.collection.present
          ? data.collection.value
          : this.collection,
      documentId: data.documentId.present
          ? data.documentId.value
          : this.documentId,
      payload: data.payload.present ? data.payload.value : this.payload,
      operation: data.operation.present ? data.operation.value : this.operation,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PendingWrite(')
          ..write('id: $id, ')
          ..write('collection: $collection, ')
          ..write('documentId: $documentId, ')
          ..write('payload: $payload, ')
          ..write('operation: $operation, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, collection, documentId, payload, operation, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is PendingWrite &&
          other.id == this.id &&
          other.collection == this.collection &&
          other.documentId == this.documentId &&
          other.payload == this.payload &&
          other.operation == this.operation &&
          other.createdAt == this.createdAt);
}

class PendingWritesCompanion extends UpdateCompanion<PendingWrite> {
  final Value<int> id;
  final Value<String> collection;
  final Value<String> documentId;
  final Value<String> payload;
  final Value<String> operation;
  final Value<DateTime> createdAt;
  const PendingWritesCompanion({
    this.id = const Value.absent(),
    this.collection = const Value.absent(),
    this.documentId = const Value.absent(),
    this.payload = const Value.absent(),
    this.operation = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  PendingWritesCompanion.insert({
    this.id = const Value.absent(),
    required String collection,
    required String documentId,
    required String payload,
    required String operation,
    required DateTime createdAt,
  }) : collection = Value(collection),
       documentId = Value(documentId),
       payload = Value(payload),
       operation = Value(operation),
       createdAt = Value(createdAt);
  static Insertable<PendingWrite> custom({
    Expression<int>? id,
    Expression<String>? collection,
    Expression<String>? documentId,
    Expression<String>? payload,
    Expression<String>? operation,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (collection != null) 'collection': collection,
      if (documentId != null) 'document_id': documentId,
      if (payload != null) 'payload': payload,
      if (operation != null) 'operation': operation,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  PendingWritesCompanion copyWith({
    Value<int>? id,
    Value<String>? collection,
    Value<String>? documentId,
    Value<String>? payload,
    Value<String>? operation,
    Value<DateTime>? createdAt,
  }) {
    return PendingWritesCompanion(
      id: id ?? this.id,
      collection: collection ?? this.collection,
      documentId: documentId ?? this.documentId,
      payload: payload ?? this.payload,
      operation: operation ?? this.operation,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (collection.present) {
      map['collection'] = Variable<String>(collection.value);
    }
    if (documentId.present) {
      map['document_id'] = Variable<String>(documentId.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (operation.present) {
      map['operation'] = Variable<String>(operation.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PendingWritesCompanion(')
          ..write('id: $id, ')
          ..write('collection: $collection, ')
          ..write('documentId: $documentId, ')
          ..write('payload: $payload, ')
          ..write('operation: $operation, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

class $TimeGatesTable extends TimeGates
    with TableInfo<$TimeGatesTable, TimeGate> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TimeGatesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _contentTypeMeta = const VerificationMeta(
    'contentType',
  );
  @override
  late final GeneratedColumn<String> contentType = GeneratedColumn<String>(
    'content_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _unlockAtMeta = const VerificationMeta(
    'unlockAt',
  );
  @override
  late final GeneratedColumn<DateTime> unlockAt = GeneratedColumn<DateTime>(
    'unlock_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [id, contentType, title, unlockAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'time_gates';
  @override
  VerificationContext validateIntegrity(
    Insertable<TimeGate> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('content_type')) {
      context.handle(
        _contentTypeMeta,
        contentType.isAcceptableOrUnknown(
          data['content_type']!,
          _contentTypeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_contentTypeMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('unlock_at')) {
      context.handle(
        _unlockAtMeta,
        unlockAt.isAcceptableOrUnknown(data['unlock_at']!, _unlockAtMeta),
      );
    } else if (isInserting) {
      context.missing(_unlockAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  TimeGate map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return TimeGate(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      contentType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}content_type'],
      )!,
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      )!,
      unlockAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}unlock_at'],
      )!,
    );
  }

  @override
  $TimeGatesTable createAlias(String alias) {
    return $TimeGatesTable(attachedDatabase, alias);
  }
}

class TimeGate extends DataClass implements Insertable<TimeGate> {
  final String id;
  final String contentType;
  final String title;
  final DateTime unlockAt;
  const TimeGate({
    required this.id,
    required this.contentType,
    required this.title,
    required this.unlockAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['content_type'] = Variable<String>(contentType);
    map['title'] = Variable<String>(title);
    map['unlock_at'] = Variable<DateTime>(unlockAt);
    return map;
  }

  TimeGatesCompanion toCompanion(bool nullToAbsent) {
    return TimeGatesCompanion(
      id: Value(id),
      contentType: Value(contentType),
      title: Value(title),
      unlockAt: Value(unlockAt),
    );
  }

  factory TimeGate.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return TimeGate(
      id: serializer.fromJson<String>(json['id']),
      contentType: serializer.fromJson<String>(json['contentType']),
      title: serializer.fromJson<String>(json['title']),
      unlockAt: serializer.fromJson<DateTime>(json['unlockAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'contentType': serializer.toJson<String>(contentType),
      'title': serializer.toJson<String>(title),
      'unlockAt': serializer.toJson<DateTime>(unlockAt),
    };
  }

  TimeGate copyWith({
    String? id,
    String? contentType,
    String? title,
    DateTime? unlockAt,
  }) => TimeGate(
    id: id ?? this.id,
    contentType: contentType ?? this.contentType,
    title: title ?? this.title,
    unlockAt: unlockAt ?? this.unlockAt,
  );
  TimeGate copyWithCompanion(TimeGatesCompanion data) {
    return TimeGate(
      id: data.id.present ? data.id.value : this.id,
      contentType: data.contentType.present
          ? data.contentType.value
          : this.contentType,
      title: data.title.present ? data.title.value : this.title,
      unlockAt: data.unlockAt.present ? data.unlockAt.value : this.unlockAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('TimeGate(')
          ..write('id: $id, ')
          ..write('contentType: $contentType, ')
          ..write('title: $title, ')
          ..write('unlockAt: $unlockAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, contentType, title, unlockAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is TimeGate &&
          other.id == this.id &&
          other.contentType == this.contentType &&
          other.title == this.title &&
          other.unlockAt == this.unlockAt);
}

class TimeGatesCompanion extends UpdateCompanion<TimeGate> {
  final Value<String> id;
  final Value<String> contentType;
  final Value<String> title;
  final Value<DateTime> unlockAt;
  final Value<int> rowid;
  const TimeGatesCompanion({
    this.id = const Value.absent(),
    this.contentType = const Value.absent(),
    this.title = const Value.absent(),
    this.unlockAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  TimeGatesCompanion.insert({
    required String id,
    required String contentType,
    required String title,
    required DateTime unlockAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       contentType = Value(contentType),
       title = Value(title),
       unlockAt = Value(unlockAt);
  static Insertable<TimeGate> custom({
    Expression<String>? id,
    Expression<String>? contentType,
    Expression<String>? title,
    Expression<DateTime>? unlockAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (contentType != null) 'content_type': contentType,
      if (title != null) 'title': title,
      if (unlockAt != null) 'unlock_at': unlockAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  TimeGatesCompanion copyWith({
    Value<String>? id,
    Value<String>? contentType,
    Value<String>? title,
    Value<DateTime>? unlockAt,
    Value<int>? rowid,
  }) {
    return TimeGatesCompanion(
      id: id ?? this.id,
      contentType: contentType ?? this.contentType,
      title: title ?? this.title,
      unlockAt: unlockAt ?? this.unlockAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (contentType.present) {
      map['content_type'] = Variable<String>(contentType.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (unlockAt.present) {
      map['unlock_at'] = Variable<DateTime>(unlockAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TimeGatesCompanion(')
          ..write('id: $id, ')
          ..write('contentType: $contentType, ')
          ..write('title: $title, ')
          ..write('unlockAt: $unlockAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SeatingAssignmentsTable extends SeatingAssignments
    with TableInfo<$SeatingAssignmentsTable, SeatingAssignmentRow> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SeatingAssignmentsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _guestIdMeta = const VerificationMeta(
    'guestId',
  );
  @override
  late final GeneratedColumn<String> guestId = GeneratedColumn<String>(
    'guest_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _guestNameMeta = const VerificationMeta(
    'guestName',
  );
  @override
  late final GeneratedColumn<String> guestName = GeneratedColumn<String>(
    'guest_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _assignedTableMeta = const VerificationMeta(
    'assignedTable',
  );
  @override
  late final GeneratedColumn<String> assignedTable = GeneratedColumn<String>(
    'assigned_table',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _seatNumberMeta = const VerificationMeta(
    'seatNumber',
  );
  @override
  late final GeneratedColumn<int> seatNumber = GeneratedColumn<int>(
    'seat_number',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    guestId,
    guestName,
    assignedTable,
    seatNumber,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'seating_assignments';
  @override
  VerificationContext validateIntegrity(
    Insertable<SeatingAssignmentRow> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('guest_id')) {
      context.handle(
        _guestIdMeta,
        guestId.isAcceptableOrUnknown(data['guest_id']!, _guestIdMeta),
      );
    } else if (isInserting) {
      context.missing(_guestIdMeta);
    }
    if (data.containsKey('guest_name')) {
      context.handle(
        _guestNameMeta,
        guestName.isAcceptableOrUnknown(data['guest_name']!, _guestNameMeta),
      );
    } else if (isInserting) {
      context.missing(_guestNameMeta);
    }
    if (data.containsKey('assigned_table')) {
      context.handle(
        _assignedTableMeta,
        assignedTable.isAcceptableOrUnknown(
          data['assigned_table']!,
          _assignedTableMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_assignedTableMeta);
    }
    if (data.containsKey('seat_number')) {
      context.handle(
        _seatNumberMeta,
        seatNumber.isAcceptableOrUnknown(data['seat_number']!, _seatNumberMeta),
      );
    } else if (isInserting) {
      context.missing(_seatNumberMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {guestId};
  @override
  SeatingAssignmentRow map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SeatingAssignmentRow(
      guestId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}guest_id'],
      )!,
      guestName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}guest_name'],
      )!,
      assignedTable: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}assigned_table'],
      )!,
      seatNumber: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}seat_number'],
      )!,
    );
  }

  @override
  $SeatingAssignmentsTable createAlias(String alias) {
    return $SeatingAssignmentsTable(attachedDatabase, alias);
  }
}

class SeatingAssignmentRow extends DataClass
    implements Insertable<SeatingAssignmentRow> {
  final String guestId;
  final String guestName;
  final String assignedTable;
  final int seatNumber;
  const SeatingAssignmentRow({
    required this.guestId,
    required this.guestName,
    required this.assignedTable,
    required this.seatNumber,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['guest_id'] = Variable<String>(guestId);
    map['guest_name'] = Variable<String>(guestName);
    map['assigned_table'] = Variable<String>(assignedTable);
    map['seat_number'] = Variable<int>(seatNumber);
    return map;
  }

  SeatingAssignmentsCompanion toCompanion(bool nullToAbsent) {
    return SeatingAssignmentsCompanion(
      guestId: Value(guestId),
      guestName: Value(guestName),
      assignedTable: Value(assignedTable),
      seatNumber: Value(seatNumber),
    );
  }

  factory SeatingAssignmentRow.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SeatingAssignmentRow(
      guestId: serializer.fromJson<String>(json['guestId']),
      guestName: serializer.fromJson<String>(json['guestName']),
      assignedTable: serializer.fromJson<String>(json['assignedTable']),
      seatNumber: serializer.fromJson<int>(json['seatNumber']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'guestId': serializer.toJson<String>(guestId),
      'guestName': serializer.toJson<String>(guestName),
      'assignedTable': serializer.toJson<String>(assignedTable),
      'seatNumber': serializer.toJson<int>(seatNumber),
    };
  }

  SeatingAssignmentRow copyWith({
    String? guestId,
    String? guestName,
    String? assignedTable,
    int? seatNumber,
  }) => SeatingAssignmentRow(
    guestId: guestId ?? this.guestId,
    guestName: guestName ?? this.guestName,
    assignedTable: assignedTable ?? this.assignedTable,
    seatNumber: seatNumber ?? this.seatNumber,
  );
  SeatingAssignmentRow copyWithCompanion(SeatingAssignmentsCompanion data) {
    return SeatingAssignmentRow(
      guestId: data.guestId.present ? data.guestId.value : this.guestId,
      guestName: data.guestName.present ? data.guestName.value : this.guestName,
      assignedTable: data.assignedTable.present
          ? data.assignedTable.value
          : this.assignedTable,
      seatNumber: data.seatNumber.present
          ? data.seatNumber.value
          : this.seatNumber,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SeatingAssignmentRow(')
          ..write('guestId: $guestId, ')
          ..write('guestName: $guestName, ')
          ..write('assignedTable: $assignedTable, ')
          ..write('seatNumber: $seatNumber')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(guestId, guestName, assignedTable, seatNumber);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SeatingAssignmentRow &&
          other.guestId == this.guestId &&
          other.guestName == this.guestName &&
          other.assignedTable == this.assignedTable &&
          other.seatNumber == this.seatNumber);
}

class SeatingAssignmentsCompanion
    extends UpdateCompanion<SeatingAssignmentRow> {
  final Value<String> guestId;
  final Value<String> guestName;
  final Value<String> assignedTable;
  final Value<int> seatNumber;
  final Value<int> rowid;
  const SeatingAssignmentsCompanion({
    this.guestId = const Value.absent(),
    this.guestName = const Value.absent(),
    this.assignedTable = const Value.absent(),
    this.seatNumber = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SeatingAssignmentsCompanion.insert({
    required String guestId,
    required String guestName,
    required String assignedTable,
    required int seatNumber,
    this.rowid = const Value.absent(),
  }) : guestId = Value(guestId),
       guestName = Value(guestName),
       assignedTable = Value(assignedTable),
       seatNumber = Value(seatNumber);
  static Insertable<SeatingAssignmentRow> custom({
    Expression<String>? guestId,
    Expression<String>? guestName,
    Expression<String>? assignedTable,
    Expression<int>? seatNumber,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (guestId != null) 'guest_id': guestId,
      if (guestName != null) 'guest_name': guestName,
      if (assignedTable != null) 'assigned_table': assignedTable,
      if (seatNumber != null) 'seat_number': seatNumber,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SeatingAssignmentsCompanion copyWith({
    Value<String>? guestId,
    Value<String>? guestName,
    Value<String>? assignedTable,
    Value<int>? seatNumber,
    Value<int>? rowid,
  }) {
    return SeatingAssignmentsCompanion(
      guestId: guestId ?? this.guestId,
      guestName: guestName ?? this.guestName,
      assignedTable: assignedTable ?? this.assignedTable,
      seatNumber: seatNumber ?? this.seatNumber,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (guestId.present) {
      map['guest_id'] = Variable<String>(guestId.value);
    }
    if (guestName.present) {
      map['guest_name'] = Variable<String>(guestName.value);
    }
    if (assignedTable.present) {
      map['assigned_table'] = Variable<String>(assignedTable.value);
    }
    if (seatNumber.present) {
      map['seat_number'] = Variable<int>(seatNumber.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SeatingAssignmentsCompanion(')
          ..write('guestId: $guestId, ')
          ..write('guestName: $guestName, ')
          ..write('assignedTable: $assignedTable, ')
          ..write('seatNumber: $seatNumber, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ConfigCacheTable extends ConfigCache
    with TableInfo<$ConfigCacheTable, ConfigCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ConfigCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<String> value = GeneratedColumn<String>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [key, value, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'config_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<ConfigCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  ConfigCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ConfigCacheData(
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}value'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $ConfigCacheTable createAlias(String alias) {
    return $ConfigCacheTable(attachedDatabase, alias);
  }
}

class ConfigCacheData extends DataClass implements Insertable<ConfigCacheData> {
  final String key;
  final String value;
  final DateTime updatedAt;
  const ConfigCacheData({
    required this.key,
    required this.value,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    map['value'] = Variable<String>(value);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  ConfigCacheCompanion toCompanion(bool nullToAbsent) {
    return ConfigCacheCompanion(
      key: Value(key),
      value: Value(value),
      updatedAt: Value(updatedAt),
    );
  }

  factory ConfigCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ConfigCacheData(
      key: serializer.fromJson<String>(json['key']),
      value: serializer.fromJson<String>(json['value']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'value': serializer.toJson<String>(value),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  ConfigCacheData copyWith({String? key, String? value, DateTime? updatedAt}) =>
      ConfigCacheData(
        key: key ?? this.key,
        value: value ?? this.value,
        updatedAt: updatedAt ?? this.updatedAt,
      );
  ConfigCacheData copyWithCompanion(ConfigCacheCompanion data) {
    return ConfigCacheData(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ConfigCacheData(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, value, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ConfigCacheData &&
          other.key == this.key &&
          other.value == this.value &&
          other.updatedAt == this.updatedAt);
}

class ConfigCacheCompanion extends UpdateCompanion<ConfigCacheData> {
  final Value<String> key;
  final Value<String> value;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const ConfigCacheCompanion({
    this.key = const Value.absent(),
    this.value = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ConfigCacheCompanion.insert({
    required String key,
    required String value,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : key = Value(key),
       value = Value(value),
       updatedAt = Value(updatedAt);
  static Insertable<ConfigCacheData> custom({
    Expression<String>? key,
    Expression<String>? value,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ConfigCacheCompanion copyWith({
    Value<String>? key,
    Value<String>? value,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return ConfigCacheCompanion(
      key: key ?? this.key,
      value: value ?? this.value,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (value.present) {
      map['value'] = Variable<String>(value.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ConfigCacheCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $EventSchedulesTable eventSchedules = $EventSchedulesTable(this);
  late final $VenuesTable venues = $VenuesTable(this);
  late final $CachedGuestsTable cachedGuests = $CachedGuestsTable(this);
  late final $ExposuresTable exposures = $ExposuresTable(this);
  late final $PendingWritesTable pendingWrites = $PendingWritesTable(this);
  late final $TimeGatesTable timeGates = $TimeGatesTable(this);
  late final $SeatingAssignmentsTable seatingAssignments =
      $SeatingAssignmentsTable(this);
  late final $ConfigCacheTable configCache = $ConfigCacheTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    eventSchedules,
    venues,
    cachedGuests,
    exposures,
    pendingWrites,
    timeGates,
    seatingAssignments,
    configCache,
  ];
}

typedef $$EventSchedulesTableCreateCompanionBuilder =
    EventSchedulesCompanion Function({
      required String id,
      required String title,
      required String description,
      required DateTime startTime,
      required DateTime endTime,
      required String venueId,
      Value<String?> ctaLabel,
      Value<String?> ctaDeepLink,
      required int dayNumber,
      Value<int> rowid,
    });
typedef $$EventSchedulesTableUpdateCompanionBuilder =
    EventSchedulesCompanion Function({
      Value<String> id,
      Value<String> title,
      Value<String> description,
      Value<DateTime> startTime,
      Value<DateTime> endTime,
      Value<String> venueId,
      Value<String?> ctaLabel,
      Value<String?> ctaDeepLink,
      Value<int> dayNumber,
      Value<int> rowid,
    });

class $$EventSchedulesTableFilterComposer
    extends Composer<_$AppDatabase, $EventSchedulesTable> {
  $$EventSchedulesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get startTime => $composableBuilder(
    column: $table.startTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get endTime => $composableBuilder(
    column: $table.endTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get venueId => $composableBuilder(
    column: $table.venueId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get ctaLabel => $composableBuilder(
    column: $table.ctaLabel,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get ctaDeepLink => $composableBuilder(
    column: $table.ctaDeepLink,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get dayNumber => $composableBuilder(
    column: $table.dayNumber,
    builder: (column) => ColumnFilters(column),
  );
}

class $$EventSchedulesTableOrderingComposer
    extends Composer<_$AppDatabase, $EventSchedulesTable> {
  $$EventSchedulesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get startTime => $composableBuilder(
    column: $table.startTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get endTime => $composableBuilder(
    column: $table.endTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get venueId => $composableBuilder(
    column: $table.venueId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get ctaLabel => $composableBuilder(
    column: $table.ctaLabel,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get ctaDeepLink => $composableBuilder(
    column: $table.ctaDeepLink,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get dayNumber => $composableBuilder(
    column: $table.dayNumber,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$EventSchedulesTableAnnotationComposer
    extends Composer<_$AppDatabase, $EventSchedulesTable> {
  $$EventSchedulesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get startTime =>
      $composableBuilder(column: $table.startTime, builder: (column) => column);

  GeneratedColumn<DateTime> get endTime =>
      $composableBuilder(column: $table.endTime, builder: (column) => column);

  GeneratedColumn<String> get venueId =>
      $composableBuilder(column: $table.venueId, builder: (column) => column);

  GeneratedColumn<String> get ctaLabel =>
      $composableBuilder(column: $table.ctaLabel, builder: (column) => column);

  GeneratedColumn<String> get ctaDeepLink => $composableBuilder(
    column: $table.ctaDeepLink,
    builder: (column) => column,
  );

  GeneratedColumn<int> get dayNumber =>
      $composableBuilder(column: $table.dayNumber, builder: (column) => column);
}

class $$EventSchedulesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $EventSchedulesTable,
          EventScheduleRow,
          $$EventSchedulesTableFilterComposer,
          $$EventSchedulesTableOrderingComposer,
          $$EventSchedulesTableAnnotationComposer,
          $$EventSchedulesTableCreateCompanionBuilder,
          $$EventSchedulesTableUpdateCompanionBuilder,
          (
            EventScheduleRow,
            BaseReferences<
              _$AppDatabase,
              $EventSchedulesTable,
              EventScheduleRow
            >,
          ),
          EventScheduleRow,
          PrefetchHooks Function()
        > {
  $$EventSchedulesTableTableManager(
    _$AppDatabase db,
    $EventSchedulesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$EventSchedulesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$EventSchedulesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$EventSchedulesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> title = const Value.absent(),
                Value<String> description = const Value.absent(),
                Value<DateTime> startTime = const Value.absent(),
                Value<DateTime> endTime = const Value.absent(),
                Value<String> venueId = const Value.absent(),
                Value<String?> ctaLabel = const Value.absent(),
                Value<String?> ctaDeepLink = const Value.absent(),
                Value<int> dayNumber = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => EventSchedulesCompanion(
                id: id,
                title: title,
                description: description,
                startTime: startTime,
                endTime: endTime,
                venueId: venueId,
                ctaLabel: ctaLabel,
                ctaDeepLink: ctaDeepLink,
                dayNumber: dayNumber,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String title,
                required String description,
                required DateTime startTime,
                required DateTime endTime,
                required String venueId,
                Value<String?> ctaLabel = const Value.absent(),
                Value<String?> ctaDeepLink = const Value.absent(),
                required int dayNumber,
                Value<int> rowid = const Value.absent(),
              }) => EventSchedulesCompanion.insert(
                id: id,
                title: title,
                description: description,
                startTime: startTime,
                endTime: endTime,
                venueId: venueId,
                ctaLabel: ctaLabel,
                ctaDeepLink: ctaDeepLink,
                dayNumber: dayNumber,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$EventSchedulesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $EventSchedulesTable,
      EventScheduleRow,
      $$EventSchedulesTableFilterComposer,
      $$EventSchedulesTableOrderingComposer,
      $$EventSchedulesTableAnnotationComposer,
      $$EventSchedulesTableCreateCompanionBuilder,
      $$EventSchedulesTableUpdateCompanionBuilder,
      (
        EventScheduleRow,
        BaseReferences<_$AppDatabase, $EventSchedulesTable, EventScheduleRow>,
      ),
      EventScheduleRow,
      PrefetchHooks Function()
    >;
typedef $$VenuesTableCreateCompanionBuilder =
    VenuesCompanion Function({
      required String id,
      required String name,
      required double latitude,
      required double longitude,
      Value<String?> walkingDirections,
      Value<String?> terrainNote,
      Value<int> rowid,
    });
typedef $$VenuesTableUpdateCompanionBuilder =
    VenuesCompanion Function({
      Value<String> id,
      Value<String> name,
      Value<double> latitude,
      Value<double> longitude,
      Value<String?> walkingDirections,
      Value<String?> terrainNote,
      Value<int> rowid,
    });

class $$VenuesTableFilterComposer
    extends Composer<_$AppDatabase, $VenuesTable> {
  $$VenuesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get walkingDirections => $composableBuilder(
    column: $table.walkingDirections,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get terrainNote => $composableBuilder(
    column: $table.terrainNote,
    builder: (column) => ColumnFilters(column),
  );
}

class $$VenuesTableOrderingComposer
    extends Composer<_$AppDatabase, $VenuesTable> {
  $$VenuesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get walkingDirections => $composableBuilder(
    column: $table.walkingDirections,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get terrainNote => $composableBuilder(
    column: $table.terrainNote,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$VenuesTableAnnotationComposer
    extends Composer<_$AppDatabase, $VenuesTable> {
  $$VenuesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<double> get latitude =>
      $composableBuilder(column: $table.latitude, builder: (column) => column);

  GeneratedColumn<double> get longitude =>
      $composableBuilder(column: $table.longitude, builder: (column) => column);

  GeneratedColumn<String> get walkingDirections => $composableBuilder(
    column: $table.walkingDirections,
    builder: (column) => column,
  );

  GeneratedColumn<String> get terrainNote => $composableBuilder(
    column: $table.terrainNote,
    builder: (column) => column,
  );
}

class $$VenuesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $VenuesTable,
          VenueRow,
          $$VenuesTableFilterComposer,
          $$VenuesTableOrderingComposer,
          $$VenuesTableAnnotationComposer,
          $$VenuesTableCreateCompanionBuilder,
          $$VenuesTableUpdateCompanionBuilder,
          (VenueRow, BaseReferences<_$AppDatabase, $VenuesTable, VenueRow>),
          VenueRow,
          PrefetchHooks Function()
        > {
  $$VenuesTableTableManager(_$AppDatabase db, $VenuesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$VenuesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$VenuesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$VenuesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<double> latitude = const Value.absent(),
                Value<double> longitude = const Value.absent(),
                Value<String?> walkingDirections = const Value.absent(),
                Value<String?> terrainNote = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => VenuesCompanion(
                id: id,
                name: name,
                latitude: latitude,
                longitude: longitude,
                walkingDirections: walkingDirections,
                terrainNote: terrainNote,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String name,
                required double latitude,
                required double longitude,
                Value<String?> walkingDirections = const Value.absent(),
                Value<String?> terrainNote = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => VenuesCompanion.insert(
                id: id,
                name: name,
                latitude: latitude,
                longitude: longitude,
                walkingDirections: walkingDirections,
                terrainNote: terrainNote,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$VenuesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $VenuesTable,
      VenueRow,
      $$VenuesTableFilterComposer,
      $$VenuesTableOrderingComposer,
      $$VenuesTableAnnotationComposer,
      $$VenuesTableCreateCompanionBuilder,
      $$VenuesTableUpdateCompanionBuilder,
      (VenueRow, BaseReferences<_$AppDatabase, $VenuesTable, VenueRow>),
      VenueRow,
      PrefetchHooks Function()
    >;
typedef $$CachedGuestsTableCreateCompanionBuilder =
    CachedGuestsCompanion Function({
      required String uid,
      required String fullName,
      Value<String?> photoUrl,
      required String side,
      required String relationToGrooms,
      required String relationshipStatus,
      Value<String?> whatsappNumber,
      Value<String?> funFact,
      Value<int> rowid,
    });
typedef $$CachedGuestsTableUpdateCompanionBuilder =
    CachedGuestsCompanion Function({
      Value<String> uid,
      Value<String> fullName,
      Value<String?> photoUrl,
      Value<String> side,
      Value<String> relationToGrooms,
      Value<String> relationshipStatus,
      Value<String?> whatsappNumber,
      Value<String?> funFact,
      Value<int> rowid,
    });

class $$CachedGuestsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedGuestsTable> {
  $$CachedGuestsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get uid => $composableBuilder(
    column: $table.uid,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get fullName => $composableBuilder(
    column: $table.fullName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get photoUrl => $composableBuilder(
    column: $table.photoUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get side => $composableBuilder(
    column: $table.side,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get relationToGrooms => $composableBuilder(
    column: $table.relationToGrooms,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get relationshipStatus => $composableBuilder(
    column: $table.relationshipStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get whatsappNumber => $composableBuilder(
    column: $table.whatsappNumber,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get funFact => $composableBuilder(
    column: $table.funFact,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedGuestsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedGuestsTable> {
  $$CachedGuestsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get uid => $composableBuilder(
    column: $table.uid,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get fullName => $composableBuilder(
    column: $table.fullName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get photoUrl => $composableBuilder(
    column: $table.photoUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get side => $composableBuilder(
    column: $table.side,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get relationToGrooms => $composableBuilder(
    column: $table.relationToGrooms,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get relationshipStatus => $composableBuilder(
    column: $table.relationshipStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get whatsappNumber => $composableBuilder(
    column: $table.whatsappNumber,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get funFact => $composableBuilder(
    column: $table.funFact,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedGuestsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedGuestsTable> {
  $$CachedGuestsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get uid =>
      $composableBuilder(column: $table.uid, builder: (column) => column);

  GeneratedColumn<String> get fullName =>
      $composableBuilder(column: $table.fullName, builder: (column) => column);

  GeneratedColumn<String> get photoUrl =>
      $composableBuilder(column: $table.photoUrl, builder: (column) => column);

  GeneratedColumn<String> get side =>
      $composableBuilder(column: $table.side, builder: (column) => column);

  GeneratedColumn<String> get relationToGrooms => $composableBuilder(
    column: $table.relationToGrooms,
    builder: (column) => column,
  );

  GeneratedColumn<String> get relationshipStatus => $composableBuilder(
    column: $table.relationshipStatus,
    builder: (column) => column,
  );

  GeneratedColumn<String> get whatsappNumber => $composableBuilder(
    column: $table.whatsappNumber,
    builder: (column) => column,
  );

  GeneratedColumn<String> get funFact =>
      $composableBuilder(column: $table.funFact, builder: (column) => column);
}

class $$CachedGuestsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedGuestsTable,
          CachedGuest,
          $$CachedGuestsTableFilterComposer,
          $$CachedGuestsTableOrderingComposer,
          $$CachedGuestsTableAnnotationComposer,
          $$CachedGuestsTableCreateCompanionBuilder,
          $$CachedGuestsTableUpdateCompanionBuilder,
          (
            CachedGuest,
            BaseReferences<_$AppDatabase, $CachedGuestsTable, CachedGuest>,
          ),
          CachedGuest,
          PrefetchHooks Function()
        > {
  $$CachedGuestsTableTableManager(_$AppDatabase db, $CachedGuestsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedGuestsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedGuestsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedGuestsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> uid = const Value.absent(),
                Value<String> fullName = const Value.absent(),
                Value<String?> photoUrl = const Value.absent(),
                Value<String> side = const Value.absent(),
                Value<String> relationToGrooms = const Value.absent(),
                Value<String> relationshipStatus = const Value.absent(),
                Value<String?> whatsappNumber = const Value.absent(),
                Value<String?> funFact = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedGuestsCompanion(
                uid: uid,
                fullName: fullName,
                photoUrl: photoUrl,
                side: side,
                relationToGrooms: relationToGrooms,
                relationshipStatus: relationshipStatus,
                whatsappNumber: whatsappNumber,
                funFact: funFact,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String uid,
                required String fullName,
                Value<String?> photoUrl = const Value.absent(),
                required String side,
                required String relationToGrooms,
                required String relationshipStatus,
                Value<String?> whatsappNumber = const Value.absent(),
                Value<String?> funFact = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedGuestsCompanion.insert(
                uid: uid,
                fullName: fullName,
                photoUrl: photoUrl,
                side: side,
                relationToGrooms: relationToGrooms,
                relationshipStatus: relationshipStatus,
                whatsappNumber: whatsappNumber,
                funFact: funFact,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedGuestsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedGuestsTable,
      CachedGuest,
      $$CachedGuestsTableFilterComposer,
      $$CachedGuestsTableOrderingComposer,
      $$CachedGuestsTableAnnotationComposer,
      $$CachedGuestsTableCreateCompanionBuilder,
      $$CachedGuestsTableUpdateCompanionBuilder,
      (
        CachedGuest,
        BaseReferences<_$AppDatabase, $CachedGuestsTable, CachedGuest>,
      ),
      CachedGuest,
      PrefetchHooks Function()
    >;
typedef $$ExposuresTableCreateCompanionBuilder =
    ExposuresCompanion Function({
      required String id,
      required String localPath,
      Value<String?> cloudinaryPublicId,
      required int exposureNumber,
      required DateTime capturedAt,
      Value<bool> isDeveloped,
      Value<bool> isPublished,
      Value<int> rowid,
    });
typedef $$ExposuresTableUpdateCompanionBuilder =
    ExposuresCompanion Function({
      Value<String> id,
      Value<String> localPath,
      Value<String?> cloudinaryPublicId,
      Value<int> exposureNumber,
      Value<DateTime> capturedAt,
      Value<bool> isDeveloped,
      Value<bool> isPublished,
      Value<int> rowid,
    });

class $$ExposuresTableFilterComposer
    extends Composer<_$AppDatabase, $ExposuresTable> {
  $$ExposuresTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get localPath => $composableBuilder(
    column: $table.localPath,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get cloudinaryPublicId => $composableBuilder(
    column: $table.cloudinaryPublicId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get exposureNumber => $composableBuilder(
    column: $table.exposureNumber,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get capturedAt => $composableBuilder(
    column: $table.capturedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isDeveloped => $composableBuilder(
    column: $table.isDeveloped,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isPublished => $composableBuilder(
    column: $table.isPublished,
    builder: (column) => ColumnFilters(column),
  );
}

class $$ExposuresTableOrderingComposer
    extends Composer<_$AppDatabase, $ExposuresTable> {
  $$ExposuresTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get localPath => $composableBuilder(
    column: $table.localPath,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get cloudinaryPublicId => $composableBuilder(
    column: $table.cloudinaryPublicId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get exposureNumber => $composableBuilder(
    column: $table.exposureNumber,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get capturedAt => $composableBuilder(
    column: $table.capturedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isDeveloped => $composableBuilder(
    column: $table.isDeveloped,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isPublished => $composableBuilder(
    column: $table.isPublished,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ExposuresTableAnnotationComposer
    extends Composer<_$AppDatabase, $ExposuresTable> {
  $$ExposuresTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get localPath =>
      $composableBuilder(column: $table.localPath, builder: (column) => column);

  GeneratedColumn<String> get cloudinaryPublicId => $composableBuilder(
    column: $table.cloudinaryPublicId,
    builder: (column) => column,
  );

  GeneratedColumn<int> get exposureNumber => $composableBuilder(
    column: $table.exposureNumber,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get capturedAt => $composableBuilder(
    column: $table.capturedAt,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get isDeveloped => $composableBuilder(
    column: $table.isDeveloped,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get isPublished => $composableBuilder(
    column: $table.isPublished,
    builder: (column) => column,
  );
}

class $$ExposuresTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ExposuresTable,
          Exposure,
          $$ExposuresTableFilterComposer,
          $$ExposuresTableOrderingComposer,
          $$ExposuresTableAnnotationComposer,
          $$ExposuresTableCreateCompanionBuilder,
          $$ExposuresTableUpdateCompanionBuilder,
          (Exposure, BaseReferences<_$AppDatabase, $ExposuresTable, Exposure>),
          Exposure,
          PrefetchHooks Function()
        > {
  $$ExposuresTableTableManager(_$AppDatabase db, $ExposuresTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ExposuresTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ExposuresTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ExposuresTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> localPath = const Value.absent(),
                Value<String?> cloudinaryPublicId = const Value.absent(),
                Value<int> exposureNumber = const Value.absent(),
                Value<DateTime> capturedAt = const Value.absent(),
                Value<bool> isDeveloped = const Value.absent(),
                Value<bool> isPublished = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ExposuresCompanion(
                id: id,
                localPath: localPath,
                cloudinaryPublicId: cloudinaryPublicId,
                exposureNumber: exposureNumber,
                capturedAt: capturedAt,
                isDeveloped: isDeveloped,
                isPublished: isPublished,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String localPath,
                Value<String?> cloudinaryPublicId = const Value.absent(),
                required int exposureNumber,
                required DateTime capturedAt,
                Value<bool> isDeveloped = const Value.absent(),
                Value<bool> isPublished = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ExposuresCompanion.insert(
                id: id,
                localPath: localPath,
                cloudinaryPublicId: cloudinaryPublicId,
                exposureNumber: exposureNumber,
                capturedAt: capturedAt,
                isDeveloped: isDeveloped,
                isPublished: isPublished,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ExposuresTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ExposuresTable,
      Exposure,
      $$ExposuresTableFilterComposer,
      $$ExposuresTableOrderingComposer,
      $$ExposuresTableAnnotationComposer,
      $$ExposuresTableCreateCompanionBuilder,
      $$ExposuresTableUpdateCompanionBuilder,
      (Exposure, BaseReferences<_$AppDatabase, $ExposuresTable, Exposure>),
      Exposure,
      PrefetchHooks Function()
    >;
typedef $$PendingWritesTableCreateCompanionBuilder =
    PendingWritesCompanion Function({
      Value<int> id,
      required String collection,
      required String documentId,
      required String payload,
      required String operation,
      required DateTime createdAt,
    });
typedef $$PendingWritesTableUpdateCompanionBuilder =
    PendingWritesCompanion Function({
      Value<int> id,
      Value<String> collection,
      Value<String> documentId,
      Value<String> payload,
      Value<String> operation,
      Value<DateTime> createdAt,
    });

class $$PendingWritesTableFilterComposer
    extends Composer<_$AppDatabase, $PendingWritesTable> {
  $$PendingWritesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get collection => $composableBuilder(
    column: $table.collection,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get documentId => $composableBuilder(
    column: $table.documentId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get operation => $composableBuilder(
    column: $table.operation,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$PendingWritesTableOrderingComposer
    extends Composer<_$AppDatabase, $PendingWritesTable> {
  $$PendingWritesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get collection => $composableBuilder(
    column: $table.collection,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get documentId => $composableBuilder(
    column: $table.documentId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get operation => $composableBuilder(
    column: $table.operation,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$PendingWritesTableAnnotationComposer
    extends Composer<_$AppDatabase, $PendingWritesTable> {
  $$PendingWritesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get collection => $composableBuilder(
    column: $table.collection,
    builder: (column) => column,
  );

  GeneratedColumn<String> get documentId => $composableBuilder(
    column: $table.documentId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<String> get operation =>
      $composableBuilder(column: $table.operation, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$PendingWritesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $PendingWritesTable,
          PendingWrite,
          $$PendingWritesTableFilterComposer,
          $$PendingWritesTableOrderingComposer,
          $$PendingWritesTableAnnotationComposer,
          $$PendingWritesTableCreateCompanionBuilder,
          $$PendingWritesTableUpdateCompanionBuilder,
          (
            PendingWrite,
            BaseReferences<_$AppDatabase, $PendingWritesTable, PendingWrite>,
          ),
          PendingWrite,
          PrefetchHooks Function()
        > {
  $$PendingWritesTableTableManager(_$AppDatabase db, $PendingWritesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$PendingWritesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$PendingWritesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$PendingWritesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> collection = const Value.absent(),
                Value<String> documentId = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<String> operation = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => PendingWritesCompanion(
                id: id,
                collection: collection,
                documentId: documentId,
                payload: payload,
                operation: operation,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String collection,
                required String documentId,
                required String payload,
                required String operation,
                required DateTime createdAt,
              }) => PendingWritesCompanion.insert(
                id: id,
                collection: collection,
                documentId: documentId,
                payload: payload,
                operation: operation,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$PendingWritesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $PendingWritesTable,
      PendingWrite,
      $$PendingWritesTableFilterComposer,
      $$PendingWritesTableOrderingComposer,
      $$PendingWritesTableAnnotationComposer,
      $$PendingWritesTableCreateCompanionBuilder,
      $$PendingWritesTableUpdateCompanionBuilder,
      (
        PendingWrite,
        BaseReferences<_$AppDatabase, $PendingWritesTable, PendingWrite>,
      ),
      PendingWrite,
      PrefetchHooks Function()
    >;
typedef $$TimeGatesTableCreateCompanionBuilder =
    TimeGatesCompanion Function({
      required String id,
      required String contentType,
      required String title,
      required DateTime unlockAt,
      Value<int> rowid,
    });
typedef $$TimeGatesTableUpdateCompanionBuilder =
    TimeGatesCompanion Function({
      Value<String> id,
      Value<String> contentType,
      Value<String> title,
      Value<DateTime> unlockAt,
      Value<int> rowid,
    });

class $$TimeGatesTableFilterComposer
    extends Composer<_$AppDatabase, $TimeGatesTable> {
  $$TimeGatesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get contentType => $composableBuilder(
    column: $table.contentType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get unlockAt => $composableBuilder(
    column: $table.unlockAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$TimeGatesTableOrderingComposer
    extends Composer<_$AppDatabase, $TimeGatesTable> {
  $$TimeGatesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get contentType => $composableBuilder(
    column: $table.contentType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get unlockAt => $composableBuilder(
    column: $table.unlockAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$TimeGatesTableAnnotationComposer
    extends Composer<_$AppDatabase, $TimeGatesTable> {
  $$TimeGatesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get contentType => $composableBuilder(
    column: $table.contentType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<DateTime> get unlockAt =>
      $composableBuilder(column: $table.unlockAt, builder: (column) => column);
}

class $$TimeGatesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $TimeGatesTable,
          TimeGate,
          $$TimeGatesTableFilterComposer,
          $$TimeGatesTableOrderingComposer,
          $$TimeGatesTableAnnotationComposer,
          $$TimeGatesTableCreateCompanionBuilder,
          $$TimeGatesTableUpdateCompanionBuilder,
          (TimeGate, BaseReferences<_$AppDatabase, $TimeGatesTable, TimeGate>),
          TimeGate,
          PrefetchHooks Function()
        > {
  $$TimeGatesTableTableManager(_$AppDatabase db, $TimeGatesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$TimeGatesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$TimeGatesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$TimeGatesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> contentType = const Value.absent(),
                Value<String> title = const Value.absent(),
                Value<DateTime> unlockAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => TimeGatesCompanion(
                id: id,
                contentType: contentType,
                title: title,
                unlockAt: unlockAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String contentType,
                required String title,
                required DateTime unlockAt,
                Value<int> rowid = const Value.absent(),
              }) => TimeGatesCompanion.insert(
                id: id,
                contentType: contentType,
                title: title,
                unlockAt: unlockAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$TimeGatesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $TimeGatesTable,
      TimeGate,
      $$TimeGatesTableFilterComposer,
      $$TimeGatesTableOrderingComposer,
      $$TimeGatesTableAnnotationComposer,
      $$TimeGatesTableCreateCompanionBuilder,
      $$TimeGatesTableUpdateCompanionBuilder,
      (TimeGate, BaseReferences<_$AppDatabase, $TimeGatesTable, TimeGate>),
      TimeGate,
      PrefetchHooks Function()
    >;
typedef $$SeatingAssignmentsTableCreateCompanionBuilder =
    SeatingAssignmentsCompanion Function({
      required String guestId,
      required String guestName,
      required String assignedTable,
      required int seatNumber,
      Value<int> rowid,
    });
typedef $$SeatingAssignmentsTableUpdateCompanionBuilder =
    SeatingAssignmentsCompanion Function({
      Value<String> guestId,
      Value<String> guestName,
      Value<String> assignedTable,
      Value<int> seatNumber,
      Value<int> rowid,
    });

class $$SeatingAssignmentsTableFilterComposer
    extends Composer<_$AppDatabase, $SeatingAssignmentsTable> {
  $$SeatingAssignmentsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get guestId => $composableBuilder(
    column: $table.guestId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get guestName => $composableBuilder(
    column: $table.guestName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get assignedTable => $composableBuilder(
    column: $table.assignedTable,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get seatNumber => $composableBuilder(
    column: $table.seatNumber,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SeatingAssignmentsTableOrderingComposer
    extends Composer<_$AppDatabase, $SeatingAssignmentsTable> {
  $$SeatingAssignmentsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get guestId => $composableBuilder(
    column: $table.guestId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get guestName => $composableBuilder(
    column: $table.guestName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get assignedTable => $composableBuilder(
    column: $table.assignedTable,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get seatNumber => $composableBuilder(
    column: $table.seatNumber,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SeatingAssignmentsTableAnnotationComposer
    extends Composer<_$AppDatabase, $SeatingAssignmentsTable> {
  $$SeatingAssignmentsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get guestId =>
      $composableBuilder(column: $table.guestId, builder: (column) => column);

  GeneratedColumn<String> get guestName =>
      $composableBuilder(column: $table.guestName, builder: (column) => column);

  GeneratedColumn<String> get assignedTable => $composableBuilder(
    column: $table.assignedTable,
    builder: (column) => column,
  );

  GeneratedColumn<int> get seatNumber => $composableBuilder(
    column: $table.seatNumber,
    builder: (column) => column,
  );
}

class $$SeatingAssignmentsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SeatingAssignmentsTable,
          SeatingAssignmentRow,
          $$SeatingAssignmentsTableFilterComposer,
          $$SeatingAssignmentsTableOrderingComposer,
          $$SeatingAssignmentsTableAnnotationComposer,
          $$SeatingAssignmentsTableCreateCompanionBuilder,
          $$SeatingAssignmentsTableUpdateCompanionBuilder,
          (
            SeatingAssignmentRow,
            BaseReferences<
              _$AppDatabase,
              $SeatingAssignmentsTable,
              SeatingAssignmentRow
            >,
          ),
          SeatingAssignmentRow,
          PrefetchHooks Function()
        > {
  $$SeatingAssignmentsTableTableManager(
    _$AppDatabase db,
    $SeatingAssignmentsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SeatingAssignmentsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SeatingAssignmentsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SeatingAssignmentsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> guestId = const Value.absent(),
                Value<String> guestName = const Value.absent(),
                Value<String> assignedTable = const Value.absent(),
                Value<int> seatNumber = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SeatingAssignmentsCompanion(
                guestId: guestId,
                guestName: guestName,
                assignedTable: assignedTable,
                seatNumber: seatNumber,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String guestId,
                required String guestName,
                required String assignedTable,
                required int seatNumber,
                Value<int> rowid = const Value.absent(),
              }) => SeatingAssignmentsCompanion.insert(
                guestId: guestId,
                guestName: guestName,
                assignedTable: assignedTable,
                seatNumber: seatNumber,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SeatingAssignmentsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SeatingAssignmentsTable,
      SeatingAssignmentRow,
      $$SeatingAssignmentsTableFilterComposer,
      $$SeatingAssignmentsTableOrderingComposer,
      $$SeatingAssignmentsTableAnnotationComposer,
      $$SeatingAssignmentsTableCreateCompanionBuilder,
      $$SeatingAssignmentsTableUpdateCompanionBuilder,
      (
        SeatingAssignmentRow,
        BaseReferences<
          _$AppDatabase,
          $SeatingAssignmentsTable,
          SeatingAssignmentRow
        >,
      ),
      SeatingAssignmentRow,
      PrefetchHooks Function()
    >;
typedef $$ConfigCacheTableCreateCompanionBuilder =
    ConfigCacheCompanion Function({
      required String key,
      required String value,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$ConfigCacheTableUpdateCompanionBuilder =
    ConfigCacheCompanion Function({
      Value<String> key,
      Value<String> value,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$ConfigCacheTableFilterComposer
    extends Composer<_$AppDatabase, $ConfigCacheTable> {
  $$ConfigCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$ConfigCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $ConfigCacheTable> {
  $$ConfigCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ConfigCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $ConfigCacheTable> {
  $$ConfigCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$ConfigCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ConfigCacheTable,
          ConfigCacheData,
          $$ConfigCacheTableFilterComposer,
          $$ConfigCacheTableOrderingComposer,
          $$ConfigCacheTableAnnotationComposer,
          $$ConfigCacheTableCreateCompanionBuilder,
          $$ConfigCacheTableUpdateCompanionBuilder,
          (
            ConfigCacheData,
            BaseReferences<_$AppDatabase, $ConfigCacheTable, ConfigCacheData>,
          ),
          ConfigCacheData,
          PrefetchHooks Function()
        > {
  $$ConfigCacheTableTableManager(_$AppDatabase db, $ConfigCacheTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ConfigCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ConfigCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ConfigCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> key = const Value.absent(),
                Value<String> value = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ConfigCacheCompanion(
                key: key,
                value: value,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String key,
                required String value,
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => ConfigCacheCompanion.insert(
                key: key,
                value: value,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ConfigCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ConfigCacheTable,
      ConfigCacheData,
      $$ConfigCacheTableFilterComposer,
      $$ConfigCacheTableOrderingComposer,
      $$ConfigCacheTableAnnotationComposer,
      $$ConfigCacheTableCreateCompanionBuilder,
      $$ConfigCacheTableUpdateCompanionBuilder,
      (
        ConfigCacheData,
        BaseReferences<_$AppDatabase, $ConfigCacheTable, ConfigCacheData>,
      ),
      ConfigCacheData,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$EventSchedulesTableTableManager get eventSchedules =>
      $$EventSchedulesTableTableManager(_db, _db.eventSchedules);
  $$VenuesTableTableManager get venues =>
      $$VenuesTableTableManager(_db, _db.venues);
  $$CachedGuestsTableTableManager get cachedGuests =>
      $$CachedGuestsTableTableManager(_db, _db.cachedGuests);
  $$ExposuresTableTableManager get exposures =>
      $$ExposuresTableTableManager(_db, _db.exposures);
  $$PendingWritesTableTableManager get pendingWrites =>
      $$PendingWritesTableTableManager(_db, _db.pendingWrites);
  $$TimeGatesTableTableManager get timeGates =>
      $$TimeGatesTableTableManager(_db, _db.timeGates);
  $$SeatingAssignmentsTableTableManager get seatingAssignments =>
      $$SeatingAssignmentsTableTableManager(_db, _db.seatingAssignments);
  $$ConfigCacheTableTableManager get configCache =>
      $$ConfigCacheTableTableManager(_db, _db.configCache);
}
