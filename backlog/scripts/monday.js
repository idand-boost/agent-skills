#!/usr/bin/env node
'use strict';

const https = require('https');
const fs = require('fs');

const CONCURRENCY = 5;
const BATCH_DELAY_MS = 200;

const NEW_BOARD_COLUMNS = [
  {
    key: 'type',
    title: 'Type',
    type: 'status',
    labels: { 1: 'HITL', 2: 'AFK', 3: 'PRD' },
  },
  {
    key: 'status',
    title: 'Status',
    type: 'status',
    labels: { 1: 'In Progress', 2: 'Done', 3: 'Stuck' },
  },
  { key: 'description', title: 'Description', type: 'text' },
  { key: 'timeline', title: 'Timeline', type: 'timeline' },
  {
    key: 'blockedBy',
    title: 'Blocked By',
    type: 'dependency',
    defaults: { settings: { dependency_mode: 'flexible' } },
  },
  { key: 'userStories', title: 'User Stories', type: 'text' },
];

const STATUS_FIELDS = new Set(['type', 'status']);

// --- Pure functions (exported for tests) ---

function sortByDependency(tasks) {
  const byName = new Map(tasks.map((t) => [t.name, t]));
  const visited = new Set();
  const result = [];

  function visit(task) {
    if (visited.has(task.name)) return;
    visited.add(task.name);
    for (const dep of task.blockedBy || []) {
      const depTask = byName.get(dep);
      if (depTask) visit(depTask);
    }
    result.push(task);
  }

  for (const task of tasks) visit(task);
  return result;
}

function matchColumnsByName(boardColumns, fieldNames) {
  const normalize = (s) => s.toLowerCase().trim();
  const matches = {};
  const ambiguous = [];

  for (const field of fieldNames) {
    const found = boardColumns.find(
      (c) => normalize(c.title) === normalize(field),
    );
    if (found) matches[field] = found;
    else ambiguous.push(field);
  }

  return { matches, ambiguous };
}

function buildColumnValues(item, columnMap, nameToId = {}) {
  const values = {};

  for (const [field, colId] of Object.entries(columnMap)) {
    if (!colId) continue;

    if (field === 'blockedBy') {
      const names = Array.isArray(item.blockedBy)
        ? item.blockedBy
        : item.blockedBy
          ? [item.blockedBy]
          : [];
      const ids = names.map((n) => nameToId[n]).filter(Boolean);
      if (ids.length > 0) values[colId] = { item_ids: ids.map(String) };
      continue;
    }

    const raw = item[field];
    if (!raw) continue;

    values[colId] = STATUS_FIELDS.has(field) ? { label: raw } : raw;
  }

  return values;
}

// --- API layer ---

let TOKEN;

function query(graphql, variables = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: graphql, variables });
    const options = {
      hostname: 'api.monday.com',
      path: '/v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: TOKEN,
        'API-Version': '2023-10',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.errors)
            reject(new Error(parsed.errors.map((e) => e.message).join(', ')));
          else resolve(parsed.data);
        } catch {
          reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getBoardColumns(boardId) {
  const data = await query(
    `query ($ids: [ID!]) { boards(ids: $ids) { columns { id title type } } }`,
    { ids: [String(boardId)] },
  );
  return data.boards[0].columns;
}

const COLUMN_VALUES_FRAGMENT = `id text ... on DependencyValue { linked_items { id name } }`;

function mapColumnsFromIds(cvs, colMap) {
  const out = {};
  for (const cv of cvs) {
    if (!colMap[cv.id]) continue;
    if (cv.linked_items && cv.linked_items.length > 0)
      out[colMap[cv.id]] = cv.linked_items;
    else if (cv.text) out[colMap[cv.id]] = cv.text;
  }
  return out;
}

async function getTaskContext(boardId, itemId) {
  const [boardCols, itemData] = await Promise.all([
    getBoardColumns(boardId),
    query(
      `query ($ids: [ID!]) {
         items(ids: $ids) { id name group { id } column_values { ${COLUMN_VALUES_FRAGMENT} } }
       }`,
      { ids: [String(itemId)] },
    ),
  ]);

  const colMap = Object.fromEntries(boardCols.map((c) => [c.id, c.title]));
  const raw = itemData.items[0];
  const task = {
    id: raw.id,
    name: raw.name,
    columns: mapColumnsFromIds(raw.column_values, colMap),
  };

  const groupData = await query(
    `query ($boardId: [ID!], $groupIds: [String]) {
       boards(ids: $boardId) {
         groups(ids: $groupIds) { items_page { items { id name column_values { ${COLUMN_VALUES_FRAGMENT} } } } }
       }
     }`,
    { boardId: [String(boardId)], groupIds: [raw.group.id] },
  );

  const groupItems = groupData.boards[0].groups[0].items_page.items;
  const prdRaw = groupItems.find(
    (i) => mapColumnsFromIds(i.column_values, colMap)['Type'] === 'PRD',
  );
  const prd = prdRaw
    ? {
        id: prdRaw.id,
        name: prdRaw.name,
        columns: mapColumnsFromIds(prdRaw.column_values, colMap),
      }
    : null;

  return { task, prd };
}

async function listTasks(boardId, groupId) {
  const [boardCols, groupData] = await Promise.all([
    getBoardColumns(boardId),
    query(
      `query ($boardId: [ID!], $groupIds: [String]) {
         boards(ids: $boardId) {
           groups(ids: $groupIds) { items_page { items { id name column_values { ${COLUMN_VALUES_FRAGMENT} } } } }
         }
       }`,
      { boardId: [String(boardId)], groupIds: [groupId] },
    ),
  ]);

  const colMap = Object.fromEntries(boardCols.map((c) => [c.id, c.title]));
  return groupData.boards[0].groups[0].items_page.items.map((i) => ({
    id: i.id,
    name: i.name,
    columns: mapColumnsFromIds(i.column_values, colMap),
  }));
}

async function createBoard(workspaceId, name) {
  const data = await query(
    `mutation ($wsId: ID!, $name: String!) {
       create_board(workspace_id: $wsId, board_name: $name, board_kind: public) { id }
     }`,
    { wsId: String(workspaceId), name },
  );
  return data.create_board.id;
}

async function createColumn(boardId, title, type, labels, rawDefaults) {
  const defaults = rawDefaults
    ? JSON.stringify(rawDefaults)
    : labels
      ? JSON.stringify({ labels })
      : undefined;
  const data = await query(
    `mutation ($boardId: ID!, $title: String!, $type: ColumnType!, $defaults: JSON) {
       create_column(board_id: $boardId, title: $title, column_type: $type, defaults: $defaults) { id }
     }`,
    { boardId: String(boardId), title, type, defaults },
  );
  return data.create_column.id;
}

async function createGroup(boardId, name) {
  const data = await query(
    `mutation ($boardId: ID!, $name: String!) {
       create_group(board_id: $boardId, group_name: $name) { id }
     }`,
    { boardId: String(boardId), name },
  );
  return data.create_group.id;
}

async function createItem(boardId, groupId, name, columnValues) {
  const data = await query(
    `mutation ($boardId: ID!, $groupId: String!, $name: String!, $cols: JSON!) {
       create_item(board_id: $boardId, group_id: $groupId, item_name: $name, column_values: $cols) { id name }
     }`,
    {
      boardId: String(boardId),
      groupId,
      name,
      cols: JSON.stringify(columnValues),
    },
  );
  return data.create_item;
}

async function updateColumnValue(boardId, itemId, columnId, value, isStatus) {
  const serialized = isStatus
    ? JSON.stringify({ label: value })
    : JSON.stringify(value);
  const data = await query(
    `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
       change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) { id }
     }`,
    {
      boardId: String(boardId),
      itemId: String(itemId),
      columnId,
      value: serialized,
    },
  );
  return data.change_column_value.id;
}

async function createItemsBatch(boardId, groupId, items, columnMap) {
  const sorted = sortByDependency(items);
  const failures = [];
  const successes = [];
  const nameToId = {};

  for (const item of sorted) {
    try {
      const result = await createItem(
        boardId,
        groupId,
        item.name,
        buildColumnValues(item, columnMap, nameToId),
      );
      successes.push(result);
      nameToId[item.name] = result.id;
    } catch (err) {
      failures.push({ item: item.name, error: err.message });
    }
  }

  return { successes, failures };
}

// --- CLI ---

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i].startsWith('--'))
      throw new Error(`Expected flag, got: ${args[i]}`);
    flags[args[i].slice(2)] = args[i + 1];
  }
  return flags;
}

function requireFlag(flags, name) {
  if (!flags[name]) {
    console.error(`Error: --${name} is required`);
    process.exit(1);
  }
  return flags[name];
}

function readJson(flags, inlineKey, fileKey) {
  if (flags[inlineKey]) return JSON.parse(flags[inlineKey]);
  if (flags[fileKey])
    return JSON.parse(fs.readFileSync(flags[fileKey], 'utf8'));
  console.error(`Error: provide --${inlineKey} or --${fileKey}`);
  process.exit(1);
}

async function main() {
  TOKEN = process.env.MONDAY_API_TOKEN;
  if (!TOKEN) {
    console.error(
      'Error: MONDAY_API_TOKEN not set.\n' +
        'Option 1: export MONDAY_API_TOKEN=<token> in your shell profile\n' +
        'Option 2: add it under the "env" key in ~/.claude/settings.local.json',
    );
    process.exit(1);
  }

  const [command, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);

  try {
    switch (command) {
      case 'get-columns': {
        const cols = await getBoardColumns(requireFlag(flags, 'board-id'));
        console.log(JSON.stringify(cols, null, 2));
        break;
      }

      case 'create-board': {
        const boardId = await createBoard(
          requireFlag(flags, 'workspace-id'),
          requireFlag(flags, 'name'),
        );
        const colIds = await Promise.all(
          NEW_BOARD_COLUMNS.map((col) =>
            createColumn(
              boardId,
              col.title,
              col.type,
              col.labels,
              col.defaults,
            ),
          ),
        );
        const columnMap = {};
        NEW_BOARD_COLUMNS.forEach((col, i) => {
          columnMap[col.key] = colIds[i];
        });
        console.log(JSON.stringify({ boardId, columnMap }, null, 2));
        break;
      }

      case 'create-column': {
        const labels = flags['labels']
          ? JSON.parse(flags['labels'])
          : undefined;
        const id = await createColumn(
          requireFlag(flags, 'board-id'),
          requireFlag(flags, 'title'),
          requireFlag(flags, 'type'),
          labels,
        );
        console.log(JSON.stringify({ id }, null, 2));
        break;
      }

      case 'create-group': {
        const id = await createGroup(
          requireFlag(flags, 'board-id'),
          requireFlag(flags, 'name'),
        );
        console.log(JSON.stringify({ id }, null, 2));
        break;
      }

      case 'match-columns': {
        const boardCols = await getBoardColumns(requireFlag(flags, 'board-id'));
        const fields = JSON.parse(requireFlag(flags, 'fields'));
        console.log(
          JSON.stringify(matchColumnsByName(boardCols, fields), null, 2),
        );
        break;
      }

      case 'create-items': {
        const boardId = requireFlag(flags, 'board-id');
        const groupId = requireFlag(flags, 'group-id');
        const items = readJson(flags, 'items', 'items-file');
        const columnMap = JSON.parse(requireFlag(flags, 'column-map'));
        const result = await createItemsBatch(
          boardId,
          groupId,
          items,
          columnMap,
        );
        if (flags['items-file']) fs.unlinkSync(flags['items-file']);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'get-task-context': {
        const result = await getTaskContext(
          requireFlag(flags, 'board-id'),
          requireFlag(flags, 'item-id'),
        );
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'list-tasks': {
        const tasks = await listTasks(
          requireFlag(flags, 'board-id'),
          requireFlag(flags, 'group-id'),
        );
        console.log(JSON.stringify(tasks, null, 2));
        break;
      }

      case 'update-column': {
        const boardId = requireFlag(flags, 'board-id');
        const itemId = requireFlag(flags, 'item-id');
        const columnTitle = requireFlag(flags, 'column-title');
        const value = requireFlag(flags, 'value');
        const cols = await getBoardColumns(boardId);
        const col = cols.find(
          (c) => c.title.toLowerCase() === columnTitle.toLowerCase(),
        );
        if (!col) {
          console.error(
            `Error: column "${columnTitle}" not found. Available: ${cols.map((c) => c.title).join(', ')}`,
          );
          process.exit(1);
        }
        const isStatus = col.type === 'status' || col.type === 'color';
        const id = await updateColumnValue(
          boardId,
          itemId,
          col.id,
          value,
          isStatus,
        );
        console.log(JSON.stringify({ id }, null, 2));
        break;
      }

      default:
        console.error(`Unknown command: ${command || '(none)'}`);
        console.error(
          'Commands: get-columns | create-board | create-column | create-group | match-columns | create-items | get-task-context | list-tasks | update-column',
        );
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} else {
  module.exports = {
    sortByDependency,
    matchColumnsByName,
    buildColumnValues,
    query,
  };
}
