---
name: break-to-tasks
description: Break a PRD or plan into independently-grabbable tasks using tracer-bullet vertical slices. Use when user wants to convert a PRD to tasks, break down a plan into work items, or create implementation tasks from a spec.
---

# PRD to Tasks

Break a PRD into independently-grabbable tasks using vertical slices (tracer bullets).

## Process

### 1. Locate the PRD

Ask the user for the PRD — it can be:

- A GitHub issue number/URL (`gh issue view <number>`)
- A local file path
- Pasted directly into the conversation

### 2. Ask for output target

Ask the user where they want the tasks created:

you can load the `task-store` skill to create tasks in the detected backend, or ask the user to specify a different target if they want the output in a different backend.

### 3. Explore the codebase (optional)

If not already explored, do so to understand current state.

### 4. Draft vertical slices

Break the PRD into **tracer bullet** tasks. Each task is a thin vertical slice through ALL integration layers, not a horizontal layer-only slice.

Slices may be `HITL` (human-in-the-loop) or `AFK` (fully autonomous). Prefer AFK for tasks that can be tested e2e without human eyes, prefer `HITL` for missions that require human validation or UI/UX.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 5. Quiz the user

Present breakdown as a numbered list. For each slice show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which slices must complete first
- **User stories covered**: which PRD stories this addresses

Ask: granularity right? dependencies correct? any merges or splits needed?

Iterate until approved.

### 6. Create tasks in the chosen target

Load the `task-store` skill, then call the **create** operation. The `task-store` skill owns all backend-specific logic — follow its reference for the detected backend.
