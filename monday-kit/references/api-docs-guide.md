# Using ask_developer_docs — MCP Tool Guide

The monday.com MCP exposes an `ask_developer_docs` query that answers questions about the monday.com API using official documentation. Always use this before guessing at query shapes, argument names, or column value formats.

## How to Use It

In code, this is available via the monday.com MCP tool:

```
monday.com:all_monday_api
query: { ask_developer_docs(query: "your question") { answer } }
```

Or use the dedicated MCP tool if available in context.

---

## When to Use ask_developer_docs

| Situation | Example question |
|---|---|
| Column value format | `"What is the JSON format for updating a dropdown column value?"` |
| Mutation arguments | `"What arguments does create_board accept?"` |
| Required OAuth scopes | `"What scope is required to create an update/comment?"` |
| Pagination | `"How does cursor-based pagination work for board items?"` |
| Subitems | `"How do I query subitems and their column values?"` |
| Webhooks | `"How do I register a webhook for item creation?"` |
| Filtering | `"How do I filter items by column value using items_page?"` |
| API versioning | `"What changed in the 2024-10 API version?"` |

---

## Useful Official Docs Links

These are authoritative references to bookmark alongside `ask_developer_docs`:

| Topic | URL |
|---|---|
| Getting started / auth | https://developer.monday.com/api-reference/docs/getting-started |
| Boards | https://developer.monday.com/api-reference/reference/boards |
| Items | https://developer.monday.com/api-reference/reference/items |
| Column values | https://developer.monday.com/api-reference/reference/column-values-v2 |
| Changing column values | https://developer.monday.com/api-reference/docs/change-column-values |
| Columns | https://developer.monday.com/api-reference/reference/columns |
| Status column | https://developer.monday.com/api-reference/reference/status |
| People column | https://developer.monday.com/api-reference/reference/people |
| Date column | https://developer.monday.com/api-reference/reference/date |
| Timeline column | https://developer.monday.com/api-reference/reference/timeline |
| Dropdown column | https://developer.monday.com/api-reference/reference/dropdown |
| Connect Boards | https://developer.monday.com/api-reference/reference/connect |
| Mirror column | https://developer.monday.com/api-reference/reference/mirror |
| Updates (comments) | https://developer.monday.com/api-reference/reference/updates |
| Webhooks | https://developer.monday.com/api-reference/reference/webhooks |
| Users | https://developer.monday.com/api-reference/reference/users |
| Workspaces | https://developer.monday.com/api-reference/reference/workspaces |
| Pagination | https://developer.monday.com/api-reference/docs/pagination |
| Rate limits | https://developer.monday.com/api-reference/docs/rate-limits |
| GraphQL intro | https://developer.monday.com/api-reference/docs/introduction-to-graphql |

---

## MCP Schema Tools

When writing custom GraphQL queries, also use:

- `get_graphql_schema(operationType: "read" | "write")` — lists all available query/mutation fields
- `get_type_details(typeName: "Board")` — shows fields and types for any GraphQL type

These complement `ask_developer_docs` for precise schema-level introspection.