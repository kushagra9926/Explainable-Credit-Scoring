import React, { useState } from 'react';
import { Cpu, Play, RefreshCw, Layers, FileCode } from 'lucide-react';

interface Props {
  onSimulate: (platform: string, gender: string, city: string) => Promise<any>;
}

export const SimulatorTab: React.FC<Props> = ({ onSimulate }) => {
  const [platform, setPlatform] = useState('delivery');
  const [gender, setGender] = useState('Female');
  const [cityTier, setCityTier] = useState('Tier-2');
  const [simOutput, setSimOutput] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await onSimulate(platform, gender, cityTier);
      setSimOutput(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Simulation Controls Header */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Account Aggregator (AA) Synthetic UPI Transaction Simulator</h2>
            <p className="text-xs text-slate-400">
              Generates 6 months of daily transaction logs over NPCI/RBI realistic ticket size distributions and extracts behavioral features.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">Gig Platform Type</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="delivery">Delivery Partner (Zomato / Swiggy)</option>
              <option value="ride">Ride-Hail Driver (Uber / Ola)</option>
              <option value="freelance">Freelance Designer / Developer</option>
              <option value="vendor">Micro-Vendor / Kirana Shop</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Protected Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Protected City Tier</label>
            <select
              value={cityTier}
              onChange={(e) => setCityTier(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Tier-1">Tier-1 Metros</option>
              <option value="Tier-2">Tier-2 Cities</option>
              <option value="Tier-3">Tier-3 Towns</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="gradient-btn w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center space-x-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{loading ? 'Simulating Daily Transactions...' : 'Simulate 6-Month Transaction Log & Score'}</span>
        </button>
      </div>

      {/* Output Grid */}
      {simOutput && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Extracted Features */}
          <div className="lg:col-span-6 glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Extracted Account Aggregator Behavioral Features</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 glass-card-sm">
                <span className="text-[10px] text-slate-400 font-bold block">MONTHLY INFLOW AVG</span>
                <span className="text-base font-bold text-white">₹{simOutput.extracted_features.monthly_inflow_avg}</span>
              </div>
              <div className="p-3 glass-card-sm">
                <span className="text-[10px] text-slate-400 font-bold block">INFLOW VOLATILITY</span>
                <span className="text-base font-bold text-indigo-400">{simOutput.extracted_features.inflow_volatility}</span>
              </div>
              <div className="p-3 glass-card-sm">
                <span className="text-[10px] text-slate-400 font-bold block">ACTIVE DAYS RATIO</span>
                <span className="text-base font-bold text-emerald-400">{(simOutput.extracted_features.active_days_ratio * 100).toFixed(0)}%</span>
              </div>
              <div className="p-3 glass-card-sm">
                <span className="text-[10px] text-slate-400 font-bold block">UTILITY PUNCTUALITY</span>
                <span className="text-base font-bold text-emerald-400">{(simOutput.extracted_features.utility_punctuality_score * 100).toFixed(0)}%</span>
              </div>
              <div className="p-3 glass-card-sm">
                <span className="text-[10px] text-slate-400 font-bold block">EMERGENCY DRAWDOWNS</span>
                <span className="text-base font-bold text-rose-400">{simOutput.extracted_features.emergency_drawdown_count}</span>
              </div>
              <div className="p-3 glass-card-sm">
                <span className="text-[10px] text-slate-400 font-bold block">ZERO BALANCE DAYS</span>
                <span className="text-base font-bold text-amber-400">{simOutput.extracted_features.zero_balance_days}</span>
              </div>
            </div>
          </div>

          {/* Scoring Decision */}
          <div className="lg:col-span-6 glass-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Model Score Output</span>
            </h3>

            <div className="p-5 glass-card-sm text-center space-y-3">
              <div className="text-4xl font-black text-white">
                {simOutput.credit_decision.credit_score}
                <span className="text-xs text-slate-400 font-normal ml-1">/ 900</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-white/10 text-emerald-400">
                Decision: {simOutput.credit_decision.decision} ({simOutput.credit_decision.risk_tier})
              </div>
              <p className="text-xs text-slate-400">
                Default Probability: <strong className="text-white">{(simOutput.credit_decision.default_probability * 100).toFixed(1)}%</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
