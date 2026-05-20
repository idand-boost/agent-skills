# Local Backlog — spec folder

## Folder structure

```
spec/
└── <prd-name>/
    ├── PRD.md
    └── tasks/
        ├── 01-<slice>.md
        ├── 02-<slice>.md
        └── ...
```

---

## Create

1. Check if `spec/` exists; create it if not
2. Create `spec/<prd-name>/tasks/` directory
3. Write `PRD.md` using the prd-template below
4. Write one `.md` file per task, zero-padded numbering (`01`, `02`, …), using the task-template below
5. Create in dependency order (blockers first) so slugs are known when referenced

Do NOT create any other files. Do NOT modify existing spec folders unless the user asks.

### PRD.md template

<prd-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an \<actor\>, I want a \<feature\>, so that \<benefit\>

This list should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets — they go stale fast.

## Testing Decisions

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this PRD.

## Further Notes

Any further notes about the feature.

## Tasks

| #   | Title     | Type       | Blocked by | Status |
| --- | --------- | ---------- | ---------- | ------ |
| 01  | \<title\> | AFK / HITL | —          | [ ]    |
| 02  | \<title\> | AFK / HITL | 01         | [ ]    |

## Source

\<Link or filename of original PRD if it came from elsewhere\>

</prd-template>

### Task file template (`tasks/NN-<slug>.md`)

<task-template>

## Parent

Reference to `PRD.md` in the same spec folder.

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

Avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can, inline it here. Trim to the decision-rich parts only.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- `01-<slug>.md` (or "None — can start immediately")

</task-template>

---

## Fetch

Read the task file at the given path:

```
spec/<prd-name>/tasks/<NN>-<slug>.md
```

Parent PRD is always at:

```
spec/<prd-name>/PRD.md
```

Load both files into context as-is. Key sections to pay attention to:

**From the task file:** `## What to build`, `## Acceptance criteria`, `## Blocked by`

**From PRD.md:** `## Problem Statement`, `## Solution`, `## Implementation Decisions`, `## Testing Decisions`

---

## List

Read all `.md` files in `spec/<prd-name>/tasks/` and return them as-is. Also read the `## Tasks` table from `PRD.md` for a quick summary of titles, types, and statuses.

---

## Update Status

Edit the `## Tasks` table in `PRD.md`. Find the row matching the task and update the Status cell:

| Unified status | Marker |
| -------------- | ------ |
| `todo`         | `[ ]`  |
| `in-progress`  | `[-]`  |
| `done`         | `[x]`  |
| `blocked`      | `[!]`  |
