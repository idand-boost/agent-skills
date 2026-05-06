# Credentials Feature (AppFeatureCredentials)

`AppFeatureCredentials` is a first-class feature type that handles OAuth2 (and other auth) flows for connecting external services. It owns the token lifecycle — authorize, exchange, refresh — and exposes credentials to blocks via `credentialsConfig`.

## Manifest Structure (OAuth2)

```json
{
  "key": "my-service-credentials",
  "type": "AppFeatureCredentials",
  "name": "My Service Token",
  "data": {
    "name": "My Service Token",
    "referenceId": { "slug": "my-service-credentials" },
    "appId": 12345678,
    "authMethod": "oAuth2",
    "authConfig": {
      "clientId": "your-client-id",
      "authorizeRequest": {
        "url": "https://service.com/oauth/authorize?client_id=your-client-id&response_type=code&state=new&redirect_uri=https://apps-credentials.monday.com/authorize/oauth2/redirect-uri",
        "params": []
      },
      "tokenRequest": {
        "url": "https://service.com/oauth/token",
        "body": []
      },
      "refreshTokenRequest": {
        "url": "https://service.com/oauth/token",
        "body": []
      },
      "scopeConfig": {
        "scopes": "read write offline_access",
        "separator": "Space"
      },
      "providerUniqueIdentifierRequest": {
        "url": "https://your-monday-code-app.monday.app/auth/my-service/provider-uuid"
      },
      "fallbackTokenExpiration": {
        "tokenTtlSeconds": 3600
      },
      "enablePKCE": false
    },
    "configured_secret_names": ["clientSecret"], // DON'T CHANGE THIS IT MUST BE ["clientSecret"]
    "description": "Connect your My Service account",
    "defaultFieldKey": "myServiceToken",
    "documentationLink": "https://docs.myservice.com/authentication",
    "mfValidated": true,
    "parameters": {
      "description": {
        "text": "Your My Service account subdomain",
        "link": {
          "url": "https://docs.myservice.com/api-details",
          "text": "How to find your subdomain"
        }
      },
      "fieldTypes": [
        {
          "id": 0,
          "type": "primitive",
          "fieldKey": "mySlug",
          "fieldTitle": "Account Subdomain",
          "information": {
            "text": "Found as the text before .myservice.com in your URL"
          },
          "placeholder": "company-name",
          "isOptional": false,
          "primitiveType": "string",
          "staticSuffix": "subdomain"
        }
      ]
    }
  },
  "secrets": {
    "clientSecret": "{{MY_SERVICE_CLIENT_SECRET}}"
  }
}
```

### Key Fields

| Field                                                | Notes                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `authMethod`                                         | `"oAuth2"` — the only confirmed value; API-key style may differ                                         |
| `authConfig.clientId`                                | OAuth2 client ID (public, not secret)                                                                   |
| `authConfig.authorizeRequest.url`                    | The OAuth2 authorize URL; supports `{{paramKey}}` interpolation from `parameters.fieldTypes`            |
| `authConfig.tokenRequest.url`                        | Token exchange endpoint                                                                                 |
| `authConfig.refreshTokenRequest.url`                 | Token refresh endpoint                                                                                  |
| `authConfig.scopeConfig.scopes`                      | Space-separated (or other separator) scope string                                                       |
| `authConfig.scopeConfig.separator`                   | `"Space"` or `"Comma"`                                                                                  |
| `authConfig.providerUniqueIdentifierRequest.url`     | Backend endpoint that returns a unique ID for the connected account that is managed by this application |
| `authConfig.fallbackTokenExpiration.tokenTtlSeconds` | TTL if the token response doesn't include `expires_in`                                                  |
| `authConfig.enablePKCE`                              | `true`/`false` — enables PKCE flow                                                                      |
| `configured_secret_names`                            | Array of secret keys declared in `secrets`                                                              |
| `secrets`                                            | Maps secret names to env var placeholders — **never hardcode values**                                   |
| `parameters.fieldTypes`                              | User-visible inputs shown before the OAuth redirect (e.g. subdomain, instance URL)                      |
| `documentationLink`                                  | Link shown to users when setting up credentials                                                         |

### URL Interpolation in `authorizeRequest.url`

Use `{{fieldKey}}` to inject user-provided parameter values into the authorize URL:

```json
"url": "https://{{bamboohrSlug}}.bamboohr.com/authorize.php?..."
```

Where `bamboohrSlug` is the `fieldKey` in `parameters.fieldTypes`.

### `parameters.fieldTypes` Fields

| Field              | Notes                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------- |
| `id`               | Sequential integer                                                                      |
| `fieldKey`         | Used in URL interpolation and passed to `providerUniqueIdentifierRequest`               |
| `fieldTitle`       | Label shown to user                                                                     |
| `primitiveType`    | `"string"`, `"number"`                                                                  |
| `isOptional`       | `true`/`false` — whether the field is required before OAuth redirect                    |
| `placeholder`      | Hint text                                                                               |
| `staticSuffix`     | Static text appended after the input (e.g. `"subdomain"` shows `.myservice.com` suffix) |
| `information.text` | Tooltip/info text                                                                       |

---

## Using Credentials in Action/Trigger Blocks

Blocks reference credentials via `credentialsConfig` (not via inbound fields):

```json
"data": {
  ...
  "credentialsConfig": {
    "credentials": [
      {
        "id": 1,
        "credentialsHeader": "Connect your My Service account",
        "credentialsTitle": "My Service account",
        "credentialsReferenceId": { "slug": "my-service-credentials" },
        "credentialsKey": "myServiceToken",
        "credentialsPlaceholder": "company.myservice.com"
      }
    ]
  }
}
```

| Field                         | Notes                                                  |
| ----------------------------- | ------------------------------------------------------ |
| `id`                          | Integer, starts at 1 (not 0)                           |
| `credentialsHeader`           | Section header shown in recipe UI                      |
| `credentialsTitle`            | Label for the credential picker                        |
| `credentialsReferenceId.slug` | Must match the `AppFeatureCredentials` feature `key`   |
| `credentialsKey`              | How the credentials are keyed in the execution payload |
| `credentialsPlaceholder`      | Hint shown in the picker                               |

When the action fires, credentials are passed under `payload.credentialsValues[credentialsKey]`.

---

## Using Credentials in Field Types

Field types that need credentials context declare `credentialsDependencyConfig`:

```json
"data": {
  ...
  "credentialsDependencyConfig": {
    "credentials": []
  }
}
```

Empty array means the platform knows this field is credentials-aware but has no hard dependency. Non-empty would list credential slugs (pattern mirrors `dependencyConfig`).

---

## Static Subfields (`staticSubFieldsConfig`)

An alternative to `subFieldsUrl` when the subfield schema is known at build time (no backend call needed). Define the subfield list directly in the manifest:

```json
"data": {
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
  ]
}
```

Use `staticSubFieldsConfig` when the shape of the object is fixed. Use `subFieldsUrl` when the shape depends on runtime values (e.g. the selected form determines which properties exist).

> Do not combine `staticSubFieldsConfig` with `subFieldsUrl` in the same field type.
