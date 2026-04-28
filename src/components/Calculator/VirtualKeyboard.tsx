import { Key } from './Key';
import { Scissors, Copy, ClipboardPaste, MousePointerClick, ArrowLeft, ArrowUp, ArrowRight, ArrowDown, ArrowUpToLine, ArrowDownToLine, Undo2, Redo2, CornerDownLeft, Delete } from 'lucide-react';

interface VirtualKeyboardProps {
  activeTab: string;
  onKeyPress: (val: string) => void;
  onNavAction: (action: string) => void;
}

export const VirtualKeyboard = ({ activeTab, onKeyPress, onNavAction }: VirtualKeyboardProps) => {
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
      ['Deg', 'Rad', 'x!', '(', ')', '%', 'AC'],
      ['Inv', 'sin', 'ln', '7', '8', '9', '÷'],
      ['π', 'cos', 'log', '4', '5', '6', 'x'],
      ['e', 'tan', '√', '1', '2', '3', '-'],
      ['Ans', 'EXP', 'xʸ', '0', '.', '=', '+']
    ]
  };

  const scientificFns = ['Deg', 'Rad', 'x!', '(', ')', 'Inv', 'sin', 'ln', 'cos', 'log', 'tan', '√', 'π', 'e', 'Ans', 'EXP', 'xʸ'];

  const getVariant = (key: string, tab: string): any => {
    const isOperator = ['÷', 'x', '-', '+', '=', '↵', 'M+', 'M-', 'MC', 'MR', '%'].includes(key);
    if (tab === 'K2') {
      if (key === 'AC') return 'k2-ac';
      if (key === '=') return 'scientific-eq';
      if (scientificFns.includes(key)) return 'scientific';
      if (isOperator) return 'k2-operator';
      return 'default';
    } else {
      if (key === 'AC') return 'ac';
      if (key === 'DEL') return 'del';
      if (isOperator || key === 'MR' || key === '%') return 'operator';
    }
    return 'default';
  };

  if (activeTab === 'NAV') {
    return (
      <div className="grid grid-cols-5 grid-rows-4 select-none bg-[#e2e6eb]">
        {/* Row 1 */}
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('Cut'); }} className="flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><Scissors size={24} /></button>
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('Copy'); }} className="flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><Copy size={24} /></button>
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('Paste'); }} className="flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><ClipboardPaste size={24} /></button>
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('SelectAll'); }} className="flex items-center justify-center bg-[#f4f5f7] hover:bg-[#e4e6ea] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><MousePointerClick size={24} /></button>
        <button onPointerDown={(e) => { e.preventDefault(); onKeyPress('DEL'); }} className="flex items-center justify-center bg-[#7a8d9f] hover:bg-[#6c7d8d] text-white border-b border-[#6c7d8d] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><Delete size={24} /></button>

        {/* Row 2 & 3 */}
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('Left'); }} className="row-span-2 flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-28 sm:h-[144px] md:h-[160px]"><ArrowLeft size={24} /></button>
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('Up'); }} className="col-span-2 flex items-center justify-center bg-[#cfdae4] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><ArrowUp size={24} /></button>
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('Right'); }} className="row-span-2 flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-28 sm:h-[144px] md:h-[160px]"><ArrowRight size={24} /></button>
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('Top'); }} className="flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><ArrowUpToLine size={24} /></button>
        
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('Down'); }} className="col-span-2 flex items-center justify-center bg-[#cfdae4] hover:bg-[#b8c6d3] text-gray-800 border-r border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><ArrowDown size={24} /></button>
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('Bottom'); }} className="flex items-center justify-center bg-[#c8d4df] hover:bg-[#b8c6d3] text-gray-800 border-b border-[#b1c0cd] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><ArrowDownToLine size={24} /></button>

        {/* Row 4 */}
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('Undo'); }} className="col-span-2 flex items-center justify-center bg-[#7a8d9f] hover:bg-[#6c7d8d] text-white border-r border-[#6c7d8d] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><Undo2 size={24} /></button>
        <button onPointerDown={(e) => { e.preventDefault(); onNavAction('Redo'); }} className="col-span-2 flex items-center justify-center bg-[#7a8d9f] hover:bg-[#6c7d8d] text-white border-r border-[#6c7d8d] active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><Redo2 size={24} /></button>
        <button onPointerDown={(e) => { e.preventDefault(); onKeyPress('↵'); }} className="flex items-center justify-center bg-[#d0dbe4] hover:bg-[#b8c6d3] text-gray-800 active:opacity-70 transition-colors h-14 sm:h-[72px] md:h-[80px]"><CornerDownLeft size={24} className="mr-1" /> =/↵</button>
      </div>
    );
  }

  const currentLayout = layouts[activeTab as keyof typeof layouts] || layouts.K1;
  const gridCols = activeTab === 'K2' ? 'grid-cols-7' : 'grid-cols-4';

  return (
    <div className={`grid ${gridCols} select-none ${activeTab === 'K2' ? 'bg-[#2a3444]' : ''}`}>
      {currentLayout.flat().map((btnLabel, idx) => (
        <Key 
          key={`${activeTab}-${idx}`} 
          label={btnLabel} 
          onClick={onKeyPress} 
          variant={getVariant(btnLabel, activeTab)} 
        />
      ))}
    </div>
  );
};
