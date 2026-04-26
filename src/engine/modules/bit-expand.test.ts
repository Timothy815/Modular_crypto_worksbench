import { describe, expect, it } from 'vitest';
import { BitExpand, parseBitExpandOrder, validateBitExpandOrderParam } from './bit-expand';

describe('parseBitExpandOrder', () => {
  it('parses a valid list with repeats', () => {
    expect(parseBitExpandOrder('0,1,2,3,0,1')).toEqual([0, 1, 2, 3, 0, 1]);
  });

  it('parses single index', () => {
    expect(parseBitExpandOrder('2')).toEqual([2]);
  });

  it('handles whitespace around commas', () => {
    expect(parseBitExpandOrder('0, 1, 0, 1')).toEqual([0, 1, 0, 1]);
  });

  it('throws for empty string', () => {
    expect(() => parseBitExpandOrder('')).toThrow();
  });

  it('throws for non-string input', () => {
    expect(() => parseBitExpandOrder(42)).toThrow();
  });

  it('throws for negative index', () => {
    expect(() => parseBitExpandOrder('0,-1,2')).toThrow();
  });
});

describe('validateBitExpandOrderParam', () => {
  it('returns null for valid order with repeats', () => {
    expect(validateBitExpandOrderParam('0,1,0,1')).toBeNull();
  });

  it('returns error string for empty or non-string', () => {
    expect(validateBitExpandOrderParam('')).not.toBeNull();
    expect(validateBitExpandOrderParam(null)).not.toBeNull();
  });
});

describe('BitExpand evaluate', () => {
  const makeBits = (values: number[]) => ({ in: { type: 'bits' as const, value: values } });

  it('expands 4 bits to 6 by repeating boundary bits', () => {
    // repeat index 0 at start and index 3 at end — 4 → 6
    const result = BitExpand.evaluate(makeBits([1, 0, 1, 1]), { order: '3,0,1,2,3,0' });
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 0, 1, 1, 1] });
  });

  it('can repeat the same index many times', () => {
    const result = BitExpand.evaluate(makeBits([0, 1, 0, 1]), { order: '1,1,1' });
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 1] });
  });

  it('can also compress when all indices are unique and output < input', () => {
    // BitExpand allows this (no duplicate check); only output > input is required for good design
    const result = BitExpand.evaluate(makeBits([1, 0, 1, 1]), { order: '0,2' });
    expect(result.out).toEqual({ type: 'bits', value: [1, 1] });
  });

  it('models DES E-expansion style: boundary bits repeated', () => {
    // 4-bit word: repeat last bit at front and first bit at back
    const bits = [1, 0, 1, 1];
    const result = BitExpand.evaluate(makeBits(bits), { order: '3,0,1,2,3,0' });
    const out = (result.out as { type: 'bits'; value: number[] }).value;
    expect(out).toHaveLength(6);
    // first output = input[3], last output = input[0]
    expect(out[0]).toBe(bits[3]);
    expect(out[5]).toBe(bits[0]);
  });

  it('output length equals number of entries in order', () => {
    const result = BitExpand.evaluate(makeBits([1, 0, 1, 1, 0, 0, 1, 0]), { order: '0,1,7,6,0,1,7,6,0,1,7,6' });
    expect((result.out as { type: 'bits'; value: number[] }).value).toHaveLength(12);
  });

  it('throws for out-of-range index', () => {
    expect(() =>
      BitExpand.evaluate(makeBits([0, 1, 0, 1]), { order: '0,4' }),
    ).toThrow();
  });

  it('does not throw for duplicate indices', () => {
    expect(() =>
      BitExpand.evaluate(makeBits([0, 1, 0, 1]), { order: '0,1,0,1' }),
    ).not.toThrow();
  });
});
