import { describe, expect, it } from 'vitest';
import { BitSelect, parseBitSelectOrder, validateBitSelectOrderParam } from './bit-select';

describe('parseBitSelectOrder', () => {
  it('parses a valid comma-separated list', () => {
    expect(parseBitSelectOrder('0,2,4,6')).toEqual([0, 2, 4, 6]);
  });

  it('parses single index', () => {
    expect(parseBitSelectOrder('3')).toEqual([3]);
  });

  it('handles whitespace around commas', () => {
    expect(parseBitSelectOrder('1, 3, 5')).toEqual([1, 3, 5]);
  });

  it('throws for empty string', () => {
    expect(() => parseBitSelectOrder('')).toThrow();
  });

  it('throws for non-string input', () => {
    expect(() => parseBitSelectOrder(42)).toThrow();
  });

  it('throws for negative index', () => {
    expect(() => parseBitSelectOrder('0,-1,2')).toThrow();
  });
});

describe('validateBitSelectOrderParam', () => {
  it('returns null for valid order', () => {
    expect(validateBitSelectOrderParam('0,2,4')).toBeNull();
  });

  it('returns error string for invalid order', () => {
    expect(validateBitSelectOrderParam('')).not.toBeNull();
    expect(validateBitSelectOrderParam(null)).not.toBeNull();
  });
});

describe('BitSelect evaluate', () => {
  const makeBits = (values: number[]) => ({ in: { type: 'bits' as const, value: values } });

  it('selects bits in specified order', () => {
    const result = BitSelect.evaluate(makeBits([1, 0, 1, 1, 0, 0, 1, 0]), { order: '0,2,4,6' });
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 0, 1] });
  });

  it('can reorder while selecting', () => {
    // pick indices 7,5,3,1 — reversed stride selection
    const result = BitSelect.evaluate(makeBits([1, 0, 1, 1, 0, 0, 1, 0]), { order: '7,5,3,1' });
    expect(result.out).toEqual({ type: 'bits', value: [0, 0, 1, 0] });
  });

  it('selects a single bit', () => {
    const result = BitSelect.evaluate(makeBits([0, 1, 0, 0]), { order: '1' });
    expect(result.out).toEqual({ type: 'bits', value: [1] });
  });

  it('models DES PC-1 style parity-drop: 8 bits → 7 bits (drop bit 7)', () => {
    // bits [1,0,1,0,1,0,1,P] — drop the parity bit at index 7, keep 0-6
    const bits = [1, 0, 1, 0, 1, 0, 1, 0];
    const result = BitSelect.evaluate(makeBits(bits), { order: '0,1,2,3,4,5,6' });
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 0, 1, 0, 1] });
  });

  it('throws for out-of-range index', () => {
    expect(() =>
      BitSelect.evaluate(makeBits([0, 1, 0, 1]), { order: '0,4' }),
    ).toThrow();
  });

  it('throws for duplicate index', () => {
    expect(() =>
      BitSelect.evaluate(makeBits([0, 1, 0, 1]), { order: '0,1,0' }),
    ).toThrow();
  });

  it('output length equals number of selected indices', () => {
    const result = BitSelect.evaluate(makeBits([1, 0, 1, 1, 0, 0, 1, 0]), { order: '3,1,6' });
    expect((result.out as { type: 'bits'; value: number[] }).value).toHaveLength(3);
  });
});
