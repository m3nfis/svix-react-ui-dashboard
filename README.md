# @m3nfis/svix-react-ui-dashboard

Drop-in React UI for managing [Svix](https://github.com/svix/svix-webhooks) webhooks — endpoints, event catalog, message logs, activity overview, and a full API reference page.

Built for **script-tag** apps (React 18 UMD + Babel standalone). No build step required. Works with any self-hosted or cloud Svix instance.

---

## Features

- **Endpoints** — create, edit, disable, delete webhook endpoints; view delivery stats and attempts; manage signing secrets, custom headers, rate limits, channels
- **Event Catalog** — create and manage event types with dot-notation grouping; per-event-type custom retry schedules (aggressive / standard / relaxed / custom)
- **Message Logs** — browse messages with filters (event type, date range, tags, channels); inspect payloads (formatted / raw JSON); jump to message by ID
- **Activity Overview** — at-a-glance stats for endpoints, messages, success/failure rates; recent messages and delivery attempts
- **Health Alerts** — banner for auto-disabled endpoints and exhausted retries
- **API Docs** — interactive API reference page with copy-paste cURL examples pre-filled with the user's credentials
- **Developer Guide** — collapsible "How it works" explainer covering quick-start, retry policy, signature verification, channels, message recovery, and more
- **Dark / Light theme** — ships both palettes via CSS custom properties
- **Fully overridable CSS** — every variable and class can be replaced to match your dashboard

---

## Install

```bash
npm install @m3nfis/svix-react-ui-dashboard
```

Or reference the Git repo directly:

```bash
npm install git+https://github.com/m3nfis/svix-react-ui-dashboard.git
```

---

## Quick Start

### 1. Serve the `dist/` folder

Mount the installed package as a static route in your app server:

```js
// Express example
const path = require('path');

app.use(
  '/vendor/svix-ui',
  express.static(
    path.join(__dirname, 'node_modules', '@m3nfis', 'svix-react-ui-dashboard', 'dist')
  )
);
```

### 2. Load the default stylesheet

Add the CSS **before** your own stylesheet so your overrides take precedence:

```html
<link rel="stylesheet" href="/vendor/svix-ui/svix-ui.css" />
<link rel="stylesheet" href="/your-dashboard.css" />
```

### 3. Load the JSX scripts

Scripts must be loaded **in order**, after React 18 UMD + Babel standalone:

```html
<!-- React 18 + Babel (already in your app) -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<!-- Svix UI modules (order matters) -->
<script type="text/babel" src="/vendor/svix-ui/webhooks-core.jsx"></script>
<script type="text/babel" src="/vendor/svix-ui/webhooks-explainer.jsx"></script>
<script type="text/babel" src="/vendor/svix-ui/webhooks-banner.jsx"></script>
<script type="text/babel" src="/vendor/svix-ui/webhooks-docs.jsx"></script>
<script type="text/babel" src="/vendor/svix-ui/webhooks-activity.jsx"></script>
<script type="text/babel" src="/vendor/svix-ui/webhooks-events.jsx"></script>
<script type="text/babel" src="/vendor/svix-ui/webhooks-endpoints.jsx"></script>
<script type="text/babel" src="/vendor/svix-ui/webhooks.jsx"></script>
```

### 4. Render the component

```jsx
<WebhooksPage />
```

---

## Required Globals

The scripts expect a few globals to be available before they load:

| Global | Type | Purpose |
|--------|------|---------|
| `React` | object | React 18 (via UMD) |
| `ReactDOM` | object | ReactDOM 18 (via UMD) |
| `useState`, `useEffect`, `useCallback`, `useRef` | functions | Destructured from React — define them as `const { useState, useEffect, useCallback, useRef } = React;` |
| `api(url, opts?)` | function | Your authenticated fetch wrapper — must return parsed JSON. Used for health-alerts and webhook info endpoints. |

### Svix API Connection

The entry component (`WebhooksPage`) calls `api('/api/webhooks/info')` on mount and expects a response with:

```json
{
  "api_url": "https://your-svix-instance.com",
  "auth_token": "svix_sk_...",
  "app_uid": "app_xxx"
}
```

It stores these on `globalThis.__vibeySvixClient` so all sub-components can call the Svix API directly — no backend proxy required.

---

## Customising the Theme

### Override CSS variables

The stylesheet defines all colours as `--svix-*` custom properties. Override them in your own CSS:

```css
:root {
  --svix-accent:       #e11d48;
  --svix-accent-hover: #be123c;
  --svix-radius:       6px;
}
```

The full variable list:

| Variable | Default (dark) | Purpose |
|----------|---------------|---------|
| `--svix-bg` | `#0a0a0f` | Page background |
| `--svix-surface` | `#12121a` | Card / panel background |
| `--svix-surface-hover` | `#1a1a25` | Hover state for surfaces |
| `--svix-border` | `#2a2a3a` | Borders and dividers |
| `--svix-text` | `#e4e4ef` | Primary text colour |
| `--svix-text-dim` | `#8888a0` | Secondary / muted text |
| `--svix-accent` | `#7c5cfc` | Accent colour (buttons, links, active states) |
| `--svix-accent-hover` | `#9478ff` | Accent hover |
| `--svix-green` | `#34d399` | Success states |
| `--svix-yellow` | `#fbbf24` | Warning / pending states |
| `--svix-red` | `#f87171` | Error / danger states |
| `--svix-blue` | `#60a5fa` | Info / URL colour |
| `--svix-radius` | `10px` | Border radius |
| `--svix-modal-backdrop` | `rgba(0,0,0,0.6)` | Modal overlay |
| `--svix-shadow` | `0 1px 3px rgba(0,0,0,0.4)` | Box shadow |

### Override classes

If your app already defines `.btn-sm`, `.badge`, etc., they will naturally cascade. To avoid conflicts, wrap the webhook UI in a container with the `.svix-ui` class — the stylesheet scopes form-element resets to `.svix-ui`.

For deeper customisation, override any `wh-*` class in your stylesheet:

```css
.wh-api-card {
  border-radius: 8px;
  border: 2px solid #333;
}

.wh-tab.active {
  border-bottom-color: hotpink;
  color: hotpink;
}
```

### Skip the default CSS entirely

If your dashboard already provides all the required classes, don't load `svix-ui.css` at all. The JSX files only reference class names — they have no hard dependency on the shipped stylesheet.

---

## Components

All components are plain functions on the global scope (no ES module exports). Load them via `<script type="text/babel">` in order.

| File | Components | Depends on |
|------|-----------|------------|
| `webhooks-core.jsx` | `svix()`, `StatusBadge`, `ContextMenu`, `Modal`, `TimePresetModal`, `ReplayMessageModal`, `BulkReplayView` | — |
| `webhooks-explainer.jsx` | `WebhookExplainer` | core |
| `webhooks-banner.jsx` | `HealthAlertsBanner` | `api` global |
| `webhooks-docs.jsx` | `ApiDocsPage` | core |
| `webhooks-activity.jsx` | `LogsPanel`, `MessageDetail`, `ActivityPanel` | core |
| `webhooks-events.jsx` | `RetryScheduleEditor`, `EventCatalogPanel`, `AddEventTypeForm` | core |
| `webhooks-endpoints.jsx` | `EndpointsPanel`, `AddEndpointForm`, `EndpointDetail`, `EndpointTesting`, `EndpointAdvanced` | core, activity |
| `webhooks.jsx` | `WebhooksPage`, `ApiCredentials` | all above |

---

## API Contract

The `svix()` helper in `webhooks-core.jsx` talks directly to the Svix HTTP API. It reads credentials from `globalThis.__vibeySvixClient` (set by `WebhooksPage` on mount).

If `__vibeySvixClient` is not yet available (initial render), it falls back to calling `api('/api/webhooks/svix/...')` — a backend proxy you may optionally provide.

### Svix API paths used

| Method | Path | Used by |
|--------|------|---------|
| `GET` | `/api/v1/app/{uid}/endpoint/` | Endpoints list, Activity |
| `POST` | `/api/v1/app/{uid}/endpoint/` | Add endpoint |
| `GET` | `/api/v1/app/{uid}/endpoint/{id}/` | Endpoint detail |
| `PATCH` | `/api/v1/app/{uid}/endpoint/{id}/` | Edit endpoint |
| `DELETE` | `/api/v1/app/{uid}/endpoint/{id}/` | Delete endpoint |
| `GET` | `/api/v1/app/{uid}/endpoint/{id}/secret/` | Get signing secret |
| `POST` | `/api/v1/app/{uid}/endpoint/{id}/secret/rotate/` | Rotate secret |
| `POST` | `/api/v1/app/{uid}/endpoint/{id}/recover/` | Recover failed |
| `POST` | `/api/v1/app/{uid}/endpoint/{id}/replay-missing/` | Replay missing |
| `GET` | `/api/v1/app/{uid}/msg/` | Message logs |
| `GET` | `/api/v1/app/{uid}/msg/{id}/` | Message detail |
| `POST` | `/api/v1/app/{uid}/msg/` | Send test message |
| `GET` | `/api/v1/app/{uid}/attempt/endpoint/{id}/` | Attempts by endpoint |
| `GET` | `/api/v1/app/{uid}/attempt/msg/{id}/` | Attempts by message |
| `POST` | `/api/v1/app/{uid}/msg/{id}/endpoint/{eid}/resend/` | Resend single |
| `GET` | `/api/v1/event-type/` | Event catalog |
| `POST` | `/api/v1/event-type/` | Create event type |
| `PATCH` | `/api/v1/event-type/{name}/` | Update event type |
| `DELETE` | `/api/v1/event-type/{name}/` | Delete event type |
| `GET` | `/api/v1/event-type/{name}/retry-schedule/` | Get retry schedule |
| `PUT` | `/api/v1/event-type/{name}/retry-schedule/` | Set retry schedule |

---

## Project Structure

```
svix-react-ui-dashboard/
├── dist/
│   ├── svix-ui.css                # Default dark/light theme
│   ├── webhooks-core.jsx          # Shared primitives, API client, modals
│   ├── webhooks-explainer.jsx     # "How it works" developer guide
│   ├── webhooks-banner.jsx        # Health alerts banner
│   ├── webhooks-docs.jsx          # Interactive API reference page
│   ├── webhooks-activity.jsx      # Logs, message detail, activity overview
│   ├── webhooks-events.jsx        # Event catalog + retry schedule editor
│   ├── webhooks-endpoints.jsx     # Endpoints CRUD, detail, testing, advanced
│   └── webhooks.jsx               # Entry component (WebhooksPage)
├── .gitignore
├── LICENSE                        # MIT
├── package.json
└── README.md
```

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-change`)
3. Make your changes in `dist/`
4. Test by mounting in any React 18 UMD app
5. Commit and push (`git push origin feat/my-change`)
6. Open a pull request

---

## License

[MIT](LICENSE) — use it however you want.
