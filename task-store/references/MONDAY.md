# Monday.com Backend

Script: `node ~/.claude/skills/task-store/scripts/monday.js`

Token: `MONDAY_API_TOKEN` env var — set in shell profile or under `"env"` in `~/.claude/settings.local.json`. The script exits with a clear error if not set.

---

## Create

### New board

1. Ask user for **workspace ID** and a **board name**
2. Run `create-board` — creates the board + all columns automatically:

```bash
node ~/.claude/skills/task-store/scripts/monday.js create-board \
  --workspace-id <id> \
  --name "<Board Name>"
```

Returns `{ boardId, columnMap }` with IDs for: `type`, `status`, `description`, `timeline`, `blockedBy`, `userStories`.

Columns created:

| Title | Monday type | Labels |
|---|---|---|
| Type | status | blank / HITL / AFK / PRD |
| Status | status | blank / In Progress / Done / Stuck |
| Description | text | — |
| Timeline | timeline | — |
| Blocked By | dependency | — |
| User Stories | text | — |

> **Manual step required:** After `create-board`, open the **Blocked By** column settings in the Monday UI and select **Timeline** as the connected date column.

### Existing board

1. Ask user for **board ID**
2. Run `match-columns` to check coverage:

```bash
node ~/.claude/skills/task-store/scripts/monday.js match-columns \
  --board-id <id> \
  --fields '["Type","Status","Description","Timeline","Blocked By","User Stories"]'
```

3. For ambiguous fields, ask user which existing column to use
4. For missing fields, ask permission then create:

```bash
node ~/.claude/skills/task-store/scripts/monday.js create-column \
  --board-id <id> \
  --title "Type" \
  --type color \
  --labels '{"0":"","1":"HITL","2":"AFK","3":"PRD"}'
```

5. Build `columnMap` from matches + user overrides

### Create group + items

```bash
node ~/.claude/skills/task-store/scripts/monday.js create-group \
  --board-id <id> \
  --name "<PRD Name>"
```

Build items array — first item **must be the PRD itself**:

```json
[
  { "name": "<PRD Title>", "type": "PRD", "description": "<full PRD content>", "blockedBy": [], "userStories": "" },
  { "name": "<Task Title>", "type": "AFK", "description": "<what to build>", "blockedBy": [], "userStories": "As a user..." },
  { "name": "<Task Title>", "type": "HITL", "description": "<what to build>", "blockedBy": ["<blocker name>"], "userStories": "..." }
]
```

Write to a temp file, then create:

```bash
node ~/.claude/skills/task-store/scripts/monday.js create-items \
  --board-id <id> \
  --group-id <id> \
  --items-file /tmp/monday-items.json \
  --column-map '{"type":"<col_id>","status":"<col_id>","description":"<col_id>","timeline":"<col_id>","blockedBy":"<col_id>","userStories":"<col_id>"}'
```

The script sorts by dependency order automatically. Print a summary table after creation; do NOT re-attempt failures automatically.

---

## Fetch

```bash
node ~/.claude/skills/task-store/scripts/monday.js get-task-context \
  --board-id <board-id> \
  --item-id <item-id>
```

Returns `{ task, prd }` as raw JSON — load as-is. The PRD item is identified as the item in the same group whose `Type` column equals `"PRD"`.

---

## List

```bash
node ~/.claude/skills/task-store/scripts/monday.js list-tasks \
  --board-id <board-id> \
  --group-id <group-id>
```

Returns all items in the group as raw JSON — load as-is.

---

## Update Status

```bash
node ~/.claude/skills/task-store/scripts/monday.js update-column \
  --board-id <board-id> \
  --item-id <item-id> \
  --column-title "Status" \
  --value "<monday-value>"
```

| Unified status | Monday value |
|---|---|
| `todo` | *(clear — set empty string)* |
| `in-progress` | `In Progress` |
| `done` | `Done` |
| `blocked` | `Stuck` |
