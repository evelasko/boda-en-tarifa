---
argument-hint: "<issue-identifier e.g. MFC-23>"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Task
---

# Plan Issue: $ARGUMENTS

You are creating an implementation plan for a Linear issue. This is a **read-only** workflow — you will NOT write any code.

## Phase 1: Exploration

Spawn the `issue-explorer` agent to gather all context for `$ARGUMENTS`:

```
Task agent: issue-explorer
Prompt: "Explore issue $ARGUMENTS and produce a full exploration report."
```

Wait for the structured exploration report.

**If the explorer reports the issue is blocked** (not all blockers are Done), present the blocker status and suggest running `/check-blockers $ARGUMENTS` for more detail. Ask the user if they want to continue planning anyway or stop.

## Phase 2: Planning

Take the exploration report and spawn the `issue-planner` agent:

```
Task agent: issue-planner
Prompt: |
  Here is the exploration report for $ARGUMENTS:
  [paste full exploration report]

  Here is the full issue description:
  [paste issue description from the explorer's fetch]

  Design a detailed implementation plan following project conventions.
```

Wait for the structured implementation plan.

## Phase 3: Present for Approval

Present the results to the user in this format:

---

### Issue: [identifier] — [title]
**Priority**: ... | **Estimate**: ... points | **Milestone**: ...

### Readiness
[Blocker status summary from exploration]

### Implementation Plan
[Full plan from the planner agent]

### Next Steps
- Review the plan above and let me know if you'd like any changes
- When ready, run `/implement-issue $ARGUMENTS` to execute this plan
- To check specific blockers: `/check-blockers $ARGUMENTS`

---

**IMPORTANT**: Do NOT write any code, create any files, or modify anything. This command is purely for planning and review.
