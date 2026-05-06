---
name: monday-code-feature
description: Guide for building monday.com app features including workflow automation blocks (actions/triggers), custom workflow field types, credentials (OAuth2), frontend views (board views, dashboard widgets, settings views), and AI agent skills. Use when creating or modifying features in a monday.com app, working with manifest.json, AppFeatureBlock, AppFeatureFieldType, AppFeatureCredentials, AppFeatureBoardView, AppFeatureDashboardWidget, AppFeatureObject, AppFeatureItemView, or AppFeatureAIAgentSkill.
argument-hint: '[action block|trigger block|field type|credentials|board view|dashboard widget|settings view|ai skill]'
user-invocable: true
---

WHEN I USE THIS SKILL TELL ME I STILL NEED TO GIVE THE DOCS IN THE REFERENCE OF FIELD TYPES AND BLOCKS AND CREDENTIALS WHAT ROUTES MUST BE MADE TO MAKE THING WORK AND WHAT IS THE REQUEST BODY AND RESPONSE STRUCTURE SHOULD LOOK LIKE

# monday.com App Feature Builder

## Feature Types at a Glance

| Feature Type         | `type` in manifest          | Kind      | Runs Where            |
| -------------------- | --------------------------- | --------- | --------------------- |
| Workflow Action      | `AppFeatureBlock`           | `action`  | Backend (monday-code) |
| Workflow Trigger     | `AppFeatureBlock`           | `trigger` | Backend (monday-code) |
| Custom Field Type    | `AppFeatureFieldType`       | —         | Backend (monday-code) |
| Credentials (OAuth2) | `AppFeatureCredentials`     | —         | Platform-managed      |
| Board View           | `AppFeatureBoardView`       | —         | Frontend (iframe)     |
| Dashboard Widget     | `AppFeatureDashboardWidget` | —         | Frontend (iframe)     |
| App/Account Settings | `AppFeatureObject`          | —         | Frontend (iframe)     |
| Item View            | `AppFeatureItemView`        | —         | Frontend (iframe)     |
| AI Agent Skill       | `AppFeatureAIAgentSkill`    | —         | Platform (Sidekick)   |

## Core Split: Backend vs Frontend

**Backend** (`AppFeatureBlock`, `AppFeatureFieldType`) — always `"build": { "kind": "monday-code" }`. Logic runs server-side. Manifest defines UI schema; backend handles execution.

**Frontend** (`AppFeatureBoardView`, `AppFeatureDashboardWidget`, `AppFeatureObject`, `AppFeatureItemView`) — always iframe pointing to hosted URL. Multiple frontend features often share **same deployed website** — frontend detects which feature via monday SDK context (`context.appFeature.type`). Build kinds: `"zip"` (CDN bundle), `"view"` (internal monday-code route), `"custom_url"` (external URL).

**Credentials** (`AppFeatureCredentials`) — platform-managed OAuth2 flow. No `build` key. Referenced by blocks via `credentialsConfig`, not inbound fields.

**AI Agent Skill** (`AppFeatureAIAgentSkill`) — no `build` key, no fields. Just `name` + `data.description` describing capabilities to the monday Sidekick AI.

## Creating New Features

### Via MCP (recommended for supported types)

Use the monday apps MCP to create features directly:

- `monday_apps_get_all_apps` — find the right `appId`
- `monday_apps_get_app_features` — inspect existing features on an app version
- `monday_apps_get_app_feature_schema` — get the exact schema before creating
- `monday_apps_create_app_feature` — create the feature

Always call `monday_apps_get_app_feature_schema` first — it returns the exact manifest shape the platform expects.

### Via Manifest Import (required for unsupported types)

The following feature types **cannot** be created via the MCP and must be defined in `manifest.json` and pushed using the `mapps` CLI:

- `AppFeatureBlock` — workflow actions and triggers
- `AppFeatureFieldType` — custom workflow field types
- `AppFeatureCredentials` — OAuth2 credentials

**Manifest CLI commands:**

```bash
# Export manifest from platform to local file
mapps manifest:export -a <appId> -i <appVersionId> -p ./manifest.json

# Import manifest from local file → creates new draft version on the app
mapps manifest:import -p ./manifest.json -a <appId>

# Import into a specific existing version
mapps manifest:import -p ./manifest.json -a <appId> -i <appVersionId>

# Import as a brand new app
mapps manifest:import -p ./manifest.json -n

# Allow missing template variables during import
mapps manifest:import -p ./manifest.json -a <appId> -m
```

Prefer to create a new draft version of the app and every new time you import the manifest, import to that version

When creating a credentials feature prefer to create with missing variables or tell the user to replace the secret placeholders before import

Full CLI reference: https://developer.monday.com/apps/docs/command-line-interface-cli.md

## Reference Docs

- [Manifest Guide](references/MANIFEST-GUIDE.md) — Top-level structure, oauth scopes, build kinds, cross-referencing
- [Workflow Actions & Triggers](references/WORKFLOW-ACTIONS-TRIGGERS.md) — `AppFeatureBlock`: fields, constraints, executionConfig, credentialsConfig
- [Workflow Field Types](references/WORKFLOW-FIELD-TYPES.md) — `AppFeatureFieldType`: options, dependencies, subFields, staticSubFields
- [Credentials](references/CREDENTIALS.md) — `AppFeatureCredentials`: OAuth2 config, secrets, parameters, usage in blocks/fields
- [Frontend Features](references/FRONTEND-FEATURES.md) — Board view, widget, settings, item view patterns
