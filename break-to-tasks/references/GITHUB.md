# GitHub Issues Output

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status`)
- User must confirm the correct repo (`gh repo view` to check)

## Creation steps

1. Confirm repo with user before creating anything
2. Create issues in dependency order (blockers first) so real issue numbers are available for cross-references
3. Apply labels if they exist: `task`, `afk`, or `hitl` — skip silently if labels don't exist
4. After all issues created, comment on the parent PRD issue linking the new task issues (if a parent exists)

## Issue body template

<issue-template>

```
gh issue create \
  --title "<slice title>" \
  --body "$(cat <<'EOF'
## Parent

#<prd-issue-number>  (omit if no parent issue)

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

Avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it here and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- #<issue-number>

Or: "None - can start immediately"
EOF
)"
```

</issue-template>

## After creation

Print a summary table:

| # | Issue | Title | Type | Blocked by |
|---|-------|-------|------|------------|
| 1 | #42   | …     | AFK  | —          |
| 2 | #43   | …     | HITL | #42        |

Do NOT close or modify the parent PRD issue.
