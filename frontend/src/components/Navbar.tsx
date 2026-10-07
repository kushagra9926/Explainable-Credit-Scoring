import React from 'react';
import { UserCheck, Layers, ShieldCheck, Cpu, Activity } from 'lucide-react';

interface NavbarProps { activeTab: string; setActiveTab: (tab: string) => void; apiConnected: boolean; }

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, apiConnected }) => {
  const tabs = [
    { id: 'single', label: 'Score an applicant', icon: UserCheck },
    { id: 'batch', label: 'Batch scoring', icon: Layers },
    { id: 'simulator', label: 'UPI simulator', icon: Cpu },
    { id: 'model-card', label: 'Model & fairness', icon: ShieldCheck },
  ];
  return (
    <aside className="side">
      <button className="brand" onClick={() => setActiveTab('single')} aria-label="CreditLens home">
        <span className="brand-mark"><Activity size={16} color="#fff" strokeWidth={2.5} /></span>
        <b>CreditLens</b>
      </button>
      <nav className="nav" aria-label="Main">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>
      <div className={`status ${apiConnected ? 'on' : ''}`} role="status">
        <i />
        <span><b>{apiConnected ? 'Live model' : 'Demo mode'}</b>{apiConnected ? 'Connected to scoring API' : 'Using the built-in scoring engine'}</span>
      </div>
    </aside>
  );
};
