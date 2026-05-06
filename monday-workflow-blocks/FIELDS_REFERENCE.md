# Field Type Reference

## Primitive Field (static options)

```json
{
  "key": "my-field-status",
  "type": "AppFeatureFieldType",
  "name": "My Status Field",
  "build": { "kind": "monday-code" },
  "data": {
    "name": "My Status Field",
    "referenceId": { "slug": "my-field-status" },
    "appId": 12345678,
    "primitiveType": "string",
    "viewMetadata": { "noOptionsPlaceholder": "" },
    "description": "Status of the thing",
    "defaultFieldKey": "status",
    "configurationMetadata": {
      "options": [
        { "title": "Active", "value": "active" },
        { "title": "Inactive", "value": "inactive" }
      ]
    },
    "dependencyConfig": { "orderedMandatoryFields": [] },
    "mfValidated": true
  }
}
```

## Primitive Field (dynamic/remote options)

```json
{
  "key": "my-field-form-list",
  "type": "AppFeatureFieldType",
  "name": "My Form List",
  "build": { "kind": "monday-code" },
  "data": {
    "name": "My Form List",
    "referenceId": { "slug": "my-field-form-list" },
    "appId": 12345678,
    "primitiveType": "string",
    "viewMetadata": { "noOptionsPlaceholder": "" },
    "description": "List of forms from the service",
    "defaultFieldKey": "form",
    "configurationMetadata": {
      "remote": {
        "app": "apps",
        "type": "appFeatureOptions",
        "listUrl": "/workflow/myservice/field/form-list"
      }
    },
    "dependencyConfig": {
      "orderedMandatoryFields": [
        {
          "sourceFieldTypeReferenceId": { "slug": "my-field-credentials" },
          "targetFieldKey": "credentials"
        }
      ]
    },
    "mfValidated": true
  }
}
```

## Object Field (dynamic subfields)

Object fields render as a group of sub-fields. The schema is fetched from `subFieldsUrl` at runtime.

```json
{
  "key": "my-field-form-properties",
  "type": "AppFeatureFieldType",
  "name": "Form Properties",
  "build": { "kind": "monday-code" },
  "data": {
    "name": "Form Properties",
    "referenceId": { "slug": "my-field-form-properties" },
    "appId": 12345678,
    "viewMetadata": {},
    "description": "Dynamic form fields",
    "defaultFieldKey": "formProperties",
    "subFieldsUrl": "/workflow/myservice/field/form-properties",
    "subFieldsDependencyConfig": {
      "orderedMandatoryFields": [
        {
          "sourceFieldTypeReferenceId": { "slug": "my-field-credentials" },
          "targetFieldKey": "credentials"
        },
        {
          "sourceFieldTypeReferenceId": { "slug": "my-field-form-list" },
          "targetFieldKey": "form"
        }
      ],
      "optionalFields": [
        {
          "sourceFieldTypeReferenceId": { "slug": "my-field-child-form-list" },
          "targetFieldKey": "childForm"
        }
      ]
    },
    "mfValidated": true
  }
}
```

The endpoint at `subFieldsUrl` returns a schema map:

```json
{
  "name": {
    "title": "Full Name",
    "type": "primitive",
    "primitiveType": "string",
    "isNullable": false,
    "isOptional": false,
    "isArray": false
  },
  "age": {
    "title": "Age",
    "type": "primitive",
    "primitiveType": "number",
    "isNullable": true,
    "isOptional": true,
    "isArray": false
  },
  "tags": {
    "title": "Tags",
    "type": "custom",
    "fieldTypeKey": "my-field-tag-list",
    "isNullable": false,
    "isOptional": false,
    "isArray": true
  }
}
```

> **Rule:** Always set `isOptional` equal to `isNullable`. Mismatches cause validation errors.

## Credentials Field

```json
{
  "key": "my-field-credentials",
  "type": "AppFeatureFieldType",
  "name": "My Service Credentials",
  "build": { "kind": "monday-code" },
  "data": {
    "name": "My Service Credentials",
    "referenceId": { "slug": "my-field-credentials" },
    "appId": 12345678,
    "viewMetadata": { "noOptionsPlaceholder": "" },
    "description": "",
    "defaultFieldKey": "credentials",
    "configurationMetadata": {
      "displayMode": "credentials",
      "remote": {
        "app": "apps",
        "type": "appFeatureOptions",
        "listUrl": "/integration/myservice/credentials/get",
        "createUrl": "/integration/myservice/credentials/create",
        "creationAction": "redirect",
        "addNewText": "My Service Credentials"
      }
    },
    "mfValidated": true
  }
}
```

---

## Nested Fields — The Level Workaround

**Problem:** monday.com does not allow a field type to list itself as a dependency. A "child form" field that depends on "form" cannot be the same feature as "form."

**Solution:** Create a separate `AppFeatureFieldType` per depth level with a different slug, even if the backend endpoint returns the same data:

| Level | Slug | Depends on |
|-------|------|------------|
| 1 | `my-field-form-list` | credentials |
| 2 | `my-field-child-form-list` | credentials + form-list |
| 3 | `my-field-grandchild-form-list` | credentials + child-form-list |

All three can share the same backend URL — the handler knows the depth from dependency values in `payload.dependencyData`.

---

## Dependency Config Keys

| Key | Used in | Purpose |
|-----|---------|---------|
| `dependencyConfig.orderedMandatoryFields` | Primitive fields | Must resolve before options are loaded |
| `dependencyConfig.optionalFields` | Primitive fields | Sent if available; field loads without them |
| `subFieldsDependencyConfig.orderedMandatoryFields` | Object fields | Must resolve before sub-field schema is fetched |
| `subFieldsDependencyConfig.optionalFields` | Object fields | Sent if set; schema still loads without them |

When these resolve, their values appear in `payload.dependencyData` sent to your endpoint.

---

## Boolean Field

`primitiveType: "boolean"` with explicit true/false options:

```json
"configurationMetadata": {
  "options": [
    { "title": "No", "value": false },
    { "title": "Yes", "value": true }
  ]
}
```

---

## Field Flags: `isArray`, `isNullable`, `isOptional`

These three flags appear in block field configs (`inboundFieldsConfig`, `outboundFieldsConfig`) and in object subfield schemas.

### `isOptional` — UI requirement in the workflow builder

Controls whether the user must fill in this field before saving the workflow. Applies to block fields and object subfields.

```json
{ "isOptional": false }  // user must fill this in
{ "isOptional": true  }  // user can leave it blank
```

### `isNullable` — declares the value may be null at runtime

Primarily meaningful on **output fields**. When `true`, it signals to downstream blocks that the output value may be `null` at runtime. monday.com uses this to prevent a nullable output from being offered as a candidate for a downstream **required** (`isOptional: false`) input field.

```json
{ "isNullable": false }  // value is always present — safe for required downstream inputs
{ "isNullable": true  }  // value may be null — only mappable to optional downstream inputs
```

On an **input** field, `isNullable: true` means the block itself accepts null (the user left it blank).

### `isArray` — field holds multiple values

When `true`, the value arrives in the payload as an array. Applies to both block fields and object subfields.

```json
{ "isArray": false }  // single value:  "ORDERS"
{ "isArray": true  }  // multiple values: ["ORDERS", "INVOICES"]
```

### Quick reference

| `isOptional` | `isNullable` | `isArray` | Meaning |
|:---:|:---:|:---:|---------|
| `false` | `false` | `false` | Required, always a single non-null value |
| `true` | `true` | `false` | Optional single value, may be null |
| `false` | `false` | `true` | Required multi-select, always has values |
| `true` | `true` | `true` | Optional multi-select, may be empty/null |

### In object subfield schemas (`subFieldsUrl` response)

All three flags appear together per sub-field:

```json
{
  "name": {
    "title": "Full Name",
    "type": "primitive",
    "primitiveType": "string",
    "isOptional": false,
    "isNullable": false,
    "isArray": false
  },
  "tags": {
    "title": "Tags",
    "type": "primitive",
    "primitiveType": "string",
    "isOptional": true,
    "isNullable": true,
    "isArray": true
  }
}
```
