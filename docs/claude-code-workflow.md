# Claude Code Workflow for Linear Issues

This guide covers the slash commands and agents available for implementing Linear issues in the Boda en Tarifa project.

## Quick Start

```
/next-issue              # Find the next actionable issue
/check-blockers MFC-11   # Verify an issue is ready
/plan-issue MFC-11       # Get a detailed implementation plan
/implement-issue MFC-11  # Write code, run checks, review
```

That's the full cycle. Each command builds on the previous one.

## Linear CLI Script

All commands use `scripts/linear.py` for reading Linear data instead of the MCP server. This dramatically reduces token overhead per invocation.

```bash
python3 scripts/linear.py list-todo           # All Todo issues (table with priority, estimate, labels, blockers)
python3 scripts/linear.py get-issue MFC-23    # Full issue details + description
python3 scripts/linear.py get-issue-id MFC-23 # Just the Linear UUID (for mutations)
```

The MCP server is only used for **write operations** (`save_issue`, `create_comment`) in `/implement-issue`.

**Prerequisite**: A `LINEAR_API_KEY` must be set in `.env` or as an environment variable.

## Commands

### `/next-issue`

**What it does**: Scans all Todo and Backlog issues in Linear, filters out blocked ones, and ranks the rest by priority, milestone, and estimate.

**Usage**:

```
/next-issue        # All milestones
/next-issue M1     # Only M1 Foundation issues
/next-issue M3     # Only M3 Content Core issues
```

**Milestone shortcuts**: M1 through M7 map to the full milestone names (M1 Foundation, M2 Auth & Skeleton, etc.)

**Output**: Top 3 actionable issues with summaries, plus a backlog overview showing how many issues are done, in progress, blocked, etc.

**Runs on**: haiku (fast, lightweight)

---

### `/check-blockers`

**What it does**: Deep-dives into a specific issue's dependency chain. For each blocker, it checks the Linear status AND verifies that the expected files actually exist in the codebase.

**Usage**:

```
/check-blockers MFC-23
```

**Why this matters**: An issue marked "Done" in Linear doesn't guarantee the code was merged or the files are present. This command catches that gap.

**Output**: A table of blockers with status and artifact verification, plus a readiness assessment and suggested next steps.

**Runs on**: haiku (fast, lightweight)

---

### `/plan-issue`

**What it does**: Two-phase read-only analysis of an issue:

1. **Exploration** (haiku agent) — Fetches the issue from Linear, reads referenced specs, inventories files to create/modify, checks blocker artifacts, finds reference implementations in the codebase.

2. **Planning** (sonnet agent) — Takes the exploration findings and designs an ordered implementation plan with file-by-file details, package dependencies, testing strategy, and verification commands.

**Usage**:

```
/plan-issue MFC-23
```

**Output**: A full implementation plan you can review before writing any code. Suggests `/implement-issue MFC-23` as the next step.

**Important**: This command never modifies any files. It's purely for review and approval.

**Runs on**: Your active model (inherits from session)

---

### `/implement-issue`

**What it does**: End-to-end implementation with human checkpoints at every stage:

| Phase | What happens | Human checkpoint |
|-------|-------------|-----------------|
| 1. Validate | Fetches issue, checks all blockers are Done | Stops if blocked |
| 2. Branch | Creates git branch, sets Linear status to In Progress | Warns if tree is dirty |
| 3. Explore | Fresh codebase scan via explorer agent | — |
| 4. Implement | Writes code following project conventions | — |
| 5. Verify | Runs lint, analyze, test, build | Fixes failures before continuing |
| 6. Review | Presents summary with files changed and acceptance criteria | **Waits for your approval** |
| 7. Update | Commits and/or marks issue Done in Linear | **Only on explicit request** |

**Usage**:

```
/implement-issue MFC-23
```

**Key safety guarantees**:
- Will not proceed if blockers are unresolved
- Will not commit automatically
- Will not push to remote
- Will not close the Linear issue without your say-so

**Runs on**: Your active model (inherits from session — use opus for complex issues)

## Agents

The commands above use two specialized agents under the hood. You don't invoke these directly — the commands spawn them as needed.

### `issue-explorer` (haiku, read-only)

Gathers context: fetches the Linear issue with relations, checks blocker status, reads spec files, inventories codebase state, finds reference implementations. Returns a structured report.

### `issue-planner` (sonnet, read-only)

Takes the explorer's findings and designs an ordered implementation plan. Knows the project's architecture conventions (Flutter clean architecture, Next.js App Router, Firebase rules patterns) and produces convention-respecting file-by-file instructions.

Both agents are prevented from writing or editing any files.

## Typical Workflow

### Starting a new work session

```
/next-issue
```

Review the top picks. Choose one based on your priorities.

### Before starting an issue

```
/check-blockers MFC-XX
```

Make sure everything is actually ready — both in Linear status and in the codebase.

### Planning

```
/plan-issue MFC-XX
```

Read through the implementation plan. Look for:
- Missing prerequisites you hadn't considered
- Files that need changes you weren't expecting
- Package dependencies that need adding
- Risks or trade-offs flagged by the planner

If the plan needs adjustment, discuss it before moving on.

### Implementing

```
/implement-issue MFC-XX
```

The command handles branching, coding, and verification. When it presents the summary:
- Review the files changed
- Check that acceptance criteria are mapped
- Look at verification results

Then tell it to commit, push, or update Linear as needed.

### After implementation

```
/next-issue
```

See what's now unblocked. Completing one issue often unblocks others downstream.

## Tips

- **Run `/plan-issue` before `/implement-issue`** for complex issues. For simple ones, you can skip straight to implement.
- **Milestone filters** help focus: `/next-issue M1` when you want to finish the foundation before moving on.
- **Check blockers when something feels off**. If `/implement-issue` stops because a blocker isn't done, `/check-blockers` will tell you exactly what's missing.
- **You control the commits**. Nothing is committed or pushed without your explicit approval. Review the diff yourself before committing.
- **Model matters for `/implement-issue`**. For straightforward issues, the default model works fine. For complex cross-cutting issues, consider using opus.
