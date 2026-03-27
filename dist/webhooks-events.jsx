// ── Webhooks: retry schedule editor & event catalog ─────────────────────
// Depends: webhooks-core.jsx (svix, DEFAULT_RETRY_SCHEDULE, formatRetryInterval)

function RetryScheduleEditor({ eventTypeName }) {
  const cfg = useSvixConfig();
  const [schedule, setSchedule] = useState(null);
  const [isCustom, setIsCustom] = useState(false);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    svix('GET', `event-type/${eventTypeName}/retry-schedule/`)
      .then(d => {
        setSchedule(d.retrySchedule || null);
        setIsCustom(!!d.retrySchedule);
        if (d.retrySchedule) setInput(d.retrySchedule.join(', '));
      })
      .catch(() => { setSchedule(null); setIsCustom(false); })
      .finally(() => setLoading(false));
  }, [eventTypeName]);

  const activeSchedule = schedule || DEFAULT_RETRY_SCHEDULE;

  const PRESETS = {
    aggressive: [2, 10, 30, 120, 300],
    standard: [5, 300, 1800, 7200, 18000, 36000, 36000],
    relaxed: [60, 600, 3600, 14400, 43200, 86400],
  };

  const save = async () => {
    const parsed = input.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    if (parsed.length === 0) { setError('Enter at least one interval in seconds'); return; }
    setSaving(true); setError('');
    try {
      await svix('PUT', `event-type/${eventTypeName}/retry-schedule/`, { retrySchedule: parsed });
      setSchedule(parsed);
      setIsCustom(true);
      setEditing(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm('Reset to the default retry schedule?')) return;
    setSaving(true); setError('');
    try {
      await svix('PUT', `event-type/${eventTypeName}/retry-schedule/`, { retrySchedule: null });
      setSchedule(null);
      setIsCustom(false);
      setInput('');
      setEditing(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return React.createElement('div', {style:{fontSize:11,color:'var(--text-dim)',marginTop:8}}, 'Loading retry config...');

  return React.createElement('div', {style:{marginTop:10,padding:'10px 12px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}},
    React.createElement('div', {style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}},
      React.createElement('div', {style:{fontSize:12,fontWeight:600}},
        'Retry Schedule',
        isCustom && React.createElement('span', {style:{fontSize:10,marginLeft:6,padding:'1px 6px',borderRadius:4,background:'rgba(124,92,252,0.15)',color:'var(--accent)'}}, 'Custom')
      ),
      cfg.eventTypes.editRetrySchedule && React.createElement('div', {style:{display:'flex',gap:6}},
        !editing && React.createElement('button', {className:'btn-sm btn-ghost',style:{padding:'2px 8px',fontSize:10},onClick:() => { setEditing(true); if (!input) setInput(activeSchedule.join(', ')); }}, 'Edit'),
        isCustom && !editing && React.createElement('button', {className:'btn-sm btn-ghost',style:{padding:'2px 8px',fontSize:10,color:'var(--red)'},onClick:reset}, 'Reset')
      )
    ),
    React.createElement('div', {style:{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap',marginBottom:editing?10:0}},
      ...activeSchedule.map((s, i) => [
        i > 0 && React.createElement('span', {key:'a'+i,style:{color:'var(--text-dim)',fontSize:9}}, '→'),
        React.createElement('span', {key:'v'+i,style:{fontSize:10,padding:'2px 6px',borderRadius:4,background:isCustom?'rgba(124,92,252,0.12)':'rgba(255,255,255,0.06)',color:isCustom?'var(--accent)':'var(--text-dim)',fontFamily:'monospace',fontWeight:500}}, formatRetryInterval(s))
      ]).flat().filter(Boolean),
      React.createElement('span', {style:{fontSize:10,color:'var(--text-dim)',marginLeft:4}}, `(${activeSchedule.length} retries)`)
    ),
    editing && React.createElement('div', null,
      React.createElement('div', {style:{fontSize:11,color:'var(--text-dim)',marginBottom:6}},
        'Enter retry intervals in seconds (comma-separated). Each value is the delay after a failed attempt.'
      ),
      React.createElement('div', {style:{display:'flex',gap:4,marginBottom:8}},
        Object.keys(PRESETS).map(p =>
          React.createElement('button', {key:p,className:'btn-sm btn-ghost',style:{padding:'2px 8px',fontSize:10,textTransform:'capitalize'},onClick:() => setInput(PRESETS[p].join(', '))}, p)
        )
      ),
      React.createElement('div', {style:{display:'flex',gap:8,alignItems:'center'}},
        React.createElement('input', {value:input,onChange:e => setInput(e.target.value),placeholder:'5, 300, 1800, 7200',style:{flex:1,padding:'6px 10px',fontSize:12,fontFamily:'monospace'}}),
        React.createElement('button', {className:'btn-sm',onClick:save,disabled:saving}, saving ? 'Saving...' : 'Save'),
        React.createElement('button', {className:'btn-sm btn-ghost',onClick:() => setEditing(false)}, 'Cancel')
      ),
      error && React.createElement('div', {style:{fontSize:11,color:'var(--red)',marginTop:6}}, error)
    )
  );
}

function EventCatalogPanel() {
  const cfg = useSvixConfig();
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [editingType, setEditingType] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [scope, setScope] = useState('mine');

  const load = useCallback(() => {
    setLoading(true);
    svix('GET', `event-type/?scope=${scope}`)
      .then(d => setEventTypes(d.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [scope]);

  useEffect(() => { load(); }, [load]);

  const groups = {};
  eventTypes.forEach(et => {
    const parts = et.name.split('.');
    const group = parts.length > 1 ? parts[0] : 'other';
    if (!groups[group]) groups[group] = [];
    groups[group].push(et);
  });

  const handleDelete = async (name) => {
    if (!confirm(`Delete event type "${name}"?`)) return;
    try {
      await svix('DELETE', `event-type/${name}/`);
      if (selected === name) setSelected(null);
      load();
    } catch (err) { setError(err.message); }
  };

  const handleUpdateDesc = async (name) => {
    try {
      await svix('PATCH', `event-type/${name}/`, { description: editDesc });
      setEditingType(null);
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="wh-toolbar">
        <h3>Event Catalog</h3>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <div style={{display:'flex',borderRadius:6,overflow:'hidden',border:'1px solid var(--border)'}}>
            <button className={`btn-sm ${scope === 'mine' ? '' : 'btn-ghost'}`}
              style={{borderRadius:0,borderRight:'1px solid var(--border)',fontSize:11,padding:'4px 10px'}}
              onClick={() => setScope('mine')}>Mine</button>
            <button className={`btn-sm ${scope === 'all' ? '' : 'btn-ghost'}`}
              style={{borderRadius:0,fontSize:11,padding:'4px 10px'}}
              onClick={() => setScope('all')}>All</button>
          </div>
          {cfg.eventTypes.create && (
            <button className="btn-sm" onClick={() => setShowAdd(!showAdd)}>
              {showAdd ? 'Cancel' : '+ Add Event Type'}
            </button>
          )}
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {showAdd && cfg.eventTypes.create && <AddEventTypeForm onDone={() => { setShowAdd(false); load(); }} />}

      {loading ? (
        <div className="wh-empty"><p>Loading event types...</p></div>
      ) : eventTypes.length === 0 ? (
        <div className="wh-empty">
          <p>No event types defined</p>
          <p>Create event types to categorize your webhook messages</p>
        </div>
      ) : (
        <div style={{display:'flex',gap:20}}>
          <div style={{width:200,flexShrink:0}}>
            <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-dim)',marginBottom:12}}>Categories</div>
            <div onClick={() => setSelected(null)}
              style={{fontSize:12,padding:'6px 8px',borderRadius:6,cursor:'pointer',marginBottom:8,
                fontWeight:600,color: selected === null ? 'var(--accent)' : 'var(--text-dim)',
                background: selected === null ? 'rgba(124,92,252,0.12)' : 'transparent'}}>
              All ({eventTypes.length})
            </div>
            {Object.entries(groups).sort().map(([group, types]) => (
              <div key={group} style={{marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:2,color:'var(--text)',padding:'0 8px'}}>{group}</div>
                {types.map(et => (
                  <div key={et.name}
                    onClick={() => setSelected(et.name === selected ? null : et.name)}
                    style={{
                      fontSize:12,padding:'4px 8px 4px 16px',borderRadius:6,cursor:'pointer',marginBottom:1,
                      background: selected === et.name ? 'rgba(124,92,252,0.12)' : 'transparent',
                      color: selected === et.name ? 'var(--accent)' : 'var(--text-dim)',
                    }}>
                    {et.name}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{flex:1}}>
            {(selected ? eventTypes.filter(et => et.name === selected) : eventTypes).map(et => (
              <div key={et.name} className="wh-api-card" style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>
                      <code>{et.name}</code>
                    </div>
                    {editingType === et.name ? (
                      <div style={{display:'flex',gap:8,alignItems:'center',marginTop:8}}>
                        <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                          placeholder="Description" style={{flex:1,padding:'6px 10px',fontSize:13}} />
                        <button className="btn-sm" onClick={() => handleUpdateDesc(et.name)}>Save</button>
                        <button className="btn-sm btn-ghost" onClick={() => setEditingType(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{fontSize:13,color:'var(--text-dim)',cursor:'pointer'}}
                        onClick={() => { setEditingType(et.name); setEditDesc(et.description || ''); }}>
                        {et.description || 'Click to add description'}
                      </div>
                    )}
                    {et.schemas && (
                      <details style={{marginTop:8}}>
                        <summary style={{fontSize:12,color:'var(--accent)',cursor:'pointer'}}>View Schema</summary>
                        <pre style={{marginTop:8,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:8,
                          padding:12,fontSize:11,color:'var(--text-dim)',whiteSpace:'pre-wrap',overflowX:'auto'}}>
                          {JSON.stringify(et.schemas, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div style={{display:'flex',gap:6,marginLeft:12}}>
                    {cfg.eventTypes.edit && <button className="btn-sm btn-ghost" onClick={() => { setEditingType(et.name); setEditDesc(et.description || ''); }}>Edit</button>}
                    {cfg.eventTypes.delete && <button className="btn-sm btn-danger" onClick={() => handleDelete(et.name)}>Delete</button>}
                  </div>
                </div>
                <RetryScheduleEditor eventTypeName={et.name} />
                <div style={{marginTop:8,fontSize:11,color:'var(--text-dim)'}}>
                  Created: {new Date(et.createdAt).toLocaleDateString()}
                  {et.updatedAt && ` · Updated: ${new Date(et.updatedAt).toLocaleDateString()}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{color:'var(--text-dim)',fontSize:12,marginTop:12}}>
        {eventTypes.length} event type{eventTypes.length !== 1 ? 's' : ''}
      </div>
    </>
  );
}

function AddEventTypeForm({ onDone }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await svix('POST', 'event-type/', { name, description: desc || '' });
      onDone();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <form className="wh-form" onSubmit={submit}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-row">
        <div className="field">
          <label>Event Type Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. user.created" required />
        </div>
        <div className="field">
          <label>Description</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Triggered when..." />
        </div>
        <button type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add'}</button>
      </div>
    </form>
  );
}
