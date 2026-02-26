# App Development Brief: Boda en Tarifa (May 29 - May 31)

## 1. Project Overview & Vibe

This Flutter-based mobile application (iOS & Android) is the digital concierge for a three-day destination wedding celebrating two grooms in Tarifa, Spain. The guest list is international, the dress code is beach-chic, and the venues span several locations along the Valdevaqueros strip.

**The Design Language:** The UI should be highly intuitive (easy to use after a few cocktails!), utilizing a color palette inspired by Tarifa: sandy neutrals, ocean blues, and warm sunset tones. Typography should be modern, clean, and highly legible.

**The Tech Stack:** * **Frontend:** Flutter

* **Backend:** Firebase (Firestore for database, Storage for media, Firebase Auth for login).
* **Authentication:** Highly frictionless, specialized "Magic Link" deep links (containing Custom Auth Tokens) generated per-guest. A strict guest allowlist ensures security without requiring an explicit "Request Access" flow. Users configure their privacy and permission settings inside a dedicated Setup Wizard.

---

## 2. App Architecture & Navigation

The app will utilize a classic 5-tab bottom navigation bar. The center button (Tab 3) should be visually distinct (larger or floating) to draw attention to the core camera feature.

### Tab 1: Home ("Happening Now" Dashboard)

This is the dynamic landing page. It acts as the guest's compass, changing based on the current date and time.

* **Dynamic Hero Banner:** A prominent card at the top of the screen driven by a strict background timetable, including developer-configured rich media for "in-between" moments. Admins (the couple) have a manual override button to control the flow of the itinerary. Visual assets must be pre-cached to ensure zero load times when moments transition.
* **Live Wind & Weather Widget:** An API-driven widget displaying the current temperature and wind status in Tarifa. It must specifically identify if the wind is **Levante** (strong, warm easterly) or **Poniente** (cooler westerly), accompanied by a cheeky, thematic tip (e.g., *"It's a Levante day! Hold onto your hats and skip the hairspray."*).
* **Quick Action Buttons:** Fixed buttons at the bottom of the screen for logistical emergencies: "Call a Local Taxi" (opens a modal with multiple direct-dial driver options) and "Contact Coordinators" (links to the best men or planning team).

### Tab 2: Community (Social & Logistics)

A dual-view tab with a top toggle switch allowing guests to flip between the visual feed and the text-based notice board.

* **View A: The Live Feed:** An Instagram-style vertical scrolling feed. This is the central hub for all visual media. To ensure maximum media collection from the guests, the feed must support three distinct methods of photo ingestion:

1. **"Unfiltered" Camera Publishing:** Receiving the delayed, 24-exposure photos pushed from Tab 3 once the film is "developed."
2. **In-App Photo Import:** The feed UI must feature a prominent, sticky action button (e.g., a floating "+" or "Upload" icon). Tapping this opens the device's native photo picker (iOS Photo Library / Android Gallery), allowing guests to select and import photos they have already taken natively into the app's feed.
3. **Native OS Share Integration (Share Extension/Intent):** The Flutter app must be registered as a valid "Share Target" within the native iOS and Android operating systems. When a guest is scrolling through their phone's native Photos app and taps the system's "Share" button, the Tarifa Wedding App must appear in the share sheet alongside apps like WhatsApp or Instagram.
*Note: The Live Feed requires robust performance (10-15 post pagination, aggressive image caching via Cloudinary URL transformation). For moderation, guests and admins can hide (but not delete) photos from the public feed. Un-published photos are stored in a Private Collection.*

* **View B: The Notice Board:** A Firestore-backed community forum. Guests can create text posts (e.g., "Landing in Málaga, have 2 spare seats!").
* *Crucial Dev Note:* There is no in-app messaging threading. Every post will feature a prominent action button to contact the author. This button will use deep linking to open the user's native WhatsApp app (or email), based on the author's onboarding preference. Phone numbers and emails are never displayed in raw text.

### Tab 3: "Unfiltered" (The Core Camera Feature)

This feature mimics a vintage disposable camera to encourage spontaneous, authentic moments without the pressure of curation.

* **The Viewfinder UI:** A retro, stripped-down camera interface. It must *disable* the front-facing (selfie) camera, filters, and editing tools. Guests frame the shot and capture—that is it. The camera hardware must pre-load in the background to ensure zero start-up lag.
* **The Background Sync:** To prevent data loss (lost phone, uninstalled app), photos silently back up to a private cloud folder immediately upon capture.
* **The Counter:** A persistent display showing how many shots are left (e.g., "1/24 Exposures"). Hitting 24 photos develops the film and explicitly *resets* the counter to allow a new 24-photo roll.
* **The Trigger Logic:** Photos remain completely hidden from the user upon capture. The "film" is only developed (revealed) when one of two conditions is met:

1. The user takes their 24th and final photo.
2. The clock strikes **05:00 AM on May 31st** (the Post-Party at Valdevaqueros).

* **The "Development Room" (The Reveal):** Once triggered, a dramatic 5-second un-skippable "developing film" sequence plays. Then, the camera UI is replaced by a private gallery. The user can finally view their 24 photos. They are provided with multi-select checkboxes to choose which photos they want to officially "Publish to the Live Feed."

### Tab 4: Itinerary, Maps & Dining

The logistical brain of the app, built as a three-tab view:

* **1. Main Location Map:** A beautifully drawn, custom-illustrated offline map (e.g., Mapbox GL with Image Overlay). It displays a blue dot for the user's GPS location and highlights the exact event currently taking place based on the time-gated schedule. *Developer DX: Download Mapbox offline tile payload completely in the background during the initial Onboarding flow.*
* **2. Seating Plan:** Time-released content. Before the exact unlock time (e.g., **05/30 21:50**), it displays a stylized "Coming Soon" placeholder. After unlock, it reveals the specific table and seat.
* **3. Recommendations:** An always-available list of the couple's recommended places to visit, hang out, or eat at.

### Tab 5: Guest Directory

A social icebreaker tool to help international and diverse groups of friends mingle. Guests explicitly opt-in/opt-out during onboarding.

* **The Directory Grid:** A searchable list of all attendees. Include filter chips (e.g., "Filter by: Single", "Filter by: Groom A's side"). If a guest chose "hide my profile", they are completely invisible here.
* **Guest Profiles:** Tapping a guest reveals their uploaded profile picture, their relationship to the grooms, their relationship status, and a user-generated "Fun Fact."
* **My Profile Settings:** A self-service portal where the user manages their own identity. They can upload/change their photo, update their status, write their fun fact, and revoke/grant the permission to appear in the directory. Phone numbers and emails are never accessible.

---

## 3. iBeacon Integration (Non-Crucial Easter Eggs)

Because Bluetooth can be unreliable on a beach, iBeacons will *not* be used for critical logistical updates. Instead, they will trigger fun, proximity-based push notifications (Easter Eggs).

* **Setup:** Small battery-powered beacons placed at venue entrances.
* **Examples of Triggers:**
* Walking into Chiringuito Tumbao (05/29): *"Welcome to Tarifa! Grab a mojito and check the directory to see who else has arrived."*
* Nearing the Tres Mares Pool (05/31 00:20): *"Get to the edge of the pool! The grooms' dance starts in 10 minutes!"*
