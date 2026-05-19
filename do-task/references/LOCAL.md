# Reading from Local Spec

## Fetch

Read the task file at the path given in the argument:

```
spec/<prd-name>/tasks/<NN>-<slug>.md
```

The parent PRD is always at:

```
spec/<prd-name>/PRD.md
```

## What to extract

**From the task file:**
- `## What to build` — scope of this slice
- `## Acceptance criteria` — definition of done
- `## Blocked by` — prerequisite tasks (read them too if relevant)

**From PRD.md:**
- `## Problem Statement` + `## Solution` — context behind every decision
- `## Implementation Decisions` — modules, interfaces, schema changes to follow
- `## Testing Decisions` — what to test and how
