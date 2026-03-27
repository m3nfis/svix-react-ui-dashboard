# @m3nfis/svix-react-ui-dashboard

Browser JSX modules for a Svix-style webhooks dashboard, meant for **script-tag** apps (React 18 UMD + Babel standalone).

## Install

```bash
npm install @m3nfis/svix-react-ui-dashboard
```

## Usage

Serve the `dist/` folder over HTTP (or use your app’s static mount), then load scripts **in order** after your host app defines globals such as `api`, React, and hooks:

```html
<script type="text/babel" src="/vendor/svix-react-ui-dashboard/webhooks-core.jsx"></script>
<script type="text/babel" src="/vendor/svix-react-ui-dashboard/webhooks-explainer.jsx"></script>
<script type="text/babel" src="/vendor/svix-react-ui-dashboard/webhooks-banner.jsx"></script>
<script type="text/babel" src="/vendor/svix-react-ui-dashboard/webhooks-docs.jsx"></script>
<script type="text/babel" src="/vendor/svix-react-ui-dashboard/webhooks-activity.jsx"></script>
<script type="text/babel" src="/vendor/svix-react-ui-dashboard/webhooks-events.jsx"></script>
<script type="text/babel" src="/vendor/svix-react-ui-dashboard/webhooks-endpoints.jsx"></script>
<script type="text/babel" src="/vendor/svix-react-ui-dashboard/webhooks.jsx"></script>
```

Provide matching CSS (e.g. `wh-*` classes) and an `api()` helper that mirrors your backend auth and routes.
