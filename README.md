# @m3nfis/svix-react-ui-dashboard

Drop-in React UI for managing [Svix](https://github.com/svix/svix-webhooks) webhooks — endpoints, event catalog, message logs, activity overview, and a full API reference page.

Works with any self-hosted or cloud Svix instance. No build step required.

```bash
npm install @m3nfis/svix-react-ui-dashboard
```

---

## Usage

```jsx
// app.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SvixWebhooksDashboard } from '@m3nfis/svix-react-ui-dashboard';
import '@m3nfis/svix-react-ui-dashboard/dist/svix-ui.css';

function App() {
  return (
    <SvixWebhooksDashboard config={{
      connection: {
        apiUrl: 'https://webhooks.your-domain.com',
        authToken: 'svix_sk_...',
        appUid: 'app_xxx',
      },
    }} />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

That's it — one component, full webhook management UI.

---

## Restricting Features Per Client

Every button, tab, and action can be toggled off. Only pass the overrides you need — everything defaults to `true`.

```jsx
// read-only-client.jsx — a client that can only view, not modify
import { SvixWebhooksDashboard } from '@m3nfis/svix-react-ui-dashboard';

function WebhookViewer({ apiUrl, authToken, appUid }) {
  return (
    <SvixWebhooksDashboard config={{
      connection: { apiUrl, authToken, appUid },
      tabs: {
        activity: false,               // hide Activity tab
      },
      ui: {
        title: 'My Webhooks',
        subtitle: 'Manage your integrations',
        showGuide: false,              // hide "How it works"
        showApiCredentials: false,     // hide API Credentials panel
        showApiDocs: false,            // hide API Docs button
      },
      endpoints: {
        create: false,                 // hide "+ Add Endpoint"
        delete: false,                 // hide delete from menus
        disable: false,                // hide enable/disable toggle
        rotateSecret: false,           // hide secret rotation
      },
      messages: {
        replay: false,                 // hide replay on attempts
        resend: false,                 // hide retry button
        recoverFailed: false,          // hide recover failed
        replayMissing: false,          // hide replay missing
        bulkReplay: false,             // hide bulk replay
      },
      eventTypes: {
        create: false,                 // hide "+ Add Event Type"
        delete: false,                 // hide delete on types
        editRetrySchedule: false,      // hide retry schedule editor
      },
    }} />
  );
}
```

---

## Full `config` Reference

Every property is **optional** — omitted values use the defaults shown below (all features enabled).

```js
{
  // ── Connection ────────────────────────────────────────
  connection: {
    apiUrl: null,               // Direct Svix API URL
    authToken: null,            // Direct auth token
    appUid: null,               // Direct app UID
    // If apiUrl/authToken/appUid are null, the component
    // fetches credentials from this endpoint via api():
    infoEndpoint: '/api/webhooks/info',
    healthAlertsEndpoint: '/api/webhooks/health-alerts',
  },

  // ── Tab visibility ────────────────────────────────────
  tabs: {
    endpoints: true,            // Endpoints tab
    eventCatalog: true,         // Event Catalog tab
    logs: true,                 // Message Logs tab
    activity: true,             // Activity Overview tab
  },

  // ── Header & chrome ───────────────────────────────────
  ui: {
    title: 'Webhooks',          // Page heading
    subtitle: 'Reliable webhook relay for your apps',
    svixLink: 'https://github.com/svix/svix-webhooks',
    showHeader: true,           // Entire top bar (title + buttons)
    showHealthAlerts: true,     // Endpoint health alert banner
    showGuide: true,            // "How it works" developer guide
    showApiCredentials: true,   // API Credentials expand panel
    showApiDocs: true,          // API Docs page button
  },

  // ── Endpoint permissions ──────────────────────────────
  endpoints: {
    create: true,               // "+ Add Endpoint" button
    edit: true,                 // Edit button on endpoint detail
    delete: true,               // Delete in context menus
    disable: true,              // Enable/Disable toggle
    rotateSecret: true,         // Rotate signing secret button
    customHeaders: true,        // Custom Headers section (Advanced)
    rateLimiting: true,         // Rate Limiting section (Advanced)
    channels: true,             // Channels section (Advanced)
    testWebhook: true,          // Testing tab on endpoint detail
  },

  // ── Message / attempt permissions ─────────────────────
  messages: {
    viewPayload: true,          // Message payload inspection
    replay: true,               // Replay action on individual attempts
    resend: true,               // Retry/Resend button on attempts
    recoverFailed: true,        // "Recover Failed" time-preset modal
    replayMissing: true,        // "Replay Missing" time-preset modal
    bulkReplay: true,           // Bulk Replay view with filters
  },

  // ── Event type permissions ────────────────────────────
  eventTypes: {
    create: true,               // "+ Add Event Type" button
    edit: true,                 // Edit description button
    delete: true,               // Delete button
    editRetrySchedule: true,    // Retry schedule editor per event type
  },
}
```

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

## Script-Tag Setup (no bundler)

If your app uses React via UMD script tags instead of a bundler, load the modules directly:

### 1. Serve the `dist/` folder

Mount the installed package as a static route in your app server:

```js
const path = require('path');

app.use(
  '/vendor/svix-ui',
  express.static(
    path.join(__dirname, 'node_modules', '@m3nfis', 'svix-react-ui-dashboard', 'dist')
  )
);
```

### 2. Load CSS and scripts

```html
<!-- Stylesheet (before your own CSS so overrides win) -->
<link rel="stylesheet" href="/vendor/svix-ui/svix-ui.css" />
<link rel="stylesheet" href="/your-dashboard.css" />

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

### 3. Render

```jsx
<SvixWebhooksDashboard config={{
  connection: {
    apiUrl: 'https://webhooks.your-domain.com',
    authToken: 'svix_sk_...',
    appUid: 'app_xxx',
  },
}} />
```

### Required globals (script-tag mode only)

| Global | Type | Purpose |
|--------|------|---------|
| `React` | object | React 18 (via UMD) |
| `ReactDOM` | object | ReactDOM 18 (via UMD) |
| `useState`, `useEffect`, `useCallback`, `useRef` | functions | Destructured from React |
| `api(url, opts?)` | function | Your authenticated fetch wrapper (returns parsed JSON). Only needed if not passing `connection.apiUrl/authToken/appUid` directly. |

---

## Svix API Connection

The component connects to Svix in one of two ways:

**Option A — Direct credentials** (recommended): pass `apiUrl`, `authToken`, and `appUid` in `config.connection`. The component calls the Svix API directly from the browser.

**Option B — Info endpoint**: if credentials are omitted, the component calls `api(config.connection.infoEndpoint)` on mount and expects:

```json
{
  "api_url": "https://your-svix-instance.com",
  "auth_token": "svix_sk_...",
  "app_uid": "app_xxx"
}
```

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
| `webhooks.jsx` | **`SvixWebhooksDashboard`**, `WebhooksPage`, `ApiCredentials` | all above |

---

## API Contract

The `svix()` helper in `webhooks-core.jsx` talks directly to the Svix HTTP API. It reads credentials from `globalThis.__vibeySvixClient` (set by `SvixWebhooksDashboard` on mount).

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

## Test Harness

The `test-harness/` directory contains a self-contained Express app that serves the `dist/` components with live Svix API credentials. This is what the Playwright tests run against.

### Setup

```bash
cd test-harness
cp .env.example .env      # fill in your Svix credentials
npm install
npm start                  # → http://localhost:3333
```

### `.env` variables

| Variable | Description |
|----------|-------------|
| `SVIX_API_URL` | Your Svix instance URL (e.g. `https://api.svix.com`) |
| `SVIX_AUTH_TOKEN` | Svix auth token or JWT |
| `SVIX_APP_UID` | Application UID to scope the dashboard to |

The server injects these into the HTML at serve time — no credentials are committed to the repo.

---

## Running Tests

The test suite uses [Playwright](https://playwright.dev/) with mocked API responses (no live Svix instance needed to run tests).

```bash
npm test                   # runs all 60 tests
npm run test:report        # runs tests + generates test-results/REPORT.md
```

Playwright auto-starts the test harness on port 3333 via the `webServer` config, so you don't need to start it manually. You do still need a `.env` file in `test-harness/` (the server validates it on boot).

Test coverage:
- **100%** of Svix API call patterns (21 unique endpoints)
- **>90%** of UI components and interactions

---

## Project Structure

```
svix-react-ui-dashboard/
├── dist/
│   ├── svix-ui.css                # Default dark/light theme
│   ├── webhooks-core.jsx          # Config context, API client, shared modals
│   ├── webhooks-explainer.jsx     # "How it works" developer guide
│   ├── webhooks-banner.jsx        # Health alerts banner
│   ├── webhooks-docs.jsx          # Interactive API reference page
│   ├── webhooks-activity.jsx      # Logs, message detail, activity overview
│   ├── webhooks-events.jsx        # Event catalog + retry schedule editor
│   ├── webhooks-endpoints.jsx     # Endpoints CRUD, detail, testing, advanced
│   └── webhooks.jsx               # SvixWebhooksDashboard HOC + WebhooksPage
├── test-harness/
│   ├── public/index.html          # Test page (credentials injected by server)
│   ├── server.js                  # Express server serving dist/ + injecting .env
│   ├── .env.example               # Template for your Svix credentials
│   └── package.json
├── tests/
│   ├── fixtures/
│   │   ├── api-interceptor.js     # Playwright route interceptor (mocks all API calls)
│   │   └── mock-data.js           # Deterministic mock Svix API responses
│   ├── activity.spec.js
│   ├── api-docs.spec.js
│   ├── endpoint-detail.spec.js
│   ├── endpoints.spec.js
│   ├── event-catalog.spec.js
│   ├── hoc-ui.spec.js
│   ├── logs.spec.js
│   └── generate-report.js         # Markdown report generator
├── playwright.config.js
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
4. Set up the test harness (`cd test-harness && cp .env.example .env && npm install`)
5. Run `npm test` from the project root to verify
6. Commit and push (`git push origin feat/my-change`)
7. Open a pull request

---

## License

[MIT](LICENSE) — use it however you want.
