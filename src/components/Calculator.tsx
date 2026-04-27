import { useState, useRef, useEffect } from 'react';
import { evaluateNotes, formatNumber } from '../lib/math';
import { Delete, PenTool, X, RotateCcw, Menu, Save, Keyboard, Scissors, Copy, ClipboardPaste, MousePointerClick, ArrowLeft, ArrowUp, ArrowRight, ArrowDown, ArrowUpToLine, ArrowDownToLine, Undo2, Redo2, CornerDownLeft } from 'lucide-react';
import { ReactSketchCanvas } from 'react-sketch-canvas';

interface CalculatorProps {
  key?: string | React.Key;
  initialContent: string;
  initialDrawing: string;
  onSave: (content: string, drawing: string, title?: string) => void;
  onMenuClick: () => void;
  title: string;
}

export const Calculator = ({ initialContent, initialDrawing, onSave, onMenuClick, title }: CalculatorProps) => {
  const [text, setText] = useState(initialContent);
  const [localTitle, setLocalTitle] = useState(title);
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('K1'); // K1, K2, NAV, ABC, DRAW
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef = useRef<any>(null);

  const isDrawing = activeTab === 'DRAW';

  const updateText = (newText: string) => {
    setText(newText);
    if (newText !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newText);
      if (newHistory.length > 200) {
        newHistory.shift();
      }
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  useEffect(() => {
    setText(initialContent);
    setHistory([initialContent]);
    setHistoryIndex(0);
    setLocalTitle(title);
  }, [initialContent, title]);

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
  }, [text]);

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
      // Create a sum block line
      newText = text.substring(0, start) + '\n------------------\n= ' + formatNumber(total) + '\n' + text.substring(end);
      cursorOffset = ('\n------------------\n= ' + formatNumber(total) + '\n').length;
    } else if (val === '↵') {
      newText = text.substring(0, start) + '\n' + text.substring(end);
      cursorOffset = 1;
    } else {
      newText = text.substring(0, start) + val + text.substring(end);
    }

    updateText(newText);
    
    setTimeout(() => {
      if (val === 'AC') {
        el.setSelectionRange(0, 0);
      } else {
        el.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }
      el.focus();
    }, 0);
  };

  const handleNavKeyPress = async (action: string) => {
    const el = textareaRef.current;
    if (!el) return;
    
    const start = el.selectionStart;
    const end = el.selectionEnd;
    let newText = text;

    if (action === 'Cut') {
        const textToCut = start !== end ? text.substring(start, end) : text;
        const newTextContent = start !== end ? text.substring(0, start) + text.substring(end) : '';
        
        const fallbackCut = () => {
           el.focus();
           if (start === end) el.select();
           document.execCommand('cut');
           updateText(el.value);
        };

        if (navigator.clipboard) {
           navigator.clipboard.writeText(textToCut).then(() => {
              updateText(newTextContent);
              const newCursor = start !== end ? start : 0;
              setTimeout(() => { el.setSelectionRange(newCursor, newCursor); el.focus(); }, 0);
           }).catch(fallbackCut);
        } else {
           fallbackCut();
        }
    } else if (action === 'Copy') {
        const textToCopy = start !== end ? text.substring(start, end) : text;
        
        const fallbackCopy = () => {
           el.focus();
           if (start === end) el.select();
           const ok = document.execCommand('copy');
           if (start === end) el.setSelectionRange(start, start); // restore
           if (!ok) alert("Falha ao copiar. Tente copiar manualmente.");
        };

        if (navigator.clipboard) {
           navigator.clipboard.writeText(textToCopy).catch(fallbackCopy);
        } else {
           fallbackCopy();
        }
        el.focus();
    } else if (action === 'Paste') {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const clipText = await navigator.clipboard.readText();
                newText = text.substring(0, start) + clipText + text.substring(end);
                updateText(newText);
                setTimeout(() => {
                    el.setSelectionRange(start + clipText.length, start + clipText.length);
                    el.focus();
                }, 0);
            } else {
                throw new Error("Clipboard API not available");
            }
        } catch (e) {
            console.error('Paste error:', e);
            const success = document.execCommand('paste');
            if (!success) {
                alert("Para colar, aperte e segure na área de texto e selecione 'Colar'.");
            } else {
                updateText(el.value);
            }
            el.focus();
        }
    } else if (action === 'SelectAll') {
        el.focus();
        el.setSelectionRange(0, text.length);
    } else if (action === 'DEL') {
        handleKeyPress('DEL');
    } else if (action === 'Left') {
        el.setSelectionRange(Math.max(0, start - 1), Math.max(0, start - 1));
        el.focus();
    } else if (action === 'Right') {
        el.setSelectionRange(Math.min(text.length, start + 1), Math.min(text.length, start + 1));
        el.focus();
    } else if (action === 'Up') {
        const lines = text.substring(0, start).split('\n');
        if (lines.length > 1) {
            const currentLinePos = lines[lines.length - 1].length;
            let prevLinePos = Math.min(currentLinePos, lines[lines.length - 2].length);
            const newPos = start - currentLinePos - 1 - (lines[lines.length - 2].length - prevLinePos);
            el.setSelectionRange(newPos, newPos);
        } else {
            el.setSelectionRange(0, 0);
        }
        el.focus();
    } else if (action === 'Down') {
        const textBefore = text.substring(0, start);
        const textAfter = text.substring(start);
        const currentLineBeforePos = textBefore.split('\n').pop()?.length || 0;
        
        const linesAfter = textAfter.split('\n');
        if (linesAfter.length > 1) {
            const currentLineAfterLength = linesAfter[0].length;
            const nextLineLength = linesAfter[1].length;
            const nextLineTarget = Math.min(currentLineBeforePos, nextLineLength);
            const newPos = start + currentLineAfterLength + 1 + nextLineTarget;
            el.setSelectionRange(newPos, newPos);
        } else {
            el.setSelectionRange(text.length, text.length);
        }
        el.focus();
    } else if (action === 'Top') {
        el.setSelectionRange(0, 0);
        el.focus();
    } else if (action === 'Bottom') {
        el.setSelectionRange(text.length, text.length);
        el.focus();
    } else if (action === 'Undo') {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setText(history[newIndex]);
        }
        el.focus();
    } else if (action === 'Redo') {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setText(history[newIndex]);
        }
        el.focus();
    }
  };

  const handleSave = async () => {
    if (isDrawing && canvasRef.current) {
        const paths = await canvasRef.current.exportPaths();
        onSave(text, JSON.stringify(paths), localTitle);
    } else {
        onSave(text, initialDrawing, localTitle);
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'ABC' || tab === 'K1' || tab === 'K2' || tab === 'NAV') {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const layouts = {
    K1: [
      ['AC', 'DEL', 'MR', '%'],
      ['M+', 'M-', 'MC', '÷'],
      ['7', '8', '9', 'x'],
      ['4', '5', '6', '-'],
      ['1', '2', '3', '+'],
      ['0', '.', '=', '↵']
    ],
    K2: [
      ['AC', 'DEL', '%', '÷'],
      ['7', '8', '9', 'x'],
      ['4', '5', '6', '-'],
      ['1', '2', '3', '+'],
      ['0', '00', '.', '=']
    ],
    NAV: [
      []
    ]
  };

  const currentLayout = layouts[activeTab as keyof typeof layouts] || layouts.K1;

  const renderKey = (key: string, idx: number) => {
    const isOperator = ['÷', 'x', '-', '+', '=', '↵', '=/↵', 'M+', 'M-', 'MC', 'MR', '%', 'Button'].includes(key);
    const isAc = key === 'AC';
    const isDel = key === 'DEL';
    
    let bg = 'bg-[#f4f5f7] hover:bg-[#e4e6ea]';
    let textColor = 'text-gray-800 font-medium';
    let border = 'border-r border-b border-[#c8d0d8]';

    if (activeTab === 'K2') {
       if (isAc) { bg = 'bg-red-50 hover:bg-red-100'; textColor = 'text-red-600'; }
       else if (isDel) { bg = 'bg-gray-200 hover:bg-gray-300'; }
       else if (isOperator) { bg = 'bg-blue-50 hover:bg-blue-100'; textColor = 'text-blue-700'; }
    } else if (activeTab === 'NAV') {
       if (isAc) { bg = 'bg-black hover:bg-gray-800'; textColor = 'text-white'; }
       else if (isDel) { bg = 'bg-gray-300 hover:bg-gray-400'; }
       else if (isOperator) { bg = 'bg-gray-100 hover:bg-gray-200'; }
       else { bg = 'bg-white hover:bg-gray-50'; }
    } else { // K1
       bg = 'bg-[#e2e6eb] hover:bg-[#d6dbe0]';
       textColor = 'text-gray-800';
       if (isAc) {
         bg = 'bg-[#cb7145] hover:bg-[#b86138]';
         border = 'border-r border-b border-[#af5e35]';
         textColor = 'text-white';
       } else if (isDel) {
         bg = 'bg-[#8296a8] hover:bg-[#728595]';
         border = 'border-r border-b border-[#6c7d8c]';
         textColor = 'text-white';
       } else if (key === 'MR' || key === '%') {
         bg = 'bg-[#b6c7d5] hover:bg-[#a5b7c6]'; // Slightly lighter blue for MR/% like in screenshot
         border = 'border-r border-b border-[#a8b8c5]';
       } else if (isOperator) {
         bg = 'bg-[#b6c7d5] hover:bg-[#a5b7c6]'; // Standard operator blue
         border = 'border-r border-b border-[#a8b8c5]';
       } else {
         bg = 'bg-[#f4f5f7] hover:bg-[#e4e6ea]';
         textColor = 'text-gray-800 font-medium';
       }
    }

    return (
      <button
        key={idx}
        onPointerDown={(e) => { e.preventDefault(); handleKeyPress(key); }}
        className={`flex items-center justify-center py-2 text-xl sm:text-2xl ${bg} ${textColor} ${border} active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]`}
      >
        {key === 'DEL' ? <Delete size={24} /> : key}
      </button>
    );
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
        <button onClick={handleSave} className="p-2 text-blue-600 font-medium hover:bg-blue-50 rounded shrink-0">
          Save
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
          <textarea
            ref={textareaRef}
            style={{ display: isDrawing ? 'none' : 'block' }}
            value={text}
            onChange={(e) => updateText(e.target.value)}
            className="flex-1 w-full p-4 bg-transparent resize-none focus:outline-none text-gray-800 font-mono text-lg leading-relaxed overflow-y-auto"
            placeholder="+ 100 rent&#10;+ 50 food"
            inputMode={activeTab === 'ABC' ? 'text' : 'none'}
          />
          {isDrawing && (
            <div className="flex-1 relative">
                <ReactSketchCanvas
                  ref={canvasRef}
                  strokeWidth={3}
                  strokeColor="black"
                  canvasColor="transparent"
                  className="absolute inset-0"
                />
            </div>
          )}
      </div>

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
                 onClick={() => handleTabClick('DRAW')} 
                 className={`px-4 py-3 flex items-center justify-center transition-colors border-r border-[#c8d0d8] ${
                    activeTab === 'DRAW' 
                    ? 'bg-[#c8d0d8] text-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-[#ced4da]'
                 }`}
               >
                 <Keyboard size={18} />
               </button>
            </div>
            
            <div className="flex items-center pr-4">
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

        {activeTab !== 'NAV' && activeTab !== 'ABC' && activeTab !== 'DRAW' && (
          <div className={`grid grid-cols-4 select-none ${activeTab === 'K2' ? 'bg-white' : ''}`}>
             {currentLayout.flat().map((key, i) => renderKey(key, i))}
          </div>
        )}

        {activeTab === 'NAV' && (
          <div className="grid grid-cols-5 grid-rows-4 select-none bg-[#e2e6eb]">
             {/* Row 1 */}
             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('Cut'); }} className="flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><Scissors size={24} /></button>
             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('Copy'); }} className="flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><Copy size={24} /></button>
             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('Paste'); }} className="flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><ClipboardPaste size={24} /></button>
             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('SelectAll'); }} className="flex items-center justify-center bg-[#f4f5f7] hover:bg-[#e4e6ea] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><MousePointerClick size={24} /></button>
             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('DEL'); }} className="flex items-center justify-center bg-[#7a8d9f] hover:bg-[#6c7d8d] text-white border-b border-[#6c7d8d] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><Delete size={24} /></button>

             {/* Row 2 & 3 */}
             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('Left'); }} className="row-span-2 flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-28 sm:h-[144px] md:h-[160px]"><ArrowLeft size={24} /></button>
             
             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('Up'); }} className="col-span-2 flex items-center justify-center bg-[#cfdae4] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><ArrowUp size={24} /></button>

             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('Right'); }} className="row-span-2 flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-28 sm:h-[144px] md:h-[160px]"><ArrowRight size={24} /></button>

             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('Top'); }} className="flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><ArrowUpToLine size={24} /></button>
             
             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('Down'); }} className="col-span-2 flex items-center justify-center bg-[#cfdae4] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><ArrowDown size={24} /></button>
             
             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('Bottom'); }} className="flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><ArrowDownToLine size={24} /></button>

             {/* Row 4 */}
             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('Undo'); }} className="col-span-2 flex items-center justify-center bg-[#7a8d9f] hover:bg-[#6c7d8d] text-white border-r border-[#6c7d8d] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><Undo2 size={24} /></button>
             <button onPointerDown={(e) => { e.preventDefault(); handleNavKeyPress('Redo'); }} className="col-span-2 flex items-center justify-center bg-[#7a8d9f] hover:bg-[#6c7d8d] text-white border-r border-[#6c7d8d] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><Redo2 size={24} /></button>
             <button onPointerDown={(e) => { e.preventDefault(); handleKeyPress('↵'); }} className="flex items-center justify-center bg-[#d0dbe4] hover:bg-[#b8c6d3] text-gray-800 active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><CornerDownLeft size={24} className="mr-1" /> =/↵</button>
          </div>
        )}
        
        {activeTab === 'ABC' && (
           <div className="py-12 flex flex-col items-center justify-center text-gray-500 bg-[#e2e6eb]">
               <Keyboard size={48} className="mb-4 opacity-20" />
               <p>Use your device's native keyboard to type.</p>
           </div>
        )}
      </div>
    </div>
  );
};


