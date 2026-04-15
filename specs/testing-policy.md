# Testing Policy — Boda en Tarifa Monorepo

> **Version:** 1.0  
> **Date:** 2026-04-14  
> **Scope:** Firestore, Firebase Auth, Cloud Functions, Remote Config, FCM-adjacent behavior, Next.js admin surfaces, Flutter app, supporting scripts.  
> **Explicitly out of scope:** Firebase Storage (not used; no Storage rules or SDK testing).

This document is the canonical policy for **what** to test, **how** (integration vs narrow unit), **which tools** to standardize on, and **where emulator-backed tests end**. It exists so framework choices stay consistent across `functions/`, `web/`, `app/`, and Firebase configuration.

---

## 1. Goals and principles

### 1.1 Primary goal

Catch regressions in **security boundaries**, **cross-service workflows**, and **data contracts** before they reach production. Prefer tests that exercise **real Firebase client or Admin SDK code paths** against the **Local Emulator Suite** where emulators provide faithful behavior.

### 1.2 Definitions

| Term | Meaning here |
|------|----------------|
| **Integration test** | Uses at least one real Firebase emulator (or, where documented, a dedicated non-production GCP project) plus real SDK calls. May still stub **non-Firebase** HTTP or services without violating this policy. |
| **Unit test** | Pure logic (validation, parsing, mappers) with no I/O. Fast, no emulators required. |
| **Rules test** | Firestore security rules evaluated via the Firestore emulator using authenticated/unauthenticated contexts. |

### 1.3 Default stance

1. **Firestore:** rules tests (mandatory for every `match` path in `firebase/firestore.rules`) plus targeted integration tests for Functions and apps that read/write the same collections.  
2. **Auth + Functions:** integration tests for callable and blocking-identity flows that depend on Auth + Firestore together.  
3. **Scheduled Functions that call FCM:** treat messaging as a **boundary**; do not require a full FCM emulator (none exists). See §5.3.  
4. **Remote Config:** client fetch is not emulator-equivalent to Firestore; use **defaults + fixture templates** and/or a **staging project** policy. See §5.4.  
5. **Next.js admin API routes:** integration tests against **Admin SDK + Firestore/Auth emulators** (routes bypass client security rules by design).

### 1.4 Non-goals

- 100% line coverage as an end in itself.  
- Running production traffic or production credentials in CI.  
- Firebase Storage (removed from scope by product decision).

---

## 2. Monorepo surfaces to cover

| Location | Role | Firebase touchpoints |
|----------|------|----------------------|
| **`functions/`** | Cloud Functions (Gen 2) | Firestore (Admin), Auth (Admin), FCM (Admin), blocking identity trigger |
| **`firebase/`** | Rules, indexes, Remote Config template | Source of truth for what rules tests must assert |
| **`web/`** | Next.js site + `/api/admin/*` | Client Firestore (e.g. RSVP), server Admin SDK (Firestore, Auth, Messaging), Remote Config via admin APIs |
| **`app/`** | Flutter guest app | Firestore, Auth, Remote Config, FCM; media via Cloudinary (outside Firebase) |
| **`scripts/`** | Maintenance (e.g. magic links) | Admin Firestore |

Related flow specs (for **what** scenarios must be covered, not **which** runner):

- `specs/magic-link-auth-flow.md` — magic link + `beforeUserCreated` + guest migration  
- `firebase/docs/firestore-data-model.md` — collections and invariants  
- `firebase/docs/remote-config-keys.md` — Remote Config keys and JSON shapes  

Emulator ports are defined in **`firebase.json`** (e.g. Firestore `8080`, Auth `9099`, Functions `5001`). Tests and docs must stay aligned with that file.

---

## 3. Recommended tooling by package

Standardize on **one primary Node test runner for Firebase-heavy TypeScript** to avoid duplicated config and conflicting globals. The split below is intentional: **Jest** where the official Firebase testing helper **requires** it, and **the same or a second runner** elsewhere only if maintenance cost is accepted.

### 3.1 `functions/` — Jest + `firebase-functions-test`

**Choice:** **Jest** (≥ 28) as the test runner for Cloud Functions.

**Rationale:** `firebase-functions-test` declares a **peer dependency on Jest**. Using Jest in `functions/` avoids fighting unsupported peer combinations and matches the majority of Firebase documentation and examples.

**Use for:**

- **`onCall`** (`generateMagicLink`): authenticated context, admin custom claims, Firestore reads on `guests/{uid}`, custom token creation (with **Auth emulator**).  
- **`beforeUserCreated`** (`onUserCreate`): guest query, profile claim / migration batch (Firestore emulator + Auth emulator).  
- **`onSchedule`**: where practical, invoke the wrapped handler or the deployed emulator surface; for jobs that only call **FCM**, combine with §5.3.

**Scripts (suggested):**

- `test` — unit + integration tests that do not start emulators themselves.  
- `test:integration` — intended to run **inside** `firebase emulators:exec` from the repo root (see §7).  
- `build` before tests if importing compiled `lib/`; alternatively configure Jest to transform `src/` with `ts-jest` or `@swc/jest` — pick one approach per repo convention and stick to it.

**Module system:** `functions/tsconfig.json` uses **NodeNext**. Jest config must resolve ESM/CJS consistently (e.g. test environment `node`, `extensionsToTreatAsEsm` if needed, or tests targeting compiled output in `lib/`).

### 3.2 Firestore security rules — `@firebase/rules-unit-testing` + Jest or Vitest

**Choice:** **`@firebase/rules-unit-testing`** with **Jest** *or* **Vitest** (team preference for non-`functions/` TS).

**Rationale:** This is the supported way to run **allow/deny** assertions against the **Firestore emulator** with simulated auth tokens.

**Must cover** (aligned with `firebase/firestore.rules`):

- `guests/{uid}` — read, update field restrictions, create/delete denied.  
- `feed_posts/{postId}` — create authorUid match, update `isHidden` only, delete denied.  
- `notices/{noticeId}` — create rules, update/delete denied.  
- `seating/{guestUid}` — read allowed for authed users, writes denied.  
- `time_gated_content/{contentId}` — read gated by `unlockAt` vs `request.time`, writes denied.

**Web-only collections:** The Next.js client uses **`rsvp_responses`** (`web/src/lib/firestore.ts`). That path is **not** defined in the checked-in rules file as of this policy version. Rules tests should either:

- **Assert the intended policy** once explicit `match /rsvp_responses/{uid}` rules exist, or  
- **Document “intentionally not in rules file”** if RSVP is only ever written via Admin SDK (then client writes would be denied — rules tests would catch accidental client use).

Do not duplicate large JSON fixtures in every test file; centralize minimal guest/post/notice documents in a shared test helper module.

### 3.3 `web/` — Vitest or Jest + Node environment

**Choice:** **Vitest** *or* **Jest** with **`environment: 'node'`** for server-side integration tests.

**Rationale:** Next.js 16 and `firebase-admin` run on Node. Vitest is a strong default for modern TypeScript monorepos; Jest is equally viable if the team wants one runner everywhere outside `functions/`.

**Use for:**

- **Pure unit tests** (already exemplified by RSVP validation under `web/src/lib/__tests__/`).  
- **Admin API integration tests:** call route handlers or use `fetch` against a **test server** started with env vars pointing Admin SDK at emulators (`FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`). Protect admin routes with test-only secrets or bypass flags **only in test builds**.

**Client Firestore (browser):** Full browser E2E (Playwright) against emulators is optional and heavier; policy minimum is **rules tests** for any path the browser writes. Add Playwright later if product flows need full UI + Auth + Firestore together.

### 3.4 `app/` (Flutter) — `integration_test` + Flutter driver

**Choice:** **`integration_test`** from the Flutter SDK; **Patrol** optional if native permissions or deep links need automation beyond `integration_test`.

**Rationale:** Firebase’s documented approach for Flutter is to call **`useFirestoreEmulator`**, **`useAuthEmulator`**, etc., before tests run. Dart is a separate ecosystem from Node; do not force Jest/Vitest here.

**Use for:**

- Onboarding and **guest allowlist** behavior tied to Firestore + Auth.  
- Remote Config: **defaults + controlled fetch** (§5.4), not “mock Remote Config SDK internals” unless necessary.  
- Deep links / magic link: coordinate with `specs/magic-link-auth-flow.md`.

### 3.5 `scripts/` — same runner as `web/` or tiny `node:test`

**Choice:** Reuse **Vitest/Jest** from a parent workspace or run scripts with **`firebase emulators:exec`** and assert exit codes. Low priority until scripts grow logic worth regressing.

---

## 4. Integration test tiers (recommended pyramid)

```
                    ┌─────────────────────┐
                    │  Optional E2E UI    │  Playwright (web) / manual QA
                    │  (staging / demo)   │
                ┌───┴─────────────────────┴───┐
                │ App integration_test      │  Flutter + emulators
            ┌───┴───────────────────────────┴───┐
            │ Functions + Admin API + rules     │  Jest/Vitest + emulators
        ┌───┴─────────────────────────────────────┴───┐
        │              Pure unit tests                   │  No emulators
        └────────────────────────────────────────────────┘
```

**Minimum bar for merge (policy target, enable incrementally in CI):**

1. Firestore **rules** tests for every rules `match` block.  
2. **Functions** integration tests for `generateMagicLink` and `onUserCreate` (highest business risk).  
3. **Unit** tests for shared validation/parsing (RSVP, Remote Config JSON parsers if extracted).

---

## 5. Emulator and “production-like” boundaries

### 5.1 Strong emulator parity (prefer no mocks inside Firebase)

| Service | Emulator | Policy |
|---------|-----------|--------|
| Firestore | Yes | Primary integration substrate; rules + Admin + client (with hub host vars). |
| Auth | Yes | Use for sign-in, custom tokens, blocking functions, listUsers in cleanup paths where test data is isolated. |
| Functions | Yes | HTTP/callable and triggers against local Functions + Firestore + Auth. |

Always use a **disposable project id** (e.g. `demo-boda-en-tarifa`) for local and CI emulator runs unless Firebase documents otherwise for multi-project setups.

### 5.2 Admin SDK in tests

Initialize **`firebase-admin`** with application default credentials **or** emulator-friendly initialization. Set:

- `FIRESTORE_EMULATOR_HOST`  
- `FIREBASE_AUTH_EMULATOR_HOST`  

before any Admin call that should hit emulators. Next.js `web/src/lib/firebase-admin.ts` today assumes **service account** for non-emulator use; **test entrypoints** should either set emulator env vars so Admin prefers emulators, or use a **small test-only `initializeApp`** wrapper — avoid editing production initialization logic without a clear env gate.

### 5.3 FCM (Firebase Cloud Messaging)

There is **no** official local emulator that validates FCM delivery the way Firestore validates writes.

**Policy:**

- **Do not** send real FCM messages from CI to arbitrary devices.  
- **Acceptable approaches** (pick one per test suite, document in the suite README):  
  - **Stub module boundary:** replace `getMessaging().send` (or the wrapping helper) in **test only** so integration tests assert Firestore idempotency docs and “would have sent” behavior. This is still **integration** for Firestore + scheduler logic.  
  - **Dedicated FCM test topic + test device** in a **staging** project for rare manual or nightly jobs — not required for every PR.

Scheduled functions in `functions/src/notifications/*.ts` and `functions/src/camera/trigger-film-development.ts` fall under this policy.

### 5.4 Remote Config

**Client (Flutter / optional web client):**

- There is **no** Remote Config emulator configured in **`firebase.json`** comparable to Firestore.  
- **Policy:** Use **in-app defaults** (`setDefaults` / bundled JSON) plus tests that assert **parsing and feature behavior** given a **fixed template JSON fixture** (checked into `firebase/` or `app/test/fixtures/`). For “fetch integration,” use a **staging Firebase project** with throttling-aware fetch intervals — not a blocker for PR CI.

**Server / Admin (web Remote Config REST, `firebase/remoteconfig.template.json`):**

- Integration tests can validate **shape and key presence** against the template file or a **read-only** staging template via Admin REST if credentials are available in a secure CI secret store.

### 5.5 Cloudinary and other third parties

Not Firebase. **Policy:** either **contract tests** against stable URL builders (unit), or **isolated integration** with Cloudinary **unsigned upload presets** limited to a test folder — never mixed with production assets. Does not replace Firebase emulator tests.

---

## 6. Test data, isolation, and safety

1. **Project id:** Use a fixed **demo** project id for emulators so imports and URLs stay stable.  
2. **Cleanup:** Prefer unique document prefixes per test file or `beforeEach` seed with deterministic IDs; delete collections where the emulator allows bulk cleanup.  
3. **Secrets:** No service account JSON in git. CI uses OIDC or short-lived secrets; local dev uses `gcloud application-default login` or emulator-only flows.  
4. **Concurrency:** Run rules tests and Functions tests **serially** per project id if flakiness appears (Firestore emulator is generally fine parallelized with separate collection namespaces).

---

## 7. CI orchestration

**Canonical pattern:** run automated suites **inside** emulator startup so ports and hub are guaranteed:

```bash
firebase emulators:exec --project demo-boda-en-tarifa "<your package manager> run test:integration"
```

**Suggested matrix stages:**

| Stage | Command shape | Emulators needed |
|-------|----------------|------------------|
| Lint / typecheck | No emulators | — |
| Unit tests | `pnpm test` in `web/`, `flutter test` in `app/` | No |
| Firebase integration | `emulators:exec` → rules tests + functions tests (+ optional web admin tests) | Firestore, Auth, Functions |

**Auth blocking functions** may require **Eventarc** or additional flags per Firebase release notes; pin **firebase-tools** in CI and document any extra `--only` flags in the CI workflow file comment block.

---

## 8. Review checklist (authors and reviewers)

- [ ] Does this PR change **Firestore rules** or **indexes**? If yes, rules tests and index documentation must update.  
- [ ] Does this PR change **Cloud Functions** Auth or Firestore behavior? If yes, integration tests or an explicit “tracked follow-up” issue is required.  
- [ ] Does this PR add a **new Remote Config key**? If yes, update `firebase/docs/remote-config-keys.md`, template JSON, and parsing tests.  
- [ ] Are tests **free of production credentials** and **free of real FCM sends** in default CI paths?

### 8.1 Magic-link rollout checklist

- [ ] Run `npm --prefix scripts run backup:guests` and archive artifact before cutover.
- [ ] Run `npm --prefix scripts run audit:guests -- --strict` and resolve all findings.
- [ ] Validate `onUserCreate` UID-first behavior in `functions/test/integration/on-user-create.int.test.cjs`.
- [ ] Validate issuance audit docs in `magic_link_issues` through `functions/test/integration/generate-magic-link.int.test.cjs`.
- [ ] Enable `MAGIC_LINK_CLEANUP_DRY_RUN=true` for first rollout week and review candidate logs daily.

---

## 9. Revision history

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-04-14 | Initial policy; Storage explicitly excluded. |
