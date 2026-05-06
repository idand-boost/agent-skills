# Column Value Formats for monday.com Mutations

Use these when calling `change_column_value`, `change_multiple_column_values`, or `createItem` with `column_values`.

When in doubt, use `ask_developer_docs(query: "column value format for <type> column")` to confirm.

---

## Common Column Types

### Status
```json
{ "label": "Done" }
// or by index:
{ "index": 1 }
// simple string also works:
"Done"
```
> **Docs:** https://developer.monday.com/api-reference/reference/status

### Date
```json
{ "date": "2024-01-15", "time": "09:00:00" }
// simple string:
"2024-01-15"
```
> **Docs:** https://developer.monday.com/api-reference/reference/date

### Text / Long Text
```json
"My text value"
// or for long text:
{ "text": "My long text value" }
```

### Numbers
```json
"42"
// or:
42
```

### People
```json
{
  "personsAndTeams": [
    { "id": 123456, "kind": "person" },
    { "id": 789, "kind": "team" }
  ]
}
// simple string (person IDs comma-separated):
"123456,654321"
```
> **Docs:** https://developer.monday.com/api-reference/reference/people

### Email
```json
{ "email": "user@example.com", "text": "Display Name" }
// simple string:
"user@example.com Display Name"
```

### Phone
```json
{ "phone": "+12025550169", "countryShortName": "US" }
// simple string:
"+12025550169 US"
```

### Link / URL
```json
{ "url": "https://example.com", "text": "Link Label" }
```

### Checkbox
```json
{ "checked": "true" }
```

### Dropdown
```json
{ "labels": ["Option A", "Option B"] }
// or by IDs:
{ "ids": [1, 2] }
```
> **Docs:** https://developer.monday.com/api-reference/reference/dropdown

### Rating
```json
{ "rating": 4 }
```

### Location
```json
{
  "lat": "40.7128",
  "lng": "-74.0060",
  "address": "New York, NY"
}
// simple string: "lat lng address"
"40.7128 -74.0060 New York"
```

### Timeline
```json
{ "from": "2024-01-01", "to": "2024-01-31" }
```
> **Docs:** https://developer.monday.com/api-reference/reference/timeline

### Hour
```json
{ "hour": 14, "minute": 30 }
```

### Week
```json
{ "startDate": "2024-01-01", "endDate": "2024-01-07" }
```

### Connect Boards (Board Relation)
```json
{ "item_ids": [123456789, 987654321] }
```
> **Docs:** https://developer.monday.com/api-reference/reference/connect

### Tags
```json
{ "tag_ids": [12345, 67890] }
```

### Country
```json
{ "countryCode": "US", "countryName": "United States" }
```

---

## Updating Multiple Columns at Once

Pass a JSON object where keys are column IDs:

```ts
await monday.request(`
  mutation ($itemId: ID!, $boardId: ID!, $values: JSON!) {
    change_multiple_column_values(item_id: $itemId, board_id: $boardId, column_values: $values) {
      id
    }
  }
`, {
  itemId: 12345,
  boardId: 67890,
  values: JSON.stringify({
    status: { label: "Done" },
    date4: { date: "2024-06-01" },
    person: { personsAndTeams: [{ id: 9603417, kind: "person" }] },
    text0: "Some text"
  })
});
```

---

## Clearing a Column Value

Pass `null` or `""` for most column types to clear the value:
```ts
values: JSON.stringify({ status: "" })
```

---

## Tips

- Always stringify the entire `column_values` object when passing to mutations: `JSON.stringify({...})`
- `change_simple_column_value` uses plain string values
- `change_column_value` uses a JSON string for the single column value
- `change_multiple_column_values` uses a JSON object stringified, with column IDs as keys
- Use `ask_developer_docs` to verify formats for uncommon column types