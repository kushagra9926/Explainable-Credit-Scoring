import React, { useState } from 'react';
import { Building2, ArrowRight, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

interface BankAdapterTabProps {
  apiConnected: boolean;
}

export const BankAdapterTab: React.FC<BankAdapterTabProps> = ({ apiConnected }) => {
  const [selectedPreset, setSelectedPreset] = useState<'bank_alpha' | 'bank_beta'>('bank_alpha');
  const [bankPayloadText, setBankPayloadText] = useState(
    JSON.stringify(
      {
        customer_id: "BANK_ALPHA_88301",
        upi_credit_total_avg: 34500.0,
        upi_debit_total_avg: 21000.0,
        income_std_ratio: 0.22,
        credit_debit_ratio: 1.64,
        active_earning_days_pct: 0.88,
        utility_on_time_ratio: 0.95,
        recharge_consistency_idx: 0.92,
        mean_tx_amt: 195.0,
        max_single_day_credit: 1800.0,
        rapid_drain_events: 0,
        days_with_zero_bal: 0,
        num_earning_channels: 2,
        account_age_months: 16,
        cust_gender: "Female",
        cust_city_tier: "Tier-2"
      },
      null,
      2
    )
  );

  const [adapterResult, setAdapterResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePresetChange = (preset: 'bank_alpha' | 'bank_beta') => {
    setSelectedPreset(preset);
    setErrorMsg('');
    if (preset === 'bank_alpha') {
      setBankPayloadText(
        JSON.stringify(
          {
            customer_id: "BANK_ALPHA_88301",
            upi_credit_total_avg: 34500.0,
            upi_debit_total_avg: 21000.0,
            income_std_ratio: 0.22,
            credit_debit_ratio: 1.64,
            active_earning_days_pct: 0.88,
            utility_on_time_ratio: 0.95,
            recharge_consistency_idx: 0.92,
            mean_tx_amt: 195.0,
            max_single_day_credit: 1800.0,
            rapid_drain_events: 0,
            days_with_zero_bal: 0,
            num_earning_channels: 2,
            account_age_months: 16,
            cust_gender: "Female",
            cust_city_tier: "Tier-2"
          },
          null,
          2
        )
      );
    } else {
      setBankPayloadText(
        JSON.stringify(
          {
            customer_id: "BANK_BETA_99412",
            total_monthly_deposits: 18500.0,
            total_monthly_withdrawals: 17200.0,
            deposit_volatility_coeff: 0.48,
            cashflow_coverage_ratio: 1.07,
            transacting_days_share: 0.62,
            bill_payment_punctuality: 0.70,
            mobile_pay_regularity: 0.65,
            avg_ticket_size: 140.0,
            highest_daily_deposit: 950.0,
            low_balance_stress_count: 2,
            zero_balance_days_count: 3,
            platform_sources_count: 1,
            relationship_duration_m: 8,
            gender_code: "Male",
            location_tier: "Tier-3"
          },
          null,
          2
        )
      );
    }
  };

  const handleTestAdapter = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const parsedData = JSON.parse(bankPayloadText);

      if (apiConnected) {
        const res = await fetch('http://localhost:8000/api/v1/bank-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preset_name: selectedPreset,
            bank_raw_data: parsedData
          })
        });

        if (res.ok) {
          const data = await res.json();
          setAdapterResult(data);
          setLoading(false);
          return;
        }
      }

      // Local Fallback Adapter Demo
      const adapted = {
        applicant_id: parsedData.customer_id || "BANK_CUST_999",
        monthly_inflow_avg: parsedData.upi_credit_total_avg || parsedData.total_monthly_deposits || 25000,
        monthly_outflow_avg: parsedData.upi_debit_total_avg || parsedData.total_monthly_withdrawals || 18000,
        inflow_volatility: parsedData.income_std_ratio || parsedData.deposit_volatility_coeff || 0.3,
        inflow_outflow_ratio: parsedData.credit_debit_ratio || parsedData.cashflow_coverage_ratio || 1.25,
        active_days_ratio: parsedData.active_earning_days_pct || parsedData.transacting_days_share || 0.75,
        utility_punctuality_score: parsedData.utility_on_time_ratio || parsedData.bill_payment_punctuality || 0.85,
        recharge_regularity_index: parsedData.recharge_consistency_idx || parsedData.mobile_pay_regularity || 0.80,
        avg_transaction_value: parsedData.mean_tx_amt || parsedData.avg_ticket_size || 150,
        peak_daily_inflow: parsedData.max_single_day_credit || parsedData.highest_daily_deposit || 1200,
        emergency_drawdown_count: parsedData.rapid_drain_events ?? parsedData.low_balance_stress_count ?? 0,
        zero_balance_days: parsedData.days_with_zero_bal ?? parsedData.zero_balance_days_count ?? 0,
        platform_diversity: parsedData.num_earning_channels || parsedData.platform_sources_count || 1,
        tenure_months: parsedData.account_age_months || parsedData.relationship_duration_m || 12,
        gender: parsedData.cust_gender || parsedData.gender_code || "Female",
        city_tier: parsedData.cust_city_tier || parsedData.location_tier || "Tier-2"
      };

      const vol = adapted.inflow_volatility;
      const punc = adapted.utility_punctuality_score;
      const act = adapted.active_days_ratio;
      const draws = adapted.emergency_drawdown_count;

      const risk = 0.5 + 2.0 * vol - 1.8 * punc - 1.5 * act + 0.25 * draws - 0.5;
      const prob_default = Math.max(0.01, Math.min(0.99, 1.0 / (1.0 + Math.exp(-risk))));
      const credit_score = Math.round(300 + 600 * (1.0 - prob_default));
      const creditworthiness_score = Math.round((1.0 - prob_default) * 100);

      setAdapterResult({
        preset_used: selectedPreset,
        bank_raw_input: parsedData,
        adapted_canonical_features: adapted,
        credit_decision: {
          applicant_id: adapted.applicant_id,
          credit_score,
          creditworthiness_score,
          default_probability: prob_default,
          decision: prob_default < 0.35 ? "APPROVED" : prob_default < 0.55 ? "MANUAL_REVIEW" : "REJECTED",
          risk_tier: prob_default < 0.20 ? "LOW_RISK" : prob_default < 0.45 ? "MEDIUM_RISK" : "HIGH_RISK",
          shap_explanation: {
            top_risk_drivers: vol > 0.35 ? [`Inflow Volatility (${vol})`] : [`Emergency Drawdowns (${draws})`],
            top_protective_drivers: punc > 0.7 ? [`Utility Punctuality (${(punc*100).toFixed(0)}%)`] : [`Active Days Ratio (${(act*100).toFixed(0)}%)`]
          }
        }
      });
    } catch (err: any) {
      setErrorMsg(`Invalid JSON input: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Bank-Internal Feature Adapter Interface</h2>
            <p className="text-sm text-slate-400 mt-1">
              Demonstrates the realistic deployment model: partner banks keep raw customer & transaction data inside their own secure boundary. 
              The adapter translates bank-specific column names into our canonical feature contract before model scoring.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Bank Input Selector & Editor */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Bank Schema Preset
            </h3>

            <div className="flex bg-slate-900 p-1 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => handlePresetChange('bank_alpha')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  selectedPreset === 'bank_alpha' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bank Alpha (Retail)
              </button>
              <button
                onClick={() => handlePresetChange('bank_beta')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  selectedPreset === 'bank_beta' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bank Beta (Digital)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Raw Bank Payload JSON ({selectedPreset === 'bank_alpha' ? 'Bank Alpha Column Names' : 'Bank Beta Column Names'})
            </label>
            <textarea
              value={bankPayloadText}
              onChange={(e) => setBankPayloadText(e.target.value)}
              rows={16}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleTestAdapter}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 text-sm"
          >
            {loading ? (
              <span>Adapting Schema & Scoring...</span>
            ) : (
              <>
                <span>Run Adapter & Execute Scoring</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output Showcase */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Adapted Canonical Contract & Scoring Output
          </h3>

          {!adapterResult ? (
            <div className="h-96 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl text-slate-500">
              <Building2 className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-sm font-medium">Click "Run Adapter & Execute Scoring" to view real-time schema translation.</p>
              <p className="text-xs text-slate-600 mt-1">Shows raw bank attributes mapped to standard canonical schema.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Scoring Summary Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 text-[10px] block">DECISION</span>
                  <span className={`font-bold text-sm ${adapterResult.credit_decision.decision === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {adapterResult.credit_decision.decision}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">DEFAULT PROB.</span>
                  <span className="font-bold text-sm text-cyan-300">
                    {(adapterResult.credit_decision.default_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">PROJECT SCORE</span>
                  <span className="font-bold text-sm text-indigo-400">
                    {adapterResult.credit_decision.creditworthiness_score || adapterResult.credit_decision.credit_score} / 100
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">RISK TIER</span>
                  <span className="font-bold text-sm text-amber-300">
                    {adapterResult.credit_decision.risk_tier}
                  </span>
                </div>
              </div>

              {/* Mapped Canonical Schema */}
              <div>
                <h4 className="font-semibold text-slate-300 mb-2">Mapped Canonical Features</h4>
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 max-h-56 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1">
                  {Object.entries(adapterResult.adapted_canonical_features).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-0.5 border-b border-white/5 last:border-0">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-cyan-300 font-semibold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHAP Explanation Summary */}
              {adapterResult.credit_decision.shap_explanation && (
                <div>
                  <h4 className="font-semibold text-slate-300 mb-1">SHAP Attribution Drivers</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 text-rose-300">
                      <span className="font-bold block mb-1">Top Risk Drivers (+)</span>
                      <ul className="space-y-0.5">
                        {(adapterResult.credit_decision.shap_explanation.top_risk_drivers || []).map((d: string, i: number) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 text-emerald-300">
                      <span className="font-bold block mb-1">Top Protective Drivers (-)</span>
                      <ul className="space-y-0.5">
                        {(adapterResult.credit_decision.shap_explanation.top_protective_drivers || []).map((d: string, i: number) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
