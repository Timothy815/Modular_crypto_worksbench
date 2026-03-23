import type { Signal } from '../engine/types';

export interface LetterFrequencyEntry {
  letter: string;
  count: number;
  share: number;
}

export interface SymbolTextAnalysis {
  sourceText: string;
  normalizedText: string;
  symbolCount: number;
  letterCount: number;
  uniqueLetterCount: number;
  indexOfCoincidence: number | null;
  topLetters: LetterFrequencyEntry[];
}

export function analyzeSymbolSignal(signal: Signal | null): SymbolTextAnalysis | null {
  if (!signal || signal.type !== 'symbol') {
    return null;
  }

  const sourceText = signal.value;
  const normalizedText = sourceText.toUpperCase().replace(/[^A-Z]/g, '');
  const symbolCount = sourceText.length;
  const letterCount = normalizedText.length;

  const counts = new Map<string, number>();
  for (const letter of normalizedText) {
    counts.set(letter, (counts.get(letter) ?? 0) + 1);
  }

  const topLetters = [...counts.entries()]
    .sort((left, right) => {
      if (right[1] === left[1]) {
        return left[0].localeCompare(right[0]);
      }
      return right[1] - left[1];
    })
    .slice(0, 5)
    .map(([letter, count]) => ({
      letter,
      count,
      share: letterCount > 0 ? count / letterCount : 0,
    }));

  return {
    sourceText,
    normalizedText,
    symbolCount,
    letterCount,
    uniqueLetterCount: counts.size,
    indexOfCoincidence: calculateIndexOfCoincidence([...counts.values()], letterCount),
    topLetters,
  };
}

function calculateIndexOfCoincidence(counts: number[], totalLetters: number) {
  if (totalLetters < 2) {
    return null;
  }

  const numerator = counts.reduce((sum, count) => sum + count * (count - 1), 0);
  const denominator = totalLetters * (totalLetters - 1);
  return denominator === 0 ? null : numerator / denominator;
}
