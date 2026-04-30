export interface LineResult {
  value: number | null;
  type: 'number' | 'percentage' | 'subtotal' | 'total' | 'none';
  originalValue?: number;
}

// Factorial helper
function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= Math.trunc(n); i++) result *= i;
  return result;
}

// Evaluate scientific expressions in a string
// Supports: sin(), cos(), tan(), ln(), log(), √(), ^, !, π, e
export function evaluateScientific(expr: string, isDeg = true): number | null {
  try {
    let s = expr.trim();
    
    // Replace constants
    s = s.replace(/π/g, String(Math.PI));
    s = s.replace(/(?<![a-zA-Z])e(?![a-zA-Z(])/g, String(Math.E));
    
    // Replace factorial: number!
    s = s.replace(/([\d.]+)!/g, (_, n) => String(factorial(parseFloat(n))));
    
    // Replace functions (innermost first via loop)
    let maxIter = 20;
    while (/(?:sin|cos|tan|ln|log|√)\(/.test(s) && maxIter-- > 0) {
      // Match function(number) — innermost only
      s = s.replace(/sin\(([^()]+)\)/g, (_, inner) => {
        const v = parseFloat(inner);
        return String(Math.sin(isDeg ? v * Math.PI / 180 : v));
      });
      s = s.replace(/cos\(([^()]+)\)/g, (_, inner) => {
        const v = parseFloat(inner);
        return String(Math.cos(isDeg ? v * Math.PI / 180 : v));
      });
      s = s.replace(/tan\(([^()]+)\)/g, (_, inner) => {
        const v = parseFloat(inner);
        return String(Math.tan(isDeg ? v * Math.PI / 180 : v));
      });
      s = s.replace(/ln\(([^()]+)\)/g, (_, inner) => String(Math.log(parseFloat(inner))));
      s = s.replace(/log\(([^()]+)\)/g, (_, inner) => String(Math.log10(parseFloat(inner))));
      s = s.replace(/√\(([^()]+)\)/g, (_, inner) => String(Math.sqrt(parseFloat(inner))));
    }
    
    // Replace power: a^b
    s = s.replace(/([\d.]+)\^([\d.]+)/g, (_, base, exp) => String(Math.pow(parseFloat(base), parseFloat(exp))));
    
    // Replace E notation: aEb → a * 10^b
    s = s.replace(/([\d.]+)E([\d.+-]+)/g, (_, a, b) => String(parseFloat(a) * Math.pow(10, parseFloat(b))));
    
    // Evaluate remaining simple parentheses
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


export function evaluateNotes(text: string): { total: number, currentBlockTotal: number, formattedText: string, lineResults: LineResult[] } {
  const lines = text.split('\n');
  let runningTotal = 0;
  let blockTotal = 0;
  let grandTotal = 0;
  const lineResults: LineResult[] = [];
  
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();

    // Separator line: ---
    if (/^[-]{3,}/.test(trimmed)) {
      lineResults.push({ value: blockTotal, type: 'subtotal' });
      blockTotal = 0;
      return line;
    }

    // Result line (= ¥...) — reset block accumulators so next block starts fresh
    if (/^=/.test(trimmed)) {
      grandTotal += runningTotal;
      runningTotal = 0;
      blockTotal = 0;
      lineResults.push({ value: null, type: 'none' });
      return line;
    }

    // Match: sign (optional), space (optional), number, percentage (optional), comment (optional)
    const match = line.match(/^([+\-*/x÷]?)\s*([\d,]+(?:\.\d+)?)\s*(%?)\s*(.*)$/);
    
    if (match) {
      const signStr = match[1];
      const numStr = match[2].replace(/,/g, '');
      const isPercentage = match[3] === '%';
      const comment = match[4] || '';
      
      let num = parseFloat(numStr);
      if (!isNaN(num)) {
        let lineVal = num;
        let resultType: LineResult['type'] = isPercentage ? 'percentage' : 'number';
        let displayVal = num;

        if (isPercentage) {
          displayVal = Math.abs(runningTotal) * (num / 100);
          lineVal = displayVal;
        }
        
        if (signStr === '-') {
          runningTotal -= lineVal;
          blockTotal -= lineVal;
          displayVal = -displayVal;
        } else if (signStr === 'x' || signStr === '*') {
          runningTotal *= lineVal;
          blockTotal = runningTotal;
          displayVal = runningTotal;
        } else if (signStr === '÷' || signStr === '/') {
          if (lineVal !== 0) {
            runningTotal /= lineVal;
            blockTotal = runningTotal;
          }
          displayVal = runningTotal;
        } else {
          runningTotal += lineVal;
          blockTotal += lineVal;
        }

        lineResults.push({ value: displayVal, type: resultType, originalValue: num });
        const signPart = signStr ? `${signStr} ` : '';
        
        // Format the number part with commas for the editor text
        const formattedNum = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 20
        }).format(num);

        return `${signPart}${formattedNum}${match[3]} ${comment}`.trimEnd();
      }
    }
    lineResults.push({ value: null, type: 'none' });
    return line;
  });

  return { 
    total: grandTotal + runningTotal, 
    currentBlockTotal: runningTotal,
    formattedText: formattedLines.join('\n'), 
    lineResults 
  };
}





export function formatNumber(num: number): string {
  // International pattern with Yen symbol and truncation (no decimals)
  const formatted = new Intl.NumberFormat('ja-JP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.trunc(num));
  
  return `￥${formatted}`;
}

export function formatLineResult(num: number): string {
  // Line results in the screenshot show decimals and no symbol
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}






