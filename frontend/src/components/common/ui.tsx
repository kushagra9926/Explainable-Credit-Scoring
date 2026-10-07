import type { ScoringResponse } from '../../types';

export const decisionLabel = (d: string) => ({ APPROVED: 'Approved', MANUAL_REVIEW: 'Manual review', REJECTED: 'Rejected' } as Record<string, string>)[d] ?? d;
export const tierLabel = (t: string) => { const s = t.replace(/_/g, ' ').toLowerCase(); return s[0].toUpperCase() + s.slice(1); };
export const tone = (d: string) => (d === 'APPROVED' ? 'ok' : d === 'REJECTED' ? 'bad' : 'warn');
export const featureName = (k: string) => ({
  utility_punctuality_score: 'Utility punctuality', inflow_volatility: 'Income volatility',
  active_days_ratio: 'Active days', emergency_drawdown_count: 'Emergency drawdowns',
} as Record<string, string>)[k] ?? (k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()));

export const DecisionLine = ({ decision }: { decision: string }) => (
  <div className={`decision t-${tone(decision)}`}><span className="dot" />{decisionLabel(decision)}</div>
);

// Bands mirror the engine's cut-offs: default probability 60% / 45% / 20% on a 300–900 scale.
const BANDS = [
  { label: 'High risk', from: 300, to: 540, t: 'bad' },
  { label: 'Review', from: 540, to: 630, t: 'warn' },
  { label: 'Medium', from: 630, to: 780, t: 'ok' },
  { label: 'Low risk', from: 780, to: 900, t: 'ok' },
];
export const ScoreRuler = ({ score }: { score: number }) => {
  const pct = Math.max(0, Math.min(100, ((score - 300) / 600) * 100));
  const w = (b: typeof BANDS[0]) => ((b.to - b.from) / 600) * 100 + '%';
  return (
    <div className="ruler" role="img" aria-label={`Score ${score} on a 300 to 900 scale`}>
      <div className="ruler-pin" style={{ left: `calc(${pct}% - 1px)` }} />
      <div className="ruler-bar">
        {BANDS.map(b => <div key={b.label} className={score >= b.from && score <= b.to ? 'on' : ''} style={{ width: w(b), color: `var(--${b.t})` }} />)}
      </div>
      <div className="ruler-lab">{BANDS.map(b => <span key={b.label} style={{ width: w(b) }}>{b.label}</span>)}</div>
    </div>
  );
};

export const Spinner = () => <span className="spin" aria-hidden />;
export type Result = ScoringResponse;
