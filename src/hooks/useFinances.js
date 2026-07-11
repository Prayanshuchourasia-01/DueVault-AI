import { useState, useEffect } from 'react';

const defaultFinances = {
  wallets: {
    cash: { id: 'cash', name: 'Cash Pocket', balance: 115, startingBalance: 120, isHidden: false, spendLimit: 37, limitEnabled: true },
    bank1: { id: 'bank1', name: 'Primary Bank (UPI)', balance: 3055, startingBalance: 100, isHidden: false, spendLimit: 100, limitEnabled: true },
    bank2: { id: 'bank2', name: 'Secondary Bank', balance: 488, startingBalance: 500, isHidden: false, spendLimit: 0, limitEnabled: false },
    savings: { id: 'savings', name: 'Savings Vault', balance: 5000, startingBalance: 5000, isHidden: true, spendLimit: 0, limitEnabled: false }
  },
  monthlyBudget: { limit: 800, spent: 0, income: 0 },
  weeklyBudget: { limit: 200, spent: 0, income: 0 },
  transactions: [
    { id: 'exp-1', type: 'EXPENSE', title: 'Groceries', amount: 45, date: new Date().toLocaleDateString('en-CA'), sourceWallet: 'bank1', category: 'food' },
    { id: 'exp-2', type: 'EXPENSE', title: 'Coffee', amount: 5, date: new Date().toLocaleDateString('en-CA'), sourceWallet: 'cash', category: 'leisure' },
    { id: 'exp-3', type: 'EXPENSE', title: 'AWS Hosting', amount: 12, date: new Date().toLocaleDateString('en-CA'), sourceWallet: 'bank2', category: 'bills' },
    { id: 'inc-1', type: 'INCOME', title: 'Salary', amount: 3000, date: new Date().toLocaleDateString('en-CA'), sourceWallet: 'bank1', category: 'salary' }
  ],
  goals: [],
  reports: [],
  lastResetWeek: ''
};

export const useFinances = () => {
  const [finances, setFinances] = useState(() => {
    const saved = localStorage.getItem('duevault_finances');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        // Migration from old schema if needed
        let transactions = parsed.transactions || [];
        if (parsed.expenses && transactions.length === 0) {
          transactions = parsed.expenses.map(e => ({...e, type: 'EXPENSE'}));
        }
        return { 
          ...defaultFinances, 
          ...parsed, 
          transactions,
          monthlyBudget: { ...defaultFinances.monthlyBudget, ...(parsed.monthlyBudget || {}) }
        };
      } catch (e) { }
    }
    localStorage.setItem('duevault_finances', JSON.stringify(defaultFinances));
    return defaultFinances;
  });

  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Weekly calculation
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    const startOfWeek = new Date(endOfWeek);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const monthlyTx = (finances.transactions || []).filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const weeklyTx = (finances.transactions || []).filter(tx => {
      const d = new Date(tx.date);
      return d > startOfWeek && d <= endOfWeek;
    });

    const totalSpentMonth = monthlyTx.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalIncomeMonth = monthlyTx.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    const totalSpentWeek = weeklyTx.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalIncomeWeek = weeklyTx.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    if (finances.monthlyBudget.spent !== totalSpentMonth || finances.monthlyBudget.income !== totalIncomeMonth || 
        finances.weeklyBudget?.spent !== totalSpentWeek || finances.weeklyBudget?.income !== totalIncomeWeek) {
      setFinances(prev => ({
        ...prev,
        monthlyBudget: { ...prev.monthlyBudget, spent: totalSpentMonth, income: totalIncomeMonth },
        weeklyBudget: { ...(prev.weeklyBudget || defaultFinances.weeklyBudget), spent: totalSpentWeek, income: totalIncomeWeek }
      }));
    } else {
      localStorage.setItem('duevault_finances', JSON.stringify(finances));
    }
  }, [finances]);

  const addTransaction = (txData) => {
    const newTx = {
      id: Date.now().toString(),
      type: txData.type || 'EXPENSE',
      title: txData.title,
      amount: Number(txData.amount),
      date: txData.date,
      sourceWallet: txData.sourceWallet,
      category: txData.category || 'other'
    };

    setFinances(prev => {
      const updatedWallets = { ...prev.wallets };
      if (updatedWallets[newTx.sourceWallet]) {
        if (newTx.type === 'EXPENSE') {
          updatedWallets[newTx.sourceWallet].balance -= newTx.amount;
        } else {
          updatedWallets[newTx.sourceWallet].balance += newTx.amount;
        }
      }

      return {
        ...prev,
        wallets: updatedWallets,
        transactions: [newTx, ...(prev.transactions || [])]
      };
    });
  };

  const deleteTransaction = (id) => {
    setFinances(prev => {
      const txToDel = (prev.transactions || []).find(e => e.id === id);
      if (!txToDel) return prev;

      const updatedWallets = { ...prev.wallets };
      if (updatedWallets[txToDel.sourceWallet]) {
        if (txToDel.type === 'EXPENSE') {
          updatedWallets[txToDel.sourceWallet].balance += txToDel.amount;
        } else {
          updatedWallets[txToDel.sourceWallet].balance -= txToDel.amount;
        }
      }

      return {
        ...prev,
        wallets: updatedWallets,
        transactions: prev.transactions.filter(e => e.id !== id)
      };
    });
  };

  const updateWalletBalance = (walletId, newBalance) => {
    setFinances(prev => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [walletId]: { ...prev.wallets[walletId], balance: Number(newBalance) }
      }
    }));
  };

  const updateWalletStartingBalance = (walletId, newStartingBalance) => {
    setFinances(prev => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [walletId]: { ...prev.wallets[walletId], startingBalance: Number(newStartingBalance) }
      }
    }));
  };

  const addWallet = (name, balance, isHidden = false, spendLimit = 0, limitEnabled = false) => {
    const id = 'wallet-' + Date.now().toString();
    const newWallet = {
      id,
      name,
      balance: Number(balance),
      startingBalance: Number(balance),
      isHidden,
      spendLimit: Number(spendLimit),
      limitEnabled
    };
    setFinances(prev => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [id]: newWallet
      }
    }));
  };

  const deleteWallet = (walletId) => {
    setFinances(prev => {
      const nextWallets = { ...prev.wallets };
      delete nextWallets[walletId];
      return {
        ...prev,
        wallets: nextWallets
      };
    });
  };

  const getWeekIdentifier = (date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - day);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${weekNo}`;
  };

  const resetWalletsToStarting = () => {
    setFinances(prev => {
      const nextWallets = {};
      Object.keys(prev.wallets).forEach(k => {
        nextWallets[k] = {
          ...prev.wallets[k],
          balance: prev.wallets[k].startingBalance
        };
      });
      return {
        ...prev,
        wallets: nextWallets,
        lastResetWeek: getWeekIdentifier(new Date())
      };
    });
  };

  const dismissResetWeek = () => {
    setFinances(prev => ({
      ...prev,
      lastResetWeek: getWeekIdentifier(new Date())
    }));
  };

  const setWalletLimitEnabled = (walletId, enabled) => {
    setFinances(prev => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [walletId]: { ...prev.wallets[walletId], limitEnabled: enabled }
      }
    }));
  };

  const setBudgetLimit = (limit) => {
    setFinances(prev => ({
      ...prev,
      monthlyBudget: { ...prev.monthlyBudget, limit: Number(limit) }
    }));
  };

  const setWeeklyLimit = (limit) => {
    setFinances(prev => ({
      ...prev,
      weeklyBudget: { ...(prev.weeklyBudget || defaultFinances.weeklyBudget), limit: Number(limit) }
    }));
  };

  const saveReport = (reportData) => {
    setFinances(prev => ({
      ...prev,
      reports: [{ id: Date.now().toString(), date: new Date().toLocaleString(), ...reportData }, ...(prev.reports || [])]
    }));
  };

  const toggleWalletVisibility = (walletId) => {
    setFinances(prev => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [walletId]: { ...prev.wallets[walletId], isHidden: !prev.wallets[walletId].isHidden }
      }
    }));
  };

  const setWalletSpendLimit = (walletId, newLimit) => {
    setFinances(prev => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [walletId]: { ...prev.wallets[walletId], spendLimit: Number(newLimit) }
      }
    }));
  };

  const addGoal = (goal) => {
    setFinances(prev => ({
      ...prev,
      goals: [...(prev.goals || []), { ...goal, id: Date.now().toString() }]
    }));
  };

  const updateGoal = (id, amount) => {
    setFinances(prev => ({
      ...prev,
      goals: (prev.goals || []).map(g => g.id === id ? { ...g, current: parseFloat(amount) || 0 } : g)
    }));
  };

  const deleteGoal = (id) => {
    setFinances(prev => ({
      ...prev,
      goals: (prev.goals || []).filter(g => g.id !== id)
    }));
  };

  return {
    finances,
    addTransaction,
    deleteTransaction,
    updateWalletBalance,
    toggleWalletVisibility,
    setWalletSpendLimit,
    setWalletLimitEnabled,
    updateWalletStartingBalance,
    addWallet,
    deleteWallet,
    resetWalletsToStarting,
    dismissResetWeek,
    getWeekIdentifier,
    setBudgetLimit,
    setWeeklyLimit,
    saveReport,
    addGoal,
    updateGoal,
    deleteGoal
  };
};
