export interface LineResult {
  value: number | null;
  type: 'number' | 'percentage' | 'subtotal' | 'total' | 'none';
  originalValue?: number;
}

export function evaluateNotes(text: string): { total: number, formattedText: string, lineResults: LineResult[] } {
  const lines = text.split('\n');
  let runningTotal = 0;
  let blockTotal = 0;
  const lineResults: LineResult[] = [];
  
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();

    // Separator line: ---, ===, etc.
    if (/^[-]{3,}/.test(trimmed)) {
      lineResults.push({ value: blockTotal, type: 'subtotal' });
      blockTotal = 0;
      return line;
    }

    // Result line (= ¥...) — reset accumulators so next block starts fresh
    if (/^=/.test(trimmed)) {
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

  return { total: runningTotal, formattedText: formattedLines.join('\n'), lineResults };
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






