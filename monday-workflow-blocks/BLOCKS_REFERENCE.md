# Blocks Reference

## Action Block (manifest.json)

```json
{
  "key": "my-action-create-entity",
  "type": "AppFeatureBlock",
  "name": "Create Entity",
  "build": { "kind": "monday-code" },
  "data": {
    "name": "Create Entity",
    "referenceId": { "slug": "my-action-create-entity" },
    "appId": 12345678,
    "inboundFieldsConfig": {
      "fields": [
        {
          "id": 0,
          "fieldTitle": "Credentials",
          "isArray": false,
          "isNullable": false,
          "type": "custom",
          "fieldTypeReferenceId": { "slug": "my-field-credentials" },
          "allowPrimitiveForm": false,
          "fieldKey": "credentials"
        },
        {
          "id": 1,
          "fieldTitle": "Form",
          "fieldHeader": "Select which form to create",
          "isArray": false,
          "isNullable": false,
          "type": "custom",
          "fieldTypeReferenceId": { "slug": "my-field-form-list" },
          "allowPrimitiveForm": false,
          "fieldKey": "form",
          "constraints": {
            "dependencies": {
              "credentials": { "inboundFieldKey": "credentials" }
            }
          }
        },
        {
          "id": 2,
          "fieldTitle": "Form Fields",
          "fieldHeader": "Fill in the values",
          "isArray": false,
          "isNullable": false,
          "type": "custom",
          "fieldTypeReferenceId": { "slug": "my-field-form-properties" },
          "allowPrimitiveForm": false,
          "fieldKey": "formData",
          "constraints": {
            "subFieldsDependencies": {
              "credentials": { "inboundFieldKey": "credentials" },
              "form": { "inboundFieldKey": "form" }
            }
          }
        }
      ]
    },
    "outboundFieldsConfig": {
      "fields": [
        {
          "id": 0,
          "fieldTitle": "Created Entity ID",
          "isArray": false,
          "isNullable": false,
          "type": "primitive",
          "primitiveType": "string",
          "fieldKey": "entityId"
        }
      ]
    },
    "kind": "action",
    "executionConfig": {
      "runConfig": { "url": "/workflow/myservice/action/create-entity" }
    },
    "isAsync": false,
    "description": "Creates a new entity in My Service",
    "viewMetadata": {
      "previewInboundFieldKeys": ["form"]
    },
    "mfValidated": true
  }
}
```

### Async Action Block

Add `"isAsync": true`. The run URL must immediately return:

```json
{ "status": "received", "message": "Processing.", "actionUuid": "..." }
```

Then POST to `payload.callbackUrl` when done:

```json
// Success:
{ "success": true, "outputFields": { "entityId": "abc123" } }

// Failure:
{
  "success": false,
  "severityCode": 4000,
  "runtimeErrorDescription": "Activity log message",
  "notificationErrorTitle": "Notification title",
  "notificationErrorDescription": "Notification body"
}
```

Sign the callback Authorization header with: `jwt.sign({ appId }, MONDAY_SIGNING_SECRET)`

---

## Trigger Block (manifest.json)

```json
{
  "key": "my-trigger-on-event",
  "type": "AppFeatureBlock",
  "name": "When event occurs",
  "build": { "kind": "monday-code" },
  "data": {
    "name": "When event occurs",
    "referenceId": { "slug": "my-trigger-on-event" },
    "appId": 12345678,
    "inboundFieldsConfig": {
      "fields": [
        {
          "id": 0,
          "fieldTitle": "Credentials",
          "isArray": false,
          "isNullable": false,
          "type": "custom",
          "fieldTypeReferenceId": { "slug": "my-field-credentials" },
          "allowPrimitiveForm": false,
          "fieldKey": "credentials"
        },
        {
          "id": 1,
          "fieldTitle": "Event Type",
          "isArray": false,
          "isNullable": false,
          "type": "custom",
          "fieldTypeReferenceId": { "slug": "my-field-event-list" },
          "allowPrimitiveForm": false,
          "fieldKey": "eventType",
          "constraints": {
            "dependencies": {
              "credentials": { "inboundFieldKey": "credentials" }
            }
          }
        }
      ]
    },
    "outboundFieldsConfig": {
      "fields": [
        {
          "id": 0,
          "fieldTitle": "Event Data",
          "isArray": false,
          "isNullable": false,
          "type": "custom",
          "fieldTypeReferenceId": { "slug": "my-field-event-output" },
          "fieldKey": "eventData",
          "constraints": {
            "subFieldsDependencies": {
              "eventType": { "inboundFieldKey": "eventType" }
            }
          }
        }
      ]
    },
    "kind": "trigger",
    "executionConfig": {
      "subscribeConfig": { "url": "/workflow/myservice/trigger/subscribe/on-event" },
      "unsubscribeConfig": { "url": "/workflow/myservice/trigger/unsubscribe/on-event" }
    },
    "viewMetadata": {
      "previewInboundFieldKeys": ["eventType"]
    },
    "mfValidated": true,
    "contextsData": {}
  }
}
```

---

## Inbound Field `constraints` Patterns

### `dependencies` — primitive field depends on another block field's value

```json
"constraints": {
  "dependencies": {
    "credentials": { "inboundFieldKey": "credentials" },
    "form": { "inboundFieldKey": "form" }
  }
}
```

Used when a primitive field's remote options need to know the value of another field.

### `subFieldsDependencies` — object field's sub-schema depends on other fields

```json
"constraints": {
  "subFieldsDependencies": {
    "credentials": { "inboundFieldKey": "credentials" },
    "form": { "inboundFieldKey": "form" }
  }
}
```

Used when an object field's dynamic sub-fields change based on other field values.

---

## Using Native monday.com Fields (numeric IDs)

Some block fields reference native monday.com field types by integer ID instead of a slug:

| Native type | ID |
|-------------|-----|
| Board picker | `10380086` |
| Item picker | `10380092` |
| File column | `10486737` |
| Column picker | `10595239` |

```json
{
  "id": 4,
  "fieldTitle": "Board",
  "isArray": false,
  "isNullable": false,
  "type": "custom",
  "fieldTypeReferenceId": 10380086,
  "allowPrimitiveForm": false,
  "fieldKey": "boardId"
}
```

---

## Action Request Payload (from monday)

```json
{
  "payload": {
    "blockKind": "action",
    "credentialsValues": {
      "credentials": { "userCredentialsId": 123, "accessToken": "token" }
    },
    "inboundFieldValues": {
      "form": "ORDERS",
      "formData": { "CUSTNAME": "CUST001", "AMOUNT": 500 }
    },
    "inputFields": { "...same as inboundFieldValues..." },
    "recipeId": 629280,
    "integrationId": 398528596,
    "callbackUrl": "https://callback.monday.com/..."
  },
  "runtimeMetadata": {
    "actionUuid": "3b0a86dc...",
    "triggerUuid": "bd661564..."
  }
}
```

`callbackUrl` only present when `isAsync: true`.

---

## Error Response Shapes

```json
// 4000 — automation fails, user can fix and retry
{
  "severityCode": 4000,
  "notificationErrorTitle": "Invalid configuration",
  "notificationErrorDescription": "The selected form no longer exists.",
  "runtimeErrorDescription": "Form ORDERS not found in Priority"
}

// 6000 — automation disabled permanently
{
  "severityCode": 6000,
  "notificationErrorTitle": "Integration disabled",
  "notificationErrorDescription": "App permissions were revoked.",
  "runtimeErrorDescription": "Access token invalid",
  "disableErrorDescription": "Please reconnect the integration."
}
```

Return these with an HTTP 4xx status. `runtimeErrorDescription` appears in the activity log.

---

## Automation Template (manifest.json)

Templates wire one trigger output to one action input for users:

```json
{
  "key": "my-template-create-on-event",
  "type": "AppFeatureAutomationTemplate",
  "name": "Create entity when event occurs",
  "build": { "kind": "monday-code" },
  "data": {
    "name": "Create entity when event occurs",
    "description": "Automatically creates a Priority entity when the event fires",
    "triggerBlockReferenceId": { "slug": "my-trigger-on-event" },
    "actionBlockReferenceId": { "slug": "my-action-create-entity" },
    "fieldsMappingConfig": [
      {
        "actionFieldKey": "formData",
        "triggerOutputFieldKey": "eventData"
      }
    ],
    "displayOrder": 1
  }
}
```
