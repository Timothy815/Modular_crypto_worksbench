import { describe, expect, it } from 'vitest';

import {
  computeKeyedSBoxAnalysis,
  KEYED_SBOX_BASELINE_TABLE,
  KEYED_SBOX_VARIANT_10_TABLE,
} from './keyed-sbox-analysis';

describe('computeKeyedSBoxAnalysis', () => {
  it('returns the baseline table and baseline examples for key 00', () => {
    const analysis = computeKeyedSBoxAnalysis({ keyBits: '00' });

    expect(analysis.selectedTable).toEqual(KEYED_SBOX_BASELINE_TABLE);
    expect(analysis.selectedVariant.isValidPermutation).toBe(true);
    expect(analysis.baselineExampleOutputs).toEqual([
      { input: '0x0', output: '0xC' },
      { input: '0x1', output: '0x5' },
      { input: '0x7', output: '0xD' },
    ]);
  });

  it('returns the rotated first-row variant for key 10', () => {
    const analysis = computeKeyedSBoxAnalysis({ keyBits: [1, 0] });

    expect(analysis.selectedTable).toEqual(KEYED_SBOX_VARIANT_10_TABLE);
    expect(analysis.selectedExampleOutputs).toEqual([
      { input: '0x0', output: '0x5' },
      { input: '0x1', output: '0x6' },
      { input: '0x7', output: '0xD' },
    ]);
    expect(analysis.selectedVariant.isValidPermutation).toBe(true);
  });

  it('reports repeated and missing values for the intentionally invalid key 11 variant', () => {
    const analysis = computeKeyedSBoxAnalysis({ keyBits: '11' });

    expect(analysis.selectedVariant.isValidPermutation).toBe(false);
    expect(analysis.repeatedValues).toEqual([0]);
    expect(analysis.missingValues).toEqual([14]);
  });
});
