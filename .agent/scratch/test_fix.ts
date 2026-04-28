
import { evaluateNotes } from './src/lib/math.ts';

function simulateEnter(text, cursorPosition) {
  const { formattedText } = evaluateNotes(text);
  
  const textBeforeCursor = text.substring(0, cursorPosition);
  const { formattedText: formattedBefore } = evaluateNotes(textBeforeCursor);
  
  const newStart = formattedBefore.length;
  const newEnd = newStart + (cursorPosition - cursorPosition); // simplify for test
  
  const newText = formattedText.substring(0, newStart) + '\n' + formattedText.substring(newStart);
  return newText;
}

const testCases = [
  { input: '100000', pos: 6, expected: '100,000\n' },
  { input: '+1000000', pos: 8, expected: '+ 1,000,000\n' },
  { input: '-50000000', pos: 9, expected: '- 50,000,000\n' }
];

testCases.forEach(({ input, pos, expected }) => {
  const result = simulateEnter(input, pos);
  console.log(`Input: "${input}" at pos ${pos}`);
  console.log(`Result: "${result.replace('\n', '\\n')}"`);
  console.log(`Status: ${result === expected ? '✅ PASS' : '❌ FAIL'}`);
  console.log('---');
});
