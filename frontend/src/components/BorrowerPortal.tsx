import React, { useState } from 'react';
import type { ApplicantInput, ScoringResponse } from '../types';
import { SAMPLE_PERSONA_FILES, downloadPersonaCSV } from '../utils/csvDownloader';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Download, Upload, CheckCircle, 
  HelpCircle, RefreshCw, DollarSign, Sparkles, UserCheck, LogOut, Check 
} from 'lucide-react';

interface Props {
  onBackToLanding: () => void;
  onScoreRequest: (input: ApplicantInput) => Promise<ScoringResponse>;
}

export const BorrowerPortal: React.FC<Props> = ({ onBackToLanding, onScoreRequest }) => {
  const { session, logout } = useAuth();
  const [, setFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  // Stored background transaction features from uploaded CSV
  const [csvFeatures, setCsvFeatures] = useState<Partial<ApplicantInput> | null>(null);

  // Questionnaire State (Filled & Adjusted by User)
  const [applicantId, setApplicantId] = useState<string>("BORROWER_CANDIDATE_101");
  const [requestedAmount, setRequestedAmount] = useState<number>(35000);
  const [requestedTenure, setRequestedTenure] = useState<number>(6);
  const [loanPurpose, setLoanPurpose] = useState<string>("INVENTORY_PURCHASE");
  
  const [monthlyInflow, setMonthlyInflow] = useState<number>(30000);
  const [monthlyOutflow, setMonthlyOutflow] = useState<number>(20000);
  const [punctualityTier, setPunctualityTier] = useState<string>("high"); // high, medium, low
  const [emergencyDrawdowns, setEmergencyDrawdowns] = useState<number>(0);

  // Output Result State
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ScoringResponse | null>(null);

  // File Upload Parser - Stores transaction background metrics without overriding questionnaire fields
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    setUploadedFileName(uploaded.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const vals = lines[1].split(',');
          
          const extracted: any = {};
          headers.forEach((h, idx) => {
            if (vals[idx] !== undefined) {
              const val = vals[idx].trim();
              const num = Number(val);
              extracted[h] = isNaN(num) ? val : num;
            }
          });
          
          setCsvFeatures(extracted);
        }
      } catch (err) {
        console.error("Failed to parse CSV file:", err);
      }
    };
    reader.readAsText(uploaded);
  };

  const handleSubmitQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let pScore = 0.92;
    if (punctualityTier === 'medium') pScore = 0.72;
    if (punctualityTier === 'low') pScore = 0.45;

    // Derived transaction metrics from uploaded CSV if available, or questionnaire defaults
    const volatility = csvFeatures?.inflow_volatility !== undefined 
      ? csvFeatures.inflow_volatility 
      : (punctualityTier === 'high' ? 0.18 : punctualityTier === 'medium' ? 0.42 : 0.68);

    const activeDays = csvFeatures?.active_days_ratio !== undefined 
      ? csvFeatures.active_days_ratio 
      : (punctualityTier === 'high' ? 0.88 : 0.52);

    const zeroBalance = csvFeatures?.zero_balance_days !== undefined 
      ? csvFeatures.zero_balance_days 
      : (emergencyDrawdowns > 1 ? 6 : 1);

    const rechargeIdx = csvFeatures?.recharge_regularity_index !== undefined
      ? csvFeatures.recharge_regularity_index
      : pScore * 0.95;

    // Combined input vector: Combines both Questionnaire User Inputs AND Uploaded Transaction Records
    const combinedInput: ApplicantInput = {
      // 1. Questionnaire User Inputs (Always respected from form)
      applicant_id: csvFeatures?.applicant_id || applicantId,
      monthly_inflow_avg: monthlyInflow,
      monthly_outflow_avg: monthlyOutflow,
      requested_amount: requestedAmount,
      requested_tenure_months: requestedTenure,
      loan_purpose: loanPurpose,
      utility_punctuality_score: pScore,
      emergency_drawdown_count: emergencyDrawdowns,

      // 2. Uploaded Transaction Records (Background transaction history profile)
      inflow_volatility: volatility,
      active_days_ratio: activeDays,
      recharge_regularity_index: rechargeIdx,
      zero_balance_days: zeroBalance,
      tenure_months: csvFeatures?.tenure_months || 12,
      gender: csvFeatures?.gender || "Female",
      city_tier: csvFeatures?.city_tier || "Tier-2",
      existing_monthly_emi: 0
    };

    try {
      const res = await onScoreRequest(combinedInput);
      setResult(res);
    } catch (err) {
      console.error("Scoring error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Top Header & Role Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <button 
            onClick={onBackToLanding}
            className="inline-flex items-center space-x-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch Role / Back to Landing</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Borrower & Candidate Scoring Portal</h2>
              <p className="text-xs text-slate-400">Attach your transaction history, answer the questionnaire, and receive an instant credit report.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {session.isLoggedIn && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center space-x-2">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-white font-medium">{session.username}</span>
              <button onClick={logout} className="text-slate-400 hover:text-rose-400 ml-2" title="Logout">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Downloadable Demo Files Bar */}
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center space-x-3 text-xs">
            <div className="hidden lg:block text-slate-400 font-medium">Demo Files for Manual Review:</div>
            <div className="flex gap-2">
              {SAMPLE_PERSONA_FILES.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => downloadPersonaCSV(p)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>{p.title.split(':')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: File Upload & Questionnaire */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* STEP 1: ATTACH CSV HISTORY FILE */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
                <h3 className="text-base font-semibold text-white">Attach Transaction & Credit History Record</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Format: CSV</span>
            </div>

            <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 text-center bg-slate-950/40 hover:bg-slate-950/80 transition-all group">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 bg-slate-800 rounded-xl group-hover:scale-110 transition-transform text-emerald-400">
                  <Upload className="w-6 h-6" />
                </div>
                {uploadedFileName ? (
                  <div className="flex items-center space-x-2 text-emerald-400 font-medium text-sm">
                    <Check className="w-4 h-4" />
                    <span>Transaction History Loaded: {uploadedFileName}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-200">Drag & drop candidate history CSV here, or <span className="text-emerald-400 underline">browse</span></p>
                    <p className="text-xs text-slate-500">Attaches background bank transaction feed & volatility metrics</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: BORROWER QUESTIONNAIRE */}
          <form onSubmit={handleSubmitQuestionnaire} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
                <h3 className="text-base font-semibold text-white">Loan Application & Financial Questionnaire</h3>
              </div>
              <span className="text-xs text-slate-400">Interactive Survey</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Applicant ID / Reference</label>
                <input 
                  type="text" 
                  value={applicantId} 
                  onChange={(e) => setApplicantId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Loan Purpose</label>
                <select 
                  value={loanPurpose} 
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="INVENTORY_PURCHASE">Inventory Purchase</option>
                  <option value="VEHICLE_MAINTENANCE">Vehicle Repair / Maintenance</option>
                  <option value="EQUIPMENT_UPGRADE">Equipment & Tool Upgrade</option>
                  <option value="WORKING_CAPITAL">Emergency Working Capital</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Avg Monthly Income (Inflow ₹)</label>
                <input 
                  type="number" 
                  value={monthlyInflow} 
                  onChange={(e) => setMonthlyInflow(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Avg Monthly Expenses (Outflow ₹)</label>
                <input 
                  type="number" 
                  value={monthlyOutflow} 
                  onChange={(e) => setMonthlyOutflow(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Requested Loan Principal (₹)</label>
                <input 
                  type="number" 
                  value={requestedAmount} 
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Requested Tenure (Months)</label>
                <select 
                  value={requestedTenure} 
                  onChange={(e) => setRequestedTenure(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={9}>9 Months</option>
                  <option value={12}>12 Months</option>
                  <option value={18}>18 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Utility & Recharge Bill Punctuality</label>
                <select 
                  value={punctualityTier} 
                  onChange={(e) => setPunctualityTier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="high">Always On-Time (&gt;90% Punctual)</option>
                  <option value="medium">Occasional Delays (70% - 90%)</option>
                  <option value="low">Frequent Late Bills (&lt;65%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Emergency Drawdowns (Last 6 Mos)</label>
                <select 
                  value={emergencyDrawdowns} 
                  onChange={(e) => setEmergencyDrawdowns(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value={0}>0 Emergency Drawdowns (Stable)</option>
                  <option value={1}>1 Drawdown</option>
                  <option value={3}>3+ Drawdowns (Cash Distress)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Calculating Credit Score & Explanations...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Calculate Candidate Credit Score</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Right Column: Score Output & SHAP Report */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6 animate-fadeIn">
              
              {/* Credit Score Gauge Header */}
              <div className="text-center pb-6 border-b border-slate-800">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Candidate Score Report</span>
                
                {/* Score Number Badge */}
                <div className="my-4 inline-flex flex-col items-center">
                  <div className={`text-6xl font-black tracking-tight ${
                    result.credit_score >= 750 ? 'text-emerald-400' :
                    result.credit_score >= 650 ? 'text-cyan-400' :
                    result.credit_score >= 550 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {result.credit_score}
                  </div>
                  <span className="text-xs text-slate-400 mt-1">Credit Score (Range: 300 - 900)</span>
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    result.decision.includes("APPROVE") 
                      ? 'bg-emerald-950 border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-950 border-rose-500/30 text-rose-300'
                  }`}>
                    {result.decision}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                    {result.risk_tier}
                  </span>
                </div>
              </div>

              {/* Underwriting Loan Breakdown */}
              {result.underwriting_summary && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                  <h4 className="font-semibold text-slate-200 mb-2 flex items-center justify-between">
                    <span>Recommended Approval Limits</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </h4>
                  <div className="flex justify-between text-slate-400">
                    <span>Requested Loan Amount:</span>
                    <span className="text-white font-medium">₹{result.underwriting_summary.requested_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Approved Max Safe Principal:</span>
                    <span className="text-emerald-400 font-bold">₹{result.underwriting_summary.approved_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Monthly EMI:</span>
                    <span className="text-white font-medium">₹{result.underwriting_summary.estimated_monthly_emi.toLocaleString()} / mo</span>
                  </div>
                </div>
              )}

              {/* SHAP Explanation Narrative */}
              {result.explanation_layer_2_narrative && (
                <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 text-xs text-indigo-200 leading-relaxed">
                  <h4 className="font-semibold text-indigo-300 mb-1 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Explainable Underwriting Narrative</span>
                  </h4>
                  <p>{result.explanation_layer_2_narrative}</p>
                </div>
              )}

              {/* Actionable Tips to Improve Score */}
              {result.explanation_layer_3_actionable_tips && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Actionable Improvement Tips</h4>
                  <div className="space-y-1.5">
                    {result.explanation_layer_3_actionable_tips.map((tip, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-300">No Candidate Score Generated Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Attach a CSV file or fill out the questionnaire on the left and click "Calculate Candidate Credit Score".
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
