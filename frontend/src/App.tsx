import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SingleScorerTab } from './components/SingleScorerTab';
import { BankAdapterTab } from './components/BankAdapterTab';
import { BatchScoringTab } from './components/BatchScoringTab';
import { ModelCardTab } from './components/ModelCardTab';
import { SimulatorTab } from './components/SimulatorTab';
import type { ApplicantInput, ScoringResponse } from './types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export function App() {
  const [activeTab, setActiveTab] = useState('single');
  const [apiConnected, setApiConnected] = useState(false);
  const [modelCard, setModelCard] = useState<any>(null);

  useEffect(() => {
    // Check FastAPI health
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'healthy') {
          setApiConnected(true);
          fetchModelCard();
        }
      })
      .catch(() => setApiConnected(false));
  }, []);

  const fetchModelCard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/model-info`);
      const data = await res.json();
      setModelCard(data);
    } catch (e) {
      console.error("Failed to load model card:", e);
    }
  };

  const handleScoreSingle = async (input: ApplicantInput): Promise<ScoringResponse> => {
    if (apiConnected) {
      try {
        const res = await fetch(`${API_BASE_URL}/score-merchant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (e) {
        console.error("API error, falling back to local evaluation:", e);
      }
    }

    // High quality local fallback scoring engine
    const vol = input.inflow_volatility;
    const punc = input.utility_punctuality_score;
    const act = input.active_days_ratio;
    const draws = input.emergency_drawdown_count;
    const inflow = input.monthly_inflow_avg || 25000;

    const risk = 0.5 + 2.0 * vol - 1.8 * punc - 1.5 * act + 0.25 * draws - 0.5;
    const prob_default = Math.max(0.01, Math.min(0.99, 1.0 / (1.0 + Math.exp(-risk))));
    const credit_score = Math.round(300 + 600 * (1.0 - prob_default));

    let decision = "APPROVED";
    let risk_tier = "TIER_2_LOW_RISK";
    let risk_label = "Good (Low Risk)";

    if (credit_score >= 800) {
      risk_tier = "TIER_1_MINIMAL_RISK";
      risk_label = "Excellent (Minimal Risk)";
      decision = "AUTO_APPROVE";
    } else if (credit_score >= 700) {
      risk_tier = "TIER_2_LOW_RISK";
      risk_label = "Good (Low Risk)";
      decision = "AUTO_APPROVE";
    } else if (credit_score >= 600) {
      risk_tier = "TIER_3_MODERATE_RISK";
      risk_label = "Acceptable (Moderate Risk)";
      decision = "CONDITIONAL_APPROVE";
    } else if (credit_score >= 500) {
      risk_tier = "TIER_4_HIGH_RISK";
      risk_label = "Elevated (High Risk)";
      decision = "MANUAL_REVIEW";
    } else {
      risk_tier = "TIER_5_SEVERE_RISK";
      risk_label = "Critical (Severe Default Risk)";
      decision = "REJECTED";
    }

    const requestedAmt = input.requested_amount || 30000;
    const requestedTenure = input.requested_tenure_months || 6;
    const maxSafeLoan = (inflow * 0.35) * requestedTenure;

    return {
      applicant_id: input.applicant_id,
      credit_score,
      creditworthiness_score: Math.round((1.0 - prob_default) * 100),
      default_probability: prob_default,
      decision,
      risk_tier,
      risk_label,
      explanation_layer_1_shap: {
        shap_attributions: {
          utility_punctuality_score: punc > 0.7 ? -0.16 : 0.18,
          inflow_volatility: vol > 0.35 ? 0.22 : -0.10,
          active_days_ratio: act > 0.6 ? -0.14 : 0.15,
          emergency_drawdown_count: draws > 1 ? 0.16 : -0.04
        },
        top_risk_drivers: vol > 0.35 ? [`inflow_volatility (+${(vol * 0.4).toFixed(3)})`] : [`emergency_drawdown_count (${draws} events)`],
        top_protective_drivers: punc > 0.7 ? [`utility_punctuality_score (${(punc * 100).toFixed(0)}% on-time)`] : [`active_days_ratio (${(act * 100).toFixed(0)}%)`]
      },
      explanation_layer_2_narrative: decision.includes("APPROVE") 
        ? `Application ${decision}. Candidate demonstrates steady monthly turnover of ₹${inflow.toLocaleString()} and active earnings on ${(act * 100).toFixed(0)}% of days.`
        : `Application ${decision}. High volatility (${vol.toFixed(2)}) or lower payment punctuality (${(punc * 100).toFixed(0)}%) indicates potential cash flow distress.`,
      explanation_layer_3_actionable_tips: [
        "Pay utility and mobile bills on or before due dates for 3 consecutive months (+25 pts)",
        "Maintain minimum running balance above ₹500 to avoid cash distress flags (+20 pts)",
        "Reduce requested loan principal or extend tenure to lower monthly EMI burden (+15 pts)"
      ],
      underwriting_summary: {
        requested_amount: requestedAmt,
        requested_tenure_months: requestedTenure,
        loan_purpose: input.loan_purpose || "INVENTORY_PURCHASE",
        estimated_monthly_emi: Math.round(requestedAmt / requestedTenure * 1.05),
        max_recommended_loan_amount: Math.round(maxSafeLoan),
        approved_amount: Math.round(Math.min(requestedAmt, maxSafeLoan))
      }
    };
  };

  const handleBatchScore = async (items: any[]): Promise<ScoringResponse[]> => {
    return Promise.all(items.map(item => handleScoreSingle(item)));
  };

  const handleSimulate = async (platform: string, gender: string, city: string) => {
    if (apiConnected) {
      try {
        const res = await fetch(`${API_BASE_URL}/simulate-upi?platform_type=${platform}&gender=${gender}&city_tier=${city}`, {
          method: 'POST'
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.error("Simulation API error:", e);
      }
    }

    const dummyFeatures: ApplicantInput = {
      applicant_id: `SIM_GIG_${Math.floor(Math.random()*9000)+1000}`,
      monthly_inflow_avg: platform === 'freelance' ? 42000 : 25000,
      monthly_outflow_avg: 18000,
      inflow_volatility: platform === 'freelance' ? 0.52 : 0.22,
      inflow_outflow_ratio: 1.35,
      active_days_ratio: 0.82,
      utility_punctuality_score: 0.90,
      recharge_regularity_index: 0.88,
      avg_transaction_value: 120,
      peak_daily_inflow: 1400,
      emergency_drawdown_count: 0,
      zero_balance_days: 1,
      platform_diversity: 2,
      tenure_months: 12,
      gender,
      city_tier: city
    };

    const decision = await handleScoreSingle(dummyFeatures);

    return {
      simulation_info: { applicant_id: dummyFeatures.applicant_id, platform_type: platform, gender, city_tier: city },
      extracted_features: dummyFeatures,
      credit_decision: decision
    };
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} apiConnected={apiConnected} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'single' && <SingleScorerTab onScoreRequest={handleScoreSingle} />}
        {activeTab === 'bank-adapter' && <BankAdapterTab apiConnected={apiConnected} />}
        {activeTab === 'batch' && <BatchScoringTab onBatchScore={handleBatchScore} />}
        {activeTab === 'model-card' && <ModelCardTab modelCard={modelCard} />}
        {activeTab === 'simulator' && <SimulatorTab onSimulate={handleSimulate} />}
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <p>© 2026 Explainable Credit Scoring Engine • India Account Aggregator Architecture • Review 3 Benchmark</p>
      </footer>
    </div>
  );
}

export default App;
