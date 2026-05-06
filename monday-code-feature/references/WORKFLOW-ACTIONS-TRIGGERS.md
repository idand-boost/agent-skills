# Workflow Actions & Triggers

Both are `AppFeatureBlock` features. The difference is in `data.kind` and `data.executionConfig`.

## Action Block

An action is executed when a user runs the automation recipe. It receives input fields and produces output fields.

```json
{
  "key": "my-action-block",
  "type": "AppFeatureBlock",
  "name": "My Action",
  "build": { "kind": "monday-code" },
  "data": {
    "name": "My Action",
    "referenceId": { "slug": "my-action-block" },
    "appId": 12345678,
    "inboundFieldsConfig": {
      "fields": [ ... ]
    },
    "outboundFieldsConfig": {
      "fields": [ ... ]
    },
    "kind": "action",
    "executionConfig": {
      "runConfig": {
        "url": "/workflow/my-feature/action/my-action"
      }
    },
    "isAsync": true,
    "viewMetadata": {
      "previewInboundFieldKeys": ["form"]
    },
    "mfValidated": true
  }
}
```

### `isAsync`

- `true` — the action handler returns immediately and signals completion via a callback. Use for long-running operations.
- `false` / omitted — synchronous response expected.

### `viewMetadata.previewInboundFieldKeys`

Lists field keys whose selected value is shown as a preview label in the automation recipe UI. Use for the most meaningful field (e.g., the form or entity name the action operates on).

---

## Trigger Block

A trigger fires when an external event occurs. It subscribes/unsubscribes via backend endpoints and emits output fields consumed by subsequent action blocks.

```json
{
  "key": "my-trigger-block",
  "type": "AppFeatureBlock",
  "name": "My Trigger",
  "build": { "kind": "monday-code" },
  "data": {
    "name": "My Trigger",
    "referenceId": { "slug": "my-trigger-block" },
    "appId": 12345678,
    "inboundFieldsConfig": {
      "fields": [ ... ]
    },
    "outboundFieldsConfig": {
      "fields": [ ... ]
    },
    "kind": "trigger",
    "executionConfig": {
      "subscribeConfig": {
        "url": "/workflow/my-feature/trigger/subscribe/my-event"
      },
      "unsubscribeConfig": {
        "url": "/workflow/my-feature/trigger/unsubscribe/my-event"
      }
    },
    "viewMetadata": {
      "previewInboundFieldKeys": ["webhookField"]
    },
    "mfValidated": true,
    "contextsData": {}
  }
}
```

---

## Inbound Fields

`inboundFieldsConfig.fields` defines the user-facing inputs in the automation recipe. Each field has:

```json
{
  "id": 0,                          // sequential integer
  "fieldTitle": "Display label",
  "isArray": false,
  "isNullable": false,
  "type": "custom",                 // "custom" or "primitive"
  "fieldTypeReferenceId": { "slug": "my-field-slug" },
  "allowPrimitiveForm": false,
  "fieldKey": "myField",
  "fieldHeader": "Section header",  // optional, groups fields visually
  "placeholder": "Hint text",       // optional
  "description": { "text": "...", "link": { "url": "...", "text": "..." } }, // optional, shown below the field header
  "information": { "text": "...", "link": { "url": "...", "text": "..." } }, // optional, shown as tooltip/info icon
  "constraints": { ... }            // optional, links this field to others
}
```

### Field Type References

**Your own field types** — reference by slug:

```json
"fieldTypeReferenceId": { "slug": "my-app-field-slug" }
```

**Monday platform built-in field types** — reference by numeric ID (visible in your app's manifest after you wire them in the Developer Center):

```json
"fieldTypeReferenceId": 10380086
```

### Field Type: `"primitive"`

For simple values not backed by a custom field type:

```json
{
  "id": 0,
  "fieldTitle": "Result",
  "isArray": true,
  "isNullable": false,
  "type": "primitive",
  "primitiveType": "string",
  "fieldKey": "results"
}
```

`primitiveType` values: `"string"`, `"number"`, `"boolean"`, `"date"` (format: `YYYY-MM-DD`)

---

## Outbound Fields

`outboundFieldsConfig.fields` defines the outputs this block emits. Downstream blocks and actions can use these values.

```json
{
  "id": 0,
  "fieldTitle": "Priority Entity",
  "isArray": false,
  "isNullable": false,
  "type": "custom",
  "fieldTypeReferenceId": { "slug": "my-entity-field" },
  "constraints": {
    "subFieldsDependencies": {
      "credentials": { "inboundFieldKey": "credentials" },
      "form": { "inboundFieldKey": "form" }
    }
  },
  "fieldKey": "entity"
}
```

---

## Field Constraints

Constraints express dependencies between fields so the platform knows what to pass when fetching dynamic options or subfields.

### `dependencies` — for dropdown/list fields

When this field's options depend on the value of another field in the same block:

```json
"constraints": {
  "dependencies": {
    "credentials": { "inboundFieldKey": "credentials" },
    "form": { "inboundFieldKey": "form" }
  }
}
```

- The key (e.g., `"credentials"`) must match the `targetFieldKey` declared in the field type's `dependencyConfig.orderedMandatoryFields`.
- The `inboundFieldKey` is the `fieldKey` of the dependency field within the same block.

### `subFieldsDependencies` — for complex object fields (subfields)

When this field renders subfields fetched from the server and those subfields need context:

```json
"constraints": {
  "subFieldsDependencies": {
    "credentials": { "inboundFieldKey": "credentials" },
    "form": { "inboundFieldKey": "form" }
  }
}
```

- Keys must match the `targetFieldKey` declared in the field type's `subFieldsDependencyConfig`.

---

## Backend Execution Payload

When an action fires, monday sends a POST to `executionConfig.runConfig.url` with:

> **URL format:** Relative paths (e.g. `/workflow/...`) only valid when `build.kind` is `"monday-code"` — the platform resolves them against the monday-code hosting URL. For any other build kind use a full URL.

```json
{
  "payload": {
    "blockKind": "action",
    "inboundFieldValues": {
      "myField": "selected-value",
      "anotherField": { "sub": "values" }
    },
    "inputFields": { ... },
    "recipeId": 629280,
    "integrationId": 398528596
  },
  "runtimeMetadata": {
    "actionUuid": "abc123",
    "triggerUuid": "def456"
  }
}
```

The backend should respond with the outbound field values.

For triggers, `subscribeConfig.url` receives a subscribe request (stores the webhook/callback), and `unsubscribeConfig.url` receives cleanup requests.

---

## Credentials Config

Blocks that use an `AppFeatureCredentials` feature declare `credentialsConfig` instead of using an inbound credential field. This renders a dedicated credentials picker section in the recipe UI.

```json
"data": {
  ...
  "description": "Optional block-level description shown in recipe UI",
  "credentialsConfig": {
    "credentials": [
      {
        "id": 1,
        "credentialsHeader": "Connect your account",
        "credentialsTitle": "My Service account",
        "credentialsReferenceId": { "slug": "my-service-credentials" },
        "credentialsKey": "myServiceToken",
        "credentialsPlaceholder": "company.myservice.com"
      }
    ]
  }
}
```

- `id` starts at **1** (not 0)
- `credentialsReferenceId.slug` must match the `AppFeatureCredentials` feature `key`
- `credentialsKey` is how credentials arrive in the execution payload under `payload.credentialsValues`
- `description` on `data` is optional block-level text shown in the recipe (separate from field descriptions)

See [CREDENTIALS.md](CREDENTIALS.md) for the full `AppFeatureCredentials` feature definition.
