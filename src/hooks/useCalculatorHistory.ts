import { useState, useCallback } from 'react';

export function useCalculatorHistory(initialContent: string) {
  const [text, setText] = useState(initialContent);
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const updateText = useCallback((newText: string) => {
    setText(newText);
    
    // Only add to history if the text actually changed
    setHistory(prevHistory => {
      if (newText === prevHistory[historyIndex]) return prevHistory;
      
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(newText);
      
      // Keep history size manageable
      if (newHistory.length > 200) {
        newHistory.shift();
      }
      
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setText(history[newIndex]);
      return history[newIndex];
    }
    return text;
  }, [historyIndex, history, text]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setText(history[newIndex]);
      return history[newIndex];
    }
    return text;
  }, [historyIndex, history, text]);

  const resetHistory = useCallback((newInitialContent: string) => {
    setText(newInitialContent);
    setHistory([newInitialContent]);
    setHistoryIndex(0);
  }, []);

  return {
    text,
    setText,
    updateText,
    undo,
    redo,
    resetHistory,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  };
}
