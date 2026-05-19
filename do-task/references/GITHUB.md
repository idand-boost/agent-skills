# Reading from GitHub Issues

## Fetch

```bash
gh issue view <task-number>
```

Find the PRD issue number in the `## Parent` section of the task body, then:

```bash
gh issue view <prd-number>
```

## What to extract

**From the task issue:**
- `## What to build` — scope of this slice
- `## Acceptance criteria` — definition of done
- `## Blocked by` — prerequisite issue numbers (fetch them too if relevant)

**From the PRD issue:**
- `## Problem Statement` + `## Solution` — context behind every decision
- `## Implementation Decisions` — modules, interfaces, schema changes to follow
- `## Testing Decisions` — what to test and how
