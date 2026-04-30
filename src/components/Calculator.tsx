import { useState, useRef, useEffect } from 'react';
import { evaluateNotes, formatNumber } from '../lib/math';
import { RotateCcw, Menu, Keyboard, Check, Loader2 } from 'lucide-react';
import { useCalculatorHistory } from '../hooks/useCalculatorHistory';
import { Editor } from './Calculator/Editor';
import { VirtualKeyboard } from './Calculator/VirtualKeyboard';
import { motion, AnimatePresence } from 'motion/react';

interface CalculatorProps {
  key?: string | number | null;
  initialContent: string;
  initialDrawing: string;
  onSave: (content: string, drawing: string, title?: string) => Promise<void> | void;
  onMenuClick: () => void;
  title: string;
}

export const Calculator = ({ initialContent, initialDrawing, onSave, onMenuClick, title }: CalculatorProps) => {
  const { text, setText, updateText, undo, redo, resetHistory, canUndo, canRedo } = useCalculatorHistory(initialContent);
  const [localTitle, setLocalTitle] = useState(title);
  const [total, setTotal] = useState(0);
  const [currentBlockTotal, setCurrentBlockTotal] = useState(0);
  const [lineResults, setLineResults] = useState<any[]>([]);
  const [memory, setMemory] = useState(0);
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [activeTab, setActiveTab] = useState('K1');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showSaved, setShowSaved] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<any>(null);

  const isDrawing = activeTab === 'DRAW';

  useEffect(() => {
    resetHistory(initialContent);
    setLocalTitle(title);
  }, [initialContent, title, resetHistory]);

  useEffect(() => {
    if (isDrawing && initialDrawing && canvasRef.current) {
       try {
         const parsed = JSON.parse(initialDrawing);
         if (parsed) {
           canvasRef.current.loadPaths(parsed);
         }
       } catch (e) {
         console.warn("Failed to parse initial drawing", e);
       }
    }
  }, [isDrawing, initialDrawing]);

  useEffect(() => {
    const res = evaluateNotes(text);
    setTotal(res.total);
    setCurrentBlockTotal(res.currentBlockTotal);
    setLineResults(res.lineResults);
  }, [text]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [text, localTitle]); // eslint-disable-line

  const handleKeyPress = (val: string) => {
    const el = textareaRef.current;
    if (!el) return;
    
    const start = el.selectionStart;
    const end = el.selectionEnd;
    
    let newText = text;
    let cursorOffset = val.length;

    if (val === 'AC') {
      newText = '';
      cursorOffset = 0;
    } else if (val === 'DEL') {
      if (start === end && start > 0) {
        newText = text.substring(0, start - 1) + text.substring(end);
        cursorOffset = -1;
      } else if (start !== end) {
        newText = text.substring(0, start) + text.substring(end);
        cursorOffset = 0;
      } else {
        cursorOffset = 0;
      }
    } else if (val === '=') {
      const formattedTotal = formatNumber(currentBlockTotal);
      const insertText = `\n------------------\n= ${formattedTotal}\n`;
      newText = text.substring(0, start) + insertText + text.substring(end);
      cursorOffset = insertText.length;
    } else if (val === '↵') {
      const { formattedText } = evaluateNotes(text);
      
      // Calculate how many characters were added/removed due to formatting BEFORE the cursor
      // This is essential to keep the cursor at the correct logical position
      const textBeforeCursor = text.substring(0, start);
      const { formattedText: formattedBefore } = evaluateNotes(textBeforeCursor);
      
      const newStart = formattedBefore.length;
      const newEnd = newStart + (end - start);
      
      newText = formattedText.substring(0, newStart) + '\n' + formattedText.substring(newEnd);
      cursorOffset = (newStart - start) + 1;
    } else if (val === 'M+') {
      setMemory(prev => prev + total);
      cursorOffset = 0;
    } else if (val === 'M-') {
      setMemory(prev => prev - total);
      cursorOffset = 0;
    } else if (val === 'MC') {
      setMemory(0);
      cursorOffset = 0;
    } else if (val === 'MR') {
      const recallVal = memory.toString();
      newText = text.substring(0, start) + recallVal + text.substring(end);
      cursorOffset = recallVal.length;
    } else if (val === 'Deg') {
      setAngleMode('deg');
      cursorOffset = 0;
    } else if (val === 'Rad') {
      setAngleMode('rad');
      cursorOffset = 0;
    } else if (val === 'Ans') {
      const ansStr = Math.trunc(currentBlockTotal).toString();
      newText = text.substring(0, start) + ansStr + text.substring(end);
      cursorOffset = ansStr.length;
    } else if (['sin', 'cos', 'tan', 'ln', 'log', '√', 'x!', 'EXP', 'xʸ', 'π', 'e', '(', ')', 'Inv'].includes(val)) {
      // Scientific functions: insert the function text
      const sciMap: Record<string, string> = {
        'sin': 'sin(', 'cos': 'cos(', 'tan': 'tan(',
        'ln': 'ln(', 'log': 'log(',
        '√': '√(', 'x!': '!', 'EXP': 'E',
        'xʸ': '^', 'π': 'π', 'e': 'e',
        '(': '(', ')': ')',
        'Inv': 'Inv'
      };
      const insertText = sciMap[val] || val;
      newText = text.substring(0, start) + insertText + text.substring(end);
      cursorOffset = insertText.length;
    } else {
      // Add space after math operators for better formatting
      const isOperator = ['+', '-', 'x', '÷', '*', '/'].includes(val);
      const insertText = isOperator ? `${val} ` : val;
      newText = text.substring(0, start) + insertText + text.substring(end);
      cursorOffset = insertText.length;
    }

    updateText(newText);

    
    setTimeout(() => {
      const newPos = Math.max(0, start + cursorOffset);
      el.setSelectionRange(newPos, newPos);
      el.focus();
    }, 0);
  };

  const handleNavKeyPress = async (action: string) => {
    const el = textareaRef.current;
    if (!el) return;
    
    const start = el.selectionStart;
    const end = el.selectionEnd;
    let newText = text;

    switch (action) {
      case 'Cut': {
        const textToCut = start !== end ? text.substring(start, end) : text;
        const newContent = start !== end ? text.substring(0, start) + text.substring(end) : '';
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(textToCut);
          updateText(newContent);
          const pos = start !== end ? start : 0;
          setTimeout(() => el.setSelectionRange(pos, pos), 0);
        }
        break;
      }
      case 'Copy': {
        const textToCopy = start !== end ? text.substring(start, end) : text;
        if (navigator.clipboard) await navigator.clipboard.writeText(textToCopy);
        break;
      }
      case 'Paste': {
        if (navigator.clipboard) {
          const clipText = await navigator.clipboard.readText();
          newText = text.substring(0, start) + clipText + text.substring(end);
          updateText(newText);
          const pos = start + clipText.length;
          setTimeout(() => el.setSelectionRange(pos, pos), 0);
        }
        break;
      }
      case 'SelectAll':
        el.setSelectionRange(0, text.length);
        break;
      case 'Left':
        el.setSelectionRange(Math.max(0, start - 1), Math.max(0, start - 1));
        break;
      case 'Right':
        el.setSelectionRange(Math.min(text.length, start + 1), Math.min(text.length, start + 1));
        break;
      case 'Up': {
        const lines = text.substring(0, start).split('\n');
        if (lines.length > 1) {
          const currentLinePos = lines[lines.length - 1].length;
          const newPos = start - currentLinePos - 1;
          el.setSelectionRange(newPos, newPos);
        } else {
          el.setSelectionRange(0, 0);
        }
        break;
      }
      case 'Down': {
        const linesAfter = text.substring(start).split('\n');
        if (linesAfter.length > 1) {
          const newPos = start + linesAfter[0].length + 1;
          el.setSelectionRange(newPos, newPos);
        } else {
          el.setSelectionRange(text.length, text.length);
        }
        break;
      }
      case 'Top':
        el.setSelectionRange(0, 0);
        break;
      case 'Bottom':
        el.setSelectionRange(text.length, text.length);
        break;
      case 'Undo':
        undo();
        break;
      case 'Redo':
        redo();
        break;
    }
    el.focus();
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    let drawingData = initialDrawing;
    if (isDrawing && canvasRef.current) {
        const paths = await canvasRef.current.exportPaths();
        drawingData = JSON.stringify(paths);
    }
    
    try {
      await onSave(text, drawingData, localTitle);
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error('Save failed:', error);
      setIsSaving(false);
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'DRAW') {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f2f3f5]">
      <div className="flex items-center justify-between p-4 bg-[#f2f3f5] border-b border-gray-200 shadow-sm z-10 shrink-0">
        <div className="flex items-center flex-1 mr-4">
           <button onClick={onMenuClick} className="p-2 -ml-2 text-gray-700 hover:bg-gray-200 rounded-full shrink-0">
             <Menu size={24} />
           </button>
           <input
               value={localTitle}
               onChange={(e) => setLocalTitle(e.target.value)}
               className="ml-2 w-full text-lg font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 rounded px-1 py-0.5 transition-colors z-10 placeholder-gray-400"
               placeholder="Nome da anotação..."
           />
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className={`relative flex items-center justify-center min-w-[80px] h-10 px-4 rounded-lg font-medium transition-colors duration-300 overflow-hidden ${
            showSaved 
              ? 'bg-green-100 text-green-700' 
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div
                key="saving"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center"
              >
                <Loader2 size={18} className="animate-spin" />
              </motion.div>
            ) : showSaved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center"
              >
                <Check size={18} className="mr-1" />
                <span>Saved</span>
              </motion.div>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                Save
              </motion.span>
            )}
          </AnimatePresence>
          
          {/* Subtle ripple effect overlay */}
          <motion.div 
            className="absolute inset-0 bg-current opacity-0"
            whileTap={{ opacity: 0.1 }}
          />
        </button>
      </div>



      <Editor 
        ref={textareaRef}
        text={text}
        onTextChange={updateText}
        isDrawing={isDrawing}
        canvasRef={canvasRef}
        activeTab={activeTab}
        lineResults={lineResults}
        onEnter={() => handleKeyPress('↵')}
      />



      <div className="bg-[#e2e6eb] shrink-0">
        <div className="flex items-center justify-between bg-[#d7dde3] border-b border-[#c8d0d8]">
            <div className="flex">
               {['K1', 'K2', 'NAV', 'ABC'].map(t => (
                  <button 
                     key={t}
                     onClick={() => handleTabClick(t)} 
                     className={`px-4 py-3 text-sm font-semibold transition-colors border-r border-[#c8d0d8] ${
                        activeTab === t 
                        ? 'bg-[#c8d0d8] text-gray-800' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-[#ced4da]'
                     }`}
                  >
                    {t}
                  </button>
               ))}
                <button 
                  onClick={() => setIsKeyboardVisible(!isKeyboardVisible)} 
                  className={`px-4 py-3 flex items-center justify-center transition-colors border-r border-[#c8d0d8] ${
                     !isKeyboardVisible 
                     ? 'bg-blue-100 text-blue-600' 
                     : 'text-gray-500 hover:text-gray-700 hover:bg-[#ced4da]'
                  }`}
                >
                  <Keyboard size={18} />
                </button>
            </div>
            
            <div className="flex items-center pr-4">
                 {memory !== 0 && (
                   <div className="mr-3 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded border border-blue-200 animate-pulse">
                     M
                   </div>
                 )}
                 {isDrawing && (

                    <button onClick={() => canvasRef.current?.undo()} className="p-2 text-gray-600 hover:bg-[#c8d0d8] rounded mr-2 transition-colors">
                        <RotateCcw size={18} />
                    </button>
                 )}
                <div className="font-semibold text-xl text-gray-800 tracking-tight whitespace-nowrap">
                  {formatNumber(total)}
                </div>
            </div>
        </div>

        <AnimatePresence>
          {isKeyboardVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden bg-[#e2e6eb]"
            >
              {activeTab !== 'ABC' && activeTab !== 'DRAW' && (
                <VirtualKeyboard 
                  activeTab={activeTab}
                  onKeyPress={handleKeyPress}
                  onNavAction={handleNavKeyPress}
                />
              )}
              
              {activeTab === 'ABC' && (
                 <div className="py-12 flex flex-col items-center justify-center text-gray-500 bg-[#e2e6eb]">
                     <Keyboard size={48} className="mb-4 opacity-20" />
                     <p>Use your device's native keyboard to type.</p>
                 </div>
              )}

              {activeTab === 'DRAW' && (
                 <div className="h-48 flex items-center justify-center text-gray-400 bg-white rounded-lg border border-gray-300 m-2">
                     Desenhe no editor acima
                 </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};



