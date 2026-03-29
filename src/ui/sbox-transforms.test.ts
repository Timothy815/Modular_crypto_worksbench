import { describe, expect, it } from 'vitest';

import {
  getSBoxGridColumn,
  getSBoxGridColumns,
  getSBoxGridRow,
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
});
