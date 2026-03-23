import { describe, expect, it } from 'vitest';

import {
  analyzeSymbolSignal,
  analyzeVigenereColumns,
  reconstructVigenereCandidate,
} from './cryptanalysis';

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
    expect(analysis.topBigrams).toEqual([
      { gram: 'AN', count: 2, share: 2 / 5 },
      { gram: 'NA', count: 2, share: 2 / 5 },
      { gram: 'BA', count: 1, share: 1 / 5 },
    ]);
    expect(analysis.topTrigrams).toEqual([
      { gram: 'ANA', count: 2, share: 2 / 4 },
      { gram: 'BAN', count: 1, share: 1 / 4 },
      { gram: 'NAN', count: 1, share: 1 / 4 },
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
    expect(analysis.topBigrams).toEqual([
      { gram: 'AB', count: 1, share: 0.5 },
      { gram: 'BC', count: 1, share: 0.5 },
    ]);
    expect(analysis.topTrigrams).toEqual([
      { gram: 'ABC', count: 1, share: 1 },
    ]);
  });

  it('finds repeated fragments and candidate periods for polyalphabetic-style text', () => {
    const analysis = analyzeSymbolSignal({
      type: 'symbol',
      value: 'ABCXYZABCXYZABCXYZ',
    });
    if (!analysis) {
      throw new Error('Expected symbol analysis.');
    }

    expect(analysis.repeatedFragments[0]).toEqual({
      fragment: 'ABCXY',
      positions: [0, 6, 12],
      distances: [6, 6],
    });
    expect(analysis.candidatePeriods[0]?.period).toBe(6);
    expect(analysis.candidatePeriods[0]?.supportingDistanceCount).toBeGreaterThan(0);
    expect(analysis.candidatePeriods.some((entry) => entry.period === 3)).toBe(true);
  });
});

describe('analyzeVigenereColumns', () => {
  it('splits text into period-based columns with local IOC and frequencies', () => {
    const columns = analyzeVigenereColumns('ABCABCABC', 3);

    expect(columns).toHaveLength(3);
    expect(columns[0]).toMatchObject({
      columnIndex: 0,
      text: 'AAA',
      letterCount: 3,
      topLetters: [{ letter: 'A', count: 3, share: 1 }],
    });
    expect(columns[1]).toMatchObject({
      columnIndex: 1,
      text: 'BBB',
      letterCount: 3,
      topLetters: [{ letter: 'B', count: 3, share: 1 }],
    });
    expect(columns[2]).toMatchObject({
      columnIndex: 2,
      text: 'CCC',
      letterCount: 3,
      topLetters: [{ letter: 'C', count: 3, share: 1 }],
    });
    expect(columns[0].indexOfCoincidence).toBe(1);
    expect(columns[0].topShiftCandidates[0]).toMatchObject({
      shift: 22,
      keyLetter: 'W',
    });
  });
});

describe('reconstructVigenereCandidate', () => {
  it('builds a key and plaintext preview from per-column shifts', () => {
    const candidate = reconstructVigenereCandidate('LXFOPVEFRNHR', [11, 4, 12, 14, 13]);

    expect(candidate).toEqual({
      key: 'LEMON',
      plaintext: 'ATTACKATDAWN',
    });
  });
});
