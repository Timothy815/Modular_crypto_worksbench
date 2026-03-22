import { describe, expect, it } from 'vitest';
import { TextInput } from './text-input';
import { KeyInput } from './key-input';
import { BitSource } from './bit-source';
import { SymbolToBits } from './symbol-to-bits';
import { BitsToSymbol } from './bits-to-symbol';
import { XOR } from './xor';
import { Rotor } from './rotor';
import { Reflector } from './reflector';
import { Permutation } from './permutation';
import { BitShifter } from './bit-shifter';
import type { Signal } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

describe('TextInput', () => {
  it('outputs the configured symbol', () => {
    const result = TextInput.evaluate({}, { value: 'H' });
    expect(result.out).toEqual({ type: 'symbol', value: 'H' });
  });

  it('defaults to A', () => {
    const result = TextInput.evaluate({}, {});
    expect(result.out).toEqual({ type: 'symbol', value: 'A' });
  });
});

describe('KeyInput', () => {
  it('outputs the configured key symbol', () => {
    const result = KeyInput.evaluate({}, { value: 'K' });
    expect(result.out).toEqual({ type: 'symbol', value: 'K' });
  });
});

describe('BitSource', () => {
  it('outputs the configured bit stream', () => {
    const stream = [1, 0, 1, 1, 0];
    const result = BitSource.evaluate({}, { stream });
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1, 0] });
  });

  it('throws on non-array input', () => {
    expect(() => BitSource.evaluate({}, { stream: 'not bits' })).toThrow();
  });
});

describe('SymbolToBits', () => {
  it('encodes A as 00000', () => {
    const result = SymbolToBits.evaluate(
      { in: { type: 'symbol', value: 'A' } },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [0, 0, 0, 0, 0] });
  });

  it('encodes Z as 11001', () => {
    const result = SymbolToBits.evaluate(
      { in: { type: 'symbol', value: 'Z' } },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 0, 0, 1] });
  });

  it('encodes M (index 12) as 01100', () => {
    const result = SymbolToBits.evaluate(
      { in: { type: 'symbol', value: 'M' } },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [0, 1, 1, 0, 0] });
  });

  it('throws on non-alphabet character', () => {
    expect(() =>
      SymbolToBits.evaluate({ in: { type: 'symbol', value: '3' } }, {}),
    ).toThrow();
  });
});

describe('BitsToSymbol', () => {
  it('decodes 00000 as A', () => {
    const result = BitsToSymbol.evaluate(
      { in: { type: 'bits', value: [0, 0, 0, 0, 0] } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'A' });
  });

  it('decodes 11001 as Z', () => {
    const result = BitsToSymbol.evaluate(
      { in: { type: 'bits', value: [1, 1, 0, 0, 1] } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'Z' });
  });

  it('wraps values above 25 back into alphabet', () => {
    // 11111 = 31, 31 % 26 = 5 → F
    const result = BitsToSymbol.evaluate(
      { in: { type: 'bits', value: [1, 1, 1, 1, 1] } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'F' });
  });

  it('roundtrips with SymbolToBits for all letters', () => {
    for (const letter of ALPHABET) {
      const encoded = SymbolToBits.evaluate(
        { in: { type: 'symbol', value: letter } },
        {},
      );
      const decoded = BitsToSymbol.evaluate({ in: encoded.out }, {});
      expect(decoded.out).toEqual({ type: 'symbol', value: letter });
    }
  });
});

describe('XOR', () => {
  it('XORs two bit arrays', () => {
    const result = XOR.evaluate(
      {
        a: { type: 'bits', value: [1, 0, 1, 1, 0] },
        b: { type: 'bits', value: [0, 1, 1, 0, 1] },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 0, 1, 1] });
  });

  it('uses shorter length when arrays differ', () => {
    const result = XOR.evaluate(
      {
        a: { type: 'bits', value: [1, 0, 1] },
        b: { type: 'bits', value: [0, 1, 1, 0, 1] },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 0] });
  });

  it('XOR with zeros is identity', () => {
    const result = XOR.evaluate(
      {
        a: { type: 'bits', value: [1, 0, 1, 1, 0] },
        b: { type: 'bits', value: [0, 0, 0, 0, 0] },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1, 0] });
  });

  it('XOR with self is all zeros', () => {
    const bits = [1, 0, 1, 1, 0];
    const result = XOR.evaluate(
      {
        a: { type: 'bits', value: bits },
        b: { type: 'bits', value: bits },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [0, 0, 0, 0, 0] });
  });
});

describe('Permutation', () => {
  it('reorders bits by the configured index order', () => {
    const result = Permutation.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 1, 0] } },
      { order: '2,0,4,1,3' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 0, 0, 1] });
  });

  it('throws when the order length does not match the input width', () => {
    expect(() =>
      Permutation.evaluate(
        { in: { type: 'bits', value: [1, 0, 1, 1, 0] } },
        { order: '0,1,2' },
      ),
    ).toThrow();
  });

  it('throws when the order repeats indexes', () => {
    expect(() =>
      Permutation.evaluate(
        { in: { type: 'bits', value: [1, 0, 1, 1, 0] } },
        { order: '0,1,1,3,4' },
      ),
    ).toThrow();
  });
});

describe('BitShifter', () => {
  const bitsSignal: Signal = { type: 'bits', value: [1, 0, 1, 1, 0] };

  it('shifts bits left with zero fill', () => {
    const result = BitShifter.evaluate({ in: bitsSignal }, { amount: 2, mode: 'left' });
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 0, 0, 0] });
  });

  it('shifts bits right with zero fill', () => {
    const result = BitShifter.evaluate({ in: bitsSignal }, { amount: 2, mode: 'right' });
    expect(result.out).toEqual({ type: 'bits', value: [0, 0, 1, 0, 1] });
  });

  it('rotates bits left', () => {
    const result = BitShifter.evaluate({ in: bitsSignal }, { amount: 2, mode: 'rotate-left' });
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 0, 1, 0] });
  });

  it('rotates bits right', () => {
    const result = BitShifter.evaluate({ in: bitsSignal }, { amount: 1, mode: 'rotate-right' });
    expect(result.out).toEqual({ type: 'bits', value: [0, 1, 0, 1, 1] });
  });

  it('returns zeros when a logical shift exceeds the input width', () => {
    const result = BitShifter.evaluate({ in: bitsSignal }, { amount: 7, mode: 'left' });
    expect(result.out).toEqual({ type: 'bits', value: [0, 0, 0, 0, 0] });
  });
});

describe('Rotor', () => {
  // Identity wiring — no substitution, just tests position shifting
  const identityWiring = ALPHABET.split('');

  // Simple shifted wiring: BCDEFGHIJKLMNOPQRSTUVWXYZA
  const shiftedWiring = ALPHABET.slice(1).split('').concat(['A']);

  it('passes through with identity wiring at position 0', () => {
    const result = Rotor.evaluate(
      { in: { type: 'symbol', value: 'A' } },
      { wiring: identityWiring, position: 0 },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'A' });
  });

  it('applies substitution with shifted wiring at position 0', () => {
    // A(0) → shifted[0] = B(1) → unshifted = B
    const result = Rotor.evaluate(
      { in: { type: 'symbol', value: 'A' } },
      { wiring: shiftedWiring, position: 0 },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'B' });
  });

  it('applies position offset correctly', () => {
    // With identity wiring and position 1:
    // A(0) + 1 = 1, identity[1] = B(1), 1 - 1 = 0 → A
    const result = Rotor.evaluate(
      { in: { type: 'symbol', value: 'A' } },
      { wiring: identityWiring, position: 1 },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'A' });
  });

  it('wraps around the alphabet', () => {
    const result = Rotor.evaluate(
      { in: { type: 'symbol', value: 'Z' } },
      { wiring: shiftedWiring, position: 0 },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'A' });
  });
});

describe('Reflector', () => {
  // Simple reflector: swap pairs (A↔Z, B↔Y, C↔X, ...)
  const reverseWiring = ALPHABET.split('').reverse();

  it('maps A to Z with reverse wiring', () => {
    const result = Reflector.evaluate(
      { in: { type: 'symbol', value: 'A' } },
      { wiring: reverseWiring },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'Z' });
  });

  it('maps Z to A with reverse wiring', () => {
    const result = Reflector.evaluate(
      { in: { type: 'symbol', value: 'Z' } },
      { wiring: reverseWiring },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'A' });
  });

  it('is involutive — applying twice returns the original', () => {
    for (const letter of ALPHABET) {
      const first = Reflector.evaluate(
        { in: { type: 'symbol', value: letter } },
        { wiring: reverseWiring },
      );
      const second = Reflector.evaluate(
        { in: first.out },
        { wiring: reverseWiring },
      );
      expect((second.out as Signal & { type: 'symbol' }).value).toBe(letter);
    }
  });
});
