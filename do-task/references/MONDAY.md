# Reading from Monday.com

## Fetch

```bash
node ~/.claude/skills/break-to-tasks/scripts/monday.js get-task-context \
  --board-id <board-id> \
  --item-id <item-id>
```

Returns the task item and the PRD item from the same group:

```json
{
  "task": {
    "id": "12345",
    "name": "Project bootstrap + Auth",
    "columns": {
      "Type": "AFK",
      "Description": "Set up Gin server skeleton...",
      "Blocked By": [{ "id": "11111", "name": "Design review" }],
      "User Stories": "1, 2, 3"
    }
  },
  "prd": {
    "id": "99999",
    "name": "Schedule Builder REST API",
    "columns": {
      "Type": "PRD",
      "Description": "## Problem Statement\n..."
    }
  }
}
```

The PRD item is identified as the item in the same group whose `Type` column equals `"PRD"`.
If no PRD item exists in the group, `prd` will be `null`.

## What to extract

**From `task.columns`:**
- `Description` — what to build and acceptance criteria
- `Blocked By` — array of `{ id, name }` objects for prerequisite tasks (fetch their context too if relevant); empty array or absent if no blockers
- `User Stories` — which PRD stories this task addresses

**From `prd.columns`:**
- `Description` — full PRD: problem statement, solution, user stories, implementation decisions, testing decisions

---

## Updating task status

Use `update-column` to keep the board in sync as you work.

### When you start a task

```bash
node ~/.claude/skills/break-to-tasks/scripts/monday.js update-column \
  --board-id <board-id> \
  --item-id <item-id> \
  --column-title "Status" \
  --value "In Progress"
```

### When you finish a task

```bash
node ~/.claude/skills/break-to-tasks/scripts/monday.js update-column \
  --board-id <board-id> \
  --item-id <item-id> \
  --column-title "Status" \
  --value "Done"
```

### When you're blocked

```bash
node ~/.claude/skills/break-to-tasks/scripts/monday.js update-column \
  --board-id <board-id> \
  --item-id <item-id> \
  --column-title "Status" \
  --value "Stuck"
```

Valid Status values: `In Progress` · `Done` · `Stuck`

The command resolves the column ID from its title automatically — no need to look up IDs manually. Returns `{ "id": "<item-id>" }` on success.
