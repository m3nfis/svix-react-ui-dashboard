// ── Webhooks: endpoints UI ─────────────────────────────────────────────
// Depends: webhooks-core.jsx; webhooks-activity.jsx (MessageDetail)

function EndpointsPanel() {
  const cfg = useSvixConfig();
  const [endpoints, setEndpoints] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    svix('GET', 'app/endpoint/')
      .then(d => setEndpoints(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (selectedId) {
    return <EndpointDetail id={selectedId} onBack={() => { setSelectedId(null); load(); }} />;
  }

  const ctxItems = (ep) => {
    const items = [];
    if (cfg.endpoints.disable) items.push({ label: ep.disabled ? 'Enable' : 'Disable', onClick: () =>
      svix('PATCH', `app/endpoint/${ep.id}/`, { disabled: !ep.disabled }).then(load).catch(() => {})
    });
    if (cfg.endpoints.delete) items.push({ label: 'Delete', danger: true, onClick: () => {
      if (confirm('Delete this endpoint?'))
        svix('DELETE', `app/endpoint/${ep.id}/`).then(load).catch(() => {});
    }});
    return items;
  };

  return (
    <>
      <div className="wh-toolbar">
        <h3>Webhook Endpoints</h3>
        {cfg.endpoints.create && (
          <button className="btn-sm" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Add Endpoint'}
          </button>
        )}
      </div>
      {showAdd && <AddEndpointForm onDone={() => { setShowAdd(false); load(); }} />}
      {loading ? (
        <div className="wh-empty"><p>Loading endpoints...</p></div>
      ) : endpoints.length === 0 ? (
        <div className="wh-empty">
          <p>No endpoints yet</p>
          <p>Add your first webhook endpoint to start receiving events</p>
        </div>
      ) : (
        <div className="wh-table-wrap"><table className="wh-table">
          <thead><tr><th>URL</th><th>Description</th><th>Status</th><th>Created</th><th style={{width:36}}></th></tr></thead>
          <tbody>
            {endpoints.map(ep => (
              <tr key={ep.id} onClick={() => setSelectedId(ep.id)} style={{cursor:'pointer'}}>
                <td><button className="wh-url" style={{background:'none',border:'none',padding:0,cursor:'pointer',textAlign:'left',font:'inherit'}}
                  onClick={e => { e.stopPropagation(); setSelectedId(ep.id); }}>{ep.url}</button></td>
                <td style={{color:'var(--text-dim)',fontSize:12}}>{ep.description || '—'}</td>
                <td>{ep.disabled
                  ? <span className="badge badge-planned">Disabled</span>
                  : <span className="badge badge-active">Active</span>}
                </td>
                <td style={{color:'var(--text-dim)',fontSize:12}}>{new Date(ep.createdAt).toLocaleDateString()}</td>
                <td>{ctxItems(ep).length > 0 && <ContextMenu items={ctxItems(ep)} />}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <div style={{color:'var(--text-dim)',fontSize:12,marginTop:12}}>
        {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
      </div>
    </>
  );
}

function AddEndpointForm({ onDone }) {
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [filterInput, setFilterInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const body = { url };
      if (desc) body.description = desc;
      const filters = filterInput.split(',').map(s => s.trim()).filter(Boolean);
      if (filters.length) body.filterTypes = filters;
      await svix('POST', 'app/endpoint/', body);
      onDone();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <form className="wh-form" onSubmit={submit}>
      {error && <div className="error-banner">{error}</div>}
      <div className="wh-grid-2" style={{marginBottom:12}}>
        <div className="field">
          <label>Endpoint URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-server.com/webhook" required />
        </div>
        <div className="field">
          <label>Description</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" />
        </div>
      </div>
      <div className="field" style={{marginBottom:12}}>
        <label>Filter Event Types (comma-separated, leave empty for all)</label>
        <input value={filterInput} onChange={e => setFilterInput(e.target.value)} placeholder="user.created, order.completed" />
      </div>
      <button type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add Endpoint'}</button>
    </form>
  );
}

function EndpointDetail({ id, onBack }) {
  const cfg = useSvixConfig();
  const [ep, setEp] = useState(null);
  const [secret, setSecret] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [subTab, setSubTab] = useState('overview');
  const [attemptFilter, setAttemptFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFilters, setEditFilters] = useState('');
  const [replayAtt, setReplayAtt] = useState(null);
  const [showRecoverFailed, setShowRecoverFailed] = useState(false);
  const [showReplayMissing, setShowReplayMissing] = useState(false);
  const [showBulkReplay, setShowBulkReplay] = useState(false);
  const [viewingMsg, setViewingMsg] = useState(null);

  const openMessage = async (msgId) => {
    try {
      const msg = await svix('GET', `app/msg/${msgId}/`);
      setViewingMsg(msg);
    } catch (err) { alert('Could not load message: ' + err.message); }
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      svix('GET', `app/endpoint/${id}/`),
      svix('GET', `app/endpoint/${id}/secret/`).catch(() => null),
      svix('GET', `app/attempt/endpoint/${id}/`).catch(() => ({ data: [] })),
    ]).then(([endpoint, sec, att]) => {
      setEp(endpoint);
      setSecret(sec);
      setAttempts(att.data || []);
    }).catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const rotateSecret = async () => {
    if (!confirm('Rotate signing secret? The old secret will immediately stop working.')) return;
    try {
      const sec = await svix('POST', `app/endpoint/${id}/secret/rotate/`, {});
      setSecret(sec);
      setShowSecret(true);
    } catch (err) { alert(err.message); }
  };

  const saveEdit = async () => {
    try {
      const body = { url: editUrl, description: editDesc };
      const filters = editFilters.split(',').map(s => s.trim()).filter(Boolean);
      body.filterTypes = filters.length ? filters : null;
      await svix('PATCH', `app/endpoint/${id}/`, body);
      setEditing(false);
      load();
    } catch (err) { alert(err.message); }
  };

  const toggleDisabled = async () => {
    try {
      await svix('PATCH', `app/endpoint/${id}/`, { disabled: !ep.disabled });
      load();
    } catch (err) { alert(err.message); }
  };

  const copyText = (text) => navigator.clipboard.writeText(text).catch(() => {});

  if (loading) return <div className="wh-empty"><p>Loading endpoint details...</p></div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!ep) return <div className="error-banner">Endpoint not found</div>;

  if (viewingMsg) {
    return React.createElement(MessageDetail, {
      msg: viewingMsg,
      onBack: () => setViewingMsg(null),
    });
  }

  if (showBulkReplay) {
    return <BulkReplayView endpointId={id} onBack={() => { setShowBulkReplay(false); load(); }} />;
  }

  const successCount = attempts.filter(a => a.status === 0).length;
  const failCount = attempts.filter(a => a.status === 2).length;
  const pendingCount = attempts.filter(a => a.status === 1 || a.status === 3).length;
  const totalAttempts = attempts.length;

  const headerMenuItems = [];
  if (cfg.messages.recoverFailed) headerMenuItems.push({ label: 'Recover failed messages...', onClick: () => setShowRecoverFailed(true) });
  if (cfg.messages.replayMissing) headerMenuItems.push({ label: 'Replay missing messages...', onClick: () => setShowReplayMissing(true) });
  if (cfg.messages.bulkReplay) headerMenuItems.push({ label: 'Bulk replay messages...', onClick: () => setShowBulkReplay(true) });
  if (cfg.endpoints.disable) headerMenuItems.push({ label: ep.disabled ? 'Enable Endpoint' : 'Disable Endpoint', onClick: toggleDisabled });
  if (cfg.endpoints.delete) headerMenuItems.push({ label: 'Delete', danger: true, onClick: () => {
    if (confirm('Delete this endpoint? This cannot be undone.'))
      svix('DELETE', `app/endpoint/${id}/`).then(onBack).catch(err => alert(err.message));
  }});

  const attemptMenuItems = (att) => {
    const items = [{ label: 'View message', onClick: () => openMessage(att.msgId) }];
    if (cfg.messages.replay) items.push({ label: 'Replay...', onClick: () => setReplayAtt(att) });
    return items;
  };

  const detailSubTabs = [['overview', 'Overview']];
  if (cfg.endpoints.testWebhook) detailSubTabs.push(['testing', 'Testing']);
  if (cfg.endpoints.rateLimiting || cfg.endpoints.customHeaders || cfg.endpoints.channels) detailSubTabs.push(['advanced', 'Advanced']);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <a onClick={onBack} style={{cursor:'pointer',color:'var(--accent)',fontSize:13}}>← Back to Endpoints</a>
        {headerMenuItems.length > 0 && <ContextMenu items={headerMenuItems} />}
      </div>

      <div style={{marginBottom:20}}>
        {editing ? (
          <div className="wh-form" style={{marginBottom:0}}>
            <div className="wh-grid-2" style={{marginBottom:12}}>
              <div className="field"><label>URL</label><input value={editUrl} onChange={e => setEditUrl(e.target.value)} /></div>
              <div className="field"><label>Description</label><input value={editDesc} onChange={e => setEditDesc(e.target.value)} /></div>
            </div>
            <div className="field" style={{marginBottom:12}}>
              <label>Filter Events (comma-separated)</label>
              <input value={editFilters} onChange={e => setEditFilters(e.target.value)} placeholder="Leave empty for all" />
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn-sm" onClick={saveEdit}>Save</button>
              <button className="btn-sm btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div className="wh-url" style={{fontSize:15,marginBottom:4}}>{ep.url}</div>
              <div style={{color:'var(--text-dim)',fontSize:13}}>{ep.description || 'No description'}</div>
            </div>
            {cfg.endpoints.edit && (
              <button className="btn-sm btn-ghost" onClick={() => {
                setEditUrl(ep.url); setEditDesc(ep.description || '');
                setEditFilters((ep.filterTypes || []).join(', '));
                setEditing(true);
              }}>Edit</button>
            )}
          </div>
        )}
      </div>

      <div className="wh-detail-layout">
        <div className="wh-detail-main">
          <div className="wh-tabs">
            {detailSubTabs.map(([k, label]) => (
              <button key={k} className={`wh-tab ${subTab===k?'active':''}`} onClick={() => setSubTab(k)}>{label}</button>
            ))}
          </div>

          {subTab === 'overview' && (
            <>
              <div className="wh-api-card">
                <h4>Delivery Stats</h4>
                <div style={{display:'flex',gap:32,marginTop:8}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:24,fontWeight:700,color:'var(--green)'}}>{successCount}</div>
                    <div style={{fontSize:11,color:'var(--text-dim)'}}>Successful</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:24,fontWeight:700,color:'var(--red)'}}>{failCount}</div>
                    <div style={{fontSize:11,color:'var(--text-dim)'}}>Failed</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:24,fontWeight:700,color:'var(--yellow)'}}>{pendingCount}</div>
                    <div style={{fontSize:11,color:'var(--text-dim)'}}>Pending</div>
                  </div>
                </div>
                {totalAttempts > 0 && (
                  <div style={{marginTop:12,height:6,borderRadius:3,background:'var(--border)',overflow:'hidden',display:'flex'}}>
                    <div style={{width:`${(successCount/totalAttempts)*100}%`,background:'var(--green)'}} />
                    <div style={{width:`${(failCount/totalAttempts)*100}%`,background:'var(--red)'}} />
                  </div>
                )}
              </div>

              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:20,marginBottom:8}}>
                <h4 style={{marginRight:'auto'}}>Message Attempts</h4>
                <button className="btn-sm btn-ghost" style={{padding:'4px 8px',fontSize:11}} onClick={load}>↻</button>
                {['all','succeeded','failed'].map(f => (
                  <button key={f} className={`btn-sm ${attemptFilter===f?'':'btn-ghost'}`}
                    style={{padding:'4px 12px',fontSize:11}}
                    onClick={() => setAttemptFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {(() => {
                const filtered = attemptFilter === 'all' ? attempts
                  : attemptFilter === 'succeeded' ? attempts.filter(a => a.status === 0)
                  : attempts.filter(a => a.status === 2);
                return filtered.length === 0 ? (
                  <div className="wh-empty"><p>{attemptFilter === 'all' ? 'No delivery attempts yet' : `No ${attemptFilter} attempts`}</p></div>
                ) : (
                  <div className="wh-table-wrap"><table className="wh-table">
                    <thead><tr><th>Status</th><th>HTTP</th><th>Message ID</th><th>Timestamp</th><th></th></tr></thead>
                    <tbody>
                      {filtered.map(att => (
                        <tr key={att.id}>
                          <td><StatusBadge status={att.status} /></td>
                          <td style={{fontSize:12,color:'var(--text-dim)'}}>
                            {att.responseStatusCode ? att.responseStatusCode : '—'}
                          </td>
                          <td className="mono" style={{fontSize:11}}>
                            <a onClick={() => openMessage(att.msgId)} style={{cursor:'pointer',color:'var(--accent)',textDecoration:'none'}}>{att.msgId}</a>
                          </td>
                          <td style={{fontSize:12,color:'var(--text-dim)'}}>{new Date(att.timestamp).toLocaleString()}</td>
                          <td><ContextMenu items={attemptMenuItems(att)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                );
              })()}
              {(cfg.messages.recoverFailed || cfg.messages.replayMissing) && (
                <div style={{marginTop:12,display:'flex',gap:8}}>
                  {cfg.messages.recoverFailed && <button className="btn-sm btn-ghost" onClick={() => setShowRecoverFailed(true)}>Recover Failed</button>}
                  {cfg.messages.replayMissing && <button className="btn-sm btn-ghost" onClick={() => setShowReplayMissing(true)}>Replay Missing</button>}
                </div>
              )}
            </>
          )}

          {subTab === 'testing' && <EndpointTesting endpointId={id} onSent={load} />}
          {subTab === 'advanced' && <EndpointAdvanced ep={ep} id={id} onUpdate={load} />}
        </div>

        <div className="wh-detail-sidebar">
          <div className="wh-api-card" style={{padding:20}}>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Status</div>
              {ep.disabled
                ? <span className="badge badge-planned">Disabled</span>
                : <span className="badge badge-active">Active</span>}
              {cfg.endpoints.disable && (
                <button className="btn-sm btn-ghost" style={{marginLeft:8,padding:'3px 8px',fontSize:10}}
                  onClick={toggleDisabled}>{ep.disabled ? 'Enable' : 'Disable'}</button>
              )}
            </div>

            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Version</div>
              <div style={{fontSize:13}}>{ep.version || 1}</div>
            </div>

            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Rate Limit</div>
              <div style={{fontSize:13}}>{ep.rateLimit ? `${ep.rateLimit}/s` : 'None'}</div>
            </div>

            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Created</div>
              <div style={{fontSize:13}}>{new Date(ep.createdAt).toLocaleString()}</div>
            </div>

            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Last Updated</div>
              <div style={{fontSize:13}}>{new Date(ep.updatedAt).toLocaleString()}</div>
            </div>

            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Subscribed Events</div>
              {(!ep.filterTypes || ep.filterTypes.length === 0)
                ? <div style={{fontSize:13,color:'var(--text-dim)'}}>All events</div>
                : ep.filterTypes.map(t => (
                    <div key={t} style={{fontSize:12,marginBottom:2}}>
                      <code style={{fontSize:11,background:'var(--bg)',padding:'2px 6px',borderRadius:4}}>{t}</code>
                    </div>
                  ))
              }
            </div>

            <div>
              <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:4}}>Signing Secret</div>
              <div className="mono" style={{fontSize:11,wordBreak:'break-all',marginBottom:8}}>
                {showSecret && secret ? secret.key : '••••••••••••••••••'}
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                <button className="btn-sm btn-ghost" style={{padding:'3px 8px',fontSize:10}} onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? 'Hide' : 'Show'}
                </button>
                {showSecret && secret && (
                  <button className="btn-sm btn-ghost" style={{padding:'3px 8px',fontSize:10}} onClick={() => copyText(secret.key)}>Copy</button>
                )}
                {cfg.endpoints.rotateSecret && (
                  <button className="btn-sm btn-ghost" style={{padding:'3px 8px',fontSize:10,color:'var(--yellow)'}} onClick={rotateSecret}>Rotate</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {cfg.messages.replay && (
        <ReplayMessageModal open={!!replayAtt} onClose={() => setReplayAtt(null)}
          attempt={replayAtt} endpointId={id} onDone={() => setTimeout(load, 1000)} />
      )}

      {cfg.messages.recoverFailed && (
        <TimePresetModal open={showRecoverFailed} onClose={() => setShowRecoverFailed(false)}
          title="Recover Failed Messages"
          description="This operation will cause all failed messages to this endpoint to be resent."
          actionLabel="Recover"
          onSubmit={async (since) => {
            await svix('POST', `app/endpoint/${id}/recover/`, { since });
            setTimeout(load, 2000);
          }} />
      )}

      {cfg.messages.replayMissing && (
        <TimePresetModal open={showReplayMissing} onClose={() => setShowReplayMissing(false)}
          title="Replay Missing Messages"
          description="This operation will cause all messages that were never attempted for this endpoint to be resent."
          actionLabel="Replay"
          onSubmit={async (since) => {
            await svix('POST', `app/endpoint/${id}/replay-missing/`, { since });
            setTimeout(load, 2000);
          }} />
      )}
    </div>
  );
}

function EndpointTesting({ endpointId, onSent }) {
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [payload, setPayload] = useState('{\n  "message": "test webhook"\n}');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    svix('GET', 'event-type/').then(d => setEventTypes(d.data || [])).catch(() => {});
  }, []);

  const send = async () => {
    setSending(true); setResult(null);
    try {
      let parsed;
      try { parsed = JSON.parse(payload); }
      catch { setResult({ error: 'Invalid JSON payload' }); setSending(false); return; }
      const data = await svix('POST', 'app/msg/', {
        eventType: selectedType || 'test.event',
        payload: parsed,
      });
      setResult({ ok: true, id: data.id });
      if (onSent) setTimeout(onSent, 1500);
    } catch (err) { setResult({ error: err.message }); }
    finally { setSending(false); }
  };

  return (
    <div className="wh-api-card">
      <h4>Send Test Webhook</h4>
      <p style={{fontSize:13,color:'var(--text-dim)',marginBottom:16}}>
        Send a test message to all subscribed endpoints or this specific endpoint.
      </p>
      <div className="field" style={{marginBottom:16}}>
        <label style={{display:'block',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:6}}>Event Type</label>
        <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
          <option value="">test.event (default)</option>
          {eventTypes.map(et => <option key={et.name} value={et.name}>{et.name}</option>)}
        </select>
      </div>
      <div className="field" style={{marginBottom:16}}>
        <label style={{display:'block',fontSize:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:6}}>Payload (JSON)</label>
        <textarea value={payload} onChange={e => setPayload(e.target.value)} className="mono" style={{minHeight:140,fontSize:12}} />
      </div>
      <button onClick={send} disabled={sending}>{sending ? 'Sending...' : 'Send Example'}</button>
      {result && (
        <div style={{marginTop:12,fontSize:13,color: result.error ? 'var(--red)' : 'var(--green)'}}>
          {result.error ? `Error: ${result.error}` : `Message sent successfully (${result.id})`}
        </div>
      )}
    </div>
  );
}

function EndpointAdvanced({ ep, id, onUpdate }) {
  const cfg = useSvixConfig();
  const [rateLimit, setRateLimit] = useState(ep.rateLimit || '');
  const [headers, setHeaders] = useState(ep.headers || {});
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderVal, setNewHeaderVal] = useState('');
  const [channels, setChannels] = useState((ep.channels || []).join(', '));
  const [saving, setSaving] = useState(false);

  const saveRateLimit = async () => {
    setSaving(true);
    try {
      await svix('PATCH', `app/endpoint/${id}/`, { rateLimit: rateLimit ? parseInt(rateLimit) : null });
      onUpdate();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const addHeader = async () => {
    if (!newHeaderKey.trim()) return;
    try {
      const updated = { ...headers, [newHeaderKey.trim()]: newHeaderVal };
      await svix('PATCH', `app/endpoint/${id}/`, { headers: updated });
      setHeaders(updated);
      setNewHeaderKey(''); setNewHeaderVal('');
      onUpdate();
    } catch (err) { alert(err.message); }
  };

  const removeHeader = async (key) => {
    const updated = { ...headers };
    delete updated[key];
    try {
      await svix('PATCH', `app/endpoint/${id}/`, { headers: updated });
      setHeaders(updated);
      onUpdate();
    } catch (err) { alert(err.message); }
  };

  const saveChannels = async () => {
    setSaving(true);
    try {
      const ch = channels.split(',').map(s => s.trim()).filter(Boolean);
      await svix('PATCH', `app/endpoint/${id}/`, { channels: ch.length ? ch : null });
      onUpdate();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="wh-api-card" style={{marginBottom:16}}>
        <h4>Retry Policy</h4>
        <p style={{fontSize:12,color:'var(--text-dim)',marginBottom:12}}>
          Failed deliveries (non-2xx response or timeout after 15s) are automatically retried with exponential backoff.
        </p>
        <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap',margin:'4px 0 12px'}}>
          {DEFAULT_RETRY_SCHEDULE.map((s, i) => (
            React.createElement(React.Fragment, {key: i},
              i > 0 && React.createElement('span', {style:{color:'var(--text-dim)',fontSize:10}}, '→'),
              React.createElement('span', {style:{fontSize:11,padding:'3px 8px',borderRadius:6,background:'rgba(124,92,252,0.12)',color:'var(--accent)',fontWeight:600,fontFamily:'monospace'}}, formatRetryInterval(s))
            )
          ))}
        </div>
        <div style={{fontSize:12,color:'var(--text-dim)',lineHeight:1.6}}>
          After {DEFAULT_RETRY_SCHEDULE.length} retries, the message is marked as <strong style={{color:'var(--red)'}}>Failed</strong>.
          {' '}Endpoints failing for 5 consecutive days are automatically disabled.
        </div>
        <div style={{fontSize:12,color:'var(--accent)',marginTop:12,padding:'8px 12px',background:'rgba(124,92,252,0.08)',borderRadius:8}}>
          Custom retry schedules can be configured per event type in the <strong>Event Catalog</strong> tab.
        </div>
      </div>

      {cfg.endpoints.rateLimiting && <div className="wh-api-card" style={{marginBottom:16}}>
        <h4>Rate Limiting</h4>
        <p style={{fontSize:12,color:'var(--text-dim)',marginBottom:12}}>
          Limit the number of webhook deliveries per second to this endpoint.
        </p>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input value={rateLimit} onChange={e => setRateLimit(e.target.value)}
            placeholder="e.g. 100" type="number" style={{width:120,padding:'6px 10px',fontSize:13}} />
          <span style={{fontSize:12,color:'var(--text-dim)'}}>requests/second</span>
          <button className="btn-sm" onClick={saveRateLimit} disabled={saving}>Save</button>
        </div>
      </div>}

      {cfg.endpoints.customHeaders && <div className="wh-api-card" style={{marginBottom:16}}>
        <h4>Custom Headers</h4>
        <p style={{fontSize:12,color:'var(--text-dim)',marginBottom:12}}>
          Add custom HTTP headers sent with every webhook delivery to this endpoint.
        </p>
        {Object.entries(headers).length > 0 && (
          <div style={{marginBottom:12}}>
            {Object.entries(headers).map(([k, v]) => (
              <div key={k} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,
                padding:'6px 10px',background:'var(--bg)',borderRadius:6}}>
                <code style={{fontSize:12,flex:1}}>{k}: {v}</code>
                <button className="btn-sm btn-ghost" style={{padding:'2px 8px',fontSize:10,color:'var(--red)'}}
                  onClick={() => removeHeader(k)}>Remove</button>
              </div>
            ))}
          </div>
        )}
        <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:'var(--text-dim)',marginBottom:4}}>Header name</div>
            <input value={newHeaderKey} onChange={e => setNewHeaderKey(e.target.value)}
              placeholder="X-Custom-Header" style={{padding:'6px 10px',fontSize:12}} />
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:'var(--text-dim)',marginBottom:4}}>Value</div>
            <input value={newHeaderVal} onChange={e => setNewHeaderVal(e.target.value)}
              placeholder="header-value" style={{padding:'6px 10px',fontSize:12}} />
          </div>
          <button className="btn-sm" onClick={addHeader}>Add</button>
        </div>
      </div>}

      {cfg.endpoints.channels && <div className="wh-api-card">
        <h4>Channels</h4>
        <p style={{fontSize:12,color:'var(--text-dim)',marginBottom:12}}>
          Restrict this endpoint to only receive messages sent to specific channels.
          Leave empty to receive all messages.
        </p>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input value={channels} onChange={e => setChannels(e.target.value)}
            placeholder="channel1, channel2" style={{flex:1,padding:'6px 10px',fontSize:13}} />
          <button className="btn-sm" onClick={saveChannels} disabled={saving}>Save</button>
        </div>
      </div>}
    </>
  );
}
