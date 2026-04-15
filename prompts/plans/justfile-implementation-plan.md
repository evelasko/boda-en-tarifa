# Monorepo Justfile Implementation Plan

> **Date:** 2026-04-14  
> **Scope:** Define and implement a root-level `justfile` and supporting developer experience for the Boda en Tarifa monorepo  
> **Audience:** Human developers and coding agents  
> **Related references:**  
> - `prompts/plans/firebase-functions-integration-test-suite-plan.md`  
> - `prompts/plans/firebase-emulator-seeding-plan.md`  
> - `prompts/plans/firebase-emulator-seed-dataset-spec.md`  
> - `specs/testing-policy.md`

---

## 1. Purpose and success criteria

## 1.1 Purpose

Create a robust root-level command orchestration layer using `just` so developers and coding agents can execute all common monorepo workflows from a single, consistent interface, with optional guided TUI flows via `gum`.

## 1.2 Primary success criteria

1. New contributors can discover and run core workflows without reading multiple package-level docs first.  
2. Common operations (emulator lifecycle, seeding, app/web/functions dev, checks) are available as stable, memorable commands.  
3. Interactive menus improve usability for humans without breaking automation and CI use cases.  
4. Commands are safe-by-default, with clear confirmation on potentially destructive actions.  
5. The command API is stable and documented so coding agents can reliably call it.

---

## 2. Design principles (must hold)

1. **Single entrypoint:** root-level `justfile` is canonical orchestration surface.  
2. **Two-layer architecture:**  
   - non-interactive primitives for CI/agents  
   - interactive wrappers for humans (`gum`)  
3. **Explicit naming conventions:** namespaced recipe names (`domain:action`, `domain:subdomain:action`).  
4. **Safety first:** destructive recipes require explicit confirmation in interactive mode and explicit opt-in in non-interactive mode.  
5. **Minimal hidden state:** print selected project, key ports, and important preconditions before execution.  
6. **No business logic duplication:** keep core logic in existing scripts/tools; `just` orchestrates them.  
7. **Idempotent where possible:** repeated setup/reset commands should yield predictable outcomes.

---

## 3. Target command architecture

## 3.1 Top-level domains

The `justfile` should organize recipes into these domains:

- discovery and setup  
- environment and diagnostics  
- emulator lifecycle  
- data seeding lifecycle  
- web workflows  
- functions workflows  
- app workflows  
- test and quality workflows  
- firebase platform/deploy workflows  
- ops utilities (magic links, linear helper)  
- golden path composite flows  
- interactive menus

## 3.2 Interaction classes

Each recipe must be explicitly classified:

- **Class A — primitive / non-interactive:** safe for agents and CI  
- **Class B — guided / interactive:** uses `gum`, intended for humans  
- **Class C — destructive:** clear/reset/delete style; requires confirmation behavior

---

## 4. Canonical command matrix (v1)

This matrix is the required baseline API for the first release of the `justfile`.

## 4.1 Discovery, diagnostics, setup

| Recipe | Class | Purpose | Depends on |
|---|---|---|---|
| `help` (default) | A | Show categorized command catalog | none |
| `menu` | B | Root interactive menu | `gum` |
| `doctor` | A | Validate installed tools and versions | `just`, `gum`, `firebase`, `node`, `flutter` |
| `env:check` | A | Validate required env vars for selected workflow | shell env |
| `setup:all` | A | Install all monorepo dependencies | package managers |
| `setup:web` | A | Install web dependencies | `web` package manager |
| `setup:functions` | A | Install functions dependencies | npm |
| `setup:scripts` | A | Install scripts dependencies | npm |
| `setup:app` | A | Install Flutter dependencies | flutter |

## 4.2 Emulator lifecycle

| Recipe | Class | Purpose | Depends on |
|---|---|---|---|
| `emu:start` | A | Start configured emulator suite | firebase cli |
| `emu:start:core` | A | Start core emulators only | firebase cli |
| `emu:stop` | A | Stop emulator processes | local process tools |
| `emu:status` | A | Print emulator/project context | firebase cli |
| `emu:exec` | A | Execute command inside `firebase emulators:exec` | firebase cli |
| `emu:reset` | C | Clear + seed emulator data in one flow | scripts + emulator env |

## 4.3 Data lifecycle

| Recipe | Class | Purpose | Depends on |
|---|---|---|---|
| `data:seed` | A | Seed default emulator dataset | `scripts/seed-emulator.ts` |
| `data:seed:rsvp` | A | Seed + optional RSVP fixtures | scripts |
| `data:seed:migration` | A | Seed + migration fixtures | scripts |
| `data:clear` | C | Clear seeded dataset | `scripts/clear-emulator.ts` |
| `data:clear:rsvp` | C | Clear with RSVP fixtures | scripts |
| `data:clear:migration` | C | Clear with migration fixtures | scripts |
| `data:reset` | C | Deterministic clear then seed | scripts |
| `data:menu` | B | Interactive seed/clear menu | `gum` |

## 4.4 Web workflows

| Recipe | Class | Purpose | Depends on |
|---|---|---|---|
| `web:dev` | A | Start Next.js development server | web deps |
| `web:build` | A | Build web app | web deps |
| `web:start` | A | Start built web server | web build output |
| `web:lint` | A | Lint web code | eslint |
| `web:clean` | A | Remove web build artifacts | file ops |
| `web:deploy` | A | Deploy hosting target | firebase cli |

## 4.5 Functions workflows

| Recipe | Class | Purpose | Depends on |
|---|---|---|---|
| `fx:build` | A | Build functions TypeScript | functions deps |
| `fx:watch` | A | Build in watch mode | functions deps |
| `fx:lint` | A | Lint functions | eslint |
| `fx:serve` | A | Local functions serve path | firebase cli |
| `fx:shell` | A | Open functions shell | firebase cli |
| `fx:logs` | A | Read functions logs | firebase cli |
| `fx:deploy` | A | Deploy functions | firebase cli |
| `fx:test:int` | A | Run functions integration tests | emulator + test setup |

## 4.6 Flutter app workflows

| Recipe | Class | Purpose | Depends on |
|---|---|---|---|
| `app:pub:get` | A | Install app dependencies | flutter |
| `app:analyze` | A | Static analysis | flutter |
| `app:test` | A | Run Flutter tests | flutter |
| `app:run` | A | Run app with standard config | flutter |
| `app:run:emu` | A | Run app with emulator-oriented config | flutter + emulator env |
| `app:build:android` | A | Build Android artifact | flutter/android |
| `app:build:ios` | A | Build iOS artifact | flutter/xcode |
| `app:gen` | A | Run code generation | dart build_runner |

## 4.7 Tests and quality

| Recipe | Class | Purpose | Depends on |
|---|---|---|---|
| `check` | A | Fast quality gate across key packages | lint/build/analyze |
| `check:full` | A | Comprehensive validation | all checks |
| `test` | A | Aggregate test entrypoint | package tests |
| `test:int` | A | Aggregate integration entrypoint | emulators + package tests |
| `qa:smoke` | A | Curated local smoke sequence | selected checks |
| `qa:simulator:prep` | A | Prepare simulator-friendly local state | emulators + data reset |

## 4.8 Firebase platform and deployment

| Recipe | Class | Purpose | Depends on |
|---|---|---|---|
| `fb:status` | A | Print active project and configuration | firebase cli |
| `fb:use` | A | Switch firebase project alias | firebase cli |
| `fb:deploy:all` | A | Deploy all configured targets | firebase cli |
| `fb:deploy:functions` | A | Deploy functions target | firebase cli |
| `fb:deploy:hosting` | A | Deploy hosting target | firebase cli |
| `fb:deploy:remoteconfig` | A | Deploy Remote Config template | firebase cli |
| `fb:deploy:rules` | A | Deploy Firestore rules/indexes | firebase cli |

## 4.9 Ops utilities

| Recipe | Class | Purpose | Depends on |
|---|---|---|---|
| `ops:magic-links` | A | Generate magic links | scripts tooling |
| `ops:magic-links:dry` | A | Dry-run magic links | scripts tooling |
| `ops:linear:list` | A | List todo issues | python + api key |
| `ops:linear:get` | A | Get issue details | python + api key |
| `ops:linear:id` | A | Resolve issue UUID | python + api key |

## 4.10 Golden path composite flows

| Recipe | Class | Purpose |
|---|---|---|
| `flow:dev:app` | A | Standard app local loop: env check, emulators, seed, run app |
| `flow:dev:web` | A | Standard web local loop: env check, emulators, seed, run web |
| `flow:test:functions` | A | Functions integration test loop under emulators |
| `flow:qa:smoke` | A | End-to-end local smoke workflow |
| `flow:release:web` | A | Pre-release web validation and deploy sequence |
| `flow:release:functions` | A | Pre-release functions validation and deploy sequence |

---

## 5. TUI design requirements (`gum`)

Interactive flows must exist but remain optional.

## 5.1 Required menu surfaces

- `menu` (root menu)
- `menu:dev`
- `menu:data`
- `menu:qa`
- `menu:deploy`

## 5.2 TUI UX standards

1. Show current project id and key emulator ports in header.  
2. Show short one-line explanation before running each action.  
3. Ask confirmation for destructive actions.  
4. Display clear success/failure status and next suggested step.  
5. Provide easy return to previous menu and exit path.

## 5.3 Non-interactive parity rule

Every interactive action must have an equivalent non-interactive recipe name so agents/CI can execute the same workflow deterministically.

---

## 6. Safety and policy guardrails

1. Any clear/reset/delete operation is labeled destructive and requires confirmation in interactive mode.  
2. Commands that could touch non-local Firebase resources must print the active project first.  
3. Default project in local workflows should remain the designated demo/local project unless explicitly overridden.  
4. Commands that rely on secrets must validate presence and fail with actionable guidance.  
5. Integration-oriented workflows should align with `specs/testing-policy.md` guidance around emulators and non-emulated boundaries.

---

## 7. Rollout phases

## Phase 1 — Foundation

Deliver:

- root `justfile` scaffolding
- help output with command categories
- diagnostics and setup recipes
- core emulator start/stop/status

Exit criteria:

- team can run `just`, discover commands, and start emulator stack from root.

## Phase 2 — Data and core dev loops

Deliver:

- full data lifecycle recipes (`data:*`)
- web/functions/app core dev recipes
- first golden paths (`flow:dev:app`, `flow:dev:web`)

Exit criteria:

- one command can take a developer from clean shell to productive local app/web loop.

## Phase 3 — Testing and QA orchestration

Deliver:

- aggregate check/test recipes
- integration-oriented recipes tied to emulator lifecycle
- QA prep and smoke flows

Exit criteria:

- local and agent-driven validation workflows are stable and documented.

## Phase 4 — Deploy and ops workflows

Deliver:

- firebase deploy command family
- ops utility wrappers (magic links, linear)
- release-oriented golden paths

Exit criteria:

- release and operational commands are consistent and predictable from root.

## Phase 5 — Interactive polish

Deliver:

- complete `gum` menu surfaces
- confirmation and status UX
- discoverability refinements

Exit criteria:

- human operators can run common workflows via TUI without needing docs.

---

## 8. Documentation deliverables

To avoid ambiguity, produce these docs alongside implementation:

1. Root workflow guide describing command philosophy and naming conventions.  
2. Command index with domain, purpose, required env/tooling, and examples.  
3. Quick-start recipes for common personas:
   - app developer
   - web developer
   - backend/functions developer
   - QA/manual tester
4. Agent usage notes:
   - prefer non-interactive recipes
   - when to use flow recipes vs primitive recipes
   - destructive command policy

---

## 9. Acceptance criteria checklist

- [ ] Root `justfile` exists and is treated as canonical orchestration layer.  
- [ ] All v1 matrix commands are implemented or explicitly marked deferred with rationale.  
- [ ] Every interactive command has a non-interactive counterpart.  
- [ ] Data seed/clear/reset recipes align with `scripts/seed-emulator.ts` and `scripts/clear-emulator.ts`.  
- [ ] Emulator and integration test workflows align with `specs/testing-policy.md`.  
- [ ] Destructive operations include clear safeguards.  
- [ ] Documentation is sufficient for both humans and coding agents to execute workflows without guesswork.

---

## 10. Future extension points (post-v1)

1. Introduce per-environment recipe profiles (local, CI, staging).  
2. Add telemetry-lite command timing summary for bottleneck identification.  
3. Add role-based menus (developer, QA, release manager).  
4. Integrate lightweight preflight checks before deploy flows.  
5. Add compatibility layer for alternate package managers if standardization changes.

---

## 11. Decision log template (recommended)

Maintain a short decision log in the same folder for command API changes:

- date
- decision
- impacted recipes
- migration notes

This keeps command evolution auditable and prevents silent breaking changes for agents and humans.
