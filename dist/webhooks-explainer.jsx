// ── Webhooks: developer explainer (How it works) ─────────────────────────
// Depends: webhooks-core.jsx (DEFAULT_RETRY_SCHEDULE, formatRetryInterval)

function WebhookExplainer({ info }) {
  const stepStyle = {
    flex:1, textAlign:'center', padding:'16px 12px',
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:12, position:'relative',
  };
  const numStyle = {
    width:28, height:28, borderRadius:'50%', background:'var(--accent)',
    color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center',
    fontSize:13, fontWeight:700, marginBottom:8,
  };
  const numStyleSm = { ...numStyle, fontSize:11, width:24, height:24, flexShrink:0, marginBottom:0 };
  const arrowStyle = {
    display:'flex', alignItems:'center', justifyContent:'center',
    color:'var(--accent)', fontSize:20, fontWeight:700, flexShrink:0, padding:'0 4px',
  };
  const codeInline = { fontSize:11, background:'var(--surface)', padding:'2px 6px', borderRadius:4 };
  const preStyle = {
    background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:12, fontSize:11,
    fontFamily:'SF Mono,Menlo,Consolas,monospace', color:'var(--text-dim)', whiteSpace:'pre-wrap', wordBreak:'break-all',
  };
  const sectionHead = {
    marginBottom:8, fontWeight:600, color:'var(--text)', fontSize:11,
    textTransform:'uppercase', letterSpacing:'0.5px',
  };
  const summaryStyle = { cursor:'pointer', fontSize:12, color:'var(--accent)', fontWeight:600 };
  const sectionBody = { marginTop:12, fontSize:12, color:'var(--text-dim)', lineHeight:1.7 };
  const stepRow = { display:'flex', gap:12, alignItems:'flex-start' };
  const token = info ? info.auth_token.slice(0,20) + '...' : '<YOUR_TOKEN>';
  const baseUrl = info ? `${info.api_url}/api/v1` : 'https://webhooks.vibey.cloud/api/v1';
  const appUid = info ? info.app_uid : '<APP_UID>';

  return (
    <div className="wh-api-card" style={{marginBottom:16,flexShrink:0}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
        <h4>How it works</h4>
        <span style={{fontSize:10,color:'var(--text-dim)',padding:'2px 8px',borderRadius:4,border:'1px solid var(--border)'}}>Developer Guide</span>
      </div>
      <p style={{fontSize:13,color:'var(--text-dim)',marginBottom:16,lineHeight:1.5}}>
        The webhook service acts as a reliable relay between your app and your clients.
        Instead of delivering webhooks directly from your machine, you push events here
        and vibey handles delivery, retries, and signing — from a stable, always-on domain.
      </p>

      <div style={{display:'flex',alignItems:'stretch',gap:0,marginBottom:16}}>
        <div style={stepStyle}>
          <div style={numStyle}>1</div>
          <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Your App</div>
          <div style={{fontSize:11,color:'var(--text-dim)',lineHeight:1.4}}>
            Running locally or behind a vibey tunnel, your app pushes events via a single API call
          </div>
        </div>
        <div style={arrowStyle}>→</div>
        <div style={stepStyle}>
          <div style={numStyle}>2</div>
          <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>webhooks.vibey.cloud</div>
          <div style={{fontSize:11,color:'var(--text-dim)',lineHeight:1.4}}>
            Receives the event, signs the payload, and delivers it to all subscribed endpoints with automatic retries
          </div>
        </div>
        <div style={arrowStyle}>→</div>
        <div style={stepStyle}>
          <div style={numStyle}>3</div>
          <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Your Clients</div>
          <div style={{fontSize:11,color:'var(--text-dim)',lineHeight:1.4}}>
            Receive webhooks at their endpoint URLs from a stable domain — even if your machine goes offline
          </div>
        </div>
      </div>

      {/* ── Quick Start ─────────────────────────── */}
      <details>
        <summary style={summaryStyle}>Quick start — send your first webhook</summary>
        <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:12}}>
          <div style={stepRow}>
            <span style={numStyleSm}>1</span>
            <div style={{fontSize:12,color:'var(--text-dim)'}}>
              <strong style={{color:'var(--text)'}}>Add an endpoint</strong> — Go to the <em>Endpoints</em> tab and add your client's webhook URL (e.g. <code>https://their-server.com/webhook</code>)
            </div>
          </div>
          <div style={stepRow}>
            <span style={numStyleSm}>2</span>
            <div style={{fontSize:12,color:'var(--text-dim)'}}>
              <strong style={{color:'var(--text)'}}>Define event types</strong> — Go to <em>Event Catalog</em> and create types like <code>order.created</code> or <code>payment.completed</code>
            </div>
          </div>
          <div style={stepRow}>
            <span style={numStyleSm}>3</span>
            <div style={{fontSize:12,color:'var(--text-dim)'}}>
              <strong style={{color:'var(--text)'}}>Push events from your app</strong> — When something happens in your app, fire a POST:
            </div>
          </div>
          <pre style={{...preStyle,marginLeft:36}}>
{`curl -X POST ${baseUrl}/app/${appUid}/msg/ \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"eventType":"order.created","payload":{"orderId":"abc-123","amount":99.99}}'`}
          </pre>
          <div style={stepRow}>
            <span style={numStyleSm}>4</span>
            <div style={{fontSize:12,color:'var(--text-dim)'}}>
              <strong style={{color:'var(--text)'}}>Monitor delivery</strong> — Check the <em>Logs</em> and <em>Activity</em> tabs to see delivery status, retry attempts, and inspect payloads
            </div>
          </div>
        </div>
      </details>

      {/* ── API Authentication ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>API authentication & sending messages</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:12}}>
            All API calls require a <strong style={{color:'var(--text)'}}>Bearer token</strong> in the Authorization header.
            Your credentials are available via the <em>API Credentials</em> button above.
          </p>
          <p style={sectionHead}>Base URL</p>
          <pre style={{...preStyle,marginBottom:12}}>{baseUrl}</pre>
          <p style={sectionHead}>Send a message (webhook event)</p>
          <pre style={{...preStyle,marginBottom:12}}>
{`POST /app/${appUid}/msg/
Authorization: Bearer ${token}
Content-Type: application/json

{
  "eventType": "user.created",
  "payload": {
"userId": "usr_abc123",
"email": "alice@example.com",
"plan": "pro"
  },
  "channels": ["tenant_42"]     // optional: route to specific endpoints
}`}
          </pre>
          <p style={{marginBottom:8}}>
            The <code style={codeInline}>eventType</code> determines which endpoints receive the message (only those subscribed to this type).
            The <code style={codeInline}>payload</code> is the JSON body delivered to each endpoint. 
            Optionally, <code style={codeInline}>channels</code> further scopes delivery to endpoints listening on those channels.
          </p>
          <p style={sectionHead}>List endpoints</p>
          <pre style={{...preStyle,marginBottom:12}}>
{`GET /app/${appUid}/endpoint/
Authorization: Bearer ${token}`}
          </pre>
          <p style={sectionHead}>Create an endpoint</p>
          <pre style={{...preStyle,marginBottom:12}}>
{`POST /app/${appUid}/endpoint/
Authorization: Bearer ${token}
Content-Type: application/json

{
  "url": "https://client.example.com/webhook",
  "description": "Acme Corp production",
  "filterTypes": ["order.created", "order.updated"],
  "channels": ["tenant_42"],
  "rateLimit": 100
}`}
          </pre>
          <p style={{marginBottom:0}}>
            All fields except <code style={codeInline}>url</code> are optional.
            Use <code style={codeInline}>filterTypes</code> to restrict which event types this endpoint receives.
            Use <code style={codeInline}>channels</code> to scope to specific message channels.
            Use <code style={codeInline}>rateLimit</code> to cap deliveries per second.
          </p>
        </div>
      </details>

      {/* ── Endpoints ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>Endpoints — configuration & management</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:12}}>
            An <strong style={{color:'var(--text)'}}>endpoint</strong> is a URL where webhooks are delivered.
            Each of your clients registers one or more endpoints. You can configure per-endpoint settings:
          </p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
            {[
              ['Event Type Filtering', 'Only receive specific event types (e.g. order.* events). Configured when creating or editing an endpoint.'],
              ['Channels', 'Route messages to specific endpoints by channel tag. Useful for multi-tenant setups where each tenant has their own endpoint.'],
              ['Rate Limiting', 'Cap the number of deliveries per second to avoid overwhelming the client\'s server.'],
              ['Custom Headers', 'Add headers like API keys or Basic Auth credentials, sent with every delivery to that endpoint.'],
            ].map(([title, desc]) => (
              <div key={title} style={{padding:'10px 12px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text)',marginBottom:4}}>{title}</div>
                <div style={{fontSize:11,color:'var(--text-dim)',lineHeight:1.4}}>{desc}</div>
              </div>
            ))}
          </div>
          <p style={sectionHead}>Endpoint lifecycle</p>
          <p style={{marginBottom:8}}>
            Endpoints start as <strong style={{color:'var(--green)'}}>Active</strong>.
            {' '}You can manually disable/enable them from the endpoint detail view.
            {' '}If an endpoint fails continuously for <strong style={{color:'var(--text)'}}>5 consecutive days</strong>, it is
            {' '}<strong style={{color:'var(--red)'}}>automatically disabled</strong> to prevent wasting resources.
            {' '}Re-enable it from the endpoint menu and use <em>Recover Failed</em> to retry missed messages.
          </p>
          <p style={sectionHead}>Update an endpoint</p>
          <pre style={preStyle}>
{`PATCH /app/${appUid}/endpoint/{ENDPOINT_ID}/
Authorization: Bearer ${token}
Content-Type: application/json

{
  "url": "https://new-url.example.com/webhook",
  "description": "Updated description",
  "filterTypes": ["order.created"],
  "rateLimit": 50,
  "disabled": false
}`}
          </pre>
        </div>
      </details>

      {/* ── Event Types ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>Event types — organizing your webhook events</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:12}}>
            Event types categorize your webhook messages. Use dot-notation to group them
            (e.g. <code style={codeInline}>order.created</code>, <code style={codeInline}>order.updated</code>, <code style={codeInline}>payment.failed</code>).
            Define them in the <em>Event Catalog</em> tab before sending messages.
          </p>
          <p style={sectionHead}>How the Event Catalog works behind the scenes</p>
          <p style={{marginBottom:8}}>
            Under the hood, all event types live in a <strong style={{color:'var(--text)'}}>shared global registry</strong> powered by <a href="https://www.svix.com" target="_blank" rel="noopener" style={{color:'var(--accent)'}}>Svix</a>.
            {' '}When you create an event type, it is tagged with your app identity so the system knows who owns it.
          </p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
            {[
              ['Mine (default)', 'Shows only event types you created. Each type is tagged with your app UID, so your catalog stays clean and relevant to your project.'],
              ['All', 'Shows every event type across all users. Useful for discovering existing types or reusing a shared schema — any user can subscribe their endpoints to any event type.'],
            ].map(([title, desc]) => (
              <div key={title} style={{padding:'10px 12px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--accent)',marginBottom:4}}>{title}</div>
                <div style={{fontSize:11,color:'var(--text-dim)',lineHeight:1.4}}>{desc}</div>
              </div>
            ))}
          </div>
          <p style={{marginBottom:12,fontSize:12,color:'var(--text-dim)',lineHeight:1.5}}>
            <strong style={{color:'var(--text)'}}>Why shared?</strong> Event types define the <em>schema</em> of events your system can emit — they're not secrets.
            {' '}Sharing them means multiple apps can interoperate on the same event vocabulary without duplicating definitions.
            {' '}Your <em>endpoints</em>, <em>messages</em>, and <em>delivery logs</em> remain completely private to your app.
          </p>
          <p style={sectionHead}>Create an event type</p>
          <pre style={{...preStyle,marginBottom:12}}>
{`POST /event-type/
Authorization: Bearer ${token}
Content-Type: application/json

{
  "name": "order.created",
  "description": "Fired when a new order is placed"
}`}
          </pre>
          <p style={{marginBottom:8}}>
            Endpoints can subscribe to specific event types via <code style={codeInline}>filterTypes</code>.
            {' '}If an endpoint has no filter, it receives <strong style={{color:'var(--text)'}}>all</strong> event types.
          </p>
          <p style={{marginBottom:0}}>
            Each event type can also have a <strong style={{color:'var(--text)'}}>custom retry schedule</strong> — see the Retry Policy section below.
          </p>
        </div>
      </details>

      {/* ── Retry Policy ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>Retry policy — automatic retries & error handling</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:12}}>
            When a webhook delivery fails (non-2xx response or no response within <strong style={{color:'var(--text)'}}>15 seconds</strong>),
            the message is automatically retried with <strong style={{color:'var(--text)'}}>exponential backoff</strong>.
            Any HTTP status outside 200–299, including 3xx redirects, counts as a failure.
          </p>
          <p style={sectionHead}>Default retry schedule</p>
          <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap',margin:'4px 0 12px'}}>
            {DEFAULT_RETRY_SCHEDULE.map((s, i) => (
              React.createElement(React.Fragment, {key: i},
                i > 0 && React.createElement('span', {style:{color:'var(--text-dim)',fontSize:10}}, '→'),
                React.createElement('span', {style:{fontSize:11,padding:'3px 8px',borderRadius:6,background:'rgba(124,92,252,0.12)',color:'var(--accent)',fontWeight:600,fontFamily:'monospace'}}, formatRetryInterval(s))
              )
            ))}
          </div>
          <p style={{marginBottom:12}}>
            That's <strong style={{color:'var(--text)'}}>7 retry attempts</strong> over approximately <strong style={{color:'var(--text)'}}>27 hours</strong>.
            After all retries are exhausted, the message is marked as <strong style={{color:'var(--red)'}}>Failed</strong>.
          </p>
          <p style={sectionHead}>Per-event-type retry schedules</p>
          <p style={{marginBottom:8}}>
            You can override the default schedule for specific event types in the <em>Event Catalog</em> tab.
            Each event type card has a <em>Retry Schedule</em> editor with preset options:
          </p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
            {[
              ['Aggressive', '2s → 10s → 30s → 2m → 5m', '5 retries, ~8 minutes total. For time-sensitive events.'],
              ['Standard', '5s → 5m → 30m → 2h → 5h → 10h → 10h', '7 retries, ~27 hours. The default schedule.'],
              ['Relaxed', '1m → 10m → 1h → 4h → 12h → 24h', '6 retries, ~41 hours. For non-urgent events.'],
            ].map(([name, schedule, desc]) => (
              <div key={name} style={{padding:'10px 12px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--accent)',marginBottom:4}}>{name}</div>
                <div style={{fontSize:10,fontFamily:'monospace',color:'var(--text-dim)',marginBottom:6,lineHeight:1.4}}>{schedule}</div>
                <div style={{fontSize:11,color:'var(--text-dim)',lineHeight:1.3}}>{desc}</div>
              </div>
            ))}
          </div>
          <p style={{marginBottom:8}}>
            You can also define a fully custom schedule by entering comma-separated intervals in seconds.
            For example, <code style={codeInline}>10, 60, 600, 3600</code> retries at 10s, 1m, 10m, and 1h.
          </p>
          <p style={sectionHead}>Via API</p>
          <pre style={{...preStyle,marginBottom:12}}>
{`# Set a custom retry schedule for an event type
PUT /event-type/order.created/retry-schedule/
Authorization: Bearer ${token}
Content-Type: application/json

{"retrySchedule": [10, 60, 600, 3600]}

# Reset to the default schedule
PUT /event-type/order.created/retry-schedule/
{"retrySchedule": null}`}
          </pre>
          <p style={sectionHead}>Endpoint auto-disable</p>
          <p style={{marginBottom:0}}>
            If an endpoint fails <strong style={{color:'var(--text)'}}>every delivery</strong> for <strong style={{color:'var(--text)'}}>5 consecutive days</strong>,
            it is automatically disabled to prevent wasting resources. You'll see it marked as <span style={{color:'var(--red)',fontWeight:600}}>Disabled</span> in
            the endpoint list. Re-enable it manually and use <em>Recover Failed</em> to retry all missed messages.
          </p>
        </div>
      </details>

      {/* ── Endpoint Health Monitoring ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>Endpoint health monitoring — dead endpoint alerts</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:12}}>
            Apps that push webhook events to this service have no way of knowing whether an endpoint is actually reachable.
            vibey monitors endpoint health automatically and alerts you when something is wrong.
          </p>
          <p style={sectionHead}>How it works</p>
          <div style={{display:'flex',gap:12,marginBottom:16}}>
            <div style={{flex:1,padding:'12px 14px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--yellow)',marginBottom:6}}>All retries exhausted</div>
              <div style={{fontSize:11,color:'var(--text-dim)',lineHeight:1.4}}>
                When every retry attempt for a single message fails (7 attempts over ~27 hours by default),
                the message is marked as <strong style={{color:'var(--text)'}}>Failed</strong> and an alert appears in your dashboard.
                The sending app is never notified — you are.
              </div>
            </div>
            <div style={{flex:1,padding:'12px 14px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--red)',marginBottom:6}}>Endpoint auto-disabled</div>
              <div style={{fontSize:11,color:'var(--text-dim)',lineHeight:1.4}}>
                If an endpoint fails <strong style={{color:'var(--text)'}}>every delivery</strong> for <strong style={{color:'var(--text)'}}>5 consecutive days</strong>,
                it is automatically disabled. A critical alert appears in your dashboard. No further messages are delivered
                until you re-enable it.
              </div>
            </div>
          </div>
          <p style={sectionHead}>What you see</p>
          <p style={{marginBottom:12}}>
            When an alert fires, a <strong style={{color:'var(--red)'}}>red banner</strong> appears at the top of the Webhooks page showing
            the affected endpoint URL, alert type, and timestamp. You can expand the banner to see all active alerts,
            dismiss them individually, or dismiss all at once. Alerts are also logged and available via the API.
          </p>
          <p style={sectionHead}>What the sending app should do</p>
          <p style={{marginBottom:12}}>
            If your app pushes events to this service and needs to know whether endpoints are healthy, you can
            poll the health alerts API:
          </p>
          <pre style={{...preStyle,marginBottom:12}}>
{`GET /api/webhooks/health-alerts
Authorization: Bearer <your_token>

# Response:
{
  "alerts": [
{
  "alert_type": "endpoint.disabled",
  "endpoint_url": "https://dead-server.example.com/webhook",
  "created_at": "2026-03-18T12:00:00Z",
  "acknowledged": false
}
  ],
  "unacknowledged": 1
}`}
          </pre>
          <p style={sectionHead}>After an alert</p>
          <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'6px 12px',fontSize:12}}>
            <span style={{fontWeight:600,color:'var(--text)'}}>1.</span>
            <span>Check if the endpoint URL is still valid and reachable</span>
            <span style={{fontWeight:600,color:'var(--text)'}}>2.</span>
            <span>Fix the issue on the receiving end (server down, DNS, firewall, etc.)</span>
            <span style={{fontWeight:600,color:'var(--text)'}}>3.</span>
            <span>Re-enable the endpoint if it was auto-disabled</span>
            <span style={{fontWeight:600,color:'var(--text)'}}>4.</span>
            <span>Use <em>Recover Failed</em> or <em>Bulk Replay</em> to retry all missed messages</span>
          </div>
        </div>
      </details>

      {/* ── Signature Verification ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>Signature verification — securing your webhooks</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:12}}>
            Every webhook delivery includes three headers that your clients should use to verify the message is authentic
            and hasn't been tampered with:
          </p>
          <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'6px 12px',marginBottom:12,fontSize:12}}>
            <code style={{...codeInline,fontWeight:600}}>svix-id</code>
            <span>Unique message identifier (for deduplication)</span>
            <code style={{...codeInline,fontWeight:600}}>svix-timestamp</code>
            <span>Unix timestamp of when the message was sent</span>
            <code style={{...codeInline,fontWeight:600}}>svix-signature</code>
            <span>HMAC-SHA256 signature of the payload</span>
          </div>
          <p style={{marginBottom:8}}>
            The <strong style={{color:'var(--text)'}}>signing secret</strong> for each endpoint is shown on the endpoint detail page (click <em>Show</em> under Signing Secret).
            It starts with <code style={codeInline}>whsec_</code>. Clients use this secret to verify signatures.
          </p>
          <p style={sectionHead}>Verification in Node.js</p>
          <pre style={{...preStyle,marginBottom:12}}>
{`import { Webhook } from "svix";

const wh = new Webhook("whsec_YOUR_SIGNING_SECRET");

// Express/Fastify handler
app.post("/webhook", (req, res) => {
  try {
const payload = wh.verify(req.body, {
  "svix-id": req.headers["svix-id"],
  "svix-timestamp": req.headers["svix-timestamp"],
  "svix-signature": req.headers["svix-signature"],
});
// payload is verified — process the event
console.log("Received:", payload.eventType, payload.payload);
res.status(200).json({ ok: true });
  } catch (err) {
res.status(400).json({ error: "Invalid signature" });
  }
});`}
          </pre>
          <p style={sectionHead}>Verification in Python</p>
          <pre style={{...preStyle,marginBottom:12}}>
{`from svix.webhooks import Webhook

wh = Webhook("whsec_YOUR_SIGNING_SECRET")

# Flask / FastAPI handler
payload = wh.verify(request_body, {
"svix-id": headers["svix-id"],
"svix-timestamp": headers["svix-timestamp"],
"svix-signature": headers["svix-signature"],
})`}
          </pre>
          <p style={sectionHead}>Manual verification (any language)</p>
          <pre style={preStyle}>
{`# The signature is computed as:
# 1. Concatenate: "{svix-id}.{svix-timestamp}.{body}"
# 2. HMAC-SHA256 with the base64-decoded secret (strip "whsec_" prefix)
# 3. Base64-encode the result
# 4. Compare with the "v1,{signature}" value in svix-signature header

signature_input = svix_id + "." + svix_timestamp + "." + raw_body
expected = base64(hmac_sha256(base64_decode(secret), signature_input))
# svix-signature header contains: "v1,{expected}"`}
          </pre>
          <p style={{marginTop:8,marginBottom:0}}>
            Svix provides official verification libraries for
            {' '}<strong style={{color:'var(--text)'}}>Node.js, Python, Go, Java, Ruby, Kotlin, C#, PHP, and Rust</strong>.
            {' '}Install via <code style={codeInline}>npm install svix</code>, <code style={codeInline}>pip install svix</code>, etc.
          </p>
        </div>
      </details>

      {/* ── Channels ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>Channels — multi-tenant message routing</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:12}}>
            Channels let you route messages to specific endpoints without creating separate applications.
            This is ideal for <strong style={{color:'var(--text)'}}>multi-tenant</strong> setups where different clients
            should only receive their own events.
          </p>
          <p style={sectionHead}>How channels work</p>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
            <div style={stepRow}>
              <span style={numStyleSm}>1</span>
              <div style={{fontSize:12,color:'var(--text-dim)'}}>
                <strong style={{color:'var(--text)'}}>Tag endpoints</strong> — Assign channel names to an endpoint (e.g. <code style={codeInline}>tenant_acme</code>).
                Do this in the endpoint's <em>Advanced</em> tab or via the API.
              </div>
            </div>
            <div style={stepRow}>
              <span style={numStyleSm}>2</span>
              <div style={{fontSize:12,color:'var(--text-dim)'}}>
                <strong style={{color:'var(--text)'}}>Tag messages</strong> — When sending a message, include <code style={codeInline}>channels: ["tenant_acme"]</code> in the body.
              </div>
            </div>
            <div style={stepRow}>
              <span style={numStyleSm}>3</span>
              <div style={{fontSize:12,color:'var(--text-dim)'}}>
                <strong style={{color:'var(--text)'}}>Selective delivery</strong> — Only endpoints with a matching channel receive the message.
                Endpoints with no channels receive <em>all</em> messages.
              </div>
            </div>
          </div>
          <pre style={preStyle}>
{`# Send a message to only "tenant_acme" endpoints
POST /app/${appUid}/msg/
{
  "eventType": "invoice.paid",
  "payload": {"invoiceId": "INV-001", "amount": 250},
  "channels": ["tenant_acme"]
}`}
          </pre>
        </div>
      </details>

      {/* ── Custom Headers & Auth ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>Custom headers & authentication per endpoint</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:8}}>
            Clients that validate inbound webhooks via an <strong style={{color:'var(--text)'}}>API key header</strong> or
            {' '}<strong style={{color:'var(--text)'}}>HTTP Basic Auth</strong> can be supported by setting custom outbound headers on each endpoint.
            Headers are configured per endpoint — each client gets their own credentials.
          </p>
          <p style={sectionHead}>Set custom headers on an endpoint</p>
          <pre style={{...preStyle,marginBottom:12}}>
{`PUT /app/${appUid}/endpoint/{ENDPOINT_ID}/headers/
Authorization: Bearer ${token}
Content-Type: application/json

{
  "headers": {
"ApiKey": "client-security-token",
"Authorization": "Basic dXNlcm5hbWU6cGFzc3dvcmQ="
  }
}`}
          </pre>
          <p style={sectionHead}>Alternative — Basic Auth via URL</p>
          <p style={{marginBottom:8}}>
            You can also embed Basic Auth credentials directly in the endpoint URL.
            The service will automatically send the <code style={codeInline}>Authorization: Basic ...</code> header:
          </p>
          <pre style={{...preStyle,marginBottom:12}}>
{`https://USERNAME:PASSWORD@their-server.com/webhook`}
          </pre>
          <p style={{marginBottom:0}}>
            Both <code style={codeInline}>ApiKey</code> and <code style={codeInline}>Authorization</code> headers
            can be set simultaneously — they are additive. All endpoints also receive the standard
            {' '}<code style={codeInline}>svix-id</code>, <code style={codeInline}>svix-timestamp</code>, and
            {' '}<code style={codeInline}>svix-signature</code> HMAC headers for signature verification.
          </p>
        </div>
      </details>

      {/* ── Message Recovery ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>Message recovery — retrying failed & missing messages</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:12}}>
            If messages fail or an endpoint was temporarily down, you have three recovery options
            available from the endpoint detail view's context menu (⋮):
          </p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
            {[
              ['Recover Failed', 'Retries all messages that exhausted their retry schedule and were marked as Failed. Specify a start date — all failures since that date are re-queued.', `POST /app/${appUid}/endpoint/{ID}/recover/\n{"since": "2026-03-01T00:00:00Z"}`],
              ['Replay Missing', 'Re-delivers messages that were never attempted to this endpoint (e.g. the endpoint was added after messages were sent). Optionally filter by event type.', `POST /app/${appUid}/endpoint/{ID}/replay-missing/\n{"since": "2026-03-01T00:00:00Z"}`],
              ['Resend Single', 'Manually retry a specific message to a specific endpoint. Available from the message attempt detail or the endpoint\'s attempt list.', `POST /app/${appUid}/msg/{MSG_ID}/\nendpoint/{ENDPOINT_ID}/resend/`],
            ].map(([title, desc, api]) => (
              <div key={title} style={{padding:'10px 12px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--text)',marginBottom:4}}>{title}</div>
                <div style={{fontSize:11,color:'var(--text-dim)',lineHeight:1.4,marginBottom:8}}>{desc}</div>
                <pre style={{...preStyle,fontSize:10,padding:8,margin:0}}>{api}</pre>
              </div>
            ))}
          </div>
          <p style={{marginBottom:0}}>
            All recovery operations are idempotent — running them multiple times won't cause duplicate deliveries
            (messages are deduplicated by <code style={codeInline}>svix-id</code>).
          </p>
        </div>
      </details>

      {/* ── Rate Limiting ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>Rate limiting — protecting your clients</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:12}}>
            Per-endpoint rate limiting caps the number of webhook deliveries per second. This prevents
            overwhelming a client's server during high-volume periods. Configure it in the endpoint's <em>Advanced</em> tab or via the API.
          </p>
          <pre style={{...preStyle,marginBottom:12}}>
{`PATCH /app/${appUid}/endpoint/{ENDPOINT_ID}/
Authorization: Bearer ${token}
Content-Type: application/json

{"rateLimit": 100}     // 100 deliveries/second max
{"rateLimit": null}    // remove the limit`}
          </pre>
          <p style={{marginBottom:0}}>
            When the rate limit is hit, messages are queued and delivered as capacity becomes available — no messages are dropped.
          </p>
        </div>
      </details>

      {/* ── SOAP XML Example ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>Example — SOAP XML payload delivery</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:8}}>
            For clients that consume <strong style={{color:'var(--text)'}}>SOAP XML</strong> instead of JSON, you can send a pre-formed
            XML payload through the webhook service. The service forwards it as-is with the correct content type — no conversion needed.
          </p>
          <p style={sectionHead}>Push a SOAP XML event</p>
          <pre style={{...preStyle,marginBottom:12}}>
{`POST /app/${appUid}/msg/
Authorization: Bearer ${token}
Content-Type: application/json

{
  "eventType": "document.signed",
  "payload": {
"rawXml": "<?xml version=\\"1.0\\"?>\\n<soap:Envelope>...</soap:Envelope>"
  }
}`}
          </pre>
          <p style={{marginBottom:8}}>
            Your <strong style={{color:'var(--text)'}}>transformation service</strong> is responsible for converting internal domain events
            into the SOAP XML envelope before pushing. Two delivery strategies:
          </p>
          <div style={{marginLeft:4}}>
            <p style={{marginBottom:6}}>
              <strong style={{color:'var(--text)'}}>Option A — Forward as-is:</strong>{' '}
              Use a <a href="https://docs.svix.com/transformations" target="_blank" rel="noopener" style={{color:'var(--accent)'}}>Svix Transformation</a> on
              the endpoint to extract the raw XML and set <code style={codeInline}>Content-Type: text/xml</code>.
            </p>
            <p>
              <strong style={{color:'var(--text)'}}>Option B — JSON wrapper:</strong>{' '}
              Send the event as standard JSON containing the XML as a string field.
              The client parses the XML from the JSON body. Simpler to set up, no transformation needed.
            </p>
          </div>
        </div>
      </details>

      {/* ── SDK Libraries ─────────────────────────── */}
      <details style={{marginTop:8}}>
        <summary style={summaryStyle}>SDK libraries & further resources</summary>
        <div style={sectionBody}>
          <p style={{marginBottom:12}}>
            Svix provides official client libraries for both <strong style={{color:'var(--text)'}}>sending</strong> webhooks (from your app)
            and <strong style={{color:'var(--text)'}}>verifying</strong> them (in your clients' apps):
          </p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12}}>
            {[
              ['JavaScript / TypeScript', 'npm install svix'],
              ['Python', 'pip install svix'],
              ['Go', 'go get github.com/svix/svix-webhooks/go'],
              ['Java / Kotlin', 'com.svix:svix (Maven)'],
              ['Ruby', 'gem install svix'],
              ['C# / .NET', 'dotnet add package Svix'],
              ['PHP', 'composer require svix/svix'],
              ['Rust', 'cargo add svix'],
            ].map(([lang, cmd]) => (
              <div key={lang} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 10px',background:'var(--bg)',borderRadius:6,border:'1px solid var(--border)'}}>
                <span style={{fontSize:12,fontWeight:500,color:'var(--text)'}}>{lang}</span>
                <code style={{fontSize:10,color:'var(--text-dim)',fontFamily:'monospace'}}>{cmd}</code>
              </div>
            ))}
          </div>
          <p style={sectionHead}>Useful links</p>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {[
              ['Svix API Reference', 'https://api.svix.com/docs'],
              ['Webhook Verification Guide', 'https://docs.svix.com/receiving/verifying-payloads/how'],
              ['Svix Transformations', 'https://docs.svix.com/transformations'],
              ['GitHub — svix-webhooks', 'https://github.com/svix/svix-webhooks'],
            ].map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noopener"
                style={{fontSize:12,color:'var(--accent)',textDecoration:'none'}}>
                {label} ↗
              </a>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
