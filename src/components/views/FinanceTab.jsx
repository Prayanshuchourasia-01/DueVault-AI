import React, { useState, useMemo } from 'react';
import { Wallet, TrendingDown, TrendingUp, DollarSign, Plus, Trash2, CalendarDays, Activity, PieChart, ShieldCheck, Eye, EyeOff, BarChart3, X } from 'lucide-react';
import { useFinances } from '../../hooks/useFinances';

const FinanceTab = ({ tasks }) => {
  const { finances, addTransaction, deleteTransaction, updateWalletBalance, setBudgetLimit, setWeeklyLimit, saveReport, toggleWalletVisibility, setWalletSpendLimit, addGoal, updateGoal, deleteGoal } = useFinances();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [txType, setTxType] = useState('EXPENSE'); // 'EXPENSE' or 'INCOME'
  
  const [newTx, setNewTx] = useState({ 
    title: '', amount: '', date: new Date().toLocaleDateString('en-CA'), 
    sourceWallet: 'cash', category: 'food' 
  });

  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: 0 });

  const [billFilter, setBillFilter] = useState('month');

  // Filter bills
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayDate = new Date(todayStr);
  const nextMonthDate = new Date(todayDate);
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

  const upcomingBills = tasks
    .filter(t => {
      if ((t.category !== 'finance' && t.category !== 'bill') || t.date < todayStr || t.completed) return false;
      const tDate = new Date(t.date);
      if (billFilter === 'month' && tDate > nextMonthDate) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Safe-To-Spend Calculation
  const totalBalance = Object.values(finances.wallets).filter(w => !w.isHidden).reduce((sum, w) => sum + w.balance, 0);
  
  const upcomingBillsCost = upcomingBills.reduce((sum, bill) => {
    // Attempt to extract a rupee/dollar amount from the bill title (e.g., "Pay Rent ₹500" or "Rs 500")
    const match = bill.title.match(/(?:₹|Rs\.?|\$)\s*(\d+(\.\d+)?)/i);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  const safeToSpend = totalBalance - upcomingBillsCost;

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!newTx.title || !newTx.amount) return;
    addTransaction({ ...newTx, type: txType });
    setNewTx({ title: '', amount: '', date: new Date().toLocaleDateString('en-CA'), sourceWallet: 'cash', category: 'food' });
    setShowAddModal(false);
  };

  const handleExportCSV = () => {
    if (!finances.transactions || finances.transactions.length === 0) return;
    const headers = "ID,Type,Date,Title,Category,Amount,Wallet\n";
    const rows = finances.transactions.map(tx => 
      `${tx.id},${tx.type},${tx.date},"${tx.title}","${tx.category}",${tx.amount},"${finances.wallets[tx.sourceWallet]?.name || ''}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duevault_ledger_${todayStr}.csv`;
    a.click();
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target) return;
    addGoal(newGoal);
    setNewGoal({ name: '', target: '', current: 0 });
  };

  const budgetPercent = Math.min((finances.monthlyBudget.spent / finances.monthlyBudget.limit) * 100, 100);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 md:pb-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            Financial Control Center
          </h2>
          <p className="text-slate-400 mt-2">Professional tracking for your net worth, budget, and liquidity.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
          >
            <BarChart3 className="w-5 h-5" /> Report
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-5 h-5" /> Log Transaction
          </button>
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
          <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">Monthly Cashflow</h3>
          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400"/> Income</p>
              <p className="text-xl font-bold text-emerald-400">+₹{finances.monthlyBudget.income.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1 flex items-center justify-end gap-1"><TrendingDown className="w-3 h-3 text-red-400"/> Expenses</p>
              <p className="text-xl font-bold text-red-400">-₹{finances.monthlyBudget.spent.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Budget & Wallets */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-cyan-400"/> Budget Trackers
            </h3>
            
            {/* Monthly Budget */}
            <div className="mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Monthly</span>
                <div className="text-right flex items-center gap-2">
                  <span className="text-xl font-bold text-white">₹{finances.monthlyBudget.spent.toFixed(2)}</span>
                  <span className="text-xs text-slate-500">/</span>
                  <input type="number" value={finances.monthlyBudget.limit} onChange={(e) => setBudgetLimit(e.target.value)} className="w-16 bg-transparent border-b border-slate-700 text-right text-sm font-bold text-slate-300 focus:outline-none focus:border-cyan-500"/>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative">
                <div className={`h-full transition-all duration-1000 ${budgetPercent > 90 ? 'bg-red-500' : (budgetPercent > 75 ? 'bg-orange-500' : 'bg-cyan-500')}`} style={{ width: `${budgetPercent}%` }} />
              </div>
            </div>

            {/* Weekly Budget */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Weekly</span>
                <div className="text-right flex items-center gap-2">
                  <span className="text-xl font-bold text-white">₹{(finances.weeklyBudget?.spent || 0).toFixed(2)}</span>
                  <span className="text-xs text-slate-500">/</span>
                  <input type="number" value={finances.weeklyBudget?.limit || 200} onChange={(e) => setWeeklyLimit(e.target.value)} className="w-16 bg-transparent border-b border-slate-700 text-right text-sm font-bold text-slate-300 focus:outline-none focus:border-cyan-500"/>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative">
                <div className={`h-full transition-all duration-1000 ${((finances.weeklyBudget?.spent || 0) / (finances.weeklyBudget?.limit || 1) * 100) > 90 ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(((finances.weeklyBudget?.spent || 0) / (finances.weeklyBudget?.limit || 1)) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4"/> Managed Accounts
            </h3>
            <div className="space-y-3">
              {Object.values(finances.wallets).map(wallet => (
                <div key={wallet.id} className={`p-3 rounded-xl border transition-colors ${wallet.isHidden ? 'bg-slate-900/50 border-slate-800/50 opacity-60' : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/80'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleWalletVisibility(wallet.id)} className="text-slate-500 hover:text-cyan-400 transition-colors">
                        {wallet.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <span className="font-medium text-slate-300">{wallet.name} {wallet.isHidden && '(Hidden)'}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                      <span className="text-slate-500">₹</span>
                      <input 
                        type="number" 
                        value={wallet.balance} 
                        onChange={(e) => updateWalletBalance(wallet.id, e.target.value)}
                        className="w-20 bg-transparent text-right font-mono font-bold text-white focus:outline-none focus:text-emerald-400"
                      />
                    </div>
                  </div>
                  {!wallet.isHidden && (
                    <div className="flex justify-between items-center text-xs mt-2 border-t border-slate-700/50 pt-2">
                      <span className="text-slate-500">Spend Limit:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600">₹</span>
                        <input 
                          type="number" 
                          value={wallet.spendLimit || 0} 
                          onChange={(e) => setWalletSpendLimit(wallet.id, e.target.value)}
                          className="w-16 bg-transparent text-right font-mono text-cyan-400 focus:outline-none border-b border-transparent focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
          
          {upcomingBills.length > 0 && (
            <div className="bg-gradient-to-r from-orange-950/40 to-slate-900 border border-orange-500/20 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-orange-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Upcoming Scheduled Bills
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingBills.map(bill => {
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
                <Activity className="w-4 h-4"/> Transaction Ledger
              </h3>
              <button onClick={handleExportCSV} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 transition-colors">
                Export CSV
              </button>
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
                  {!finances.transactions || finances.transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 italic">No transactions logged yet.</td>
                    </tr>
                  ) : (
                    finances.transactions.map(tx => (
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:p-0 print:block print:bg-white print:text-black">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm print:hidden" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in print:shadow-none print:border-none print:rounded-none print:bg-white">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30 print:hidden">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" /> Professional Financial Report
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    saveReport({ title: 'Generated Report', totalExpenses: finances.monthlyBudget.spent });
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
              <p className="text-gray-500 mt-1">Generated on {new Date().toLocaleString()}</p>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 print:border-gray-200 print:bg-gray-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-gray-500">Total Outflow (Month)</p>
                  <p className="text-3xl font-black text-red-400 print:text-gray-900">₹{finances.monthlyBudget.spent.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 print:border-gray-200 print:bg-gray-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-gray-500">Total Inflow (Month)</p>
                  <p className="text-3xl font-black text-emerald-400 print:text-gray-900">₹{finances.monthlyBudget.income.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2 print:text-gray-900 print:border-gray-200">Category Breakdown</h4>
                <div className="space-y-4">
                  {Object.entries((finances.transactions || []).filter(tx => tx.type === 'EXPENSE').reduce((acc, tx) => {
                    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
                    return acc;
                  }, {})).sort((a, b) => b[1] - a[1]).map(([cat, amount], idx) => {
                    const totalSpent = (finances.transactions || []).filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + tx.amount, 0);
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
                  {((finances.transactions || []).filter(tx => tx.type === 'EXPENSE').length === 0) && (
                    <p className="text-slate-500 text-center italic py-4 print:text-gray-500">No expenses logged yet.</p>
                  )}
                </div>
              </div>

              {/* Latest Transactions for Report */}
              <div>
                <h4 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2 print:text-gray-900 print:border-gray-200">Recent Transactions</h4>
                <table className="w-full text-left text-sm text-slate-300 print:text-gray-700">
                  <tbody>
                    {(finances.transactions || []).slice(0, 10).map(tx => (
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
