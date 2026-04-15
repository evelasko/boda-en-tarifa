# Firebase Functions Integration Test Suite Plan

> **Date:** 2026-04-14  
> **Scope:** `functions/` integration suite implementation  
> **Canonical policy reference:** `specs/testing-policy.md`

This plan defines the concrete steps to implement the Firebase Functions integration test suite for `functions/`, aligned with the repository testing standards in `specs/testing-policy.md` (especially Sections 3.1, 5.1, 5.3, 6, and 7).

---

## 1. Outcomes and constraints

### 1.1 Target outcomes

1. Run repeatable integration tests for Firebase Functions using the Local Emulator Suite.
2. Cover highest-risk business paths first:
   - `generateMagicLink` (`onCall`)
   - `onUserCreate` (`beforeUserCreated`)
   - Scheduled jobs with Firestore/Auth effects
3. Make CI-safe guarantees:
   - No production credentials required
   - No real FCM sends in PR CI

### 1.2 Guardrails from testing policy

- Use **Jest** for `functions/` (`specs/testing-policy.md` §3.1).
- Use emulator-first integration tests for Firestore/Auth/Functions (`specs/testing-policy.md` §5.1).
- Treat FCM as a boundary and stub send path in test environments (`specs/testing-policy.md` §5.3).
- Use deterministic test data + cleanup strategy (`specs/testing-policy.md` §6).
- Execute integration tests inside `firebase emulators:exec` (`specs/testing-policy.md` §7).

---

## 2. Implementation phases

## Phase 0 — Finalize technical approach

### 0.1 Module/test strategy decision

Choose one approach before implementation:

- **Approach A (recommended):** Build TS first, run Jest against compiled `lib/`.
  - Pros: lowest friction with NodeNext + Jest.
  - Cons: build step required before tests.
- **Approach B:** Run Jest directly on TS source with transform tooling.
  - Pros: direct source mapping.
  - Cons: more ESM/config complexity.

Recommendation: **Approach A** for faster adoption.

### 0.2 Emulator project id convention

Adopt one fixed id for local/CI integration runs:

- `demo-boda-en-tarifa`

Use consistently in test harness and emulator commands.

---

## Phase 1 — Test tooling setup in `functions/`

### 1.1 Add dependencies

Add test dependencies in `functions/package.json`:

- `jest`
- `@types/jest`
- Optional only if needed by chosen approach:
  - `ts-jest` (for source transform approach)

`firebase-functions-test` is already present and should remain.

### 1.2 Add scripts

Add scripts in `functions/package.json`:

- `test`: base Jest entry point
- `test:integration`: integration subset (or separate config)
- Optional helper: `test:integration:watch` for local iteration

### 1.3 Add Jest config

Create either:

- `functions/jest.config.cjs` and optional `jest.integration.config.cjs`, or
- one config with testPath patterns.

Baseline settings:

- `testEnvironment: "node"`
- deterministic timeout for emulator I/O
- conservative workers (`maxWorkers: 1`) if flakiness appears

---

## Phase 2 — Shared integration harness

### 2.1 Directory structure

Add a test structure under `functions/`:

- `test/integration/`
- `test/helpers/`

Suggested files:

- `test/helpers/emulator-env.ts`
- `test/helpers/firestore-seed.ts`
- `test/helpers/auth-seed.ts`
- `test/helpers/cleanup.ts`

### 2.2 Emulator env bootstrap

In helper bootstrap:

- Validate required env vars exist:
  - `FIRESTORE_EMULATOR_HOST`
  - `FIREBASE_AUTH_EMULATOR_HOST`
- Initialize Admin app for emulator access.
- Ensure all helper modules use the same app instance.

### 2.3 Data isolation

Adopt deterministic id patterns:

- Prefix test docs/users with suite names and timestamps.
- Centralized cleanup in `afterEach`/`afterAll`.

---

## Phase 3 — Implement auth/callable integration tests (priority 1)

## 3.1 `generateMagicLink` (`src/auth/generate-magic-link.ts`)

Create `test/integration/generate-magic-link.int.test.ts` with cases:

1. Reject unauthenticated caller (`unauthenticated`).
2. Reject non-admin caller (`permission-denied`).
3. Reject invalid payload (`invalid-argument`).
4. Reject unknown guest (`not-found`).
5. Success path:
   - guest exists in Firestore
   - admin caller authenticated
   - returns `deepLinkUrl` and `expiresAt`
   - URL contains token query param and optional name

### 3.2 `onUserCreate` (`src/auth/on-user-create.ts`)

Create `test/integration/on-user-create.int.test.ts` with cases:

1. No event data -> unauthorized claim.
2. No email -> unauthorized claim.
3. No guest match by email -> unauthorized claim.
4. Guest match, same UID, `profileClaimed=false` -> updates claim flag.
5. Guest match, different doc id -> migrates guest doc to auth UID and deletes old doc.
6. Guest match with `isAdmin=true` -> includes `admin` custom claim.

Implementation note:

- Time-box an initial spike to validate best invocation method for Gen2 `beforeUserCreated`.
- If wrapper friction appears, keep tests integration-focused by invoking the exported function path in a documented supported way.

---

## Phase 4 — Scheduled function integration tests (priority 2)

### 4.1 `cleanupExpiredMagicLinks`

Create `test/integration/cleanup-expired-magic-links.int.test.ts`:

- Seed emulator Auth users:
  - unauthorized and older than grace period
  - unauthorized but recent
  - authorized and old
- Assert only target users are deleted.

### 4.2 FCM-touching scheduled functions

Targets:

- `sendEventReminder`
- `sendContentUnlockNotification`
- `triggerFilmDevelopment`

Per policy (`specs/testing-policy.md` §5.3):

- Stub `getMessaging().send` in tests.
- Keep Firestore behavior real:
  - idempotency documents created/checked
  - due notifications persisted correctly
  - repeated runs skip when already sent

Also test no-op cases:

- no due notifications
- existing idempotency doc

---

## Phase 5 — Local execution and CI integration

### 5.1 Local command pattern

Run integration tests through emulators:

```bash
firebase emulators:exec --project demo-boda-en-tarifa "npm --prefix functions run test:integration"
```

Use `--only` subsets if needed during local iteration, then verify full suite with required services.

### 5.2 CI workflow

Add/extend CI job:

1. Install dependencies
2. Build `functions/`
3. Run integration tests via `firebase emulators:exec`

Pin Firebase CLI version to reduce emulator behavior drift.

### 5.3 Merge gates

Set minimum merge gate for functions-related PRs:

- Integration tests pass for:
  - `generateMagicLink`
  - `onUserCreate`
  - at least one FCM-adjacent scheduled function path + one Auth cleanup path

---

## 3. Deliverables checklist

- [ ] Jest integrated in `functions/` with stable config
- [ ] Integration harness + helpers in `functions/test/`
- [ ] `generateMagicLink` integration tests
- [ ] `onUserCreate` integration tests
- [ ] `cleanupExpiredMagicLinks` integration tests
- [ ] FCM-adjacent scheduled function tests with send boundary stub
- [ ] `test:integration` command documented
- [ ] CI integration using `firebase emulators:exec`
- [ ] Short README section in `functions/` linking to `specs/testing-policy.md`

---

## 4. Risks and mitigations

1. **Gen2 identity trigger test friction**
   - Mitigation: spike first, document chosen invocation approach.
2. **NodeNext + Jest compatibility issues**
   - Mitigation: test compiled `lib/` first.
3. **Flaky emulator state between tests**
   - Mitigation: strict cleanup + serial execution if required.
4. **Real FCM accidental sends**
   - Mitigation: enforce test-time stub and CI guardrails.

---

## 5. Suggested rollout cadence

### Sprint 1

- Phase 0-2 complete
- `generateMagicLink` integration tests green locally

### Sprint 2

- `onUserCreate` integration tests green
- CI job added and passing

### Sprint 3

- Scheduled job suite completed
- Documentation and merge gate finalized

---

## 6. Traceability

This plan implements and operationalizes the policy decisions in:

- `specs/testing-policy.md` (authoritative testing strategy)

And validates behavior documented in:

- `specs/magic-link-auth-flow.md`
- `firebase/docs/firestore-data-model.md`
