# GitHub Backlog — Issues

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status`)
- Confirm correct repo with `gh repo view`

---

## Create

1. Confirm repo with user before creating anything
2. Create issues in dependency order (blockers first) so real issue numbers are known for cross-references
3. Apply labels if they exist: `task`, `afk`, or `hitl` — skip silently if labels don't exist
4. After all issues created, comment on the parent PRD issue linking the new task issues (if a parent exists)

### Issue body template

```bash
gh issue create \
  --title "<slice title>" \
  --body "$(cat <<'EOF'
## Parent

#<prd-issue-number>  (omit if no parent issue)

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

Avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can, inline it here. Trim to the decision-rich parts only.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- #<issue-number>

Or: "None - can start immediately"
EOF
)"
```

### After creation

Print a summary table:

| #   | Issue | Title | Type | Blocked by |
| --- | ----- | ----- | ---- | ---------- |
| 1   | #42   | …     | AFK  | —          |
| 2   | #43   | …     | HITL | #42        |

Do NOT close or modify the parent PRD issue.

---

## Fetch

```bash
gh issue view <task-number>
```

Find the PRD issue number in the `## Parent` section of the task body, then:

```bash
gh issue view <prd-number>
```

Load both into context as-is. Key sections to pay attention to:

**From the task issue:** `## What to build`, `## Acceptance criteria`, `## Blocked by`

**From the PRD issue:** `## Problem Statement`, `## Solution`, `## Implementation Decisions`, `## Testing Decisions`

---

## List

```bash
gh issue list --label task --state open
```

If no `task` label exists, list all open issues and filter by those referencing the PRD issue number in their body.

---

## Update Status

| Unified status | GitHub action                                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `todo`         | Reopen: `gh issue reopen <number>`                                                                                                |
| `in-progress`  | Comment: `gh issue comment <number> --body "Status: in-progress"`                                                                 |
| `done`         | Close: `gh issue close <number>`                                                                                                  |
| `blocked`      | Comment: `gh issue comment <number> --body "Status: blocked"` — also `gh issue edit <number> --add-label blocked` if label exists |
