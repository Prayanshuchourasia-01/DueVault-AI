import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

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
  const [currentUser, setCurrentUser] = useState(null);
  const [finances, setFinances] = useState(defaultFinances);

  // Subscribe to Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch / Sync Finances
  useEffect(() => {
    if (!currentUser) {
      // Load offline from localStorage and reset states
      const saved = localStorage.getItem('duevault_finances');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          let transactions = parsed.transactions || [];
          if (parsed.expenses && transactions.length === 0) {
            transactions = parsed.expenses.map(e => ({...e, type: 'EXPENSE'}));
          }
          setFinances({ 
            ...defaultFinances, 
            ...parsed, 
            transactions,
            monthlyBudget: { ...defaultFinances.monthlyBudget, ...(parsed.monthlyBudget || {}) }
          });
        } catch (e) {
          setFinances(defaultFinances);
        }
      } else {
        setFinances(defaultFinances);
        localStorage.setItem('duevault_finances', JSON.stringify(defaultFinances));
      }
      return;
    }

    // Subscribe to Firestore finances document
    const docRef = doc(db, 'users', currentUser.uid, 'finances', 'data');
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const dbData = docSnap.data();
        setFinances(prev => {
          // Avoid infinite loops by only updating if there's a difference
          if (JSON.stringify(prev) === JSON.stringify(dbData)) return prev;
          return dbData;
        });
      } else {
        // Document does not exist yet, initialize with local storage or defaults
        const localSaved = localStorage.getItem('duevault_finances');
        let initialData = defaultFinances;
        if (localSaved) {
          try { initialData = JSON.parse(localSaved); } catch (e) {}
        }
        setDoc(docRef, initialData);
        setFinances(initialData);
      }
    });

    return () => unsub();
  }, [currentUser]);

  // Helper function to dispatch state updates safely to Firestore or LocalStorage
  const saveFinancesData = async (updatedFinances) => {
    setFinances(updatedFinances);
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'finances', 'data');
        await setDoc(docRef, updatedFinances);
      } catch (err) {
        console.error("Error writing finances to Firestore:", err);
      }
    } else {
      localStorage.setItem('duevault_finances', JSON.stringify(updatedFinances));
    }
  };

  // Keep monthly/weekly budget spent and income calculated automatically
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
      const nextFinances = {
        ...finances,
        monthlyBudget: { ...finances.monthlyBudget, spent: totalSpentMonth, income: totalIncomeMonth },
        weeklyBudget: { ...(finances.weeklyBudget || defaultFinances.weeklyBudget), spent: totalSpentWeek, income: totalIncomeWeek }
      };
      
      saveFinancesData(nextFinances);
    }
  }, [finances.transactions, currentUser]);

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

    const updatedWallets = { ...finances.wallets };
    if (updatedWallets[newTx.sourceWallet]) {
      if (newTx.type === 'EXPENSE') {
        updatedWallets[newTx.sourceWallet].balance -= newTx.amount;
      } else {
        updatedWallets[newTx.sourceWallet].balance += newTx.amount;
      }
    }

    const nextFinances = {
      ...finances,
      wallets: updatedWallets,
      transactions: [newTx, ...(finances.transactions || [])]
    };
    saveFinancesData(nextFinances);
  };

  const deleteTransaction = (id) => {
    const txToDel = (finances.transactions || []).find(e => e.id === id);
    if (!txToDel) return;

    const updatedWallets = { ...finances.wallets };
    if (updatedWallets[txToDel.sourceWallet]) {
      if (txToDel.type === 'EXPENSE') {
        updatedWallets[txToDel.sourceWallet].balance += txToDel.amount;
      } else {
        updatedWallets[txToDel.sourceWallet].balance -= txToDel.amount;
      }
    }

    const nextFinances = {
      ...finances,
      wallets: updatedWallets,
      transactions: finances.transactions.filter(e => e.id !== id)
    };
    saveFinancesData(nextFinances);
  };

  const editTransaction = (id, updatedData) => {
    const oldTx = (finances.transactions || []).find(e => e.id === id);
    if (!oldTx) return;

    const updatedWallets = { ...finances.wallets };

    // 1. Revert the old transaction's wallet impact
    if (updatedWallets[oldTx.sourceWallet]) {
      if (oldTx.type === 'EXPENSE') {
        updatedWallets[oldTx.sourceWallet].balance += oldTx.amount;
      } else {
        updatedWallets[oldTx.sourceWallet].balance -= oldTx.amount;
      }
    }

    // Create the updated transaction object
    const updatedTx = {
      ...oldTx,
      title: updatedData.title,
      amount: Number(updatedData.amount),
      date: updatedData.date,
      sourceWallet: updatedData.sourceWallet,
      category: updatedData.category || 'other',
      type: updatedData.type || 'EXPENSE'
    };

    // 2. Apply the new transaction's wallet impact
    if (updatedWallets[updatedTx.sourceWallet]) {
      if (updatedTx.type === 'EXPENSE') {
        updatedWallets[updatedTx.sourceWallet].balance -= updatedTx.amount;
      } else {
        updatedWallets[updatedTx.sourceWallet].balance += updatedTx.amount;
      }
    }

    // 3. Update the transaction in the list
    const updatedTransactions = (finances.transactions || []).map(tx => tx.id === id ? updatedTx : tx);

    const nextFinances = {
      ...finances,
      wallets: updatedWallets,
      transactions: updatedTransactions
    };
    saveFinancesData(nextFinances);
  };

  const updateWalletBalance = (walletId, newBalance) => {
    const nextFinances = {
      ...finances,
      wallets: {
        ...finances.wallets,
        [walletId]: { ...finances.wallets[walletId], balance: Number(newBalance) }
      }
    };
    saveFinancesData(nextFinances);
  };

  const updateWalletStartingBalance = (walletId, newStartingBalance) => {
    const nextFinances = {
      ...finances,
      wallets: {
        ...finances.wallets,
        [walletId]: { ...finances.wallets[walletId], startingBalance: Number(newStartingBalance) }
      }
    };
    saveFinancesData(nextFinances);
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
    const nextFinances = {
      ...finances,
      wallets: {
        ...finances.wallets,
        [id]: newWallet
      }
    };
    saveFinancesData(nextFinances);
  };

  const deleteWallet = (walletId) => {
    const nextWallets = { ...finances.wallets };
    delete nextWallets[walletId];
    const nextFinances = {
      ...finances,
      wallets: nextWallets
    };
    saveFinancesData(nextFinances);
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
    const nextWallets = {};
    Object.keys(finances.wallets).forEach(k => {
      nextWallets[k] = {
        ...finances.wallets[k],
        balance: finances.wallets[k].startingBalance
      };
    });
    const nextFinances = {
      ...finances,
      wallets: nextWallets,
      lastResetWeek: getWeekIdentifier(new Date())
    };
    saveFinancesData(nextFinances);
  };

  const dismissResetWeek = () => {
    const nextFinances = {
      ...finances,
      lastResetWeek: getWeekIdentifier(new Date())
    };
    saveFinancesData(nextFinances);
  };

  const setWalletLimitEnabled = (walletId, enabled) => {
    const nextFinances = {
      ...finances,
      wallets: {
        ...finances.wallets,
        [walletId]: { ...finances.wallets[walletId], limitEnabled: enabled }
      }
    };
    saveFinancesData(nextFinances);
  };

  const setBudgetLimit = (limit) => {
    const nextFinances = {
      ...finances,
      monthlyBudget: { ...finances.monthlyBudget, limit: Number(limit) }
    };
    saveFinancesData(nextFinances);
  };

  const setWeeklyLimit = (limit) => {
    const nextFinances = {
      ...finances,
      weeklyBudget: { ...(finances.weeklyBudget || defaultFinances.weeklyBudget), limit: Number(limit) }
    };
    saveFinancesData(nextFinances);
  };

  const saveReport = (reportData) => {
    const nextFinances = {
      ...finances,
      reports: [{ id: Date.now().toString(), date: new Date().toLocaleString(), ...reportData }, ...(finances.reports || [])]
    };
    saveFinancesData(nextFinances);
  };

  const toggleWalletVisibility = (walletId) => {
    const nextFinances = {
      ...finances,
      wallets: {
        ...finances.wallets,
        [walletId]: { ...finances.wallets[walletId], isHidden: !finances.wallets[walletId].isHidden }
      }
    };
    saveFinancesData(nextFinances);
  };

  const setWalletSpendLimit = (walletId, newLimit) => {
    const nextFinances = {
      ...finances,
      wallets: {
        ...finances.wallets,
        [walletId]: { ...finances.wallets[walletId], spendLimit: Number(newLimit) }
      }
    };
    saveFinancesData(nextFinances);
  };

  const addGoal = (goal) => {
    const nextFinances = {
      ...finances,
      goals: [...(finances.goals || []), { ...goal, id: Date.now().toString() }]
    };
    saveFinancesData(nextFinances);
  };

  const updateGoal = (id, amount) => {
    const nextFinances = {
      ...finances,
      goals: (finances.goals || []).map(g => g.id === id ? { ...g, current: parseFloat(amount) || 0 } : g)
    };
    saveFinancesData(nextFinances);
  };

  const deleteGoal = (id) => {
    const nextFinances = {
      ...finances,
      goals: (finances.goals || []).filter(g => g.id !== id)
    };
    saveFinancesData(nextFinances);
  };

  return {
    finances,
    addTransaction,
    deleteTransaction,
    editTransaction,
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
