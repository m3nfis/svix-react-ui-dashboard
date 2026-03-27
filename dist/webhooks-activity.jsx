// ── Webhooks: logs, message detail, activity overview ──────────────────
// Depends: webhooks-core.jsx (svix, StatusBadge)

function LogsPanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [jumpId, setJumpId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [afterDate, setAfterDate] = useState('');
  const [beforeDate, setBeforeDate] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterChannel, setFilterChannel] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set('event_types', filterType);
    if (afterDate) params.set('after', new Date(afterDate).toISOString());
    if (beforeDate) params.set('before', new Date(beforeDate).toISOString());
    if (filterTag) params.set('tag', filterTag);
    if (filterChannel) params.set('channel', filterChannel);
    const qs = params.toString();
    const path = qs ? `app/msg/?${qs}` : 'app/msg/';
    svix('GET', path)
      .then(d => setMessages(d.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [filterType, afterDate, beforeDate, filterTag, filterChannel]);

  useEffect(() => { load(); }, [load]);

  const jumpToMessage = async () => {
    if (!jumpId.trim()) return;
    try {
      const msg = await svix('GET', `app/msg/${jumpId.trim()}/`);
      setSelectedMsg(msg);
    } catch (err) { alert('Message not found: ' + err.message); }
  };

  const clearFilters = () => {
    setFilterType(''); setAfterDate(''); setBeforeDate('');
    setFilterTag(''); setFilterChannel('');
  };

  const hasFilters = filterType || afterDate || beforeDate || filterTag || filterChannel;

  if (selectedMsg) {
    return <MessageDetail msg={selectedMsg} onBack={() => setSelectedMsg(null)} />;
  }

  return (
    <>
      <div className="wh-toolbar">
        <h3>Message Logs</h3>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input value={jumpId} onChange={e => setJumpId(e.target.value)}
            placeholder="Jump to message ID" style={{width:180,padding:'6px 10px',fontSize:12}}
            onKeyDown={e => e.key === 'Enter' && jumpToMessage()} />
          <button className="btn-sm btn-ghost" onClick={jumpToMessage}>Go</button>
          <button className="btn-sm btn-ghost" onClick={load}>↻</button>
          <button className={`btn-sm ${showFilters ? '' : 'btn-ghost'}`}
            onClick={() => setShowFilters(!showFilters)}
            style={{position:'relative'}}>
            Filters
            {hasFilters && <span style={{position:'absolute',top:-2,right:-2,width:6,height:6,
              borderRadius:'50%',background:'var(--accent)'}} />}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="wh-api-card" style={{marginBottom:12,padding:16}}>
          <div className="wh-grid-3" style={{marginBottom:12}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Event Type</div>
              <input value={filterType} onChange={e => setFilterType(e.target.value)}
                placeholder="e.g. order.created" style={{width:'100%',padding:'6px 10px',fontSize:12}} />
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Tag</div>
              <input value={filterTag} onChange={e => setFilterTag(e.target.value)}
                placeholder="Filter by tag" style={{width:'100%',padding:'6px 10px',fontSize:12}} />
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Channel</div>
              <input value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
                placeholder="Filter by channel" style={{width:'100%',padding:'6px 10px',fontSize:12}} />
            </div>
          </div>
          <div className="wh-grid-3">
            <div>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>After</div>
              <input type="datetime-local" value={afterDate} onChange={e => setAfterDate(e.target.value)}
                style={{width:'100%',padding:'6px 10px',fontSize:12}} />
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Before</div>
              <input type="datetime-local" value={beforeDate} onChange={e => setBeforeDate(e.target.value)}
                style={{width:'100%',padding:'6px 10px',fontSize:12}} />
            </div>
            <div style={{display:'flex',alignItems:'flex-end'}}>
              {hasFilters && <button className="btn-sm btn-ghost" onClick={clearFilters}>Clear Filters</button>}
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="wh-empty"><p>Loading messages...</p></div>
      ) : messages.length === 0 ? (
        <div className="wh-empty">
          <p>No messages yet</p>
          <p>{hasFilters ? 'Try adjusting your filters' : 'Messages will appear here as they are sent through the webhook service'}</p>
        </div>
      ) : (
        <div className="wh-table-wrap"><table className="wh-table">
          <thead><tr><th>Event Type</th><th>Message ID</th><th>Channels</th><th>Timestamp</th></tr></thead>
          <tbody>
            {messages.map(msg => (
              <tr key={msg.id} onClick={() => setSelectedMsg(msg)} style={{cursor:'pointer'}}>
                <td>
                  <code style={{fontSize:12,background:'var(--surface)',padding:'2px 6px',borderRadius:4}}>{msg.eventType}</code>
                </td>
                <td className="mono" style={{fontSize:11,color:'var(--text-dim)'}}>{msg.id}</td>
                <td style={{fontSize:12,color:'var(--text-dim)'}}>
                  {msg.channels && msg.channels.length > 0 ? msg.channels.join(', ') : '—'}
                </td>
                <td style={{fontSize:12,color:'var(--text-dim)'}}>{new Date(msg.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <div style={{color:'var(--text-dim)',fontSize:12,marginTop:12}}>
        {messages.length} message{messages.length !== 1 ? 's' : ''}
      </div>
    </>
  );
}

function MessageDetail({ msg, onBack }) {
  const cfg = useSvixConfig();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jsonView, setJsonView] = useState('formatted');

  useEffect(() => {
    svix('GET', `app/attempt/msg/${msg.id}/`)
      .then(d => setAttempts(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [msg.id]);

  return (
    <div>
      <div style={{marginBottom:16}}>
        <a onClick={onBack} style={{cursor:'pointer',color:'var(--accent)',fontSize:13}}>← Back to Messages</a>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <code style={{fontSize:16,fontWeight:600}}>{msg.eventType}</code>
          <div style={{fontSize:12,color:'var(--text-dim)',marginTop:4}}>
            ID: <span className="mono">{msg.id}</span>
          </div>
          <div style={{fontSize:12,color:'var(--text-dim)'}}>
            Created: {new Date(msg.timestamp).toLocaleString()}
          </div>
          {msg.channels && msg.channels.length > 0 && (
            <div style={{fontSize:12,color:'var(--text-dim)'}}>
              Channels: {msg.channels.join(', ')}
            </div>
          )}
          {msg.tags && msg.tags.length > 0 && (
            <div style={{fontSize:12,color:'var(--text-dim)'}}>
              Tags: {msg.tags.join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className="wh-api-card" style={{marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <h4>Message Payload</h4>
          <div style={{display:'flex',gap:4}}>
            <button className={`btn-sm ${jsonView==='formatted'?'':'btn-ghost'}`} style={{padding:'3px 10px',fontSize:11}}
              onClick={() => setJsonView('formatted')}>Formatted</button>
            <button className={`btn-sm ${jsonView==='raw'?'':'btn-ghost'}`} style={{padding:'3px 10px',fontSize:11}}
              onClick={() => setJsonView('raw')}>Raw</button>
          </div>
        </div>
        <pre style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,padding:16,fontSize:12,
          fontFamily:'SF Mono,Menlo,Consolas,monospace',color:'var(--text-dim)',
          whiteSpace:'pre-wrap',wordBreak:'break-all',maxHeight:400,overflowY:'auto'}}>
          {jsonView === 'formatted' ? JSON.stringify(msg.payload, null, 2) : JSON.stringify(msg.payload)}
        </pre>
      </div>

      <h4 style={{marginBottom:12}}>Delivery Attempts</h4>
      {loading ? <p style={{color:'var(--text-dim)'}}>Loading attempts...</p> :
      attempts.length === 0 ? <p style={{color:'var(--text-dim)'}}>No delivery attempts</p> : (
        <table className="wh-table">
          <thead><tr><th>Status</th><th>HTTP</th><th>Endpoint</th><th>Response</th><th>Timestamp</th><th></th></tr></thead>
          <tbody>
            {attempts.map(att => (
              <tr key={att.id}>
                <td><StatusBadge status={att.status} /></td>
                <td style={{fontSize:12,color:'var(--text-dim)'}}>
                  {att.responseStatusCode ? att.responseStatusCode : '—'}
                </td>
                <td className="mono" style={{fontSize:11,color:'var(--text-dim)'}}>{att.endpointId}</td>
                <td style={{fontSize:11,color:'var(--text-dim)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {att.response || '—'}
                </td>
                <td style={{fontSize:12,color:'var(--text-dim)'}}>{new Date(att.timestamp).toLocaleString()}</td>
                {cfg.messages.resend && (
                  <td>
                    <button className="btn-sm btn-ghost" onClick={() => {
                      svix('POST', `app/msg/${msg.id}/endpoint/${att.endpointId}/resend/`, {})
                        .then(() => alert('Message resent'))
                        .catch(err => alert('Retry failed: ' + err.message));
                    }}>Retry</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Activity ─────────────────────────────────────────────────────────────

function ActivityPanel() {
  const [endpoints, setEndpoints] = useState([]);
  const [messages, setMessages] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      svix('GET', 'app/endpoint/').then(d => d.data || []).catch(() => []),
      svix('GET', 'app/msg/').then(d => d.data || []).catch(() => []),
    ]).then(([eps, msgs]) => {
      setEndpoints(eps);
      setMessages(msgs);
      const recentMsgs = msgs.slice(0, 10);
      if (recentMsgs.length > 0) {
        Promise.all(
          recentMsgs.map(m => svix('GET', `app/attempt/msg/${m.id}/`).then(d => d.data || []).catch(() => []))
        ).then(results => setAttempts(results.flat()));
      }
    }).finally(() => setLoading(false));
  }, []);

  const successCount = attempts.filter(a => a.status === 0).length;
  const failCount = attempts.filter(a => a.status === 2).length;
  const pendingCount = attempts.filter(a => a.status === 1 || a.status === 3).length;

  return (
    <>
      <div className="wh-toolbar"><h3>Activity Overview</h3></div>
      {loading ? (
        <div className="wh-empty"><p>Loading activity data...</p></div>
      ) : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:16,marginBottom:24}}>
            <div className="wh-api-card" style={{textAlign:'center',padding:20}}>
              <div style={{fontSize:28,fontWeight:700,color:'var(--accent)'}}>{endpoints.length}</div>
              <div style={{fontSize:12,color:'var(--text-dim)',marginTop:4}}>Active Endpoints</div>
            </div>
            <div className="wh-api-card" style={{textAlign:'center',padding:20}}>
              <div style={{fontSize:28,fontWeight:700,color:'var(--text)'}}>{messages.length}</div>
              <div style={{fontSize:12,color:'var(--text-dim)',marginTop:4}}>Messages Sent</div>
            </div>
            <div className="wh-api-card" style={{textAlign:'center',padding:20}}>
              <div style={{fontSize:28,fontWeight:700,color:'var(--green)'}}>{successCount}</div>
              <div style={{fontSize:12,color:'var(--text-dim)',marginTop:4}}>Successful</div>
            </div>
            <div className="wh-api-card" style={{textAlign:'center',padding:20}}>
              <div style={{fontSize:28,fontWeight:700,color:'var(--red)'}}>{failCount}</div>
              <div style={{fontSize:12,color:'var(--text-dim)',marginTop:4}}>Failed</div>
            </div>
          </div>

          {messages.length > 0 && (
            <>
              <h4 style={{marginBottom:12}}>Recent Messages</h4>
              <table className="wh-table">
                <thead><tr><th>Event Type</th><th>Message ID</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {messages.slice(0, 10).map(msg => (
                    <tr key={msg.id}>
                      <td><code style={{fontSize:12,background:'var(--surface)',padding:'2px 6px',borderRadius:4}}>{msg.eventType}</code></td>
                      <td className="mono" style={{fontSize:11,color:'var(--text-dim)'}}>{msg.id}</td>
                      <td style={{fontSize:12,color:'var(--text-dim)'}}>{new Date(msg.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {attempts.length > 0 && (
            <>
              <h4 style={{marginBottom:12,marginTop:24}}>Recent Delivery Attempts</h4>
              <table className="wh-table">
                <thead><tr><th>Status</th><th>HTTP</th><th>Message ID</th><th>Endpoint ID</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {attempts.slice(0, 20).map(att => (
                    <tr key={att.id}>
                      <td><StatusBadge status={att.status} /></td>
                      <td style={{fontSize:12,color:'var(--text-dim)'}}>
                        {att.responseStatusCode ? att.responseStatusCode : '—'}
                      </td>
                      <td className="mono" style={{fontSize:11,color:'var(--text-dim)'}}>{att.msgId}</td>
                      <td className="mono" style={{fontSize:11,color:'var(--text-dim)'}}>{att.endpointId}</td>
                      <td style={{fontSize:12,color:'var(--text-dim)'}}>{new Date(att.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </>
  );
}
