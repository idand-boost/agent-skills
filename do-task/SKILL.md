---
name: do-task
description: Fetch a task and its parent PRD, then plan and implement it. Use when user says "do task", "implement task", "work on task", or references a task.
argument-hint: '<spec-path> | <github-issue-number> | <board-id>/<item-id>'
disable-model-invocation: true
---

# Do Task

## Process

### 1. Fetch task + PRD

Identify the source from the argument, then read both the task and its parent PRD:

| Source            | Argument form                    | Reference                         |
| ----------------- | -------------------------------- | --------------------------------- |
| Local spec folder | `spec/prd-name/tasks/01-slug.md` | [LOCAL.md](references/LOCAL.md)   |
| GitHub issue      | `42` or `#42`                    | [GITHUB.md](references/GITHUB.md) |
| Monday.com        | `<board-id>/<item-id>`           | [MONDAY.md](references/MONDAY.md) |

Read both before planning. The PRD provides context for every implementation decision.

### 2. Load relevant skills

Load domain skills **before** planning, based on what the task touches:

| Task involves         | Load                                    |
| --------------------- | --------------------------------------- |
| Any code related task | `code-philosophy`                       |
| React, frontend, UI   | `code-philosophy` + `bulletproof-react` |
| monday.com API        | `monday-kit`                            |

Check the task description — if it implies a domain not listed, find and load the relevant skill.

### 3. Plan + implement

Run `/implement` to create and execute the plan. Apply `/tdd` wherever the task has testable logic.

### 4. Verify

- Server route or migration → run the server, exercise the route yourself, then shut it down
- UI change → open the page, test the golden path and one edge case
- Confirm every acceptance criterion from the task is met before reporting done
