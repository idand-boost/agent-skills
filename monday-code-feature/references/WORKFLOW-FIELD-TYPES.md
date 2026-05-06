# Workflow Field Types (AppFeatureFieldType)

Custom field types define reusable input components for workflow automation blocks. Each field type is defined once and can be referenced in multiple action/trigger blocks.

## Minimal Structure

```json
{
  "key": "my-field-slug",
  "type": "AppFeatureFieldType",
  "name": "My Field",
  "build": { "kind": "monday-code" },
  "data": {
    "name": "My Field",
    "referenceId": { "slug": "my-field-slug" },
    "appId": 12345678,
    "description": "What this field collects",
    "defaultFieldKey": "myField",
    "mfValidated": true
  }
}
```

> `key` and `referenceId.slug` must match exactly. This slug is how blocks reference this field type.

---

## `primitiveType`

Declares the raw data type this field stores. Omit for complex object types.

| Value       | Use                              |
| ----------- | -------------------------------- |
| `"string"`  | Text values, dropdown selections |
| `"number"`  | Integer or float                 |
| `"boolean"` | Yes/No toggles                   |
| `"date"`    | Date value                       |
| (omitted)   | Complex objects or arrays        |

---

## Configuration Patterns

### 1. Static Dropdown (`configurationMetadata.options`)

A fixed list of selectable options. No backend call needed.

```json
"data": {
  "primitiveType": "string",
  "configurationMetadata": {
    "options": [
      { "title": "Equal", "value": "eq" },
      { "title": "Contains", "value": "contains" },
      { "title": "Starts with", "value": "startswith" }
    ]
  },
  "dependencyConfig": {
    "orderedMandatoryFields": []
  }
}
```

### 2. Dynamic Dropdown (`configurationMetadata.remote`)

Options are fetched from a backend endpoint at runtime. The endpoint receives the values of any declared dependency fields.

```json
"data": {
  "primitiveType": "string",
  "viewMetadata": {
    "noOptionsPlaceholder": ""
  },
  "configurationMetadata": {
    "remote": {
      "app": "apps",
      "type": "appFeatureOptions",
      "listUrl": "/workflow/my-feature/field/my-list"
    }
  },
  "dependencyConfig": {
    "orderedMandatoryFields": [
      {
        "sourceFieldTypeReferenceId": { "slug": "my-credentials-field" },
        "targetFieldKey": "credentials"
      }
    ]
  }
}
```

- `listUrl` — backend route that returns the list of options. The request includes current dependency values.
- `dependencyConfig.orderedMandatoryFields` — fields that must be filled before this field loads options. Order matters for UX (filled top-to-bottom).

### 3. Credentials Field (`configurationMetadata.displayMode: "credentials"`)

A special field type that lets users select or create credential sets. Renders a credential picker with optional "create new" action.

```json
"data": {
  "viewMetadata": {
    "noOptionsPlaceholder": ""
  },
  "configurationMetadata": {
    "displayMode": "credentials",
    "remote": {
      "app": "apps",
      "type": "appFeatureOptions",
      "listUrl": "/integration/my-feature/credentials/get",
      "createUrl": "/integration/my-feature/credentials/create",
      "creationAction": "redirect",
      "addNewText": "Add My Service Credentials"
    }
  }
}
```

### 4. Complex Object with Subfields (`subFieldsUrl`)

For fields that represent complex objects (e.g., entity key-value maps). The platform fetches the subfield schema from the backend, which returns a dynamic list of sub-inputs based on dependency values.

```json
"data": {
  "viewMetadata": {},
  "subFieldsUrl": "/workflow/my-feature/field/my-object",
  "subFieldsDependencyConfig": {
    "orderedMandatoryFields": [
      {
        "sourceFieldTypeReferenceId": { "slug": "my-credentials-field" },
        "targetFieldKey": "credentials"
      },
      {
        "sourceFieldTypeReferenceId": { "slug": "my-form-list-field" },
        "targetFieldKey": "form"
      }
    ]
  },
  "mfValidated": true
}
```

- `subFieldsUrl` — backend route that returns the sub-field schema (dynamic form structure). Can be a relative path (`/workflow/...`) when it is build kind of monday code or a full URL (`https://your-app.monday.app/workflow/...`).
- `subFieldsDependencyConfig` — what the platform passes when calling `subFieldsUrl`. Omit `primitiveType` and `configurationMetadata` when using `subFieldsUrl`.

### 5. Static Subfields (`staticSubFieldsConfig`)

For fields whose sub-schema is fixed at build time — no backend call needed. Define the shape directly in the manifest:

```json
"data": {
  "viewMetadata": {},
  "staticSubFieldsConfig": [
    {
      "key": "id",
      "title": "ID",
      "type": "primitive",
      "primitiveType": "string",
      "isNullable": false,
      "isArray": false
    },
    {
      "key": "displayName",
      "title": "Display name",
      "type": "primitive",
      "primitiveType": "string",
      "isNullable": false
    }
  ],
  "mfValidated": true
}
```

Use `staticSubFieldsConfig` when the object shape is always the same regardless of other field values. Use `subFieldsUrl` when the shape depends on runtime selections (e.g. chosen form determines which properties appear).

> Do not combine `staticSubFieldsConfig` with `subFieldsUrl` in the same field type.

---

## `credentialsDependencyConfig`

Field types that are credentials-aware (e.g. dropdowns that filter by the connected account) declare:

```json
"credentialsDependencyConfig": {
  "credentials": []
}
```

Empty array signals credentials-awareness with no hard dependency. The platform uses this to coordinate with `AppFeatureCredentials` features. See [CREDENTIALS.md](CREDENTIALS.md).

---

## Dependency Chains

Fields can depend on other fields in a chain. The `orderedMandatoryFields` list defines the load order — each field won't activate until its dependencies are filled.

### Mandatory Dependencies

```json
"dependencyConfig": {
  "orderedMandatoryFields": [
    {
      "sourceFieldTypeReferenceId": { "slug": "my-credentials-field" },
      "targetFieldKey": "credentials"
    },
    {
      "sourceFieldTypeReferenceId": { "slug": "my-form-list-field" },
      "targetFieldKey": "form"
    }
  ]
}
```

### Optional Dependencies

Fields can also declare optional dependencies that enrich behavior when present but are not required:

```json
"dependencyConfig": {
  "orderedMandatoryFields": [
    {
      "sourceFieldTypeReferenceId": { "slug": "my-credentials-field" },
      "targetFieldKey": "credentials"
    }
  ],
  "optionalFields": [
    {
      "sourceFieldTypeReferenceId": { "slug": "my-child-form-field" },
      "targetFieldKey": "childForm"
    }
  ]
}
```

### Linking Field Types to Each Other

The `targetFieldKey` on the dependency side must match the `defaultFieldKey` of the referenced field type. This is the binding contract:

```
Field type A: "defaultFieldKey": "credentials"
                          ↓
Field type B: dependency "targetFieldKey": "credentials"
                          ↓
Block inbound field: constraint key "credentials" → "inboundFieldKey": "credentialsField"
```

---

## `viewMetadata`

Controls display hints:

```json
"viewMetadata": {
  "noOptionsPlaceholder": ""   // shown when the dropdown has no options yet
}
```

For complex object fields, `viewMetadata` is typically `{}`.

---

## How Blocks Use Field Types

In a block's `inboundFieldsConfig`, reference the field type by slug and declare constraints that mirror the field type's dependencies:

```json
{
  "id": 1,
  "fieldTitle": "My List",
  "type": "custom",
  "fieldTypeReferenceId": { "slug": "my-list-field" },
  "allowPrimitiveForm": false,
  "fieldKey": "myList",
  "constraints": {
    "dependencies": {
      "credentials": { "inboundFieldKey": "credentialsField" }
    }
  }
}
```

For subfield-type fields, use `subFieldsDependencies` instead of `dependencies`:

```json
"constraints": {
  "subFieldsDependencies": {
    "credentials": { "inboundFieldKey": "credentialsField" },
    "form": { "inboundFieldKey": "formField" }
  }
}
```
