# Firebase Emulator Seeding Plan for App Simulator

> **Date:** 2026-04-14  
> **Scope:** Populate Firebase emulators with realistic test data for Flutter simulator validation  
> **Related policy:** `specs/testing-policy.md`  
> **Related schema docs:** `firebase/docs/firestore-data-model.md`, `firebase/docs/remote-config-keys.md`

---

## 1. Goal

Provide a repeatable way to seed Firebase emulators so app behavior in the simulator is close to production workflows for:

- Firestore-backed screens and interactions
- Auth + guest profile claim logic
- Function-driven behavior that depends on seeded Firestore/Auth state

This plan intentionally excludes Firebase Storage.

---

## 2. Prerequisite: App emulator connectivity

Before seeding, ensure the Flutter app can point to emulators in development runs.

### 2.1 Add dev-only emulator bootstrap

In app startup, guarded by a compile-time flag (example: `USE_FIREBASE_EMULATORS=true`), connect:

- Firestore emulator (`8080`)
- Auth emulator (`9099`)
- Functions emulator (`5001`, region `europe-west1`) when function calls are exercised from app

### 2.2 Keep production-safe defaults

- Emulator connections disabled by default.
- Enabled only via `--dart-define` or a dedicated debug flavor.

---

## 3. Data strategy

### 3.1 Seed for journeys, not just schema

Seed records must support simulator flows:

1. Claimed guest login + profile + directory visibility
2. Unclaimed guest onboarding / magic-link-related paths
3. Community feed + notices rendering
4. Time-gated itinerary content
5. Seating lookup by guest UID
6. Notification idempotency artifacts (`sent_notifications`)

### 3.2 Use deterministic identities

Use stable seeded UIDs/doc IDs (e.g. `seed_guest_001`) so:

- QA steps are repeatable
- test scripts can upsert safely
- cleanup can target prefixed records only

---

## 4. Implementation tasks

## Phase 1 — Seeding tooling

Create scripts under `scripts/`:

- `seed-emulator.ts`
- `clear-emulator.ts`

Responsibilities:

- Validate emulator env vars (`FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`)
- Initialize Admin SDK for emulator hosts
- Seed Auth users + claims
- Seed Firestore collections with deterministic IDs
- Print summary (counts + key identities)

## Phase 2 — Collection seeding

Seed minimum required collections:

- `guests`
- `seating`
- `feed_posts`
- `notices`
- `time_gated_content`
- `sent_notifications`

Include mixed states (claimed/unclaimed/admin/directory-hidden) to validate app branching.

## Phase 3 — Remote Config handling

For simulator test reliability:

- Primary source: app bundled defaults (`assets/defaults/*.json`)
- Optional external fetch tests: staging Firebase project (not required for local simulator loop)

Align key naming consistency for development trigger time keys before RC-focused testing.

## Phase 4 — Execution workflow

1. Start emulators with demo project id.
2. Run `clear-emulator`.
3. Run `seed-emulator`.
4. Launch app in simulator with emulator flag.
5. Execute manual validation checklist.

---

## 5. Validation checklist (simulator)

- Authenticated claimed guest can access app and profile data.
- Directory includes/excludes guests based on visibility.
- Feed shows visible posts; hidden behavior is correct.
- Notices load with denormalized author metadata.
- Time-gated content behavior matches unlock state.
- Seating assignment resolves for the logged-in guest.
- Unclaimed guest path behaves as expected.

---

## 6. Safety and repeatability constraints

- Never point seed scripts to production credentials.
- Always use demo project id for local runs.
- Cleanup removes only seed-prefixed entities.
- Keep all seeded emails clearly non-production (`@example.test`).

---

## 7. Deliverables

- [ ] Emulator bootstrap path in Flutter app
- [ ] `scripts/seed-emulator.ts`
- [ ] `scripts/clear-emulator.ts`
- [ ] Seed dataset spec document (see companion spec)
- [ ] Run instructions documented in repository docs
