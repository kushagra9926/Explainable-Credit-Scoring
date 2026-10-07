import React, { useState, useEffect } from 'react';
import type { ApplicantInput, ScoringResponse } from '../types';
import { DecisionLine, ScoreRuler, Spinner, tierLabel, featureName } from './common/ui';

const PERSONA_PRESETS: { name: string; role: string; desc: string; data: ApplicantInput }[] = [
  {
    name: "Aarav Sharma",
    role: "Zomato Delivery Partner",
    desc: "Consistent daily earnings, 95% on-time utility payments, low volatility.",
    data: {
      applicant_id: "UPI_ZOMATO_991",
      monthly_inflow_avg: 24000,
      monthly_outflow_avg: 16500,
      inflow_volatility: 0.18,
      inflow_outflow_ratio: 1.45,
      active_days_ratio: 0.88,
      utility_punctuality_score: 0.95,
      recharge_regularity_index: 0.92,
      avg_transaction_value: 85,
      peak_daily_inflow: 1100,
      emergency_drawdown_count: 0,
      zero_balance_days: 1,
      platform_diversity: 1,
      tenure_months: 12,
      gender: "Male",
      city_tier: "Tier-2"
    }
  },
  {
    name: "Priya Verma",
    role: "Uber Driver",
    desc: "Steady rides, moderate fuel & maintenance expenses, solid discipline.",
    data: {
      applicant_id: "UPI_UBER_402",
      monthly_inflow_avg: 32000,
      monthly_outflow_avg: 23000,
      inflow_volatility: 0.26,
      inflow_outflow_ratio: 1.39,
      active_days_ratio: 0.82,
      utility_punctuality_score: 0.88,
      recharge_regularity_index: 0.85,
      avg_transaction_value: 175,
      peak_daily_inflow: 1650,
      emergency_drawdown_count: 1,
      zero_balance_days: 3,
      platform_diversity: 2,
      tenure_months: 18,
      gender: "Female",
      city_tier: "Tier-1"
    }
  },
  {
    name: "Vikram Patel",
    role: "Freelance Designer",
    desc: "High income spikes but high volatility & 3 emergency drawdown events.",
    data: {
      applicant_id: "UPI_FREE_105",
      monthly_inflow_avg: 48000,
      monthly_outflow_avg: 39000,
      inflow_volatility: 0.55,
      inflow_outflow_ratio: 1.23,
      active_days_ratio: 0.52,
      utility_punctuality_score: 0.65,
      recharge_regularity_index: 0.60,
      avg_transaction_value: 3200,
      peak_daily_inflow: 12000,
      emergency_drawdown_count: 3,
      zero_balance_days: 8,
      platform_diversity: 3,
      tenure_months: 24,
      gender: "Male",
      city_tier: "Tier-1"
    }
  },
  {
    name: "Meena Kumari",
    role: "Local Kirana Vendor",
    desc: "Frequent cash flow dips, low active transaction ratio, multiple late utility bills.",
    data: {
      applicant_id: "UPI_VENDOR_808",
      monthly_inflow_avg: 18000,
      monthly_outflow_avg: 17200,
      inflow_volatility: 0.68,
      inflow_outflow_ratio: 1.05,
      active_days_ratio: 0.41,
      utility_punctuality_score: 0.35,
      recharge_regularity_index: 0.40,
      avg_transaction_value: 110,
      peak_daily_inflow: 900,
      emergency_drawdown_count: 5,
      zero_balance_days: 14,
      platform_diversity: 1,
      tenure_months: 6,
      gender: "Female",
      city_tier: "Tier-3"
    }
  }
];

interface Props { onScoreRequest: (input: ApplicantInput) => Promise<ScoringResponse>; }

export const SingleScorerTab: React.FC<Props> = ({ onScoreRequest }) => {
  const [form, setForm] = useState<ApplicantInput>(PERSONA_PRESETS[0].data);
  const [result, setResult] = useState<ScoringResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const set = <K extends keyof ApplicantInput>(k: K, v: ApplicantInput[K]) => setForm(f => ({ ...f, [k]: v }));
  const num = (k: keyof ApplicantInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(k, Number(e.target.value) as never);

  const evaluate = async (data = form) => {
    setLoading(true);
    try { setResult(await onScoreRequest(data)); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { evaluate(PERSONA_PRESETS[0].data); /* eslint-disable-next-line */ }, []);
  const pick = (p: typeof PERSONA_PRESETS[0]) => { setForm(p.data); evaluate(p.data); };

  const shap = Object.entries(result?.shap_explanation.shap_attributions || {}).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  return (
    <>
      <div className="profiles" role="group" aria-label="Sample applicants">
        {PERSONA_PRESETS.map(p => (
          <button key={p.name} className="profile" aria-pressed={form.applicant_id === p.data.applicant_id} onClick={() => pick(p)}>
            <b>{p.name}</b><span>{p.role}</span><small>{p.desc}</small>
          </button>
        ))}
      </div>

      <div className="cols">
        <section className="panel">
          <div className="panel-h">
            <div><h2>Applicant details</h2><p>Behavioural inputs derived from Account Aggregator data</p></div>
            <button className="btn" onClick={() => evaluate()} disabled={loading}>{loading && <Spinner />}{loading ? 'Scoring' : 'Run model'}</button>
          </div>
          <div className="panel-b">
            <div className="fgroup">
              <h3>Cash flow</h3><p>Income level and how steady it is.</p>
              <div className="grid2">
                <div className="field"><label htmlFor="inf">Monthly inflow</label>
                  <div className="pre"><span>₹</span><input id="inf" className="input" type="number" value={form.monthly_inflow_avg} onChange={num('monthly_inflow_avg')} /></div></div>
                <div className="field"><label htmlFor="vol">Income volatility</label>
                  <input id="vol" className="input" type="number" step="0.01" value={form.inflow_volatility} onChange={num('inflow_volatility')} /><small>Coefficient of variation</small></div>
                <div className="field"><label htmlFor="zb">Zero-balance days</label>
                  <input id="zb" className="input" type="number" value={form.zero_balance_days} onChange={num('zero_balance_days')} /><small>Per six months</small></div>
                <div className="field"><label htmlFor="ed">Emergency drawdowns</label>
                  <input id="ed" className="input" type="number" value={form.emergency_drawdown_count} onChange={num('emergency_drawdown_count')} /></div>
              </div>
            </div>
            <div className="fgroup">
              <h3>Repayment behaviour</h3><p>Regularity of bills, recharges and daily activity.</p>
              <div className="grid2">
                <div className="field"><label htmlFor="ad">Active days <output>{(form.active_days_ratio * 100).toFixed(0)}%</output></label>
                  <input id="ad" type="range" min="0.1" max="1" step="0.01" value={form.active_days_ratio} onChange={num('active_days_ratio')} /></div>
                <div className="field"><label htmlFor="up">Utility & rent on time <output>{(form.utility_punctuality_score * 100).toFixed(0)}%</output></label>
                  <input id="up" type="range" min="0" max="1" step="0.01" value={form.utility_punctuality_score} onChange={num('utility_punctuality_score')} /></div>
                <div className="field"><label htmlFor="rr">Recharge regularity</label>
                  <input id="rr" className="input" type="number" step="0.05" value={form.recharge_regularity_index} onChange={num('recharge_regularity_index')} /></div>
                <div className="field"><label htmlFor="pd">Platforms worked on</label>
                  <select id="pd" className="input" value={form.platform_diversity} onChange={num('platform_diversity')}>
                    <option value={1}>1 platform</option><option value={2}>2 platforms</option><option value={3}>3 or more</option></select></div>
              </div>
            </div>
            <div className="fgroup">
              <h3>Protected attributes</h3><p>Recorded so fairness can be audited across groups.</p>
              <div className="grid2">
                <div className="field"><label htmlFor="g">Gender</label>
                  <select id="g" className="input" value={form.gender} onChange={e => set('gender', e.target.value)}><option>Female</option><option>Male</option></select></div>
                <div className="field"><label htmlFor="c">City tier</label>
                  <select id="c" className="input" value={form.city_tier} onChange={e => set('city_tier', e.target.value)}>
                    <option value="Tier-1">Tier 1 metros</option><option value="Tier-2">Tier 2 cities</option><option value="Tier-3">Tier 3 towns</option></select></div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel sticky" aria-live="polite">
          {result ? (
            <div className="panel-b" key={result.applicant_id + result.credit_score}>
              <DecisionLine decision={result.decision} />
              <div className="score"><b>{result.credit_score}</b><span>out of 900</span></div>
              <ScoreRuler score={result.credit_score} />
              <div className="kv">
                <div><span>Default probability</span><b>{(result.default_probability * 100).toFixed(1)}%</b></div>
                <div><span>Risk tier</span><b>{tierLabel(result.risk_tier)}</b></div>
              </div>
              <div className="sec">
                <h4>What moved the score</h4><p>Bars to the right raise risk; bars to the left lower it.</p>
                {shap.map(([k, v]) => (
                  <div className="div-row" key={k}>
                    <span>{featureName(k)}</span>
                    <div className="div-track"><div className={`div-bar ${v > 0 ? 'up' : 'down'}`} style={{ width: `${Math.max(Math.min(Math.abs(v) * 220, 50), 2)}%` }} /></div>
                    <output className={v > 0 ? 't-bad' : 't-ok'}>{v > 0 ? '+' : '−'}{Math.abs(v).toFixed(2)}</output>
                  </div>
                ))}
              </div>
              <div className="drivers">
                <div><h5 className="t-ok">Working in their favour</h5><ul>{(result.shap_explanation.top_protective_drivers || []).map((d, i) => <li key={i}>{d}</li>)}</ul></div>
                <div><h5 className="t-bad">Raising risk</h5><ul>{(result.shap_explanation.top_risk_drivers || []).map((d, i) => <li key={i}>{d}</li>)}</ul></div>
              </div>
            </div>
          ) : (
            <div className="empty"><b>No score yet</b>Pick a sample applicant or run the model to see a decision and its explanation.</div>
          )}
        </section>
      </div>
    </>
  );
};
