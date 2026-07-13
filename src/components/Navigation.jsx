import React, { useState } from 'react';
import { 
  Home, 
  CalendarDays, 
  Vault, 
  Settings, 
  Orbit, 
  Wallet, 
  CalendarClock, 
  Sun, 
  Moon, 
  ShieldCheck, 
  LogOut, 
  User,
  Menu,
  X
} from 'lucide-react';

const Navigation = ({ 
  activeTab, 
  setActiveTab, 
  theme, 
  setTheme, 
  currentUser, 
  isAdmin, 
  onSignOut 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mainNavItems = [
    { id: 'focus', icon: Home, label: 'Focus HUD' },
    { id: 'dashboard', icon: CalendarDays, label: 'Dashboard' },
    { id: 'timetable', icon: CalendarClock, label: 'Timetable' },
    { id: 'vault', icon: Vault, label: 'The Vault' },
    { id: 'finances', icon: Wallet, label: 'Finances' }
  ];

  // Desktop links list
  const desktopNavItems = [
    ...mainNavItems,
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];
  if (isAdmin) {
    desktopNavItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin Portal' });
  }

  return (
    <>
      {/* Desktop Sidebar navigation & Mobile bottom bar */}
      <nav className="w-full md:w-64 bg-slate-900 border-t md:border-t-0 md:border-r border-slate-800 flex md:flex-col justify-around md:justify-start items-center md:items-start p-2 md:p-4 z-40 fixed bottom-0 md:static md:h-screen">
        
        {/* Brand / Logo (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-3 w-full p-2 mb-6 border-b border-slate-800 pb-4">
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

        {/* User profile widget (Hidden on mobile) */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-2.5 w-full p-2 mb-4 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <div className="bg-indigo-500/10 p-1.5 rounded-lg text-indigo-400 border border-indigo-500/20">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.displayName || currentUser.email}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{isAdmin ? 'ADMIN ACCESS' : 'SYNC ENABLED'}</p>
            </div>
          </div>
        )}

        {/* Desktop Links Directory */}
        <div className="hidden md:flex md:flex-col w-full gap-2 flex-1">
          {desktopNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 w-full cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Bottom Actions (Sign Out & Theme) */}
        <div className="hidden md:flex md:flex-col w-full gap-1 mt-auto pt-4 border-t border-slate-850">
          {currentUser && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 w-full text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          )}

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 w-full text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
            <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        {/* Mobile Horizontal Bottom Menu */}
        <div className="flex md:hidden w-full justify-between items-center px-1">
          {mainNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !isMobileMenuOpen;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all flex-1 cursor-pointer ${
                  isActive ? 'text-indigo-400' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5.5 h-5.5" />
                <span className="text-[9px] font-bold mt-1 tracking-tight truncate max-w-[55px]">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
          
          {/* Mobile "More" Tab Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all flex-1 cursor-pointer ${
              isMobileMenuOpen ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            {isMobileMenuOpen ? <X className="w-5.5 h-5.5 text-rose-400" /> : <Menu className="w-5.5 h-5.5" />}
            <span className="text-[9px] font-bold mt-1 tracking-tight">{isMobileMenuOpen ? 'Close' : 'More'}</span>
          </button>
        </div>

      </nav>

      {/* Mobile Drawer Menu Popup */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 bottom-16 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 p-5 z-[35] rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.6)] flex flex-col gap-3.5 animate-slide-up">
          
          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Device Configurations</span>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-slate-400 hover:text-rose-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User profile details */}
          {currentUser && (
            <div className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
              <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400 border border-indigo-500/20 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-200 truncate">{currentUser.displayName || currentUser.email}</p>
                <p className="text-[9px] text-slate-500 font-mono tracking-wider truncate uppercase">{isAdmin ? 'ADMIN PRIVILEGES' : 'SYNC CHANNEL ACTIVE'}</p>
              </div>
            </div>
          )}

          {/* Settings option */}
          <button
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-3.5 p-3 rounded-xl transition-all w-full cursor-pointer border ${
              activeTab === 'settings' 
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' 
                : 'text-slate-300 hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-bold">Settings Panel</span>
          </button>

          {/* Admin Tab option */}
          {isAdmin && (
            <button
              onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-3.5 p-3 rounded-xl transition-all w-full cursor-pointer border ${
                activeTab === 'admin' 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' 
                  : 'text-slate-300 hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold">Admin Portal</span>
            </button>
          )}

          {/* Light/Dark mode option */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3.5 p-3 rounded-xl transition-all w-full text-slate-300 hover:bg-slate-800/50 border border-transparent cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
            <span className="text-sm font-bold">{theme === 'dark' ? 'Switch Light Mode' : 'Switch Dark Mode'}</span>
          </button>

          {/* Sign Out option */}
          {currentUser && (
            <button
              onClick={() => { onSignOut(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-3.5 p-3 rounded-xl transition-all w-full text-rose-400 hover:bg-rose-500/10 border border-dashed border-rose-500/20 hover:border-rose-500/30 cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-rose-400" />
              <span className="text-sm font-bold">Sign Out Profile</span>
            </button>
          )}

        </div>
      )}
    </>
  );
};

export default Navigation;
