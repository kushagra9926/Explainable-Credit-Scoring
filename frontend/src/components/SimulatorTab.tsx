import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { DecisionLine, ScoreRuler, Spinner, tierLabel } from './common/ui';

interface Props { onSimulate: (platform: string, gender: string, city: string) => Promise<any>; }

export const SimulatorTab: React.FC<Props> = ({ onSimulate }) => {
  const [platform, setPlatform] = useState('delivery');
  const [gender, setGender] = useState('Female');
  const [city, setCity] = useState('Tier-2');
  const [out, setOut] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try { setOut(await onSimulate(platform, gender, city)); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const f = out?.extracted_features, d = out?.credit_decision;
  const rows: [string, string][] = f ? [
    ['Monthly inflow', `₹${Number(f.monthly_inflow_avg).toLocaleString('en-IN')}`],
    ['Income volatility', String(f.inflow_volatility)],
    ['Active days', `${(f.active_days_ratio * 100).toFixed(0)}%`],
    ['Utility punctuality', `${(f.utility_punctuality_score * 100).toFixed(0)}%`],
    ['Emergency drawdowns', String(f.emergency_drawdown_count)],
    ['Zero-balance days', String(f.zero_balance_days)],
  ] : [];

  return (
    <div className="cols" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.3fr)' }}>
      <section className="panel">
        <div className="panel-h"><div><h2>Simulation setup</h2><p>Six months of daily UPI transactions</p></div></div>
        <div className="panel-b" style={{ display: 'grid', gap: 16 }}>
          <div className="field"><label htmlFor="pl">Gig platform</label>
            <select id="pl" className="input" value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="delivery">Delivery partner (Zomato, Swiggy)</option><option value="ride">Ride-hail driver (Uber, Ola)</option>
              <option value="freelance">Freelance designer or developer</option><option value="vendor">Micro-vendor or kirana shop</option></select></div>
          <div className="grid2">
            <div className="field"><label htmlFor="sg">Gender</label>
              <select id="sg" className="input" value={gender} onChange={e => setGender(e.target.value)}><option>Female</option><option>Male</option></select></div>
            <div className="field"><label htmlFor="sc">City tier</label>
              <select id="sc" className="input" value={city} onChange={e => setCity(e.target.value)}>
                <option value="Tier-1">Tier 1 metros</option><option value="Tier-2">Tier 2 cities</option><option value="Tier-3">Tier 3 towns</option></select></div>
          </div>
          <button className="btn" onClick={run} disabled={loading}>{loading ? <Spinner /> : <Play size={14} />}{loading ? 'Simulating' : 'Simulate and score'}</button>
        </div>
      </section>

      <section className="panel" aria-live="polite">
        {out ? (
          <div className="panel-b" key={d.applicant_id + d.credit_score}>
            <DecisionLine decision={d.decision} />
            <div className="score"><b>{d.credit_score}</b><span>out of 900</span></div>
            <ScoreRuler score={d.credit_score} />
            <div className="kv">
              <div><span>Default probability</span><b>{(d.default_probability * 100).toFixed(1)}%</b></div>
              <div><span>Risk tier</span><b>{tierLabel(d.risk_tier)}</b></div>
            </div>
            <div className="sec"><h4>Features extracted from the transaction log</h4>
              <div className="rows" style={{ marginTop: 8 }}>{rows.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div></div>
          </div>
        ) : (
          <div className="empty"><b>No simulation yet</b>Choose a profile and run it to see the extracted features and the resulting score.</div>
        )}
      </section>
    </div>
  );
};
