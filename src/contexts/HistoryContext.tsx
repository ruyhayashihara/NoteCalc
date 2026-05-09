import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface HistoryEntry {
  id: string;
  content: string;
  total: number;
  timestamp: Date;
  title?: string;
}

interface HistoryContextType {
  history: HistoryEntry[];
  addToHistory: (content: string, total: number, title?: string) => void;
  clearHistory: () => void;
  restoreFromHistory: (entry: HistoryEntry) => void;
  isHistoryPanelOpen: boolean;
  setIsHistoryPanelOpen: (open: boolean) => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calc-history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp),
          }));
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

  // Save to localStorage whenever history changes
  useState(() => {
    localStorage.setItem('calc-history', JSON.stringify(history));
  });

  const addToHistory = useCallback((content: string, total: number, title?: string) => {
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      content,
      total,
      timestamp: new Date(),
      title,
    };

    setHistory(prev => {
      const newHistory = [newEntry, ...prev];
      // Keep only last 100 entries
      return newHistory.slice(0, 100);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('calc-history');
  }, []);

  const restoreFromHistory = useCallback((entry: HistoryEntry) => {
    // This will be handled by the parent component
    console.log('Restoring from history:', entry);
  }, []);

  const value = {
    history,
    addToHistory,
    clearHistory,
    restoreFromHistory,
    isHistoryPanelOpen,
    setIsHistoryPanelOpen,
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
