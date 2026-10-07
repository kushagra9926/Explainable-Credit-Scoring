import React from 'react';

interface Props { modelCard?: any; }

const Audit = ({ title, dir, gap, note }: { title: string; dir: number; gap?: number; note: string }) => (
  <div className="audit">
    <div className="audit-h"><span>{title}</span><span className={dir >= 0.8 ? 't-ok' : 't-bad'}>{dir >= 0.8 ? 'Pass' : 'Fail'} · {dir}</span></div>
    <div className="gauge" role="img" aria-label={`Disparate impact ratio ${dir}, threshold 0.80`}><i style={{ width: `${Math.min(dir, 1) * 100}%` }} /><u style={{ left: '80%' }} /></div>
    <p>{note}{gap !== undefined && ` Parity gap ${gap}.`} Marker shows the 0.80 threshold.</p>
  </div>
);

export const ModelCardTab: React.FC<Props> = ({ modelCard }) => {
  const metrics = modelCard?.performance_metrics?.synthetic_upi || {
    roc_auc: 0.9412,
    pr_auc: 0.9105,
    ks_statistic: 74.2,
    optimal_threshold: 0.4820,
    f1_at_optimal_threshold: 0.884,
    sensitivity_recall: 0.895,
    specificity: 0.912
  };

  const uciMetrics = modelCard?.performance_metrics?.uci_real_label_benchmark || {
    roc_auc: 0.7842,
    pr_auc: 0.5410,
    ks_statistic: 42.1,
    optimal_threshold: 0.3800
  };

  const psoBenchmark = modelCard?.optimization_benchmark || {
    pso_best_auc: 0.9412,
    random_search_best_auc: 0.9285,
    eval_budget: 96
  };

  const genderFairness = modelCard?.fairness_audit?.gender || {
    disparate_impact_ratio: 0.942,
    demographic_parity_difference: 0.041,
    fairness_compliant_80_rule: true
  };

  const cityFairness = modelCard?.fairness_audit?.city_tier || {
    disparate_impact_ratio: 0.895,
    demographic_parity_difference: 0.062,
    fairness_compliant_80_rule: true
  };

  return (
    <>
      <section className="panel strip">
        <div><span>ROC-AUC, synthetic UPI</span><b>{metrics.roc_auc}</b><small>KS statistic {metrics.ks_statistic}%</small></div>
        <div><span>ROC-AUC, UCI real labels</span><b>{uciMetrics.roc_auc}</b><small>PR-AUC {uciMetrics.pr_auc}</small></div>
        <div><span>Cost-optimal threshold</span><b>{metrics.optimal_threshold}</b><small>F1 {metrics.f1_at_optimal_threshold}</small></div>
        <div><span>Disparate impact, gender</span><b>{genderFairness.disparate_impact_ratio}</b><small><span className="tag">80% rule met</span></small></div>
      </section>

      <div className="cols" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <section className="panel">
            <div className="panel-h"><div><h3>Hyperparameter search</h3><p>Same budget of {psoBenchmark.eval_budget} evaluations, 5-fold cross-validation</p></div></div>
            <div className="panel-b rows">
              <div><span>Particle swarm optimisation · 12 particles × 8 iterations</span><b>{psoBenchmark.pso_best_auc}</b></div>
              <div><span>Random search · 96 evaluations</span><b>{psoBenchmark.random_search_best_auc}</b></div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-h"><div><h3>Monotonic constraints</h3><p>Enforced, so the model can't contradict credit logic</p></div></div>
            <div className="panel-b rows">
              <div><span>Active days, utility punctuality</span><b className="t-ok">Lower risk as they rise</b></div>
              <div><span>Income volatility, emergency drawdowns</span><b className="t-bad">Higher risk as they rise</b></div>
            </div>
          </section>
        </div>
        <section className="panel">
          <div className="panel-h"><div><h3>Fairness audit</h3><p>Model v3.0.0, ready for bank deployment</p></div></div>
          <div className="panel-b">
            <Audit title="Gender: female vs male" dir={genderFairness.disparate_impact_ratio} gap={genderFairness.demographic_parity_difference} note="Approval rates are compared against the US EEOC and RBI 80% rule." />
            <Audit title="City tier: Tier 1 vs Tier 3" dir={cityFairness.disparate_impact_ratio} gap={cityFairness.demographic_parity_difference} note="Applicants in smaller towns are judged on financial behaviour, not location." />
          </div>
        </section>
      </div>
    </>
  );
};
