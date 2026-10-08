import React from 'react';
import { UserCheck, Building2, FileSpreadsheet, Cpu, ShieldCheck, ArrowRight, Sparkles, Download, BarChart3, HelpCircle } from 'lucide-react';
import { SAMPLE_PERSONA_FILES, downloadPersonaCSV } from '../utils/csvDownloader';

interface Props {
  onSelectRole: (role: 'borrower' | 'bank') => void;
  apiConnected: boolean;
}

export const LandingPage: React.FC<Props> = ({ onSelectRole, apiConnected }) => {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              CreditPulse X
            </h1>
            <p className="text-xs text-slate-400 font-mono">Explainable AI Credit Scoring Platform</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2 border ${
            apiConnected 
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' 
              : 'bg-amber-950/60 border-amber-500/30 text-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{apiConnected ? 'ML Core Online (FastAPI)' : 'Standalone Mode Active'}</span>
          </div>
        </div>
      </header>

      {/* Main Hero & Role Selection */}
      <main className="max-w-6xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Account Aggregator & Alternative Credit Intelligence</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Select Your Portal to Get Started
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Are you looking to get candidate credit scores as a borrower, or train & configure models on the bank server side?
          </p>
        </div>

        {/* 2 Primary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* BORROWER PORTAL CARD */}
          <div 
            onClick={() => onSelectRole('borrower')}
            className="group relative bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-8 cursor-pointer transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserCheck className="w-32 h-32 text-emerald-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  Borrower View
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Candidate / Borrower Portal
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Attach your transaction & credit history CSV, complete a short questionnaire, and receive an instant explainable credit score with SHAP breakdown.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-xs text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 mr-2.5 flex-shrink-0" />
                  <span>Attach Transaction / Credit History File (CSV)</span>
                </div>
                <div className="flex items-center text-xs text-slate-300">
                  <HelpCircle className="w-4 h-4 text-emerald-400 mr-2.5 flex-shrink-0" />
                  <span>Short Financial & Loan Purpose Questionnaire</span>
                </div>
                <div className="flex items-center text-xs text-slate-300">
                  <BarChart3 className="w-4 h-4 text-emerald-400 mr-2.5 flex-shrink-0" />
                  <span>Transparent Score (300-900) & SHAP Explainability</span>
                </div>
              </div>
            </div>

            <button className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 group-hover:translate-x-1 transition-all">
              <span>Enter Borrower Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* BANK PORTAL CARD */}
          <div 
            onClick={() => onSelectRole('bank')}
            className="group relative bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-8 cursor-pointer transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Building2 className="w-32 h-32 text-indigo-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  Bank / Admin View
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                Bank & Server Control Panel
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Upload training data (synthetic or real bank datasets), train/fine-tune ML models, configure parameters, and sync active models to live scoring.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center text-xs text-slate-300">
                  <Cpu className="w-4 h-4 text-indigo-400 mr-2.5 flex-shrink-0" />
                  <span>Train & Fine-Tune ML Model on Custom Bank Datasets</span>
                </div>
                <div className="flex items-center text-xs text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 mr-2.5 flex-shrink-0" />
                  <span>Monotonic Constraints & Hyperparameter Tuning</span>
                </div>
                <div className="flex items-center text-xs text-slate-300">
                  <BarChart3 className="w-4 h-4 text-indigo-400 mr-2.5 flex-shrink-0" />
                  <span>Live Metrics (AUC-ROC, Loss Curves, Batch Audits)</span>
                </div>
              </div>
            </div>

            <button className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 group-hover:translate-x-1 transition-all">
              <span>Enter Bank Admin Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Demo Personas Download Bar for Reviewers */}
        <div className="mt-12 bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-semibold text-slate-200">Download Demo Candidate Persona Files (For Reviewers)</h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Download sample CSV files to manually test the Borrower Portal upload & scoring pipeline.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {SAMPLE_PERSONA_FILES.map((persona, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadPersonaCSV(persona);
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 font-medium border border-slate-700/60 flex items-center space-x-1.5 transition-colors"
                  title={persona.description}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{persona.filename}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500 bg-slate-950/80">
        <p>© 2026 Explainable Credit Scoring Engine • Bank & Borrower Architecture • Review 3 Benchmark</p>
      </footer>
    </div>
  );
};
