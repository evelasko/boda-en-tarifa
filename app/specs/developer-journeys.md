# Developer User Journeys & Acceptance Criteria
> **Version:** 1.0
> **Date:** 2026-02-26
> **Project:** Boda en Tarifa App

This document outlines the detailed user journeys, edge cases, and technical acceptance criteria based on the product requirements and technical architecture discussions.

## Epic 1: Onboarding, Authentication & Permissions
**User Story:** As an invited guest, I want to securely log into the app without a password and set my privacy and device permissions, so that I can safely participate in the wedding features.

**User Journey (Step-by-Step):**
1. The couple generates a specialized invite URL containing a secure, short-lived authentication token (Firebase Custom Token or an email-link auth deep link customized for WhatsApp/Email sharing) via a Firebase Admin script or simple internal web tool.
2. The guest receives this link via WhatsApp or Email and taps it.
3. The app opens via deep linking (Universal Links / App Links). The app seamlessly exchanges the token with Firebase Auth to instantly authenticate the user.
4. **Alternative Fallback Flow:** If a user just downloads the app directly from the App Store (without tapping the link), they are presented with "Sign in with Google / Apple" options. If the email returned by Google/Apple is not in the Firestore allowlist, they hit a hard wall ("No wedding found for this email"). If it matches, they proceed to Step 5.
5. The user enters the **Setup Wizard** (Onboarding Flow):
   - **Step 1:** Communication Preference (WhatsApp vs. Email).
   - **Step 2:** Privacy Settings (Grant/Deny permission to appear in the Guest Directory, modify bio, category, and status). The couple may have pre-set a default photo.
   - **Step 3:** Device Permissions Request (Camera, Photo Library, Notifications).
6. If the user skips the wizard, all permissions default to denied, and they are hidden from the directory. They can change these later in Profile Settings.
7. User lands on Tab 1 (Home).

**Acceptance Criteria (BDD format):**
- **Given** an unauthorized email, **When** they attempt to log in, **Then** they see an access-denied message directing them to contact the couple.
- **Given** an authorized user completes onboarding, **When** they deny camera/microphone permissions, **Then** Tab 3 gracefully degrades to show only the developed gallery (if any), disabling the viewfinder.
- **Given** a user is setting up their profile, **When** they choose their contact preference, **Then** their phone number/email is never public, only accessible behind action buttons in the Notice Board.

**Technical Notes for Flutter/Firebase Devs:**
- **Custom Token Generation:** The easiest way to achieve the direct magic link is via a Node script using the Firebase Admin SDK to generate a Custom Auth Token for each user `uid`. This token is embedded in a deep link (e.g., `https://bodaentarifa.com/login?token=xyz`).
- **App Links:** Ensure iOS Universal Links and Android App Links are properly configured so tapping the link automatically launches the app instead of the browser.
- There is no "Request Access" flow. Strictly rely on the Firestore allowlist.
- Local State: Store the onboarding completion boolean in Drift/SharedPreferences to avoid showing the wizard twice.

---

## Epic 2: Tab 1 - "Happening Now" Dashboard
**User Story:** As a guest, I want to see dynamic, time-relevant information and emergency contacts so I always know where to be and what is currently happening.

**User Journey (Step-by-Step):**
1. User navigates to Tab 1.
2. The Hero Banner reads the current system time and the event schedule, displaying the current event.
3. If it is an "In-Between" moment, the banner displays custom developer-configured rich media (countdown, music, images) specified by the couple for that specific gap.
4. The user sees a Weather widget stating the current Tarifa wind (Levante/Poniente) and a cheeky tip.
5. The user sees a "Call a Local Taxi" button. Tapping it opens a modal with a list of recommended local taxi companies. Tapping a company directly initiates a phone call.

**Acceptance Criteria (BDD format):**
- **Given** the wedding is behind schedule, **When** the couple (admins) trigger a "Manual Override", **Then** the Hero Banner updates instantly across all devices to the new/paused moment, overriding the strict timeline.
- **Given** a user taps "Call a Local Taxi", **When** they select a dispatch number, **Then** the OS phone dialer opens with the number pre-filled.

**Technical Notes for Flutter/Firebase Devs:**
- **Developer Experience (DX):** Build a flexible, data-driven UI block for the Hero Banners so custom moments (even gaps) can be easily configured via Firebase Remote Config with rich media URLs.
- **Friction Reduction (Caching):** Pre-cache Hero Banner media (especially images/videos for the "In-Between" states) during the Splash Screen or in the background as soon as the app opens. Do not let the user wait for a banner to load when a new moment triggers.
- Implement an Admin flag in Firebase Auth claims. If Admin, show a hidden "Override Timeline" control panel. Use `url_launcher` for the `tel:` scheme on taxi buttons.

---

## Epic 3: Tab 2 - Community Feed & Notice Board
**User Story:** As a guest, I want to view weekend photos and announcements, share my own photos, and connect with other guests seamlessly.

**User Journey (Step-by-Step):**
1. User scrolls the visual Live Feed. They can switch the toggle to the Text-Based Notice Board.
2. **Uploading Media:** If a user selects photos via the OS Share Sheet:
   - If they gave "Auto-publish" permission, the photos wait for Wi-Fi and instantly post to the feed.
   - If manual, photos are securely saved to their "Private Collection" in the app.
3. **Moderation:** A user can "hide" their own photos from the public feed at any time. Admins (the couple) can hide *any* photo from the feed. The photo is never deleted, just removed from public view.
4. **Notice Board:** User posts a text notice. Another guest taps "Message via WhatsApp" (or Email, based on author preference). The OS opens WhatsApp/Email directly. No comment threading exists in-app.

**Acceptance Criteria (BDD format):**
- **Given** a user has spotty cell service, **When** they upload a photo, **Then** the photo is added to a background queue, and a dismissible "X items waiting for Wi-Fi" banner appears globally in the app shell.
- **Given** a user shares photos via OS Intent, **When** they haven't granted auto-publish, **Then** the photos reside in their private collection for review.

**Technical Notes for Flutter/Firebase Devs:**
- **Offline Uploads:** Implement the global Wi-Fi waiting banner using `connectivity_plus`. Ensure background upload retries.
- **Friction Reduction (Feed Performance):** The Live Feed must implement robust pagination (e.g., fetching 10-15 posts at a time) and aggressive image caching (`cached_network_image` package) to ensure buttery smooth scrolling even on poor connections. Use Cloudinary URL transformations to fetch low-res thumbnails first, gracefully fading into high-res versions.
- Feed queries should filter out documents where `isHidden == true`.

---

## Epic 4: Tab 3 - The "Unfiltered" Camera
**User Story:** As a guest, I want to take authentic, unfiltered photos that remain hidden until the roll is finished, simulating a retro disposable camera experience.

**User Journey (Step-by-Step):**
1. User opens Tab 3 and sees a retro viewfinder with no selfie-cam or edit tools.
2. They snap a photo. The counter increments (e.g., "1/24").
3. **Background Sync:** The photo is immediately and silently uploaded to their private Cloudinary/Firestore folder in the background to prevent data loss in case the app is deleted or phone is lost.
4. The user hits the 24th photo (or 05:00 AM Sunday hits).
5. A dramatic 5-second, un-skippable "Developing Film" animation plays.
6. The gallery is revealed. The photo counter is reset to 0, and they can start a brand new roll of 24.

**Acceptance Criteria (BDD format):**
- **Given** a user takes a photo, **When** they close the app, **Then** the photo silently backs up to the cloud without being exposed to the public feed.
- **Given** a user finishes their 24th photo, **When** the animation completes, **Then** they see their private gallery and the camera resets to allow a new 24-photo roll.

**Technical Notes for Flutter/Firebase Devs:**
- Implement `workmanager` (or similar) to ensure the silent background sync of captured exposures.
- The "developing" state is a flag on the user's document or roll subcollection that unlocks the UI.
- **Friction Reduction (Camera Start-up):** The camera controller must be initialized in the background *before* the user navigates to Tab 3, ensuring zero lag or "black screen" when they tap the camera icon. 

---

## Epic 5: Tab 4 - Itinerary, Maps & Dining
**User Story:** As a guest, I want to see the master timeline, find locations on a custom map, and view time-locked surprises like menus and seating charts.

**User Journey (Step-by-Step):**
1. User navigates to Tab 4 and sees three sub-tabs: "Map", "Seating Plan", and "Recommendations".
2. **The Map:** The user views a beautifully drawn custom map. A blue dot indicates their current GPS location. The map highlights the currently active event location (time-gated).
3. **Seating Plan:** If before the 21:50 unlock time, the Seating Plan tab displays a stylized "Coming Soon" placeholder. At exactly 21:50, the UI reveals their table and seat.
4. **Recommendations:** Always available list of the couple's favorite local spots.

**Acceptance Criteria (BDD format):**
- **Given** it is prior to an event's time-gate, **When** a user views the Seating Plan, **Then** they see "Coming Soon" with no accessible buttons or leaks of the data.
- **Given** the user is on the Map tab, **When** the timeline progresses to a new event, **Then** the active event marker on the custom map changes dynamically.

**Technical Notes for Flutter/Firebase Devs:**
- **Map Technology Recommendation:** *Mapbox GL* is the ideal technology for this requirement in Flutter. Features like Mapbox Studio allow you to upload the beautifully illustrated custom map as an Image Overlay onto exact real-world coordinates. Once packaged as an offline style payload, it perfectly supports showing the native blue GPS dot, rendering offline GeoJSON routes, and maintaining the beautiful custom aesthetic while entirely disconnected from the network.
- **Friction Reduction (Map Loading):** Download the Mapbox offline tile payload completely in the background during the initial Onboarding flow. A beach with no cell service should never be the first time a guest tries to load the map interface.

---

## Epic 6: Tab 5 - Guest Directory
**User Story:** As a guest, I want to see who else is attending and manage my own visible profile.

**User Journey (Step-by-Step):**
1. User filters the directory by relationship status, side of the family, or custom category.
2. Tapping a profile shows the bio, photo, and status. It **never** shows email or phone number.
3. User opens "My Profile" to toggle their visibility off, change their photo, or update their relationship status.
4. If they opt-out of visibility, they disappear from the grid but can still view others.

**Acceptance Criteria (BDD format):**
- **Given** a guest opts out of the directory during onboarding or in settings, **When** another user searches for them, **Then** their profile does not appear in the grid.
- **Given** a guest views a profile, **When** they look for contact info, **Then** no raw phone numbers or emails are ever exposed in Tab 5.

**Technical Notes for Flutter/Firebase Devs:**
- Rely heavily on Firestore Security Rules to prevent querying or returning `isHidden` guest documents to clients to ensure strict privacy compliance.
