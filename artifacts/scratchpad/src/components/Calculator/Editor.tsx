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

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(
  ({ text, onTextChange, isDrawing, canvasRef, activeTab, lineResults, onEnter, theme, fontSize = 15, currency = 'JPY', inputMode = 'none' }, ref) => {
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

    return (
      <div
        className="relative flex-1 overflow-hidden"
        style={{ backgroundColor: theme.colors.calculatorBg }}
      >
        {!isDrawing ? (
          <>
            {/* ── Overlay: line results aligned to the right ── */}
            <div
              ref={overlayRef}
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                padding: '16px 8px 16px 16px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize,
                lineHeight: `${lineHeight}px`,
              }}
              aria-hidden="true"
            >
              {lineResults.map((res, i) => {
                const isLast = i === lineResults.length - 1;
                return (
                  <div
                    key={i}
                    style={{
                      height: lineHeight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 4,
                      borderBottom: res.type === 'separator' || (!isLast && res.type === 'separator')
                        ? `1px solid ${theme.colors.border}`
                        : 'none',
                    }}
                  >
                    {res.formattedResult !== null && (
                      <span
                        style={{
                          color: getResultColor(res.type, theme),
                          fontSize: res.type === 'separator' ? fontSize + 1 : fontSize - 1,
                          fontWeight: res.type === 'separator' || res.type === 'variable' ? 700 : 400,
                          letterSpacing: 0.3,
                          opacity: 0.85,
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
                          : res.type === 'separator'
                          ? `${currSymbol}${res.formattedResult}`
                          : `${currSymbol}${res.formattedResult}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Textarea (input layer) ── */}
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              className="absolute inset-0 w-full h-full resize-none outline-none bg-transparent"
              style={{
                padding: '16px 120px 16px 16px',
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
