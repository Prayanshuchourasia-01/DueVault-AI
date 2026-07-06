import { useState, useEffect } from 'react';

const defaultFinances = {
  wallets: {
    cash: { id: 'cash', name: 'Cash Pocket', balance: 50 },
    bank1: { id: 'bank1', name: 'Primary Bank (UPI)', balance: 1500 },
    bank2: { id: 'bank2', name: 'Secondary Bank', balance: 300 },
    savings: { id: 'savings', name: 'Savings Vault', balance: 5000 }
  },
  monthlyBudget: { limit: 800, spent: 0, income: 0 },
  transactions: [
    { id: 'exp-1', type: 'EXPENSE', title: 'Groceries', amount: 45, date: new Date().toLocaleDateString('en-CA'), sourceWallet: 'bank1', category: 'food' },
    { id: 'exp-2', type: 'EXPENSE', title: 'Coffee', amount: 5, date: new Date().toLocaleDateString('en-CA'), sourceWallet: 'cash', category: 'leisure' },
    { id: 'exp-3', type: 'EXPENSE', title: 'AWS Hosting', amount: 12, date: new Date().toLocaleDateString('en-CA'), sourceWallet: 'bank2', category: 'bills' },
    { id: 'inc-1', type: 'INCOME', title: 'Salary', amount: 3000, date: new Date().toLocaleDateString('en-CA'), sourceWallet: 'bank1', category: 'salary' }
  ]
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
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTx = (finances.transactions || []).filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalSpent = monthlyTx.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalIncome = monthlyTx.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    if (finances.monthlyBudget.spent !== totalSpent || finances.monthlyBudget.income !== totalIncome) {
      setFinances(prev => ({
        ...prev,
        monthlyBudget: { ...prev.monthlyBudget, spent: totalSpent, income: totalIncome }
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

  const setBudgetLimit = (limit) => {
    setFinances(prev => ({
      ...prev,
      monthlyBudget: { ...prev.monthlyBudget, limit: Number(limit) }
    }));
  };

  return {
    finances,
    addTransaction,
    deleteTransaction,
    updateWalletBalance,
    setBudgetLimit
  };
};
