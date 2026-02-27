# Firebase Remote Config Keys Reference

All keys are deployed via `firebase/remoteconfig.template.json` using `firebase deploy --only remoteconfig`. The Flutter app fetches these values on launch (minimum 15-minute interval) and falls back to bundled defaults if the fetch fails.

All ISO 8601 timestamps use the Europe/Madrid timezone (`+02:00` CEST).

---

## `event_schedule_json`

**Type:** JSON string (array)
**Purpose:** Full three-day event timeline used by the Hero Banner (Tab 1) and Itinerary (Tab 4). Drives the "current event" display and the master timeline view.

### Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique event identifier |
| `title` | string | yes | Event display name |
| `description` | string | yes | Brief event description |
| `startTime` | string | yes | ISO 8601 start time with timezone |
| `endTime` | string | yes | ISO 8601 end time with timezone |
| `venueId` | string | yes | References a venue in `venues_json` |
| `ctaLabel` | string | no | Call-to-action button label |
| `ctaDeepLink` | string | no | Deep link for the CTA button |
| `dayNumber` | integer | yes | 1 = May 29, 2 = May 30, 3 = May 31 |

### Example

```json
[
  {
    "id": "welcome-party",
    "title": "Fiesta de Bienvenida",
    "description": "Cocktails y tapas para dar la bienvenida a todos los invitados",
    "startTime": "2026-05-29T20:00:00+02:00",
    "endTime": "2026-05-29T23:59:00+02:00",
    "venueId": "chiringuito-playa",
    "dayNumber": 1
  },
  {
    "id": "ceremony",
    "title": "Ceremonia",
    "description": "La ceremonia de boda de Enrique y Manuel",
    "startTime": "2026-05-30T18:00:00+02:00",
    "endTime": "2026-05-30T19:00:00+02:00",
    "venueId": "mirador-estrecho",
    "ctaLabel": "Ver en mapa",
    "ctaDeepLink": "bodaentarifa://map?venue=mirador-estrecho",
    "dayNumber": 2
  }
]
```

---

## `venues_json`

**Type:** JSON string (array)
**Purpose:** List of all wedding venues with GPS coordinates and walking directions. Used by the Map (Tab 4) and Itinerary views.

### Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique venue identifier, referenced by events |
| `name` | string | yes | Venue display name |
| `latitude` | number | yes | GPS latitude |
| `longitude` | number | yes | GPS longitude |
| `walkingDirections` | string | no | Walking directions from a common reference point |
| `terrainNote` | string | no | Terrain type hint (e.g., "arena", "asfalto") |

### Example

```json
[
  {
    "id": "chiringuito-playa",
    "name": "Chiringuito Playa de los Lances",
    "latitude": 36.0058,
    "longitude": -5.6119,
    "walkingDirections": "Desde el centro, caminar 10 min por el paseo maritimo hacia el sur",
    "terrainNote": "arena"
  }
]
```

---

## `time_gates_json`

**Type:** JSON string (array)
**Purpose:** Unlock timestamps for time-gated content. Used for client-side UI (countdown timers, greyed-out cards). Actual enforcement is server-side via Firestore rules.

### Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Matches document ID in `time_gated_content` Firestore collection |
| `title` | string | yes | Display title |
| `contentType` | string | yes | `cocktailMenu`, `seatingChart`, or `banquetMenu` |
| `unlockAt` | string | yes | ISO 8601 unlock timestamp with timezone |

### Default Unlock Times

| Content | Unlock Time |
|---------|-------------|
| Cocktail Menu | May 30, 2026 19:30 CEST |
| Seating Chart | May 30, 2026 21:50 CEST |
| Banquet Menu | May 30, 2026 22:00 CEST |

### Example

```json
[
  {
    "id": "cocktail-menu",
    "title": "Carta de Cocteles",
    "contentType": "cocktailMenu",
    "unlockAt": "2026-05-30T19:30:00+02:00"
  }
]
```

---

## `seating_chart_json`

**Type:** JSON string (array)
**Purpose:** Table and seat assignments per guest. Used for the Seating Plan view (Tab 4) after the time gate unlocks.

### Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `guestUid` | string | yes | Guest UID matching the `guests` collection |
| `tableName` | string | yes | Table name or number |
| `seatNumber` | integer | yes | Seat position at the table |

### Default

Empty array `[]` — populated closer to the event.

### Example

```json
[
  {
    "guestUid": "abc123",
    "tableName": "Mesa Estrecho",
    "seatNumber": 3
  }
]
```

---

## `quick_contacts_json`

**Type:** JSON string (array)
**Purpose:** Emergency and coordinator contact numbers displayed on the Home tab's quick action buttons.

### Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique contact identifier |
| `label` | string | yes | Display label (e.g., "Taxi Local") |
| `phoneNumber` | string | yes | International format without "+" prefix |
| `type` | string | yes | `phone` (opens dialer) or `whatsapp` (opens WhatsApp) |

### Example

```json
[
  {
    "id": "taxi-tarifa",
    "label": "Taxi Local",
    "phoneNumber": "34956684174",
    "type": "phone"
  },
  {
    "id": "coordinadora",
    "label": "Coordinadora",
    "phoneNumber": "34600000000",
    "type": "whatsapp"
  }
]
```

---

## `wind_tips_json`

**Type:** JSON string (object)
**Purpose:** Fun tip strings displayed in the Weather widget on Tab 1, keyed by wind type. The app randomly selects one to display.

### Structure

A JSON object with three keys:

| Key | Type | Description |
|-----|------|-------------|
| `levante` | string[] | Tips for Levante wind |
| `poniente` | string[] | Tips for Poniente wind |
| `other` | string[] | Tips for calm/other conditions |

### Example

```json
{
  "levante": [
    "Hoy sopla levante... agarra bien el sombrero!",
    "Levante en Tarifa: el peinado es solo una sugerencia"
  ],
  "poniente": [
    "Poniente suave, buen dia para la playa",
    "Con poniente asi, hasta las gaviotas estan relajadas"
  ],
  "other": [
    "Sin viento en Tarifa... seguro que estamos en Tarifa?",
    "Dia tranquilo, aprovechad para las fotos!"
  ]
}
```

---

## `development_trigger_time`

**Type:** String (ISO 8601 with timezone)
**Purpose:** Deadline for automatic film "development" in the Unfiltered Camera feature. When reached, any user who hasn't completed 24 exposures has their film automatically revealed.

**Default:** `2026-05-31T05:00:00+02:00` (5:00 AM on May 31, Europe/Madrid)
