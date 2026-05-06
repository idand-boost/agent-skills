---
name: monday-workflow-blocks
description: Guide for building monday.com workflow automation blocks and custom field types — manifest.json entries, backend endpoints, dependency chains, and the nested-field workaround. Use when the user wants to create, add, or modify a monday.com workflow action, trigger, or custom field type in an automation block.
---

# monday.com Workflow Blocks

Two manifest feature types power workflows:
- **`AppFeatureFieldType`** — a reusable custom field (primitive or object/subfields)
- **`AppFeatureBlock`** — an action or trigger block that uses those fields

See [FIELDS_REFERENCE.md](FIELDS_REFERENCE.md) and [BLOCKS_REFERENCE.md](BLOCKS_REFERENCE.md) for full JSON schemas.

## Checklist: New Field Type

- [ ] Add `AppFeatureFieldType` entry in `manifest.json` (see [FIELDS_REFERENCE.md](FIELDS_REFERENCE.md))
- [ ] Choose type: primitive (with `configurationMetadata`) or object (with `subFieldsUrl`)
- [ ] Declare dependencies: `dependencyConfig` (primitive) or `subFieldsDependencyConfig` (object)
- [ ] Add backend endpoint at the `listUrl` / `subFieldsUrl` path
- [ ] If dynamic options need pagination, return `{ options, isPaginated: true, nextPageRequestData }`
- [ ] **Nested object rule**: if the field needs to depend on itself at a different depth, create a separate `AppFeatureFieldType` with a new slug (e.g. `form-list` → `child-form-list` → `grandchild-form-list`)

## Checklist: New Action Block

- [ ] Add `AppFeatureBlock` with `"kind": "action"` in `manifest.json`
- [ ] List all `inboundFieldsConfig.fields[]` in order (each has `id`, `fieldKey`, `type`, `fieldTypeReferenceId`)
- [ ] Wire `constraints.dependencies` or `constraints.subFieldsDependencies` per field
- [ ] List `outboundFieldsConfig.fields[]` (what downstream blocks receive)
- [ ] Add `executionConfig.runConfig.url`
- [ ] For long operations: set `"isAsync": true`, return `{ status: "received" }` immediately, POST to `callbackUrl` when done
- [ ] Add `viewMetadata.previewInboundFieldKeys` (the most meaningful field shown in the sentence builder)
- [ ] Implement backend handler (receives `payload.inboundFieldValues`, returns `{ outputFields }`)

## Checklist: New Trigger Block

- [ ] Add `AppFeatureBlock` with `"kind": "trigger"` in `manifest.json`
- [ ] Add `executionConfig.subscribeConfig.url` and `unsubscribeConfig.url`
- [ ] On subscribe: save `{ webhookUrl, subscriptionId, inputFields }` to storage, return `{ webhookId }`
- [ ] On event: POST `{ trigger: { outputFields: {...} } }` to stored `webhookUrl` with JWT `Authorization` header
- [ ] On unsubscribe: delete from storage using `webhookId`, return 200 with no payload (non-2xx blocks recipe deletion)

## Key Rules

| Rule | Detail |
|------|--------|
| Field keys | Letters, numbers, underscores; must start with a letter |
| `isOptional` | Always set equal to `isNullable` in object sub-field schemas |
| Action retry | monday retries for 30 min on non-200 unless you return 4xx or a severity code |
| Severity 4000 | Automation fails but can recover (user action needed) |
| Severity 6000 | Automation disabled permanently (`disableErrorDescription` required) |
| Nested fields | **Cannot** reference a field type as its own dependency — create a new slug per level |
| Async callback JWT | Sign `{ appId }` with `MONDAY_SIGNING_SECRET`, send raw in `Authorization` header |
| Credentials in payload | Available as `payload.credentialsValues["your-key"].accessToken` |

## Backend Endpoint Shapes

**Action run URL** — POST, return 200:
```ts
// req.body.payload.inboundFieldValues has all field values
// req.body.payload.credentialsValues["key"].accessToken for credentials
// For async: req.body.payload.callbackUrl
res.json({ outputFields: { myOutputKey: value } });
```

**Remote options URL** — POST, return array:
```ts
// req.body.payload.dependencyData has resolved dependency values
res.json([{ title: "Label", value: "raw_value" }]);
// Paginated:
res.json({ options: [...], isPaginated: true, nextPageRequestData: { page: 2 } | null });
```

**Object subfields URL** — POST, return schema object:
```ts
// req.body.payload contains dependency values
res.json({
  fieldKey: { title: "Label", type: "primitive", primitiveType: "string",
               isNullable: false, isOptional: false, isArray: false }
});
```

**Subscribe URL** — POST, return 200:
```ts
const { webhookUrl, subscriptionId, inputFields } = req.body.payload;
await storage.set(subscriptionId, JSON.stringify({ webhookUrl, inputFields }));
res.json({ webhookId: subscriptionId });
```

**Unsubscribe URL** — POST, return 200:
```ts
const { webhookId } = req.body.payload;
await storage.delete(String(webhookId));
res.json({});
```
