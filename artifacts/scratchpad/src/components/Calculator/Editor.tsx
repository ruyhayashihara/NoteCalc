import { forwardRef, useEffect, useRef } from 'react';
import { LineResult } from '../../lib/math';
import { DrawingCanvas, DrawingCanvasHandle } from './DrawingCanvas';

const CURRENCY_SYMBOLS: Record<string, string> = {
  none: '',
  USD: '$',
  BRL: 'R$',
  EUR: '€',
  JPY: '¥',
};

interface EditorProps {
  text: string;
  onTextChange: (text: string) => void;
  isDrawing: boolean;
  canvasRef: React.RefObject<any>;
  activeTab: string;
  lineResults: LineResult[];
  onEnter: () => void;
  onCursorMove?: () => void;
  theme: any;
  fontSize?: number;
  currency?: string;
  inputMode?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
}

// ─── Result badge colours per type ───────────────────────────────────────────

function getResultColor(type: LineResult['type'], theme: any): string {
  switch (type) {
    case 'separator': return theme.colors.primary;
    case 'variable':  return theme.colors.accent;
    case 'number':
    case 'percentage': return theme.colors.textSecondary;
    default:          return theme.colors.textSecondary;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

// ─── Operator glyph for CalcTape left column ─────────────────────────────────
function getOperatorGlyph(formattedLine: string): string {
  const trimmed = formattedLine.trimStart();
  if (/^---/.test(trimmed) || /^===/.test(trimmed)) return '=';
  const ch = trimmed[0];
  if (ch === '-') return '-';
  if (ch === 'x' || ch === '*' || ch === '÷' || ch === '/') return ch;
  return '+';
}

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(
  ({ text, onTextChange, isDrawing, canvasRef, activeTab, lineResults, onEnter, onCursorMove, theme, fontSize = 15, currency = 'JPY', inputMode = 'none' }, ref) => {
    const currSymbol = CURRENCY_SYMBOLS[currency] ?? '';
    const overlayRef = useRef<HTMLDivElement>(null);

    // Sync vertical scroll between textarea and overlay
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      if (overlayRef.current) {
        overlayRef.current.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
      }
    };

    useEffect(() => {
      if (isDrawing && canvasRef.current && activeTab === 'DRAW') {
        canvasRef.current.init?.();
      }
    }, [isDrawing, canvasRef, activeTab]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onEnter();
      }
    };

    const lineHeight = Math.round(fontSize * 1.75);

    const OP_COL_WIDTH = 22;

    return (
      <div
        className="relative flex-1 overflow-hidden"
        style={{ backgroundColor: theme.colors.calculatorBg }}
      >
        {!isDrawing ? (
          <>
            {/* ── Left operator column (CalcTape style) ── */}
            <div
              className="absolute top-0 left-0 bottom-0 pointer-events-none overflow-hidden"
              style={{
                width: OP_COL_WIDTH,
                paddingTop: 16,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize,
                lineHeight: `${lineHeight}px`,
                backgroundColor: `${theme.colors.border}30`,
                borderRight: `1px solid ${theme.colors.border}`,
              }}
              aria-hidden="true"
            >
              {lineResults.map((res, i) => {
                const hasValue = res.type === 'number' || res.type === 'percentage' || res.type === 'separator';
                const glyph = hasValue ? getOperatorGlyph(res.formattedLine) : '';
                const glyphColor = glyph === '-' ? '#e53e3e' : glyph === '=' ? theme.colors.primary : theme.colors.textSecondary;
                return (
                  <div
                    key={i}
                    style={{
                      height: lineHeight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: glyphColor,
                      fontWeight: 600,
                      fontSize: fontSize - 2,
                    }}
                  >
                    {glyph}
                  </div>
                );
              })}
            </div>

            {/* ── Right overlay: result values ── */}
            <div
              ref={overlayRef}
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                paddingTop: 16,
                paddingBottom: 16,
                paddingLeft: OP_COL_WIDTH + 8,
                paddingRight: 8,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize,
                lineHeight: `${lineHeight}px`,
              }}
              aria-hidden="true"
            >
              {lineResults.map((res, i) => (
                <div
                  key={i}
                  style={{
                    height: lineHeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: 4,
                    borderBottom: res.type === 'separator' ? `1px solid ${theme.colors.border}` : 'none',
                  }}
                >
                  {res.formattedResult !== null && (
                    <span
                      style={{
                        color: (res.value ?? 0) < 0 ? '#e53e3e' : getResultColor(res.type, theme),
                        fontSize: res.type === 'separator' ? fontSize + 1 : fontSize - 1,
                        fontWeight: res.type === 'separator' || res.type === 'variable' ? 700 : 400,
                        letterSpacing: 0.3,
                        opacity: 0.9,
                        background: res.type === 'variable'
                          ? `${theme.colors.accent}18`
                          : res.type === 'separator'
                          ? `${theme.colors.primary}12`
                          : 'transparent',
                        borderRadius: 4,
                        padding: res.type === 'variable' || res.type === 'separator' ? '0 6px' : 0,
                      }}
                    >
                      {res.type === 'variable' && res.variableName
                        ? `${res.variableName} = ${currSymbol}${res.formattedResult}`
                        : `${currSymbol}${res.formattedResult}`}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* ── Textarea (input layer) ── */}
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              onKeyUp={onCursorMove}
              onClick={onCursorMove}
              className="absolute inset-0 w-full h-full resize-none outline-none bg-transparent"
              style={{
                paddingTop: 16,
                paddingBottom: 16,
                paddingLeft: OP_COL_WIDTH + 8,
                paddingRight: 120,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize,
                lineHeight: `${lineHeight}px`,
                color: theme.colors.text,
                caretColor: theme.colors.primary,
              }}
              spellCheck={false}
              inputMode={inputMode}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
          </>
        ) : (
          <DrawingCanvas ref={canvasRef as React.RefObject<DrawingCanvasHandle>} theme={theme} />
        )}
      </div>
    );
  }
);

Editor.displayName = 'Editor';
