// ── Webhooks: health alerts banner ───────────────────────────────────────
// Depends: shared (api)

function HealthAlertsBanner() {
  const [alerts, setAlerts] = useState([]);
  const [unacked, setUnacked] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(() => {
    api('/api/webhooks/health-alerts').then(d => {
      setAlerts(d.alerts || []);
      setUnacked(d.unacknowledged || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  const ack = async (id) => {
    await api(`/api/webhooks/health-alerts/${id}/acknowledge`, { method: 'POST' }).catch(() => {});
    load();
  };
  const ackAll = async () => {
    await api('/api/webhooks/health-alerts/acknowledge-all', { method: 'POST' }).catch(() => {});
    load();
  };

  if (unacked === 0) return null;

  const active = alerts.filter(a => !a.acknowledged);
  const alertLabel = (type) =>
    type === 'endpoint.disabled' ? 'Endpoint auto-disabled' : 'All retries exhausted';
  const alertColor = (type) =>
    type === 'endpoint.disabled' ? 'var(--red)' : 'var(--yellow)';

  return (
    <div style={{
      background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.3)',
      borderRadius:12, padding:'12px 16px', marginBottom:16, flexShrink:0,
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16}}>&#9888;</span>
          <span style={{fontSize:13,fontWeight:600,color:'var(--red)'}}>
            {unacked} endpoint health alert{unacked !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn-sm btn-ghost" style={{fontSize:11,padding:'3px 10px'}}
            onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse' : 'Details'}</button>
          <button className="btn-sm btn-ghost" style={{fontSize:11,padding:'3px 10px'}}
            onClick={ackAll}>Dismiss all</button>
        </div>
      </div>
      {expanded && (
        <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:6}}>
          {active.map(a => (
            <div key={a.id} style={{
              display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'8px 12px',background:'var(--surface)',borderRadius:8,border:'1px solid var(--border)',
            }}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:alertColor(a.alert_type)}}>{alertLabel(a.alert_type)}</div>
                <div style={{fontSize:11,color:'var(--text-dim)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {a.endpoint_url || a.endpoint_id}
                  <span style={{marginLeft:8,opacity:0.6}}>{new Date(a.created_at).toLocaleString()}</span>
                </div>
              </div>
              <button className="btn-sm btn-ghost" style={{fontSize:10,padding:'2px 8px',flexShrink:0}}
                onClick={() => ack(a.id)}>Dismiss</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
