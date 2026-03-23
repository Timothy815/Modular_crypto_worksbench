import { describe, expect, it } from 'vitest';

import { analyzeSymbolSignal } from './cryptanalysis';

describe('analyzeSymbolSignal', () => {
  it('returns null for non-symbol signals', () => {
    expect(analyzeSymbolSignal(null)).toBeNull();
    expect(analyzeSymbolSignal({ type: 'bits', value: [1, 0, 1, 1] })).toBeNull();
  });

  it('counts letters and computes index of coincidence for symbol text', () => {
    const analysis = analyzeSymbolSignal({ type: 'symbol', value: 'BANANA!' });
    if (!analysis) {
      throw new Error('Expected symbol analysis.');
    }

    expect(analysis.symbolCount).toBe(7);
    expect(analysis.letterCount).toBe(6);
    expect(analysis.uniqueLetterCount).toBe(3);
    expect(analysis.topLetters).toEqual([
      { letter: 'A', count: 3, share: 0.5 },
      { letter: 'N', count: 2, share: 2 / 6 },
      { letter: 'B', count: 1, share: 1 / 6 },
    ]);
    expect(analysis.indexOfCoincidence).toBeCloseTo(4 / 15, 6);
  });

  it('normalizes lowercase text and ignores non-letters', () => {
    const analysis = analyzeSymbolSignal({ type: 'symbol', value: 'A B-c' });
    if (!analysis) {
      throw new Error('Expected symbol analysis.');
    }

    expect(analysis.normalizedText).toBe('ABC');
    expect(analysis.letterCount).toBe(3);
    expect(analysis.indexOfCoincidence).toBe(0);
  });
});
