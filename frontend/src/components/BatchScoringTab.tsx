import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import type { ScoringResponse } from '../types';
import { decisionLabel, tierLabel, tone, Spinner } from './common/ui';

interface Props { onBatchScore: (items: any[]) => Promise<ScoringResponse[]>; }

export const BatchScoringTab: React.FC<Props> = ({ onBatchScore }) => {
  const [results, setResults] = useState<ScoringResponse[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const generateSampleData = () => [
    { applicant_id: 'BATCH_001', monthly_inflow_avg: 28000, inflow_volatility: 0.15, active_days_ratio: 0.90, utility_punctuality_score: 0.95, emergency_drawdown_count: 0, zero_balance_days: 0, gender: 'Female', city_tier: 'Tier-1' },
    { applicant_id: 'BATCH_002', monthly_inflow_avg: 19000, inflow_volatility: 0.45, active_days_ratio: 0.65, utility_punctuality_score: 0.70, emergency_drawdown_count: 2, zero_balance_days: 4, gender: 'Male', city_tier: 'Tier-2' },
    { applicant_id: 'BATCH_003', monthly_inflow_avg: 15000, inflow_volatility: 0.72, active_days_ratio: 0.38, utility_punctuality_score: 0.40, emergency_drawdown_count: 4, zero_balance_days: 12, gender: 'Female', city_tier: 'Tier-3' },
    { applicant_id: 'BATCH_004', monthly_inflow_avg: 35000, inflow_volatility: 0.22, active_days_ratio: 0.85, utility_punctuality_score: 0.90, emergency_drawdown_count: 0, zero_balance_days: 1, gender: 'Male', city_tier: 'Tier-1' },
    { applicant_id: 'BATCH_005', monthly_inflow_avg: 22000, inflow_volatility: 0.35, active_days_ratio: 0.75, utility_punctuality_score: 0.82, emergency_drawdown_count: 1, zero_balance_days: 2, gender: 'Female', city_tier: 'Tier-2' }
  ];

  const run = async () => {
    setLoading(true);
    try { setResults(await onBatchScore(generateSampleData())); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const count = (d: string) => results.filter(r => r.decision === d).length;
  const rows = results.filter(r => filter === 'ALL' || r.decision === filter);
  const pct = (n: number) => `${Math.round((n / results.length) * 100)}% of batch`;
  const opts = [['ALL', 'All', results.length], ['APPROVED', 'Approved', count('APPROVED')], ['MANUAL_REVIEW', 'Review', count('MANUAL_REVIEW')], ['REJECTED', 'Rejected', count('REJECTED')]] as const;

  return (
    <>
      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-h">
          <div><h2>Applicant file</h2><p>Sample file with 5 applicants in Account Aggregator format</p></div>
          <button className="btn" onClick={run} disabled={loading}>{loading ? <Spinner /> : <FileSpreadsheet size={15} />}{loading ? 'Scoring' : results.length ? 'Score again' : 'Score sample batch'}</button>
        </div>
      </section>

      {results.length === 0 ? (
        <section className="panel empty"><b>Nothing scored yet</b>Score the sample batch to see approvals, referrals and rejections side by side.</section>
      ) : (
        <>
          <section className="panel strip">
            <div><span>Applicants scored</span><b>{results.length}</b><small>In this batch</small></div>
            <div><span>Approved</span><b className="t-ok">{count('APPROVED')}</b><small>{pct(count('APPROVED'))}</small></div>
            <div><span>Manual review</span><b className="t-warn">{count('MANUAL_REVIEW')}</b><small>{pct(count('MANUAL_REVIEW'))}</small></div>
            <div><span>Rejected</span><b className="t-bad">{count('REJECTED')}</b><small>{pct(count('REJECTED'))}</small></div>
          </section>
          <section className="panel">
            <div className="panel-h">
              <h3>Decisions</h3>
              <div className="seg" role="group" aria-label="Filter by decision">
                {opts.map(([k, l, n]) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}<em>{n}</em></button>)}
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Applicant</th><th className="num">Score</th><th className="num">Default probability</th><th>Decision</th><th>Risk tier</th><th>Main risk driver</th></tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.applicant_id}>
                      <td><b>{r.applicant_id}</b></td>
                      <td className="num"><b>{r.credit_score}</b></td>
                      <td className="num">{((r.default_probability || 0) * 100).toFixed(1)}%</td>
                      <td><span className={`decision t-${tone(r.decision)}`} style={{ fontSize: 13.5 }}><span className="dot" />{decisionLabel(r.decision)}</span></td>
                      <td>{tierLabel(r.risk_tier)}</td>
                      <td style={{ color: 'var(--ink-2)' }}>{r.shap_explanation?.top_risk_drivers?.[0] || '—'}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-3)' }}>No applicants with this decision.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
};
