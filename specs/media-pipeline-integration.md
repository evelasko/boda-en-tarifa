# Media Pipeline Integration — End-to-End Spec

> **Version:** 1.0
> **Date:** 2026-03-01
> **Issue:** MFC-24
> **Workstreams:** Flutter App, Cloudinary (CDN), Firebase Firestore

This document describes the complete media pipeline from photo capture or import through to the public feed. It is the single source of truth for how the three ingestion flows (Unfiltered Camera, In-App Import, Share Extension) interact across workstreams.

For Cloudinary configuration, upload presets, and URL construction, see:

- `specs/cloudinary-media-pipeline.md` (MFC-20) — the authoritative reference for all Cloudinary operations

For implementation details, see:

- `app/specs/technical-architecture.md` — Sections 9.1–9.4 (Media Pipeline), Section 12 (Share Extension)
- `app/specs/developer-journeys.md` — Epic 3 (Community Feed), Epic 4 (Unfiltered Camera)

---

## 1. Overview

The media pipeline has three entry points but a single output: the `feed_posts` collection in Firestore, which powers the Live Feed (Tab 2). Each entry point shares the same client-side processing, Cloudinary upload, and Firestore write steps, but differs in trigger, lifecycle, and offline handling.

```
                    ┌──────────────┐
                    │ Unfiltered   │  source="unfiltered"
                    │ Camera       │  (two-stage: backup → develop → publish)
                    │ (Tab 3)      │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │              │
┌──────────────┐    │  Shared      │    ┌──────────────┐
│ In-App       │───▶│  Pipeline    │◀───│ Share        │
│ Import       │    │              │    │ Extension    │
│ (Tab 2, "+") │    │ 1. EXIF strip│    │ (OS share)   │
└──────────────┘    │ 2. Resize    │    └──────────────┘
  source="import"   │ 3. Compress  │      source="share_extension"
                    │ 4. Upload    │
                    │ 5. Firestore │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ feed_posts   │
                    │ (Firestore)  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Live Feed    │
                    │ (Tab 2)      │
                    └──────────────┘
```

---

## 2. Shared Processing Pipeline

All three flows pass images through the same client-side preparation before upload:

### Step 1 — EXIF Stripping

Remove all EXIF metadata (GPS coordinates, device identifiers, timestamps) before upload. This is critical for guest privacy.

### Step 2 — Resize

Scale to a maximum of 2048 pixels on the longest edge. Never upscale. This prevents uploading 12MP+ originals while preserving enough detail for all Cloudinary transformations.

### Step 3 — Compress

Re-encode as JPEG at 85% quality. Balances file size and visual fidelity.

### Step 4 — Cloudinary Upload

Upload to Cloudinary using the unsigned `wedding_upload` preset. See `specs/cloudinary-media-pipeline.md` Sections 2–3 for preset configuration and upload code.

The upload returns a `public_id` (e.g., `sunset_beach_a7xk2m`). This is the only value stored in Firestore — URLs are constructed at render time.

### Step 5 — Firestore Write

Create a document in `feed_posts` with the `public_id`, author info, source label, and server timestamp. See Section 5 for the full schema.

---

## 3. Flow 1 — Unfiltered Camera (Two-Stage)

The Unfiltered Camera is the only flow with a two-stage lifecycle: photos are silently backed up immediately but not published to the feed until the "film" is developed.

```
Capture (1 of 24)
      │
      ├──────────────────────────┐
      │                          │
      ▼                          ▼
Save to local disk         Background upload
(app documents dir)        to Cloudinary (silent)
      │                          │
      ▼                          ▼
Write to Drift             Store public_id
Exposures table            in Drift when complete
(isDeveloped=false,
 isPublished=false)
      │
      ▼
... repeat for exposures 2–24 ...
      │
      ▼
Development trigger fires
(24th photo OR 05:00 AM May 31)
      │
      ▼
Mark all exposures isDeveloped=true
      │
      ▼
5-second unskippable animation
      │
      ▼
Private gallery revealed
      │
      ▼
Guest selects photos to publish
      │
      ▼
For each selected:
  1. Create feed_posts doc (source="unfiltered")
  2. Update Drift: isPublished=true
```

### 3.1 Capture

- Tab 3 presents a retro viewfinder. Front-facing camera is disabled. No filters or editing.
- Camera controller is pre-initialized in the background before the user navigates to Tab 3.
- A counter shows remaining exposures (e.g., "7/24 Exposures").

### 3.2 Background Sync (Silent Backup)

Immediately after capture, the processed image is uploaded to Cloudinary in the background. This happens silently — the guest sees no upload UI. The purpose is data loss prevention: if the phone is lost or the app is deleted, the photos exist in Cloudinary.

- Uses `workmanager` (or similar background task scheduler) to continue uploads when the app is backgrounded.
- The upload does NOT publish to the feed. The image exists only in Cloudinary and in the local Drift database.
- When the upload completes, `cloudinaryPublicId` is updated in the Drift `exposures` row.

### 3.3 Development Trigger

All exposures are marked `isDeveloped = true` when either condition is met:

1. The guest takes their 24th photo, OR
2. The clock reaches the configured deadline

The deadline is `05:00 AM on May 31, 2026` by default, configurable via Firebase Remote Config key `development_trigger_time`.

After triggering:

1. A 5-second unskippable "developing film" animation plays.
2. The private gallery is revealed, showing all 24 (or fewer) exposures.
3. The camera resets for a new roll.

### 3.4 Publishing

From the private gallery, the guest selects which photos to publish via multi-select checkboxes. For each selected photo:

1. A `feed_posts` document is created in Firestore with `source = "unfiltered"`.
2. The Drift record is updated: `isPublished = true`.

---

## 4. Flow 2 — In-App Import

The import flow publishes immediately (no two-stage lifecycle).

```
Guest taps "+" on Live Feed (Tab 2)
      │
      ▼
Native photo picker opens
(iOS Photo Library / Android Gallery)
      │
      ▼
Selected photos go through shared pipeline
(EXIF strip → resize → compress → upload → Firestore)
      │
      ▼
feed_posts doc created (source="import")
      │
      ▼
Photo appears in Live Feed immediately
```

If the device is offline, the upload is queued (see Section 7).

---

## 5. Flow 3 — Share Extension

The share extension allows guests to publish photos from their native Photos app without opening Boda en Tarifa.

```
Guest shares from native Photos app
      │
      ▼
Boda en Tarifa appears as share target
      │
      ├─── auto-publish granted? ────┐
      │         YES                  │  NO
      ▼                              ▼
Process and publish             Save to Private
directly                        Collection in-app
(source="share_extension")      (for manual review)
```

### 5.1 Platform Implementation

| Platform | Mechanism | Data handoff |
|----------|-----------|--------------|
| iOS | Native Share Extension target writes to App Group shared container | `receive_sharing_intent` reads on resume |
| Android | `<intent-filter>` for `action.SEND` / `action.SEND_MULTIPLE` on `image/*` | Intent data read on app resume |

### 5.2 Auto-Publish Permission

During onboarding, guests choose whether to enable auto-publish for shared photos:

- **Enabled:** Shared photos go through the full pipeline and appear in the feed automatically.
- **Disabled:** Shared photos are saved to the guest's Private Collection within the app. The guest can review and manually publish later.

---

## 6. Data Contracts

### 6.1 Firestore `feed_posts` Document

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `authorUid` | `string` | Yes | Firebase Auth UID of the publishing guest |
| `authorName` | `string` | Yes | Denormalized from `guests` at write time |
| `authorPhotoUrl` | `string` | No | Denormalized from `guests` at write time |
| `imageUrls` | `string[]` | Yes | Cloudinary `public_id` values (not full URLs) |
| `caption` | `string` | No | Max 500 characters |
| `source` | `string` | Yes | `"unfiltered"`, `"import"`, or `"share_extension"` |
| `isHidden` | `bool` | Yes | Default `false`. Toggled by author or admin to hide from feed |
| `createdAt` | `timestamp` | Yes | Firestore server timestamp |

### 6.2 Drift `exposures` Table (Local)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | `int` | No | Auto-incrementing primary key |
| `localPath` | `string` | No | Path in app's private documents directory |
| `cloudinaryPublicId` | `string` | Yes | Null until background upload completes |
| `exposureNumber` | `int` | No | 1–24 within the current roll |
| `capturedAt` | `datetime` | No | When the photo was taken |
| `isDeveloped` | `bool` | No | `false` until development trigger fires |
| `isPublished` | `bool` | No | `false` until guest publishes to feed |

### 6.3 Cloudinary Upload Response (Relevant Fields)

| Field | Type | Description |
|-------|------|-------------|
| `public_id` | `string` | Unique identifier — stored in Firestore and Drift |
| `secure_url` | `string` | Full HTTPS URL to original — do NOT store (construct dynamically) |
| `format` | `string` | File format after upload (e.g., `jpg`) |
| `width` | `int` | Image width in pixels |
| `height` | `int` | Image height in pixels |

For full Cloudinary upload and URL construction patterns, see `specs/cloudinary-media-pipeline.md` Sections 3–4.

---

## 7. Offline Behavior

### 7.1 Upload Queue Architecture

All three flows share a single upload queue implemented as a Riverpod `AsyncNotifier`. The queue is persisted in Drift so pending uploads survive app restarts.

```
Photo ready for upload
      │
      ▼
Connectivity check (connectivity_plus)
      │
      ├─── Online ──────┐
      │                  │
      ▼                  ▼
Enqueue in Drift    Upload immediately
      │                  │
      ▼                  ▼
Wait for             On success: update Drift
connectivity              with public_id
change event         On failure: re-enqueue
      │
      ▼
Network restored →
  drain queue with
  exponential backoff
  (max 3 retries per item)
```

### 7.2 Per-Flow Offline Behavior

| Flow | Offline behavior |
|------|-----------------|
| **Unfiltered Camera** | Photo saved locally. Background sync queues the Cloudinary upload. Drift record written immediately with `cloudinaryPublicId = null`. Upload retries automatically when connectivity returns. |
| **In-App Import** | Upload queued. A global, dismissible "X items waiting for Wi-Fi" banner appears in the app shell. Firestore write deferred until upload succeeds. |
| **Share Extension** | Photo saved to Private Collection or queued for auto-publish. Same "waiting for Wi-Fi" banner. |

### 7.3 Retry Strategy

- Exponential backoff: 1s, 2s, 4s
- Maximum 3 automatic retries per upload
- After 3 failures, the item remains in the queue but is not retried until the next connectivity change event
- The `connectivity_plus` package detects network state changes and triggers a queue drain

---

## 8. Moderation

The moderation model is **hide, not delete**. Photos are never permanently removed from Cloudinary or Firestore.

### 8.1 Hiding a Post

- **Who can hide:** The post author OR any admin
- **Mechanism:** Toggle `isHidden` to `true` on the `feed_posts` document
- **Firestore rule enforcement:** Update is restricted to the `isHidden` field only, by the post author or an admin (see `firebase/firestore.rules`)

```
// Firestore security rule (already implemented)
allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isHidden'])
  && (resource.data.authorUid == request.auth.uid || isAdmin());
```

### 8.2 Feed Query

The Live Feed query excludes hidden posts:

```
feed_posts
  .where('isHidden', '==', false)
  .orderBy('createdAt', descending: true)
  .limit(15)  // paginate in batches of 10–15
```

### 8.3 Deletion

Deletion is permanently disabled at the Firestore rules level (`allow delete: if false`). This prevents accidental or malicious data loss. If a post must be removed entirely, it requires direct Firestore Admin SDK access.

---

## 9. Feed Display

### 9.1 Pagination

The Live Feed loads posts in batches of 10–15, ordered by `createdAt` descending. Subsequent pages use Firestore cursor-based pagination (start after the last document of the previous page).

### 9.2 Image Rendering

Images are rendered using Cloudinary URL transformations constructed from the `public_id`:

| Context | Transformation | Purpose |
|---------|---------------|---------|
| Feed card | `w_1080,c_limit,q_auto,f_auto` | Full-width image optimized for device |
| Thumbnail grid | `w_400,h_400,c_fill,q_auto,f_auto` | Square crop for grid layouts |

See `specs/cloudinary-media-pipeline.md` Section 4 for URL construction code in Dart and TypeScript.

### 9.3 Progressive Loading

Use `cached_network_image` to:

1. Show a low-resolution placeholder (small thumbnail URL)
2. Fade into the full-resolution image once loaded
3. Cache aggressively — Cloudinary URLs are immutable once generated

---

## 10. Workstream Responsibilities

### Flutter App

| Responsibility | Details |
|----------------|---------|
| Camera capture | Tab 3 retro viewfinder, front camera disabled, exposure counter |
| Client-side processing | EXIF strip, resize to 2048px, JPEG 85% |
| Cloudinary upload | `cloudinary_public` package, unsigned `wedding_upload` preset |
| Local storage | Drift `exposures` table for camera; upload queue for all flows |
| Background sync | `workmanager` for silent camera backups |
| Feed display | Firestore query with pagination, Cloudinary URL construction |
| Share extension | iOS App Group + `receive_sharing_intent`; Android intent filter |
| Offline handling | `connectivity_plus` for detection, Drift-persisted upload queue |
| Moderation (guest) | Toggle `isHidden` on own posts |

### Cloudinary

| Responsibility | Details |
|----------------|---------|
| Upload preset | `wedding_upload` — unsigned, `wedding/` folder, `jpg/png/heic` only |
| Image delivery | Lazy transforms, CDN-cached permanently |
| Format negotiation | `f_auto` serves WebP/AVIF per browser capability |
| Quality optimization | `q_auto` per-image quality/size tradeoff |

### Firebase (Firestore)

| Responsibility | Details |
|----------------|---------|
| `feed_posts` collection | Stores published photo metadata with `public_id` references |
| Security rules | Auth-gated reads, author-matched creates, `isHidden`-only updates, no deletes |
| Pagination support | `createdAt` index for ordered, cursor-based queries |

### Dashboard (Next.js) — Future

| Responsibility | Details |
|----------------|---------|
| Feed moderation | View all posts, toggle `isHidden` for any post |
| Analytics | Upload counts by source, hidden post counts |
| Bulk operations | Admin-level Cloudinary operations via signed API |

---

## 11. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Guest takes 24th photo while offline | Development trigger fires locally. Drift marks all `isDeveloped = true`. Uploads continue queuing in background. Firestore writes deferred until connectivity restored. |
| App killed during background upload | `workmanager` reschedules the upload on next app launch. Drift record retains `cloudinaryPublicId = null` as the signal to retry. |
| Guest publishes photo before upload completes | Not possible — the publish UI only shows photos with a valid `cloudinaryPublicId`. Photos still uploading show a sync indicator. |
| Duplicate upload (retry sends same image twice) | Cloudinary's `unique_filename: true` ensures each upload gets a unique `public_id`. The Drift queue uses idempotency keys to prevent duplicate Firestore writes. |
| Development deadline passes while app is closed | On next app launch, the app checks the current time against `development_trigger_time` from Remote Config. If past, it triggers development immediately. |
| Guest uninstalls and reinstalls the app | Camera exposures are lost locally, but photos uploaded to Cloudinary via background sync are preserved. The Drift database is lost, so the camera starts a fresh roll. |
