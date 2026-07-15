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
  X,
  ShieldAlert,
  Terminal,
  Globe,
  LayoutGrid
} from 'lucide-react';

const Navigation = ({ 
  activeTab, 
  setActiveTab, 
  theme, 
  setTheme, 
  currentUser, 
  isAdmin, 
  adminMode,
  setAdminMode,
  onSignOut 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // User Space Sidebar Items
  const userNavItems = [
    { id: 'focus', icon: Home, label: 'Focus HUD' },
    { id: 'dashboard', icon: CalendarDays, label: 'Dashboard' },
    { id: 'timetable', icon: CalendarClock, label: 'Timetable' },
    { id: 'vault', icon: Vault, label: 'The Vault' },
    { id: 'finances', icon: Wallet, label: 'Finances' }
  ];

  // Admin Space Sidebar Items
  const adminNavItems = [
    { id: 'admin-dashboard', icon: ShieldCheck, label: 'Admin HUD' },
    { id: 'admin-registry', icon: UsersIcon, label: 'User Directory' },
    { id: 'admin-logs', icon: Terminal, label: 'NLP Audit Logs' },
    { id: 'admin-security', icon: Globe, label: 'IP Whitelist' },
    { id: 'admin-html', icon: Settings, label: 'HTML Config' }
  ];

  // Map Lucide icons correctly
  function UsersIcon(props) {
    return <User {...props} />;
  }

  // Active items listing helper
  const mainNavItems = adminMode ? adminNavItems : userNavItems;
  const desktopNavItems = adminMode 
    ? adminNavItems 
    : [
        ...userNavItems,
        { id: 'settings', icon: Settings, label: 'Settings' }
      ];

  return (
    <>
      {/* Desktop Sidebar navigation & Mobile bottom bar */}
      <nav className={`w-full md:w-64 border-t md:border-t-0 md:border-r flex md:flex-col justify-around md:justify-start items-center md:items-start p-2 md:p-4 z-40 fixed bottom-0 md:static md:h-screen transition-all duration-350 ${
        adminMode 
          ? 'bg-slate-950 border-rose-900/30' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        
        {/* Brand / Logo (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-3 w-full p-2 mb-6 border-b border-slate-800 pb-4">
          {adminMode ? (
            <>
              <div className="bg-rose-500/20 p-2 rounded-xl border border-rose-500/30">
                <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent truncate">
                  DueVault Admin
                </h1>
                <p className="text-[9px] text-rose-500 tracking-widest font-mono font-bold">SECURE PORTAL</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-cyan-500/20 p-2 rounded-xl">
                <Orbit className="w-6 h-6 text-cyan-400 animate-spin-slow" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent truncate">
                  DueVault AI
                </h1>
                <p className="text-xs text-slate-500 tracking-widest font-mono">PRO EDITION</p>
              </div>
            </>
          )}
        </div>

        {/* User profile widget (Hidden on mobile) */}
        {currentUser && (
          <div className={`hidden md:flex items-center gap-2.5 w-full p-2 mb-4 border rounded-xl ${
            adminMode 
              ? 'bg-rose-950/20 border-rose-900/30' 
              : 'bg-slate-950/40 border-slate-800/80'
          }`}>
            <div className={`p-1.5 rounded-lg border ${
              adminMode 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              {adminMode ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.displayName || currentUser.email}</p>
              <p className={`text-[10px] font-mono tracking-wider font-bold uppercase ${
                adminMode ? 'text-rose-400' : 'text-slate-500'
              }`}>{adminMode ? 'SYSTEM ADMIN' : 'SYNC ENABLED'}</p>
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
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 w-full cursor-pointer border ${
                  isActive 
                    ? (adminMode 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]')
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Switch mode links */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-850 mt-2 space-y-2">
              {adminMode ? (
                <button
                  onClick={() => { setAdminMode(false); setActiveTab('focus'); }}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 w-full cursor-pointer text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20"
                >
                  <LayoutGrid className="w-5 h-5" />
                  <span className="text-sm font-medium">User Workspace</span>
                </button>
              ) : (
                <button
                  onClick={() => { setAdminMode(true); setActiveTab('admin-dashboard'); }}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 w-full cursor-pointer text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">Admin Console</span>
                </button>
              )}
            </div>
          )}
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
                  isActive 
                    ? (adminMode ? 'text-rose-400' : 'text-indigo-400') 
                    : 'text-slate-500'
                }`}
              >
                <Icon className="w-5.5 h-5.5" />
                <span className="text-[9px] font-bold mt-1 tracking-tight truncate max-w-[55px]">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
          
          {/* Mobile "More" Tab Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all flex-1 cursor-pointer ${
              isMobileMenuOpen ? (adminMode ? 'text-rose-400' : 'text-indigo-400') : 'text-slate-500'
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
            <div className={`flex items-center gap-3 p-3 border rounded-2xl ${
              adminMode ? 'bg-rose-950/20 border-rose-900/30' : 'bg-slate-900/60 border-slate-800/80'
            }`}>
              <div className={`p-2 rounded-xl border shrink-0 ${
                adminMode 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              }`}>
                {adminMode ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-200 truncate">{currentUser.displayName || currentUser.email}</p>
                <p className={`text-[9px] font-mono tracking-wider truncate uppercase font-bold ${
                  adminMode ? 'text-rose-400' : 'text-slate-500'
                }`}>{adminMode ? 'ADMIN PRIVILEGES' : 'SYNC CHANNEL ACTIVE'}</p>
              </div>
            </div>
          )}

          {/* Settings option (only for standard mode or fallback) */}
          {!adminMode && (
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
          )}

          {/* Switch mode links on mobile */}
          {isAdmin && (
            <div className="pt-1.5 border-t border-slate-850/80 mt-1 flex flex-col gap-2">
              {adminMode ? (
                <button
                  onClick={() => { setAdminMode(false); setActiveTab('focus'); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3.5 p-3 rounded-xl transition-all w-full cursor-pointer text-amber-400 bg-amber-500/10 border border-amber-500/20"
                >
                  <LayoutGrid className="w-5 h-5" />
                  <span className="text-sm font-bold">User Workspace Mode</span>
                </button>
              ) : (
                <button
                  onClick={() => { setAdminMode(true); setActiveTab('admin-dashboard'); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3.5 p-3 rounded-xl transition-all w-full cursor-pointer text-rose-400 bg-rose-500/10 border border-rose-500/20"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-bold">Admin Console Mode</span>
                </button>
              )}
            </div>
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
