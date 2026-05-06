# Frontend Features

Frontend features are iframes embedded inside monday.com. They all work the same way: the manifest points to a hosted URL; monday renders it inside an iframe and passes context via the monday SDK.

## The Shared Frontend Pattern

Multiple frontend features often point to the **same deployed website**. The frontend reads `context.appFeature.type` from the monday SDK to know which feature is active and render accordingly.

```js
const context = await monday.get('context');
const featureType = context.data.appFeature.type;
// e.g. "AppFeatureBoardView", "AppFeatureObject", "AppFeatureDashboardWidget"
```

This is the standard approach — one React app, multiple feature types, routing handled by the frontend itself.

---

## AppFeatureBoardView

A custom tab added to any board. Appears in the board's view tabs alongside "Main Table", "Kanban", etc.

```json
{
  "key": "my-board-view",
  "type": "AppFeatureBoardView",
  "name": "My Board View",
  "schemaVersion": "17",
  "build": {
    "url": "https://abc123.cdn2.monday.app/index.html",
    "kind": "zip"
  },
  "data": {
    "mode": "iframe",
    "name": "My Board View",
    "uploading": false,
    "description": "A custom view for the board",
    "query_parmas": true,
    "hideBoardControls": true,
    "isMobileSupported": false
  }
}
```

**`data` fields:**

| Field               | Type       | Notes                                          |
| ------------------- | ---------- | ---------------------------------------------- |
| `mode`              | `"iframe"` | Always `"iframe"`                              |
| `name`              | string     | Display name                                   |
| `description`       | string     | Shown in the view picker                       |
| `query_parmas`      | boolean    | Whether to pass query params to the iframe URL |
| `hideBoardControls` | boolean    | Hides monday's top board control bar           |
| `isMobileSupported` | boolean    | Whether this view works on mobile              |
| `uploading`         | boolean    | Internal flag, set to `false`                  |

> Note: `query_parmas` is the correct spelling used by monday's platform (not a typo in your manifest).

---

## AppFeatureDashboardWidget

A widget displayed on monday dashboards. Users add it to a dashboard from the widget library.

```json
{
  "key": "my-dashboard-widget",
  "type": "AppFeatureDashboardWidget",
  "name": "My Widget",
  "schemaVersion": "17",
  "build": {
    "url": "https://abc123.cdn2.monday.app/index.html",
    "kind": "zip"
  },
  "data": {
    "mode": "iframe",
    "name": "My Widget",
    "description": "A widget for dashboards",
    "uploading": false
  }
}
```

The frontend receives dashboard context including connected board IDs, widget ID, and `viewMode` (`"widget"` vs `"fullscreen"`).

---

## AppFeatureObject (Settings View)

A dedicated settings/configuration page for the app. Appears under the app's settings in the account. Can also be used as an "app object" visible to admins.

```json
{
  "key": "my-settings",
  "type": "AppFeatureObject",
  "name": "My App Settings",
  "schemaVersion": "8",
  "build": {
    "url": "/settings",
    "kind": "view"
  },
  "data": {
    "mode": "iframe",
    "name": "My App Settings",
    "description": "Configure credentials and preferences",
    "uploading": false,
    "query_parmas": true
  }
}
```

When using `"kind": "view"`, the URL is a relative path on the monday-code server (the same server running your backend). This is useful when the settings page is served by the same app.

---

## AppFeatureItemView

A custom panel added to the item (pulse) detail view. Appears in the item's side panel tabs.

```json
{
  "key": "my-item-view",
  "type": "AppFeatureItemView",
  "name": "My Item Panel",
  "schemaVersion": "17",
  "build": {
    "url": "https://abc123.cdn2.monday.app/index.html",
    "kind": "zip"
  },
  "data": {
    "mode": "iframe",
    "name": "My Item Panel",
    "description": "Shows item detail from external system",
    "uploading": false,
    "isMobileSupported": false
  }
}
```

The frontend receives item-specific context including `itemId`, `boardId`, and `pulseId`.

---

## Build Kind Decision Guide

| Situation                              | Build Kind     | URL                             |
| -------------------------------------- | -------------- | ------------------------------- |
| Deployed to monday CDN via `mapps` CLI | `"zip"`        | CDN URL after upload            |
| Served from your monday-code backend   | `"view"`       | Internal path (e.g. `/my-view`) |
| Hosted externally (your own server)    | `"custom_url"` | Your external URL               |

---

## Monday SDK Context Shape (Frontend)

When your frontend loads inside monday, call:

```js
import mondaySdk from 'monday-sdk-js';
const monday = mondaySdk();
const { data: context } = await monday.get('context');
```

Relevant context fields:

```json
{
  "theme": "light",
  "boardId": 12345678,
  "itemId": 87654321,
  "workspaceId": 98765,
  "user": { "id": "123", "isAdmin": true },
  "account": { "id": "456" },
  "appFeature": {
    "type": "AppFeatureBoardView",
    "name": "My Board View"
  },
  "appVersion": {
    "id": 10124592,
    "mondayCodeHostingUrl": "https://xyz.monday.app"
  }
}
```

- `appFeature.type` — the feature type string; use to branch behavior in a shared frontend
- `appVersion.mondayCodeHostingUrl` — the base URL of your monday-code backend; useful for making API calls from the frontend to your own server
- For dashboard widgets: `boardIds` (array), `widgetId`, `viewMode`, `instanceType`
- For item views: `itemId`, `pulseId`, `boardId`
