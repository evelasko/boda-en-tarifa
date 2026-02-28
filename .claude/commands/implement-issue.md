---
argument-hint: "<issue-identifier e.g. MFC-23>"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
  - Edit
  - Task
  - mcp__linear-server__save_issue
  - mcp__linear-server__create_comment
---

# Implement Issue: $ARGUMENTS

You are implementing a Linear issue end-to-end. Follow each phase carefully with human checkpoints.

## Linear CLI

All Linear reads go through the lean Python script. MCP is only used for mutations (save_issue, create_comment).

```bash
python3 scripts/linear.py get-issue MFC-XX   # Full issue details + description
python3 scripts/linear.py get-issue-id MFC-XX # UUID for MCP mutations
python3 scripts/linear.py list-todo           # All Todo issues
```

## Phase 1: Fetch and Validate

1. Run `python3 scripts/linear.py get-issue $ARGUMENTS` to fetch the full issue with status, blockers, and description
2. The output lists active blockers inline. If any blockers are shown, fetch each with `python3 scripts/linear.py get-issue MFC-YY` and verify its status is **Done** or **Cancelled**
3. **If any blocker is not resolved**: Stop immediately. Present the blocker status and suggest:
   - `/check-blockers $ARGUMENTS` for detailed diagnostics
   - Which blocker issues to work on first
   - Do NOT proceed with implementation

4. Record the issue's title, description, labels, and acceptance criteria from the script output

## Phase 2: Prepare Workspace

1. Ensure the working tree is clean (`git status`). If there are uncommitted changes, warn the user and stop.
2. Get the issue UUID: `python3 scripts/linear.py get-issue-id $ARGUMENTS`, then update status to **In Progress** using `mcp__linear-server__save_issue` with that `id`

## Phase 3: Exploration

Spawn the `issue-explorer` agent for a fresh codebase scan:

```
Task agent: issue-explorer
Prompt: "Explore issue $ARGUMENTS and produce a full exploration report. Focus on current codebase state and reference implementations."
```

Review the exploration report to understand:
- Which files exist vs need creation
- Reference implementations to follow
- Any gaps or missing prerequisites

## Phase 4: Implementation

Write the code following the issue's specification and the exploration findings. Adhere strictly to these conventions:

### Flutter (`app/`) Conventions
- **Architecture**: `lib/features/<name>/domain/`, `data/`, `presentation/`
- **Models**: Freezed with `@freezed`, include `fromJson`/`toJson`
- **State**: Riverpod with `@riverpod` annotation, `AsyncValue` for async state
- **Errors**: `Either<Failure, T>` from fpdart
- **Routing**: GoRouter, route constants in `lib/core/router/`
- **Order**: domain entities → repository interfaces → data sources → repo impl → providers → UI
- After creating Freezed/Riverpod classes, run: `cd app && dart run build_runner build --delete-conflicting-outputs`

### Web (`web/`) Conventions
- **Framework**: Next.js 15 App Router, TypeScript strict
- **Styling**: TailwindCSS v4 + shadcn/ui
- **Components**: Server Components by default, `'use client'` only when needed
- **Order**: types → API/data → server components → client components → page

### Firebase (`firebase/`) Conventions
- Security rules in `firebase/firestore.rules` and `firebase/storage.rules`
- Follow existing rule patterns and indentation

### Functions (`functions/`) Conventions
- Firebase Functions v2 APIs, TypeScript
- Export from `functions/src/index.ts`

### General
- Match the style and patterns of existing code in the codebase
- Only create files mentioned in the issue or clearly required by them
- Do not add extra features, error handling, or abstractions beyond what's specified
- Use the reference implementations found by the explorer as templates

## Phase 5: Verification

Run the appropriate checks based on which workstreams were touched:

**Flutter**:
```bash
cd app && flutter analyze
cd app && flutter test
```

**Web**:
```bash
cd web && npm run lint
cd web && npm run build
```

**Firebase**:
```bash
# Validate rules syntax if firebase CLI is available
cd firebase && firebase emulators:exec --only firestore "echo rules OK" 2>/dev/null || echo "Skipping emulator check"
```

**Functions**:
```bash
cd functions && npm run lint
cd functions && npm run build
```

If any check fails, fix the issues and re-run until all checks pass. Do not proceed with failures.

## Phase 6: Summary and Review

Present a summary to the user:

```
## Implementation Complete: $ARGUMENTS — [title]

### Files Changed
| File | Action | Description |
|------|--------|-------------|
| path/to/file | Created | Brief description |

### Verification Results
- ✅ flutter analyze: passed
- ✅ flutter test: passed (X tests)
- ...

### Acceptance Criteria
- [x] Criterion from issue — How it was met
- [x] ...

### Review
Please review the changes. When satisfied:
1. I can create a commit for you
2. I can update the Linear issue status to Done
```

**IMPORTANT**: Do NOT commit automatically. Do NOT push. Wait for explicit user approval.

## Phase 7: Linear Update

Only after the user explicitly approves:

1. If the user asks to commit, create a conventional commit with a clear message referencing the issue identifier
2. If the user asks to update Linear, first get the UUID with `python3 scripts/linear.py get-issue-id $ARGUMENTS`, then set the issue status to **Done** using `mcp__linear-server__save_issue` with that `id`
3. Optionally add a comment to the issue using `mcp__linear-server__create_comment` (use the UUID from step 2 as `issueId`)

Never auto-close or auto-commit. Always wait for the user's explicit instruction.
