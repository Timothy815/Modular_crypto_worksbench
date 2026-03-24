import { describe, expect, it } from 'vitest';
import { TextInput } from './text-input';
import { KeyInput } from './key-input';
import { BitSource } from './bit-source';
import { AsciiSource } from './ascii-source';
import { BaudotSource } from './baudot-source';
import { HexSource } from './hex-source';
import { SymbolToBits } from './symbol-to-bits';
import { BitsToAscii } from './bits-to-ascii';
import { BitsToBaudot } from './bits-to-baudot';
import { BitsToSymbol } from './bits-to-symbol';
import { BitsToHex } from './bits-to-hex';
import { AddMod } from './add-mod';
import { AND } from './and';
import { AtLeast } from './at-least';
import { Counter } from './counter';
import { Equals } from './equals';
import { Gate } from './gate';
import { Modulo } from './modulo';
import { NOT } from './not';
import { OR } from './or';
import { SubMod } from './sub-mod';
import { XOR } from './xor';
import {
  buildIdentityPlugboardWiring,
  pairPlugboardLetters,
  Plugboard,
  serializePlugboardWiring,
  unpairPlugboardLetter,
} from './plugboard';
import { Rotor, serializeRotorWiring, swapRotorWiringTargets } from './rotor';
import { pairReflectorLetters, Reflector } from './reflector';
import { Permutation } from './permutation';
import { BitShifter } from './bit-shifter';
import { BitJoin } from './bit-join';
import { LFSR } from './lfsr';
import {
  buildIdentitySBoxTable,
  buildReverseSBoxTable,
  SBox,
  serializeSBoxTable,
  swapSBoxEntry,
} from './s-box';
import {
  buildIdentityPermutationOrder,
  buildReversePermutationOrder,
  serializePermutationOrder,
  swapPermutationOrderPositions,
} from './permutation';
import { BitOutput } from './bit-output';
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

describe('HexSource', () => {
  it('converts a hex string into bits', () => {
    const result = HexSource.evaluate({}, { value: 'A3' });
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 0, 0, 0, 1, 1] });
  });

  it('ignores whitespace and normalizes lower-case input', () => {
    const result = HexSource.evaluate({}, { value: ' de ad ' });
    expect(result.out).toEqual({
      type: 'bits',
      value: [1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
    });
  });

  it('throws on non-hex input', () => {
    expect(() => HexSource.evaluate({}, { value: 'G1' })).toThrow();
  });

  it('tickSlice emits one byte of hex per tick', () => {
    const sliced = HexSource.tickSlice({ value: 'A3F0' }, 1);
    const result = HexSource.evaluate({}, sliced);
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 1, 1, 0, 0, 0, 0] });
  });
});

describe('AsciiSource', () => {
  it('converts ASCII text into bytes of bits', () => {
    const result = AsciiSource.evaluate({}, { value: 'AZ' });
    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0],
    });
  });

  it('throws on non-ASCII input', () => {
    expect(() => AsciiSource.evaluate({}, { value: 'é' })).toThrow();
  });

  it('tickSlice emits one ASCII character per tick', () => {
    const sliced = AsciiSource.tickSlice({ value: 'AZ' }, 1);
    const result = AsciiSource.evaluate({}, sliced);
    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 1, 0, 1, 1, 0, 1, 0],
    });
  });
});

describe('BaudotSource', () => {
  it('converts letters-mode baudot text into 5-bit codewords', () => {
    const result = BaudotSource.evaluate({}, { value: 'AB' });
    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 1, 1, 1, 1, 0, 0, 1],
    });
  });

  it('throws on unsupported punctuation', () => {
    expect(() => BaudotSource.evaluate({}, { value: 'A!' })).toThrow();
  });

  it('tickSlice emits one baudot character per tick', () => {
    const sliced = BaudotSource.tickSlice({ value: 'AB' }, 1);
    const result = BaudotSource.evaluate({}, sliced);
    expect(result.out).toEqual({
      type: 'bits',
      value: [1, 1, 0, 0, 1],
    });
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

  it('throws on multi-character input', () => {
    expect(() =>
      SymbolToBits.evaluate({ in: { type: 'symbol', value: 'AB' } }, {}),
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

describe('BitsToHex', () => {
  it('converts bits into an uppercase hex string', () => {
    const result = BitsToHex.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 0, 0, 0, 1, 1] } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'A3' });
  });

  it('throws if the input width is not divisible by 4', () => {
    expect(() =>
      BitsToHex.evaluate({ in: { type: 'bits', value: [1, 0, 1] } }, {}),
    ).toThrow();
  });
});

describe('BitsToAscii', () => {
  it('converts bits into ASCII text', () => {
    const result = BitsToAscii.evaluate(
      { in: { type: 'bits', value: [0, 1, 0, 0, 0, 0, 0, 1] } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'A' });
  });

  it('throws if the input width is not divisible by 8', () => {
    expect(() =>
      BitsToAscii.evaluate({ in: { type: 'bits', value: [0, 1, 0, 0] } }, {}),
    ).toThrow();
  });

  it('throws on byte values outside 7-bit ASCII', () => {
    expect(() =>
      BitsToAscii.evaluate(
        { in: { type: 'bits', value: [1, 0, 0, 0, 0, 0, 0, 0] } },
        {},
      ),
    ).toThrow();
  });
});

describe('BitsToBaudot', () => {
  it('converts 5-bit codewords into baudot letters', () => {
    const result = BitsToBaudot.evaluate(
      { in: { type: 'bits', value: [0, 0, 0, 1, 1, 1, 1, 0, 0, 1] } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'AB' });
  });

  it('renders unknown control codewords as ?', () => {
    const result = BitsToBaudot.evaluate(
      { in: { type: 'bits', value: [1, 1, 1, 1, 1] } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: '?' });
  });

  it('throws when bit width is not divisible by 5', () => {
    expect(() =>
      BitsToBaudot.evaluate({ in: { type: 'bits', value: [0, 0, 0, 1] } }, {}),
    ).toThrow();
  });
});

describe('Plugboard', () => {
  it('passes through unpaired letters', () => {
    const result = Plugboard.evaluate(
      { in: { type: 'symbol', value: 'A' } },
      { wiring: buildIdentityPlugboardWiring() },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'A' });
  });

  it('swaps paired letters reciprocally', () => {
    const wiring = pairPlugboardLetters(buildIdentityPlugboardWiring(), 'A', 'Z');
    const result = Plugboard.evaluate(
      { in: { type: 'symbol', value: 'A' } },
      { wiring },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'Z' });
    expect(
      Plugboard.evaluate({ in: { type: 'symbol', value: 'Z' } }, { wiring }).out,
    ).toEqual({ type: 'symbol', value: 'A' });
  });

  it('repairs displaced partners when re-pairing letters', () => {
    const first = pairPlugboardLetters(buildIdentityPlugboardWiring(), 'A', 'Z');
    const second = pairPlugboardLetters(first, 'A', 'B');
    expect(second[0]).toBe('B');
    expect(second[1]).toBe('A');
    expect(second[25]).toBe('Z');
  });

  it('can unpair a selected letter back to passthrough', () => {
    const paired = pairPlugboardLetters(buildIdentityPlugboardWiring(), 'C', 'D');
    const unpaired = unpairPlugboardLetter(paired, 'C');
    expect(unpaired[2]).toBe('C');
    expect(unpaired[3]).toBe('D');
  });

  it('serializes plugboard wiring for raw editing', () => {
    const wiring = pairPlugboardLetters(buildIdentityPlugboardWiring(), 'A', 'Z');
    expect(serializePlugboardWiring(wiring)).toContain('Z');
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

describe('Boolean operators', () => {
  const left: Signal = { type: 'bits', value: [1, 0, 1, 0] };
  const right: Signal = { type: 'bits', value: [1, 1, 0, 0] };

  it('AND combines equal-width words', () => {
    expect(AND.evaluate({ a: left, b: right }, {}).out).toEqual({
      type: 'bits',
      value: [1, 0, 0, 0],
    });
  });

  it('OR combines equal-width words', () => {
    expect(OR.evaluate({ a: left, b: right }, {}).out).toEqual({
      type: 'bits',
      value: [1, 1, 1, 0],
    });
  });

  it('NOT flips bits in place', () => {
    expect(NOT.evaluate({ in: left }, {}).out).toEqual({
      type: 'bits',
      value: [0, 1, 0, 1],
    });
  });
});

describe('Word arithmetic operators', () => {
  it('ADD mod 2^n uses big-endian fixed-width arithmetic', () => {
    const result = AddMod.evaluate(
      {
        a: { type: 'bits', value: [1, 0, 1, 0, 0, 0, 1, 1] },
        b: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 0, 1] },
      },
      {},
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [1, 0, 1, 0, 0, 1, 0, 0],
    });
  });

  it('ADD mod 2^n wraps on overflow', () => {
    const result = AddMod.evaluate(
      {
        a: { type: 'bits', value: [1, 1, 1, 1, 1, 1, 1, 1] },
        b: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 0, 1] },
      },
      {},
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 0, 0, 0, 0, 0],
    });
  });

  it('SUB mod 2^n wraps on underflow', () => {
    const result = SubMod.evaluate(
      {
        a: { type: 'bits', value: [0, 0, 0, 0] },
        b: { type: 'bits', value: [0, 0, 0, 1] },
      },
      {},
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [1, 1, 1, 1],
    });
  });

  it('Modulo reduces a bit word while preserving width', () => {
    const result = Modulo.evaluate({ in: { type: 'bits', value: [1, 0, 1, 0] } }, { modulus: 3 });

    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 1],
    });
  });

  it('Modulo rejects a modulus larger than the input word range', () => {
    expect(() =>
      Modulo.evaluate({ in: { type: 'bits', value: [1, 0, 1, 0] } }, { modulus: 32 }),
    ).toThrow('word range');
  });
});

describe('Control primitives', () => {
  it('Counter emits a big-endian fixed-width word and wraps on advance', () => {
    expect(Counter.evaluate({}, { width: 3, value: 5, step: 2 }).out).toEqual({
      type: 'bits',
      value: [1, 0, 1],
    });

    expect(Counter.advance({ width: 3, value: 7, step: 2 }, 0)).toMatchObject({
      value: 1,
    });
  });

  it('Equals emits an active control bit only for exact word matches', () => {
    expect(
      Equals.evaluate(
        {
          a: { type: 'bits', value: [0, 1, 1] },
          b: { type: 'bits', value: [0, 1, 1] },
        },
        {},
      ).out,
    ).toEqual({
      type: 'bits',
      value: [1],
    });

    expect(
      Equals.evaluate(
        {
          a: { type: 'bits', value: [0, 1, 1] },
          b: { type: 'bits', value: [1, 0, 0] },
        },
        {},
      ).out,
    ).toEqual({
      type: 'bits',
      value: [0],
    });
  });

  it('AtLeast compares big-endian unsigned words', () => {
    expect(
      AtLeast.evaluate(
        {
          a: { type: 'bits', value: [1, 0, 0] },
          b: { type: 'bits', value: [0, 1, 1] },
        },
        {},
      ).out,
    ).toEqual({
      type: 'bits',
      value: [1],
    });

    expect(
      AtLeast.evaluate(
        {
          a: { type: 'bits', value: [0, 1, 0] },
          b: { type: 'bits', value: [0, 1, 1] },
        },
        {},
      ).out,
    ).toEqual({
      type: 'bits',
      value: [0],
    });
  });

  it('Gate passes bits only when the control input is the active pulse [1]', () => {
    expect(
      Gate.evaluate(
        {
          in: { type: 'bits', value: [1, 0, 1, 1] },
          control: { type: 'bits', value: [1] },
        },
        {},
      ).out,
    ).toEqual({
      type: 'bits',
      value: [1, 0, 1, 1],
    });

    expect(
      Gate.evaluate(
        {
          in: { type: 'bits', value: [1, 0, 1, 1] },
          control: { type: 'bits', value: [0] },
        },
        {},
      ).out,
    ).toEqual({
      type: 'bits',
      value: [0, 0, 0, 0],
    });
  });
});

describe('BitOutput', () => {
  it('accepts a bits signal and produces no outputs', () => {
    const result = BitOutput.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 0, 1, 1, 0, 0] } },
      {},
    );
    expect(result).toEqual({});
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

  it('allows compression by selecting fewer indexes than the input width', () => {
    const result = Permutation.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 1, 0] } },
      { order: '4,2,0' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [0, 1, 1] });
  });

  it('allows expansion-style output by selecting more indexes than the input width', () => {
    const result = Permutation.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 1, 0] } },
      { order: '0,1,2,3,4,0,2' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1, 0, 1, 1] });
    });

  it('throws when any permutation index is outside the input width', () => {
    expect(() =>
      Permutation.evaluate(
        { in: { type: 'bits', value: [1, 0, 1, 1, 0] } },
        { order: '0,1,5' },
      ),
    ).toThrow();
  });

  it('builds identity and reverse teaching orders', () => {
    expect(buildIdentityPermutationOrder(5)).toEqual([0, 1, 2, 3, 4]);
    expect(buildReversePermutationOrder(5)).toEqual([4, 3, 2, 1, 0]);
  });

  it('swaps output positions without changing the underlying multiset of indexes', () => {
    expect(swapPermutationOrderPositions([2, 0, 4, 1, 3], 1, 3)).toEqual([2, 1, 4, 0, 3]);
  });

  it('serializes permutation orders back into the stored param format', () => {
    expect(serializePermutationOrder([2, 0, 4, 1, 3])).toBe('2,0,4,1,3');
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

describe('BitJoin', () => {
  it('concatenates two bit signals in order', () => {
    const result = BitJoin.evaluate(
      {
        a: { type: 'bits', value: [1, 0, 1, 0] },
        b: { type: 'bits', value: [0, 1, 1, 1] },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 0, 0, 1, 1, 1] });
  });
});

describe('LFSR', () => {
  it('emits a deterministic keystream from seed and taps', () => {
    const result = LFSR.evaluate(
      {},
      { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 6 },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 0, 0, 1, 1] });
  });

  it('returns an empty stream when output length is zero', () => {
    const result = LFSR.evaluate(
      {},
      { seed: [1, 0, 0, 1, 1], taps: '0,2', outputLength: 0 },
    );
    expect(result.out).toEqual({ type: 'bits', value: [] });
  });

  it('throws when a tap index is outside the register width', () => {
    expect(() =>
      LFSR.evaluate({}, { seed: [1, 0, 1], taps: '0,4', outputLength: 4 }),
    ).toThrow();
  });
});

describe('SBox', () => {
  it('substitutes a single nibble through the configured table', () => {
    const result = SBox.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 0] } },
      { table: '14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [0, 1, 1, 0] });
  });

  it('substitutes multiple nibbles in one bit stream', () => {
    const result = SBox.evaluate(
      { in: { type: 'bits', value: [0, 0, 0, 1, 1, 1, 1, 1] } },
      { table: '14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [0, 1, 0, 0, 0, 1, 1, 1] });
  });

  it('throws when the input width is not a multiple of the table chunk width', () => {
    expect(() =>
      SBox.evaluate(
        { in: { type: 'bits', value: [1, 0, 1] } },
        { table: '14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7' },
      ),
    ).toThrow();
  });

  it('supports 8-bit substitution tables', () => {
    const identityTable = Array.from({ length: 256 }, (_, index) => index).join(',');
    const result = SBox.evaluate(
      {
        in: {
          type: 'bits',
          value: [1, 0, 1, 0, 1, 1, 0, 0],
        },
      },
      { table: identityTable },
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [1, 0, 1, 0, 1, 1, 0, 0],
    });
  });

  it('throws when the table length is not a power of two', () => {
    expect(() =>
      SBox.evaluate(
        { in: { type: 'bits', value: [1, 0, 1, 0] } },
        { table: '0,1,2' },
      ),
    ).toThrow();
  });

  it('builds bounded identity and reverse teaching tables', () => {
    expect(buildIdentitySBoxTable(16)).toEqual(Array.from({ length: 16 }, (_, index) => index));
    expect(buildReverseSBoxTable(16)).toEqual(Array.from({ length: 16 }, (_, index) => 15 - index));
  });

  it('swaps authored entries while preserving the permutation', () => {
    expect(swapSBoxEntry([0, 1, 2, 3], 1, 3)).toEqual([0, 3, 2, 1]);
  });

  it('serializes authored tables back into the stored param format', () => {
    expect(serializeSBoxTable([14, 4, 13, 1])).toBe('14,4,13,1');
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

  it('swaps rotor target letters while preserving the permutation', () => {
    expect(swapRotorWiringTargets(identityWiring, 0, 25)).toEqual(
      'ZBCDEFGHIJKLMNOPQRSTUVWXYA'.split(''),
    );
  });

  it('serializes rotor wiring back into the raw editable form', () => {
    expect(serializeRotorWiring(shiftedWiring)).toBe('B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z, A');
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

  it('re-pairs reflector sockets while preserving involution', () => {
    const rewired = pairReflectorLetters(reverseWiring, 'A', 'B');
    expect(rewired[0]).toBe('B');
    expect(rewired[1]).toBe('A');
    expect(rewired[24]).toBe('Z');
    expect(rewired[25]).toBe('Y');
  });
});
