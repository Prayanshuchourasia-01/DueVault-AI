import React, { useState, useMemo } from 'react';
import { Wallet, TrendingDown, TrendingUp, DollarSign, Plus, Trash2, Scissors, CalendarDays, Activity, PieChart, ShieldCheck, Eye, EyeOff, BarChart3, X, CheckSquare, Square, AlertTriangle, CalendarRange, Pencil } from 'lucide-react';
import { useFinances } from '../../hooks/useFinances';

const FinanceTab = ({ tasks, sendNotification }) => {
  const { 
    finances, 
    addTransaction, 
    deleteTransaction, 
    editTransaction,
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

  const [activePeriod, setActivePeriod] = useState('CURRENT_WEEK'); // 'CURRENT_WEEK', 'LAST_3_WEEKS', 'CURRENT_MONTH', 'PREV_MONTH'
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

  const [splitTx, setSplitTx] = useState(null);
  const [editingTx, setEditingTx] = useState(null);
  const [splitParts, setSplitParts] = useState({
    part1: { title: '', amount: '', category: '', sourceWallet: '' },
    part2: { title: '', amount: '', category: '', sourceWallet: '' }
  });

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

  // Last 3 Weeks (Current week + preceding 2 weeks, i.e., 21 days)
  const startOfLast3Weeks = new Date(startOfThisWeek);
  startOfLast3Weeks.setDate(startOfThisWeek.getDate() - 14);
  startOfLast3Weeks.setHours(0,0,0,0);

  // Current Month (1st to end of current month)
  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfThisMonth.setHours(23,59,59,999);

  // Expose period state bounds
  const activeBounds = useMemo(() => {
    if (activePeriod === 'CURRENT_WEEK') return { start: startOfThisWeek, end: endOfThisWeek, label: 'Current Week' };
    if (activePeriod === 'PREV_WEEK') return { start: startOfPrevWeek, end: endOfPrevWeek, label: 'Previous Week' };
    if (activePeriod === 'LAST_3_WEEKS') return { start: startOfLast3Weeks, end: endOfThisWeek, label: 'Last 3 Weeks' };
    if (activePeriod === 'CURRENT_MONTH') return { start: startOfThisMonth, end: endOfThisMonth, label: 'Current Month' };
    return { start: startOfPrevMonth, end: endOfPrevMonth, label: 'Previous Month' };
  }, [activePeriod, startOfThisWeek, endOfThisWeek, startOfPrevWeek, endOfPrevWeek, startOfLast3Weeks, startOfThisMonth, endOfThisMonth, startOfPrevMonth, endOfPrevMonth]);

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
  const totalBalance = Object.values(finances.wallets)
    .filter(w => !w.isHidden)
    .reduce((sum, w) => sum + (Number(w.balance) || 0), 0);

  // Filter bills for Safe-To-Spend
  const todayStr = new Date().toLocaleDateString('en-CA');
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

  const upcomingBills = tasks
    .filter(t => {
      const cat = (t.category || '').toLowerCase();
      if ((cat !== 'finance' && cat !== 'bill' && cat !== 'bills') || t.date < todayStr || t.completed) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcomingBillsCost = upcomingBills.reduce((sum, bill) => {
    if (bill.amount !== undefined) return sum + (parseFloat(bill.amount) || 0);
    const match = bill.title.match(/(?:₹|Rs\.?|\$)\s*(\d+(\.\d+)?)/i);
    const extracted = match ? parseFloat(match[1]) : 0;
    return sum + (isNaN(extracted) ? 0 : extracted);
  }, 0);

  // Calculate total spendable capacity of all non-hidden accounts
  const totalSpendableCapacity = Object.values(finances.wallets)
    .filter(w => !w.isHidden)
    .reduce((sum, w) => {
      const balance = Number(w.balance) || 0;
      if (w.limitEnabled) {
        const weeklySpent = getWalletWeeklySpent(w.id);
        const remainingLimit = (Number(w.spendLimit) || 0) - weeklySpent;
        // Capped by remaining limit and current balance
        const spendable = Math.max(0, Math.min(balance, remainingLimit));
        return sum + spendable;
      } else {
        // Accounts without limit contribute their full balance
        return sum + balance;
      }
    }, 0);

  const safeToSpend = totalSpendableCapacity - upcomingBillsCost;

  // Budget progress calculations based on selected tab type
  const budgetLimit = (activePeriod === 'CURRENT_MONTH' || activePeriod === 'PREV_MONTH') 
    ? (finances.monthlyBudget?.limit || 1000) 
    : (finances.weeklyBudget?.limit || 200);
  const budgetPercent = Math.min((cashflow.spent / (budgetLimit || 1)) * 100, 100);

  // Category colors mapping for charts
  const categoryColors = {
    food: '#f43f5e',       // rose
    leisure: '#06b6d4',    // cyan
    bills: '#6366f1',      // indigo
    shopping: '#a855f7',   // purple
    rent: '#e11d48',       // red
    travel: '#10b981',     // emerald
    entertainment: '#ec4899', // pink
    groceries: '#f59e0b',  // amber
    other: '#64748b'       // slate
  };

  // 1. Category Allocation Donut Chart Data
  const categoryExpenses = useMemo(() => {
    const expenses = (periodTransactions || []).filter(tx => tx.type === 'EXPENSE');
    const totals = expenses.reduce((acc, tx) => {
      const cat = (tx.category || 'other').toLowerCase();
      acc[cat] = (acc[cat] || 0) + tx.amount;
      return acc;
    }, {});
    
    const totalSpent = Object.values(totals).reduce((sum, val) => sum + val, 0);
    
    let currentOffset = 0;
    return Object.entries(totals).map(([category, amount]) => {
      const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      const strokeDashoffset = 314.159 - (percentage / 100) * 314.159;
      const rotationOffset = (currentOffset / 100) * 360;
      currentOffset += percentage;
      return {
        category,
        amount,
        percentage,
        strokeDashoffset,
        rotationOffset,
        color: categoryColors[category] || categoryColors.other
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [periodTransactions]);

  const totalSpentExpenses = useMemo(() => {
    return categoryExpenses.reduce((sum, c) => sum + c.amount, 0);
  }, [categoryExpenses]);

  // 2. Daily Cashflow Trend Chart Data
  const cashflowTrendData = useMemo(() => {
    const dates = [];
    const curr = new Date(activeBounds.start);
    // Safety break to prevent infinite loop
    let safetyCounter = 0;
    while (curr <= activeBounds.end && safetyCounter < 65) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
      safetyCounter++;
    }
    
    return dates.map(date => {
      const dateStr = date.toLocaleDateString('en-CA');
      const dayTxs = (periodTransactions || []).filter(tx => tx.date === dateStr);
      const inflow = dayTxs.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + tx.amount, 0);
      const outflow = dayTxs.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + tx.amount, 0);
      
      const label = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      return { label, dateStr, inflow, outflow };
    });
  }, [periodTransactions, activeBounds]);

  const trendChartConfig = useMemo(() => {
    const width = 450;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 30;
    
    const N = cashflowTrendData.length;
    const maxVal = Math.max(100, ...cashflowTrendData.map(d => Math.max(d.inflow, d.outflow))) * 1.15;
    
    const getX = (index) => paddingLeft + (index * (width - paddingLeft - paddingRight)) / Math.max(1, N - 1);
    const getY = (val) => height - paddingBottom - (val / maxVal) * (height - paddingTop - paddingBottom);
    
    let inflowPath = '';
    let inflowArea = '';
    let outflowPath = '';
    let outflowArea = '';
    
    cashflowTrendData.forEach((d, i) => {
      const x = getX(i);
      const yIn = getY(d.inflow);
      const yOut = getY(d.outflow);
      
      if (i === 0) {
        inflowPath = `M ${x} ${yIn}`;
        inflowArea = `M ${x} ${height - paddingBottom} L ${x} ${yIn}`;
        outflowPath = `M ${x} ${yOut}`;
        outflowArea = `M ${x} ${height - paddingBottom} L ${x} ${yOut}`;
      } else {
        inflowPath += ` L ${x} ${yIn}`;
        inflowArea += ` L ${x} ${yIn}`;
        outflowPath += ` L ${x} ${yOut}`;
        outflowArea += ` L ${x} ${yOut}`;
      }
      
      if (i === N - 1) {
        inflowArea += ` L ${x} ${height - paddingBottom} Z`;
        outflowArea += ` L ${x} ${height - paddingBottom} Z`;
      }
    });
    
    return {
      width, height, maxVal, getX, getY,
      inflowPath, inflowArea, outflowPath, outflowArea,
      paddingLeft, paddingRight, paddingTop, paddingBottom
    };
  }, [cashflowTrendData]);

  // Helper to format nice range display
  const formatDateRange = (start, end) => {
    const sOpt = { month: 'short', day: 'numeric' };
    const eOpt = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', sOpt)} - ${end.toLocaleDateString('en-US', eOpt)}`;
  };

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

  const handleEditTransactionSubmit = (e) => {
    e.preventDefault();
    if (!editingTx || !editingTx.title || !editingTx.amount) return;

    // Check spend limit violations
    const wallet = finances.wallets[editingTx.sourceWallet];
    if (wallet && wallet.limitEnabled && editingTx.type === 'EXPENSE') {
      const currentWeeklySpent = getWalletWeeklySpent(editingTx.sourceWallet);
      const oldTx = finances.transactions.find(t => t.id === editingTx.id);
      const isOldExpenseInSameWalletThisWeek = oldTx && oldTx.sourceWallet === editingTx.sourceWallet && oldTx.type === 'EXPENSE' && isInCurrentWeek(oldTx.date);
      const oldAmt = isOldExpenseInSameWalletThisWeek ? oldTx.amount : 0;
      
      const newAmt = Number(editingTx.amount);
      const adjustedSpent = currentWeeklySpent - oldAmt + newAmt;
      
      if (adjustedSpent > wallet.spendLimit) {
        if (sendNotification) {
          sendNotification("Spend Limit Exceeded!", `Warning: ${wallet.name} weekly spend limit of ₹${wallet.spendLimit} has been breached!`);
        }
      }
    }

    editTransaction(editingTx.id, editingTx);
    setEditingTx(null);
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

  const handleStartSplit = (tx) => {
    setSplitTx(tx);
    setSplitParts({
      part1: { 
        title: `${tx.title} (Part 1)`, 
        amount: (tx.amount / 2).toFixed(2), 
        category: tx.category || 'other', 
        sourceWallet: tx.sourceWallet 
      },
      part2: { 
        title: `${tx.title} (Part 2)`, 
        amount: (tx.amount - (tx.amount / 2)).toFixed(2), 
        category: tx.category || 'other', 
        sourceWallet: tx.sourceWallet 
      }
    });
  };

  const handleSplitPartChange = (part, field, value) => {
    setSplitParts(prev => {
      const updated = {
        ...prev,
        [part]: {
          ...prev[part],
          [field]: value
        }
      };

      if (field === 'amount') {
        const otherPart = part === 'part1' ? 'part2' : 'part1';
        const numVal = parseFloat(value);
        if (!isNaN(numVal) && numVal >= 0 && numVal <= splitTx.amount) {
          const remainder = splitTx.amount - numVal;
          updated[otherPart].amount = remainder.toFixed(2);
        } else if (value === '') {
          updated[otherPart].amount = '';
        }
      }
      return updated;
    });
  };

  const handleSplitTransaction = (e) => {
    e.preventDefault();
    if (!splitTx) return;

    const amt1 = Number(splitParts.part1.amount);
    const amt2 = Number(splitParts.part2.amount);
    
    if (Math.abs(amt1 + amt2 - splitTx.amount) > 0.01) {
      alert("Split amounts must add up to the original amount!");
      return;
    }

    // Check spend limit violations for Part 1
    const wallet1 = finances.wallets[splitParts.part1.sourceWallet];
    if (wallet1 && wallet1.limitEnabled && splitTx.type === 'EXPENSE') {
      const currentWeeklySpent = getWalletWeeklySpent(splitParts.part1.sourceWallet);
      const originalIsSame1 = splitTx.sourceWallet === splitParts.part1.sourceWallet;
      const adjustedSpent1 = currentWeeklySpent - (originalIsSame1 ? splitTx.amount : 0) + amt1;
      if (adjustedSpent1 > wallet1.spendLimit) {
        if (sendNotification) {
          sendNotification("Spend Limit Exceeded!", `Warning: ${wallet1.name} weekly spend limit of ₹${wallet1.spendLimit} has been breached!`);
        }
      }
    }

    // Check spend limit violations for Part 2
    const wallet2 = finances.wallets[splitParts.part2.sourceWallet];
    if (wallet2 && wallet2.limitEnabled && splitTx.type === 'EXPENSE') {
      const currentWeeklySpent = getWalletWeeklySpent(splitParts.part2.sourceWallet);
      const originalIsSame2 = splitTx.sourceWallet === splitParts.part2.sourceWallet;
      const isSameWalletForBoth = splitParts.part1.sourceWallet === splitParts.part2.sourceWallet;
      const adjustedSpent2 = currentWeeklySpent - (originalIsSame2 ? splitTx.amount : 0) + (isSameWalletForBoth ? amt1 : 0) + amt2;
      if (adjustedSpent2 > wallet2.spendLimit) {
        if (sendNotification) {
          sendNotification("Spend Limit Exceeded!", `Warning: ${wallet2.name} weekly spend limit of ₹${wallet2.spendLimit} has been breached!`);
        }
      }
    }

    // Delete original
    deleteTransaction(splitTx.id);

    // Add splits
    addTransaction({
      title: splitParts.part1.title,
      amount: amt1,
      category: splitParts.part1.category || 'other',
      sourceWallet: splitParts.part1.sourceWallet,
      date: splitTx.date,
      type: splitTx.type
    });

    addTransaction({
      title: splitParts.part2.title,
      amount: amt2,
      category: splitParts.part2.category || 'other',
      sourceWallet: splitParts.part2.sourceWallet,
      date: splitTx.date,
      type: splitTx.type
    });

    setSplitTx(null);
  };

  // Week reset fresh start trigger
  const currentWeekId = getWeekIdentifier(new Date());
  const showResetPrompt = finances.lastResetWeek !== currentWeekId;

  return (
    <div className="finances-tab-container w-full max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 md:pb-6 font-sans">
      
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
          <div className="mt-2 text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-3 py-1 rounded-lg inline-block uppercase tracking-wider">
            {formatDateRange(activeBounds.start, activeBounds.end)}
          </div>
        </div>

        {/* Dynamic Period Selectors */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-full md:w-auto">
          {[
            { id: 'CURRENT_WEEK', label: 'Current Week' },
            { id: 'LAST_3_WEEKS', label: 'Last 3 Weeks' },
            { id: 'CURRENT_MONTH', label: 'Current Month' },
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
          <p className="text-xs text-slate-500 mt-2">
            Spendable capacity (₹{totalSpendableCapacity.toFixed(2)}) minus ₹{upcomingBillsCost.toFixed(2)} in bills. Limits cap wallet contribution.
          </p>
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
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">Net:</span>
            <span className={`font-bold font-mono ${cashflow.income - cashflow.spent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {cashflow.income - cashflow.spent >= 0 ? '+' : ''}₹{(cashflow.income - cashflow.spent).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* Trend line/area chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Cashflow Trends
            </h3>
            <p className="text-xs text-slate-500">Daily Inflow vs Outflow analysis</p>
          </div>
          
          <div className="w-full flex justify-center items-center mt-3 h-48">
            {cashflowTrendData.length === 0 ? (
              <p className="text-slate-600 text-xs italic">No cashflow data in this period.</p>
            ) : (
              <svg viewBox={`0 0 ${trendChartConfig.width} ${trendChartConfig.height}`} className="w-full h-full">
                {/* Grids */}
                {[0.25, 0.5, 0.75].map((pct, i) => {
                  const y = trendChartConfig.paddingTop + pct * (trendChartConfig.height - trendChartConfig.paddingTop - trendChartConfig.paddingBottom);
                  const labelVal = trendChartConfig.maxVal * (1 - pct);
                  return (
                    <g key={i}>
                      <line x1={trendChartConfig.paddingLeft} y1={y} x2={trendChartConfig.width - trendChartConfig.paddingRight} y2={y} stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                      <text x={trendChartConfig.paddingLeft - 5} y={y + 4} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="Share Tech Mono">₹{Math.round(labelVal)}</text>
                    </g>
                  );
                })}
                
                {/* Outflow Area & Line */}
                {trendChartConfig.outflowPath && (
                  <>
                    <path d={trendChartConfig.outflowArea} fill="url(#outflowGrad)" opacity="0.15" />
                    <path d={trendChartConfig.outflowPath} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}

                {/* Inflow Area & Line */}
                {trendChartConfig.inflowPath && (
                  <>
                    <path d={trendChartConfig.inflowArea} fill="url(#inflowGrad)" opacity="0.15" />
                    <path d={trendChartConfig.inflowPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}

                {/* Dots on nodes */}
                {cashflowTrendData.map((d, i) => {
                  const x = trendChartConfig.getX(i);
                  const yIn = trendChartConfig.getY(d.inflow);
                  const yOut = trendChartConfig.getY(d.outflow);
                  return (
                    <g key={i}>
                      {d.inflow > 0 && (
                        <circle cx={x} cy={yIn} r="3.5" fill="#10b981" stroke="#070a13" strokeWidth="1.5">
                          <title>{`${d.label}\nInflow: +₹${d.inflow.toFixed(2)}`}</title>
                        </circle>
                      )}
                      {d.outflow > 0 && (
                        <circle cx={x} cy={yOut} r="3.5" fill="#f43f5e" stroke="#070a13" strokeWidth="1.5">
                          <title>{`${d.label}\nOutflow: -₹${d.outflow.toFixed(2)}`}</title>
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {cashflowTrendData.map((d, i) => {
                  // Show subsets if too long
                  const total = cashflowTrendData.length;
                  const shouldShow = total <= 7 || i % (Math.ceil(total / 7)) === 0 || i === total - 1;
                  if (!shouldShow) return null;
                  
                  const x = trendChartConfig.getX(i);
                  return (
                    <text key={i} x={x} y={trendChartConfig.height - 10} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="Share Tech Mono">
                      {d.label.split(' ')[0]}
                    </text>
                  );
                })}

                {/* Gradients */}
                <defs>
                  <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
        </div>

        {/* Category Allocation Donut chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-400" /> Category Breakdown
            </h3>
            <p className="text-xs text-slate-500">Distribution of expenses this period</p>
          </div>

          <div className="flex items-center gap-4 mt-3">
            {categoryExpenses.length === 0 ? (
              <p className="text-slate-600 text-xs italic flex-1 text-center py-10">No expenses logged yet.</p>
            ) : (
              <>
                {/* Donut SVG */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg viewBox="0 0 160 160" className="w-full h-full">
                    <circle cx="80" cy="80" r="50" fill="transparent" stroke="#1e293b" strokeWidth="12" />
                    {categoryExpenses.map((c, idx) => (
                      <circle
                        key={idx}
                        cx="80"
                        cy="80"
                        r="50"
                        fill="transparent"
                        stroke={c.color}
                        strokeWidth="12"
                        strokeDasharray="314.159"
                        strokeDashoffset={c.strokeDashoffset}
                        transform={`rotate(${c.rotationOffset - 90} 80 80)`}
                        className="transition-all duration-300 hover:stroke-[14px]"
                      >
                        <title>{`${c.category.toUpperCase()}: ₹${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}%)`}</title>
                      </circle>
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Spent</span>
                    <span className="text-sm font-extrabold text-white">₹{totalSpentExpenses.toFixed(0)}</span>
                  </div>
                </div>

                {/* Category Legends list */}
                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-36 pr-1">
                  {categoryExpenses.slice(0, 4).map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-slate-300 font-medium truncate uppercase text-[10px]">{c.category}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px] font-bold">
                        {c.percentage.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  {categoryExpenses.length > 4 && (
                    <div className="text-[9px] text-slate-500 text-center italic mt-0.5">
                      + {categoryExpenses.length - 4} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Budget Progress Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Budget Utilization
            </h3>
            <p className="text-xs text-slate-500">Utilization progress of limits</p>
          </div>

          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="#1e293b" strokeWidth="10" />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  fill="transparent" 
                  stroke={budgetPercent > 90 ? '#f43f5e' : budgetPercent > 75 ? '#f59e0b' : '#06b6d4'} 
                  strokeWidth="10" 
                  strokeDasharray={2 * Math.PI * 50} 
                  strokeDashoffset={(2 * Math.PI * 50) - (Math.min(100, budgetPercent) / 100) * (2 * Math.PI * 50)} 
                  transform="rotate(-90 60 60)"
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-white">{budgetPercent.toFixed(0)}%</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Used</span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs">
              <div>
                <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Total Spent</p>
                <p className="text-base font-extrabold text-slate-200">₹{cashflow.spent.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Total Limit</p>
                <p className="text-sm font-bold text-slate-400">₹{budgetLimit.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Remaining</p>
                <p className={`text-xs font-bold ${budgetLimit - cashflow.spent < 0 ? 'text-red-400 font-black' : 'text-cyan-400'}`}>
                  ₹{(budgetLimit - cashflow.spent).toFixed(2)}
                </p>
              </div>
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
                  <PieChart className="w-4 h-4 text-cyan-400"/> {(activePeriod === 'PREV_MONTH' || activePeriod === 'CURRENT_MONTH') ? 'Monthly' : 'Weekly'} Budget Tracker
                </h3>
                <div className="text-2xl font-bold text-white">₹{cashflow.spent.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Limit</span>
                <div className="text-lg font-bold text-slate-300">
                  {(activePeriod === 'PREV_MONTH' || activePeriod === 'CURRENT_MONTH') ? (
                    <input 
                      type="number" 
                      value={finances.monthlyBudget?.limit || 1000} 
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
          
          {upcomingBills.length > 0 && (
            <div className="bg-gradient-to-r from-orange-950/40 to-slate-900 border border-orange-500/20 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-orange-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Upcoming Scheduled Bills
                  <span className="text-orange-300/60 font-mono text-[10px] ml-1">TOTAL: ₹{upcomingBillsCost.toFixed(0)}</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingBills.slice(0, 4).map(bill => {
                  let displayAmount;
                  if (bill.amount !== undefined && !isNaN(parseFloat(bill.amount))) {
                    displayAmount = `₹${parseFloat(bill.amount).toFixed(0)}`;
                  } else {
                    const match = bill.title.match(/(?:₹|Rs\.?|\$)\s*(\d+(\.\d+)?)/i);
                    displayAmount = match ? `₹${match[1]}` : 'Amt N/A';
                  }
                  const daysUntil = Math.ceil((new Date(bill.date) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={bill.id} className="bg-slate-900/80 border border-orange-500/20 rounded-xl p-4 flex flex-col justify-between hover:border-orange-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-white line-clamp-1">{bill.title}</p>
                        <span className="text-orange-400 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded text-xs">{displayAmount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 font-medium">{new Date(bill.date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${daysUntil <= 3 ? 'bg-red-500/20 text-red-400' : daysUntil <= 7 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
                          {daysUntil === 0 ? 'TODAY' : daysUntil < 0 ? 'OVERDUE' : `${daysUntil}d left`}
                        </span>
                      </div>
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
                          <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingTx(tx)} className="text-slate-500 hover:text-cyan-400 transition-colors" title="Edit Transaction">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleStartSplit(tx)} className="text-slate-500 hover:text-indigo-400 transition-colors" title="Split Transaction">
                              <Scissors className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteTransaction(tx.id)} className="text-slate-600 hover:text-red-400 transition-colors" title="Delete Transaction">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setEditingTx(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Edit Transaction
              </h3>
              <button onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditTransactionSubmit} className="p-6 space-y-5">
              
              <div className="flex bg-slate-800 p-1 rounded-xl">
                <button 
                  type="button" 
                  onClick={() => setEditingTx({...editingTx, type: 'EXPENSE'})} 
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${editingTx.type === 'EXPENSE' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Expense
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditingTx({...editingTx, type: 'INCOME'})} 
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${editingTx.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Income
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Description</label>
                <input 
                  type="text" 
                  required 
                  value={editingTx.title} 
                  onChange={e => setEditingTx({...editingTx, title: e.target.value})} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" 
                  placeholder="E.g. Groceries, Salary..." 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Amount (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={editingTx.amount} 
                    onChange={e => setEditingTx({...editingTx, amount: e.target.value})} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-cyan-500" 
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Date</label>
                  <input 
                    type="date" 
                    required 
                    value={editingTx.date} 
                    onChange={e => setEditingTx({...editingTx, date: e.target.value})} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Account</label>
                  <select 
                    value={editingTx.sourceWallet} 
                    onChange={e => setEditingTx({...editingTx, sourceWallet: e.target.value})} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {Object.values(finances.wallets).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Category</label>
                  <input 
                    type="text" 
                    required 
                    value={editingTx.category} 
                    onChange={e => setEditingTx({...editingTx, category: e.target.value.toLowerCase()})} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 uppercase text-xs font-mono" 
                    placeholder="FOOD, BILLS..." 
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingTx(null)} 
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all ${editingTx.type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}
                >
                  Update Transaction
                </button>
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

      {/* Split Transaction Modal */}
      {splitTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSplitTx(null)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-indigo-400" /> Split Transaction
              </h3>
              <button onClick={() => setSplitTx(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSplitTransaction} className="p-6 space-y-4">
              
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-xs space-y-1">
                <p className="text-slate-400">Original: <span className="font-bold text-white">{splitTx.title}</span></p>
                <p className="text-slate-400">Total Amount: <span className="font-bold text-white">₹{splitTx.amount.toFixed(2)}</span></p>
                <p className="text-slate-400">Account: <span className="font-bold text-white">{finances.wallets[splitTx.sourceWallet]?.name || 'Unknown'}</span></p>
              </div>

              {/* Split 1 */}
              <div className="space-y-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Part 1</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Description</label>
                    <input type="text" required value={splitParts.part1.title} onChange={e => handleSplitPartChange('part1', 'title', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Amount (₹)</label>
                    <input type="number" step="0.01" required value={splitParts.part1.amount} onChange={e => handleSplitPartChange('part1', 'amount', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Category</label>
                    <input type="text" required value={splitParts.part1.category} onChange={e => handleSplitPartChange('part1', 'category', e.target.value.toLowerCase())} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 uppercase text-[10px] font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Account</label>
                    <select value={splitParts.part1.sourceWallet} onChange={e => handleSplitPartChange('part1', 'sourceWallet', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                      {Object.values(finances.wallets).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Split 2 */}
              <div className="space-y-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Part 2</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Description</label>
                    <input type="text" required value={splitParts.part2.title} onChange={e => handleSplitPartChange('part2', 'title', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Amount (₹)</label>
                    <input type="number" step="0.01" required value={splitParts.part2.amount} onChange={e => handleSplitPartChange('part2', 'amount', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Category</label>
                    <input type="text" required value={splitParts.part2.category} onChange={e => handleSplitPartChange('part2', 'category', e.target.value.toLowerCase())} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 uppercase text-[10px] font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Account</label>
                    <select value={splitParts.part2.sourceWallet} onChange={e => handleSplitPartChange('part2', 'sourceWallet', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                      {Object.values(finances.wallets).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Validation warning */}
              {Math.abs(Number(splitParts.part1.amount) + Number(splitParts.part2.amount) - splitTx.amount) > 0.01 && (
                <p className="text-red-400 text-xs font-semibold flex items-center gap-1">
                  ⚠️ Total split (₹{(Number(splitParts.part1.amount) + Number(splitParts.part2.amount)).toFixed(2)}) must equal ₹{splitTx.amount.toFixed(2)}!
                </p>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button type="button" onClick={() => setSplitTx(null)} className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={Math.abs(Number(splitParts.part1.amount) + Number(splitParts.part2.amount) - splitTx.amount) > 0.01} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 disabled:hover:bg-indigo-600">Split Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:p-0 print:block print:bg-white print:text-black">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm print:hidden" onClick={() => setShowReportModal(false)} />
          <div className="print-report-modal relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-fade-in print:shadow-none print:border-none print:rounded-none print:bg-white max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible">
            
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" /> Save as PDF / Print
                </button>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Header (Visible only in print) */}
            <div className="hidden print:block p-8 pb-4 border-b border-gray-200">
              <h1 className="text-3xl font-black text-gray-900">DueVault Financial Report</h1>
              <p className="text-gray-500 mt-1">Generated on {new Date().toLocaleString()} ({activeBounds.label})</p>
            </div>

            <div className="p-6 md:p-8 space-y-8 print:p-4">
              
              {/* Financial Highlights Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 print:border-gray-250 print:bg-gray-50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 print:text-gray-500">Total Net Worth</p>
                  <p className="text-xl font-black text-white print:text-gray-900">₹{totalBalance.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 print:border-gray-250 print:bg-gray-50">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 print:text-emerald-700">Safe-To-Spend</p>
                  <p className="text-xl font-black text-emerald-400 print:text-emerald-700">₹{safeToSpend.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 print:border-gray-250 print:bg-gray-50">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1 print:text-gray-700">Budget Limit</p>
                  <p className="text-xl font-black text-cyan-400 print:text-gray-900">₹{budgetLimit.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 print:border-gray-250 print:bg-gray-50">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 print:text-red-650">Total Outflow</p>
                  <p className="text-xl font-black text-red-400 print:text-red-600">₹{cashflow.spent.toFixed(2)}</p>
                </div>
              </div>

              {/* Accounts & Limits Overview Table */}
              <div>
                <h4 className="text-base font-bold text-white mb-3 border-b border-slate-800 pb-2 print:text-gray-900 print:border-gray-200">Accounts & Limits Summary</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300 print:text-gray-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 print:border-gray-300 text-[10px] uppercase text-slate-500 print:text-gray-400 font-bold">
                        <th className="py-2">Account Name</th>
                        <th className="py-2 text-right">Starting Bal</th>
                        <th className="py-2 text-right">Current Bal</th>
                        <th className="py-2 text-right">Weekly Limit</th>
                        <th className="py-2 text-right">Weekly Spent</th>
                        <th className="py-2 text-right">Remaining Spendable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(finances.wallets).filter(w => !w.isHidden).map(wallet => {
                        const weeklySpent = getWalletWeeklySpent(wallet.id);
                        const limitText = wallet.limitEnabled ? `₹${wallet.spendLimit.toFixed(0)}` : 'No Limit';
                        const remaining = wallet.limitEnabled 
                          ? Math.max(0, wallet.spendLimit - weeklySpent)
                          : wallet.balance;
                        const spendable = Math.max(0, Math.min(wallet.balance, remaining));
                        
                        return (
                          <tr key={wallet.id} className="border-b border-slate-800/50 print:border-gray-200 text-xs">
                            <td className="py-2 font-bold text-slate-200 print:text-gray-900">{wallet.name}</td>
                            <td className="py-2 text-right font-mono">₹{wallet.startingBalance !== undefined ? wallet.startingBalance.toFixed(2) : wallet.balance.toFixed(2)}</td>
                            <td className="py-2 text-right font-mono">₹{wallet.balance.toFixed(2)}</td>
                            <td className="py-2 text-right font-mono text-slate-400 print:text-gray-500">{limitText}</td>
                            <td className="py-2 text-right font-mono text-red-400 print:text-red-650">₹{weeklySpent.toFixed(2)}</td>
                            <td className="py-2 text-right font-mono font-bold text-emerald-400 print:text-emerald-700">₹{spendable.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Embedded SVG Visual Charts for PDF */}
              <div>
                <h4 className="text-base font-bold text-white mb-4 border-b border-slate-800 pb-2 print:text-gray-900 print:border-gray-200">Financial Visualizations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                  {/* Donut Chart */}
                  <div className="border border-slate-800 p-4 rounded-xl print:border-gray-250 flex items-center justify-between gap-4">
                    <div className="w-28 h-28 flex-shrink-0">
                      {categoryExpenses.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 italic">No Data</div>
                      ) : (
                        <svg viewBox="0 0 160 160" className="w-full h-full">
                          <circle cx="80" cy="80" r="50" fill="transparent" stroke="#1e293b" strokeWidth="12" />
                          {categoryExpenses.map((c, idx) => (
                            <circle
                              key={idx}
                              cx="80"
                              cy="80"
                              r="50"
                              fill="transparent"
                              stroke={c.color}
                              strokeWidth="12"
                              strokeDasharray="314.159"
                              strokeDashoffset={c.strokeDashoffset}
                              transform={`rotate(${c.rotationOffset - 90} 80 80)`}
                            />
                          ))}
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Expenses Allocation</p>
                      {categoryExpenses.slice(0, 4).map((c, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] min-w-0">
                          <span className="font-bold print:text-gray-700 uppercase truncate" style={{ color: c.color }}>{c.category}</span>
                          <span className="font-mono text-slate-400 print:text-gray-900 font-bold ml-2">₹{c.amount.toFixed(0)} ({c.percentage.toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cashflow Line Chart */}
                  <div className="border border-slate-800 p-4 rounded-xl print:border-gray-250 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Daily Trends (Green=Inflow, Red=Outflow)</p>
                    {cashflowTrendData.length === 0 ? (
                      <p className="text-slate-500 text-xs italic text-center py-6">No cashflow logged</p>
                    ) : (
                      <svg viewBox={`0 0 ${trendChartConfig.width} ${trendChartConfig.height}`} className="w-full h-24">
                        {trendChartConfig.outflowPath && (
                          <path d={trendChartConfig.outflowPath} fill="none" stroke="#f43f5e" strokeWidth="3" />
                        )}
                        {trendChartConfig.inflowPath && (
                          <path d={trendChartConfig.inflowPath} fill="none" stroke="#10b981" strokeWidth="3" />
                        )}
                        {cashflowTrendData.map((d, i) => {
                          const x = trendChartConfig.getX(i);
                          const yIn = trendChartConfig.getY(d.inflow);
                          const yOut = trendChartConfig.getY(d.outflow);
                          return (
                            <g key={i}>
                              {d.inflow > 0 && <circle cx={x} cy={yIn} r="3.5" fill="#10b981" />}
                              {d.outflow > 0 && <circle cx={x} cy={yOut} r="3.5" fill="#f43f5e" />}
                            </g>
                          );
                        })}
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Breakdown list */}
              <div>
                <h4 className="text-base font-bold text-white mb-3 border-b border-slate-800 pb-2 print:text-gray-900 print:border-gray-200">Category Breakdown</h4>
                <div className="space-y-3">
                  {categoryExpenses.map((c, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-300 uppercase print:text-gray-700">{c.category}</span>
                        <span className="text-red-400 font-mono print:text-gray-900 font-bold">
                          ₹{c.amount.toFixed(2)} <span className="text-slate-500 print:text-gray-400 font-medium">({c.percentage.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 print:bg-gray-200">
                        <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, backgroundColor: c.color }}></div>
                      </div>
                    </div>
                  ))}
                  {categoryExpenses.length === 0 && (
                    <p className="text-slate-500 text-center italic py-2 print:text-gray-500 text-xs">No expenses logged yet.</p>
                  )}
                </div>
              </div>

              {/* Transactions for Report */}
              <div>
                <h4 className="text-base font-bold text-white mb-3 border-b border-slate-800 pb-2 print:text-gray-900 print:border-gray-200">Transactions Ledger (Up to 15)</h4>
                <table className="w-full text-left text-xs text-slate-350 print:text-gray-700 flex-1">
                  <thead>
                    <tr className="border-b border-slate-800 print:border-gray-300 text-[10px] uppercase text-slate-500 print:text-gray-400 font-bold">
                      <th className="py-1">Date</th>
                      <th className="py-1">Description</th>
                      <th className="py-1">Category</th>
                      <th className="py-1">Account</th>
                      <th className="py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(periodTransactions || []).slice(0, 15).map(tx => (
                      <tr key={tx.id} className="border-b border-slate-800/40 print:border-gray-200">
                        <td className="py-2 font-mono">{tx.date}</td>
                        <td className="py-2 font-bold text-slate-200 print:text-gray-900">{tx.title}</td>
                        <td className="py-2 uppercase text-[10px] font-mono text-slate-400 print:text-gray-600">{tx.category}</td>
                        <td className="py-2 text-slate-450 print:text-gray-600">{finances.wallets[tx.sourceWallet]?.name || 'Unknown'}</td>
                        <td className={`py-2 text-right font-mono font-bold ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'} print:text-gray-900`}>
                          {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {(periodTransactions || []).length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-slate-500 italic">No transactions logged in this period.</td>
                      </tr>
                    )}
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
