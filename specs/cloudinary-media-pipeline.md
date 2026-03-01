# Cloudinary Media Pipeline — Cross-Workstream Reference

> **Version:** 1.0
> **Date:** 2026-02-28
> **Issue:** MFC-20
> **Workstreams:** Flutter App, Web Dashboard (Next.js), Firebase Cloud Functions

This document is the single source of truth for Cloudinary configuration, upload patterns, and URL construction across all workstreams. Every developer working on media features should read this first.

For architectural context, see:

- `app/specs/technical-architecture.md` — Sections 9.1–9.4 (Media Pipeline)
- `app/specs/developer-journeys.md` — Live Feed with Cloudinary

---

## 1. Account & Credentials

| Credential | Value | Where used |
|---|---|---|
| Cloud Name | `bodaentarifa` | All workstreams |
| API Key | (see workstream `.env` files) | Web dashboard, Cloud Functions |
| API Secret | (see workstream `.env` files) | Web dashboard, Cloud Functions |

The **Cloud Name** is safe to embed in client-side code. The **API Key** and **API Secret** must never appear in client-side code (Flutter app or browser JS). They are only used in server-side contexts (Cloud Functions, Next.js Route Handlers).

### Environment variables by workstream

| Workstream | File | Variables |
|---|---|---|
| Flutter App | `app/.env` | `CLOUDINARY_CLOUD_NAME` |
| Web Dashboard | `web/.env.local` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Cloud Functions | `functions/.env` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |

---

## 2. Upload Preset

The project uses a single **unsigned upload preset** named `wedding_upload`. Unsigned means the Flutter app can upload directly to Cloudinary without routing through a backend or exposing the API Secret.

### Current configuration

```
name:                                wedding_upload
unsigned:                            true
overwrite:                           false
use_filename:                        true
unique_filename:                     true
use_filename_as_display_name:        true
use_asset_folder_as_public_id_prefix: false
type:                                upload
asset_folder:                        wedding/
allowed_formats:                     jpg, png, heic
```

### Key behaviours

- **`asset_folder: wedding/`** — All uploads are organized under the `wedding` folder in the Cloudinary Media Library. This is DAM-level metadata only; the folder is **not** part of the `public_id` or the delivery URL.
- **`use_filename: true` + `unique_filename: true`** — The original filename is preserved as a base, with a random suffix appended to guarantee uniqueness (e.g., `sunset_beach_a7xk2m`).
- **`allowed_formats: jpg, png, heic`** — Other formats (GIF, BMP, TIFF, etc.) are rejected at upload time. HEIC is included because modern iPhones capture in HEIC by default; Cloudinary converts it to a web-friendly format on delivery.
- **No eager transformations** — Transforms are generated lazily on first access and then CDN-cached permanently. This is sufficient for the expected guest count. See Section 4 for details.

### Modifying the preset

The Cloudinary Console UI does not expose all preset fields. Use the **Admin API** to modify the preset:

```bash
curl -X PUT \
  "https://api.cloudinary.com/v1_1/bodaentarifa/upload_presets/wedding_upload" \
  -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET" \
  -d "unsigned=true" \
  -d "overwrite=false" \
  -d "use_filename=true" \
  -d "unique_filename=true" \
  -d "use_filename_as_display_name=true" \
  -d "use_asset_folder_as_public_id_prefix=false" \
  -d "type=upload" \
  -d "asset_folder=wedding/" \
  -d "allowed_formats=jpg,png,heic"
```

> **Warning:** The PUT endpoint **replaces** all settings — it does not merge. Always send the complete configuration.

To read the current configuration:

```bash
curl -s "https://api.cloudinary.com/v1_1/bodaentarifa/upload_presets/wedding_upload" \
  -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET"
```

---

## 3. Uploading Images

### 3.1 Flutter App (unsigned upload)

The app uses the [`cloudinary_public`](https://pub.dev/packages/cloudinary_public) package for unsigned uploads. No API Secret is needed.

```dart
import 'package:cloudinary_public/cloudinary_public.dart';

final cloudinary = CloudinaryPublic('bodaentarifa', 'wedding_upload');

Future<String> uploadPhoto(File imageFile) async {
  final response = await cloudinary.uploadFile(
    CloudinaryFile.fromFile(
      imageFile.path,
      tags: ['guest_upload'],
    ),
  );
  return response.publicId; // e.g. "sunset_beach_a7xk2m"
}
```

The returned `publicId` is what gets stored in Firestore (`feed_posts.imageUrls`, `guests.photoUrl`, etc.) and used for URL construction.

### 3.2 Web Dashboard / Cloud Functions (signed upload)

Server-side code uses the full API credentials for signed operations (admin uploads, bulk deletion, etc.). Use the Cloudinary Node.js SDK or direct REST calls:

```typescript
// Using the REST API directly
const formData = new FormData();
formData.append('file', fileBuffer);
formData.append('upload_preset', 'wedding_upload');
formData.append('api_key', process.env.CLOUDINARY_API_KEY);
// For signed uploads, also generate and append a signature

const response = await fetch(
  `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  { method: 'POST', body: formData }
);
```

For admin operations that don't use the preset (e.g., deleting test uploads), the API Key and Secret authenticate directly.

### 3.3 Upload response

A successful upload returns a JSON response. The fields relevant to this project:

```json
{
  "public_id": "sunset_beach_a7xk2m",
  "format": "jpg",
  "width": 2048,
  "height": 1536,
  "bytes": 60193,
  "asset_folder": "wedding",
  "secure_url": "https://res.cloudinary.com/bodaentarifa/image/upload/v1772316197/sunset_beach_a7xk2m.jpg"
}
```

- **`public_id`** — Store this in Firestore. It does **not** include the `wedding/` folder prefix.
- **`secure_url`** — The HTTPS URL to the original, untransformed image. Do not store this; construct URLs dynamically instead (see Section 4).

---

## 4. URL Construction

All workstreams construct image URLs dynamically from a `public_id` using the same pattern:

```
https://res.cloudinary.com/bodaentarifa/image/upload/{transformations}/{public_id}
```

### 4.1 Transformation presets

| Use case | Transformation string | Example dimensions |
|---|---|---|
| Feed (full-width) | `w_1080,c_limit,q_auto,f_auto` | 1080px wide, aspect ratio preserved |
| Thumbnail (grid/avatar) | `w_400,h_400,c_fill,q_auto,f_auto` | 400×400px square crop |
| Responsive (arbitrary) | `w_{width},c_limit,q_auto,f_auto` | Any width, aspect ratio preserved |

### 4.2 Transformation parameters explained

| Parameter | Meaning |
|---|---|
| `w_{n}` | Target width in pixels |
| `h_{n}` | Target height in pixels |
| `c_limit` | Scale down to fit within dimensions; never upscale |
| `c_fill` | Crop to exact dimensions, centering on the most interesting region |
| `q_auto` | Automatic quality optimization — Cloudinary picks the best quality/size tradeoff per image |
| `f_auto` | Automatic format negotiation — serves WebP or AVIF when the browser supports it, JPEG otherwise |

### 4.3 Implementation by workstream

**Flutter (Dart):**

```dart
const _cloudName = 'bodaentarifa';

String cloudinaryUrl(String publicId, {int width = 1080}) {
  return 'https://res.cloudinary.com/$_cloudName/image/upload/'
         'w_$width,c_limit,q_auto,f_auto/$publicId';
}

String cloudinaryThumbnailUrl(String publicId, {int size = 400}) {
  return 'https://res.cloudinary.com/$_cloudName/image/upload/'
         'w_$size,h_$size,c_fill,q_auto,f_auto/$publicId';
}
```

**Next.js / TypeScript:**

```typescript
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? 'bodaentarifa';

export function cloudinaryUrl(publicId: string, width = 1080): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},c_limit,q_auto,f_auto/${publicId}`;
}

export function cloudinaryThumbnailUrl(publicId: string, size = 400): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${size},h_${size},c_fill,q_auto,f_auto/${publicId}`;
}
```

### 4.4 How lazy transformations work

Transforms are **not** pre-generated at upload time. Instead:

1. The app requests an image URL with transformation parameters (e.g., `w_1080,c_limit,q_auto,f_auto`)
2. On the **first request**, Cloudinary generates the transform on-the-fly (~1–2 seconds)
3. The result is **CDN-cached permanently** — all subsequent requests are served instantly from the edge
4. `f_auto` negotiates the format per browser: a Chrome user gets WebP, a Safari user gets AVIF or JPEG, etc.

This approach is appropriate for the expected guest count. If latency on first access ever becomes a concern, eager transforms can be added via the Admin API (see Appendix A).

---

## 5. Firestore Integration

The `public_id` is the only Cloudinary-related value stored in Firestore. URLs are always constructed at render time.

| Collection | Field | Type | Example value |
|---|---|---|---|
| `guests` | `photoUrl` | `string` | `"profile_enrique_x8k2a"` |
| `feed_posts` | `imageUrls` | `string[]` | `["sunset_a7xk2m", "beach_b3jk9p"]` |

### Why store `public_id` instead of full URLs?

- **Flexibility** — Transformation parameters can change without migrating data
- **Responsive** — Different widths can be generated from the same `public_id`
- **Format negotiation** — `f_auto` selects the best format per browser at delivery time
- **Smaller documents** — A `public_id` is ~20 characters vs. a full URL at ~100+

---

## 6. Client-Side Image Preparation (Flutter App)

Before uploading, the Flutter app should prepare images to reduce upload size and protect privacy:

1. **Strip EXIF metadata** — Remove GPS coordinates and camera metadata
2. **Resize to max 2048px** on the longest edge — No need to upload a 12MP original
3. **JPEG quality 85%** — Good balance between quality and file size

This preparation happens before calling the Cloudinary upload API.

---

## 7. Security Model

| Concern | Mitigation |
|---|---|
| API Secret exposure | Only used in Cloud Functions and Next.js server routes; never in client code |
| Unsigned upload abuse | Guest list is pre-vetted; format restrictions enforce `jpg/png/heic` only |
| Upload quota | Free tier is sufficient for development; monitor usage before the wedding |
| Inappropriate content | Not moderated at upload time (trusted guests); in-app moderation controls visibility in the feed |

---

## Appendix A: Admin API Reference

All Admin API calls require HTTP Basic Auth with `API_KEY:API_SECRET`.

**Read preset:**
```bash
curl -s "https://api.cloudinary.com/v1_1/bodaentarifa/upload_presets/wedding_upload" \
  -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET"
```

**Update preset** (replaces all settings):
```bash
curl -X PUT \
  "https://api.cloudinary.com/v1_1/bodaentarifa/upload_presets/wedding_upload" \
  -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET" \
  -d "unsigned=true" \
  -d "overwrite=false" \
  -d "use_filename=true" \
  -d "unique_filename=true" \
  -d "use_filename_as_display_name=true" \
  -d "use_asset_folder_as_public_id_prefix=false" \
  -d "type=upload" \
  -d "asset_folder=wedding/" \
  -d "allowed_formats=jpg,png,heic"
```

**Add eager transforms** (if needed in future — append to the PUT above):
```bash
  -d "eager=w_400,h_400,c_fill|w_1080,c_limit" \
  -d "eager_async=true"
```

**Delete a test upload:**
```bash
curl -X POST \
  "https://api.cloudinary.com/v1_1/bodaentarifa/image/destroy" \
  -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET" \
  -d "public_id=mfc20_test_upload_iomhk0"
```

**List uploads by tag:**
```bash
curl -s "https://api.cloudinary.com/v1_1/bodaentarifa/resources/image/tags/mfc20_test" \
  -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET"
```
