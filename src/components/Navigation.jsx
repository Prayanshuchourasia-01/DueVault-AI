import React from 'react';
import { Home, CalendarDays, Vault, Settings, Orbit, Wallet, CalendarClock } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'focus', icon: Home, label: 'Focus HUD' },
    { id: 'dashboard', icon: CalendarDays, label: 'Dashboard' },
    { id: 'timetable', icon: CalendarClock, label: 'Timetable' },
    { id: 'vault', icon: Vault, label: 'The Vault' },
    { id: 'finances', icon: Wallet, label: 'Finances' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <nav className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex md:flex-col justify-between md:justify-start items-center md:items-start p-4 z-40 fixed bottom-0 md:static md:h-screen">
      
      {/* Brand / Logo (Hidden on small mobile) */}
      <div className="hidden md:flex items-center gap-3 w-full p-2 mb-8 border-b border-slate-800 pb-6">
        <div className="bg-cyan-500/20 p-2 rounded-xl">
          <Orbit className="w-6 h-6 text-cyan-400 animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            DueVault AI
          </h1>
          <p className="text-xs text-slate-500 tracking-widest font-mono">PRO EDITION</p>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex md:flex-col w-full justify-around md:justify-start gap-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-3 p-2 md:p-3 rounded-xl transition-all duration-300 w-full ${
                isActive 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-6 h-6 md:w-5 md:h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`} />
              <span className="text-[10px] md:text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

    </nav>
  );
};

export default Navigation;
