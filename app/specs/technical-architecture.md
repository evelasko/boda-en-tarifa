# Technical Architecture Document — Boda en Tarifa App

> **Version:** 1.0
> **Date:** 2026-02-25
> **Status:** Draft — Pending Approval
> **Reference:** `prd.md`

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Project Structure](#3-project-structure)
4. [Layer Architecture](#4-layer-architecture)
5. [Data Models](#5-data-models)
6. [State Management](#6-state-management)
7. [Firebase Integration](#7-firebase-integration)
8. [Offline-First Strategy](#8-offline-first-strategy)
9. [Media Pipeline](#9-media-pipeline)
10. [Authentication Flow](#10-authentication-flow)
11. [Push Notifications](#11-push-notifications)
12. [Share Extension (iOS & Android)](#12-share-extension-ios--android)
13. [Time-Gated Content](#13-time-gated-content)
14. [Remote Configuration](#14-remote-configuration)
15. [Weather Service](#15-weather-service)
16. [Networking & Error Handling](#16-networking--error-handling)
17. [Security Considerations](#17-security-considerations)
18. [Third-Party Dependencies](#18-third-party-dependencies)
19. [Cloud Functions](#19-cloud-functions)
20. [Implementation Phases](#20-implementation-phases)

---

## 1. System Overview

**Boda en Tarifa** is a single-event, three-day (May 29-31) mobile concierge app for a destination wedding in Tarifa, Spain. It serves an international, pre-registered guest list with event logistics, a community feed, a vintage-style disposable camera, guest directory, and real-time notifications.

### Key Technical Decisions

| Concern | Decision |
|---|---|
| Framework | Flutter (iOS + Android) |
| Language | Dart 3.10+ |
| State management | Riverpod (code-generated) |
| Data models | Freezed + json_serializable |
| Error handling | `Either<Failure, T>` via `fpdart` |
| Local persistence | Drift (SQLite) — offline-first for critical data |
| Remote database | Cloud Firestore |
| Remote config | Firebase Remote Config |
| Media storage | Cloudinary (upload, transform, deliver via CDN) |
| Authentication | Deep-linked Magic Links (Firebase Custom Auth Tokens) |
| Push notifications | Firebase Cloud Messaging (FCM) |
| Cloud logic | Firebase Cloud Functions (2nd gen, Node.js/TypeScript) |
| Localization | Spanish only (hardcoded strings, no i18n framework needed) |
| iBeacon | Deferred to post-v1 |
| Analytics | None |

### Why Cloudinary over Firebase Storage

Firebase Storage is a blob store — it serves the original file as-is. For a photo-heavy social app this means:

- **No server-side transforms.** Every device downloads the full-res image; the client must decode and resize it, wasting bandwidth and memory.
- **No CDN-level optimizations.** No automatic WebP/AVIF conversion, no responsive breakpoints, no quality auto-tuning.
- **Thumbnail generation requires Cloud Functions.** You'd need to write and maintain an image-processing pipeline (sharp/ImageMagick in a Cloud Function triggered on upload), manage the resized variants in Storage, and build the URL scheme yourself.

Cloudinary solves all of this with a URL-based transformation API:

```
https://res.cloudinary.com/<cloud>/image/upload/w_400,h_400,c_fill,q_auto,f_auto/v1/<public_id>.jpg
```

One upload, infinite on-the-fly variants (thumbnails, feed-size, full-res), automatic format negotiation (WebP on supported browsers, AVIF where possible), and global CDN delivery. This is critical for the Live Feed (Tab 2) and the "Development Room" gallery (Tab 3), where dozens of photos must load fast on potentially spotty beach Wi-Fi.

**Cost:** Cloudinary's free tier includes 25K transformations/month and 25GB bandwidth — more than sufficient for a ~100-guest, 3-day event. No Cloud Function maintenance overhead.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FLUTTER APP                               │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │Presentation│→ │ Application│→ │   Domain   │← │   Data    │ │
│  │   Layer    │  │   Layer    │  │   Layer    │  │   Layer   │ │
│  │ (Widgets)  │  │(Riverpod)  │  │(Entities/  │  │(Repos/    │ │
│  │            │  │            │  │ UseCases)  │  │DataSources│ │
│  └────────────┘  └────────────┘  └────────────┘  └─────┬─────┘ │
│                                                         │       │
│                              ┌───────────────────┬──────┴────┐  │
│                              │                   │           │  │
│                         ┌────▼────┐        ┌─────▼───┐ ┌────▼─┐│
│                         │  Drift  │        │Firestore│ │Cloud-││
│                         │(SQLite) │        │  SDK    │ │inary ││
│                         └─────────┘        └────┬────┘ └──┬───┘│
└──────────────────────────────────────────────────┼────────┼────┘
                                                   │        │
                    ┌──────────────────────────────▼────────▼────┐
                    │              FIREBASE PLATFORM              │
                    │                                            │
                    │  ┌───────────┐ ┌──────┐ ┌──────────────┐  │
                    │  │ Firestore │ │ Auth │ │Cloud Functions│  │
                    │  └───────────┘ └──────┘ └──────────────┘  │
                    │  ┌───────────────┐  ┌──────────────────┐  │
                    │  │ Remote Config │  │       FCM        │  │
                    │  └───────────────┘  └──────────────────┘  │
                    └────────────────────────────────────────────┘

                    ┌────────────────────────────────────────────┐
                    │            CLOUDINARY CDN                   │
                    │  Upload API · Transform API · Delivery CDN │
                    └────────────────────────────────────────────┘
```

---

## 3. Project Structure

The project follows a **feature-first** layout with shared core modules. Each feature is self-contained and mirrors the 4-layer architecture internally.

```
lib/
├── app/
│   ├── app.dart                          # MaterialApp, router, theme
│   ├── router.dart                       # GoRouter configuration
│   └── theme.dart                        # Tarifa color palette, typography
│
├── core/
│   ├── error/
│   │   ├── failures.dart                 # Failure sealed class hierarchy
│   │   └── exceptions.dart               # Exception types
│   ├── network/
│   │   └── network_info.dart             # Connectivity checker
│   ├── either/
│   │   └── typedefs.dart                 # FutureEither<T>, etc.
│   ├── database/
│   │   ├── app_database.dart             # Drift database definition
│   │   └── app_database.g.dart
│   ├── providers/
│   │   └── core_providers.dart           # Shared Riverpod providers
│   ├── constants/
│   │   ├── firestore_paths.dart
│   │   └── cloudinary_config.dart
│   └── utils/
│       ├── date_utils.dart
│       └── image_utils.dart
│
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   └── auth_remote_data_source.dart
│   │   │   └── repositories/
│   │   │       └── auth_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── app_user.dart         # Freezed
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart  # Abstract
│   │   │   └── usecases/
│   │   │       ├── send_magic_link.dart
│   │   │       ├── verify_magic_link.dart
│   │   │       ├── sign_in_with_google.dart
│   │   │       └── sign_in_with_apple.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── auth_providers.dart
│   │       ├── screens/
│   │       │   ├── welcome_screen.dart
│   │       │   └── magic_link_sent_screen.dart
│   │       └── widgets/
│   │
│   ├── home/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── weather_remote_data_source.dart
│   │   │   │   └── schedule_remote_data_source.dart
│   │   │   └── repositories/
│   │   │       ├── weather_repository_impl.dart
│   │   │       └── schedule_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── weather_info.dart
│   │   │   │   └── event_schedule.dart
│   │   │   ├── repositories/
│   │   │   └── usecases/
│   │   │       ├── get_current_event.dart
│   │   │       └── get_weather.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       ├── screens/
│   │       │   └── home_screen.dart
│   │       └── widgets/
│   │           ├── hero_banner.dart
│   │           ├── wind_weather_widget.dart
│   │           └── quick_action_buttons.dart
│   │
│   ├── community/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── feed_remote_data_source.dart
│   │   │   │   ├── feed_local_data_source.dart
│   │   │   │   └── notice_board_remote_data_source.dart
│   │   │   └── repositories/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── feed_post.dart
│   │   │   │   └── notice.dart
│   │   │   ├── repositories/
│   │   │   └── usecases/
│   │   │       ├── get_feed_posts.dart
│   │   │       ├── publish_photos.dart
│   │   │       ├── import_photos.dart
│   │   │       └── create_notice.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       ├── screens/
│   │       │   └── community_screen.dart
│   │       └── widgets/
│   │           ├── live_feed_view.dart
│   │           ├── notice_board_view.dart
│   │           └── feed_post_card.dart
│   │
│   ├── camera/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── camera_local_data_source.dart
│   │   │   │   └── camera_remote_data_source.dart
│   │   │   └── repositories/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── exposure.dart
│   │   │   ├── repositories/
│   │   │   └── usecases/
│   │   │       ├── capture_photo.dart
│   │   │       ├── check_development_trigger.dart
│   │   │       └── publish_to_feed.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       ├── screens/
│   │       │   ├── viewfinder_screen.dart
│   │       │   └── development_room_screen.dart
│   │       └── widgets/
│   │           ├── retro_viewfinder.dart
│   │           └── exposure_counter.dart
│   │
│   ├── itinerary/
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── itinerary_local_data_source.dart
│   │   │   │   └── itinerary_remote_data_source.dart
│   │   │   └── repositories/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── event.dart
│   │   │   │   ├── venue.dart
│   │   │   │   ├── menu.dart
│   │   │   │   └── seating_assignment.dart
│   │   │   ├── repositories/
│   │   │   └── usecases/
│   │   └── presentation/
│   │       ├── providers/
│   │       ├── screens/
│   │       │   ├── itinerary_screen.dart
│   │       │   ├── map_screen.dart
│   │       │   └── menu_screen.dart
│   │       └── widgets/
│   │           ├── timeline_card.dart
│   │           ├── custom_map.dart
│   │           └── time_locked_card.dart
│   │
│   └── directory/
│       ├── data/
│       │   ├── datasources/
│       │   │   ├── guest_remote_data_source.dart
│       │   │   └── guest_local_data_source.dart
│       │   └── repositories/
│       ├── domain/
│       │   ├── entities/
│       │   │   └── guest_profile.dart
│       │   ├── repositories/
│       │   └── usecases/
│       └── presentation/
│           ├── providers/
│           ├── screens/
│           │   ├── directory_screen.dart
│           │   └── guest_profile_screen.dart
│           └── widgets/
│               ├── guest_grid.dart
│               ├── filter_chips.dart
│               └── profile_editor.dart
│
├── share_extension/
│   └── share_handler.dart                # Handles incoming share intents
│
└── main.dart                             # Entry point, Firebase init

ios/
├── ShareExtension/                       # Native iOS Share Extension target
│   ├── ShareViewController.swift
│   ├── Info.plist
│   └── MainInterface.storyboard

android/
└── app/src/main/
    ├── AndroidManifest.xml               # Intent filters for share target
    └── kotlin/.../ShareActivity.kt       # Native Android share handler
```

---

## 4. Layer Architecture

The app follows **Clean Architecture** with four distinct layers. Dependencies point inward — outer layers depend on inner layers, never the reverse.

### 4.1 Domain Layer (Innermost — Pure Dart)

Contains business logic with zero framework dependencies.

- **Entities:** Immutable data classes generated with Freezed.
- **Repository contracts:** Abstract classes defining data operations. Return `FutureEither<Failure, T>`.
- **Use cases:** Single-purpose classes encapsulating one business action. Each use case receives a repository via constructor injection (provided by Riverpod).

```dart
// domain/usecases/get_current_event.dart
class GetCurrentEvent {
  final ScheduleRepository _repository;
  const GetCurrentEvent(this._repository);

  FutureEither<EventSchedule> call() => _repository.getCurrentEvent();
}
```

### 4.2 Data Layer

Implements domain contracts. Contains two sub-layers:

- **Data sources:**
  - `RemoteDataSource` — Firestore SDK, Cloudinary API, Weather API calls.
  - `LocalDataSource` — Drift (SQLite) DAOs for offline-critical data.
- **Repositories:** Concrete implementations that coordinate between local and remote sources, applying the offline-first strategy (Section 8).
- **DTOs:** Firestore-specific models with `fromFirestore` / `toFirestore` factories, mapped to domain entities.

### 4.3 Application Layer (State Management)

Riverpod providers that wire use cases to the presentation layer.

- `AsyncNotifierProvider` for stateful, mutation-heavy features (camera, profile editing).
- `StreamProvider` for reactive Firestore listeners (live feed, notice board).
- `FutureProvider` for one-shot fetches (weather).

### 4.4 Presentation Layer (Outermost)

Flutter widgets. Screens consume Riverpod providers and render UI. No business logic here — only UI state mapping (loading, error, data) and navigation.

---

## 5. Data Models

All domain entities are Freezed-generated immutable classes. Below are the core models.

### 5.1 User / Guest

```dart
@freezed
class AppUser with _$AppUser {
  const factory AppUser({
    required String uid,
    required String email,
    required String fullName,
    String? photoUrl,
    String? whatsappNumber,
    String? funFact,
    required String relationToGrooms, // "Amigo de Novio A", etc.
    required RelationshipStatus relationshipStatus,
    required GuestSide side,
    required bool profileClaimed,
    required bool isDirectoryVisible, // Opt-out privacy toggle
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _AppUser;
}

enum RelationshipStatus { soltero, enPareja, buscando }
enum GuestSide { novioA, novioB, ambos }
```

### 5.2 Event / Schedule

```dart
@freezed
class EventSchedule with _$EventSchedule {
  const factory EventSchedule({
    required String id,
    required String title,
    required String description,
    required DateTime startTime,
    required DateTime endTime,
    required String venueId,
    String? ctaLabel,
    String? ctaDeepLink,
    required int dayNumber, // 1, 2, 3
  }) = _EventSchedule;
}
```

### 5.3 Feed Post

```dart
@freezed
class FeedPost with _$FeedPost {
  const factory FeedPost({
    required String id,
    required String authorUid,
    required String authorName,
    String? authorPhotoUrl,
    required List<String> imageUrls, // Cloudinary public IDs
    String? caption,
    required FeedPostSource source,
    required bool isHidden, // Moderation flag
    required DateTime createdAt,
  }) = _FeedPost;
}

enum FeedPostSource { unfiltered, import, shareExtension }
```

### 5.4 Notice

```dart
@freezed
class Notice with _$Notice {
  const factory Notice({
    required String id,
    required String authorUid,
    required String authorName,
    String? authorPhotoUrl,
    required String body,
    required String authorWhatsappNumber,
    required DateTime createdAt,
  }) = _Notice;
}
```

### 5.5 Exposure (Camera)

```dart
@freezed
class Exposure with _$Exposure {
  const factory Exposure({
    required String id,
    required String localPath,     // On-device file path
    String? cloudinaryPublicId,    // null until uploaded
    required int exposureNumber,   // 1..24
    required DateTime capturedAt,
    required bool isDeveloped,
    required bool isPublished,
  }) = _Exposure;
}
```

### 5.6 Venue

```dart
@freezed
class Venue with _$Venue {
  const factory Venue({
    required String id,
    required String name,
    required double latitude,
    required double longitude,
    String? walkingDirections,
    String? terrainNote,           // "arena", "asfalto"
  }) = _Venue;
}
```

### 5.7 Seating Assignment

```dart
@freezed
class SeatingAssignment with _$SeatingAssignment {
  const factory SeatingAssignment({
    required String guestUid,
    required String tableName,
    required int seatNumber,
  }) = _SeatingAssignment;
}
```

### 5.8 Weather Info

```dart
@freezed
class WeatherInfo with _$WeatherInfo {
  const factory WeatherInfo({
    required double temperatureCelsius,
    required double windSpeedKmh,
    required double windDirectionDegrees,
    required WindType windType,     // levante, poniente, other
    required String description,
    required String tip,            // Cheeky tip text
  }) = _WeatherInfo;
}

enum WindType { levante, poniente, other }
```

### 5.9 Time-Gated Content

```dart
@freezed
class TimeGatedContent with _$TimeGatedContent {
  const factory TimeGatedContent({
    required String id,
    required String title,
    required ContentType contentType,
    required DateTime unlockAt,
    required String firestoreDocPath,   // Path to the actual content
  }) = _TimeGatedContent;
}

enum ContentType { cocktailMenu, seatingChart, banquetMenu }
```

---

## 6. State Management

### 6.1 Provider Architecture

Riverpod with code generation (`@riverpod` annotations) for type safety and boilerplate reduction.

```
Presentation (Widget)
    │  watches / reads
    ▼
Provider (Riverpod)
    │  calls
    ▼
UseCase
    │  calls
    ▼
Repository (abstract, injected)
    │  implemented by
    ▼
RepositoryImpl
    │  coordinates
    ▼
LocalDataSource ←→ RemoteDataSource
```

### 6.2 Provider Types by Feature

| Feature | Provider Type | Rationale |
|---|---|---|
| Auth state | `StreamProvider<AppUser?>` | Reactive Firebase Auth state changes |
| Current event (hero banner) | `StreamProvider<EventSchedule?>` | Auto-updates as time progresses; timer-driven refresh |
| Weather | `FutureProvider<WeatherInfo>` | Polled periodically (every 30 min), no real-time stream needed |
| Live feed | `StreamProvider<List<FeedPost>>` | Real-time Firestore snapshot listener |
| Notice board | `StreamProvider<List<Notice>>` | Real-time Firestore snapshot listener |
| Camera (exposures) | `AsyncNotifierProvider` | Complex local state: capture, count, develop trigger |
| Guest directory | `FutureProvider` + search `StateProvider` | Fetched once, filtered client-side |
| Profile editing | `AsyncNotifierProvider` | Mutation-heavy (photo upload, field edits) |
| Time-gated content | `Provider<bool>` per content type | Simple computed: `DateTime.now() >= unlockAt` with timer refresh |
| Remote config | `FutureProvider` | Fetched on app start, cached by Firebase SDK |

### 6.3 Either Integration with Riverpod

Providers that invoke use cases will unwrap `Either` results into `AsyncValue`:

```dart
@riverpod
Future<WeatherInfo> weather(Ref ref) async {
  final result = await ref.watch(getWeatherUseCaseProvider).call();
  return result.fold(
    (failure) => throw failure, // Riverpod catches as AsyncError
    (weather) => weather,
  );
}
```

This keeps widget code clean — widgets only handle `AsyncValue<T>` (loading / error / data) via `.when()`.

---

## 7. Firebase Integration

### 7.1 Firestore Data Structure

```
firestore/
├── guests/                         # Pre-loaded guest list
│   └── {uid}/
│       ├── email: string
│       ├── fullName: string
│       ├── photoUrl: string?
│       ├── whatsappNumber: string?
│       ├── funFact: string?
│       ├── relationToGrooms: string
│       ├── relationshipStatus: string
│       ├── side: string
│       ├── profileClaimed: bool
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── feed_posts/                     # Live Feed (Tab 2, View A)
│   └── {postId}/
│       ├── authorUid: string
│       ├── authorName: string
│       ├── authorPhotoUrl: string?
│       ├── imageUrls: string[]     # Cloudinary public IDs
│       ├── caption: string?
│       ├── source: string          # "unfiltered" | "import" | "share_extension"
│       └── createdAt: timestamp
│
├── notices/                        # Notice Board (Tab 2, View B)
│   └── {noticeId}/
│       ├── authorUid: string
│       ├── authorName: string
│       ├── authorPhotoUrl: string?
│       ├── body: string
│       ├── authorWhatsappNumber: string
│       └── createdAt: timestamp
│
├── seating/                        # Seating assignments
│   └── {guestUid}/
│       ├── tableName: string
│       └── seatNumber: number
│
└── time_gated_content/             # Menus, etc.
    └── {contentId}/
        ├── title: string
        ├── type: string
        ├── unlockAt: timestamp
        └── content: map            # Flexible schema per content type
```

### 7.2 Firestore Security Rules (Summary)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Guests: any authenticated user can read; only own profile is writable
    match /guests/{uid} {
      allow read: if request.auth != null;
      allow update: if request.auth.uid == uid
                    && !request.resource.data.diff(resource.data).affectedKeys()
                        .hasAny(['email', 'uid', 'side', 'relationToGrooms']);
      // Prevent guests from changing admin-set fields
    }

    // Feed: authenticated can read; authenticated can create own posts
    match /feed_posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.authorUid == request.auth.uid;
    }

    // Notices: same pattern as feed
    match /notices/{noticeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.authorUid == request.auth.uid;
    }

    // Seating & time-gated: read-only for authenticated users
    match /seating/{uid} {
      allow read: if request.auth != null;
    }
    match /time_gated_content/{id} {
      allow read: if request.auth != null;
    }
  }
}
```

### 7.3 Firebase Remote Config

Used for data that must be updatable without an app release:

| Key | Type | Purpose |
|---|---|---|
| `event_schedule_json` | JSON string | Full event timeline (hero banner, itinerary) |
| `venues_json` | JSON string | Venue list with coordinates and walking directions |
| `time_gates_json` | JSON string | Unlock timestamps for menus/seating |
| `seating_chart_json` | JSON string | Table + seat assignments per guest |
| `quick_contacts_json` | JSON string | Coordinator phone numbers, taxi number |
| `wind_tips_json` | JSON string | Levante/Poniente tip strings |
| `development_trigger_time` | String (ISO 8601) | "Film development" deadline (default: `2025-05-31T05:00:00+02:00`) |

**Fetch strategy:** Fetch on app launch with a minimum interval of 15 minutes. Activate immediately. The app will merge Remote Config values with hardcoded defaults, preferring remote values when available.

---

## 8. Offline-First Strategy

### 8.1 Scope

Only **critical logistical data** is cached offline:

| Data | Offline? | Source |
|---|---|---|
| Event schedule / itinerary | Yes | Remote Config → Drift |
| Venue map data | Yes | Remote Config → Drift |
| Guest directory (names, photos URLs) | Yes | Firestore → Drift |
| Own profile | Yes | Firestore → Drift |
| Seating assignment (own) | Yes | Remote Config / Firestore → Drift |
| Quick contacts | Yes | Remote Config → Drift |
| Live feed photos | No | Streamed from Firestore + Cloudinary CDN |
| Notice board | No | Streamed from Firestore |
| Camera exposures (local files) | Yes | Stored on-device filesystem; metadata in Drift |
| Weather | No | API-fetched, ephemeral |

### 8.2 Drift Database Schema

```dart
// Tables for offline-critical data

class EventSchedules extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get description => text()();
  DateTimeColumn get startTime => dateTime()();
  DateTimeColumn get endTime => dateTime()();
  TextColumn get venueId => text()();
  TextColumn get ctaLabel => text().nullable()();
  TextColumn get ctaDeepLink => text().nullable()();
  IntColumn get dayNumber => integer()();

  @override
  Set<Column> get primaryKey => {id};
}

class Venues extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  RealColumn get latitude => real()();
  RealColumn get longitude => real()();
  TextColumn get walkingDirections => text().nullable()();
  TextColumn get terrainNote => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class CachedGuests extends Table {
  TextColumn get uid => text()();
  TextColumn get fullName => text()();
  TextColumn get photoUrl => text().nullable()();
  TextColumn get side => text()();
  TextColumn get relationToGrooms => text()();
  TextColumn get relationshipStatus => text()();
  TextColumn get whatsappNumber => text().nullable()();
  TextColumn get funFact => text().nullable()();

  @override
  Set<Column> get primaryKey => {uid};
}

class Exposures extends Table {
  TextColumn get id => text()();
  TextColumn get localPath => text()();
  TextColumn get cloudinaryPublicId => text().nullable()();
  IntColumn get exposureNumber => integer()();
  DateTimeColumn get capturedAt => dateTime()();
  BoolColumn get isDeveloped => boolean().withDefault(const Constant(false))();
  BoolColumn get isPublished => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}
```

### 8.3 Sync Strategy

```
┌─────────────────────────────────────────────────┐
│              Repository (e.g., ScheduleRepo)     │
│                                                  │
│   READ:                                          │
│   1. Return Drift (local) data immediately       │
│   2. Fetch from Remote Config / Firestore        │
│   3. If remote succeeds → update Drift → emit    │
│   4. If remote fails → return local (stale OK)   │
│                                                  │
│   WRITE (e.g., profile update):                  │
│   1. Write to Drift immediately (optimistic)     │
│   2. Enqueue Firestore write                     │
│   3. If online → execute immediately             │
│   4. If offline → retry on connectivity change   │
│   5. Conflict: last-write-wins (server timestamp)│
└─────────────────────────────────────────────────┘
```

For offline writes, a simple `PendingWrites` Drift table queues mutations. A `ConnectivityNotifier` (using the `connectivity_plus` package) triggers flush on reconnection.

```dart
class PendingWrites extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get collection => text()();
  TextColumn get documentId => text()();
  TextColumn get payload => text()();  // JSON-encoded
  TextColumn get operation => text()(); // "create" | "update"
  DateTimeColumn get createdAt => dateTime()();
}
```

---

## 9. Media Pipeline

### 9.1 Architecture

```
Guest captures / imports photo
        │
        ▼
┌─────────────────────┐
│ Client-side prep     │
│ • EXIF strip (privacy)│
│ • Resize to max 2048px│
│   on longest edge     │
│ • JPEG quality 85%    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Cloudinary Upload API│
│ • Unsigned preset    │
│ • Folder: wedding/   │
│ • Eager transforms:  │
│   - thumb: 400x400   │
│   - feed: 1080w      │
└─────────┬───────────┘
          │
          ▼
   Returns public_id
          │
          ▼
┌─────────────────────┐
│ Firestore write      │
│ • feed_posts doc     │
│   with public_id(s)  │
└─────────────────────┘
```

### 9.2 Cloudinary URL Construction

The app constructs responsive image URLs on-the-fly:

```dart
String cloudinaryUrl(String publicId, {int width = 1080}) {
  return 'https://res.cloudinary.com/$cloudName/image/upload/'
         'w_$width,c_limit,q_auto,f_auto/$publicId';
}
```

- `q_auto` — automatic quality optimization per device/browser.
- `f_auto` — automatic format negotiation (WebP/AVIF).
- `c_limit` — never upscale, only downscale.

### 9.3 Upload Preset (Cloudinary Console)

Create an **unsigned upload preset** named `wedding_upload`:

- Folder: `wedding/`
- Allowed formats: `jpg, png, heic`
- Max file size: 15 MB
- Eager transformations: `w_400,h_400,c_fill` (thumbnail), `w_1080,c_limit` (feed)
- Moderation: none (trusted guest list)

### 9.4 Camera Exposures (Unfiltered Feature)

1. Photo captured → Saved to app-private directory (`getApplicationDocumentsDirectory()`).
2. **Background Sync:** Immediately uploaded silently to an un-published cloud folder to prevent data loss (app deletion/lost device).
3. Metadata written to Drift `Exposures` table. `isDeveloped = false`.
4. Photo is **not** added to the public feed until development is triggered.
5. Development trigger (24 exposures OR deadline reached) → `isDeveloped = true` for all exposures. The UI reveals the gallery via a 5-second animation.
6. User selects photos to publish → `feed_posts` doc created in Firestore → `isPublished = true` in Drift.

---

## 10. Authentication Flow

### 10.1 "Claim Your Profile" Flow

Since guests are pre-registered in Firestore, authentication is a profile-claiming process:

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│ Welcome Screen│────▶│ Choose Auth Method│────▶│  Auth Process │
│ (app branding)│     │ • Magic Link     │     │              │
│               │     │ • Google Sign-In │     │              │
│               │     │ • Apple Sign-In  │     │              │
└──────────────┘     └──────────────────┘     └──────┬───────┘
                                                      │
                                                      ▼
                                              ┌──────────────┐
                                              │ Cloud Function│
                                              │ onUserCreate  │
                                              │               │
                                              │ 1. Check email│
                                              │    in guests/ │
                                              │ 2. If match → │
                                              │    set claimed│
                                              │    = true     │
                                              │ 3. If no match│
                                              │    → deny     │
                                              └──────┬───────┘
                                                      │
                                                      ▼
                                              ┌──────────────┐
                                              │  App: Profile │
                                              │  Completion   │
                                              │  (photo, bio) │
                                              └──────────────┘
```

### 10.2 Magic Link via Custom Token (Frictionless)

1. Couple/Admin runs a Node.js script (using Firebase Admin SDK) to generate a Custom Auth Token for each `uid` in the allowlist.
2. The custom token is appended to a specialized App Link (`https://bodaentarifa.com/login?token=xyz...`).
3. Guest receives the unique link via WhatsApp and taps it.
4. OS automatically routes the deep link into the Flutter app.
5. App intercepts the token and silently calls `FirebaseAuth.instance.signInWithCustomToken()`.
6. Guest lands instantly inside the Onboarding Setup Wizard (zero friction).

### 10.3 Social Auth (Google / Apple)

Standard `google_sign_in` and `sign_in_with_apple` packages → Firebase credential. Same Cloud Function validation via email match.

### 10.4 Access Control

If a user authenticates with an email not in the pre-loaded guest list, the Cloud Function sets a custom claim `{ "authorized": false }` and the client shows an "Invitation not found" screen. Firestore rules additionally check `request.auth != null` (authorized users always have a matching guest doc).

---

## 11. Push Notifications

### 11.1 FCM Setup

- **iOS:** APNs key configured in Firebase Console.
- **Android:** Default FCM channel.
- Package: `firebase_messaging` + `flutter_local_notifications` for foreground display.

### 11.2 Notification Types

| Type | Trigger | Example |
|---|---|---|
| Event reminder | Cloud Function (scheduled) | "La cena empieza en 30 minutos — ¡es hora de arreglarse!" |
| Content unlock | Cloud Function (scheduled) | "¡La carta de cócteles ya está disponible!" |
| Film developed | Cloud Function (time-based) | "Tu carrete se ha revelado — ¡mira tus fotos!" |
| Admin broadcast | Cloud Function (manual trigger via Firestore write) | "Cambio de planes: nos movemos a Tumbao por el viento" |

### 11.3 Topic Subscription

All authenticated guests subscribe to a `wedding` topic on login. Notifications are sent to this topic via Cloud Functions.

---

## 12. Share Extension (iOS & Android)

### 12.1 iOS Share Extension

A native **Share Extension** target is added to the Xcode project:

- **ShareViewController.swift** — Receives `NSItemProvider` attachments of type `public.image`.
- Writes incoming images to an **App Group** shared container (`UserDefaults` suite or shared directory).
- The Flutter app reads from the shared container on resume via a platform channel or the `receive_sharing_intent` package.

**Key implementation details:**
- App Group must be configured in both the main app and extension targets.
- The extension is a lightweight native UI (or `SLComposeServiceViewController`) — it does not run Flutter.
- On app resume, `share_handler` or `receive_sharing_intent` detects pending images and enqueues them for Cloudinary upload → Firestore `feed_posts` creation.

### 12.2 Android Share Target

Declared via `<intent-filter>` in `AndroidManifest.xml`:

```xml
<intent-filter>
    <action android:name="android.intent.action.SEND" />
    <action android:name="android.intent.action.SEND_MULTIPLE" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="image/*" />
</intent-filter>
```

The `receive_sharing_intent` package handles the intent in Dart land, providing file URIs for the shared images.

### 12.3 Upload Queue

Shared images (from either platform) enter a **background upload queue** managed by a Riverpod `AsyncNotifier`:

1. Images added to queue.
2. Client-side prep (resize, EXIF strip).
3. Sequential upload to Cloudinary.
4. On success → create `feed_posts` doc in Firestore.
5. On failure → retry with exponential backoff (max 3 attempts).
6. Queue state persisted in Drift to survive app kills.

---

## 13. Time-Gated Content

### 13.1 Enforcement Strategy: Server-Side via Cloud Functions

Client-side time checks are unreliable (users can change device time). For critical time-gated content (cocktail menu, seating chart, banquet menu), enforcement is **server-side**:

1. **Firestore Security Rules** validate read access against server timestamps:

```javascript
match /time_gated_content/{id} {
  allow read: if request.auth != null
              && resource.data.unlockAt <= request.time;
}
```

2. The client attempts to read the document. If the server time hasn't passed `unlockAt`, the read is **denied** by Firestore rules.

3. The client uses Remote Config `time_gates_json` (containing unlock timestamps) purely for **UI presentation** (showing countdown timers, greyed-out cards). The actual content is never on-device until the server allows the read.

This is the most reliable approach because:
- `request.time` in Firestore rules is the **server's** timestamp — immune to device clock manipulation.
- No Cloud Function invocation needed per check — it's just a rule evaluation.
- The content payload itself never reaches the client before unlock time.

### 13.2 Client-Side UI

A `TimeGatedCard` widget:

```dart
// Simplified
class TimeGatedCard extends ConsumerWidget {
  final TimeGatedContent content;

  Widget build(BuildContext context, WidgetRef ref) {
    final now = ref.watch(tickerProvider); // Refreshes every second
    final isUnlocked = now.isAfter(content.unlockAt);

    if (!isUnlocked) {
      return LockedCard(
        title: content.title,
        countdown: content.unlockAt.difference(now),
      );
    }

    final asyncContent = ref.watch(timeGatedContentProvider(content.id));
    return asyncContent.when(
      data: (data) => UnlockedContentCard(data: data),
      loading: () => const ShimmerCard(),
      error: (e, _) => ErrorCard(message: e.toString()),
    );
  }
}
```

A `tickerProvider` (1-second interval `Stream`) drives the countdown UI and triggers the Firestore read attempt at unlock time.

---

## 14. Remote Configuration

### 14.1 Update Flow

```
Admin updates Firebase Remote Config in Console
        │
        ▼
App fetches on launch / every 15 min
        │
        ▼
Parse JSON values into domain entities
        │
        ▼
Write to Drift (offline cache)
        │
        ▼
Riverpod providers emit new state → UI rebuilds
```

### 14.2 Updatable Data via Remote Config

| Data | Hardcoded Default | Remote Config Key | Rationale |
|---|---|---|---|
| Event schedule | Yes (in-app JSON asset) | `event_schedule_json` | Times/venues may shift due to weather |
| Venues | Yes | `venues_json` | Walking directions may change |
| Time gate timestamps | Yes | `time_gates_json` | Dinner may run late |
| Seating chart | Yes | `seating_chart_json` | Last-minute seat swaps |
| Quick contacts | Yes | `quick_contacts_json` | Phone numbers could change |
| Wind tips | Yes | `wind_tips_json` | Fun copy updates |
| Film dev deadline | Yes | `development_trigger_time` | Flexibility on reveal time |

Every Remote Config key has a hardcoded default in the app's assets, ensuring the app is fully functional even if Remote Config fetch fails.

---

## 15. Weather Service

### 15.1 Provider: Open-Meteo API

**Why Open-Meteo:**
- Free, no API key required.
- Provides wind speed and direction (critical for Levante/Poniente detection).
- Reliable for European locations.

### 15.2 Endpoint

```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=36.0137
  &longitude=-5.6049
  &current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code
  &timezone=Europe/Madrid
```

### 15.3 Wind Classification

```dart
WindType classifyWind(double directionDegrees) {
  // Levante: East wind, typically 60°–120°
  if (directionDegrees >= 60 && directionDegrees <= 120) {
    return WindType.levante;
  }
  // Poniente: West wind, typically 240°–300°
  if (directionDegrees >= 240 && directionDegrees <= 300) {
    return WindType.poniente;
  }
  return WindType.other;
}
```

### 15.4 Polling Strategy

- Fetch on Home screen load.
- Refresh every 30 minutes via a Riverpod `Timer`.
- No offline cache — weather data is ephemeral and stale data is misleading.

---

## 16. Networking & Error Handling

### 16.1 Either Pattern

All repository methods return `Either<Failure, T>` from `fpdart`:

```dart
typedef FutureEither<T> = Future<Either<Failure, T>>;
```

### 16.2 Failure Hierarchy

```dart
sealed class Failure {
  final String message;
  final StackTrace? stackTrace;
  const Failure(this.message, [this.stackTrace]);
}

class ServerFailure extends Failure {
  const ServerFailure(super.message, [super.stackTrace]);
}

class CacheFailure extends Failure {
  const CacheFailure(super.message, [super.stackTrace]);
}

class NetworkFailure extends Failure {
  const NetworkFailure(super.message, [super.stackTrace]);
}

class AuthFailure extends Failure {
  const AuthFailure(super.message, [super.stackTrace]);
}

class PermissionFailure extends Failure {
  const PermissionFailure(super.message, [super.stackTrace]);
}
```

### 16.3 Repository Pattern

```dart
class WeatherRepositoryImpl implements WeatherRepository {
  final WeatherRemoteDataSource _remote;
  final NetworkInfo _networkInfo;

  @override
  FutureEither<WeatherInfo> getWeather() async {
    if (!await _networkInfo.isConnected) {
      return const Left(NetworkFailure('Sin conexión a Internet'));
    }
    try {
      final weather = await _remote.fetchCurrentWeather();
      return Right(weather);
    } on ServerException catch (e, st) {
      return Left(ServerFailure(e.message, st));
    }
  }
}
```

---

## 17. Security Considerations

| Concern | Mitigation |
|---|---|
| Unauthorized access | Firebase Auth + Firestore rules. Only pre-registered emails can claim profiles. |
| Time-gate bypass | Server-side enforcement via Firestore `request.time` rules. |
| Photo content | Cloudinary unsigned preset restricted to allowed formats/sizes. No moderation needed (trusted guest list). |
| EXIF / location data | Stripped client-side before upload to protect guest privacy. |
| Firestore writes | Rules enforce `authorUid == request.auth.uid` on creates. Admin fields (`side`, `relationToGrooms`) are write-protected. |
| API keys | Cloudinary cloud name + unsigned preset name are safe to embed (unsigned presets are designed for client-side use). Weather API requires no key. |
| Deep links (magic link) | Validated via Firebase Auth SDK; link is single-use and time-limited. |

---

## 18. Third-Party Dependencies

### Core

| Package | Version (approx) | Purpose |
|---|---|---|
| `flutter_riverpod` / `riverpod_annotation` | ^2.x | State management |
| `riverpod_generator` | ^2.x | Code gen for providers |
| `freezed` / `freezed_annotation` | ^2.x | Immutable data models |
| `json_annotation` / `json_serializable` | ^6.x | JSON serialization |
| `fpdart` | ^1.x | `Either`, functional utilities |
| `drift` / `drift_dev` | ^2.x | SQLite (offline-first) |
| `sqlite3_flutter_libs` | latest | SQLite native binaries |
| `go_router` | ^14.x | Declarative routing |

### Firebase

| Package | Purpose |
|---|---|
| `firebase_core` | Firebase initialization |
| `firebase_auth` | Authentication |
| `cloud_firestore` | Remote database |
| `firebase_remote_config` | Remote configuration |
| `firebase_messaging` | Push notifications (FCM) |
| `flutter_local_notifications` | Foreground notification display |

### Media & Camera

| Package | Purpose |
|---|---|
| `camera` | Camera hardware access (Unfiltered feature) |
| `image_picker` | Photo library import |
| `cloudinary_public` | Unsigned uploads to Cloudinary |
| `cached_network_image` | Image caching & loading |
| `receive_sharing_intent` | iOS/Android share extension handling |

### Utilities

| Package | Purpose |
|---|---|
| `connectivity_plus` | Network state detection |
| `url_launcher` | WhatsApp deep links, phone calls, maps |
| `build_runner` | Code generation runner |
| `path_provider` | App-private file storage (camera exposures) |
| `flutter_svg` | SVG rendering (custom map) |
| `permission_handler` | Camera, photo library, notification permissions |

---

## 19. Cloud Functions

All functions are 2nd generation (Cloud Functions for Firebase v2), written in TypeScript.

### 19.1 Function Inventory

| Function | Trigger | Description |
|---|---|---|
| `onUserCreate` | `auth.user().onCreate` | Validates new user email against `guests` collection. Sets `profileClaimed = true` if match, sets custom claims. Denies unauthorized emails. |
| `sendEventReminder` | `scheduler.onSchedule` | Sends FCM to `wedding` topic at configured times before each event. |
| `sendContentUnlockNotification` | `scheduler.onSchedule` | Sends FCM when time-gated content unlocks (cocktail menu, seating, banquet). |
| `triggerFilmDevelopment` | `scheduler.onSchedule` | At 05:00 AM May 31st, sends FCM to all users who haven't used all 24 exposures, notifying them their film is developed. |
| `cleanupExpiredMagicLinks` | `scheduler.onSchedule` (daily) | Housekeeping: removes expired pending auth states. |

### 19.2 Scheduled Notifications Configuration

Event reminders and content unlock notifications are driven by a config file deployed with the functions. Times are defined in `Europe/Madrid` timezone.

```typescript
// functions/src/config/notifications.ts
export const scheduledNotifications = [
  {
    id: 'welcome_party_reminder',
    cronExpression: '0 19 29 5 *',  // May 29 at 19:00
    title: '¡Bienvenidos a Tarifa!',
    body: 'La fiesta de bienvenida empieza en 1 hora en Tumbao 🎉',
  },
  {
    id: 'cocktail_menu_unlock',
    cronExpression: '30 19 30 5 *',  // May 30 at 19:30
    title: '🍸 ¡La carta de cócteles!',
    body: 'Ya puedes ver la carta de cócteles. Abre la app.',
  },
  // ... etc
];
```

---

## 20. Implementation Phases

### Phase 1 — Foundation (Estimated: ~2 weeks)

- [ ] Project scaffolding: folder structure, linting, analysis options.
- [ ] Core setup: Drift database, Riverpod bootstrap, GoRouter skeleton, theme system.
- [ ] Firebase integration: `firebase_core`, Auth, Firestore, Remote Config, FCM.
- [ ] Authentication flow: Magic Link + Google + Apple Sign-In, `onUserCreate` Cloud Function, profile claiming.
- [ ] Error handling framework: `Failure` hierarchy, `Either` typedefs, base repository pattern.

### Phase 2 — Core Features (Estimated: ~3 weeks)

- [ ] **Home tab:** Hero banner (dynamic current event), weather widget (Open-Meteo + Levante/Poniente), quick action buttons.
- [ ] **Itinerary tab:** Master timeline, custom map (SVG-based, pinch-to-zoom), time-gated content cards with server-side enforcement.
- [ ] **Guest directory tab:** Grid view, filter chips, guest profile view, profile self-editing (photo upload via Cloudinary).
- [ ] Remote Config integration: schedule, venues, seating, time gates.
- [ ] Offline-first sync for critical data (schedule, venues, directory, seating).

### Phase 3 — Camera & Community (Estimated: ~3 weeks)

- [ ] **Unfiltered camera:** Retro viewfinder UI, rear-camera-only, exposure counter, local storage in Drift, development trigger logic (24 exposures OR server time deadline).
- [ ] **Development Room:** Private gallery, multi-select publish to feed.
- [ ] **Live Feed:** Firestore-backed scrolling feed, Cloudinary image rendering, in-app photo import (image picker).
- [ ] **Notice Board:** Text posts, WhatsApp deep-link button.
- [ ] Cloudinary upload pipeline: client-side prep, upload, Firestore doc creation.

### Phase 4 — Share Extension & Notifications (Estimated: ~2 weeks)

- [ ] **iOS Share Extension:** Native Swift target, App Group shared container, platform channel bridge.
- [ ] **Android Share Target:** Intent filter, `receive_sharing_intent` integration.
- [ ] Background upload queue with Drift persistence and retry logic.
- [ ] **FCM notifications:** Topic subscription, scheduled Cloud Functions for event reminders and content unlock alerts.
- [ ] Film development notification Cloud Function.

### Phase 5 — Polish & QA (Estimated: ~1-2 weeks)

- [ ] UI polish: animations, transitions, loading states, empty states, error states.
- [ ] Edge case testing: offline scenarios, time-zone correctness, large photo uploads on slow connections.
- [ ] Firestore security rules hardening and testing.
- [ ] Performance profiling: image loading, list scrolling, SQLite query optimization.
- [ ] TestFlight / Internal testing distribution.

---

## Appendix A: Navigation & Routing

### GoRouter Configuration

```dart
final router = GoRouter(
  initialLocation: '/home',
  redirect: (context, state) {
    final isLoggedIn = /* auth state check */;
    if (!isLoggedIn) return '/welcome';
    return null;
  },
  routes: [
    GoRoute(path: '/welcome', builder: (_, __) => const WelcomeScreen()),
    StatefulShellRoute.indexedStack(
      builder: (_, __, navigationShell) => AppScaffold(navigationShell),
      branches: [
        StatefulShellBranch(routes: [
          GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: '/community', builder: (_, __) => const CommunityScreen()),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: '/camera', builder: (_, __) => const CameraScreen()),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: '/itinerary', builder: (_, __) => const ItineraryScreen()),
          GoRoute(path: '/itinerary/map', builder: (_, __) => const MapScreen()),
          GoRoute(path: '/itinerary/menu/:id', builder: (_, state) => MenuScreen(id: state.pathParameters['id']!)),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: '/directory', builder: (_, __) => const DirectoryScreen()),
          GoRoute(path: '/directory/:uid', builder: (_, state) => GuestProfileScreen(uid: state.pathParameters['uid']!)),
          GoRoute(path: '/directory/me', builder: (_, __) => const MyProfileScreen()),
        ]),
      ],
    ),
  ],
);
```

### Bottom Navigation Bar

5 tabs with the center camera button visually elevated (FAB-style):

| Index | Label | Icon | Route |
|---|---|---|---|
| 0 | Inicio | `home` | `/home` |
| 1 | Comunidad | `people` | `/community` |
| 2 | Cámara | `camera_alt` (FAB) | `/camera` |
| 3 | Agenda | `calendar_today` | `/itinerary` |
| 4 | Invitados | `contacts` | `/directory` |

---

## Appendix B: WhatsApp Deep Linking

Used in the Notice Board and Guest Profiles:

```dart
void openWhatsApp(String phoneNumber, {String? message}) {
  final encodedMessage = message != null ? Uri.encodeComponent(message) : '';
  final url = 'https://wa.me/$phoneNumber?text=$encodedMessage';
  launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
}
```

Phone numbers must be stored in international format without `+` (e.g., `34612345678`).

---

## Appendix C: Mapbox GL Offline Map Strategy

The PRD specifies a "custom-illustrated, pinch-to-zoom map" that must work offline. Implementation:

1. **Map Technology:** Use `mapbox_maps_flutter`. Mapbox allows uploading the custom illustration as a static Image Overlay positioned over precise geographical coordinates via Mapbox Studio.
2. **Friction Reduction (Offline Tiles):** To handle Tarifa's poor cell service, the app must initiate a background download of the required offline tile region payload during the Onboarding flow.
3. **Features:** This provides the native "blue dot" GPS location natively, allowing the app time-gated markers to dynamically point accurately over the custom illustration.
4. **Fallback:** If routing isn't possible, markers provide hardcoded paths or simple "Cómo llegar" buttons linking to native OS map apps as a last resort.
