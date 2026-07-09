import React, { useState, useMemo } from 'react';
import { Wallet, TrendingDown, TrendingUp, DollarSign, Plus, Trash2, CalendarDays, Activity, PieChart, ShieldCheck, Eye, EyeOff, BarChart3, X, CheckSquare, Square, AlertTriangle, CalendarRange } from 'lucide-react';
import { useFinances } from '../../hooks/useFinances';

const FinanceTab = ({ tasks, sendNotification }) => {
  const { 
    finances, 
    addTransaction, 
    deleteTransaction, 
    updateWalletBalance, 
    updateWalletStartingBalance,
    toggleWalletVisibility, 
    setWalletSpendLimit, 
    setWalletLimitEnabled,
    addWallet,
    deleteWallet,
    resetWalletsToStarting,
    dismissResetWeek,
    getWeekIdentifier,
    setBudgetLimit, 
    setWeeklyLimit, 
    addGoal, 
    updateGoal, 
    deleteGoal,
    saveReport
  } = useFinances();

  const [activePeriod, setActivePeriod] = useState('CURRENT_WEEK'); // 'CURRENT_WEEK', 'PREV_WEEK', 'PREV_MONTH'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [txType, setTxType] = useState('EXPENSE'); // 'EXPENSE' or 'INCOME'
  
  const [newTx, setNewTx] = useState({ 
    title: '', amount: '', date: new Date().toLocaleDateString('en-CA'), 
    sourceWallet: 'cash', category: 'food' 
  });

  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: 0 });
  const [newAccount, setNewAccount] = useState({ name: '', balance: '', startingBalance: '', isHidden: false, spendLimit: '', limitEnabled: false });

  // Period ranges calculation
  const today = new Date();
  const day = today.getDay() || 7; // Sunday is 7
  
  // Current Week (Monday to Sunday)
  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - day + 1);
  startOfThisWeek.setHours(0,0,0,0);
  
  const endOfThisWeek = new Date(startOfThisWeek);
  endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);
  endOfThisWeek.setHours(23,59,59,999);

  // Previous Week (Monday to Sunday of last week)
  const startOfPrevWeek = new Date(startOfThisWeek);
  startOfPrevWeek.setDate(startOfThisWeek.getDate() - 7);
  startOfPrevWeek.setHours(0,0,0,0);
  
  const endOfPrevWeek = new Date(startOfPrevWeek);
  endOfPrevWeek.setDate(startOfPrevWeek.getDate() + 6);
  endOfPrevWeek.setHours(23,59,59,999);

  // Previous Month (e.g. 1st to 30th/31st of previous month)
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  endOfPrevMonth.setHours(23,59,59,999);

  // Expose period state bounds
  const activeBounds = useMemo(() => {
    if (activePeriod === 'CURRENT_WEEK') return { start: startOfThisWeek, end: endOfThisWeek, label: 'Current Week' };
    if (activePeriod === 'PREV_WEEK') return { start: startOfPrevWeek, end: endOfPrevWeek, label: 'Previous Week' };
    return { start: startOfPrevMonth, end: endOfPrevMonth, label: 'Previous Month' };
  }, [activePeriod, startOfThisWeek, endOfThisWeek, startOfPrevWeek, endOfPrevWeek, startOfPrevMonth, endOfPrevMonth]);

  // Check if a date string falls inside the active period
  const isInActivePeriod = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(12,0,0,0); // Avoid timezone shift
    return d >= activeBounds.start && d <= activeBounds.end;
  };

  // Check specifically for current week
  const isInCurrentWeek = (dateStr) => {
    const d = new Date(dateStr);
    d.setHours(12,0,0,0);
    return d >= startOfThisWeek && d <= endOfThisWeek;
  };

  // Filtered transactions for the current period selection
  const periodTransactions = useMemo(() => {
    return (finances.transactions || []).filter(tx => isInActivePeriod(tx.date));
  }, [finances.transactions, activePeriod, activeBounds]);

  // Cashflow for the period
  const cashflow = useMemo(() => {
    const income = periodTransactions.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + Number(tx.amount), 0);
    const spent = periodTransactions.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + Number(tx.amount), 0);
    return { income, spent };
  }, [periodTransactions]);

  // Total spent per wallet in the current week (for spend limits)
  const getWalletWeeklySpent = (walletId) => {
    return (finances.transactions || [])
      .filter(tx => tx.sourceWallet === walletId && tx.type === 'EXPENSE' && isInCurrentWeek(tx.date))
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  };

  // Total balance of visible accounts
  const totalBalance = Object.values(finances.wallets).filter(w => !w.isHidden).reduce((sum, w) => sum + w.balance, 0);

  // Filter bills for Safe-To-Spend
  const todayStr = new Date().toLocaleDateString('en-CA');
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

  const upcomingBills = tasks
    .filter(t => {
      if ((t.category !== 'finance' && t.category !== 'bill') || t.date < todayStr || t.completed) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcomingBillsCost = upcomingBills.reduce((sum, bill) => {
    const match = bill.title.match(/(?:₹|Rs\.?|\$)\s*(\d+(\.\d+)?)/i);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  const safeToSpend = totalBalance - upcomingBillsCost;

  // Budget progress calculations based on selected tab type
  const budgetLimit = activePeriod === 'PREV_MONTH' ? finances.monthlyBudget.limit : (finances.weeklyBudget?.limit || 200);
  const budgetPercent = Math.min((cashflow.spent / (budgetLimit || 1)) * 100, 100);

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!newTx.title || !newTx.amount) return;
    
    // Check spend limit violations
    const wallet = finances.wallets[newTx.sourceWallet];
    if (wallet && wallet.limitEnabled && txType === 'EXPENSE') {
      const currentWeeklySpent = getWalletWeeklySpent(newTx.sourceWallet);
      if (currentWeeklySpent + Number(newTx.amount) > wallet.spendLimit) {
        if (sendNotification) {
          sendNotification("Spend Limit Exceeded!", `Warning: ${wallet.name} weekly spend limit of ₹${wallet.spendLimit} has been breached!`);
        }
      }
    }

    addTransaction({ ...newTx, type: txType });
    setNewTx({ title: '', amount: '', date: new Date().toLocaleDateString('en-CA'), sourceWallet: Object.keys(finances.wallets)[0] || 'cash', category: 'food' });
    setShowAddModal(false);
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!newAccount.name || !newAccount.balance) return;
    addWallet(
      newAccount.name, 
      newAccount.balance, 
      newAccount.isHidden, 
      newAccount.limitEnabled ? newAccount.spendLimit : 0, 
      newAccount.limitEnabled
    );
    setNewAccount({ name: '', balance: '', startingBalance: '', isHidden: false, spendLimit: '', limitEnabled: false });
    setShowAddAccountModal(false);
  };

  const handleExportCSV = () => {
    if (!periodTransactions || periodTransactions.length === 0) return;
    const headers = "ID,Type,Date,Title,Category,Amount,Wallet\n";
    const rows = periodTransactions.map(tx => 
      `${tx.id},${tx.type},${tx.date},"${tx.title}","${tx.category}",${tx.amount},"${finances.wallets[tx.sourceWallet]?.name || ''}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duevault_${activePeriod.toLowerCase()}_ledger_${new Date().toLocaleDateString('en-CA')}.csv`;
    a.click();
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target) return;
    addGoal(newGoal);
    setNewGoal({ name: '', target: '', current: 0 });
  };

  // Week reset fresh start trigger
  const currentWeekId = getWeekIdentifier(new Date());
  const showResetPrompt = finances.lastResetWeek !== currentWeekId;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 md:pb-6 font-sans">
      
      {/* Week Reset Fresh Start Banner */}
      {showResetPrompt && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-indigo-950/20 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">📅</span>
            <div>
              <h4 className="font-bold text-white text-sm">New Week Fresh Start!</h4>
              <p className="text-xs text-slate-400">Sync all your accounts back to their default weekly starting balances?</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={resetWalletsToStarting} className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer">
              Reset Balances
            </button>
            <button onClick={dismissResetWeek} className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header & Section Toggles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            Financial Control Center
          </h2>
          <p className="text-slate-400 mt-2">Professional tracking for budget limits, net worth, and liquidity.</p>
        </div>

        {/* Dynamic Period Selectors */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-full md:w-auto">
          {[
            { id: 'CURRENT_WEEK', label: 'Current Week' },
            { id: 'PREV_WEEK', label: 'Previous Week' },
            { id: 'PREV_MONTH', label: 'Previous Month' }
          ].map(period => (
            <button
              key={period.id}
              onClick={() => setActivePeriod(period.id)}
              className={`flex-1 md:flex-none text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                activePeriod === period.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="text-9xl font-bold text-white opacity-50">₹</span>
          </div>
          <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">Total Liquidity</h3>
          <p className="text-4xl font-extrabold text-white">₹{totalBalance.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-2">Available across all active non-savings accounts.</p>
        </div>

        <div className="bg-slate-900 border border-emerald-900/50 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <ShieldCheck className="w-24 h-24 text-emerald-400" />
          </div>
          <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2">Safe-To-Spend</h3>
          <p className="text-4xl font-extrabold text-white">₹{safeToSpend.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-2">Total Balance minus ₹{upcomingBillsCost.toFixed(2)} in estimated upcoming bills.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
          <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">{activeBounds.label} Cashflow</h3>
          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400"/> Inflow</p>
              <p className="text-xl font-bold text-emerald-400">+₹{cashflow.income.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1 flex items-center justify-end gap-1"><TrendingDown className="w-3 h-3 text-red-400"/> Outflow</p>
              <p className="text-xl font-bold text-red-400">-₹{cashflow.spent.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Budget & Wallets */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Dynamic Budget Limit Tracker */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-1">
                  <PieChart className="w-4 h-4 text-cyan-400"/> {activePeriod === 'PREV_MONTH' ? 'Monthly' : 'Weekly'} Budget Tracker
                </h3>
                <div className="text-2xl font-bold text-white">₹{cashflow.spent.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Limit</span>
                <div className="text-lg font-bold text-slate-300">
                  {activePeriod === 'PREV_MONTH' ? (
                    <input 
                      type="number" 
                      value={finances.monthlyBudget.limit} 
                      onChange={(e) => setBudgetLimit(e.target.value)}
                      className="w-20 bg-transparent border-b border-slate-700 text-right focus:outline-none focus:border-cyan-500"
                    />
                  ) : (
                    <input 
                      type="number" 
                      value={finances.weeklyBudget?.limit || 200} 
                      onChange={(e) => setWeeklyLimit(e.target.value)}
                      className="w-20 bg-transparent border-b border-slate-700 text-right focus:outline-none focus:border-cyan-500"
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-1000 ${budgetPercent > 90 ? 'bg-red-500' : (budgetPercent > 75 ? 'bg-orange-500' : 'bg-cyan-500')}`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs text-slate-500">{budgetPercent.toFixed(1)}% Used</p>
              <p className="text-xs text-slate-500">₹{(budgetLimit - cashflow.spent).toFixed(2)} Left</p>
            </div>
          </div>

          {/* Managed Accounts widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4"/> Managed Accounts
              </h3>
              <button 
                onClick={() => setShowAddAccountModal(true)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded"
              >
                + ADD
              </button>
            </div>
            <div className="space-y-4">
              {Object.values(finances.wallets).map(wallet => {
                const weeklySpent = getWalletWeeklySpent(wallet.id);
                const isLimitExceeded = wallet.limitEnabled && weeklySpent > wallet.spendLimit;
                
                return (
                  <div key={wallet.id} className={`p-4 rounded-xl border transition-all ${
                    wallet.isHidden ? 'bg-slate-900/50 border-slate-800/50 opacity-60' : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/80'
                  } ${isLimitExceeded ? 'ring-1 ring-red-500/50 border-red-500/40' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button onClick={() => toggleWalletVisibility(wallet.id)} className="text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0">
                          {wallet.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <span className="font-bold text-slate-200 truncate">{wallet.name}</span>
                        {isLimitExceeded && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                            EXCEEDED
                          </span>
                        )}
                      </div>
                      
                      {/* Delete option for custom wallets */}
                      {wallet.id.startsWith('wallet-') && (
                        <button onClick={() => deleteWallet(wallet.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">CURRENT BAL</span>
                        <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          <span className="text-slate-600 text-xs">₹</span>
                          <input 
                            type="number" 
                            value={wallet.balance} 
                            onChange={(e) => updateWalletBalance(wallet.id, e.target.value)}
                            className="w-full bg-transparent text-right font-mono font-bold text-white text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">DEFAULT START</span>
                        <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          <span className="text-slate-600 text-xs">₹</span>
                          <input 
                            type="number" 
                            value={wallet.startingBalance !== undefined ? wallet.startingBalance : wallet.balance} 
                            onChange={(e) => updateWalletStartingBalance(wallet.id, e.target.value)}
                            className="w-full bg-transparent text-right font-mono text-slate-300 text-sm focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="checkbox" 
                          id={`limit-enable-${wallet.id}`}
                          checked={wallet.limitEnabled || false}
                          onChange={(e) => setWalletLimitEnabled(wallet.id, e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700"
                        />
                        <label htmlFor={`limit-enable-${wallet.id}`} className="text-slate-500 cursor-pointer select-none">Limit:</label>
                      </div>
                      {wallet.limitEnabled ? (
                        <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          <span className="text-slate-600">₹</span>
                          <input 
                            type="number" 
                            value={wallet.spendLimit || 0} 
                            onChange={(e) => setWalletSpendLimit(wallet.id, e.target.value)}
                            className="w-16 bg-transparent text-right font-mono text-cyan-400 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono text-xs">No Limit</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Savings Goals */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4"/> Savings Goals
            </h3>
            <div className="space-y-4">
              {(finances.goals || []).map(goal => {
                const percent = Math.min((goal.current / goal.target) * 100, 100);
                return (
                  <div key={goal.id} className="group relative bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                    <button onClick={() => deleteGoal(goal.id)} className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-slate-200">{goal.name}</span>
                      <span className="text-xs font-mono text-slate-400">
                        ₹<input type="number" value={goal.current} onChange={(e) => updateGoal(goal.id, e.target.value)} className="w-16 bg-transparent text-right text-emerald-400 focus:outline-none focus:border-b border-emerald-500" /> 
                        / ₹{goal.target}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
              
              <form onSubmit={handleAddGoal} className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800/50">
                <input type="text" placeholder="Goal Name" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 ring-emerald-500" required />
                <input type="number" placeholder="Target ₹" value={newGoal.target} onChange={e => setNewGoal({...newGoal, target: e.target.value})} className="w-24 bg-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 ring-emerald-500" required />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
              </form>
            </div>
          </div>

        </div>

        {/* Right Column: Ledger & Bills */}
        <div className="lg:col-span-2 space-y-6">
          
          {upcomingBills.length > 0 && activePeriod === 'CURRENT_WEEK' && (
            <div className="bg-gradient-to-r from-orange-950/40 to-slate-900 border border-orange-500/20 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-orange-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Upcoming Scheduled Bills
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingBills.slice(0, 4).map(bill => {
                  const match = bill.title.match(/(?:₹|Rs\.?|\$)\s*(\d+(\.\d+)?)/i);
                  const estAmount = match ? `₹${match[1]}` : 'Est. ₹0';
                  return (
                    <div key={bill.id} className="bg-slate-900/80 border border-orange-500/20 rounded-xl p-4 flex flex-col justify-between hover:border-orange-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-white line-clamp-1">{bill.title}</p>
                        <span className="text-orange-400 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded text-xs">{estAmount}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">{new Date(bill.date).toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4"/> Transaction Ledger ({activeBounds.label})
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={handleExportCSV} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-colors">
                  Export CSV
                </button>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  <BarChart3 className="w-4 h-4" /> Report
                </button>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <Plus className="w-4 h-4" /> Log
                </button>
              </div>
            </div>
            
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/30 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Description</th>
                    <th className="p-4 font-bold">Date & Source</th>
                    <th className="p-4 font-bold text-right">Amount</th>
                    <th className="p-4 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {periodTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 italic">No transactions logged in {activeBounds.label}.</td>
                    </tr>
                  ) : (
                    periodTransactions.map(tx => (
                      <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                        <td className="p-4">
                          {tx.type === 'INCOME' ? (
                            <span className="inline-flex p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><TrendingUp className="w-4 h-4" /></span>
                          ) : (
                            <span className="inline-flex p-2 bg-red-500/10 text-red-400 rounded-lg"><TrendingDown className="w-4 h-4" /></span>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-white">{tx.title}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded uppercase">{tx.category}</span>
                        </td>
                        <td className="p-4 text-sm text-slate-400">
                          {tx.date} <br/> 
                          <span className="text-xs text-slate-500">{finances.wallets[tx.sourceWallet]?.name || 'Unknown Wallet'}</span>
                        </td>
                        <td className={`p-4 text-right font-mono font-bold text-lg ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-white'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => deleteTransaction(tx.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-5 h-5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                New Transaction
              </h3>
            </div>
            <form onSubmit={handleAddTransaction} className="p-6 space-y-5">
              
              <div className="flex bg-slate-800 p-1 rounded-xl">
                <button type="button" onClick={() => setTxType('EXPENSE')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${txType === 'EXPENSE' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}>Expense</button>
                <button type="button" onClick={() => setTxType('INCOME')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${txType === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>Income</button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Description</label>
                <input type="text" required value={newTx.title} onChange={e => setNewTx({...newTx, title: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" placeholder="E.g. Groceries, Salary..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Amount (₹)</label>
                  <input type="number" step="0.01" required value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-cyan-500" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Date</label>
                  <input type="date" required value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Account</label>
                  <select value={newTx.sourceWallet} onChange={e => setNewTx({...newTx, sourceWallet: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500">
                    {Object.values(finances.wallets).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Category</label>
                  <input type="text" required value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value.toLowerCase()})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 uppercase text-xs font-mono" placeholder="FOOD, BILLS..." />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all ${txType === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddAccountModal(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <h3 className="text-xl font-bold text-white">Create New Account</h3>
              <button onClick={() => setShowAddAccountModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Account Name</label>
                <input type="text" required value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. HDFC Credit Card, Savings Bank" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Current Balance (₹)</label>
                  <input type="number" required value={newAccount.balance} onChange={e => setNewAccount({...newAccount, balance: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono focus:outline-none focus:border-indigo-500" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Starting Balance (₹)</label>
                  <input type="number" required value={newAccount.startingBalance !== '' ? newAccount.startingBalance : newAccount.balance} onChange={e => setNewAccount({...newAccount, startingBalance: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono focus:outline-none focus:border-indigo-500" placeholder="Defaults to Current" />
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isHidden" checked={newAccount.isHidden} onChange={e => setNewAccount({...newAccount, isHidden: e.target.checked})} className="rounded bg-slate-800 border-slate-750 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer" />
                <label htmlFor="isHidden" className="text-xs text-slate-300 cursor-pointer select-none font-medium">Exclude from safe-to-spend (Savings)</label>
              </div>

              <div className="border-t border-slate-850 pt-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">Enable Spend Limit</span>
                  <input type="checkbox" checked={newAccount.limitEnabled} onChange={e => setNewAccount({...newAccount, limitEnabled: e.target.checked})} className="rounded bg-slate-800 border-slate-750 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer" />
                </div>
                {newAccount.limitEnabled && (
                  <input type="number" required={newAccount.limitEnabled} value={newAccount.spendLimit} onChange={e => setNewAccount({...newAccount, spendLimit: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono focus:outline-none focus:border-indigo-500" placeholder="Enter limit in ₹" />
                )}
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddAccountModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_10px_rgba(79,70,229,0.3)]">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:p-0 print:block print:bg-white print:text-black">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm print:hidden" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in print:shadow-none print:border-none print:rounded-none print:bg-white">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30 print:hidden">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" /> Professional Financial Report ({activeBounds.label})
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    saveReport({ title: `${activeBounds.label} Report`, totalExpenses: cashflow.spent });
                    window.print();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" /> Save as PDF / Print
                </button>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Header (Visible only in print) */}
            <div className="hidden print:block p-8 pb-4 border-b border-gray-200">
              <h1 className="text-3xl font-black text-gray-900">DueVault Financial Report</h1>
              <p className="text-gray-500 mt-1">Generated on {new Date().toLocaleString()} ({activeBounds.label})</p>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 print:border-gray-200 print:bg-gray-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-gray-500">Total Outflow</p>
                  <p className="text-3xl font-black text-red-400 print:text-gray-900">₹{cashflow.spent.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 print:border-gray-200 print:bg-gray-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-gray-500">Total Inflow</p>
                  <p className="text-3xl font-black text-emerald-400 print:text-gray-900">₹{cashflow.income.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2 print:text-gray-900 print:border-gray-200">Category Breakdown</h4>
                <div className="space-y-4">
                  {Object.entries((periodTransactions || []).filter(tx => tx.type === 'EXPENSE').reduce((acc, tx) => {
                    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
                    return acc;
                  }, {})).sort((a, b) => b[1] - a[1]).map(([cat, amount], idx) => {
                    const totalSpent = (periodTransactions || []).filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + tx.amount, 0);
                    const percent = totalSpent === 0 ? 0 : (amount / totalSpent) * 100;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-slate-300 uppercase print:text-gray-700">{cat}</span>
                          <span className="text-red-400 font-mono print:text-gray-900">₹{amount.toFixed(2)} <span className="text-slate-500 print:text-gray-400">({percent.toFixed(1)}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 print:bg-gray-200">
                          <div className={`h-full rounded-full ${idx === 0 ? 'bg-indigo-500 print:bg-gray-800' : 'bg-slate-500 print:bg-gray-500'}`} style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {((periodTransactions || []).filter(tx => tx.type === 'EXPENSE').length === 0) && (
                    <p className="text-slate-500 text-center italic py-4 print:text-gray-500">No expenses logged yet.</p>
                  )}
                </div>
              </div>

              {/* Transactions for Report */}
              <div>
                <h4 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2 print:text-gray-900 print:border-gray-200">Transactions Ledger</h4>
                <table className="w-full text-left text-sm text-slate-300 print:text-gray-700 flex-1">
                  <tbody>
                    {(periodTransactions || []).slice(0, 15).map(tx => (
                      <tr key={tx.id} className="border-b border-slate-800/50 print:border-gray-200">
                        <td className="py-2">{tx.date}</td>
                        <td className="py-2 font-bold">{tx.title} <span className="text-[10px] bg-slate-800 px-1 rounded ml-2 print:bg-gray-100">{tx.category}</span></td>
                        <td className={`py-2 text-right font-mono font-bold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'} print:text-gray-900`}>
                          {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinanceTab;
