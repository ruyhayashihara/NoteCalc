import { useState, useRef, useEffect, useCallback } from 'react';
import { evaluateNotes, formatTotal } from '../lib/math';
import { RotateCcw, Menu, Keyboard, Check, Loader2, ZoomIn, ZoomOut, Download, Settings2 } from 'lucide-react';
import { useCalculatorHistory } from '../hooks/useCalculatorHistory';
import { useTheme } from '../contexts/ThemeContext';
import { useHistory } from '../contexts/HistoryContext';
import { Editor } from './Calculator/Editor';
import { VirtualKeyboard } from './Calculator/VirtualKeyboard';
import { ExportModal } from './ExportModal';
import { motion, AnimatePresence } from 'motion/react';
import type { DrawingCanvasHandle } from './Calculator/DrawingCanvas';

// ─── Settings Panel ───────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'none', label: '1,234.56' },
  { code: 'USD',  label: '$' },
  { code: 'BRL',  label: 'R$' },
  { code: 'EUR',  label: '€' },
  { code: 'JPY',  label: '¥' },
];

const DECIMALS = [
  { value: 0, label: '0' },
  { value: 2, label: '2' },
  { value: 4, label: '4' },
];

function SettingsPanel({
  currency, setCurrency,
  decimalPlaces, setDecimalPlaces,
  theme, onClose,
}: {
  currency: string; setCurrency: (c: string) => void;
  decimalPlaces: number; setDecimalPlaces: (d: number) => void;
  theme: any; onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl p-5 pb-10 space-y-5"
        style={{ backgroundColor: theme.colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-base" style={{ color: theme.colors.text }}>Tape Settings</h3>

        {/* Currency */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: theme.colors.textSecondary }}>CURRENCY SYMBOL</p>
          <div className="flex gap-2 flex-wrap">
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: currency === c.code ? theme.colors.primary : theme.colors.keyDefault,
                  color: currency === c.code ? '#fff' : theme.colors.text,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Decimal places */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: theme.colors.textSecondary }}>DECIMAL PLACES</p>
          <div className="flex gap-2">
            {DECIMALS.map(d => (
              <button
                key={d.value}
                onClick={() => setDecimalPlaces(d.value)}
                className="w-16 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: decimalPlaces === d.value ? theme.colors.primary : theme.colors.keyDefault,
                  color: decimalPlaces === d.value ? '#fff' : theme.colors.text,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalculatorProps {
  key?: string | number | null;
  initialContent: string;
  initialDrawing: string;
  onSave: (content: string, drawing: string, title?: string) => Promise<void> | void;
  onMenuClick: () => void;
  title: string;
  noteId: string;
  exportTriggerRef?: React.MutableRefObject<(() => void) | null>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Calculator = ({
  initialContent, initialDrawing, onSave, onMenuClick, title, noteId, exportTriggerRef,
}: CalculatorProps) => {
  const { theme } = useTheme();
  const { addToHistory } = useHistory();
  const { text, setText, updateText, undo, redo, resetHistory, canUndo, canRedo } = useCalculatorHistory(initialContent);

  const [localTitle, setLocalTitle]           = useState(title);
  const [total, setTotal]                     = useState(0);
  const [currentBlockTotal, setCurrentBlockTotal] = useState(0);
  const [lineResults, setLineResults]         = useState<any[]>([]);
  const [memory, setMemory]                   = useState(0);
  const [angleMode, setAngleMode]             = useState<'deg' | 'rad'>('deg');
  const [activeTab, setActiveTab]             = useState('K1');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(true);
  const [isSaving, setIsSaving]               = useState(false);
  const [showSaved, setShowSaved]             = useState(false);
  const [fontSize, setFontSize]               = useState(15);
  const [showExport, setShowExport]           = useState(false);
  const [showSettings, setShowSettings]       = useState(false);

  // Tape settings — persisted per device
  const [currency, setCurrencyState]          = useState(() => localStorage.getItem('calc-currency') || 'JPY');
  const [decimalPlaces, setDecimalPlacesState] = useState(() => Number(localStorage.getItem('calc-decimals') ?? 2));

  const setCurrency = (c: string) => { setCurrencyState(c); localStorage.setItem('calc-currency', c); };
  const setDecimalPlaces = (d: number) => { setDecimalPlacesState(d); localStorage.setItem('calc-decimals', String(d)); };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasRef   = useRef<DrawingCanvasHandle>(null);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDrawing = activeTab === 'DRAW';

  // ── Sync when note changes ────────────────────────────────────────────────
  useEffect(() => {
    resetHistory(initialContent);
    setLocalTitle(title);
  }, [initialContent, title, resetHistory]);

  // ── Export Trigger ────────────────────────────────────────────────────────
  useEffect(() => {
    if (exportTriggerRef) {
      exportTriggerRef.current = () => setShowExport(true);
    }
  }, [exportTriggerRef]);

  // ── Drawing init ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isDrawing && initialDrawing && canvasRef.current) {
      try {
        const parsed = JSON.parse(initialDrawing);
        if (parsed) canvasRef.current.loadPaths(parsed);
      } catch {}
    }
  }, [isDrawing, initialDrawing]);

  // ── Evaluate on text change ───────────────────────────────────────────────
  useEffect(() => {
    const res = evaluateNotes(text, angleMode === 'deg', currency, decimalPlaces);
    setTotal(res.total);
    setCurrentBlockTotal(res.currentBlockTotal);
    setLineResults(res.lineResults);
  }, [text, angleMode, currency, decimalPlaces]);

  // ── Auto-save to localStorage (draft) ────────────────────────────────────
  useEffect(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`notecalc-draft-${noteId}`, JSON.stringify({ text, title: localTitle, ts: Date.now() }));
      } catch {}
    }, 1000);
    return () => { if (autosaveRef.current) clearTimeout(autosaveRef.current); };
  }, [text, localTitle, noteId]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's') { e.preventDefault(); handleSave(); }
      else if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (ctrl && e.key === '1') { e.preventDefault(); setFontSize(f => Math.max(11, f - 2)); }
      else if (ctrl && e.key === '2') { e.preventDefault(); setFontSize(f => Math.min(22, f + 2)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [text, localTitle]); // eslint-disable-line

  // ── Key press handler ─────────────────────────────────────────────────────
  const handleKeyPress = useCallback((val: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end   = el.selectionEnd;
    let newText = text;
    let cursorOffset = val.length;

    if (val === 'AC') {
      newText = ''; cursorOffset = 0;
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
      const formattedTotal = formatTotal(currentBlockTotal, currency);
      const insertText = `\n------------------\n= ${formattedTotal}\n`;
      newText = text.substring(0, start) + insertText + text.substring(end);
      cursorOffset = insertText.length;
    } else if (val === '↵') {
      const res = evaluateNotes(text, angleMode === 'deg', currency, decimalPlaces);
      const lines    = text.split('\n');
      const fmtLines = res.lineResults.map((r, i) => r.formattedLine ?? lines[i] ?? '');
      const formattedText = fmtLines.join('\n');
      const textBeforeCursor = text.substring(0, start);
      const beforeLines = textBeforeCursor.split('\n');
      const beforeFmt   = res.lineResults
        .slice(0, beforeLines.length)
        .map((r, i) => r.formattedLine ?? lines[i] ?? '');
      const newStart = beforeFmt.join('\n').length;
      newText = formattedText.substring(0, newStart) + '\n' + formattedText.substring(newStart + (end - start));
      cursorOffset = (newStart - start) + 1;
    } else if (val === 'M+')  { setMemory(p => p + currentBlockTotal); cursorOffset = 0;
    } else if (val === 'M-')  { setMemory(p => p - currentBlockTotal); cursorOffset = 0;
    } else if (val === 'MC')  { setMemory(0); cursorOffset = 0;
    } else if (val === 'MR')  {
      const s = memory.toString();
      newText = text.substring(0, start) + s + text.substring(end);
      cursorOffset = s.length;
    } else if (val === 'Deg') { setAngleMode('deg'); cursorOffset = 0;
    } else if (val === 'Rad') { setAngleMode('rad'); cursorOffset = 0;
    } else if (val === 'Ans') {
      const s = Math.trunc(currentBlockTotal).toString();
      newText = text.substring(0, start) + s + text.substring(end);
      cursorOffset = s.length;
    } else if (['sin','cos','tan','ln','log','√','x!','EXP','xʸ','π','e','(',')', 'Inv'].includes(val)) {
      const sciMap: Record<string, string> = {
        sin:'sin(', cos:'cos(', tan:'tan(',
        ln:'ln(', log:'log(', '√':'√(', 'x!':'!', EXP:'E',
        'xʸ':'^', π:'π', e:'e', '(':'(', ')':')', Inv:'Inv',
      };
      const insert = sciMap[val] || val;
      newText = text.substring(0, start) + insert + text.substring(end);
      cursorOffset = insert.length;
    } else {
      const isOperator = ['+','-','x','÷','*','/'].includes(val);
      const insert = isOperator ? `${val} ` : val;
      newText = text.substring(0, start) + insert + text.substring(end);
      cursorOffset = insert.length;
    }

    updateText(newText);
    setTimeout(() => {
      const pos = Math.max(0, start + cursorOffset);
      el.setSelectionRange(pos, pos);
      el.focus();
    }, 0);
  }, [text, currentBlockTotal, memory, angleMode, currency, decimalPlaces, updateText]);

  // ── Nav action handler ────────────────────────────────────────────────────
  const handleNavKeyPress = async (action: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;

    switch (action) {
      case 'Cut': {
        const cut = start !== end ? text.substring(start, end) : text;
        const remaining = start !== end ? text.substring(0, start) + text.substring(end) : '';
        if (navigator.clipboard) { await navigator.clipboard.writeText(cut); updateText(remaining); setTimeout(() => el.setSelectionRange(start !== end ? start : 0, start !== end ? start : 0), 0); }
        break;
      }
      case 'Copy': { const c = start !== end ? text.substring(start, end) : text; if (navigator.clipboard) await navigator.clipboard.writeText(c); break; }
      case 'Paste': { if (navigator.clipboard) { const t = await navigator.clipboard.readText(); const n = text.substring(0, start) + t + text.substring(end); updateText(n); setTimeout(() => el.setSelectionRange(start + t.length, start + t.length), 0); } break; }
      case 'SelectAll': el.setSelectionRange(0, text.length); break;
      case 'Left':   el.setSelectionRange(Math.max(0, start - 1), Math.max(0, start - 1)); break;
      case 'Right':  el.setSelectionRange(Math.min(text.length, start + 1), Math.min(text.length, start + 1)); break;
      case 'Up': { const ls = text.substring(0, start).split('\n'); if (ls.length > 1) { const p = start - ls[ls.length - 1].length - 1; el.setSelectionRange(p, p); } else el.setSelectionRange(0, 0); break; }
      case 'Down': { const la = text.substring(start).split('\n'); if (la.length > 1) { const p = start + la[0].length + 1; el.setSelectionRange(p, p); } else el.setSelectionRange(text.length, text.length); break; }
      case 'Top':    el.setSelectionRange(0, 0); break;
      case 'Bottom': el.setSelectionRange(text.length, text.length); break;
      case 'Undo':   undo(); break;
      case 'Redo':   redo(); break;
    }
    el.focus();
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    let drawingData = initialDrawing;
    if (isDrawing && canvasRef.current) {
      const paths = canvasRef.current.exportPaths();
      drawingData = JSON.stringify(paths);
    }
    try {
      await onSave(text, drawingData, localTitle);
      addToHistory(text, total, localTitle);
      // Clear draft after successful save
      try { localStorage.removeItem(`notecalc-draft-${noteId}`); } catch {}
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch {
      setIsSaving(false);
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'DRAW') setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const TABS = ['K1', 'K2', 'NAV', 'PRG', 'ABC', 'DRAW'];

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: theme.colors.calculatorBg }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0 z-10"
        style={{ backgroundColor: theme.colors.calculatorBg, borderColor: theme.colors.border }}
      >
        <div className="flex items-center flex-1 mr-2 min-w-0">
          <button onClick={onMenuClick} className="p-2 -ml-1 rounded-full shrink-0" style={{ color: theme.colors.text }}>
            <Menu size={22} />
          </button>
          <input
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            className="ml-1 w-full text-base font-medium bg-transparent border-none outline-none focus:bg-white/10 rounded px-1 py-0.5 transition-colors placeholder-gray-400 truncate"
            style={{ color: theme.colors.text }}
            placeholder="Note name…"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Zoom */}
          <button onClick={() => setFontSize(f => Math.max(11, f - 2))} className="p-1.5 rounded-lg active:opacity-70" style={{ color: theme.colors.textSecondary }} title="Zoom out (Ctrl+1)">
            <ZoomOut size={17} />
          </button>
          <button onClick={() => setFontSize(f => Math.min(22, f + 2))} className="p-1.5 rounded-lg active:opacity-70" style={{ color: theme.colors.textSecondary }} title="Zoom in (Ctrl+2)">
            <ZoomIn size={17} />
          </button>
          {/* Export */}
          <button onClick={() => setShowExport(true)} className="p-1.5 rounded-lg active:opacity-70" style={{ color: theme.colors.textSecondary }} title="Export">
            <Download size={17} />
          </button>
          {/* Settings */}
          <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-lg active:opacity-70" style={{ color: theme.colors.textSecondary }} title="Tape settings">
            <Settings2 size={17} />
          </button>
          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="relative flex items-center justify-center min-w-[68px] h-9 px-3 rounded-lg font-semibold text-sm transition-colors overflow-hidden"
            style={{
              backgroundColor: showSaved ? '#dcfce7' : `${theme.colors.primary}15`,
              color: showSaved ? '#15803d' : theme.colors.primary,
            }}
          >
            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Loader2 size={16} className="animate-spin" />
                </motion.div>
              ) : showSaved ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                  <Check size={15} /><span>Saved</span>
                </motion.div>
              ) : (
                <motion.span key="sv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Save</motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* ── Editor area ────────────────────────────────────────────────── */}
      <Editor
        ref={textareaRef}
        text={text}
        onTextChange={updateText}
        isDrawing={isDrawing}
        canvasRef={canvasRef}
        activeTab={activeTab}
        lineResults={lineResults}
        onEnter={() => handleKeyPress('↵')}
        theme={theme}
        fontSize={fontSize}
        currency={currency}
        inputMode={activeTab === 'ABC' ? 'text' : 'none'}
      />

      {/* ── Keyboard panel ─────────────────────────────────────────────── */}
      <div className="shrink-0" style={{ backgroundColor: theme.colors.keypadBg }}>
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b" style={{ backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }}>
          <div className="flex">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => handleTabClick(t)}
                className="px-3 py-2.5 text-xs font-bold tracking-wide transition-colors border-r"
                style={{
                  backgroundColor: activeTab === t ? theme.colors.keyOperator : 'transparent',
                  color: activeTab === t ? theme.colors.text : theme.colors.textSecondary,
                  borderColor: theme.colors.border,
                }}
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => setIsKeyboardVisible(v => !v)}
              className="px-3 py-2.5 flex items-center justify-center transition-colors border-r"
              style={{
                backgroundColor: !isKeyboardVisible ? `${theme.colors.primary}22` : 'transparent',
                color: !isKeyboardVisible ? theme.colors.primary : theme.colors.textSecondary,
                borderColor: theme.colors.border,
              }}
            >
              <Keyboard size={16} />
            </button>
          </div>

          {/* Total display */}
          <div className="flex items-center pr-3 gap-2">
            {memory !== 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold animate-pulse" style={{ backgroundColor: `${theme.colors.primary}25`, color: theme.colors.primary }}>M</span>
            )}
            {isDrawing && (
              <button onClick={() => canvasRef.current?.undo()} className="p-1.5 rounded transition-colors" style={{ color: theme.colors.textSecondary }}>
                <RotateCcw size={16} />
              </button>
            )}
            <span className="font-bold text-lg tracking-tight" style={{ color: theme.colors.text }}>
              {formatTotal(total, currency)}
            </span>
          </div>
        </div>

        {/* Keyboard body */}
        <AnimatePresence>
          {isKeyboardVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              {activeTab !== 'ABC' && activeTab !== 'DRAW' && (
                <VirtualKeyboard
                  activeTab={activeTab}
                  onKeyPress={handleKeyPress}
                  onNavAction={handleNavKeyPress}
                />
              )}

              {activeTab === 'ABC' && (
                <div className="py-10 flex flex-col items-center justify-center" style={{ color: theme.colors.textSecondary }}>
                  <Keyboard size={40} className="mb-3 opacity-20" />
                  <p className="text-sm">Use your device's keyboard to type</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showExport && (
        <ExportModal
          text={text}
          lineResults={lineResults}
          title={localTitle}
          total={total}
          onClose={() => setShowExport(false)}
          theme={theme}
        />
      )}

      {showSettings && (
        <SettingsPanel
          currency={currency}
          setCurrency={setCurrency}
          decimalPlaces={decimalPlaces}
          setDecimalPlaces={setDecimalPlaces}
          theme={theme}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};
