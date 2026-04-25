import { describe, expect, it } from 'vitest';

import {
  analyzeBitDifference,
  analyzeBitstreamRandomness,
  buildKeyScheduleAdjacentDifferences,
  buildAvalancheSweepSummary,
  buildCandidatePeriodChartEntries,
  buildInfluenceHeatmapColumnEntries,
  buildKeyScheduleSweepSummary,
  buildRoundDiffusionChartEntries,
  buildShiftConfidenceEntries,
  analyzeRoundDiffusion,
  analyzeSymbolSignal,
  analyzeVigenereColumns,
  bitsToAlphabetSymbol,
  bitsToAsciiText,
  bitsToHex,
  buildFrequencyGraphEntries,
  calculateBitDifference,
  flipBitAtIndex,
  hexToBits,
  parseBitString,
  reconstructVigenereCandidate,
  symbolToBits,
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

describe('bit and symbol conversion helpers', () => {
  it('converts hex values to bits and back', () => {
    expect(hexToBits('4F')).toEqual([0, 1, 0, 0, 1, 1, 1, 1]);
    expect(bitsToHex([0, 1, 0, 0, 1, 1, 1, 1])).toBe('4F');
    expect(bitsToAsciiText([0, 1, 0, 0, 0, 0, 0, 1])).toBe('A');
  });

  it('converts alphabet symbols to bits and back', () => {
    expect(symbolToBits('A')).toEqual([0, 0, 0, 0, 0]);
    expect(symbolToBits('Z')).toEqual([1, 1, 0, 0, 1]);
    expect(bitsToAlphabetSymbol([0, 1, 1, 0, 0])).toBe('M');
    expect(bitsToAlphabetSymbol([1, 1, 0, 1, 0])).toBeNull();
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

describe('buildFrequencyGraphEntries', () => {
  it('builds shifted frequency bars for a chosen Caesar shift', () => {
    const graph = buildFrequencyGraphEntries('MMM', 12);

    expect(graph.find((entry) => entry.letter === 'A')).toEqual({
      letter: 'A',
      english: expect.any(Number),
      shifted: 1,
    });
  });
});

describe('buildShiftConfidenceEntries', () => {
  it('normalizes top shift fits against the displayed candidate set', () => {
    expect(
      buildShiftConfidenceEntries([
        { shift: 4, keyLetter: 'E', score: 12, preview: 'AAAA' },
        { shift: 11, keyLetter: 'L', score: 18, preview: 'BBBB' },
        { shift: 19, keyLetter: 'T', score: 30, preview: 'CCCC' },
      ]),
    ).toEqual([
      {
        shift: 4,
        keyLetter: 'E',
        score: 12,
        preview: 'AAAA',
        fitPercent: 100,
        gapFromBest: 0,
      },
      {
        shift: 11,
        keyLetter: 'L',
        score: 18,
        preview: 'BBBB',
        fitPercent: expect.closeTo(66.6666667, 6),
        gapFromBest: 6,
      },
      {
        shift: 19,
        keyLetter: 'T',
        score: 30,
        preview: 'CCCC',
        fitPercent: 10,
        gapFromBest: 18,
      },
    ]);
  });
});

describe('modern bit analysis helpers', () => {
  it('parses bit strings while ignoring non-bit separators', () => {
    expect(parseBitString('10 01-11x')).toEqual([1, 0, 0, 1, 1, 1]);
  });

  it('builds round diffusion chart entries from existing diffusion data', () => {
    expect(
      buildRoundDiffusionChartEntries([
        {
          round: 1,
          moduleId: 'rounds/round-1',
          label: 'Round',
          baselineBits: [0, 0, 0, 0],
          variantBits: [1, 0, 0, 0],
          changedFlags: [true, false, false, false],
          changedCount: 1,
          changedPercent: 0.25,
        },
      ]),
    ).toEqual([
      {
        round: 1,
        moduleId: 'rounds/round-1',
        label: 'Round',
        changedCount: 1,
        changedPercent: 0.25,
        barPercent: 25,
      },
    ]);
  });

  it('summarizes output-bit influence across a bounded input sweep', () => {
    expect(
      buildInfluenceHeatmapColumnEntries([
        [true, false, true],
        [false, true, true],
        [false, false, true],
      ]),
    ).toEqual([
      {
        outputIndex: 0,
        activationCount: 1,
        activationShare: 1 / 3,
        intensity: 1 / 3,
      },
      {
        outputIndex: 1,
        activationCount: 1,
        activationShare: 1 / 3,
        intensity: 1 / 3,
      },
      {
        outputIndex: 2,
        activationCount: 3,
        activationShare: 1,
        intensity: 1,
      },
    ]);
  });

  it('normalizes candidate period metrics for chart rendering', () => {
    expect(
      buildCandidatePeriodChartEntries([
        { period: 3, averageIndexOfCoincidence: 0.045, supportingDistanceCount: 2 },
        { period: 6, averageIndexOfCoincidence: 0.067, supportingDistanceCount: 4 },
      ]),
    ).toEqual([
      {
        period: 3,
        averageIndexOfCoincidence: 0.045,
        supportingDistanceCount: 2,
        iocBarPercent: expect.closeTo((0.045 / 0.067) * 100, 6),
        supportBarPercent: 50,
      },
      {
        period: 6,
        averageIndexOfCoincidence: 0.067,
        supportingDistanceCount: 4,
        iocBarPercent: 100,
        supportBarPercent: 100,
      },
    ]);
  });

  it('flips one bit at a chosen index', () => {
    expect(flipBitAtIndex([1, 0, 1, 0], 1)).toEqual([1, 1, 1, 0]);
    expect(flipBitAtIndex([1, 0, 1, 0], 9)).toEqual([1, 0, 1, 0]);
  });

  it('calculates changed flags and summary metrics', () => {
    expect(calculateBitDifference([1, 0, 1, 0], [1, 1, 0, 0])).toEqual([
      false,
      true,
      true,
      false,
    ]);

    expect(analyzeBitDifference([1, 0, 1, 0], [1, 1, 0, 0])).toMatchObject({
      changedFlags: [false, true, true, false],
      changedCount: 2,
      changedPercent: 0.5,
    });
  });

  it('converts hex values to bits and back', () => {
    expect(hexToBits('A3')).toEqual([1, 0, 1, 0, 0, 0, 1, 1]);
    expect(bitsToHex([1, 0, 1, 0, 0, 0, 1, 1])).toBe('A3');
    expect(bitsToHex([1, 0, 1])).toBe('A');
    expect(bitsToAsciiText([0, 1, 0, 0, 0, 0, 0, 1])).toBe('A');
  });

  it('summarizes changed-bit growth across iterator rounds', () => {
    const baseline = {
      order: [],
      outputsByModuleId: {},
      trace: [],
      analysisTrace: [
        {
          moduleId: 'rounds/round-1',
          defId: 'Round',
          inputs: { in: { type: 'bits', value: [0, 0, 0, 0] } },
          outputs: { out: { type: 'bits', value: [1, 0, 0, 0] } },
        },
        {
          moduleId: 'rounds/round-1/xor-1',
          defId: 'XOR',
          inputs: { a: { type: 'bits', value: [0, 0, 0, 0] } },
          outputs: { out: { type: 'bits', value: [1, 0, 0, 0] } },
        },
        {
          moduleId: 'rounds/round-2',
          defId: 'Round',
          inputs: { in: { type: 'bits', value: [1, 0, 0, 0] } },
          outputs: { out: { type: 'bits', value: [1, 1, 0, 0] } },
        },
      ],
    };
    const variant = {
      order: [],
      outputsByModuleId: {},
      trace: [],
      analysisTrace: [
        {
          moduleId: 'rounds/round-1',
          defId: 'Round',
          inputs: { in: { type: 'bits', value: [1, 0, 0, 0] } },
          outputs: { out: { type: 'bits', value: [1, 1, 0, 0] } },
        },
        {
          moduleId: 'rounds/round-1/xor-1',
          defId: 'XOR',
          inputs: { a: { type: 'bits', value: [1, 0, 0, 0] } },
          outputs: { out: { type: 'bits', value: [1, 1, 0, 0] } },
        },
        {
          moduleId: 'rounds/round-2',
          defId: 'Round',
          inputs: { in: { type: 'bits', value: [1, 1, 0, 0] } },
          outputs: { out: { type: 'bits', value: [1, 1, 1, 0] } },
        },
      ],
    };

    expect(analyzeRoundDiffusion(baseline as never, variant as never)).toEqual([
      {
        round: 1,
        moduleId: 'rounds/round-1/xor-1',
        label: 'xor-1',
        baselineBits: [1, 0, 0, 0],
        variantBits: [1, 1, 0, 0],
        changedFlags: [false, true, false, false],
        changedCount: 1,
        changedPercent: 0.25,
      },
      {
        round: 2,
        moduleId: 'rounds/round-2',
        label: 'Round',
        baselineBits: [1, 1, 0, 0],
        variantBits: [1, 1, 1, 0],
        changedFlags: [false, false, true, false],
        changedCount: 1,
        changedPercent: 0.25,
      },
    ]);
  });

  it('summarizes bounded bitstream randomness metrics', () => {
    const analysis = analyzeBitstreamRandomness([
      0, 0, 1, 1, 0, 1, 0, 1,
      0, 0, 1, 1, 0, 1, 0, 1,
    ]);

    expect(analysis.sampleBitCount).toBe(16);
    expect(analysis.zeroCount).toBe(8);
    expect(analysis.oneCount).toBe(8);
    expect(analysis.lowConfidence).toBe(true);
    expect(analysis.longestZeroRun).toBe(2);
    expect(analysis.longestOneRun).toBe(2);
    expect(analysis.entropyPerBit).toBeCloseTo(1, 6);
    expect(analysis.entropyGap).toBeCloseTo(0, 6);
    expect(analysis.transitionCounts).toEqual({
      '00': 2,
      '01': 6,
      '10': 5,
      '11': 2,
    });
    expect(analysis.transitionShares).toEqual({
      '00': 2 / 15,
      '01': 6 / 15,
      '10': 5 / 15,
      '11': 2 / 15,
    });
    expect(analysis.runLengthSummary).toEqual([
      { lengthLabel: '1', zeroRuns: 4, oneRuns: 4 },
      { lengthLabel: '2', zeroRuns: 2, oneRuns: 2 },
      { lengthLabel: '3', zeroRuns: 0, oneRuns: 0 },
      { lengthLabel: '4+', zeroRuns: 0, oneRuns: 0 },
    ]);
    expect(analysis.patternHeatmap).toEqual(
      expect.arrayContaining([
        { pattern: '000', count: 0, share: 0, intensity: 0 },
        { pattern: '001', count: 2, share: 2 / 14, intensity: 0.5 },
        { pattern: '101', count: 4, share: 4 / 14, intensity: 1 },
      ]),
    );
    expect(analysis.repeatedWindowGroups).toEqual([
      {
        size: 4,
        truncated: false,
        matches: expect.arrayContaining([
          { window: '1010', count: 3 },
          { window: '0011', count: 2 },
        ]),
      },
      {
        size: 8,
        truncated: false,
        matches: [{ window: '00110101', count: 2 }],
      },
    ]);
  });

  it('builds batch avalanche sweep statistics and byte groups', () => {
    expect(
      buildAvalancheSweepSummary([
        { inputIndex: 0, changedFlags: [true, false, false, false], changedCount: 1, changedPercent: 0.25 },
        { inputIndex: 1, changedFlags: [true, true, false, false], changedCount: 2, changedPercent: 0.5 },
        { inputIndex: 8, changedFlags: [true, true, true, false], changedCount: 3, changedPercent: 0.75 },
        { inputIndex: 9, changedFlags: [true, true, true, true], changedCount: 4, changedPercent: 1 },
      ], 16),
    ).toEqual({
      flipCount: 4,
      minimumChangedCount: 1,
      maximumChangedCount: 4,
      averageChangedCount: 2.5,
      medianChangedCount: 2.5,
      standardDeviation: expect.closeTo(Math.sqrt(1.25), 6),
      weakestInputs: [
        { inputIndex: 0, changedCount: 1, changedPercent: 0.25 },
        { inputIndex: 1, changedCount: 2, changedPercent: 0.5 },
        { inputIndex: 8, changedCount: 3, changedPercent: 0.75 },
        { inputIndex: 9, changedCount: 4, changedPercent: 1 },
      ],
      strongestInputs: [
        { inputIndex: 9, changedCount: 4, changedPercent: 1 },
        { inputIndex: 8, changedCount: 3, changedPercent: 0.75 },
        { inputIndex: 1, changedCount: 2, changedPercent: 0.5 },
        { inputIndex: 0, changedCount: 1, changedPercent: 0.25 },
      ],
      byteGroups: [
        {
          byteIndex: 0,
          startBitIndex: 0,
          endBitIndex: 7,
          averageChangedCount: 1.5,
          averageChangedPercent: 0.375,
        },
        {
          byteIndex: 1,
          startBitIndex: 8,
          endBitIndex: 15,
          averageChangedCount: 3.5,
          averageChangedPercent: 0.875,
        },
      ],
    });
  });

  it('builds adjacent key-stage differences only for matching widths', () => {
    expect(
      buildKeyScheduleAdjacentDifferences([
        { moduleId: 'rk1', label: 'Round Key 1', bits: [0, 0, 1, 1] },
        { moduleId: 'rk2', label: 'Round Key 2', bits: [0, 1, 1, 1] },
        { moduleId: 'rk3', label: 'Round Key 3', bits: [1, 0, 1] },
      ]),
    ).toEqual([
      {
        fromModuleId: 'rk1',
        fromLabel: 'Round Key 1',
        toModuleId: 'rk2',
        toLabel: 'Round Key 2',
        width: 4,
        changedCount: 1,
        changedPercent: 0.25,
        widthMismatch: false,
      },
      {
        fromModuleId: 'rk2',
        fromLabel: 'Round Key 2',
        toModuleId: 'rk3',
        toLabel: 'Round Key 3',
        width: null,
        changedCount: null,
        changedPercent: null,
        widthMismatch: true,
      },
    ]);
  });

  it('summarizes per-stage key-schedule sweep results and callouts', () => {
    const summary = buildKeyScheduleSweepSummary(
      [
        {
          inputIndex: 0,
          stageResults: [
            { moduleId: 'rk1', changedCount: 2, changedPercent: 0.25 },
            { moduleId: 'rk2', changedCount: 6, changedPercent: 0.75 },
          ],
        },
        {
          inputIndex: 1,
          stageResults: [
            { moduleId: 'rk1', changedCount: 4, changedPercent: 0.5 },
            { moduleId: 'rk2', changedCount: 8, changedPercent: 1 },
          ],
        },
      ],
      [
        { moduleId: 'rk1', label: 'Round Key 1', bits: [0, 0, 0, 0, 0, 0, 0, 0] },
        { moduleId: 'rk2', label: 'Round Key 2', bits: [0, 0, 0, 0, 0, 0, 0, 0] },
      ],
    );

    expect(summary).toEqual({
      flipCount: 2,
      stageEntries: [
        {
          moduleId: 'rk1',
          label: 'Round Key 1',
          width: 8,
          minimumChangedCount: 2,
          maximumChangedCount: 4,
          averageChangedCount: 3,
          averageChangedPercent: 0.375,
        },
        {
          moduleId: 'rk2',
          label: 'Round Key 2',
          width: 8,
          minimumChangedCount: 6,
          maximumChangedCount: 8,
          averageChangedCount: 7,
          averageChangedPercent: 0.875,
        },
      ],
      weakestStages: [
        {
          moduleId: 'rk1',
          label: 'Round Key 1',
          averageChangedCount: 3,
          averageChangedPercent: 0.375,
        },
        {
          moduleId: 'rk2',
          label: 'Round Key 2',
          averageChangedCount: 7,
          averageChangedPercent: 0.875,
        },
      ],
      strongestStages: [
        {
          moduleId: 'rk2',
          label: 'Round Key 2',
          averageChangedCount: 7,
          averageChangedPercent: 0.875,
        },
        {
          moduleId: 'rk1',
          label: 'Round Key 1',
          averageChangedCount: 3,
          averageChangedPercent: 0.375,
        },
      ],
    });
  });
});
