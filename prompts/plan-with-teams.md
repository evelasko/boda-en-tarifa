# Agent Teams Prompt: Plan the Boda en Tarifa Implementation

## Your Mission

You are the **Team Lead** for planning the full implementation of **Boda en Tarifa** — a three-part system for a destination wedding in Tarifa, Spain (May 29-31, 2026). You will orchestrate a team of specialist agents to research, decompose, and create a comprehensive implementation plan materialized as **Milestones and Issues** in the **Linear** project management tool.

---

## System Context

This is a monorepo at `/Users/henry/Workbench/White Hibiscus/dev/boda-en-tarifa/` with four workstreams:

| Workstream | Location | Tech Stack | Current State |
|---|---|---|---|
| **Flutter App** | `app/` | Flutter 3.10+, Riverpod, GoRouter, Drift, Cloudinary | Scaffolded: 5 placeholder screens, router, theme. No features implemented. |
| **Web Dashboard** | `web/` (new `/admin` route) | Next.js 15, TailwindCSS 4, Firebase Auth | Guest-facing site exists (RSVP, content sections). No admin dashboard yet. |
| **Firebase Backend** | `firebase/` + `functions/` | Firestore, Storage, Remote Config, Cloud Functions v2 (TypeScript) | Skeleton rules (wide-open), empty functions, no Remote Config values. |
| **Web Guest Site** | `web/` | Next.js 15, TailwindCSS 4 | Functional but incomplete (hero content, animations, bilingual pending). |

### Specification Files (READ THESE THOROUGHLY)

- **App PRD**: `app/specs/prd.md` — Product requirements for the Flutter app
- **App Developer Journeys**: `app/specs/developer-journeys.md` — Detailed user journeys with BDD acceptance criteria
- **App Technical Architecture**: `app/specs/technical-architecture.md` — Full architecture: data models, layers, offline strategy, media pipeline, auth flow, Cloud Functions, implementation phases
- **Web PRD**: `web/specs/prd.md` — Product requirements for the wedding website
- **Content**: `web/src/content/wedding-content.json` — Complete wedding content data

### Linear Project

- **Project**: `BodaEnTarifa` in team `Misfitcoders`
- **Status**: Empty — 0 milestones, 0 issues
- **Available labels** (Misfitcoders team): Foundation, Parallel Safe, Self-Contained, Cross-Cutting, Research First, DX, Infrastructure, Design, Feature, Improvement, Bug

---

## Team Structure

Spawn **4 teammates** with the following specializations:

### Teammate 1: "Firebase Architect"

**Focus**: Firebase backend — Firestore data model, security rules, storage rules, Remote Config, Cloud Functions.

**Instructions**: Read `app/specs/technical-architecture.md` (sections 5, 7, 10, 13, 14, 17, 19) and `app/specs/developer-journeys.md`. Your job is to produce a detailed list of implementation issues for:

1. **Firestore Data Model**: Design and document every collection/subcollection. Reference Section 5 of the tech architecture for the data models (guests, feed_posts, notice_posts, time_gated_content, etc.). Each collection needs its own issue describing every field in prose (name, type, purpose, constraints, relationships to other collections).
2. **Firestore Security Rules**: Replace the current wide-open rules (`firebase/firestore.rules`) with production-grade rules enforcing auth, guest allowlist, time-gating, write protection on admin fields, and `isHidden` filtering. Reference Section 17.
3. **Storage Rules**: Configure `firebase/storage.rules` for profile photos and camera exposure backups.
4. **Remote Config**: Define all keys from Section 14 (`event_schedule_json`, `venues_json`, `time_gates_json`, `seating_chart_json`, `quick_contacts_json`, `wind_tips_json`, `development_trigger_time`). Describe each key's purpose, expected structure (as prose, not JSON schema), and what the default values should contain.
5. **Cloud Functions**: Implement the 5 functions from Section 19 (`onUserCreate`, `sendEventReminder`, `sendContentUnlockNotification`, `triggerFilmDevelopment`, `cleanupExpiredMagicLinks`) plus the Magic Link token generation script.
6. **Firestore Indexes**: Define composite indexes needed for feed queries, directory filtering, etc.

For each issue, specify:
- The exact files to create/modify
- The data structures involved — describe every field, its type, whether it's optional/required, its purpose, and any constraints or validation rules. Use plain prose and tables, NOT code or pseudo-code.
- The acceptance criteria
- Dependencies on other issues
- Which labels apply (Foundation, Self-Contained, Cross-Cutting, etc.)

### Teammate 2: "Flutter Architect"

**Focus**: Flutter mobile app — all 5 tabs, onboarding, camera, offline-first, media pipeline.

**Instructions**: Read ALL THREE spec files (`prd.md`, `developer-journeys.md`, `technical-architecture.md`). Your job is to decompose the Flutter app into granular, implementable issues organized by the 5 phases in Section 20 of the tech architecture.

For the Flutter app, issues should follow the **clean architecture layers** defined in Section 4:
- `domain/` — entities, repositories (abstract), use cases
- `data/` — models, data sources (remote + local), repository implementations
- `presentation/` — screens, widgets, providers (Riverpod)

Break down each Epic from the developer journeys doc into issues:

1. **Epic 1 (Onboarding & Auth)**: Magic link deep linking, Google/Apple sign-in, setup wizard (3 steps), profile claiming flow, auth redirect in GoRouter
2. **Epic 2 (Home Dashboard)**: Dynamic hero banner, weather widget (Open-Meteo API, Levante/Poniente), quick action buttons (taxi modal, coordinators), admin timeline override
3. **Epic 3 (Community)**: Live Feed with pagination + Cloudinary images, in-app photo import, Notice Board with WhatsApp deep linking, moderation (hide/unhide), upload queue
4. **Epic 4 (Unfiltered Camera)**: Retro viewfinder UI, rear-camera-only, exposure counter, background sync, development trigger logic, development room gallery, publish-to-feed flow
5. **Epic 5 (Itinerary & Maps)**: Master timeline, Mapbox GL offline map with custom overlay, time-gated content cards (seating, menus), recommendations list
6. **Epic 6 (Guest Directory)**: Directory grid with filter chips, guest profile view, self-service profile editing, privacy opt-out

Additionally, create cross-cutting infrastructure issues:
- Drift database setup (all tables from Section 8.2)
- Error handling framework (Failure hierarchy from Section 16)
- Offline sync strategy (PendingWrites queue from Section 8.3)
- Media pipeline (Cloudinary upload, EXIF stripping, resize from Section 9)
- Share Extension (iOS + Android from Section 12)
- FCM notification handling (Section 11)
- Dependency installation (all packages from Section 18)

For each issue, include:
- The exact folder path(s) and files to create within `app/lib/`
- Thorough prose descriptions of every entity, its fields, types, relationships, and behavior — do NOT include code snippets or pseudo-code. Describe models as field-by-field prose or tables (field name, type, required/optional, purpose, constraints).
- BDD acceptance criteria from the developer journeys
- Package dependencies needed (exact package names and why each is needed)
- Which labels apply

### Teammate 3: "Dashboard Architect"

**Focus**: Admin dashboard (new route in the Next.js web app) for the couple to manage all app content.

**Instructions**: Read `app/specs/prd.md`, `app/specs/technical-architecture.md` (Sections 5, 14, 19), and the existing web codebase at `web/src/`. The dashboard must allow the couple (admins) to manage:

1. **Guest List Management**: CRUD for the `guests` Firestore collection. Import/export CSV. Generate magic link invite URLs per guest. View RSVP status. Assign tables/seats.
2. **Hero Banner / Timeline Management**: Visual editor for the event schedule and "in-between" moment banners. Upload rich media (images/video) for each moment. Manual override control for the live timeline. This drives the Hero Banner on Tab 1 of the app.
3. **Content Management**: Edit quick contacts (taxi numbers, coordinators). Manage recommendations list. Upload/manage the custom illustrated map overlay.
4. **Time-Gated Content**: Set unlock times for seating chart, cocktail menu, banquet menu. Upload the actual content (images, PDFs, text). Preview what guests will see.
5. **Community Moderation**: View the Live Feed and Notice Board. Hide/unhide posts. View flagged content.
6. **Notification Broadcasting**: Send manual push notifications to all guests (admin broadcast). View scheduled notification history.
7. **Remote Config Management**: UI to edit Remote Config values (or at minimum a clear guide for using Firebase Console). Alternatively, a simplified dashboard that writes to Firestore documents that mirror Remote Config.

Design considerations:
- The dashboard should live under `web/src/app/admin/` as a protected route
- It requires Firebase Admin SDK (server-side) for privileged operations
- Reuse existing web auth (Google/Apple) but enforce admin role check
- Use the existing TailwindCSS 4 theme but with a clean admin aesthetic
- Consider using a component library (e.g., shadcn/ui) for tables, forms, modals

For each issue, include:
- The Next.js route structure (`/admin/guests`, `/admin/timeline`, etc.)
- The API routes needed (`web/src/app/api/admin/...`) — describe each route's purpose, HTTP method, authentication requirements, request/response shapes, and error handling in prose
- The Firestore operations involved — describe in plain English what documents are read/written/queried and under what conditions
- The UI components to build — describe layout, interactive elements, states (loading, empty, error), and user interactions in prose
- Which labels apply

### Teammate 4: "Integration Architect"

**Focus**: Cross-cutting concerns that span multiple workstreams, plus the completion of the guest-facing web.

**Instructions**: Read all spec files and the existing web codebase. Plan issues for:

1. **Auth Integration**: Ensure the auth flow works end-to-end: Magic Link generation (dashboard) → deep link handling (Flutter) → Cloud Function validation → profile claiming. Document the full sequence.
2. **Media Pipeline Integration**: Cloudinary setup (upload preset, transformations), end-to-end flow from camera capture → Cloudinary upload → Firestore doc → feed display.
3. **Offline-First Testing Strategy**: Define test scenarios for offline behavior — what happens when a guest loses connectivity at each point in the app.
4. **Web Guest Site Completion**: Issues for remaining web work — hero content integration, scroll animations/parallax, bilingual support (Spanish/English), mural background design integration, performance optimization.
5. **iBeacon Easter Eggs**: The non-critical proximity notification system from Section 3 of the PRD.
6. **DevOps & Deployment**: Firebase project configuration, CI/CD pipeline, TestFlight/Play Console setup, environment variables, Cloudinary account setup.
7. **End-to-End Testing Plan**: Critical user journeys that must be tested across all workstreams before the wedding.

For each issue, include:
- Which workstreams are involved (app, web, firebase)
- The exact integration points and data contracts — describe in prose what data flows between systems, the expected shape and semantics of that data, and the sequence of operations
- Dependencies on other teammates' issues
- Which labels apply

---

## Milestone Structure

Create the following **7 Milestones** in Linear (in this order), with target dates working backward from the wedding (May 29, 2026):

| # | Milestone Name | Target Date | Description |
|---|---|---|---|
| M1 | Foundation & Infrastructure | 2026-03-15 | Project scaffolding, Firebase data model, Firestore/Storage rules, Drift DB, error handling framework, dependency installation, CI/CD setup |
| M2 | Authentication & Guest Management | 2026-03-29 | Magic link auth, Google/Apple sign-in, onUserCreate Cloud Function, guest allowlist, onboarding wizard, dashboard guest management |
| M3 | Core Content — Home, Itinerary & Directory | 2026-04-12 | Home dashboard (hero banner, weather, quick actions), Itinerary (timeline, map, time-gated content), Guest Directory, Remote Config integration, offline sync |
| M4 | Camera & Community | 2026-04-26 | Unfiltered camera, development room, Live Feed, Notice Board, Cloudinary media pipeline, share extension, community moderation (dashboard) |
| M5 | Notifications & Dashboard Completion | 2026-05-08 | FCM push notifications, scheduled Cloud Functions, admin broadcast, timeline management dashboard, content management dashboard |
| M6 | Web Guest Site Completion | 2026-05-15 | Hero animations, mural backgrounds, bilingual support, scroll parallax, performance optimization |
| M7 | Integration Testing & Polish | 2026-05-22 | E2E testing, offline scenarios, security rule hardening, UI polish, TestFlight/Play Console distribution |

---

## Issue Quality Requirements

### CRITICAL: No Code in Issue Descriptions

Issue descriptions must be written entirely in **natural language prose**. Do NOT include any of the following in issue descriptions:
- Code snippets (Dart, TypeScript, JavaScript, SQL, or any language)
- Pseudo-code or code-like notation
- Code blocks (fenced with triple backticks) containing implementation
- Inline code references used as a substitute for prose description

Instead, describe everything in detailed, precise prose:
- Data models → field-by-field tables or bulleted lists (field name, type, required/optional, purpose, constraints)
- Algorithms and logic → numbered step-by-step narrative descriptions
- API endpoints → structured prose (route path, HTTP method, authentication required, request body fields, response body fields, error scenarios)
- Firestore rules → plain-English descriptions of who can read/write what under which conditions
- Architecture patterns → describe the layers, responsibilities, and data flow in sentences

The implementing agent has full access to the spec files in the repo. The issue description should tell the agent *what* to build and *why*, referencing the spec files for the *how*. Spec file references (e.g., "See `app/specs/technical-architecture.md` Section 8.2 for the Drift table definitions") are encouraged as pointers for the agent to consult during implementation.

### Required Fields

Every issue MUST contain:

1. **Title**: Clear, imperative action (e.g., "Implement Drift database schema for offline-first data")
2. **Description** with these sections:
   - **Context**: Why this issue exists and how it fits in the broader system. Reference the relevant spec file and section (e.g., "See `app/specs/technical-architecture.md` Section 8.2") so the implementing agent can read the original source.
   - **Specification**: Exactly what to build, described in thorough, precise prose. **NEVER include code snippets, pseudo-code, or code blocks.** Instead, describe every data model as a field-by-field breakdown (using prose or markdown tables with columns: field name, type, required/optional, purpose, constraints). Describe algorithms and flows as numbered step-by-step narratives. Describe API contracts as structured prose (endpoint, method, request fields, response fields, error cases). The description must be so detailed and unambiguous that an LLM agent reading only this issue — combined with the spec files in the repo — has everything it needs to implement the feature correctly.
   - **Files to Create/Modify**: Exact file paths within the monorepo
   - **Acceptance Criteria**: Testable conditions (BDD format preferred)
   - **Dependencies**: Links to blocking issues (use Linear issue identifiers)
   - **Technical Notes**: Edge cases, package versions, gotchas, relevant spec file sections to consult during implementation
3. **Labels**: At minimum one workflow label (Foundation/Parallel Safe/Self-Contained/Cross-Cutting/Research First) and one type label (Feature/Improvement/Bug)
4. **Milestone**: Assigned to the correct milestone
5. **Priority**: Set appropriately (1=Urgent, 2=High, 3=Normal, 4=Low)
6. **Estimate**: Story points (1=trivial, 2=small, 3=medium, 5=large, 8=very large)

---

## Execution Plan

### Phase 1: Research (All teammates in parallel)

All teammates read their assigned spec files and the current codebase. Each teammate produces a structured list of proposed issues (title + brief summary) and shares it with the team via the task list.

### Phase 2: Cross-Reference & Dependency Mapping

The Team Lead reviews all proposed issues, identifies duplicates, and maps dependencies between workstreams. Teammates refine their issues based on feedback.

### Phase 3: Linear Creation

1. First, create new domain labels in Linear for this project:
   - **App** (color: #06B6D4, description: "Flutter mobile app features and screens")
   - **Dashboard** (color: #F59E0B, description: "Admin dashboard in Next.js web app")
   - **Firebase** (color: #F97316, description: "Firestore, Storage, Cloud Functions, Remote Config")
   - **Web** (color: #8B5CF6, description: "Guest-facing wedding website")
   - **Camera** (color: #EC4899, description: "Unfiltered disposable camera feature")
   - **Media** (color: #14B8A6, description: "Cloudinary media pipeline, image processing")
   - **Offline** (color: #6366F1, description: "Offline-first sync, Drift database, caching")
   - **Auth** (color: #EF4444, description: "Authentication, magic links, guest allowlist")

2. Create all 7 milestones in order.

3. Each teammate creates their issues in Linear via the MCP Linear tools, fully populating all fields. Use `blocks` and `blockedBy` to wire up dependencies.

4. The Team Lead reviews all created issues for completeness, fixes any gaps, and ensures every issue is assigned to a milestone with correct labels and dependencies.

---

## Recommendations for Custom Skills & Agents

After creating the plan, recommend to the user whether any of these would accelerate implementation:

1. **Flutter Feature Skill**: A custom Claude Code skill that, given a feature name and spec excerpt, scaffolds the full clean architecture folder structure (`domain/`, `data/`, `presentation/`) with boilerplate files (entity, repository interface, repository impl, data source, provider, screen).

2. **Firebase Function Skill**: A skill that scaffolds a new Cloud Function with proper typing, error handling, and test setup within the `functions/src/` directory.

3. **Linear Issue Agent**: A custom agent that reads a spec file section and automatically creates well-structured Linear issues following the quality requirements above.

4. **Integration Test Agent**: An agent that, given a user journey from the developer journeys doc, generates the corresponding integration test plan.

---

## Critical Reminders

- The wedding is **May 29, 2026** — every day counts.
- The app must work **offline at a beach** — offline-first is not optional.
- This is a **same-sex wedding** — use inclusive language in all content and UI copy.
- **Privacy is paramount** — phone numbers and emails must never be exposed in the app UI.
- The Flutter architecture follows **clean architecture with Riverpod** — every issue must respect the layer boundaries defined in the tech architecture.
- Issues must be **self-contained enough for an LLM agent** to implement without additional context beyond the issue description, the spec files in the repo, and the codebase.
- Issue descriptions must be **pure prose** — no code, no pseudo-code, no code blocks. Describe everything in detailed natural language, referencing spec file sections for the implementing agent to consult.
