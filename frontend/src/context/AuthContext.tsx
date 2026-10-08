import React, { createContext, useContext, useState } from 'react';

export interface UserSession {
  isLoggedIn: boolean;
  role: 'borrower' | 'bank' | null;
  username: string;
  email: string;
  organization?: string;
  token?: string;
}

interface AuthContextType {
  session: UserSession;
  loginAsBorrower: (username: string, mobile: string) => void;
  loginAsBank: (username: string, bankName: string, employeeId: string) => void;
  logout: () => void;
}

const defaultSession: UserSession = {
  isLoggedIn: false,
  role: null,
  username: '',
  email: '',
  organization: ''
};

const AuthContext = createContext<AuthContextType>({
  session: defaultSession,
  loginAsBorrower: () => {},
  loginAsBank: () => {},
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('credit_app_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return defaultSession; }
    }
    return defaultSession;
  });

  const loginAsBorrower = (username: string, mobile: string) => {
    const newSession: UserSession = {
      isLoggedIn: true,
      role: 'borrower',
      username: username || 'Aarav Sharma',
      email: `${mobile || '9876543210'}@aa.consent.in`,
      organization: 'Account Aggregator Consent Portal',
      token: 'jwt_borrower_aa_auth_token_9921'
    };
    setSession(newSession);
    localStorage.setItem('credit_app_session', JSON.stringify(newSession));
  };

  const loginAsBank = (username: string, bankName: string, employeeId: string) => {
    const newSession: UserSession = {
      isLoggedIn: true,
      role: 'bank',
      username: username || 'Dr. Rajesh Verma (Lead Risk Auditor)',
      email: `${employeeId || 'EMP-8821'}@hdfcbank.com`,
      organization: bankName || 'HDFC Credit Risk Management',
      token: 'jwt_bank_admin_sec_token_5510'
    };
    setSession(newSession);
    localStorage.setItem('credit_app_session', JSON.stringify(newSession));
  };

  const logout = () => {
    setSession(defaultSession);
    localStorage.removeItem('credit_app_session');
  };

  return (
    <AuthContext.Provider value={{ session, loginAsBorrower, loginAsBank, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
