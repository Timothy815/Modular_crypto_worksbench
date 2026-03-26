import { describe, expect, it } from 'vitest';
import { parseParamValue } from './formatters';

const bitsField = {
  key: 'stream',
  label: 'Bit Stream',
  kind: 'bits' as const,
  defaultValue: [],
};

describe('parseParamValue bits', () => {
  it('parses a continuous bit string', () => {
    const result = parseParamValue('0100000101000010', bitsField);
    expect(result).toEqual({
      ok: true,
      value: [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
    });
  });

  it('parses spaced bit strings', () => {
    const result = parseParamValue('01000001 01000010', bitsField);
    expect(result).toEqual({
      ok: true,
      value: [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
    });
  });

  it('parses bracketed comma-separated bits', () => {
    const result = parseParamValue('[0, 1, 0, 1]', bitsField);
    expect(result).toEqual({
      ok: true,
      value: [0, 1, 0, 1],
    });
  });

  it('rejects non-binary input', () => {
    const result = parseParamValue('010201', bitsField);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Bits must be 0 or 1.');
  });
});
