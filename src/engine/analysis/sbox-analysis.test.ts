import { describe, expect, it } from 'vitest';

import {
  computeAlgebraicDegree,
  computeBitDependency,
  computeDDT,
  computeLAT,
  computeSBoxAnalysis,
  countFixedPoints,
} from './sbox-analysis';

const PRESENT_SBOX = [12, 5, 6, 11, 9, 0, 10, 13, 3, 14, 15, 8, 4, 7, 1, 2];
const IDENTITY_4BIT = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const PAIR_SWAP_4BIT = [1, 0, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10, 13, 12, 15, 14];

const AES_SBOX = [
  99, 124, 119, 123, 242, 107, 111, 197, 48, 1, 103, 43, 254, 215, 171, 118,
  202, 130, 201, 125, 250, 89, 71, 240, 173, 212, 162, 175, 156, 164, 114, 192,
  183, 253, 147, 38, 54, 63, 247, 204, 52, 165, 229, 241, 113, 216, 49, 21,
  4, 199, 35, 195, 24, 150, 5, 154, 7, 18, 128, 226, 235, 39, 178, 117,
  9, 131, 44, 26, 27, 110, 90, 160, 82, 59, 214, 179, 41, 227, 47, 132,
  83, 209, 0, 237, 32, 252, 177, 91, 106, 203, 190, 57, 74, 76, 88, 207,
  208, 239, 170, 251, 67, 77, 51, 133, 69, 249, 2, 127, 80, 60, 159, 168,
  81, 163, 64, 143, 146, 157, 56, 245, 188, 182, 218, 33, 16, 255, 243, 210,
  205, 12, 19, 236, 95, 151, 68, 23, 196, 167, 126, 61, 100, 93, 25, 115,
  96, 129, 79, 220, 34, 42, 144, 136, 70, 238, 184, 20, 222, 94, 11, 219,
  224, 50, 58, 10, 73, 6, 36, 92, 194, 211, 172, 98, 145, 149, 228, 121,
  231, 200, 55, 109, 141, 213, 78, 169, 108, 86, 244, 234, 101, 122, 174, 8,
  186, 120, 37, 46, 28, 166, 180, 198, 232, 221, 116, 31, 75, 189, 139, 138,
  112, 62, 181, 102, 72, 3, 246, 14, 97, 53, 87, 185, 134, 193, 29, 158,
  225, 248, 152, 17, 105, 217, 142, 148, 155, 30, 135, 233, 206, 85, 40, 223,
  140, 161, 137, 13, 191, 230, 66, 104, 65, 153, 45, 15, 176, 84, 187, 22,
];

describe('computeDDT', () => {
  it('returns full matrix for 4-bit table', () => {
    const result = computeDDT(PRESENT_SBOX, 4, 4);
    expect(result.fullMatrix).not.toBeNull();
    expect(result.fullMatrix).toHaveLength(15);
    expect(result.fullMatrix![0]).toHaveLength(16);
  });

  it('PRESENT S-box max differential uniformity is 4', () => {
    const result = computeDDT(PRESENT_SBOX, 4, 4);
    expect(result.maxUniformity).toBe(4);
  });

  it('identity 4-bit S-box has max differential uniformity 16 (trivial spread)', () => {
    const result = computeDDT(IDENTITY_4BIT, 4, 4);
    expect(result.maxUniformity).toBe(16);
  });

  it('DDT rows sum to 2^inputBits for each delta_in', () => {
    const result = computeDDT(PRESENT_SBOX, 4, 4);
    for (const row of result.fullMatrix!) {
      const sum = row.reduce((a, b) => a + b, 0);
      expect(sum).toBe(16);
    }
  });

  it('returns no full matrix for 8-bit table', () => {
    const result = computeDDT(AES_SBOX, 8, 8);
    expect(result.fullMatrix).toBeNull();
  });

  it('returns 16x16 thumbnail for 8-bit table', () => {
    const result = computeDDT(AES_SBOX, 8, 8);
    expect(result.thumbnail).not.toBeNull();
    expect(result.thumbnail).toHaveLength(16);
    expect(result.thumbnail![0]).toHaveLength(16);
  });

  it('AES S-box max differential uniformity is 4', () => {
    const result = computeDDT(AES_SBOX, 8, 8);
    expect(result.maxUniformity).toBe(4);
  });

  it('4-bit table returns null thumbnail', () => {
    const result = computeDDT(PRESENT_SBOX, 4, 4);
    expect(result.thumbnail).toBeNull();
  });
});

describe('computeLAT', () => {
  it('PRESENT S-box nonlinearity is 4', () => {
    const result = computeLAT(PRESENT_SBOX, 4, 4);
    expect(result.nonlinearity).toBe(4);
    expect(result.maxTheoreticalNonlinearity).toBe(4);
  });

  it('AES S-box nonlinearity is 112', () => {
    const result = computeLAT(AES_SBOX, 8, 8);
    expect(result.nonlinearity).toBe(112);
    expect(result.maxTheoreticalNonlinearity).toBe(112);
  });

  it('pair-swap 4-bit S-box has nonlinearity 0 (linear)', () => {
    const result = computeLAT(PAIR_SWAP_4BIT, 4, 4);
    expect(result.nonlinearity).toBe(0);
  });

  it('returns componentNonlinearity array of length outputBits', () => {
    const result = computeLAT(PRESENT_SBOX, 4, 4);
    expect(result.componentNonlinearity).toHaveLength(4);
  });

  it('componentNonlinearity values are in valid range', () => {
    const result = computeLAT(PRESENT_SBOX, 4, 4);
    for (const nl of result.componentNonlinearity) {
      expect(nl).toBeGreaterThanOrEqual(0);
      expect(nl).toBeLessThanOrEqual(result.maxTheoreticalNonlinearity);
    }
  });

  it('overall nonlinearity equals minimum of componentNonlinearity for single-output-bit functions at most', () => {
    const result = computeLAT(PRESENT_SBOX, 4, 4);
    const minComponent = Math.min(...result.componentNonlinearity);
    expect(result.nonlinearity).toBeLessThanOrEqual(minComponent);
  });
});

describe('computeBitDependency', () => {
  it('returns matrix of correct dimensions', () => {
    const result = computeBitDependency(PRESENT_SBOX, 4, 4);
    expect(result.matrix).toHaveLength(4);
    for (const row of result.matrix) {
      expect(row).toHaveLength(4);
    }
  });

  it('each matrix entry is in [0, 1]', () => {
    const result = computeBitDependency(PRESENT_SBOX, 4, 4);
    for (const row of result.matrix) {
      for (const prob of row) {
        expect(prob).toBeGreaterThanOrEqual(0);
        expect(prob).toBeLessThanOrEqual(1);
      }
    }
  });

  it('identity S-box has bit i affecting only output bit i', () => {
    const result = computeBitDependency(IDENTITY_4BIT, 4, 4);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (i === j) {
          expect(result.matrix[i][j]).toBe(1.0);
        } else {
          expect(result.matrix[i][j]).toBe(0.0);
        }
      }
    }
  });

  it('sacDeviation is in [0, 0.5]', () => {
    const result = computeBitDependency(PRESENT_SBOX, 4, 4);
    expect(result.sacDeviation).toBeGreaterThanOrEqual(0);
    expect(result.sacDeviation).toBeLessThanOrEqual(0.5);
  });
});

describe('computeAlgebraicDegree', () => {
  it('PRESENT S-box has algebraic degree 3', () => {
    const result = computeAlgebraicDegree(PRESENT_SBOX, 4, 4);
    expect(result.degree).toBe(3);
    expect(result.maxTheoreticalDegree).toBe(3);
  });

  it('AES S-box has algebraic degree 7', () => {
    const result = computeAlgebraicDegree(AES_SBOX, 8, 8);
    expect(result.degree).toBe(7);
    expect(result.maxTheoreticalDegree).toBe(7);
  });

  it('identity S-box has algebraic degree 1 (linear)', () => {
    const result = computeAlgebraicDegree(IDENTITY_4BIT, 4, 4);
    expect(result.degree).toBe(1);
  });

  it('pair-swap has algebraic degree 1 (linear)', () => {
    const result = computeAlgebraicDegree(PAIR_SWAP_4BIT, 4, 4);
    expect(result.degree).toBe(1);
  });

  it('degree is always <= maxTheoreticalDegree', () => {
    const result = computeAlgebraicDegree(PRESENT_SBOX, 4, 4);
    expect(result.degree).toBeLessThanOrEqual(result.maxTheoreticalDegree);
  });
});

describe('countFixedPoints', () => {
  it('PRESENT S-box has 0 fixed points', () => {
    expect(countFixedPoints(PRESENT_SBOX)).toBe(0);
  });

  it('identity S-box has all fixed points', () => {
    expect(countFixedPoints(IDENTITY_4BIT)).toBe(16);
  });

  it('AES S-box has 0 fixed points', () => {
    expect(countFixedPoints(AES_SBOX)).toBe(0);
  });
});

describe('computeSBoxAnalysis', () => {
  it('marks bijective tables correctly', () => {
    expect(computeSBoxAnalysis(PRESENT_SBOX, 4, 4).isBijective).toBe(true);
  });

  it('includes all expected fields', () => {
    const result = computeSBoxAnalysis(PRESENT_SBOX, 4, 4);
    expect(result.fixedPoints).toBe(0);
    expect(result.algebraicDegree.degree).toBe(3);
    expect(result.lat.componentNonlinearity).toHaveLength(4);
    expect(result.ddt.thumbnail).toBeNull();
  });

  it('AES analysis matches known values', () => {
    const result = computeSBoxAnalysis(AES_SBOX, 8, 8);
    expect(result.lat.nonlinearity).toBe(112);
    expect(result.ddt.maxUniformity).toBe(4);
    expect(result.algebraicDegree.degree).toBe(7);
    expect(result.fixedPoints).toBe(0);
    expect(result.ddt.thumbnail).not.toBeNull();
  });
});
