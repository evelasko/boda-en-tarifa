---
argument-hint: "[optional milestone e.g. M1 or M3]"
model: haiku
allowed-tools:
  - Bash
  - mcp__linear-server__list_issues
---

# Next Issue$ARGUMENTS

Find the next actionable (unblocked) issue to work on in the Boda en Tarifa project.

## Linear CLI

Use the lean Python script for reads to reduce token overhead:

```bash
python3 scripts/linear.py list-todo           # All Todo issues with priority, estimate, labels, blockers
python3 scripts/linear.py get-issue MFC-XX    # Full issue details + description
```

Use `mcp__linear-server__list_issues` ONLY for Backlog issues (the script only covers Todo).

## Configuration
- **Team**: Misfitcoders
- **Project**: BodaEnTarifa
- **Milestone mapping**: M1 = "M1 Foundation", M2 = "M2 Auth & Skeleton", M3 = "M3 Content Core", M4 = "M4 Camera & Media", M5 = "M5 Social & Polish", M6 = "M6 Dashboard & Admin", M7 = "M7 Launch Prep"

## Step 1: Parse Arguments

Check if the user provided a milestone filter in `$ARGUMENTS`:
- If empty or blank, search all milestones
- If provided (e.g. "M1", "M3"), map to the full milestone name and filter

## Step 2: Fetch Candidate Issues

1. First fetch **Todo** issues: run `python3 scripts/linear.py list-todo` — this returns a table with ID, title, priority, estimate, labels, cycle, and blocked-by info
2. Then fetch **Backlog** issues: use `mcp__linear-server__list_issues` with `state: "Backlog"`, `project: "BodaEnTarifa"`

If a milestone filter is active, filter the results client-side by matching labels or title prefixes.

## Step 3: Check Blockers

The `list-todo` output already includes a "Blocked" column showing active blockers for each issue.

An issue is **actionable** if its Blocked column shows `-` (no active blockers).

For Backlog issues (from MCP), run `python3 scripts/linear.py get-issue MFC-XX` for each candidate to check their blocker status.

## Step 4: Rank Actionable Issues

Sort the actionable issues by:
1. **Priority** (1=Urgent first, then 2=High, 3=Normal, 4=Low, 0=None last)
2. **Milestone order** (M1 before M2 before M3, etc.)
3. **Estimate** (smaller estimates first — quick wins)

## Step 5: Present Results

```
## Next Actionable Issues

### Top Picks

#### 1. MFC-XX — [Title]
- **Priority**: High | **Estimate**: X pts | **Milestone**: M1 Foundation
- **Labels**: [labels]
- **Summary**: [1-2 sentence summary from description]
- 👉 `/plan-issue MFC-XX`

#### 2. MFC-YY — [Title]
- **Priority**: Normal | **Estimate**: X pts | **Milestone**: M1 Foundation
- **Labels**: [labels]
- **Summary**: [1-2 sentence summary]
- 👉 `/plan-issue MFC-YY`

#### 3. MFC-ZZ — [Title]
- **Priority**: Normal | **Estimate**: X pts | **Milestone**: M2 Auth & Skeleton
- **Labels**: [labels]
- **Summary**: [1-2 sentence summary]
- 👉 `/plan-issue MFC-ZZ`

### Backlog Overview
| Status | Count |
|--------|-------|
| Done | X |
| In Progress | X |
| Todo (actionable) | X |
| Todo (blocked) | X |
| Backlog | X |
| Total | X |

[If milestone filter was active]: Showing results for **[milestone name]** only.
```

If no actionable issues are found, explain why (all remaining issues are blocked) and suggest which blocker issues to tackle first.
