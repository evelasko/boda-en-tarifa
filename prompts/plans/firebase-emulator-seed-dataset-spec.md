# Firebase Emulator Seed Dataset Spec

> **Date:** 2026-04-14  
> **Companion plan:** `prompts/plans/firebase-emulator-seeding-plan.md`  
> **Canonical schema reference:** `firebase/docs/firestore-data-model.md`  
> **Testing policy reference:** `specs/testing-policy.md`

This document defines the exact seed dataset for local emulator + simulator testing.

---

## 1. Global conventions

- **Project id:** `demo-boda-en-tarifa`
- **UID/doc prefix:** `seed_`
- **Email domain:** `example.test`
- **Timezone context:** `Europe/Madrid`
- **Firestore timestamps:** use server timestamps where possible; fixed ISO timestamps where deterministic ordering is required

---

## 2. Auth emulator users

Create users first so Firestore `guests/{uid}` can align with Auth UIDs.

| UID | Email | Claims | Purpose |
|---|---|---|---|
| `seed_admin_001` | `admin.one@example.test` | `{ "authorized": true, "admin": true }` | Admin user for elevated paths |
| `seed_guest_001` | `ana.mar@example.test` | `{ "authorized": true }` | Regular claimed guest |
| `seed_guest_002` | `luis.rio@example.test` | `{ "authorized": true }` | Regular claimed guest |
| `seed_guest_003` | `marta.sol@example.test` | `{ "authorized": true }` | Directory-hidden claimed guest |
| `seed_guest_004` | `pablo.luz@example.test` | `{ "authorized": true }` | Claimed guest with no seating |
| `seed_guest_unclaimed_001` | `sofia.pending@example.test` | `{ "authorized": false }` | Invited but unclaimed flow |
| `seed_orphan_001` | `orphan.user@example.test` | `{ "authorized": false }` | Unauthorized auth-only user (cleanup target candidate) |

Optional (for migration path tests):

- Auth user: `seed_migrated_001` with email `migrated.user@example.test`
- In Firestore, matching email on different guest doc id (see section 3.1)

---

## 3. Firestore seed data

## 3.1 `guests`

Seed documents with IDs matching UIDs unless explicitly testing migration mismatch.

### Required fields for all guest docs

- `email` (lowercase)
- `fullName`
- `relationToGrooms`
- `relationshipStatus` (`soltero` | `enPareja` | `buscando`)
- `side` (`novioA` | `novioB` | `ambos`)
- `profileClaimed`
- `isDirectoryVisible`
- `createdAt`
- `updatedAt`

### Dataset

1. `guests/seed_admin_001`
   - email: `admin.one@example.test`
   - fullName: `Admin One`
   - relationToGrooms: `Amigo de ambos`
   - relationshipStatus: `enPareja`
   - side: `ambos`
   - profileClaimed: `true`
   - isDirectoryVisible: `true`
   - contactPreference: `email`
   - whatsappNumber: `34600111001`
   - funFact: `Organiza playlists para cualquier evento.`

2. `guests/seed_guest_001`
   - email: `ana.mar@example.test`
   - fullName: `Ana del Mar`
   - relationToGrooms: `Amiga de Novio A`
   - relationshipStatus: `soltero`
   - side: `novioA`
   - profileClaimed: `true`
   - isDirectoryVisible: `true`
   - contactPreference: `whatsapp`
   - whatsappNumber: `34600111002`

3. `guests/seed_guest_002`
   - email: `luis.rio@example.test`
   - fullName: `Luis del Rio`
   - relationToGrooms: `Primo de Novio B`
   - relationshipStatus: `enPareja`
   - side: `novioB`
   - profileClaimed: `true`
   - isDirectoryVisible: `true`
   - contactPreference: `email`

4. `guests/seed_guest_003`
   - email: `marta.sol@example.test`
   - fullName: `Marta Sol`
   - relationToGrooms: `Amiga de ambos`
   - relationshipStatus: `buscando`
   - side: `ambos`
   - profileClaimed: `true`
   - isDirectoryVisible: `false`
   - contactPreference: `whatsapp`

5. `guests/seed_guest_004`
   - email: `pablo.luz@example.test`
   - fullName: `Pablo Luz`
   - relationToGrooms: `Companero de trabajo de Novio A`
   - relationshipStatus: `soltero`
   - side: `novioA`
   - profileClaimed: `true`
   - isDirectoryVisible: `true`

6. `guests/seed_guest_unclaimed_001`
   - email: `sofia.pending@example.test`
   - fullName: `Sofia Pending`
   - relationToGrooms: `Amiga de Novio B`
   - relationshipStatus: `enPareja`
   - side: `novioB`
   - profileClaimed: `false`
   - isDirectoryVisible: `true`

Optional migration case:

7. `guests/seed_legacy_guest_doc_001`
   - email: `migrated.user@example.test`
   - profileClaimed: `false`
   - (plus required fields)
   - Used with Auth user `seed_migrated_001` to test UID migration behavior in `onUserCreate`.

## 3.2 `seating`

Seed subset to validate both assigned and unassigned states.

- `seating/seed_guest_001`: `{ "tableName": "Mesa Estrecho", "seatNumber": 3 }`
- `seating/seed_guest_002`: `{ "tableName": "Mesa Levante", "seatNumber": 6 }`
- `seating/seed_guest_003`: `{ "tableName": "Mesa Poniente", "seatNumber": 2 }`

Intentionally do **not** create seating for `seed_guest_004`.

## 3.3 `time_gated_content`

Seed three canonical docs with mixed unlock states.

1. `time_gated_content/cocktail_menu`
   - title: `Carta de Cocteles`
   - type: `cocktailMenu`
   - unlockAt: `2026-05-30T17:30:00Z`
   - content:
     - categories:
       - name: `Signature`
       - items: [`Tarifa Sunset`, `Buganvilla Spritz`]

2. `time_gated_content/seating_chart`
   - title: `Plano de Mesas`
   - type: `seatingChart`
   - unlockAt: `2026-05-30T19:50:00Z`
   - content:
     - totalTables: `12`
     - floorPlanUrl: `https://res.cloudinary.com/demo/image/upload/v1/seed/floor-plan.png`

3. `time_gated_content/banquet_menu`
   - title: `Menu del Banquete`
   - type: `banquetMenu`
   - unlockAt: `2026-05-30T20:00:00Z`
   - content:
     - courses:
       - name: `Entrante`
       - dishes: [`Tartar de atun`, `Ensalada citrica`]

## 3.4 `feed_posts`

Create 12 posts with deterministic IDs: `seed_post_001` to `seed_post_012`.

Field distribution:

- `authorUid`: rotate between `seed_guest_001`, `seed_guest_002`, `seed_guest_003`
- `source`: mix of `unfiltered`, `import`, `share_extension`
- `isHidden`: `true` for exactly 2 posts (e.g. `seed_post_005`, `seed_post_011`)
- `imageUrls`: at least one Cloudinary-style public id each (e.g. `seed/feed/001`)
- `caption`: present on ~70% of docs
- `createdAt`: descending timestamps spaced 5 minutes apart for feed ordering tests

## 3.5 `notices`

Create 8 docs with deterministic IDs: `seed_notice_001` to `seed_notice_008`.

Field distribution:

- Authors from claimed guests only
- Varied body length/content
- `authorWhatsappNumber` populated for all
- `createdAt` spaced 10 minutes apart

## 3.6 `sent_notifications`

Seed idempotency examples:

- `sent_notifications/welcome_party_reminder`
  - sentAt: `2026-05-29T17:05:00.000Z`
  - type: `event_reminder`
  - eventId: `welcome_party`

Do not seed:

- `ceremony_reminder`
- `dinner_reminder`
- `brunch_reminder`
- content unlock IDs

This allows testing first-run vs already-sent behavior.

---

## 4. Optional web admin dataset (`rsvp_responses`)

If testing Next.js admin pages locally with emulator data, add:

- `rsvp_responses/seed_guest_001`
- `rsvp_responses/seed_guest_002`
- `rsvp_responses/seed_guest_003`

Include varied `responses.attendance` values (`yes`, `no`) and one partially-complete response.

Note: ensure rules/usage expectations are aligned with current policy and implementation.

---

## 5. Remote Config dataset for simulator

Primary simulator strategy: rely on app bundled defaults in `app/assets/defaults/`.

Still include validation checks:

1. `event_schedule_json` parses successfully.
2. `venues_json` parses successfully.
3. `time_gates_json` IDs align with Firestore docs (`cocktail_menu`, `seating_chart`, `banquet_menu`) or documented mapping.
4. `development_trigger_time_json` key naming is consistent between app code and docs.

If needed later, add staging RC template values matching this dataset.

---

## 6. Cleanup contract

`clear-emulator.ts` must delete:

- Auth users whose UID starts with `seed_`
- Firestore docs in target collections whose doc IDs start with `seed_`
- Explicit non-prefixed idempotency docs seeded for behavior tests (e.g. `welcome_party_reminder`)

Cleanup must be safe to run repeatedly.

---

## 7. Acceptance criteria

The dataset is considered correct when:

1. App simulator can sign in as `seed_guest_001` and load profile + directory + feed + notices.
2. `seed_guest_003` does not appear in directory when visibility filtering is applied.
3. Seating lookup works for `seed_guest_001` and reports missing assignment for `seed_guest_004`.
4. Time-gated content docs are present and parse/render correctly.
5. Functions relying on `sent_notifications` exhibit idempotent behavior.
6. Unclaimed guest (`seed_guest_unclaimed_001`) supports onboarding-related test paths.
