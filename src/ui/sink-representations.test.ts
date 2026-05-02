import { describe, expect, it } from 'vitest';
import {
  formatBitsAs,
  getRepresentationAvailability,
  getSinkRepresentationOptions,
  getUnavailableReason,
} from './sink-representations';

describe('getRepresentationAvailability', () => {
  it('bits is always available', () => {
    expect(getRepresentationAvailability([]).bits).toBe(true);
    expect(getRepresentationAvailability([1, 0]).bits).toBe(true);
  });

  it('bytes requires width divisible by 8', () => {
    expect(getRepresentationAvailability([0, 1, 0, 0, 0, 0, 0, 1]).bytes).toBe(true);
    expect(getRepresentationAvailability([0, 1, 0]).bytes).toBe(false);
  });

  it('hex requires width divisible by 4', () => {
    expect(getRepresentationAvailability([0, 1, 0, 0]).hex).toBe(true);
    expect(getRepresentationAvailability([0, 1, 0]).hex).toBe(false);
  });

  it('ascii requires width divisible by 8 and all bytes <= 0x7F', () => {
    // 'A' = 0x41 = 01000001
    expect(getRepresentationAvailability([0, 1, 0, 0, 0, 0, 0, 1]).ascii).toBe(true);
    // 0x80 = 10000000 — not valid ASCII
    expect(getRepresentationAvailability([1, 0, 0, 0, 0, 0, 0, 0]).ascii).toBe(false);
  });

  it('empty bits: only bits available', () => {
    const a = getRepresentationAvailability([]);
    expect(a).toEqual({ bits: true, bytes: false, hex: false, ascii: false });
  });
});

describe('getUnavailableReason', () => {
  it('returns null for available representations', () => {
    const bits = [0, 1, 0, 0, 0, 0, 0, 1]; // 'A'
    const a = getRepresentationAvailability(bits);
    expect(getUnavailableReason('bits', bits, a)).toBeNull();
    expect(getUnavailableReason('bytes', bits, a)).toBeNull();
    expect(getUnavailableReason('hex', bits, a)).toBeNull();
    expect(getUnavailableReason('ascii', bits, a)).toBeNull();
  });

  it('explains bytes unavailability', () => {
    const bits = [0, 1, 0];
    const a = getRepresentationAvailability(bits);
    expect(getUnavailableReason('bytes', bits, a)).toBe('Width 3 is not divisible by 8');
  });

  it('explains hex unavailability', () => {
    const bits = [0, 1, 0];
    const a = getRepresentationAvailability(bits);
    expect(getUnavailableReason('hex', bits, a)).toBe('Width 3 is not divisible by 4');
  });

  it('explains ascii unavailability for bad width', () => {
    const bits = [0, 1, 0, 0];
    const a = getRepresentationAvailability(bits);
    expect(getUnavailableReason('ascii', bits, a)).toBe('Width 4 is not divisible by 8');
  });

  it('explains ascii unavailability for non-ASCII bytes', () => {
    const bits = [1, 0, 0, 0, 0, 0, 0, 0]; // 0x80
    const a = getRepresentationAvailability(bits);
    expect(getUnavailableReason('ascii', bits, a)).toBe('Contains non-ASCII bytes (> 0x7F)');
  });
});

describe('formatBitsAs', () => {
  // 'A' = 0x41 = 01000001
  const aBits = [0, 1, 0, 0, 0, 0, 0, 1];
  // 'AB' = 0x41 0x42
  const abBits = [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0];

  it('formats as bits', () => {
    expect(formatBitsAs(aBits, 'bits')).toBe('01000001');
  });

  it('formats as bytes', () => {
    expect(formatBitsAs(aBits, 'bytes')).toBe('01000001');
    expect(formatBitsAs(abBits, 'bytes')).toBe('01000001 01000010');
  });

  it('formats as hex', () => {
    expect(formatBitsAs(aBits, 'hex')).toBe('41');
    expect(formatBitsAs(abBits, 'hex')).toBe('4142');
  });

  it('formats as ascii', () => {
    expect(formatBitsAs(aBits, 'ascii')).toBe('A');
    expect(formatBitsAs(abBits, 'ascii')).toBe('AB');
  });

  it('handles empty bits', () => {
    expect(formatBitsAs([], 'bits')).toBe('');
  });

  it('formats 4-bit nibble as hex', () => {
    expect(formatBitsAs([1, 1, 1, 1], 'hex')).toBe('F');
    expect(formatBitsAs([0, 0, 0, 0], 'hex')).toBe('0');
  });
});

describe('getSinkRepresentationOptions', () => {
  it('returns bit-oriented options for bit outputs', () => {
    const options = getSinkRepresentationOptions('BitOutput', {
      type: 'bits',
      value: [0, 1, 0, 0, 0, 0, 0, 1],
    });
    expect(options.map((option) => option.id)).toEqual(['bits', 'bytes', 'hex', 'ascii']);
    expect(options.find((option) => option.id === 'ascii')?.value).toBe('A');
  });

  it('returns text-first options for text outputs', () => {
    const options = getSinkRepresentationOptions('TextOutput', {
      type: 'symbol',
      value: 'AB',
    });
    expect(options.map((option) => option.id)).toEqual(['text', 'bits', 'bytes', 'hex']);
    expect(options.find((option) => option.id === 'hex')?.value).toBe('4142');
  });

  it('returns hex-first options for hex outputs', () => {
    const options = getSinkRepresentationOptions('HexOutput', {
      type: 'symbol',
      value: '3A',
    });
    expect(options.map((option) => option.id)).toEqual(['hex', 'bits', 'bytes', 'ascii']);
    expect(options.find((option) => option.id === 'bits')?.value).toBe('00111010');
    expect(options.find((option) => option.id === 'ascii')?.value).toBe(':');
  });

  it('returns baudot-first options for baudot outputs', () => {
    const options = getSinkRepresentationOptions('BaudotOutput', {
      type: 'symbol',
      value: 'ABC',
    });
    expect(options.map((option) => option.id)).toEqual(['text', 'bits', 'hex']);
    expect(options.find((option) => option.id === 'bits')?.value).toContain(' ');
    expect(options.find((option) => option.id === 'hex')?.available).toBe(false);
  });

  it('returns decimal and hex options for integer outputs', () => {
    const options = getSinkRepresentationOptions('IntegerOutput', {
      type: 'integer',
      value: '255',
    });
    expect(options.map((option) => option.id)).toEqual(['decimal', 'hex']);
    expect(options.find((option) => option.id === 'decimal')?.value).toBe('255');
    expect(options.find((option) => option.id === 'hex')?.value).toBe('0xFF');
  });

  it('returns point and hex options for point outputs', () => {
    const options = getSinkRepresentationOptions('PointOutput', {
      type: 'ec-point',
      value: {
        kind: 'affine',
        curve: { p: 17, a: 2, b: 3 },
        x: '5',
        y: '6',
      },
    });
    expect(options.map((option) => option.id)).toEqual(['point', 'hex']);
    expect(options.find((option) => option.id === 'point')?.value).toBe('(5, 6)');
    expect(options.find((option) => option.id === 'hex')?.value).toBe('(0x5, 0x6)');
  });

  it('keeps generic output text-first instead of guessing hex semantics', () => {
    const options = getSinkRepresentationOptions('Output', {
      type: 'symbol',
      value: '3A',
    });
    expect(options.map((option) => option.id)).toEqual(['text', 'bits', 'bytes', 'hex']);
    expect(options.find((option) => option.id === 'hex')?.value).toBe('3341');
  });

  it('returns no options for missing or mismatched sink signals', () => {
    expect(getSinkRepresentationOptions(undefined, undefined)).toEqual([]);
    expect(getSinkRepresentationOptions('BitOutput', { type: 'symbol', value: 'A' })).toEqual([]);
  });
});
