import { describe, expect, it } from 'vitest';
import { TextInput } from './text-input';
import { KeyInput } from './key-input';
import { BitSource } from './bit-source';
import { AsciiSource } from './ascii-source';
import { BaudotSource } from './baudot-source';
import { HexSource } from './hex-source';
import { IV } from './iv';
import { Nonce } from './nonce';
import { Salt } from './salt';
import { SymbolToBits } from './symbol-to-bits';
import { BitsToAscii } from './bits-to-ascii';
import { BitsToBaudot } from './bits-to-baudot';
import { BitsToSymbol } from './bits-to-symbol';
import { BitsToHex } from './bits-to-hex';
import { AddMod } from './add-mod';
import { AND } from './and';
import { AtLeast } from './at-least';
import { Counter } from './counter';
import { Demux } from './demux';
import { Equals } from './equals';
import { Gate } from './gate';
import { Majority } from './majority';
import { Mux } from './mux';
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
import {
  Rotor,
  isRotorTurnoverActive,
  parseRotorNotches,
  serializeRotorWiring,
  swapRotorWiringTargets,
} from './rotor';
import { pairReflectorLetters, Reflector } from './reflector';
import { Permutation } from './permutation';
import { SymbolPermutation } from './symbol-permutation';
import { SymbolWindow } from './symbol-window';
import { BitShifter } from './bit-shifter';
import { BitJoin } from './bit-join';
import { BitSplit } from './bit-split';
import { BitPad } from './bit-pad';
import { BitUnpad } from './bit-unpad';
import { BitWindow } from './bit-window';
import { GreaterThan } from './greater-than';
import { ModExp } from './mod-exp';
import { ModInverse } from './mod-inverse';
import { MulMod } from './mul-mod';
import { LFSR } from './lfsr';
import {
  buildIdentitySBoxTable,
  buildReverseSBoxTable,
  SBox,
  serializeSBoxTable,
  swapSBoxEntry,
} from './s-box';
import {
  buildInversePermutationOrder,
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

describe('Protocol material sources', () => {
  it('pads IV values on the right to the declared width', () => {
    const result = IV.evaluate({}, { value: 'A3', width: 16 });
    expect(result.out).toEqual({
      type: 'bits',
      value: [1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    });
  });

  it('normalizes lower-case nonce hex and preserves exact width', () => {
    const result = Nonce.evaluate({}, { value: '0f', width: 8 });
    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 0, 1, 1, 1, 1],
    });
  });

  it('throws when a salt value exceeds the declared width', () => {
    expect(() => Salt.evaluate({}, { value: 'A3F1', width: 8 })).toThrow(
      /exceeds declared width/i,
    );
  });
});

describe('Majority', () => {
  it('emits 1 when at least two inputs are active', () => {
    const result = Majority.evaluate(
      {
        a: { type: 'bits', value: [1] },
        b: { type: 'bits', value: [0] },
        c: { type: 'bits', value: [1] },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [1] });
  });

  it('emits 0 when fewer than two inputs are active', () => {
    const result = Majority.evaluate(
      {
        a: { type: 'bits', value: [1] },
        b: { type: 'bits', value: [0] },
        c: { type: 'bits', value: [0] },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [0] });
  });

  it('throws when any input is wider than one bit', () => {
    expect(() =>
      Majority.evaluate(
        {
          a: { type: 'bits', value: [1, 0] },
          b: { type: 'bits', value: [0] },
          c: { type: 'bits', value: [1] },
        },
        {},
      ),
    ).toThrow(/1-bit word/i);
  });
});

describe('Mux', () => {
  it('emits input a when select is 0', () => {
    const result = Mux.evaluate(
      {
        select: { type: 'bits', value: [0] },
        a: { type: 'bits', value: [1] },
        b: { type: 'bits', value: [0] },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [1] });
  });

  it('emits input b when select is 1', () => {
    const result = Mux.evaluate(
      {
        select: { type: 'bits', value: [1] },
        a: { type: 'bits', value: [1] },
        b: { type: 'bits', value: [0] },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [0] });
  });

  it('throws when one input is wider than one bit', () => {
    expect(() =>
      Mux.evaluate(
        {
          select: { type: 'bits', value: [1] },
          a: { type: 'bits', value: [1, 0] },
          b: { type: 'bits', value: [0] },
        },
        {},
      ),
    ).toThrow(/1-bit word/i);
  });
});

describe('Demux', () => {
  it('routes the input bit to output a when select is 0', () => {
    const result = Demux.evaluate(
      {
        select: { type: 'bits', value: [0] },
        in: { type: 'bits', value: [1] },
      },
      {},
    );
    expect(result.a).toEqual({ type: 'bits', value: [1] });
    expect(result.b).toEqual({ type: 'bits', value: [0] });
  });

  it('routes the input bit to output b when select is 1', () => {
    const result = Demux.evaluate(
      {
        select: { type: 'bits', value: [1] },
        in: { type: 'bits', value: [1] },
      },
      {},
    );
    expect(result.a).toEqual({ type: 'bits', value: [0] });
    expect(result.b).toEqual({ type: 'bits', value: [1] });
  });

  it('throws when the routed input is wider than one bit', () => {
    expect(() =>
      Demux.evaluate(
        {
          select: { type: 'bits', value: [1] },
          in: { type: 'bits', value: [1, 0] },
        },
        {},
      ),
    ).toThrow(/1-bit word/i);
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

  it('builds inverse routing for a one-to-one permutation order', () => {
    expect(buildInversePermutationOrder([3, 0, 4, 1, 2])).toEqual([1, 3, 4, 0, 2]);
  });
});

describe('SymbolPermutation', () => {
  it('reorders symbol positions without changing the symbols', () => {
    const result = SymbolPermutation.evaluate(
      { in: { type: 'symbol', value: 'MATH' } },
      { order: '2,0,3,1' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'TMHA' });
  });

  it('supports identity symbol order', () => {
    const result = SymbolPermutation.evaluate(
      { in: { type: 'symbol', value: 'CODE' } },
      { order: '0,1,2,3' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'CODE' });
  });

  it('throws when the input is not a symbol signal', () => {
    expect(() =>
      SymbolPermutation.evaluate(
        { in: { type: 'bits', value: [1, 0, 1, 0] } },
        { order: '0,1,2,3' },
      ),
    ).toThrow('SymbolPermutation expects a symbol signal');
  });

  it('throws when the order length does not match the input length', () => {
    expect(() =>
      SymbolPermutation.evaluate(
        { in: { type: 'symbol', value: 'ABCD' } },
        { order: '0,1,2' },
      ),
    ).toThrow('must match the input symbol length');
  });

  it('throws when the order is not a true permutation', () => {
    expect(() =>
      SymbolPermutation.evaluate(
        { in: { type: 'symbol', value: 'ABCD' } },
        { order: '0,0,2,3' },
      ),
    ).toThrow('must use each input index exactly once');
  });
});

describe('SymbolWindow', () => {
  it('extracts a contiguous symbol window', () => {
    const result = SymbolWindow.evaluate(
      { in: { type: 'symbol', value: 'MATH' } },
      { start: 1, width: 2 },
    );

    expect(result.out).toEqual({ type: 'symbol', value: 'AT' });
  });

  it('extracts a leading symbol window', () => {
    const result = SymbolWindow.evaluate(
      { in: { type: 'symbol', value: 'MATH' } },
      { start: 0, width: 3 },
    );

    expect(result.out).toEqual({ type: 'symbol', value: 'MAT' });
  });

  it('throws when the window exceeds the input length', () => {
    expect(() =>
      SymbolWindow.evaluate(
        { in: { type: 'symbol', value: 'MATH' } },
        { start: 3, width: 2 },
      ),
    ).toThrow(/exceeds input length/i);
  });

  it('throws on non-symbol input', () => {
    expect(() =>
      SymbolWindow.evaluate(
        { in: { type: 'bits', value: [1, 0, 1, 0] } as never },
        { start: 0, width: 2 },
      ),
    ).toThrow(/expects a symbol signal/i);
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
  const enigmaWiring = 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split('');

  it('passes through with identity wiring at position 0', () => {
    const result = Rotor.evaluate(
      { in: { type: 'symbol', value: 'A' } },
      { wiring: identityWiring, position: 0 },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'A' });
    expect(result.turnover).toEqual({ type: 'bits', value: [0] });
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

  it('applies ring offset separately from position', () => {
    const result = Rotor.evaluate(
      { in: { type: 'symbol', value: 'A' } },
      { wiring: enigmaWiring, position: 0, ringOffset: 1 },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'K' });
  });

  it('parses one or more notch letters into alphabet indexes', () => {
    expect(parseRotorNotches('Q, E')).toEqual([16, 4]);
  });

  it('marks turnover active when the visible position matches a notch', () => {
    expect(isRotorTurnoverActive(16, 0, [16])).toBe(true);
    expect(isRotorTurnoverActive(15, 0, [16])).toBe(false);
  });

  it('shifts the visible turnover position when ring offset changes', () => {
    const result = Rotor.evaluate(
      { in: { type: 'symbol', value: 'A' } },
      { wiring: identityWiring, position: 15, ringOffset: 1, notches: 'Q' },
    );
    expect(result.turnover).toEqual({ type: 'bits', value: [1] });
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

describe('BitSplit', () => {
  it('splits a 16-bit input into two 8-bit halves', () => {
    const input = [1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1];
    const result = BitSplit.evaluate(
      { in: { type: 'bits', value: input } },
      { leftWidth: 8 },
    );
    expect(result.left).toEqual({ type: 'bits', value: [1, 0, 1, 0, 1, 0, 1, 0] });
    expect(result.right).toEqual({ type: 'bits', value: [0, 1, 0, 1, 0, 1, 0, 1] });
  });

  it('splits with asymmetric widths', () => {
    const input = [1, 1, 0, 0, 1, 0, 1, 0];
    const result = BitSplit.evaluate(
      { in: { type: 'bits', value: input } },
      { leftWidth: 3 },
    );
    expect(result.left).toEqual({ type: 'bits', value: [1, 1, 0] });
    expect(result.right).toEqual({ type: 'bits', value: [0, 1, 0, 1, 0] });
  });

  it('throws when leftWidth exceeds input length', () => {
    expect(() =>
      BitSplit.evaluate(
        { in: { type: 'bits', value: [1, 0, 1, 0] } },
        { leftWidth: 8 },
      ),
    ).toThrow('exceeds input length');
  });

  it('throws on non-bits input', () => {
    expect(() =>
      BitSplit.evaluate(
        { in: { type: 'symbol', value: 'A' } },
        { leftWidth: 4 },
      ),
    ).toThrow('bits');
  });

  it('round-trips with BitJoin', () => {
    const original = [1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0];
    const split = BitSplit.evaluate(
      { in: { type: 'bits', value: original } },
      { leftWidth: 8 },
    );
    const joined = BitJoin.evaluate(
      { a: split.left, b: split.right },
      {},
    );
    expect(joined.out).toEqual({ type: 'bits', value: original });
  });
});

describe('BitPad', () => {
  it('pads a short vector to the target width with zeros on the right', () => {
    const result = BitPad.evaluate(
      { in: { type: 'bits', value: [1, 0, 1] } },
      { targetWidth: 8 },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 0, 0, 0, 0, 0] });
  });

  it('pads on the left when side is left', () => {
    const result = BitPad.evaluate(
      { in: { type: 'bits', value: [1, 0, 1] } },
      { targetWidth: 8, side: 'left' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [0, 0, 0, 0, 0, 1, 0, 1] });
  });

  it('pads with ones when padBit is 1', () => {
    const result = BitPad.evaluate(
      { in: { type: 'bits', value: [0, 1] } },
      { targetWidth: 4, padBit: '1' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [0, 1, 1, 1] });
  });

  it('passes through when input already meets target width', () => {
    const result = BitPad.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 0] } },
      { targetWidth: 4 },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 0] });
  });

  it('passes through when input exceeds target width', () => {
    const result = BitPad.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 0, 1, 1] } },
      { targetWidth: 4 },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 0, 1, 1] });
  });

  it('throws on non-bits input', () => {
    expect(() =>
      BitPad.evaluate(
        { in: { type: 'symbol', value: 'A' } },
        { targetWidth: 8 },
      ),
    ).toThrow('bits');
  });
});

describe('BitWindow', () => {
  it('extracts a contiguous visible window from a bit bus', () => {
    const result = BitWindow.evaluate(
      { in: { type: 'bits', value: [1, 1, 0, 0, 1, 0, 1, 1] } },
      { start: 2, width: 4 },
    );

    expect(result.out).toEqual({ type: 'bits', value: [0, 0, 1, 0] });
  });

  it('extracts the leading window when start is zero', () => {
    const result = BitWindow.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 1, 0, 0, 1, 0] } },
      { start: 0, width: 3 },
    );

    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1] });
  });

  it('throws when the requested window exceeds input length', () => {
    expect(() =>
      BitWindow.evaluate(
        { in: { type: 'bits', value: [1, 0, 1, 1] } },
        { start: 2, width: 4 },
      ),
    ).toThrow('exceeds input length');
  });

  it('throws when the input is not a bits signal', () => {
    expect(() =>
      BitWindow.evaluate(
        { in: { type: 'symbol', value: 'ABCD' } },
        { start: 0, width: 2 },
      ),
    ).toThrow('BitWindow expects a bits signal');
  });
});

describe('MulMod', () => {
  it('multiplies two bit words modulo 2^n', () => {
    // 3 * 5 = 15 in 8-bit: [0,0,0,0,1,1,1,1]
    const result = MulMod.evaluate(
      {
        a: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 1, 1] },
        b: { type: 'bits', value: [0, 0, 0, 0, 0, 1, 0, 1] },
      },
      {},
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 0, 1, 1, 1, 1],
    });
  });

  it('wraps on overflow', () => {
    // 200 * 2 = 400, mod 256 = 144 = [1,0,0,1,0,0,0,0]
    const result = MulMod.evaluate(
      {
        a: { type: 'bits', value: [1, 1, 0, 0, 1, 0, 0, 0] },
        b: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 1, 0] },
      },
      {},
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [1, 0, 0, 1, 0, 0, 0, 0],
    });
  });

  it('returns zero for empty inputs', () => {
    const result = MulMod.evaluate(
      { a: { type: 'bits', value: [] }, b: { type: 'bits', value: [] } },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [] });
  });
});

describe('GreaterThan', () => {
  it('emits 1 when a > b', () => {
    const result = GreaterThan.evaluate(
      {
        a: { type: 'bits', value: [1, 0, 1, 0] },
        b: { type: 'bits', value: [0, 1, 0, 1] },
      },
      {},
    );

    expect(result.out).toEqual({ type: 'bits', value: [1] });
  });

  it('emits 0 when a === b', () => {
    const result = GreaterThan.evaluate(
      {
        a: { type: 'bits', value: [0, 1, 0, 1] },
        b: { type: 'bits', value: [0, 1, 0, 1] },
      },
      {},
    );

    expect(result.out).toEqual({ type: 'bits', value: [0] });
  });

  it('emits 0 when a < b', () => {
    const result = GreaterThan.evaluate(
      {
        a: { type: 'bits', value: [0, 0, 1, 0] },
        b: { type: 'bits', value: [1, 0, 0, 0] },
      },
      {},
    );

    expect(result.out).toEqual({ type: 'bits', value: [0] });
  });
});

describe('BitUnpad', () => {
  it('strips right-side padding to recover the original width', () => {
    const result = BitUnpad.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 0, 0, 0, 0, 0] } },
      { originalWidth: 3, side: 'right' },
    );

    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1] });
  });

  it('strips left-side padding to recover the original width', () => {
    const result = BitUnpad.evaluate(
      { in: { type: 'bits', value: [0, 0, 0, 0, 0, 1, 0, 1] } },
      { originalWidth: 3, side: 'left' },
    );

    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1] });
  });

  it('passes through unchanged when input is already at or below original width', () => {
    const result = BitUnpad.evaluate(
      { in: { type: 'bits', value: [1, 0, 1] } },
      { originalWidth: 4, side: 'right' },
    );

    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1] });
  });

  it('defaults to right-side stripping', () => {
    const result = BitUnpad.evaluate(
      { in: { type: 'bits', value: [1, 1, 0, 0, 0, 0] } },
      { originalWidth: 2 },
    );

    expect(result.out).toEqual({ type: 'bits', value: [1, 1] });
  });
});

describe('ModExp', () => {
  it('computes base^exp mod modulus', () => {
    // 3^5 mod 13 = 243 mod 13 = 9 = [0,0,0,0,1,0,0,1]
    const result = ModExp.evaluate(
      {
        base: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 1, 1] },
        exp: { type: 'bits', value: [0, 0, 0, 0, 0, 1, 0, 1] },
      },
      { modulus: 13 },
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 0, 1, 0, 0, 1],
    });
  });

  it('handles exponent of zero (result is 1)', () => {
    const result = ModExp.evaluate(
      {
        base: { type: 'bits', value: [0, 0, 0, 0, 0, 1, 1, 1] },
        exp: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 0, 0] },
      },
      { modulus: 13 },
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 0, 0, 0, 0, 1],
    });
  });

  it('supports toy RSA round-trip: encrypt then decrypt', () => {
    // Toy RSA: p=3, q=5, n=15, phi=8, e=3, d=3 (since 3*3=9, 9 mod 8=1)
    // Encrypt: 2^3 mod 15 = 8
    const encrypted = ModExp.evaluate(
      {
        base: { type: 'bits', value: [0, 0, 1, 0] },
        exp: { type: 'bits', value: [0, 0, 1, 1] },
      },
      { modulus: 15 },
    );

    expect(encrypted.out).toEqual({ type: 'bits', value: [1, 0, 0, 0] });

    // Decrypt: 8^3 mod 15 = 512 mod 15 = 2
    const decrypted = ModExp.evaluate(
      {
        base: encrypted.out as { type: 'bits'; value: number[] },
        exp: { type: 'bits', value: [0, 0, 1, 1] },
      },
      { modulus: 15 },
    );

    expect(decrypted.out).toEqual({ type: 'bits', value: [0, 0, 1, 0] });
  });

  it('throws when modulus exceeds base word range', () => {
    expect(() =>
      ModExp.evaluate(
        {
          base: { type: 'bits', value: [1, 0, 1, 0] },
          exp: { type: 'bits', value: [0, 0, 1, 0] },
        },
        { modulus: 32 },
      ),
    ).toThrow('word range');
  });
});

describe('ModInverse', () => {
  it('computes modular inverse', () => {
    // 3^(-1) mod 7 = 5 (since 3*5=15, 15 mod 7=1)
    const result = ModInverse.evaluate(
      { in: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 1, 1] } },
      { modulus: 7 },
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 0, 0, 1, 0, 1],
    });
  });

  it('throws when no inverse exists', () => {
    // 6 has no inverse mod 4 (GCD is 2)
    expect(() =>
      ModInverse.evaluate(
        { in: { type: 'bits', value: [0, 1, 1, 0] } },
        { modulus: 4 },
      ),
    ).toThrow('no inverse');
  });

  it('verifies round-trip: value * inverse ≡ 1 mod m', () => {
    // 11^(-1) mod 13
    const inverse = ModInverse.evaluate(
      { in: { type: 'bits', value: [0, 0, 0, 0, 1, 0, 1, 1] } },
      { modulus: 13 },
    );

    const invValue = (inverse.out as { type: 'bits'; value: number[] }).value;
    // Verify: 11 * inverse mod 13 = 1
    const product = MulMod.evaluate(
      {
        a: { type: 'bits', value: [0, 0, 0, 0, 1, 0, 1, 1] },
        b: { type: 'bits', value: invValue },
      },
      {},
    );

    const productNum = (product.out as { type: 'bits'; value: number[] }).value;
    // Take mod 13
    const check = Modulo.evaluate(
      { in: { type: 'bits', value: productNum } },
      { modulus: 13 },
    );

    expect(check.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 0, 0, 0, 0, 1],
    });
  });
});
