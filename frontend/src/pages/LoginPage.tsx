import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Key, User, Building, ArrowLeft, Lock, Sparkles } from 'lucide-react';

interface Props {
  targetRole: 'borrower' | 'bank';
  onBack: () => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<Props> = ({ targetRole, onBack, onSuccess }) => {
  const { loginAsBorrower, loginAsBank } = useAuth();

  // Borrower Form State
  const [borrowerName, setBorrowerName] = useState('Aarav Sharma');
  const [borrowerMobile, setBorrowerMobile] = useState('9876543210');

  // Bank Form State
  const [bankOfficerName, setBankOfficerName] = useState('Dr. Rajesh Verma');
  const [bankName, setBankName] = useState('HDFC Bank Risk Management');
  const [employeeId, setEmployeeId] = useState('EMP-RISK-9901');
  const [password, setPassword] = useState('••••••••••••');

  const handleBorrowerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsBorrower(borrowerName, borrowerMobile);
    onSuccess();
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsBank(bankOfficerName, bankName, employeeId);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        
        <button 
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portal Selection</span>
        </button>

        {targetRole === 'borrower' ? (
          /* BORROWER AUTH FORM */
          <form onSubmit={handleBorrowerSubmit} className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Borrower & Candidate Login</h2>
              <p className="text-xs text-slate-400 mt-1">Authenticate via Account Aggregator Framework</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Mobile / AA Handle</label>
                <input 
                  type="text" 
                  value={borrowerMobile}
                  onChange={(e) => setBorrowerMobile(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Authenticate & Access Scoring</span>
            </button>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  loginAsBorrower("Aarav Sharma (Zomato Partner)", "9876543210");
                  onSuccess();
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 font-medium border border-slate-700/60 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quick Demo Login (Candidate Aarav)</span>
              </button>
            </div>
          </form>
        ) : (
          /* BANK ADMIN AUTH FORM */
          <form onSubmit={handleBankSubmit} className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-3">
                <Building className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Bank Officer & Admin Portal Login</h2>
              <p className="text-xs text-slate-400 mt-1">Underwriter & Server Management Authentication</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Officer Name</label>
                <input 
                  type="text" 
                  value={bankOfficerName}
                  onChange={(e) => setBankOfficerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Financial Institution</label>
                <input 
                  type="text" 
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Employee ID</label>
                  <input 
                    type="text" 
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Passcode</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Key className="w-4 h-4" />
              <span>Authenticate Bank Underwriter Portal</span>
            </button>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  loginAsBank("Dr. Rajesh Verma (Lead Auditor)", "HDFC Credit Risk", "EMP-9901");
                  onSuccess();
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 font-medium border border-slate-700/60 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Quick Demo Login (Lead Risk Auditor)</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
