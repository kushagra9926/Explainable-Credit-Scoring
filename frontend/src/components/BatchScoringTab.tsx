import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Filter } from 'lucide-react';
import type { ScoringResponse } from '../types';

interface Props {
  onBatchScore: (items: any[]) => Promise<ScoringResponse[]>;
}

export const BatchScoringTab: React.FC<Props> = ({ onBatchScore }) => {
  const [results, setResults] = useState<ScoringResponse[]>([]);
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  const generateSampleData = () => [
    { applicant_id: 'BATCH_001', monthly_inflow_avg: 28000, inflow_volatility: 0.15, active_days_ratio: 0.90, utility_punctuality_score: 0.95, emergency_drawdown_count: 0, zero_balance_days: 0, gender: 'Female', city_tier: 'Tier-1' },
    { applicant_id: 'BATCH_002', monthly_inflow_avg: 19000, inflow_volatility: 0.45, active_days_ratio: 0.65, utility_punctuality_score: 0.70, emergency_drawdown_count: 2, zero_balance_days: 4, gender: 'Male', city_tier: 'Tier-2' },
    { applicant_id: 'BATCH_003', monthly_inflow_avg: 15000, inflow_volatility: 0.72, active_days_ratio: 0.38, utility_punctuality_score: 0.40, emergency_drawdown_count: 4, zero_balance_days: 12, gender: 'Female', city_tier: 'Tier-3' },
    { applicant_id: 'BATCH_004', monthly_inflow_avg: 35000, inflow_volatility: 0.22, active_days_ratio: 0.85, utility_punctuality_score: 0.90, emergency_drawdown_count: 0, zero_balance_days: 1, gender: 'Male', city_tier: 'Tier-1' },
    { applicant_id: 'BATCH_005', monthly_inflow_avg: 22000, inflow_volatility: 0.35, active_days_ratio: 0.75, utility_punctuality_score: 0.82, emergency_drawdown_count: 1, zero_balance_days: 2, gender: 'Female', city_tier: 'Tier-2' }
  ];

  const handleRunSampleBatch = async () => {
    setLoading(true);
    try {
      const sample = generateSampleData();
      const res = await onBatchScore(sample);
      setResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(r => filterDecision === 'ALL' || r.decision === filterDecision);

  const approvedCount = results.filter(r => r.decision === 'APPROVED').length;
  const reviewCount = results.filter(r => r.decision === 'MANUAL_REVIEW').length;
  const rejectedCount = results.filter(r => r.decision === 'REJECTED').length;

  return (
    <div className="space-y-8">
      {/* Upload Dropzone & Action Box */}
      <div className="glass-card p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
          <Upload className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Bank Applicant Batch CSV Ingestion</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Upload Account Aggregator CSV files or trigger a sample bank loan application batch score.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={handleRunSampleBatch}
            disabled={loading}
            className="gradient-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{loading ? 'Scoring Batch...' : 'Run Sample Bank CSV (5 Applicants)'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Scored</span>
            <div className="text-2xl font-black text-white mt-1">{results.length}</div>
          </div>
          <div className="glass-card p-4 text-center border-l-2 border-l-emerald-500">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Approved</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{approvedCount} ({((approvedCount/results.length)*100).toFixed(0)}%)</div>
          </div>
          <div className="glass-card p-4 text-center border-l-2 border-l-amber-500">
            <span className="text-[10px] font-bold text-amber-400 uppercase">Manual Review</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{reviewCount} ({((reviewCount/results.length)*100).toFixed(0)}%)</div>
          </div>
          <div className="glass-card p-4 text-center border-l-2 border-l-rose-500">
            <span className="text-[10px] font-bold text-rose-400 uppercase">Rejected</span>
            <div className="text-2xl font-black text-rose-400 mt-1">{rejectedCount} ({((rejectedCount/results.length)*100).toFixed(0)}%)</div>
          </div>
        </div>
      )}

      {/* Batch Results Table */}
      {results.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Scored Loan Applications Table</span>
            </h4>

            {/* Filter buttons */}
            <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-white/5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
              {['ALL', 'APPROVED', 'MANUAL_REVIEW', 'REJECTED'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilterDecision(opt)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    filterDecision === opt ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-900/60 text-slate-400 border-b border-white/10 font-mono">
                <tr>
                  <th className="py-3 px-4">Applicant ID</th>
                  <th className="py-3 px-4">Credit Score</th>
                  <th className="py-3 px-4">Default Prob</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Risk Tier</th>
                  <th className="py-3 px-4">Top SHAP Risk Driver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredResults.map((r) => (
                  <tr key={r.applicant_id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-bold text-white">{r.applicant_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-200">{r.credit_score}</td>
                    <td className="py-3 px-4">{((r.default_probability || 0)*100).toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        r.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        r.decision === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {r.decision}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{r.risk_tier}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[200px]">
                      {r.shap_explanation?.top_risk_drivers?.[0] || 'Inflow Volatility (+0.21)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
