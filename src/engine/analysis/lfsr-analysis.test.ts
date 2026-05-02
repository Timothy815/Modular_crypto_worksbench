import { describe, expect, it } from 'vitest';

import { computeLFSRAnalysis } from './lfsr-analysis';

// 4-bit LFSR with primitive polynomial (taps 3 and 0) → period 15
const SEED_4 = [1, 0, 0, 0];
const TAPS_PRIMITIVE_4 = '3,0';

// 4-bit LFSR with non-primitive taps → shorter period
// taps=3,1 gives period 6 for seed [1,0,0,0]
const TAPS_NON_PRIMITIVE_4 = '3,1';

// 8-bit LFSR with primitive taps 7,5,4,3 → period 255
const SEED_8 = [1, 0, 0, 0, 0, 0, 0, 0];
const TAPS_PRIMITIVE_8 = '7,5,4,3';

describe('computeLFSRAnalysis', () => {
  it('detects primitive 4-bit LFSR with period 15', () => {
    const result = computeLFSRAnalysis(SEED_4, TAPS_PRIMITIVE_4);
    expect(result.degree).toBe(4);
    expect(result.maxPeriod).toBe(15);
    expect(result.period).toBe(15);
    expect(result.isPrimitive).toBe(true);
    expect(result.isExact).toBe(true);
  });

  it('detects non-primitive 4-bit LFSR with period < 15', () => {
    const result = computeLFSRAnalysis(SEED_4, TAPS_NON_PRIMITIVE_4);
    expect(result.degree).toBe(4);
    expect(result.period).not.toBe(15);
    expect(result.isPrimitive).toBe(false);
    expect(result.isExact).toBe(true);
  });

  it('detects primitive 8-bit LFSR with period 255', () => {
    const result = computeLFSRAnalysis(SEED_8, TAPS_PRIMITIVE_8);
    expect(result.degree).toBe(8);
    expect(result.maxPeriod).toBe(255);
    expect(result.period).toBe(255);
    expect(result.isPrimitive).toBe(true);
  });

  it('flags all-zero seed and returns null period', () => {
    const result = computeLFSRAnalysis([0, 0, 0, 0], TAPS_PRIMITIVE_4);
    expect(result.allZerosSeed).toBe(true);
    expect(result.period).toBeNull();
    expect(result.isPrimitive).toBeNull();
  });

  it('non-primitive LFSR has period strictly less than maxPeriod', () => {
    const result = computeLFSRAnalysis(SEED_4, TAPS_NON_PRIMITIVE_4);
    expect(result.period).not.toBeNull();
    expect(result.period!).toBeLessThan(result.maxPeriod);
  });

  it('returns tapCount matching parsed taps', () => {
    const result = computeLFSRAnalysis(SEED_4, '3,1,0');
    expect(result.tapCount).toBe(3);
    expect(result.taps).toEqual([3, 1, 0]);
  });

  it('returns null period for invalid taps', () => {
    const result = computeLFSRAnalysis(SEED_4, 'invalid');
    expect(result.period).toBeNull();
  });

  it('maxPeriod is 2^degree - 1', () => {
    const result = computeLFSRAnalysis(SEED_4, TAPS_PRIMITIVE_4);
    expect(result.maxPeriod).toBe(Math.pow(2, 4) - 1);
  });
});
