# Manifest Guide

The `manifest.json` file is the single source of truth for your monday.com app. It defines your app's identity and declares every feature the app provides.

## Top-Level Structure

```json
{
  "version": "1.0.0",
  "app": {
    "name": "My App",
    "slug": "my_app_slug",
    "description": "What this app does",
    "color": { ... },
    "oauth": {
      "redirectUri": [
        "https://<tunnel>.monday.app/oauth/callback",
        "https://<production>.monday.app/oauth/callback",
        "http://localhost:8080/oauth/callback"
      ],
      "scopes": ["me:read", "boards:read", "boards:write"]
    },
    "features": [ ... ]
  }
}
```

### OAuth Scopes

| Scope | Access |
|---|---|
| `me:read` | Current user info |
| `account:read` | Account-level data |
| `assets:read` | Read file assets |
| `boards:read` | Read boards, items, columns |
| `boards:write` | Create/update boards, items, columns |
| `docs:read` | Read monday docs |
| `docs:write` | Create/update monday docs |
| `notifications:write` | Send in-app notifications |
| `tags:read` | Read tags |
| `teams:read` | Read teams |
| `teams:write` | Create/update teams |
| `updates:read` | Read item updates |
| `updates:write` | Post updates on items |
| `users:read` | Read user list |
| `users:write` | Update user data |
| `webhooks:read` | Read webhooks |
| `webhooks:write` | Create/delete webhooks |
| `workspaces:read` | Read workspaces |
| `workspaces:write` | Create/update workspaces |

## Feature Entry Structure

Every feature in the `features` array follows this shape:

```json
{
  "key": "unique-feature-key",
  "type": "AppFeatureBlock",
  "name": "Human-readable name",
  "schemaVersion": "8",
  "build": {
    "kind": "monday-code"
  },
  "data": { ... }
}
```

- **`key`** — unique identifier within the app, used to reference the feature internally
- **`type`** — determines what kind of feature this is (see table in SKILL.md)
- **`schemaVersion`** — version of the feature schema; increment when data structure changes significantly
- **`build`** — how the feature is deployed (see Build Kinds below)
- **`data`** — feature-specific configuration (differs by type)

## Build Kinds

### `"monday-code"` (backend features)
Used by `AppFeatureBlock` and `AppFeatureFieldType`. The feature runs as server-side code on monday's infrastructure. No URL is specified here — the execution URLs are defined inside `data.executionConfig` or `data.subFieldsUrl`.

```json
"build": {
  "kind": "monday-code"
}
```

### `"zip"` (frontend, static bundle)
Used for frontend features uploaded as a static bundle to monday's CDN. The `url` is the CDN location after upload.

```json
"build": {
  "url": "https://abc123.cdn2.monday.app/index.html",
  "kind": "zip"
}
```

### `"view"` (frontend, internal monday-code route)
Used when the frontend is served from within a monday-code app at a specific route. The `url` is a relative path on the same monday-code server.

```json
"build": {
  "url": "/credentials",
  "kind": "view"
}
```

### `"custom_url"` (frontend, external URL)
Points to any external URL hosting the frontend.

```json
"build": {
  "url": "https://my-app.example.com/board-view",
  "kind": "custom_url"
}
```

## Feature Cross-Referencing

Features reference each other by **slug**. The slug is defined under `data.referenceId.slug` for field types, and referenced in blocks via `fieldTypeReferenceId.slug`.

```json
{ "slug": "my-field-type-slug" }
```

monday.com built-in field types (Board, Item, Column, etc.) are referenced by a **numeric ID** instead of a slug. These IDs are fixed by the platform and visible in the manifest when a feature uses them.

```json
{ "fieldTypeReferenceId": 10380086 }
```

> Always reference your own field types by slug. Only use numeric IDs for platform-native fields (Board, Item, Column pickers).
