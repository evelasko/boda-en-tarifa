---
argument-hint: "<issue-identifier e.g. MFC-23>"
model: haiku
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Check Blockers: $ARGUMENTS

Diagnose the blocker readiness for a Linear issue.

## Linear CLI

All Linear reads go through the lean Python script:

```bash
python3 scripts/linear.py get-issue MFC-XX   # Full issue: status, priority, blockers, description
python3 scripts/linear.py list-todo           # All Todo issues with blockers
```

Do NOT use MCP tools. Always use the script via Bash.

## Step 1: Fetch Target Issue

Run `python3 scripts/linear.py get-issue $ARGUMENTS`.

Extract the title, status, and active blockers from the output.

If no blockers are listed, report that it's immediately actionable and suggest `/plan-issue $ARGUMENTS`.

## Step 2: Fetch Each Blocker

For each blocker shown in the output, run `python3 scripts/linear.py get-issue MFC-YY`. Record:
- Identifier and title
- Current status
- Its own blockers (to detect deep chains)

## Step 3: Verify Artifacts for Done Blockers

For blockers marked as **Done**, verify their deliverables exist in the codebase:
- Parse the blocker's description for "Files to Create/Modify" section
- Use `Glob` and `Read` to check if those files exist
- For key files, verify they contain expected exports/classes (quick grep)
- Mark artifact status: ✅ Verified, ⚠️ Partial, ❌ Missing

## Step 4: Report

Present results in this format:

```
## Blocker Report: $ARGUMENTS — [title]
**Status**: [current status]

### Blockers
| # | Issue | Title | Status | Assignee | Artifacts |
|---|-------|-------|--------|----------|-----------|
| 1 | MFC-YY | ... | Done ✅ | @name | Verified ✅ |
| 2 | MFC-ZZ | ... | In Progress 🔄 | @name | N/A |
| 3 | MFC-AA | ... | Todo 📋 | Unassigned | N/A |

### Deep Dependencies
[If any blocker is itself blocked, show the chain]
- MFC-ZZ is blocked by MFC-BB (Todo) → needs to be resolved first

### Assessment
- **Ready to implement**: Yes ✅ / No ❌
- **Next action**: [What to do — e.g., "Work on MFC-ZZ first" or "All clear, run /plan-issue $ARGUMENTS"]

### Suggested Commands
- `/plan-issue $ARGUMENTS` — Plan this issue (if ready)
- `/plan-issue MFC-ZZ` — Plan the blocking issue first (if not ready)
- `/check-blockers MFC-ZZ` — Check blockers of the blocking issue
```
