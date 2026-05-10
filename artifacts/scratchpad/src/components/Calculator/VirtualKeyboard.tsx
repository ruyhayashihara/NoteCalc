import { Key } from './Key';
import { ProgrammableKeys } from './ProgrammableKeys';
import { useTheme } from '../../contexts/ThemeContext';

interface VirtualKeyboardProps {
  activeTab: string;
  onKeyPress: (val: string) => void;
  onNavAction: (action: string) => void;
}

export const VirtualKeyboard = ({ activeTab, onKeyPress, onNavAction }: VirtualKeyboardProps) => {
  const { theme } = useTheme();

  const layouts = {
    K1: [
      ['AC', 'DEL', 'MR', '%'],
      ['M+', 'M-', 'MC', '÷'],
      ['7',  '8',  '9',  'x'],
      ['4',  '5',  '6',  '-'],
      ['1',  '2',  '3',  '+'],
      ['0',  '.',  '=',  '↵'],
    ],
    K2: [
      ['Deg', 'Rad', 'x!', '(', ')', '%', 'AC'],
      ['Inv', 'sin', 'ln',  '7', '8', '9', '÷'],
      ['π',   'cos', 'log', '4', '5', '6', 'x'],
      ['e',   'tan', '√',   '1', '2', '3', '-'],
      ['Ans', 'EXP', 'xʸ',  '0', '.', '=', '+'],
    ],
  };

  const scientificFns = [
    'Deg','Rad','x!','(', ')','Inv','sin','ln',
    'cos','log','tan','√', 'π', 'e', 'Ans','EXP','xʸ',
  ];

  const getVariant = (key: string, tab: string): any => {
    const isOperator = ['÷','x','-','+','=','↵','M+','M-','MC','MR','%'].includes(key);
    if (tab === 'K2') {
      if (key === 'AC')  return 'k2-ac';
      if (key === '=')   return 'scientific-eq';
      if (scientificFns.includes(key)) return 'scientific';
      if (isOperator)    return 'k2-operator';
      return 'default';
    }
    if (key === 'AC')  return 'ac';
    if (key === 'DEL') return 'del';
    if (isOperator || key === 'MR' || key === '%') return 'operator';
    return 'default';
  };

  // ── NAV tab ──────────────────────────────────────────────────────────────
  if (activeTab === 'NAV') {
    const navBtn = (action: string, children: React.ReactNode, cls = '', isKey = false) => (
      <button
        onPointerDown={(e) => { e.preventDefault(); isKey ? onKeyPress(action) : onNavAction(action); }}
        className={`flex items-center justify-center border-r border-b active:opacity-70 transition-colors h-14 sm:h-[72px] ${cls}`}
        style={{ backgroundColor: theme.colors.keyOperator, borderColor: theme.colors.border, color: theme.colors.text }}
      >
        {children}
      </button>
    );

    return (
      <div className="grid grid-cols-5 grid-rows-4 select-none" style={{ backgroundColor: theme.colors.keypadBg }}>
        {/* Row 1 */}
        {navBtn('Cut',  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="15.88"/><line x1="14.47" x2="20" y1="14.48" y2="20"/><line x1="8.12" x2="12" y1="8.12" y2="12"/></svg>)}
        {navBtn('Copy', <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>)}
        {navBtn('Paste',<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><path d="M12 11v4"/><path d="M12 7h.01"/></svg>)}
        {navBtn('SelectAll', <span className="font-bold text-sm">All</span>)}
        <button
          onPointerDown={(e) => { e.preventDefault(); onKeyPress('DEL'); }}
          className="flex items-center justify-center border-b active:opacity-70 transition-colors h-14 sm:h-[72px]"
          style={{ backgroundColor: theme.colors.keyAccent, borderColor: theme.colors.border, color: '#ffffff' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><line x1="18" x2="12" y1="9" y2="15"/><line x1="12" x2="18" y1="9" y2="15"/></svg>
        </button>

        {/* Row 2 & 3 — directional */}
        <button onPointerDown={(e)=>{e.preventDefault();onNavAction('Left');}}  className="row-span-2 flex items-center justify-center border-r border-b active:opacity-70 transition-colors h-28 sm:h-[144px]" style={{backgroundColor:theme.colors.keyOperator,borderColor:theme.colors.border,color:theme.colors.text}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg></button>
        <button onPointerDown={(e)=>{e.preventDefault();onNavAction('Up');}}    className="col-span-2 flex items-center justify-center border-r border-b active:opacity-70 transition-colors h-14 sm:h-[72px]" style={{backgroundColor:`${theme.colors.keyOperator}CC`,borderColor:theme.colors.border,color:theme.colors.text}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg></button>
        <button onPointerDown={(e)=>{e.preventDefault();onNavAction('Right');}} className="row-span-2 flex items-center justify-center border-r border-b active:opacity-70 transition-colors h-28 sm:h-[144px]" style={{backgroundColor:theme.colors.keyOperator,borderColor:theme.colors.border,color:theme.colors.text}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button>
        <button onPointerDown={(e)=>{e.preventDefault();onNavAction('Top');}}   className="flex items-center justify-center border-b active:opacity-70 transition-colors h-14 sm:h-[72px]" style={{backgroundColor:theme.colors.keyOperator,borderColor:theme.colors.border,color:theme.colors.text}}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 17-6-6-6 6"/><path d="M6 5h12"/></svg></button>
        <button onPointerDown={(e)=>{e.preventDefault();onNavAction('Down');}}  className="col-span-2 flex items-center justify-center border-r border-b active:opacity-70 transition-colors h-14 sm:h-[72px]" style={{backgroundColor:`${theme.colors.keyOperator}CC`,borderColor:theme.colors.border,color:theme.colors.text}}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
        <button onPointerDown={(e)=>{e.preventDefault();onNavAction('Bottom');}} className="flex items-center justify-center border-b active:opacity-70 transition-colors h-14 sm:h-[72px]" style={{backgroundColor:theme.colors.keyOperator,borderColor:theme.colors.border,color:theme.colors.text}}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h12"/><path d="m6 17 6 6 6-6"/></svg></button>

        {/* Row 4 */}
        <button onPointerDown={(e)=>{e.preventDefault();onNavAction('Undo');}} className="col-span-2 flex items-center justify-center gap-2 border-r active:opacity-70 transition-colors h-14 sm:h-[72px]" style={{backgroundColor:theme.colors.keyAccent,borderColor:theme.colors.border,color:'#ffffff'}}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg><span className="text-sm font-semibold">Undo</span></button>
        <button onPointerDown={(e)=>{e.preventDefault();onNavAction('Redo');}} className="col-span-2 flex items-center justify-center gap-2 border-r active:opacity-70 transition-colors h-14 sm:h-[72px]" style={{backgroundColor:theme.colors.keyAccent,borderColor:theme.colors.border,color:'#ffffff'}}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 3.7"/></svg><span className="text-sm font-semibold">Redo</span></button>
        <button onPointerDown={(e)=>{e.preventDefault();onKeyPress('↵');}} className="flex items-center justify-center gap-1 active:opacity-70 transition-colors h-14 sm:h-[72px]" style={{backgroundColor:theme.colors.keyDefault,borderColor:theme.colors.border,color:theme.colors.text}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg></button>
      </div>
    );
  }

  // ── PRG tab ──────────────────────────────────────────────────────────────
  if (activeTab === 'PRG') {
    return <ProgrammableKeys onKeyPress={onKeyPress} theme={theme} />;
  }

  // ── K1 / K2 tabs ─────────────────────────────────────────────────────────
  const currentLayout = layouts[activeTab as keyof typeof layouts] || layouts.K1;
  const gridCols = activeTab === 'K2' ? 'grid-cols-7' : 'grid-cols-4';

  return (
    <div className={`grid ${gridCols} select-none`} style={{ backgroundColor: activeTab === 'K2' ? theme.colors.surfaceSecondary : theme.colors.keypadBg }}>
      {currentLayout.flat().map((btnLabel, idx) => (
        <Key
          key={`${activeTab}-${idx}`}
          label={btnLabel}
          onClick={onKeyPress}
          variant={getVariant(btnLabel, activeTab)}
          theme={theme}
        />
      ))}
    </div>
  );
};
