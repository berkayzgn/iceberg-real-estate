import React, { createContext, useContext, useState, useCallback } from 'react';
import { AGENTS, TRANSACTIONS, Agent, Transaction, Stage, getNextStage, STAGE_LABELS, ActivityEntry } from '../data/mockData';

interface AppContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  agents: Agent[];
  transactions: Transaction[];
  getTransaction: (id: string) => Transaction | undefined;
  getAgent: (id: string) => Agent | undefined;
  advanceStage: (transactionId: string) => void;
  addTransaction: (data: Omit<Transaction, 'id' | 'activityLog'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('propex_auth') === 'true';
  });
  const [transactions, setTransactions] = useState<Transaction[]>(TRANSACTIONS);
  const agents = AGENTS;

  const login = useCallback((email: string, password: string) => {
    if (email && password.length >= 4) {
      setIsAuthenticated(true);
      localStorage.setItem('propex_auth', 'true');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem('propex_auth');
  }, []);

  const getTransaction = useCallback((id: string) => {
    return transactions.find(t => t.id === id);
  }, [transactions]);

  const getAgent = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  const advanceStage = useCallback((transactionId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== transactionId) return t;
      const next = getNextStage(t.stage);
      if (!next) return t;
      const newEntry: ActivityEntry = {
        id: `al${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'stage_change',
        description: `Stage advanced to ${STAGE_LABELS[next]}.`,
        fromStage: t.stage,
        toStage: next,
      };
      return {
        ...t,
        stage: next,
        activityLog: [...t.activityLog, newEntry],
      };
    }));
  }, []);

  const addTransaction = useCallback((data: Omit<Transaction, 'id' | 'activityLog'>) => {
    const id = `T${String(Date.now()).slice(-4)}`;
    const newTransaction: Transaction = {
      ...data,
      id,
      stage: 'agreement',
      activityLog: [
        {
          id: `al${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'stage_change',
          description: 'Agreement signed. Transaction created.',
          toStage: 'agreement',
        },
      ],
    };
    setTransactions(prev => [newTransaction, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, data: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  return (
    <AppContext.Provider value={{
      isAuthenticated, login, logout,
      agents, transactions,
      getTransaction, getAgent,
      advanceStage, addTransaction, updateTransaction,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
