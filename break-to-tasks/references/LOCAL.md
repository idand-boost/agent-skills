# Local Output — spec folder

## Folder structure

Create `spec/<prd-name>/` in the project root (use kebab-case for `<prd-name>`).

```
spec/
└── <prd-name>/
    ├── PRD.md          # Full PRD document
    └── tasks/
        ├── 01-<slice>.md
        ├── 02-<slice>.md
        └── ...
```

## PRD.md template

Follows the same structure as `/write-a-prd`. Write the full PRD here — not a summary.

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

| #  | Title   | Type       | Blocked by | Status |
|----|---------|------------|------------|--------|
| 01 | \<title\> | AFK / HITL | —          | [ ]    |
| 02 | \<title\> | AFK / HITL | 01         | [ ]    |

## Source

\<Link or filename of original PRD if it came from elsewhere\>

</prd-template>

## Task file template (`tasks/NN-<slug>.md`)

<issue-template>

## Parent

Reference to `PRD.md` in the same spec folder (or a parent issue on the tracker if the PRD originated from one).

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

Avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it here and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- `01-<slug>.md` (or "None — can start immediately")

</issue-template>

## Creation steps

1. Check if `spec/` exists; create it if not
2. Create `spec/<prd-name>/tasks/` directory
3. Write `PRD.md` using the full prd-template above (populate from existing PRD content or conversation context)
4. Write one `.md` file per task, zero-padded numbering (`01`, `02`, …), using the issue-template above
5. Create tasks in dependency order (blockers first) so slugs are known when referenced

Do NOT create any other files. Do NOT modify existing spec folders unless the user asks.
