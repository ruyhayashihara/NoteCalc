// ─── Types ──────────────────────────────────────────────────────────────────

export interface LineResult {
  value: number | null;
  type: 'number' | 'percentage' | 'subtotal' | 'total' | 'variable' | 'comment' | 'separator' | 'none';
  formattedResult: string | null;
  formattedLine: string;
  isError: boolean;
  variableName?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SEPARATOR_RE = /^[-=]{3,}/;
const VARIABLE_DEF_RE = /^([A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_ ]*?)\s*=\s*(.+)$/;
const NUMBER_LINE_RE = /^([+\-*/x÷]?)\s*([\d,]+(?:\.\d+)?)\s*(%?)\s*(.*)$/;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= Math.trunc(n); i++) result *= i;
  return result;
}

function withCommas(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
  }).format(num);
}

// ─── Scientific Expression Evaluator ─────────────────────────────────────────

export function evaluateScientific(expr: string, isDeg = true): number | null {
  try {
    let s = expr.trim();

    // Replace constants
    s = s.replace(/π/g, String(Math.PI));
    s = s.replace(/(?<![a-zA-Z])e(?![a-zA-Z(])/g, String(Math.E));

    // Replace factorial
    s = s.replace(/([\d.]+)!/g, (_, n) => String(factorial(parseFloat(n))));

    // Replace functions (innermost first)
    let maxIter = 20;
    while (/(?:sin|cos|tan|ln|log|√)\(/.test(s) && maxIter-- > 0) {
      s = s.replace(/sin\(([^()]+)\)/g, (_, inner) => {
        const v = parseFloat(inner);
        return String(Math.sin(isDeg ? (v * Math.PI) / 180 : v));
      });
      s = s.replace(/cos\(([^()]+)\)/g, (_, inner) => {
        const v = parseFloat(inner);
        return String(Math.cos(isDeg ? (v * Math.PI) / 180 : v));
      });
      s = s.replace(/tan\(([^()]+)\)/g, (_, inner) => {
        const v = parseFloat(inner);
        return String(Math.tan(isDeg ? (v * Math.PI) / 180 : v));
      });
      s = s.replace(/ln\(([^()]+)\)/g, (_, inner) => String(Math.log(parseFloat(inner))));
      s = s.replace(/log\(([^()]+)\)/g, (_, inner) => String(Math.log10(parseFloat(inner))));
      s = s.replace(/√\(([^()]+)\)/g, (_, inner) => String(Math.sqrt(parseFloat(inner))));
    }

    // Power
    s = s.replace(/([\d.]+)\^([\d.]+)/g, (_, base, exp) =>
      String(Math.pow(parseFloat(base), parseFloat(exp)))
    );

    // E notation
    s = s.replace(/([\d.]+)E([\d.+-]+)/g, (_, a, b) =>
      String(parseFloat(a) * Math.pow(10, parseFloat(b)))
    );

    // Evaluate remaining simple parens
    while (/\([^()]+\)/.test(s) && maxIter-- > 0) {
      s = s.replace(/\(([^()]+)\)/, (_, inner) => {
        const val = parseFloat(inner);
        return isNaN(val) ? inner : String(val);
      });
    }

    const result = parseFloat(s);
    return isNaN(result) ? null : result;
  } catch {
    return null;
  }
}

// ─── Variable Resolver ────────────────────────────────────────────────────────

function resolveVariables(expr: string, vars: Map<string, number>): string {
  // Sort by length descending to avoid partial replacements
  const sorted = [...vars.keys()].sort((a, b) => b.length - a.length);
  let result = expr;
  for (const name of sorted) {
    // Escape special regex chars in variable name
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), String(vars.get(name)!));
  }
  return result;
}

// ─── Format Helpers ───────────────────────────────────────────────────────────

export function formatNumber(num: number, decimalPlaces = 2, currency = 'none'): string {
  const isJPY = currency === 'JPY';
  const effectiveDecimals = isJPY ? 0 : decimalPlaces;
  const val = isJPY ? Math.trunc(num) : num;

  return new Intl.NumberFormat(isJPY ? 'ja-JP' : 'en-US', {
    minimumFractionDigits: effectiveDecimals,
    maximumFractionDigits: effectiveDecimals,
  }).format(val);
}

export function formatTotal(num: number, currency = 'none'): string {
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (currency === 'JPY') {
    return `${sign}¥${formatNumber(abs, 0, 'JPY')}`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);

  switch (currency) {
    case 'BRL': return `${sign}R$ ${formatted}`;
    case 'USD': return `${sign}$${formatted}`;
    case 'EUR': return `${sign}€${formatted}`;
    default:    return `${sign}${formatted}`;
  }
}

// Kept for legacy compatibility
export function formatLineResult(num: number): string {
  return formatNumber(num, 2);
}

// ─── Main Evaluator ───────────────────────────────────────────────────────────

export function evaluateNotes(
  text: string,
  isDeg = true,
  currency = 'none',
  decimalPlaces = 2,
): {
  total: number;
  currentBlockTotal: number;
  lineResults: LineResult[];
} {
  const lines = text.split('\n');
  let runningTotal = 0;
  let grandTotal = 0;
  const variables = new Map<string, number>();
  const lineResults: LineResult[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // ── Empty line ──
    if (!trimmed) {
      lineResults.push({ value: null, type: 'none', formattedResult: null, formattedLine: rawLine, isError: false });
      continue;
    }

    // ── Separator (--- or ===) — show subtotal, but keep runningTotal intact ──
    // The = line is what actually stamps and resets the block.
    if (SEPARATOR_RE.test(trimmed)) {
      const sub = runningTotal;
      lineResults.push({
        value: sub,
        type: 'separator',
        formattedResult: formatNumber(sub, decimalPlaces, currency),
        formattedLine: rawLine,
        isError: false,
      });
      // Do NOT reset runningTotal here — only the = line does that
      continue;
    }

    // ── Result line (= ...) — stamp to grand total and reset block ──
    if (/^=/.test(trimmed)) {
      grandTotal += runningTotal;
      runningTotal = 0;
      lineResults.push({ value: null, type: 'none', formattedResult: null, formattedLine: rawLine, isError: false });
      continue;
    }

    // ── Variable definition: Name = expression ──
    const varMatch = trimmed.match(VARIABLE_DEF_RE);
    if (varMatch) {
      const varName = varMatch[1].trim();
      const exprRaw = varMatch[2].trim();

      // Don't treat lines starting with sign+number as variable defs
      const isNumericOp = /^[+\-*/x÷]\s*[\d,]/.test(trimmed);
      if (!isNumericOp) {
        const exprResolved = resolveVariables(exprRaw, variables);
        const numVal = evaluateScientific(exprResolved, isDeg);

        if (numVal !== null) {
          variables.set(varName.toLowerCase(), numVal);
          lineResults.push({
            value: numVal,
            type: 'variable',
            formattedResult: formatNumber(numVal, decimalPlaces, currency),
            formattedLine: rawLine,
            isError: false,
            variableName: varName,
          });
          continue;
        }
      }
    }

    // ── Numeric line (with optional operator, percentage, comment) ──
    const numMatch = trimmed.match(NUMBER_LINE_RE);
    if (numMatch) {
      const signStr  = numMatch[1] || '';
      const numStr   = numMatch[2].replace(/,/g, '');
      const isPct    = numMatch[3] === '%';
      const comment  = numMatch[4]?.trim() || '';

      let num = parseFloat(numStr);
      if (!isNaN(num)) {
        let lineVal    = num;
        let displayVal = num;
        const type: LineResult['type'] = isPct ? 'percentage' : 'number';

        if (isPct) {
          displayVal = Math.abs(runningTotal) * (num / 100);
          lineVal    = displayVal;
        }

        if (signStr === '-') {
          runningTotal -= lineVal;
          displayVal    = -displayVal;
        } else if (signStr === 'x' || signStr === '*') {
          runningTotal  *= lineVal;
          displayVal     = runningTotal;
        } else if (signStr === '÷' || signStr === '/') {
          if (lineVal !== 0) runningTotal /= lineVal;
          displayVal = runningTotal;
        } else {
          runningTotal += lineVal;
        }

        // Format number part with commas for display
        const formattedNum = withCommas(num);
        const signPart  = signStr ? `${signStr} ` : '';
        const pctPart   = isPct ? '%' : '';
        const commentPart = comment ? ` ${comment}` : '';
        const formattedLine = `${signPart}${formattedNum}${pctPart}${commentPart}`;

        lineResults.push({
          value: displayVal,
          type,
          formattedResult: formatNumber(displayVal, decimalPlaces, currency),
          formattedLine,
          isError: false,
        });
        continue;
      }
    }

    // ── Variable reference or scientific expression ──
    const resolved = resolveVariables(trimmed, variables);
    const sciVal   = evaluateScientific(resolved, isDeg);
    if (sciVal !== null) {
      runningTotal += sciVal;
      lineResults.push({
        value: sciVal,
        type: 'number',
        formattedResult: formatNumber(sciVal, decimalPlaces, currency),
        formattedLine: rawLine,
        isError: false,
      });
      continue;
    }

    // ── Pure comment / unrecognised ──
    lineResults.push({
      value: null,
      type: 'comment',
      formattedResult: null,
      formattedLine: rawLine,
      isError: false,
    });
  }

  return {
    total: grandTotal + runningTotal,
    currentBlockTotal: runningTotal,
    lineResults,
  };
}
