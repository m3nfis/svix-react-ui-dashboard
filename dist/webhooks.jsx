// ── Webhooks page (entry) ───────────────────────────────────────────────
// Depends: prior webhooks-*.jsx scripts + webhooks-core.jsx

function WebhooksPage() {
  const [tab, setTab] = useState('endpoints');
  const [info, setInfo] = useState(null);
  const [showApi, setShowApi] = useState(false);
  const [showGuide, setShowGuide] = useState(() => !localStorage.getItem('vibey_wh_guide_dismissed'));
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => { api('/api/webhooks/info').then(setInfo).catch(() => {}); }, []);

  const dismissGuide = () => { setShowGuide(false); localStorage.setItem('vibey_wh_guide_dismissed', '1'); };

  if (showDocs) {
    return React.createElement(ApiDocsPage, { info, onBack: () => setShowDocs(false) });
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 64px)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,flexShrink:0}}>
        <div>
          <h2>Webhooks</h2>
          <div className="page-sub" style={{marginBottom:0}}>
            Reliable webhook relay for your apps — powered by <a href="https://github.com/svix/svix-webhooks" target="_blank" rel="noopener" style={{color:'var(--accent)'}}>Svix</a>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:4}}>
          {!showGuide && (
            <button className="btn-sm btn-ghost" onClick={() => setShowGuide(true)}>How it works</button>
          )}
          <button className="btn-sm btn-ghost" onClick={() => setShowApi(!showApi)}>
            {showApi ? 'Hide API' : 'API Credentials'}
          </button>
          <button className="btn-sm btn-ghost" onClick={() => setShowDocs(true)}>API Docs</button>
        </div>
      </div>
      <HealthAlertsBanner />
      {showGuide && (
        <div style={{position:'relative',flexShrink:0}}>
          <button className="btn-sm btn-ghost" onClick={dismissGuide}
            style={{position:'absolute',top:12,right:12,padding:'2px 8px',fontSize:11,zIndex:1}}>Dismiss</button>
          <WebhookExplainer info={info} />
        </div>
      )}
      {showApi && info && <ApiCredentials info={info} />}
      <div className="wh-tabs" style={{flexShrink:0}}>
        {[['endpoints','Endpoints'],['event-catalog','Event Catalog'],['logs','Logs'],['activity','Activity']].map(([k,label]) => (
          <button key={k} className={`wh-tab ${tab===k?'active':''}`} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      <div style={{flex:1,minHeight:0,overflowY:'auto'}}>
        {tab === 'endpoints' && <EndpointsPanel />}
        {tab === 'event-catalog' && <EventCatalogPanel />}
        {tab === 'logs' && <LogsPanel />}
        {tab === 'activity' && <ActivityPanel />}
      </div>
    </div>
  );
}

function ApiCredentials({ info }) {
  const [copied, setCopied] = useState('');
  const copy = (text, key) => { navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000); }); };

  const authHeader = `-H "Authorization: Bearer ${info.auth_token}"`;
  const contentHeader = `-H "Content-Type: application/json"`;
  const curlSendMsg = `curl -X POST ${info.api_url}/api/v1/app/${info.app_uid}/msg/ \\\n  ${authHeader} \\\n  ${contentHeader} \\\n  -d '{"eventType":"user.created","payload":{"username":"john"}}'`;
  const curlAddEndpoint = `curl -X POST ${info.api_url}/api/v1/app/${info.app_uid}/endpoint/ \\\n  ${authHeader} \\\n  ${contentHeader} \\\n  -d '{"url":"https://your-server.com/webhook","description":"My endpoint","filterTypes":["user.created","order.completed"]}'`;
  const curlAddEventType = `curl -X POST ${info.api_url}/api/v1/event-type/ \\\n  ${authHeader} \\\n  ${contentHeader} \\\n  -d '{"name":"order.completed","description":"Triggered when an order is completed"}'`;

  const preStyle = {marginTop:6,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:12,fontSize:11,fontFamily:'SF Mono,Menlo,Consolas,monospace',color:'var(--text-dim)',whiteSpace:'pre-wrap',wordBreak:'break-all'};

  return (
    <div className="wh-api-card" style={{marginBottom:12,flexShrink:0}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>API URL</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}><code style={{fontSize:11}}>{info.api_url}</code><button className="btn-sm btn-ghost" style={{padding:'3px 8px',fontSize:10}} onClick={() => copy(info.api_url,'url')}>{copied==='url'?'Done':'Copy'}</button></div>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>App UID</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}><code style={{fontSize:11}}>{info.app_uid}</code><button className="btn-sm btn-ghost" style={{padding:'3px 8px',fontSize:10}} onClick={() => copy(info.app_uid,'uid')}>{copied==='uid'?'Done':'Copy'}</button></div>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Auth Token</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}><code style={{fontSize:11}}>{info.auth_token.slice(0,24)}...</code><button className="btn-sm btn-ghost" style={{padding:'3px 8px',fontSize:10}} onClick={() => copy(info.auth_token,'token')}>{copied==='token'?'Done':'Copy'}</button></div>
        </div>
      </div>
      <details style={{marginTop:12}}>
        <summary style={{cursor:'pointer',fontSize:12,color:'var(--text-dim)'}}>cURL examples</summary>
        <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:10}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:'var(--text)',marginBottom:4}}>Send a message</div>
            <pre style={preStyle}>{curlSendMsg}</pre>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:'var(--text)',marginBottom:4}}>Add an endpoint</div>
            <pre style={preStyle}>{curlAddEndpoint}</pre>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:'var(--text)',marginBottom:4}}>Add an event type</div>
            <pre style={preStyle}>{curlAddEventType}</pre>
          </div>
        </div>
      </details>
    </div>
  );
}
