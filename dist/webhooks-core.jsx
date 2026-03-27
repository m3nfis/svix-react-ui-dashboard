// ── Webhooks shared primitives ─────────────────────────────────────────

function svix(method, path, body) {
  const opts = { method };
  if (body) opts.body = JSON.stringify(body);
  return api(`/api/webhooks/svix/${path}`, opts);
}

const ATTEMPT_STATUS = {
  0: { label: 'Success', color: 'var(--green)', bg: 'rgba(52,211,153,0.15)' },
  1: { label: 'Pending', color: 'var(--yellow)', bg: 'rgba(251,191,36,0.15)' },
  2: { label: 'Failed',  color: 'var(--red)',    bg: 'rgba(248,113,113,0.15)' },
  3: { label: 'Sending', color: 'var(--blue)',   bg: 'rgba(96,165,250,0.15)' },
};

function StatusBadge({ status }) {
  const s = ATTEMPT_STATUS[status] || ATTEMPT_STATUS[0];
  return (
    <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:12,background:s.bg,color:s.color}}>
      {s.label}
    </span>
  );
}

const DEFAULT_RETRY_SCHEDULE = [5, 300, 1800, 7200, 18000, 36000, 36000];
function formatRetryInterval(seconds) {
  if (seconds < 60) return seconds + 's';
  if (seconds < 3600) return Math.round(seconds / 60) + 'm';
  return Math.round(seconds / 3600) + 'h';
}

function ContextMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <button className="btn-sm btn-ghost" onClick={e => { e.stopPropagation(); setOpen(!open); }}
        style={{padding:'2px 8px',fontSize:16,lineHeight:1}}>⋮</button>
      {open && (
        <div style={{position:'absolute',right:0,top:'100%',zIndex:50,minWidth:140,
          background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,
          boxShadow:'0 4px 12px rgba(0,0,0,0.15)',padding:'4px 0',marginTop:4}}>
          {items.map((item, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); item.onClick(); setOpen(false); }}
              style={{display:'block',width:'100%',textAlign:'left',padding:'8px 14px',fontSize:12,
                border:'none',background:'none',cursor:'pointer',
                color: item.danger ? 'var(--red)' : 'var(--text)'}}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    React.createElement('div', { className: 'modal-overlay', onClick: (e) => { if (e.target === e.currentTarget) onClose(); } },
      React.createElement('div', { className: 'modal-box' },
        React.createElement('button', { className: 'modal-close', onClick: onClose }, '×'),
        title && React.createElement('h3', null, title),
        children,
        footer && React.createElement('div', { className: 'modal-footer' }, footer)
      )
    ),
    document.body
  );
}

const TIME_PRESETS = [
  { label: '8 hours ago', hours: 8 },
  { label: 'Yesterday', hours: 24 },
  { label: '3 days ago', hours: 72 },
  { label: 'Last week', hours: 168 },
  { label: '2 weeks ago', hours: 336 },
];

function fmtPreset(hours) {
  const d = new Date(Date.now() - hours * 3600000);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    + ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function TimePresetModal({ open, onClose, title, description, actionLabel, onSubmit }) {
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);

  const doSubmit = async () => {
    setBusy(true);
    const since = new Date(Date.now() - TIME_PRESETS[selected].hours * 3600000).toISOString();
    try { await onSubmit(since); onClose(); }
    catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} footer={<>
      <button className="btn-sm btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn-sm" onClick={doSubmit} disabled={busy}>{busy ? 'Working...' : actionLabel}</button>
    </>}>
      <p style={{color:'var(--text-dim)',fontSize:13,margin:'8px 0 20px',lineHeight:1.5}}>{description}</p>
      {TIME_PRESETS.map((p, i) => (
        <div key={i} className={`option-card ${selected===i?'selected':''}`} onClick={() => setSelected(i)}>
          <h4>{p.label}</h4>
          <p>Since {fmtPreset(p.hours)}</p>
        </div>
      ))}
    </Modal>
  );
}

function ReplayMessageModal({ open, onClose, attempt, endpointId, onDone }) {
  const [selected, setSelected] = useState('single');
  const [busy, setBusy] = useState(false);

  if (!attempt) return null;

  const doReplay = async () => {
    setBusy(true);
    try {
      if (selected === 'single') {
        await svix('POST', `app/msg/${attempt.msgId}/endpoint/${endpointId}/resend/`, {});
      } else if (selected === 'failed') {
        await svix('POST', `app/endpoint/${endpointId}/recover/`, { since: attempt.timestamp });
      } else {
        await svix('POST', `app/endpoint/${endpointId}/replay-missing/`, { since: attempt.timestamp });
      }
      onDone();
      onClose();
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const ts = new Date(attempt.timestamp);
  const fmtTs = ts.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
    + ' at ' + ts.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

  return (
    <Modal open={open} onClose={onClose} title="Replay Messages" footer={<>
      <button className="btn-sm btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn-sm" onClick={doReplay} disabled={busy}>{busy ? 'Working...' : 'Replay'}</button>
    </>}>
      <div style={{marginTop:20}}>
        <div className={`option-card ${selected==='single'?'selected':''}`} onClick={() => setSelected('single')}>
          <h4>Replay this message (<code>{attempt.msgId?.slice(4,10)}</code>)</h4>
          <p>Replay just this message</p>
        </div>
        <div className={`option-card ${selected==='failed'?'selected':''}`} onClick={() => setSelected('failed')}>
          <h4>Replay all failed messages since</h4>
          <p>Resend all failed messages since {fmtTs}.</p>
        </div>
        <div className={`option-card ${selected==='missing'?'selected':''}`} onClick={() => setSelected('missing')}>
          <h4>Replay all missing messages since</h4>
          <p>Replay messages never attempted for this endpoint since {fmtTs}.</p>
        </div>
      </div>
    </Modal>
  );
}

function BulkReplayView({ endpointId, onBack }) {
  const [since, setSince] = useState(() => {
    const d = new Date(Date.now() - 14 * 24 * 3600000);
    return d.toISOString().slice(0, 16);
  });
  const [until, setUntil] = useState(() => new Date().toISOString().slice(0, 16));
  const [eventTypes, setEventTypes] = useState([]);
  const [allEventTypes, setAllEventTypes] = useState([]);
  const [typeSearch, setTypeSearch] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [tag, setTag] = useState('');
  const [msgStatus, setMsgStatus] = useState('all');
  const [responseCode, setResponseCode] = useState('all');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    svix('GET', 'event-type/').then(d => setAllEventTypes(d.data || [])).catch(() => {});
  }, []);

  const toggleType = (name) => {
    setEventTypes(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]);
  };

  const grouped = {};
  (allEventTypes || []).forEach(et => {
    const parts = et.name.split('.');
    const prefix = parts.length > 1 ? parts[0] : '_root';
    if (!grouped[prefix]) grouped[prefix] = [];
    grouped[prefix].push(et);
  });

  const filteredTypes = allEventTypes.filter(et =>
    !typeSearch || et.name.toLowerCase().includes(typeSearch.toLowerCase())
  );

  const doReplay = async () => {
    if (!confirm('Start bulk replay? This will include messages that have already been sent successfully.')) return;
    setBusy(true);
    try {
      const body = {
        since: new Date(since).toISOString(),
        until: new Date(until).toISOString(),
      };
      if (eventTypes.length) body.eventTypes = eventTypes;
      await svix('POST', `app/endpoint/${endpointId}/replay-missing/`, body);
      alert('Bulk replay started. Check Activity tab to monitor progress.');
      onBack();
    } catch (err) { alert('Replay failed: ' + err.message); }
    finally { setBusy(false); }
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
      + ' at ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  };

  return (
    <div>
      <div style={{marginBottom:16}}>
        <a onClick={onBack} style={{cursor:'pointer',color:'var(--accent)',fontSize:13}}>← Back to Endpoint</a>
        <span style={{color:'var(--text-dim)',fontSize:13}}> › Bulk Replay</span>
      </div>

      <div className="wh-api-card" style={{maxWidth:700}}>
        <h3 style={{fontSize:18,fontWeight:700,marginBottom:8}}>Bulk Replay Messages</h3>
        <p style={{color:'var(--text-dim)',fontSize:13,lineHeight:1.5,marginBottom:24}}>
          Replay messages on the endpoint with the given filters. This will include messages that have already been sent successfully.
        </p>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',marginBottom:6}}>Since</div>
            <input type="datetime-local" value={since} onChange={e => setSince(e.target.value)}
              style={{width:'100%',padding:'8px 12px',fontSize:13}} />
            <div style={{fontSize:11,color:'var(--text-dim)',marginTop:4}}>{fmtDate(since)}</div>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',marginBottom:6}}>Until</div>
            <input type="datetime-local" value={until} onChange={e => setUntil(e.target.value)}
              style={{width:'100%',padding:'8px 12px',fontSize:13}} />
            <div style={{fontSize:11,color:'var(--text-dim)',marginTop:4}}>{fmtDate(until)}</div>
          </div>
        </div>

        <div style={{marginBottom:24}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',marginBottom:8}}>Event Types</div>
          <input value={typeSearch} onChange={e => setTypeSearch(e.target.value)}
            placeholder="Search events..." style={{marginBottom:8,padding:'8px 12px',fontSize:13}} />
          <div style={{border:'1px solid var(--border)',borderRadius:8,padding:12,maxHeight:200,overflowY:'auto',background:'var(--bg)'}}>
            {Object.keys(grouped).length === 0 ? (
              <div style={{color:'var(--text-dim)',fontSize:12}}>No event types defined</div>
            ) : Object.entries(grouped).map(([prefix, types]) => (
              <div key={prefix} style={{marginBottom:8}}>
                {prefix !== '_root' && (
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:4}}>
                    <input type="checkbox"
                      checked={types.every(t => eventTypes.includes(t.name))}
                      onChange={() => {
                        const names = types.map(t => t.name);
                        const allSelected = names.every(n => eventTypes.includes(n));
                        setEventTypes(prev => allSelected ? prev.filter(n => !names.includes(n)) : [...new Set([...prev, ...names])]);
                      }}
                      style={{width:'auto',accentColor:'var(--accent)'}} />
                    <span style={{fontSize:13,fontWeight:600}}>{prefix}</span>
                  </label>
                )}
                {types.filter(t => !typeSearch || t.name.toLowerCase().includes(typeSearch.toLowerCase())).map(t => (
                  <label key={t.name} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',
                    paddingLeft: prefix !== '_root' ? 24 : 0, marginBottom:2}}>
                    <input type="checkbox" checked={eventTypes.includes(t.name)}
                      onChange={() => toggleType(t.name)}
                      style={{width:'auto',accentColor:'var(--accent)'}} />
                    <span style={{fontSize:12}}>{prefix !== '_root' ? t.name.slice(prefix.length + 1) : t.name}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:'var(--text-dim)',marginTop:6}}>
            {eventTypes.length === 0 ? 'Using all event types.' : `${eventTypes.length} selected.`}
            {eventTypes.length > 0 && (
              <a onClick={() => setEventTypes([])} style={{cursor:'pointer',color:'var(--accent)',marginLeft:4}}>Clear</a>
            )}
          </div>
        </div>

        <details open={showMore} onToggle={e => setShowMore(e.target.open)}>
          <summary style={{cursor:'pointer',fontSize:14,fontWeight:600,marginBottom:16,color:'var(--text)',
            borderTop:'1px solid var(--border)',paddingTop:16}}>More options</summary>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',marginBottom:6}}>Tag</div>
            <input value={tag} onChange={e => setTag(e.target.value)} placeholder="Tag name"
              style={{padding:'8px 12px',fontSize:13}} />
            <div style={{fontSize:11,color:'var(--text-dim)',marginTop:4}}>Replay messages with a specific tag.</div>
          </div>

          <div style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',marginBottom:8}}>Message Status</div>
            <div className="pill-group">
              {['all','succeeded','failed'].map(s => (
                <button key={s} className={`pill-btn ${msgStatus===s?'active':''}`}
                  onClick={() => setMsgStatus(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          </div>

          <div style={{marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--text-dim)',marginBottom:8}}>Response Status Code</div>
            <div className="pill-group">
              {['all','1xx','2xx','3xx','4xx','5xx','No code'].map(s => (
                <button key={s} className={`pill-btn ${responseCode===s?'active':''}`}
                  onClick={() => setResponseCode(s)}>{s === 'all' ? 'All' : s}</button>
              ))}
            </div>
            <div style={{fontSize:11,color:'var(--text-dim)',marginTop:6}}>Filter messages based on the status code of the endpoint response.</div>
          </div>
        </details>

        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:24,paddingTop:16,borderTop:'1px solid var(--border)'}}>
          <button className="btn-sm btn-ghost" onClick={onBack}>Cancel</button>
          <button className="btn-sm" onClick={doReplay} disabled={busy}>{busy ? 'Replaying...' : 'Replay'}</button>
        </div>
      </div>
    </div>
  );
}
