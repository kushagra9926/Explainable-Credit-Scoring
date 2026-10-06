import React from 'react';
import { ShieldCheck, UserCheck, Layers, Cpu, Activity, Building2 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  apiConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, apiConnected }) => {
  const tabs = [
    { id: 'single', label: 'Single Applicant Scorer', icon: UserCheck },
    { id: 'bank-adapter', label: 'Bank Feature Adapter', icon: Building2 },
    { id: 'batch', label: 'Bank Batch Scoring', icon: Layers },
    { id: 'model-card', label: 'Model Card & Fairness Hub', icon: ShieldCheck },
    { id: 'simulator', label: 'AA UPI Simulator', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 glass-card rounded-none border-t-0 border-x-0 border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('single')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight gradient-text">UPI CreditLens</h1>
            <p className="text-xs text-slate-400 font-medium">Bank-Deployable Explainable Credit Scoring</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-xl border border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* API Connection Indicator */}
        <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-white/5 text-xs">
          <span className={`w-2.5 h-2.5 rounded-full ${apiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="text-slate-300 font-mono">
            {apiConnected ? 'FastAPI Engine: Active' : 'Offline / Standalone Mode'}
          </span>
        </div>
      </div>
    </header>
  );
};
