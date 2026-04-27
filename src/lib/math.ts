export function evaluateNotes(text: string): { total: number, formattedText: string } {
  // A simple block evaluator
  const lines = text.split('\n');
  let runningTotal = 0;
  let blockTotal = 0;
  // This is a naive implementation.
  // Instead of re-writing the text (which messes with cursor), just calculate the total
  
  lines.forEach(line => {
    const match = line.trim().match(/^([+\-]?)\s*([\d,]+(?:\.\d+)?)\s*(%?)\s*(.*)$/);
    if (match) {
      const signStr = match[1];
      const numStr = match[2].replace(/,/g, '');
      const isPercentage = match[3] === '%';
      let num = parseFloat(numStr);
      if (!isNaN(num)) {
        if (isPercentage) {
            num = Math.abs(runningTotal) * (num / 100);
        }
        if (signStr === '-') {
           blockTotal -= num;
           runningTotal -= num;
        } else {
           blockTotal += num;
           runningTotal += num;
        }
      }
    }
  });

  return { total: runningTotal, formattedText: text };
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}
