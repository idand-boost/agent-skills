# Monday.com Output

Uses `scripts/monday.js` invoked via `node`. No external dependencies.

## Token setup

The script reads `MONDAY_API_TOKEN` from the environment. Two options:

**Option 1 — shell profile:**
```bash
export MONDAY_API_TOKEN=your_token_here
```

**Option 2 — `~/.claude/settings.local.json`:**
```json
{
  "env": {
    "MONDAY_API_TOKEN": "your_token_here"
  }
}
```

If neither is set the script exits with a clear error explaining both options.

---

## Flow

### New board

1. Ask user for **workspace ID** and a **board name**
2. Run `create-board` — creates the board + all 5 columns automatically:

```bash
node ~/.claude/skills/break-to-tasks/scripts/monday.js create-board \
  --workspace-id <id> \
  --name "<Board Name>"
```

Returns:
```json
{
  "boardId": "12345",
  "columnMap": {
    "type":         "<col_id>",
    "status":       "<col_id>",
    "description":  "<col_id>",
    "timeline":     "<col_id>",
    "blockedBy":    "<col_id>",
    "userStories":  "<col_id>"
  }
}
```

Columns created:

| Title | Monday type | Labels |
|---|---|---|
| Type | status (color) | blank / HITL / AFK / PRD |
| Status | status (color) | blank / In Progress / Done |
| Description | text | — |
| Timeline | timeline | — |
| Blocked By | dependency | — |
| User Stories | text | — |

> **Manual step required after `create-board`:** The API cannot link the dependency column to the timeline column. After the board is created, open the **Blocked By** column settings in the Monday UI and select **Timeline** as the connected date column. This enables auto-shifting of dates when dependencies change.

### Existing board

1. Ask user for **board ID**
2. Run `match-columns` to check column coverage:

```bash
node ~/.claude/skills/break-to-tasks/scripts/monday.js match-columns \
  --board-id <id> \
  --fields '["Type","Status","Description","Timeline","Blocked By","User Stories"]'
```

Returns `{ matches, ambiguous }`.

3. For **ambiguous** fields (board has no column with that exact name), show the board's actual columns and ask the user which one to use.
4. For **missing** fields (not matched, user didn't map), ask: "May I create these columns on the board?" — only create if approved.

```bash
node ~/.claude/skills/break-to-tasks/scripts/monday.js create-column \
  --board-id <id> \
  --title "Type" \
  --type color \
  --labels '{"0":"","1":"HITL","2":"AFK","3":"PRD"}'
```

5. Build `columnMap` from matches + user overrides:
```json
{
  "type":         "<matched_or_created_col_id>",
  "status":       "<matched_or_created_col_id>",
  "description":  "<matched_or_created_col_id>",
  "timeline":     "<matched_or_created_col_id>",
  "blockedBy":    "<matched_or_created_col_id>",
  "userStories":  "<matched_or_created_col_id>"
}
```

> Existing Status column is always reused as-is regardless of its label values.

---

## Creating the group + items

### 1. Create group (named after the PRD)

```bash
node ~/.claude/skills/break-to-tasks/scripts/monday.js create-group \
  --board-id <id> \
  --name "<PRD Name>"
```

### 2. Build items array

First item **must be the PRD itself**:

```json
[
  {
    "name": "<PRD Title>",
    "type": "PRD",
    "description": "<full PRD content>",
    "blockedBy": [],
    "userStories": ""
  },
  {
    "name": "<Task Title>",
    "type": "AFK",
    "description": "<what to build>",
    "blockedBy": [],
    "userStories": "As a user..."
  },
  {
    "name": "<Task Title>",
    "type": "HITL",
    "description": "<what to build>",
    "blockedBy": ["<blocker task name>"],
    "userStories": "As a user..."
  }
]
```

Write to a temp file, then:

### 3. Create items

```bash
node ~/.claude/skills/break-to-tasks/scripts/monday.js create-items \
  --board-id <id> \
  --group-id <id> \
  --items-file /tmp/monday-items.json \
  --column-map '{"type":"<col_id>","status":"<col_id>","description":"<col_id>","timeline":"<col_id>","blockedBy":"<col_id>","userStories":"<col_id>"}'
```

The script:
- Sorts items by dependency order (blockers first) automatically
- Runs up to 5 concurrent API calls with 200ms delay between batches
- Continues on individual failures, reports all at the end

Returns:
```json
{
  "successes": [{ "id": "...", "name": "..." }],
  "failures":  [{ "item": "Task Name", "error": "..." }]
}
```

---

## After creation

Print a summary table:

| # | Item | Type | Blocked by |
|---|------|------|------------|
| PRD | \<title\> | PRD | — |
| 1 | \<title\> | AFK | — |
| 2 | \<title\> | HITL | \<title\> |

Report any failures with their error messages. Do NOT re-attempt failed items automatically — tell the user and let them decide.
