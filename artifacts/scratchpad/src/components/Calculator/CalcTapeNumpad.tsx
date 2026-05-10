import { useTheme } from '../../contexts/ThemeContext';

interface CalcTapeNumpadProps {
  onKeyPress: (val: string) => void;
  onNavAction: (action: string) => void;
  total: number;
  memory: number;
  currency: string;
  formatTotalFn: (n: number, currency: string) => string;
}

interface NKey {
  label: string;
  action?: string;
  rowSpan?: number;
  colSpan?: number;
  variant: 'number' | 'operator' | 'ac' | 'del' | 'eq' | 'memory' | 'tax';
  display?: React.ReactNode;
}

const BACKSPACE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/>
    <line x1="18" x2="12" y1="9" y2="15"/><line x1="12" x2="18" y1="9" y2="15"/>
  </svg>
);

export const CalcTapeNumpad = ({
  onKeyPress, onNavAction, total, memory, currency, formatTotalFn,
}: CalcTapeNumpadProps) => {
  const { theme } = useTheme();

  const keyStyle = (variant: NKey['variant']) => {
    switch (variant) {
      case 'ac':
        return { backgroundColor: '#cb7145', color: '#ffffff' };
      case 'del':
        return { backgroundColor: theme.colors.keyOperator, color: theme.colors.text };
      case 'operator':
        return { backgroundColor: theme.colors.keyOperator, color: theme.colors.text };
      case 'eq':
        return { backgroundColor: '#cb7145', color: '#ffffff' };
      case 'memory':
        return { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.primary, border: `1px solid ${theme.colors.border}` };
      case 'tax':
        return { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.accent };
      default:
        return { backgroundColor: theme.colors.keyDefault, color: theme.colors.text };
    }
  };

  const btn = (
    key: string,
    variant: NKey['variant'],
    display?: React.ReactNode,
    rowSpan = 1,
    colSpan = 1,
    action?: string,
  ) => {
    const style = keyStyle(variant);
    return (
      <button
        key={key}
        onPointerDown={(e) => {
          e.preventDefault();
          if (action) onNavAction(action);
          else onKeyPress(key);
        }}
        className="flex items-center justify-center font-semibold text-sm select-none
          border-r border-b active:opacity-60 transition-opacity"
        style={{
          ...style,
          borderColor: theme.colors.border,
          gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
          gridColumn: colSpan > 1 ? `span ${colSpan}` : undefined,
          fontSize: '0.95rem',
        }}
      >
        {display ?? key}
      </button>
    );
  };

  const resultColor = total < 0 ? '#e53e3e' : theme.colors.text;

  return (
    <div
      className="flex flex-col shrink-0 border-l"
      style={{
        width: 188,
        backgroundColor: theme.colors.keypadBg,
        borderColor: theme.colors.border,
      }}
    >
      {/* Result header */}
      <div
        className="px-3 py-2 border-b flex items-center justify-between shrink-0"
        style={{ backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }}
      >
        <span className="text-xs font-semibold" style={{ color: theme.colors.textSecondary }}>
          Result:
        </span>
        <span className="font-bold text-sm tabular-nums truncate ml-2" style={{ color: resultColor }}>
          {formatTotalFn(total, currency)}
        </span>
      </div>

      {/* Numpad grid — 4 columns */}
      <div
        className="grid flex-1"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridAutoRows: '1fr',
        }}
      >
        {btn('AC',   'ac',       undefined, 1, 1)}
        {btn('DEL',  'del',      BACKSPACE_ICON, 1, 1)}
        {btn('÷',    'operator', undefined, 1, 1)}
        {btn('x',    'operator', '×', 1, 1)}

        {btn('7',    'number',   undefined, 1, 1)}
        {btn('8',    'number',   undefined, 1, 1)}
        {btn('9',    'number',   undefined, 1, 1)}
        {btn('-',    'operator', undefined, 1, 1)}

        {btn('4',    'number',   undefined, 1, 1)}
        {btn('5',    'number',   undefined, 1, 1)}
        {btn('6',    'number',   undefined, 1, 1)}
        {btn('+',    'operator', undefined, 1, 1)}

        {btn('1',    'number',   undefined, 1, 1)}
        {btn('2',    'number',   undefined, 1, 1)}
        {btn('3',    'number',   undefined, 1, 1)}
        {/* = spans 2 rows */}
        {btn('=',    'eq',       undefined, 2, 1)}

        {btn('0',    'number',   undefined, 1, 1)}
        {btn('.',    'number',   undefined, 1, 1)}
        {btn('%',    'operator', undefined, 1, 1)}

        {btn('M+',   'memory',   <span className="text-xs">M+<br/><span style={{fontSize:'0.6rem',opacity:0.6}}>+0,00</span></span>, 1, 1)}
        {btn('M-',   'memory',   <span className="text-xs">M-<br/><span style={{fontSize:'0.6rem',opacity:0.6}}>+0,00</span></span>, 1, 1)}
        {btn('MR',   'memory',   <span className="text-xs font-bold">MR<br/><span style={{fontSize:'0.6rem',opacity:0.6}}>0,00</span></span>, 1, 1)}
        {btn('MC',   'memory',   'MC', 1, 1)}

        {btn('+TAX', 'tax',      '+TAX', 1, 2)}
        {btn('-TAX', 'tax',      '-TAX', 1, 2)}
      </div>
    </div>
  );
};
