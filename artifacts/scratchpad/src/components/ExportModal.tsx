import { useState } from 'react';
import { X, Copy, Check, Printer } from 'lucide-react';
import { LineResult } from '../lib/math';

interface ExportModalProps {
  text: string;
  lineResults: LineResult[];
  title: string;
  total: number;
  onClose: () => void;
  theme: any;
}

function buildTapeText(text: string, lineResults: LineResult[], title: string, total: number): string {
  const lines = text.split('\n');
  const maxLen = Math.max(...lines.map((l) => l.length), 20);
  const padTo  = Math.min(maxLen + 4, 40);

  const rows = lines
    .map((line, i) => {
      const res = lineResults[i];
      if (!res || res.formattedResult === null) return line;
      const right = res.formattedResult;
      const padded = line.padEnd(padTo, ' ');
      return `${padded}${right}`;
    })
    .join('\n');

  const divider = '─'.repeat(padTo + 12);
  const totalLabel = `TOTAL: ${total.toFixed(2)}`;

  return `${title}\n${divider}\n${rows}\n${divider}\n${' '.repeat(padTo)}${totalLabel}\n`;
}

export function ExportModal({ text, lineResults, title, total, onClose, theme }: ExportModalProps) {
  const [copied, setCopied] = useState(false);
  const tapeText = buildTapeText(text, lineResults, title, total);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tapeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 13px; padding: 24px; white-space: pre; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${tapeText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl p-5 pb-10 flex flex-col"
        style={{ backgroundColor: theme.colors.surface, maxHeight: '75vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base" style={{ color: theme.colors.text }}>
            Export Tape
          </h3>
          <button onClick={onClose} style={{ color: theme.colors.textSecondary }}>
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <pre
          className="flex-1 overflow-auto rounded-xl p-4 text-xs leading-relaxed mb-4"
          style={{
            backgroundColor: theme.colors.keypadBg,
            color: theme.colors.text,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {tapeText}
        </pre>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors"
            style={{
              backgroundColor: copied ? theme.colors.accent : theme.colors.keyOperator,
              color: theme.colors.text,
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
