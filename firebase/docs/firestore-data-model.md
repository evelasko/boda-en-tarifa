# Firestore Data Model

> **Canonical reference** for the Boda en Tarifa Firestore schema.
> All Firebase issues, Flutter entities, Cloud Functions, and security rules must align with this document.
>
> Source: `app/specs/technical-architecture.md` Sections 5, 7.1, 7.2

---

## Conventions

- **Timestamps**: All timestamp fields use Firestore server timestamps (`FieldValue.serverTimestamp()`).
- **Strings**: All enum-like string fields are stored as lowercase camelCase (e.g., `"novioA"`, `"enPareja"`).
- **WhatsApp numbers**: Stored in international format **without** the `+` prefix (e.g., `"34612345678"`), as required by `wa.me` deep links.
- **Denormalized fields**: Author name and photo URL are copied from the `guests` document at write time. They are **not** live-synced — if a guest updates their profile, existing posts/notices retain the original values.

## Document ID Strategies

| Collection | ID Strategy | Example |
|---|---|---|
| `guests` | Firebase Auth UID | `abc123def456` |
| `feed_posts` | Firestore auto-generated | `Xk9mP2qR...` |
| `notices` | Firestore auto-generated | `Lw3nT8vB...` |
| `seating` | Guest UID (matches `guests` doc ID) | `abc123def456` |
| `time_gated_content` | Meaningful identifier | `cocktail_menu`, `seating_chart`, `banquet_menu` |

---

## Collections

### `guests`

Pre-populated by admins before the event. Each document represents one invited guest. The `profileClaimed` field transitions from `false` to `true` when the `onUserCreate` Cloud Function validates the guest's email against the allowlist.

**Document ID**: Guest UID (matches Firebase Auth UID)

| Field | Type | Required | Purpose | Constraints |
|---|---|---|---|---|
| `email` | string | Yes | Guest's email, used for allowlist matching during auth | Unique across collection; lowercase |
| `fullName` | string | Yes | Display name shown in directory, feed posts, notices | Max 100 characters |
| `photoUrl` | string | No | Cloudinary public ID or full URL for profile photo | Null until guest uploads a photo |
| `whatsappNumber` | string | No | International format phone number for WhatsApp deep links | No `+` prefix (e.g., `"34612345678"`) |
| `funFact` | string | No | Short bio/fun fact shown on guest profile | Max 280 characters |
| `relationToGrooms` | string | Yes | Describes relationship (e.g., "Amigo de Novio A") | Admin-set; **immutable by guest** |
| `relationshipStatus` | string | Yes | Guest's relationship status | One of: `"soltero"`, `"enPareja"`, `"buscando"` |
| `side` | string | Yes | Which groom the guest is associated with | One of: `"novioA"`, `"novioB"`, `"ambos"`; admin-set; **immutable by guest** |
| `profileClaimed` | bool | Yes | Whether the guest has authenticated and claimed this profile | Defaults to `false`; set to `true` by `onUserCreate` Cloud Function |
| `isDirectoryVisible` | bool | Yes | Privacy toggle — whether guest appears in the Guest Directory | Defaults to `true`; guest can toggle off in settings |
| `contactPreference` | string | No | How the guest prefers to be contacted | One of: `"whatsapp"`, `"email"`; set during onboarding |
| `createdAt` | timestamp | Yes | Document creation time | Server timestamp; set once on creation |
| `updatedAt` | timestamp | Yes | Last modification time | Server timestamp; updated on every write |

**Field editability**:
- **Admin-only (immutable by guest)**: `email`, `relationToGrooms`, `side`
- **System-managed**: `profileClaimed`, `createdAt`, `updatedAt`
- **Guest-editable**: `fullName`, `photoUrl`, `whatsappNumber`, `funFact`, `relationshipStatus`, `isDirectoryVisible`, `contactPreference`

---

### `feed_posts`

User-generated photo posts displayed in the Live Feed. Posts originate from the disposable camera feature, photo imports, or the share extension.

**Document ID**: Firestore auto-generated

| Field | Type | Required | Purpose | Constraints |
|---|---|---|---|---|
| `authorUid` | string | Yes | UID of the guest who created the post | Must match authenticated user's UID on creation |
| `authorName` | string | Yes | Denormalized display name of the author | Copied from `guests` doc at post creation time |
| `authorPhotoUrl` | string | No | Denormalized profile photo URL of the author | Copied from `guests` doc at post creation time |
| `imageUrls` | array\<string\> | Yes | Cloudinary public IDs for the post's images | At least one entry required |
| `caption` | string | No | Optional text caption for the post | Max 500 characters |
| `source` | string | Yes | Origin of the post | One of: `"unfiltered"`, `"import"`, `"share_extension"` |
| `isHidden` | bool | Yes | Moderation flag — hidden posts are excluded from feed queries | Defaults to `false`; toggled by author or admin |
| `createdAt` | timestamp | Yes | Post creation time | Server timestamp |

> **Note**: `isHidden` was omitted from the Section 7.1 Firestore tree diagram but is present in the Section 5.3 Freezed model (`FeedPost`) and Section 7.2 security rules. It is part of the canonical schema.

---

### `notices`

Text-based announcements posted by guests to the Notice Board. Each notice includes the author's WhatsApp number for a contact button.

**Document ID**: Firestore auto-generated

| Field | Type | Required | Purpose | Constraints |
|---|---|---|---|---|
| `authorUid` | string | Yes | UID of the guest who posted the notice | Must match authenticated user's UID on creation |
| `authorName` | string | Yes | Denormalized display name | Copied from `guests` doc |
| `authorPhotoUrl` | string | No | Denormalized profile photo URL | Copied from `guests` doc |
| `body` | string | Yes | Text content of the notice | Max 1000 characters |
| `authorWhatsappNumber` | string | Yes | Author's WhatsApp number for contact button | No `+` prefix (e.g., `"34612345678"`) |
| `createdAt` | timestamp | Yes | Notice creation time | Server timestamp |

---

### `seating`

Admin-managed seating assignments. Each document maps a guest to their table and seat.

**Document ID**: Guest UID (same as the corresponding `guests` document ID)

| Field | Type | Required | Purpose | Constraints |
|---|---|---|---|---|
| `tableName` | string | Yes | Name of the guest's assigned table | Admin-set |
| `seatNumber` | number | Yes | Seat position within the table | Positive integer; admin-set |

---

### `time_gated_content`

Content that becomes visible to guests at a specific time. Firestore security rules use the `unlockAt` field with `request.time` to enforce time-gating server-side.

**Document ID**: Meaningful content identifier (e.g., `"cocktail_menu"`, `"seating_chart"`, `"banquet_menu"`)

| Field | Type | Required | Purpose | Constraints |
|---|---|---|---|---|
| `title` | string | Yes | Display title shown in the UI before and after unlock | Max 100 characters |
| `type` | string | Yes | Content type identifier | One of: `"cocktailMenu"`, `"seatingChart"`, `"banquetMenu"` |
| `unlockAt` | timestamp | Yes | Server-side unlock time — rules compare against `request.time` | Europe/Madrid timezone context |
| `content` | map | Yes | Flexible schema containing the actual content payload | Structure varies by `type` — see below |

#### `content` map structures

**cocktailMenu**:
```json
{
  "categories": [
    {
      "name": "Gin & Tonic",
      "items": ["Hendrick's con pepino", "Tanqueray con frutos rojos"]
    }
  ]
}
```

**banquetMenu**:
```json
{
  "courses": [
    {
      "name": "Entrante",
      "dishes": ["Tartar de atún rojo", "Ensalada de queso de cabra"]
    }
  ]
}
```

**seatingChart**:
```json
{
  "totalTables": 12,
  "floorPlanUrl": "https://res.cloudinary.com/.../floor-plan.png"
}
```

> The `seatingChart` content type primarily references the `seating` collection for per-guest assignments. The `content` map holds supplementary metadata only.

---

## Cross-Collection Relationships

| Relationship | Description |
|---|---|
| `seating/{guestUid}` ↔ `guests/{uid}` | 1:1 — seating doc ID matches the guest's Auth UID |
| `feed_posts.authorUid` → `guests/{uid}` | Many-to-one — denormalized `authorName` and `authorPhotoUrl` copied at write time |
| `notices.authorUid` → `guests/{uid}` | Many-to-one — denormalized `authorName` and `authorPhotoUrl` copied at write time |
| `time_gated_content["seating_chart"]` → `seating/*` | Logical reference — the seating chart content type supplements the `seating` collection |

---

## Enum Reference

| Field | Collection | Valid Values |
|---|---|---|
| `relationshipStatus` | `guests` | `"soltero"`, `"enPareja"`, `"buscando"` |
| `side` | `guests` | `"novioA"`, `"novioB"`, `"ambos"` |
| `contactPreference` | `guests` | `"whatsapp"`, `"email"` |
| `source` | `feed_posts` | `"unfiltered"`, `"import"`, `"share_extension"` |
| `type` | `time_gated_content` | `"cocktailMenu"`, `"seatingChart"`, `"banquetMenu"` |

---

## Scope Notes

- **Web RSVP**: The `rsvp_responses` collection used by the Next.js RSVP form (`web/src/lib/firestore.ts`) is a separate web-specific schema and is not covered here.
- **Remote Config**: Event schedules, venues, wind tips, and other static configuration live in Firebase Remote Config (see `app/specs/technical-architecture.md` Section 7.3), not in Firestore.
- **Drift (offline cache)**: The Flutter app's Drift database mirrors a subset of Firestore fields for offline access. Drift table schemas must stay aligned with this document.
