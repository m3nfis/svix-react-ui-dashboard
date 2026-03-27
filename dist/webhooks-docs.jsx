// ── Webhooks: full API reference page ────────────────────────────────────
// Depends: webhooks-core.jsx (svix), shared (api)

function ApiDocsPage({ info, onBack }) {
  const [copied, setCopied] = useState('');
  const [eventTypes, setEventTypes] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    svix('GET', 'app/endpoint/').catch(() => {});
    api('/api/webhooks/info').catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/webhooks/svix/event-type/', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('vibey_token')}`, 'Content-Type': 'application/json' },
    }).then(r => r.json()).then(d => setEventTypes(d.data || [])).catch(() => {});
  }, []);

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000); });
  };

  const baseUrl = info ? info.api_url : 'https://webhooks.vibey.cloud';
  const appUid = info ? info.app_uid : '<APP_UID>';
  const token = info ? info.auth_token : '<YOUR_TOKEN>';
  const tokenShort = info ? token.slice(0, 20) + '...' : '<YOUR_TOKEN>';
  const authH = `-H "Authorization: Bearer ${tokenShort}"`;
  const ctH = `-H "Content-Type: application/json"`;

  const scrollTo = (id) => {
    const el = contentRef.current?.querySelector(`[data-section="${id}"]`) || contentRef.current?.querySelector(`[data-endpoint="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pre = { marginTop: 6, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, fontSize: 11, fontFamily: 'SF Mono,Menlo,Consolas,monospace', color: 'var(--text-dim)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.7 };
  const epBlock = { marginTop: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' };
  const epHeader = (method) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)',
  });
  const methodColors = { GET: { bg: 'rgba(62,207,142,0.12)', color: '#3ecf8e' }, POST: { bg: 'rgba(91,168,245,0.12)', color: '#5ba8f5' }, PUT: { bg: 'rgba(240,192,64,0.12)', color: '#f0c040' }, PATCH: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' }, DELETE: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' } };
  const methodBadge = (m) => ({ fontFamily: 'SF Mono,Menlo,Consolas,monospace', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: methodColors[m]?.bg, color: methodColors[m]?.color, minWidth: 48, textAlign: 'center', display: 'inline-block' });
  const epPath = { fontFamily: 'SF Mono,Menlo,Consolas,monospace', fontSize: 12, color: 'var(--text)' };
  const epBody = { padding: 16 };
  const sHead = { fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 10, paddingTop: 20, borderTop: '1px solid var(--border)', color: 'var(--text)' };
  const paramsTable = { width: '100%', borderCollapse: 'collapse', margin: '10px 0' };
  const thStyle = { textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700, padding: '6px 10px', borderBottom: '1px solid var(--border)' };
  const tdStyle = { fontSize: 12, padding: '6px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' };
  const tdMono = { ...tdStyle, fontFamily: 'SF Mono,Menlo,Consolas,monospace', color: 'var(--text)', fontWeight: 500 };
  const tagReq = { fontSize: 9, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginLeft: 4 };
  const tagOpt = { fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginLeft: 4 };

  const Endpoint = ({ id, method, path, summary, children }) => (
    <div style={epBlock} data-endpoint={id}>
      <div style={epHeader(method)}>
        <span style={methodBadge(method)}>{method}</span>
        <span style={epPath} dangerouslySetInnerHTML={{ __html: path.replaceAll(/\{([^}]+)\}/g, '<span style="color:#7c5cfc">{$1}</span>') }} />
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-dim)' }}>{summary}</span>
      </div>
      <div style={epBody}>{children}</div>
    </div>
  );

  const CopyPre = ({ id, text }) => (
    <div style={{ position: 'relative' }}>
      <pre style={pre}>{text}</pre>
      <button className="btn-sm btn-ghost" onClick={() => copy(text, id)}
        style={{ position: 'absolute', top: 12, right: 10, padding: '2px 8px', fontSize: 9 }}>
        {copied === id ? 'Copied' : 'Copy'}
      </button>
    </div>
  );

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'applications', label: 'Applications', items: [
      { id: 'list-apps', m: 'GET', label: 'List Apps' }, { id: 'create-app', m: 'POST', label: 'Create App' }, { id: 'get-app', m: 'GET', label: 'Get App' },
      { id: 'update-app', m: 'PUT', label: 'Update App' }, { id: 'delete-app', m: 'DELETE', label: 'Delete App' },
    ]},
    { id: 'endpoints', label: 'Endpoints', items: [
      { id: 'list-ep', m: 'GET', label: 'List Endpoints' }, { id: 'create-ep', m: 'POST', label: 'Create Endpoint' }, { id: 'get-ep', m: 'GET', label: 'Get Endpoint' },
      { id: 'update-ep', m: 'PUT', label: 'Update Endpoint' }, { id: 'delete-ep', m: 'DELETE', label: 'Delete Endpoint' },
      { id: 'get-hdrs', m: 'GET', label: 'Get Headers' }, { id: 'set-hdrs', m: 'PUT', label: 'Set Headers' },
      { id: 'get-sec', m: 'GET', label: 'Get Secret' }, { id: 'rot-sec', m: 'POST', label: 'Rotate Secret' },
      { id: 'ep-stats', m: 'GET', label: 'Stats' }, { id: 'recover', m: 'POST', label: 'Recover Failed' },
    ]},
    { id: 'messages', label: 'Messages', items: [
      { id: 'list-msg', m: 'GET', label: 'List Messages' }, { id: 'create-msg', m: 'POST', label: 'Create Message' },
      { id: 'get-msg', m: 'GET', label: 'Get Message' }, { id: 'expunge-msg', m: 'DELETE', label: 'Expunge Content' },
    ]},
    { id: 'attempts', label: 'Attempts', items: [
      { id: 'list-att', m: 'GET', label: 'List Attempts' }, { id: 'get-att', m: 'GET', label: 'Get Attempt' },
      { id: 'att-by-ep', m: 'GET', label: 'By Endpoint' }, { id: 'att-by-msg', m: 'GET', label: 'By Message' },
      { id: 'resend', m: 'POST', label: 'Resend' },
    ]},
    { id: 'event-types', label: 'Event Types', items: [
      { id: 'list-et', m: 'GET', label: 'List Types' }, { id: 'create-et', m: 'POST', label: 'Create Type' },
      { id: 'get-et', m: 'GET', label: 'Get Type' }, { id: 'update-et', m: 'PUT', label: 'Update Type' }, { id: 'del-et', m: 'DELETE', label: 'Delete Type' },
    ]},
    { id: 'auth', label: 'Auth', items: [
      { id: 'portal', m: 'POST', label: 'Portal Access' }, { id: 'dash', m: 'POST', label: 'Dashboard' },
    ]},
    { id: 'health', label: 'Health', items: [
      { id: 'health-check', m: 'GET', label: 'Health Check' },
    ]},
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 230, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '16px 0', background: 'var(--surface)' }}>
        <div style={{ padding: '0 14px 14px', borderBottom: '1px solid var(--border)', marginBottom: 10 }}>
          <button className="btn-sm btn-ghost" onClick={onBack} style={{ fontSize: 11, padding: '3px 10px', marginBottom: 8 }}>
            ← Back to Webhooks
          </button>
          <div style={{ fontSize: 14, fontWeight: 700 }}>API Reference</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>webhooks.vibey.cloud</div>
        </div>
        {sections.map(sec => (
          <div key={sec.id} style={{ padding: '4px 14px' }}>
            <div onClick={() => scrollTo(sec.id)} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text)', padding: '5px 0', marginBottom: 2 }}>
              {sec.label}
            </div>
            {sec.items && sec.items.map((item) => (
              <div key={item.id} onClick={() => scrollTo(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', fontSize: 11, color: 'var(--text-dim)', cursor: 'pointer', borderRadius: 4 }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}>
                <span style={{ ...methodBadge(item.m), fontSize: 8, padding: '1px 4px', minWidth: 30 }}>{item.m}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '28px 36px 80px' }}>
        {/* Overview */}
        <div data-section="overview">
          <h2 style={{ marginBottom: 6 }}>Svix API Reference</h2>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: 640, marginBottom: 20 }}>
            Complete API reference for the Svix webhook relay. All examples use your credentials — copy and run directly.
          </p>

          <div style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', fontWeight: 700 }}>Base URL</span>
            <code style={{ fontSize: 12 }}>{baseUrl}/api/v1</code>
          </div>

          <div style={{ background: 'var(--surface)', borderLeft: '3px solid var(--accent)', padding: '12px 16px', borderRadius: '0 8px 8px 0', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Authentication:</strong> All requests require
              <code style={{ fontSize: 11 }}>Authorization: Bearer {'<token>'}</code>. Your token is shown in API Credentials above.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)', marginBottom: 4 }}>Your App UID</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <code style={{ fontSize: 11 }}>{appUid}</code>
                <button className="btn-sm btn-ghost" onClick={() => copy(appUid, 'uid')} style={{ padding: '2px 6px', fontSize: 9 }}>{copied === 'uid' ? 'Done' : 'Copy'}</button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)', marginBottom: 4 }}>API URL</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <code style={{ fontSize: 11 }}>{baseUrl}</code>
                <button className="btn-sm btn-ghost" onClick={() => copy(baseUrl, 'burl')} style={{ padding: '2px 6px', fontSize: 9 }}>{copied === 'burl' ? 'Done' : 'Copy'}</button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)', marginBottom: 4 }}>Auth Token</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <code style={{ fontSize: 11 }}>{tokenShort}</code>
                <button className="btn-sm btn-ghost" onClick={() => copy(token, 'tok')} style={{ padding: '2px 6px', fontSize: 9 }}>{copied === 'tok' ? 'Done' : 'Copy'}</button>
              </div>
            </div>
          </div>

          {eventTypes && eventTypes.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3ecf8e', display: 'inline-block', animation: 'none' }}></span>
                Your Event Types
              </div>
              <table style={paramsTable}>
                <thead><tr><th style={thStyle}>Name</th><th style={thStyle}>Description</th><th style={thStyle}>Status</th></tr></thead>
                <tbody>
                  {eventTypes.map(et => (
                    <tr key={et.name}>
                      <td style={tdMono}>{et.name}</td>
                      <td style={tdStyle}>{et.description || '—'}</td>
                      <td style={tdStyle}>{et.archived ? 'Archived' : 'Active'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── APPLICATIONS ─────────────────────────────────────────── */}
        <div data-section="applications">
          <h3 style={sHead}>Applications</h3>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 8 }}>
            Applications represent consumer tenants. Each has its own endpoints and messages.
            Use the <code>uid</code> (e.g. <code>{appUid}</code>) or internal <code>id</code> in path params.
          </p>

          <Endpoint id="list-apps" method="GET" path="/api/v1/app/" summary="List Applications">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Returns a paginated list of all applications.</p>
            <CopyPre id="list-apps" text={`curl -X GET ${baseUrl}/api/v1/app/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="create-app" method="POST" path="/api/v1/app/" summary="Create Application">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Create a new application.</p>
            <table style={paramsTable}>
              <thead><tr><th style={thStyle}>Field</th><th style={thStyle}>Type</th><th style={thStyle}>Description</th></tr></thead>
              <tbody>
                <tr><td style={tdMono}>name<span style={tagReq}>req</span></td><td style={tdStyle}>string</td><td style={tdStyle}>Human-readable name</td></tr>
                <tr><td style={tdMono}>uid<span style={tagOpt}>opt</span></td><td style={tdStyle}>string</td><td style={tdStyle}>External unique ID</td></tr>
                <tr><td style={tdMono}>rateLimit<span style={tagOpt}>opt</span></td><td style={tdStyle}>integer</td><td style={tdStyle}>Max messages/sec</td></tr>
                <tr><td style={tdMono}>metadata<span style={tagOpt}>opt</span></td><td style={tdStyle}>object</td><td style={tdStyle}>Key-value metadata</td></tr>
              </tbody>
            </table>
            <CopyPre id="create-app" text={`curl -X POST ${baseUrl}/api/v1/app/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{"name":"my-service","uid":"svc-123"}'`} />
          </Endpoint>

          <Endpoint id="get-app" method="GET" path={`/api/v1/app/{app_id}/`} summary="Get Application">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Get a single application by ID or UID.</p>
            <CopyPre id="get-app" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="update-app" method="PUT" path={`/api/v1/app/{app_id}/`} summary="Update Application">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Full replacement update.</p>
            <CopyPre id="update-app" text={`curl -X PUT ${baseUrl}/api/v1/app/${appUid}/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{"name":"updated-name"}'`} />
          </Endpoint>

          <Endpoint id="delete-app" method="DELETE" path={`/api/v1/app/{app_id}/`} summary="Delete Application">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Permanently delete an application and all its data.</p>
            <CopyPre id="del-app" text={`curl -X DELETE ${baseUrl}/api/v1/app/${appUid}/ \\\n  ${authH}`} />
          </Endpoint>
        </div>

        {/* ── ENDPOINTS ────────────────────────────────────────────── */}
        <div data-section="endpoints">
          <h3 style={sHead}>Endpoints</h3>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 8 }}>
            Webhook destination URLs within an application. Each endpoint can subscribe to specific event types via <code>filterTypes</code>.
          </p>

          <Endpoint id="list-ep" method="GET" path={`/api/v1/app/{app_id}/endpoint/`} summary="List Endpoints">
            <CopyPre id="list-ep" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/endpoint/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="create-ep" method="POST" path={`/api/v1/app/{app_id}/endpoint/`} summary="Create Endpoint">
            <table style={paramsTable}>
              <thead><tr><th style={thStyle}>Field</th><th style={thStyle}>Type</th><th style={thStyle}>Description</th></tr></thead>
              <tbody>
                <tr><td style={tdMono}>url<span style={tagReq}>req</span></td><td style={tdStyle}>string</td><td style={tdStyle}>Webhook destination URL</td></tr>
                <tr><td style={tdMono}>description<span style={tagOpt}>opt</span></td><td style={tdStyle}>string</td><td style={tdStyle}>Human-readable label</td></tr>
                <tr><td style={tdMono}>filterTypes<span style={tagOpt}>opt</span></td><td style={tdStyle}>string[]</td><td style={tdStyle}>Event types to receive (null = all)</td></tr>
                <tr><td style={tdMono}>channels<span style={tagOpt}>opt</span></td><td style={tdStyle}>string[]</td><td style={tdStyle}>Channel filter</td></tr>
                <tr><td style={tdMono}>rateLimit<span style={tagOpt}>opt</span></td><td style={tdStyle}>integer</td><td style={tdStyle}>Max deliveries/sec</td></tr>
                <tr><td style={tdMono}>secret<span style={tagOpt}>opt</span></td><td style={tdStyle}>string</td><td style={tdStyle}>Signing secret (auto if omitted)</td></tr>
                <tr><td style={tdMono}>metadata<span style={tagOpt}>opt</span></td><td style={tdStyle}>object</td><td style={tdStyle}>Key-value metadata</td></tr>
              </tbody>
            </table>
            <CopyPre id="create-ep" text={`curl -X POST ${baseUrl}/api/v1/app/${appUid}/endpoint/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{"url":"https://your-server.com/webhook","description":"My endpoint","filterTypes":["user.created"]}'`} />
          </Endpoint>

          <Endpoint id="get-ep" method="GET" path={`/api/v1/app/{app_id}/endpoint/{endpoint_id}/`} summary="Get Endpoint">
            <CopyPre id="get-ep" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/endpoint/{endpoint_id}/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="update-ep" method="PUT" path={`/api/v1/app/{app_id}/endpoint/{endpoint_id}/`} summary="Update Endpoint">
            <CopyPre id="update-ep" text={`curl -X PUT ${baseUrl}/api/v1/app/${appUid}/endpoint/{endpoint_id}/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{"url":"https://new-url.com/webhook","description":"Updated"}'`} />
          </Endpoint>

          <Endpoint id="delete-ep" method="DELETE" path={`/api/v1/app/{app_id}/endpoint/{endpoint_id}/`} summary="Delete Endpoint">
            <CopyPre id="del-ep" text={`curl -X DELETE ${baseUrl}/api/v1/app/${appUid}/endpoint/{endpoint_id}/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="get-hdrs" method="GET" path={`/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers/`} summary="Get Endpoint Headers">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Custom headers sent with every webhook delivery.</p>
            <CopyPre id="get-hdrs" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/endpoint/{endpoint_id}/headers/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="set-hdrs" method="PUT" path={`/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers/`} summary="Set Endpoint Headers">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Set custom auth headers (Basic Auth, API keys, etc.).</p>
            <CopyPre id="set-hdrs" text={`curl -X PUT ${baseUrl}/api/v1/app/${appUid}/endpoint/{endpoint_id}/headers/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{"headers":{"Authorization":"Basic dXNlcjpwYXNz","X-Custom":"value"}}'`} />
          </Endpoint>

          <Endpoint id="get-sec" method="GET" path={`/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret/`} summary="Get Signing Secret">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Get the signing secret used to verify webhook signatures.</p>
            <CopyPre id="get-sec" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/endpoint/{endpoint_id}/secret/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="rot-sec" method="POST" path={`/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret/rotate/`} summary="Rotate Secret">
            <CopyPre id="rot-sec" text={`curl -X POST ${baseUrl}/api/v1/app/${appUid}/endpoint/{endpoint_id}/secret/rotate/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{}'`} />
          </Endpoint>

          <Endpoint id="ep-stats" method="GET" path={`/api/v1/app/{app_id}/endpoint/{endpoint_id}/stats/`} summary="Endpoint Stats">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Delivery statistics (success/failure rates).</p>
            <CopyPre id="ep-stats" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/endpoint/{endpoint_id}/stats/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="recover" method="POST" path={`/api/v1/app/{app_id}/endpoint/{endpoint_id}/recover/`} summary="Recover Failed">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Resend all failed messages since a timestamp. Use after fixing an outage.</p>
            <CopyPre id="recover" text={`curl -X POST ${baseUrl}/api/v1/app/${appUid}/endpoint/{endpoint_id}/recover/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{"since":"${new Date(Date.now() - 86400000).toISOString()}"}'`} />
          </Endpoint>

          <Endpoint id="ep-msgs" method="GET" path={`/api/v1/app/{app_id}/endpoint/{endpoint_id}/msg/`} summary="List Attempted Messages">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Messages that were attempted to this endpoint.</p>
            <CopyPre id="ep-msgs" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/endpoint/{endpoint_id}/msg/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="send-ex" method="POST" path={`/api/v1/app/{app_id}/endpoint/{endpoint_id}/send-example/`} summary="Send Example">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Send an example message to test the endpoint.</p>
            <CopyPre id="send-ex" text={`curl -X POST ${baseUrl}/api/v1/app/${appUid}/endpoint/{endpoint_id}/send-example/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{"eventType":"user.created"}'`} />
          </Endpoint>
        </div>

        {/* ── MESSAGES ─────────────────────────────────────────────── */}
        <div data-section="messages">
          <h3 style={sHead}>Messages</h3>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 8 }}>
            Messages are webhook events. Svix delivers each message to all subscribed endpoints with automatic retries.
          </p>

          <Endpoint id="list-msg" method="GET" path={`/api/v1/app/{app_id}/msg/`} summary="List Messages">
            <CopyPre id="list-msg" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/msg/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="create-msg" method="POST" path={`/api/v1/app/{app_id}/msg/`} summary="Create Message (Send Event)">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Send a webhook event to all subscribed endpoints. This is the primary API call to emit events.</p>
            <table style={paramsTable}>
              <thead><tr><th style={thStyle}>Field</th><th style={thStyle}>Type</th><th style={thStyle}>Description</th></tr></thead>
              <tbody>
                <tr><td style={tdMono}>eventType<span style={tagReq}>req</span></td><td style={tdStyle}>string</td><td style={tdStyle}>Event type (e.g. payment.guaranteed)</td></tr>
                <tr><td style={tdMono}>payload<span style={tagReq}>req</span></td><td style={tdStyle}>object</td><td style={tdStyle}>JSON payload to deliver</td></tr>
                <tr><td style={tdMono}>eventId<span style={tagOpt}>opt</span></td><td style={tdStyle}>string</td><td style={tdStyle}>Unique ID for idempotency</td></tr>
                <tr><td style={tdMono}>channels<span style={tagOpt}>opt</span></td><td style={tdStyle}>string[]</td><td style={tdStyle}>Route to specific channels</td></tr>
              </tbody>
            </table>
            <CopyPre id="create-msg" text={`curl -X POST ${baseUrl}/api/v1/app/${appUid}/msg/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{"eventType":"user.created","payload":{"username":"john","email":"john@example.com"},"eventId":"evt_unique_123"}'`} />
          </Endpoint>

          <Endpoint id="get-msg" method="GET" path={`/api/v1/app/{app_id}/msg/{msg_id}/`} summary="Get Message">
            <CopyPre id="get-msg" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/msg/{msg_id}/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="expunge-msg" method="DELETE" path={`/api/v1/app/{app_id}/msg/{msg_id}/content/`} summary="Expunge Content">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Permanently remove payload content (for GDPR/compliance). Metadata is retained.</p>
            <CopyPre id="expunge-msg" text={`curl -X DELETE ${baseUrl}/api/v1/app/${appUid}/msg/{msg_id}/content/ \\\n  ${authH}`} />
          </Endpoint>
        </div>

        {/* ── ATTEMPTS ─────────────────────────────────────────────── */}
        <div data-section="attempts">
          <h3 style={sHead}>Message Attempts</h3>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 8 }}>
            Track delivery attempts to endpoints. Svix retries failed deliveries with exponential backoff.
          </p>

          <Endpoint id="list-att" method="GET" path={`/api/v1/app/{app_id}/msg/{msg_id}/attempt/`} summary="List Attempts">
            <CopyPre id="list-att" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/msg/{msg_id}/attempt/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="get-att" method="GET" path={`/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}/`} summary="Get Attempt">
            <CopyPre id="get-att" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/msg/{msg_id}/attempt/{attempt_id}/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="att-by-ep" method="GET" path={`/api/v1/app/{app_id}/attempt/endpoint/{endpoint_id}/`} summary="Attempts by Endpoint">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>All delivery attempts to a specific endpoint, across all messages.</p>
            <CopyPre id="att-by-ep" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/attempt/endpoint/{endpoint_id}/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="att-by-msg" method="GET" path={`/api/v1/app/{app_id}/attempt/msg/{msg_id}/`} summary="Attempts by Message">
            <CopyPre id="att-by-msg" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/attempt/msg/{msg_id}/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="att-dest" method="GET" path={`/api/v1/app/{app_id}/msg/{msg_id}/endpoint/`} summary="Attempted Destinations">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>List endpoints a message was delivered to.</p>
            <CopyPre id="att-dest" text={`curl -X GET ${baseUrl}/api/v1/app/${appUid}/msg/{msg_id}/endpoint/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="resend" method="POST" path={`/api/v1/app/{app_id}/msg/{msg_id}/endpoint/{endpoint_id}/resend/`} summary="Resend Webhook">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Manually resend a message to a specific endpoint.</p>
            <CopyPre id="resend" text={`curl -X POST ${baseUrl}/api/v1/app/${appUid}/msg/{msg_id}/endpoint/{endpoint_id}/resend/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{}'`} />
          </Endpoint>
        </div>

        {/* ── EVENT TYPES ──────────────────────────────────────────── */}
        <div data-section="event-types">
          <h3 style={sHead}>Event Types</h3>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 8 }}>
            Define the catalog of events. Endpoints subscribe to types via <code>filterTypes</code>. Types are shared across all apps.
          </p>

          <Endpoint id="list-et" method="GET" path="/api/v1/event-type/" summary="List Event Types">
            <CopyPre id="list-et" text={`curl -X GET ${baseUrl}/api/v1/event-type/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="create-et" method="POST" path="/api/v1/event-type/" summary="Create Event Type">
            <table style={paramsTable}>
              <thead><tr><th style={thStyle}>Field</th><th style={thStyle}>Type</th><th style={thStyle}>Description</th></tr></thead>
              <tbody>
                <tr><td style={tdMono}>name<span style={tagReq}>req</span></td><td style={tdStyle}>string</td><td style={tdStyle}>Unique name (e.g. payment.guaranteed)</td></tr>
                <tr><td style={tdMono}>description<span style={tagOpt}>opt</span></td><td style={tdStyle}>string</td><td style={tdStyle}>Human-readable description</td></tr>
                <tr><td style={tdMono}>schemas<span style={tagOpt}>opt</span></td><td style={tdStyle}>object</td><td style={tdStyle}>JSON Schema for payload validation</td></tr>
              </tbody>
            </table>
            <CopyPre id="create-et" text={`curl -X POST ${baseUrl}/api/v1/event-type/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{"name":"order.completed","description":"Triggered when an order is completed"}'`} />
          </Endpoint>

          <Endpoint id="get-et" method="GET" path="/api/v1/event-type/{event_type_name}/" summary="Get Event Type">
            <CopyPre id="get-et" text={`curl -X GET ${baseUrl}/api/v1/event-type/user.created/ \\\n  ${authH}`} />
          </Endpoint>

          <Endpoint id="update-et" method="PUT" path="/api/v1/event-type/{event_type_name}/" summary="Update Event Type">
            <CopyPre id="update-et" text={`curl -X PUT ${baseUrl}/api/v1/event-type/user.created/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{"description":"Updated description"}'`} />
          </Endpoint>

          <Endpoint id="del-et" method="DELETE" path="/api/v1/event-type/{event_type_name}/" summary="Delete Event Type">
            <CopyPre id="del-et" text={`curl -X DELETE ${baseUrl}/api/v1/event-type/user.created/ \\\n  ${authH}`} />
          </Endpoint>
        </div>

        {/* ── AUTH ─────────────────────────────────────────────────── */}
        <div data-section="auth">
          <h3 style={sHead}>Authentication Endpoints</h3>

          <Endpoint id="portal" method="POST" path="/api/v1/auth/app-portal-access/{app_id}/" summary="App Portal Access">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>Generate a single-use URL for the Svix App Portal — lets consumers manage their own endpoints.</p>
            <CopyPre id="portal" text={`curl -X POST ${baseUrl}/api/v1/auth/app-portal-access/${appUid}/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{}'`} />
          </Endpoint>

          <Endpoint id="dash" method="POST" path="/api/v1/auth/dashboard-access/{app_id}/" summary="Dashboard Access">
            <CopyPre id="dash" text={`curl -X POST ${baseUrl}/api/v1/auth/dashboard-access/${appUid}/ \\\n  ${authH} \\\n  ${ctH} \\\n  -d '{}'`} />
          </Endpoint>
        </div>

        {/* ── HEALTH ───────────────────────────────────────────────── */}
        <div data-section="health">
          <h3 style={sHead}>Health</h3>

          <Endpoint id="health-check" method="GET" path="/api/v1/health/" summary="Health Check">
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>No authentication required. Returns 204 when healthy.</p>
            <CopyPre id="health" text={`curl -X GET ${baseUrl}/api/v1/health/`} />
          </Endpoint>
        </div>

        <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Svix API Reference — webhooks.vibey.cloud — Powered by <a href="https://svix.com" target="_blank" rel="noopener" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Svix</a>
          </p>
        </div>
      </div>
    </div>
  );
}
