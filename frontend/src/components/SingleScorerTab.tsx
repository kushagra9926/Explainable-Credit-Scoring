import React, { useState } from 'react';
import type { ApplicantInput, ScoringResponse } from '../types';
import { User, Zap, AlertTriangle, CheckCircle, HelpCircle, RefreshCw, Upload, FileText } from 'lucide-react';

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

interface Props {
  onScoreRequest: (input: ApplicantInput) => Promise<ScoringResponse>;
}

export const SingleScorerTab: React.FC<Props> = ({ onScoreRequest }) => {
  const [formData, setFormData] = useState<ApplicantInput>(PERSONA_PRESETS[0].data);
  const [result, setResult] = useState<ScoringResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handlePersonaSelect = async (persona: typeof PERSONA_PRESETS[0]) => {
    setUploadedFileName(null);
    setFormData(persona.data);
    await handleEvaluate(persona.data);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          const feats = json.features || json;
          const updated = { ...formData, ...feats };
          setFormData(updated);
          handleEvaluate(updated);
        } else {
          const lines = text.split('\n').filter(l => l.trim().length > 0);
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const vals = lines[1].split(',');
            const obj: any = { ...formData };
            headers.forEach((h, idx) => {
              if (vals[idx] !== undefined) {
                const num = Number(vals[idx].trim());
                obj[h] = isNaN(num) ? vals[idx].trim() : num;
              }
            });
            setFormData(obj);
            handleEvaluate(obj);
          }
        }
      } catch (err) {
        console.error("Statement parse error:", err);
      }
    };
    reader.readAsText(file);
  };

  const handleEvaluate = async (dataToSubmit = formData) => {
    setLoading(true);
    try {
      const res = await onScoreRequest(dataToSubmit);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleStatement = async (samplePath: string, fileName: string) => {
    try {
      setUploadedFileName(fileName);
      const res = await fetch(samplePath);
      const text = await res.text();
      if (fileName.endsWith('.json')) {
        const json = JSON.parse(text);
        const feats = json.features || json;
        const updated = { ...formData, ...feats };
        setFormData(updated);
        handleEvaluate(updated);
      } else {
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const vals = lines[1].split(',');
          const obj: any = { ...formData };
          headers.forEach((h, idx) => {
            if (vals[idx] !== undefined) {
              const num = Number(vals[idx].trim());
              obj[h] = isNaN(num) ? vals[idx].trim() : num;
            }
          });
          setFormData(obj);
          handleEvaluate(obj);
        }
      }
    } catch (err) {
      console.error("Failed to load sample statement:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Persona Selection Header */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Zap className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Select Preset Gig-Worker Persona or Upload Statement</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERSONA_PRESETS.map((p) => (
            <div
              key={p.name}
              onClick={() => handlePersonaSelect(p)}
              className={`p-4 glass-card cursor-pointer transition-all duration-200 hover:border-indigo-500/50 ${
                formData.applicant_id === p.data.applicant_id && !uploadedFileName ? 'border-indigo-500 bg-indigo-950/30' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  {p.role}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{p.data.gender} • {p.data.city_tier}</span>
              </div>
              <h3 className="font-semibold text-white text-sm">{p.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Statement File Upload Banner */}
          <div className="glass-card p-5 border border-dashed border-indigo-500/40 bg-indigo-950/20 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Upload UPI / Bank Statement File</h4>
                  <p className="text-[11px] text-slate-400">
                    {uploadedFileName ? `Loaded statement: ${uploadedFileName}` : 'Upload PhonePe/GPay/Bank CSV or Account Aggregator statement file'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="upi-statement-file-input"
                />
                <label
                  htmlFor="upi-statement-file-input"
                  className="gradient-btn px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-lg flex items-center space-x-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Browse File</span>
                </label>
              </div>
            </div>

            {/* 1-Click Sample Statement Fillers */}
            <div className="flex items-center space-x-2 pt-2 border-t border-white/5 text-[11px]">
              <span className="text-slate-400">Or test with 1-click sample statement:</span>
              <button
                onClick={() => loadSampleStatement('/sample_zomato_partner_statement.csv', 'sample_zomato_partner_statement.csv')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[10px] border border-white/10"
              >
                📄 Zomato Statement (.csv)
              </button>
              <button
                onClick={() => loadSampleStatement('/sample_aa_statement.json', 'sample_aa_statement.json')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-[10px] border border-white/10"
              >
                📄 Account Aggregator (.json)
              </button>
            </div>
          </div>

          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Applicant Financial & Behavioral Attributes</h3>
                <p className="text-xs text-slate-400">Extracted from raw UPI statement logs or Account Aggregator payload</p>
              </div>
              <button
                onClick={() => handleEvaluate()}
                disabled={loading}
                className="gradient-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 text-white shadow-lg"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>{loading ? 'Evaluating...' : 'Run Credit Model'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Monthly Inflow Avg (₹)</label>
                <input
                  type="number"
                  value={formData.monthly_inflow_avg}
                  onChange={(e) => setFormData({ ...formData, monthly_inflow_avg: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Inflow Volatility Index (Coeff Var)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.inflow_volatility}
                  onChange={(e) => setFormData({ ...formData, inflow_volatility: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Active Transaction Days Ratio</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.01"
                  value={formData.active_days_ratio}
                  onChange={(e) => setFormData({ ...formData, active_days_ratio: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>In-active (0.1)</span>
                  <span className="text-indigo-400 font-bold">{(formData.active_days_ratio * 100).toFixed(0)}%</span>
                  <span>Daily (1.0)</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Utility & Rent Punctuality Score</label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.01"
                  value={formData.utility_punctuality_score}
                  onChange={(e) => setFormData({ ...formData, utility_punctuality_score: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0% On-time</span>
                  <span className="text-emerald-400 font-bold">{(formData.utility_punctuality_score * 100).toFixed(0)}%</span>
                  <span>100% On-time</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Recharge Regularity Index</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.recharge_regularity_index}
                  onChange={(e) => setFormData({ ...formData, recharge_regularity_index: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Emergency Cash Drawdown Frequency</label>
                <input
                  type="number"
                  value={formData.emergency_drawdown_count}
                  onChange={(e) => setFormData({ ...formData, emergency_drawdown_count: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Zero Balance Days (per 6mo)</label>
                <input
                  type="number"
                  value={formData.zero_balance_days}
                  onChange={(e) => setFormData({ ...formData, zero_balance_days: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Platform Diversity</label>
                <select
                  value={formData.platform_diversity}
                  onChange={(e) => setFormData({ ...formData, platform_diversity: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>1 Platform</option>
                  <option value={2}>2 Platforms</option>
                  <option value={3}>3+ Platforms</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Protected Attribute: Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Protected Attribute: City Tier</label>
                <select
                  value={formData.city_tier}
                  onChange={(e) => setFormData({ ...formData, city_tier: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Tier-1">Tier-1 Metros</option>
                  <option value="Tier-2">Tier-2 Cities</option>
                  <option value="Tier-3">Tier-3 Towns</option>
                </select>
              </div>
            </div>

            {/* Questionnaire Section */}
            <div className="border-t border-white/10 pt-4 mt-4">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Loan Application Questionnaire</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Requested Loan Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.requested_amount || 30000}
                    onChange={(e) => setFormData({ ...formData, requested_amount: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Requested Tenure (Months)</label>
                  <select
                    value={formData.requested_tenure_months || 6}
                    onChange={(e) => setFormData({ ...formData, requested_tenure_months: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                    <option value={18}>18 Months</option>
                    <option value={24}>24 Months</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Purpose of Loan</label>
                  <select
                    value={formData.loan_purpose || "INVENTORY_PURCHASE"}
                    onChange={(e) => setFormData({ ...formData, loan_purpose: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="INVENTORY_PURCHASE">Inventory & Stock Purchase</option>
                    <option value="WORKING_CAPITAL">Daily Working Capital</option>
                    <option value="EQUIPMENT_UPGRADE">Vehicle / Equipment Upgrade</option>
                    <option value="BUSINESS_EXPANSION">Business Expansion</option>
                    <option value="EMERGENCY_PERSONAL">Personal Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Existing Monthly EMIs (₹)</label>
                  <input
                    type="number"
                    value={formData.existing_monthly_emi || 0}
                    onChange={(e) => setFormData({ ...formData, existing_monthly_emi: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results & 3-Layer Explanation Column */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className={`glass-card p-6 space-y-6 transition-all duration-300 ${
              result.decision.includes('APPROVE') ? 'glow-approved' : result.decision === 'REJECTED' ? 'glow-rejected' : 'glow-review'
            }`}>
              {/* Decision Gauge */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 border border-white/10 mb-2">
                  {result.decision.includes('APPROVE') && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {result.decision === 'REJECTED' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                  {result.decision === 'MANUAL_REVIEW' && <HelpCircle className="w-4 h-4 text-amber-400" />}
                  <span className={result.decision.includes('APPROVE') ? 'text-emerald-400' : result.decision === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'}>
                    Decision: {result.decision}
                  </span>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="text-5xl font-black tracking-tight text-white">
                    {result.credit_score}
                  </div>
                  <span className="text-xs text-slate-400 font-bold ml-1 self-end mb-1">/ 900</span>
                </div>

                <div className="flex justify-center space-x-6 text-xs text-slate-400 pt-2 border-t border-white/10">
                  <div>
                    <span className="block text-[10px] text-slate-500">DEFAULT PROBABILITY</span>
                    <span className="font-bold text-slate-200">{(result.default_probability * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">RISK TIER</span>
                    <span className="font-bold text-indigo-300">{result.risk_label || result.risk_tier}</span>
                  </div>
                </div>
              </div>

              {/* Underwriting Summary Box */}
              {result.underwriting_summary && (
                <div className="p-3 glass-card-sm border-l-2 border-l-indigo-500 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-300 font-medium">
                    <span>Requested: ₹{result.underwriting_summary.requested_amount.toLocaleString()} ({result.underwriting_summary.requested_tenure_months}m)</span>
                    <span className="text-emerald-400 font-bold">Approved: ₹{result.underwriting_summary.approved_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Est. Monthly EMI: ₹{result.underwriting_summary.estimated_monthly_emi.toLocaleString()}</span>
                    <span>Max Safe Limit: ₹{result.underwriting_summary.max_recommended_loan_amount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Layer 2: Underwriting Narrative Card */}
              {result.explanation_layer_2_narrative && (
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-indigo-500/30 space-y-1">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>Layer 2: Underwriting Narrative</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {result.explanation_layer_2_narrative}
                  </p>
                </div>
              )}

              {/* Layer 1: SHAP Attributions Breakdown */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Layer 1: SHAP Waterfall Drivers</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Feature Attributions</span>
                </h4>

                <div className="space-y-2">
                  {Object.entries(result.explanation_layer_1_shap?.shap_attributions || result.shap_explanation?.shap_attributions || {}).map(([key, val]) => {
                    const isPositiveRisk = val > 0;
                    const widthPct = Math.min(Math.abs(val) * 300, 100);
                    return (
                      <div key={key} className="text-xs">
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span className="truncate max-w-[180px] font-mono text-[11px]">{key}</span>
                          <span className={isPositiveRisk ? 'text-rose-400 font-mono font-bold' : 'text-emerald-400 font-mono font-bold'}>
                            {isPositiveRisk ? `+${val.toFixed(3)} risk` : `${val.toFixed(3)} risk`}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full rounded-full ${isPositiveRisk ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.max(widthPct, 6)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Layer 3: Actionable Score Improvement Prescriptions */}
              {result.explanation_layer_3_actionable_tips && result.explanation_layer_3_actionable_tips.length > 0 && (
                <div className="p-3.5 bg-indigo-950/40 rounded-xl border border-indigo-500/20 space-y-2">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Layer 3: +50 Points Score Growth Plan</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-1">
                    {result.explanation_layer_3_actionable_tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-slate-400 space-y-4">
              <User className="w-12 h-12 mx-auto text-slate-600 animate-bounce" />
              <p className="text-sm">Click "Run Credit Model" or select a preset persona above to generate live credit score and 3-Layer explanations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
