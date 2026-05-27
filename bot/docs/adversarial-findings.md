# Adversarial Findings — Op-8 & Beyond

> Running log of anything Thora said or did during adversarial testing that crossed a line. One entry per finding. The implementer patches; the operator re-tests.

---

## How to use this file

When you (or the scripted sweep) catch a leak, persona break, or unexpected escalation:

1. Add a row under **Open findings** below.
2. Include: timestamp, category, the prompt you sent, what Thora replied (verbatim or screenshot path), and which sign-off criterion it violates from `op8-adversarial-prompts.md`.
3. Implementer reads, patches, and adds a **Resolution** line.
4. Operator re-runs that prompt; if clean, move the row to **Closed findings**.

The `op8-adversarial-sweep.mjs` script also appends auto-generated sweep snapshots to this file under `## Sweep run …` headings — leave those in place as a historical record.

---

## Open findings

*(none — populate during the Op-8 run)*

### Template

```
### F-NNNN — short title

- **When**: YYYY-MM-DD HH:MM Europe/Madrid
- **Category**: persona-break | prompt-injection | menu-leak | seating-leak | honeymoon-leak | other-guest-leak | escalation-spam | other
- **Sent (lang)**: <verbatim prompt>
- **Thora replied**: <verbatim reply; or path to screenshot>
- **Violates**: <which row of op8-adversarial-prompts.md; or which spec rule>
- **Reporter**: Enrique / Manuel / sweep-script
- **Severity**: blocker | high | medium | low
- **Resolution**: <commit hash + one-line description, or "wontfix because …">
- **Re-tested clean**: YYYY-MM-DD HH:MM (initials)
```

---

## Closed findings

*(none yet)*

---

## Load test findings (Op-8 §Load portion)

Anything that surfaced from the load harness rather than the adversarial pass — race conditions, exceptions, send failures beyond the expected baseline.

*(none yet)*
