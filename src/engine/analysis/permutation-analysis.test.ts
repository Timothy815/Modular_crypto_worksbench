import { describe, expect, it } from 'vitest';

import { computeBlockSpread, computeCycles, computeDisplacement, computePermutationAnalysis } from './permutation-analysis';

// Identity: [0,1,2,3,4,5,6,7] — no movement
const IDENTITY_8 = [0, 1, 2, 3, 4, 5, 6, 7];

// Reverse: [7,6,5,4,3,2,1,0]
const REVERSE_8 = [7, 6, 5, 4, 3, 2, 1, 0];

// Single 8-cycle: 0→1→2→3→4→5→6→7→0 (order[i] = i+1 mod 8 as source index)
// output[i] = input[order[i]]: if order = [1,2,3,4,5,6,7,0], output[0]=input[1], output[1]=input[2]...
// That shifts left by 1. Cycle: 0←1←2←...←7←0
const LEFT_SHIFT_8 = [1, 2, 3, 4, 5, 6, 7, 0];

// Valid 32-bit permutation with good inter-block spread:
// output[i] comes from input[order[i]], where order[outPos] = inPos
// This spreads each input block of 4 across all 8 output blocks
const SPREAD_PERM_32 = [0, 8, 16, 24, 1, 9, 17, 25, 2, 10, 18, 26, 3, 11, 19, 27, 4, 12, 20, 28, 5, 13, 21, 29, 6, 14, 22, 30, 7, 15, 23, 31];

describe('computeCycles', () => {
  it('identity permutation has all fixed points', () => {
    const result = computeCycles(IDENTITY_8);
    expect(result.fixedPoints).toBe(8);
    expect(result.count).toBe(8);
    expect(result.minLength).toBe(1);
    expect(result.maxLength).toBe(1);
  });

  it('left shift has one cycle of length 8', () => {
    const result = computeCycles(LEFT_SHIFT_8);
    expect(result.count).toBe(1);
    expect(result.maxLength).toBe(8);
    expect(result.fixedPoints).toBe(0);
  });

  it('reverse permutation on even length splits into transpositions', () => {
    const result = computeCycles(REVERSE_8);
    // [7,6,5,4,3,2,1,0]: cycles are (0,7),(1,6),(2,5),(3,4)
    expect(result.count).toBe(4);
    expect(result.maxLength).toBe(2);
    expect(result.minLength).toBe(2);
    expect(result.fixedPoints).toBe(0);
  });

  it('cycle lengths sum to permutation length', () => {
    const result = computeCycles(SPREAD_PERM_32);
    const totalLength = result.cycles.reduce((sum, c) => sum + c.length, 0);
    expect(totalLength).toBe(32);
  });

  it('each position appears in exactly one cycle', () => {
    const result = computeCycles(SPREAD_PERM_32);
    const seen = new Set<number>();
    for (const cycle of result.cycles) {
      for (const pos of cycle) {
        expect(seen.has(pos)).toBe(false);
        seen.add(pos);
      }
    }
    expect(seen.size).toBe(32);
  });
});

describe('computeDisplacement', () => {
  it('identity has zero displacement everywhere', () => {
    const result = computeDisplacement(IDENTITY_8);
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
    expect(result.avg).toBe(0);
  });

  it('reverse displacement is correct', () => {
    // inv[i] = 7-i, so displacement[i] = |7-i-i| = |7-2i|
    const result = computeDisplacement(REVERSE_8);
    expect(result.min).toBe(1); // positions 3,4 displace by 1
    expect(result.max).toBe(7); // position 0 and 7 displace by 7
  });

  it('displacements array has length equal to permutation length', () => {
    const result = computeDisplacement(SPREAD_PERM_32);
    expect(result.displacements).toHaveLength(32);
  });

  it('avg is consistent with sum', () => {
    const result = computeDisplacement(REVERSE_8);
    const expected = result.displacements.reduce((a, b) => a + b, 0) / 8;
    expect(result.avg).toBeCloseTo(expected, 10);
  });
});

describe('computeBlockSpread', () => {
  it('throws for invalid block size', () => {
    expect(() => computeBlockSpread(IDENTITY_8, 3)).toThrow();
  });

  it('identity permutation keeps each block within itself', () => {
    const result = computeBlockSpread(IDENTITY_8, 4);
    // Block 0 (positions 0-3) maps to block 0 only, block 1 maps to block 1 only
    expect(result.spreadMatrix[0][0]).toBe(4);
    expect(result.spreadMatrix[0][1]).toBe(0);
    expect(result.spreadMatrix[1][1]).toBe(4);
  });

  it('identity permutation has branch number 2 (minimum possible)', () => {
    const result = computeBlockSpread(IDENTITY_8, 4);
    expect(result.branchNumber).toBe(2);
  });

  it('reverse permutation has block spread', () => {
    // REVERSE_8 with blockSize=4: positions 0-3 land at 7,6,5,4 (block 1), positions 4-7 land at 3,2,1,0 (block 0)
    const result = computeBlockSpread(REVERSE_8, 4);
    expect(result.spreadMatrix[0][0]).toBe(0);
    expect(result.spreadMatrix[0][1]).toBe(4);
    expect(result.spreadMatrix[1][0]).toBe(4);
    expect(result.spreadMatrix[1][1]).toBe(0);
  });

  it('reverse permutation 2-block case has branch number 2', () => {
    const result = computeBlockSpread(REVERSE_8, 4);
    // Block 0 activates block 1 only: 1+1=2. Block 1 activates block 0 only: 1+1=2.
    // Both blocks active: activates both out blocks: 2+2=4.
    expect(result.branchNumber).toBe(2);
  });

  it('spreadMatrix rows sum to blockSize', () => {
    const result = computeBlockSpread(SPREAD_PERM_32, 4);
    for (const row of result.spreadMatrix) {
      const sum = row.reduce((a, b) => a + b, 0);
      expect(sum).toBe(4);
    }
  });

  it('branchNumberIsExact is true for small block counts', () => {
    const result = computeBlockSpread(IDENTITY_8, 4);
    expect(result.branchNumberIsExact).toBe(true);
  });
});

describe('computePermutationAnalysis', () => {
  it('returns blockSpread when blockSize provided and valid', () => {
    const result = computePermutationAnalysis(IDENTITY_8, 4);
    expect(result.blockSpread).not.toBeNull();
    expect(result.blockSpread!.blockSize).toBe(4);
  });

  it('returns null blockSpread when blockSize not provided', () => {
    const result = computePermutationAnalysis(IDENTITY_8);
    expect(result.blockSpread).toBeNull();
  });

  it('returns null blockSpread when blockSize does not divide length', () => {
    const result = computePermutationAnalysis(IDENTITY_8, 3);
    expect(result.blockSpread).toBeNull();
  });

  it('length matches order length', () => {
    const result = computePermutationAnalysis(SPREAD_PERM_32);
    expect(result.length).toBe(32);
  });
});
