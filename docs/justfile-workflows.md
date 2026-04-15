# Monorepo Justfile Workflows

This repository uses a root `justfile` as the canonical command layer for local development, QA, and Firebase operations.

## Command philosophy

- Use one entrypoint from repository root: `just <recipe>`.
- Prefer non-interactive recipes for automation and coding agents.
- Use interactive menus (`menu*`) for guided human workflows.
- Treat all clear/reset/delete operations as destructive.

### Naming conventions

- Domain-first naming with hyphen separators: `domain-action` and `domain-subdomain-action`.
- The implementation uses hyphenated recipe names, which are the `just`-compatible equivalent of the plan’s `domain:action` notation.
- Core domains:
  - setup and diagnostics (`setup-*`, `doctor`, `env-check`)
  - emulators and data (`emu-*`, `data-*`)
  - package workflows (`web-*`, `fx-*`, `app-*`)
  - quality and flows (`check*`, `test*`, `qa-*`, `flow-*`)
  - Firebase deployment and ops (`fb-*`, `ops-*`)

## Safety model

- Destructive non-interactive commands require `CONFIRM=1`.
- Interactive destructive actions prompt for confirmation through `gum`.
- Firebase commands should be run with awareness of active project context (`just fb-status`).
- Integration workflows now use adaptive emulator behavior:
  - reuse running emulators when core ports are already occupied
  - otherwise start a temporary emulator stack via `firebase emulators:exec`.

## Command index

| Domain | Recipes | Purpose | Required tooling/env |
|---|---|---|---|
| Discovery/setup | `help`, `menu`, `doctor`, `env-check`, `setup-*` | Discover and bootstrap local environment | `just`, `gum` (menus), `firebase`, `node`, `flutter` |
| Emulator lifecycle | `emu-start`, `emu-start-core`, `emu-stop`, `emu-status`, `emu-exec`, `emu-ensure-core`, `emu-reset` | Run and inspect Local Emulator Suite | Firebase CLI |
| Data lifecycle | `data-seed*`, `data-clear*`, `data-reset`, `data-menu` | Manage deterministic emulator fixtures | `scripts/*-emulator.ts`, emulator env vars |
| Web | `web-dev`, `web-build`, `web-start`, `web-lint`, `web-clean`, `web-deploy` | Next.js local and deploy workflows | `npm` in `web/` |
| Functions | `fx-build`, `fx-watch`, `fx-lint`, `fx-serve`, `fx-shell`, `fx-logs`, `fx-deploy`, `fx-test-int` | Build, run, and deploy Cloud Functions | `npm` in `functions/`, Firebase CLI |
| App | `app-pub-get`, `app-analyze`, `app-test`, `app-run`, `app-run-emu`, `app-build-android`, `app-build-ios`, `app-gen` | Flutter local and build workflows | Flutter/Dart toolchain |
| Quality | `check`, `check-full`, `test`, `test-int`, `qa-smoke`, `qa-simulator-prep` | Monorepo validation workflows | Lint/build/test tools + emulators for integration |
| Firebase | `fb-status`, `fb-use`, `fb-deploy-*` | Firebase project and deploy operations | Firebase CLI auth + project access |
| Ops | `ops-magic-links*`, `ops-magic-links-emulator*`, `ops-linear-*` | Operational helper scripts | production magic links: service account; emulator links: running emulators + `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` (set by `just`); Linear: `LINEAR_API_KEY`, Python |
| Golden paths | `flow-*` | Composite “one command” workflows | combines prerequisites from composed recipes |
| Menus | `menu`, `menu-dev`, `menu-data`, `menu-qa`, `menu-deploy` | Guided TUI actions for humans | `gum` |

## Quick start by persona

### App developer

```bash
just setup-app
just setup-scripts
just emu-start-core
# new terminal
just data-seed
just app-run-emu
```

### Web developer

```bash
just setup-web
just setup-scripts
just emu-start-core
# new terminal
just data-seed-rsvp
just web-dev
```

### Functions/backend developer

```bash
just setup-functions
just fx-lint
just fx-build
just fx-test-int
```

`fx-test-int` is safe to run whether emulators are already up or not.

### QA/manual tester

```bash
just qa-simulator-prep CONFIRM=1
just qa-smoke
```

## Agent usage notes

- Prefer primitive non-interactive recipes (`Class A`) for deterministic execution.
- Use `flow-*` recipes when you need a standard multi-step baseline quickly.
- Use primitive recipes when you need precise control or partial workflow execution.
- Avoid `menu*` in automation because these require interactive input.
- Never invoke destructive commands without explicit `CONFIRM=1`.
