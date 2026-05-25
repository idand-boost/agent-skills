---
name: backlog
description: task storage interface for workflow. referenced from other skills.
user-invocable: false
---

# backlog

Unified interface for task persistence. Detects the backend from the argument shape — no config needed.

## Backlog Detection

| Argument shape       | Backlog | Reference                         |
| -------------------- | ------- | --------------------------------- |
| `spec/...` path      | Local   | [LOCAL.md](references/LOCAL.md)   |
| Integer or `#N`      | GitHub  | [GITHUB.md](references/GITHUB.md) |
| `id/id` two segments | Monday  | [MONDAY.md](references/MONDAY.md) |

For operations that target a **project** (list, create), the argument points at the project root:

| Backlog | Project argument    |
| ------- | ------------------- |
| Local   | `spec/prd-name/`    |
| GitHub  | `#prd-issue-number` |
| Monday  | `board-id/group-id` |

## Operations

All four operations are defined in the reference file for the detected backend.

| Operation       | What it does                                       |
| --------------- | -------------------------------------------------- |
| `create`        | Write tasks to the backend                         |
| `fetch`         | Get one task + its parent PRD (raw content)        |
| `list`          | Get all tasks for a project (raw content)          |
| `update-status` | Set task status using the unified vocabulary below |

## Unified Status Vocabulary

| Status        | Meaning                       |
| ------------- | ----------------------------- |
| `todo`        | Not started                   |
| `in-progress` | Being worked on               |
| `done`        | Complete                      |
| `blocked`     | Waiting on something external |

## Adding a New Backlog

1. Create `references/<SYSTEM>.md` implementing all four operations (create / fetch / list / update-status)
2. Add a row to the Backlog Detection table above with the argument shape and a link to the new reference file
