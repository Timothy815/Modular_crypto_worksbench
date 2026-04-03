import { describe, expect, it } from 'vitest';

import {
  countSBoxFixedPoints,
  generateSBoxTable,
  getSBoxGridColumn,
  getSBoxGridColumns,
  getSBoxGridRow,
  invertSBoxTable,
  isSBoxInvolution,
  rotateSBoxColumn,
  rotateSBoxRow,
  swapSBoxColumns,
  swapSBoxRows,
} from './sbox-transforms';

describe('sbox-transforms', () => {
  it('derives the expected grid widths for teaching tables', () => {
    expect(getSBoxGridColumns(16)).toBe(4);
    expect(getSBoxGridColumns(256)).toBe(16);
  });

  it('derives row and column from a selected cell index', () => {
    expect(getSBoxGridRow(6, 4)).toBe(1);
    expect(getSBoxGridColumn(6, 4)).toBe(2);
  });

  it('swaps rows using grid-relative semantics', () => {
    expect(swapSBoxRows([0, 1, 2, 3], 0, 1, 2)).toEqual([2, 3, 0, 1]);
  });

  it('swaps columns using grid-relative semantics', () => {
    expect(swapSBoxColumns([0, 1, 2, 3], 0, 1, 2)).toEqual([1, 0, 3, 2]);
  });

  it('rotates a row left and right', () => {
    expect(rotateSBoxRow([0, 1, 2, 3], 1, 2, 'left')).toEqual([0, 1, 3, 2]);
    expect(rotateSBoxRow([0, 1, 2, 3], 0, 2, 'right')).toEqual([1, 0, 2, 3]);
  });

  it('rotates a column up and down', () => {
    expect(rotateSBoxColumn([0, 1, 2, 3], 0, 2, 'down')).toEqual([2, 1, 0, 3]);
    expect(rotateSBoxColumn([0, 1, 2, 3], 1, 2, 'up')).toEqual([0, 3, 2, 1]);
  });

  it('returns a clone when indices are invalid or unchanged', () => {
    const table = [0, 1, 2, 3];
    expect(swapSBoxRows(table, 0, 0, 2)).toEqual(table);
    expect(swapSBoxColumns(table, -1, 1, 2)).toEqual(table);
    expect(rotateSBoxRow(table, 5, 2, 'left')).toEqual(table);
    expect(rotateSBoxColumn(table, 5, 2, 'up')).toEqual(table);
    expect(swapSBoxRows(table, 0, 0, 2)).not.toBe(table);
  });

  describe('generateSBoxTable', () => {
    it('generates a valid identity table', () => {
      expect(generateSBoxTable(16, 'identity')).toEqual(
        Array.from({ length: 16 }, (_, i) => i),
      );
      expect(generateSBoxTable(256, 'identity')).toEqual(
        Array.from({ length: 256 }, (_, i) => i),
      );
    });

    it('generates a valid reverse table', () => {
      expect(generateSBoxTable(16, 'reverse')).toEqual(
        Array.from({ length: 16 }, (_, i) => 15 - i),
      );
    });

    it('generates a valid pair-swap table', () => {
      const table = generateSBoxTable(16, 'pair-swap');
      expect(table).toEqual([1, 0, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10, 13, 12, 15, 14]);
      expect(new Set(table).size).toBe(16);
    });

    it('generates a valid random permutation for 16 entries', () => {
      const table = generateSBoxTable(16, 'random');
      expect(table).toHaveLength(16);
      expect(new Set(table).size).toBe(16);
      expect(table.every((v) => v >= 0 && v < 16)).toBe(true);
    });

    it('generates a valid random permutation for 256 entries', () => {
      const table = generateSBoxTable(256, 'random');
      expect(table).toHaveLength(256);
      expect(new Set(table).size).toBe(256);
      expect(table.every((v) => v >= 0 && v < 256)).toBe(true);
    });

    it('generates valid permutations for the supported entry sizes', () => {
      for (const size of [16, 256]) {
        const table = generateSBoxTable(size, 'random');
        expect(table).toHaveLength(size);
        expect(new Set(table).size).toBe(size);
        expect(table.every((v) => v >= 0 && v < size)).toBe(true);
      }
    });
  });

  describe('invertSBoxTable', () => {
    it('computes the inverse of identity', () => {
      expect(invertSBoxTable([0, 1, 2, 3])).toEqual([0, 1, 2, 3]);
    });

    it('computes the inverse of a non-trivial table', () => {
      const table = [2, 0, 3, 1];
      const inverse = invertSBoxTable(table);
      expect(inverse).toEqual([1, 3, 0, 2]);
      for (let i = 0; i < table.length; i += 1) {
        expect(inverse[table[i]]).toBe(i);
      }
    });

    it('double-inverse returns the original table', () => {
      const table = generateSBoxTable(16, 'random');
      expect(invertSBoxTable(invertSBoxTable(table))).toEqual(table);
    });
  });

  describe('countSBoxFixedPoints', () => {
    it('counts all fixed points for identity', () => {
      expect(countSBoxFixedPoints([0, 1, 2, 3])).toBe(4);
    });

    it('counts zero fixed points for reverse', () => {
      expect(countSBoxFixedPoints([3, 2, 1, 0])).toBe(0);
    });

    it('counts partial fixed points', () => {
      expect(countSBoxFixedPoints([0, 3, 2, 1])).toBe(2);
    });
  });

  describe('isSBoxInvolution', () => {
    it('detects identity as an involution', () => {
      expect(isSBoxInvolution([0, 1, 2, 3])).toBe(true);
    });

    it('detects pair-swap as an involution', () => {
      expect(isSBoxInvolution([1, 0, 3, 2])).toBe(true);
    });

    it('detects non-involutions', () => {
      expect(isSBoxInvolution([1, 2, 3, 0])).toBe(false);
    });
  });
});
