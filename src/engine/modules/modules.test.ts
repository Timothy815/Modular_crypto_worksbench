import { describe, expect, it } from 'vitest';
import { TextInput } from './text-input';
import { KeyInput } from './key-input';
import { BitSource } from './bit-source';
import { BitSequenceInput } from './bit-sequence-input';
import { AsciiSource } from './ascii-source';
import { AsciiSequenceInput } from './ascii-sequence-input';
import { AsciiSequenceToBits } from './ascii-sequence-to-bits';
import { AsciiSequenceToTicked } from './ascii-sequence-to-ticked';
import { AsciiCharToBits } from './ascii-char-to-bits';
import { TickedSymbolsToSequence } from './ticked-symbols-to-sequence';
import { TickedBitsToSequence } from './ticked-bits-to-sequence';
import { BaudotSource } from './baudot-source';
import { HexSource } from './hex-source';
import { HexSequenceInput } from './hex-sequence-input';
import { HexSequenceToBits } from './hex-sequence-to-bits';
import { HexDigitToBits } from './hex-digit-to-bits';
import { IV } from './iv';
import { Nonce } from './nonce';
import { Salt } from './salt';
import { SymbolToBits } from './symbol-to-bits';
import { BitsToInteger } from './bits-to-integer';
import { IntegerToBits } from './integer-to-bits';
import { BitsToAscii } from './bits-to-ascii';
import { BitsToAsciiChar } from './bits-to-ascii-char';
import { BitsToBaudot } from './bits-to-baudot';
import { BitsToSymbol } from './bits-to-symbol';
import { BitsToHex } from './bits-to-hex';
import { BitsToHexDigit } from './bits-to-hex-digit';
import {
  decodePolluxFractionation,
  encodePolluxControlledFractionation,
  encodePolluxFractionation,
  parsePolluxAlphabet,
  PolluxControlledFractionation,
  PolluxFractionation,
  PolluxInverse,
} from './pollux-fractionation';
import { HexToAscii } from './hex-to-ascii';
import { AsciiToHex } from './ascii-to-hex';
import { AddMod } from './add-mod';
import { FieldAdd } from './field-add';
import { FieldSub } from './field-sub';
import { FieldMul } from './field-mul';
import { FieldInverse } from './field-inverse';
import { PointSource } from './point-source';
import { PointOnCurve } from './point-on-curve';
import { PointNegate } from './point-negate';
import { PointAdd } from './point-add';
import { PointDouble } from './point-double';
import { PointOrder } from './point-order';
import { PointEquals } from './point-equals';
import { ScalarMultiply } from './scalar-multiply';
import { ChallengeCombine } from './challenge-combine';
import { ScalarLinearCombine } from './scalar-linear-combine';
import { AND } from './and';
import { AtLeast } from './at-least';
import { Counter } from './counter';
import { Demux } from './demux';
import { Equals } from './equals';
import { Gate } from './gate';
import { Majority } from './majority';
import { Mux } from './mux';
import { Modulo } from './modulo';
import { MultiRouter } from './multi-router';
import { MultiSelector } from './multi-selector';
import { NOT } from './not';
import { OR } from './or';
import { SubMod } from './sub-mod';
import { XOR } from './xor';
import {
  buildIdentityPlugboardWiring,
  normalizePlugboardReciprocalWiring,
  pairPlugboardLetters,
  Plugboard,
  serializePlugboardWiring,
  unpairPlugboardLetter,
} from './plugboard';
import {
  Rotor,
  isRotorTurnoverActive,
  parseRotorWiring,
  parseRotorNotches,
  serializeRotorWiring,
  swapRotorWiringTargets,
  traverseRotor,
} from './rotor';
import { RotorReverse } from './rotor-reverse';
import {
  normalizeReflectorReciprocalWiring,
  pairReflectorLetters,
  Reflector,
} from './reflector';
import { Permutation } from './permutation';
import { SymbolPermutation } from './symbol-permutation';
import { SymbolWindow } from './symbol-window';
import { PadSymbolToMatch } from './pad-symbol-to-match';
import { RequireSymbolLengthMatch } from './require-symbol-length-match';
import { RepeatSymbolToLength } from './repeat-symbol-to-length';
import { RepeatSymbolToMatch } from './repeat-symbol-to-match';
import { TruncateSymbolSequence } from './truncate-symbol-sequence';
import { TruncateSymbolToMatch } from './truncate-symbol-to-match';
import { SymbolSequenceInput } from './symbol-sequence-input';
import { SymbolSequenceToTicked } from './symbol-sequence-to-ticked';
import { BitsSequenceToTicked } from './bits-sequence-to-ticked';
import { BitShifter } from './bit-shifter';
import { ByteRotate } from './byte-rotate';
import { ByteSwap } from './byte-swap';
import { BitJoin } from './bit-join';
import { BitSplit } from './bit-split';
import { BitPad } from './bit-pad';
import { BitUnpad } from './bit-unpad';
import { BitWindow } from './bit-window';
import { PadBitsToMatch } from './pad-bits-to-match';
import { RequireBitsLengthMatch } from './require-bits-length-match';
import { RepeatBitsToLength } from './repeat-bits-to-length';
import { RepeatBitsToMatch } from './repeat-bits-to-match';
import { BroadcastBits } from './broadcast-bits';
import { TruncateBitsSequence } from './truncate-bits-sequence';
import { TruncateBitsToMatch } from './truncate-bits-to-match';
import { PadBitsSequence } from './pad-bits-sequence';
import { GreaterThan } from './greater-than';
import { ModExp } from './mod-exp';
import { ModInverse } from './mod-inverse';
import { MulMod } from './mul-mod';
import { bitsToUnsignedNumber, unsignedNumberToBits } from './bit-word';
import { LFSR } from './lfsr';
import {
  buildIdentitySBoxTable,
  buildReverseSBoxTable,
  SBox,
  serializeSBoxTable,
  setSBoxEntry,
  swapSBoxEntry,
  swapSBoxEntriesByIndex,
} from './s-box';
import {
  buildInversePermutationOrder,
  buildIdentityPermutationOrder,
  buildReversePermutationOrder,
  rotatePermutationOrder,
  serializePermutationOrder,
  swapPermutationOrderPositions,
} from './permutation';
import { BitOutput } from './bit-output';
import { IntegerOutput } from './integer-output';
import { TextOutput } from './text-output';
import { HexOutput } from './hex-output';
import { BaudotOutput } from './baudot-output';
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

describe('AsciiCharToBits', () => {
  it('encodes one ASCII character into one 8-bit word', () => {
    const result = AsciiCharToBits.evaluate({ in: { type: 'symbol', value: 'A' } }, {});
    expect(result.out).toEqual({ type: 'bits', value: [0, 1, 0, 0, 0, 0, 0, 1] });
  });

  it('throws on multi-character input', () => {
    expect(() => AsciiCharToBits.evaluate({ in: { type: 'symbol', value: 'AB' } }, {})).toThrow(
      /exactly one ASCII character/i,
    );
  });
});

describe('BitsToAsciiChar', () => {
  it('decodes one 8-bit word into one ASCII character', () => {
    const result = BitsToAsciiChar.evaluate(
      { in: { type: 'bits', value: [0, 1, 0, 0, 0, 0, 0, 1] } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'A' });
  });

  it('throws on non-byte widths', () => {
    expect(() => BitsToAsciiChar.evaluate({ in: { type: 'bits', value: [1, 0, 1] } }, {})).toThrow(
      /exactly 8 bits/i,
    );
  });
});

describe('HexDigitToBits', () => {
  it('encodes one hex digit into one nibble', () => {
    const result = HexDigitToBits.evaluate({ in: { type: 'symbol', value: 'a' } }, {});
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 0] });
  });

  it('throws on invalid hex input', () => {
    expect(() => HexDigitToBits.evaluate({ in: { type: 'symbol', value: 'G' } }, {})).toThrow(
      /hexadecimal characters/i,
    );
  });
});

describe('BitsToHexDigit', () => {
  it('decodes one nibble into one uppercase hex digit', () => {
    const result = BitsToHexDigit.evaluate({ in: { type: 'bits', value: [1, 0, 1, 0] } }, {});
    expect(result.out).toEqual({ type: 'symbol', value: 'A' });
  });

  it('throws on non-nibble widths', () => {
    expect(() => BitsToHexDigit.evaluate({ in: { type: 'bits', value: [1, 0, 1] } }, {})).toThrow(
      /exactly 4 bits/i,
    );
  });
});

describe('BitsToInteger', () => {
  it('converts a bit word into an exact decimal integer signal', () => {
    const result = BitsToInteger.evaluate({ in: { type: 'bits', value: [1, 0, 1, 0] } }, {});
    expect(result.out).toEqual({ type: 'integer', value: '10' });
  });
});

describe('IntegerToBits', () => {
  it('converts an integer signal into a fixed-width bit word', () => {
    const result = IntegerToBits.evaluate({ in: { type: 'integer', value: '10' } }, { width: 8 });
    expect(result.out).toEqual({ type: 'bits', value: [0, 0, 0, 0, 1, 0, 1, 0] });
  });

  it('rejects integers that do not fit in the requested width', () => {
    expect(() =>
      IntegerToBits.evaluate({ in: { type: 'integer', value: '10' } }, { width: 3 }),
    ).toThrow(/cannot fit/i);
  });
});

describe('FieldAdd', () => {
  it('adds two field elements modulo a visible prime p', () => {
    const result = FieldAdd.evaluate(
      {
        a: { type: 'integer', value: '3' },
        b: { type: 'integer', value: '4' },
      },
      { modulus: 5 },
    );

    expect(result.out).toEqual({ type: 'integer', value: '2' });
  });
});

describe('FieldSub', () => {
  it('subtracts two field elements modulo a visible prime p', () => {
    const result = FieldSub.evaluate(
      {
        a: { type: 'integer', value: '1' },
        b: { type: 'integer', value: '4' },
      },
      { modulus: 5 },
    );

    expect(result.out).toEqual({ type: 'integer', value: '2' });
  });
});

describe('FieldMul', () => {
  it('multiplies two field elements modulo a visible prime p', () => {
    const result = FieldMul.evaluate(
      {
        a: { type: 'integer', value: '3' },
        b: { type: 'integer', value: '4' },
      },
      { modulus: 5 },
    );

    expect(result.out).toEqual({ type: 'integer', value: '2' });
  });

  it('rejects inputs outside the declared field range', () => {
    expect(() =>
      FieldMul.evaluate(
        {
          a: { type: 'integer', value: '5' },
          b: { type: 'integer', value: '1' },
        },
        { modulus: 5 },
      ),
    ).toThrow(/range 0\.\.4/i);
  });
});

describe('FieldInverse', () => {
  it('finds the multiplicative inverse of a nonzero field element', () => {
    const result = FieldInverse.evaluate({ in: { type: 'integer', value: '3' } }, { modulus: 5 });
    expect(result.out).toEqual({ type: 'integer', value: '2' });
  });

  it('fails visibly for zero', () => {
    expect(() => FieldInverse.evaluate({ in: { type: 'integer', value: '0' } }, { modulus: 5 })).toThrow(
      /undefined for 0 modulo 5/i,
    );
  });
});

describe('PointSource', () => {
  it('constructs a visible point on a declared pedagogical curve', () => {
    const result = PointSource.evaluate({}, { p: 17, a: 2, b: 3, x: 5, y: 6 });
    expect(result.out).toEqual({
      type: 'ec-point',
      value: {
        kind: 'affine',
        curve: { p: 17, a: 2, b: 3 },
        x: '5',
        y: '6',
      },
    });
  });
});

describe('PointOnCurve', () => {
  it('emits a one-bit success result for a valid point on the declared curve', () => {
    const result = PointOnCurve.evaluate(
      {
        in: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '5',
            y: '6',
          },
        },
      },
      { p: 17, a: 2, b: 3 },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1] });
  });
});

describe('PointNegate', () => {
  it('negates a point within the same curve context', () => {
    const result = PointNegate.evaluate(
      {
        in: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '5',
            y: '6',
          },
        },
      },
      { p: 17, a: 2, b: 3 },
    );
    expect(result.out).toEqual({
      type: 'ec-point',
      value: {
        kind: 'affine',
        curve: { p: 17, a: 2, b: 3 },
        x: '5',
        y: '11',
      },
    });
  });
});

describe('PointAdd', () => {
  it('adds a point to its inverse and reaches visible infinity', () => {
    const result = PointAdd.evaluate(
      {
        a: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '5',
            y: '6',
          },
        },
        b: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '5',
            y: '11',
          },
        },
      },
      { p: 17, a: 2, b: 3 },
    );
    expect(result.out).toEqual({
      type: 'ec-point',
      value: {
        kind: 'infinity',
        curve: { p: 17, a: 2, b: 3 },
      },
    });
  });

  it('handles the equal-input case honestly as doubling', () => {
    const result = PointAdd.evaluate(
      {
        a: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '5',
            y: '6',
          },
        },
        b: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '5',
            y: '6',
          },
        },
      },
      { p: 17, a: 2, b: 3 },
    );
    expect(result.out).toEqual({
      type: 'ec-point',
      value: {
        kind: 'affine',
        curve: { p: 17, a: 2, b: 3 },
        x: '15',
        y: '12',
      },
    });
  });

  it('fails visibly on cross-curve mismatches', () => {
    expect(() =>
      PointAdd.evaluate(
        {
          a: {
            type: 'ec-point',
            value: {
              kind: 'affine',
              curve: { p: 17, a: 2, b: 3 },
              x: '5',
              y: '6',
            },
          },
          b: {
            type: 'ec-point',
            value: {
              kind: 'affine',
              curve: { p: 17, a: 4, b: 3 },
              x: '5',
              y: '5',
            },
          },
        },
        { p: 17, a: 2, b: 3 },
      ),
    ).toThrow(/declared curve/i);
  });
});

describe('PointDouble', () => {
  it('doubles a visible point on the same curve', () => {
    const result = PointDouble.evaluate(
      {
        in: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '5',
            y: '6',
          },
        },
      },
      { p: 17, a: 2, b: 3 },
    );
    expect(result.out).toEqual({
      type: 'ec-point',
      value: {
        kind: 'affine',
        curve: { p: 17, a: 2, b: 3 },
        x: '15',
        y: '12',
      },
    });
  });
});

describe('PointEquals', () => {
  it('emits a one-bit match result for equal points on the same curve', () => {
    const result = PointEquals.evaluate(
      {
        a: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '13',
            y: '13',
          },
        },
        b: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '13',
            y: '13',
          },
        },
      },
      { p: 17, a: 2, b: 3 },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1] });
  });

  it('emits an inactive bit for unequal points on the same curve', () => {
    const result = PointEquals.evaluate(
      {
        a: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '13',
            y: '13',
          },
        },
        b: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '5',
            y: '6',
          },
        },
      },
      { p: 17, a: 2, b: 3 },
    );
    expect(result.out).toEqual({ type: 'bits', value: [0] });
  });
});

describe('ScalarMultiply', () => {
  it('computes repeated point action for a nontrivial scalar', () => {
    const result = ScalarMultiply.evaluate(
      {
        scalar: { type: 'integer', value: '3' },
        point: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '5',
            y: '6',
          },
        },
      },
      { p: 17, a: 2, b: 3 },
    );
    expect(result.out).toEqual({
      type: 'ec-point',
      value: {
        kind: 'affine',
        curve: { p: 17, a: 2, b: 3 },
        x: '13',
        y: '13',
      },
    });
  });

  it('maps 0 * P to visible infinity', () => {
    const result = ScalarMultiply.evaluate(
      {
        scalar: { type: 'integer', value: '0' },
        point: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '5',
            y: '6',
          },
        },
      },
      { p: 17, a: 2, b: 3 },
    );
    expect(result.out).toEqual({
      type: 'ec-point',
      value: {
        kind: 'infinity',
        curve: { p: 17, a: 2, b: 3 },
      },
    });
  });
});

describe('PointOrder', () => {
  it('computes the observable order of a visible point on a pedagogical curve', () => {
    const result = PointOrder.evaluate(
      {
        point: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 0, b: 13 },
            x: '5',
            y: '6',
          },
        },
      },
      { p: 17, a: 0, b: 13 },
    );

    expect(result.out).toEqual({
      type: 'integer',
      value: '9',
    });
  });

  it('shows that different points on the same curve can have different observable orders', () => {
    const result = PointOrder.evaluate(
      {
        point: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 0, b: 13 },
            x: '2',
            y: '2',
          },
        },
      },
      { p: 17, a: 0, b: 13 },
    );

    expect(result.out).toEqual({
      type: 'integer',
      value: '18',
    });
  });

  it('treats visible infinity as order 1', () => {
    const result = PointOrder.evaluate(
      {
        point: {
          type: 'ec-point',
          value: {
            kind: 'infinity',
            curve: { p: 17, a: 0, b: 13 },
          },
        },
      },
      { p: 17, a: 0, b: 13 },
    );

    expect(result.out).toEqual({
      type: 'integer',
      value: '1',
    });
  });
});

describe('ChallengeCombine', () => {
  it('derives one bounded pedagogical challenge from visible R, P, and m inputs', () => {
    const result = ChallengeCombine.evaluate(
      {
        commitment: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '3',
            y: '11',
          },
        },
        publicKey: {
          type: 'ec-point',
          value: {
            kind: 'affine',
            curve: { p: 17, a: 2, b: 3 },
            x: '12',
            y: '2',
          },
        },
        message: { type: 'integer', value: '6' },
      },
      { p: 17, a: 2, b: 3, n: 11 },
    );

    expect(result.out).toEqual({
      type: 'integer',
      value: '1',
    });
  });

  it('rejects infinity as a commitment input', () => {
    expect(() =>
      ChallengeCombine.evaluate(
        {
          commitment: {
            type: 'ec-point',
            value: {
              kind: 'infinity',
              curve: { p: 17, a: 2, b: 3 },
            },
          },
          publicKey: {
            type: 'ec-point',
            value: {
              kind: 'affine',
              curve: { p: 17, a: 2, b: 3 },
              x: '12',
              y: '2',
            },
          },
          message: { type: 'integer', value: '6' },
        },
        { p: 17, a: 2, b: 3, n: 11 },
      ),
    ).toThrow(/affine point/i);
  });
});

describe('ScalarLinearCombine', () => {
  it('computes the visible Schnorr-style response scalar modulo n', () => {
    const result = ScalarLinearCombine.evaluate(
      {
        nonce: { type: 'integer', value: '4' },
        challenge: { type: 'integer', value: '1' },
        private: { type: 'integer', value: '3' },
      },
      { n: 11 },
    );

    expect(result.out).toEqual({
      type: 'integer',
      value: '7',
    });
  });

  it('rejects scalar inputs that exceed the declared subgroup order range', () => {
    expect(() =>
      ScalarLinearCombine.evaluate(
        {
          nonce: { type: 'integer', value: '11' },
          challenge: { type: 'integer', value: '1' },
          private: { type: 'integer', value: '3' },
        },
        { n: 11 },
      ),
    ).toThrow(/scalar range/i);
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

describe('RepeatSymbolToLength', () => {
  it('repeats a short symbol key until the configured length', () => {
    const result = RepeatSymbolToLength.evaluate(
      { in: { type: 'symbol', value: 'KEY' } },
      { targetLength: 10 },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'KEYKEYKEYK' });
  });

  it('throws on an empty symbol sequence', () => {
    expect(() =>
      RepeatSymbolToLength.evaluate(
        { in: { type: 'symbol', value: '' } },
        { targetLength: 5 },
      ),
    ).toThrow(/empty symbol sequence/i);
  });
});

describe('RepeatSymbolToMatch', () => {
  it('repeats a short symbol key until it matches the reference length', () => {
    const result = RepeatSymbolToMatch.evaluate(
      {
        in: { type: 'symbol', value: 'KEY' },
        reference: { type: 'symbol', value: 'HELLOWORLD' },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'KEYKEYKEYK' });
  });

  it('returns an empty sequence when the reference is empty', () => {
    const result = RepeatSymbolToMatch.evaluate(
      {
        in: { type: 'symbol', value: 'KEY' },
        reference: { type: 'symbol', value: '' },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: '' });
  });

  it('throws on an empty symbol sequence when the reference is non-empty', () => {
    expect(() =>
      RepeatSymbolToMatch.evaluate(
        {
          in: { type: 'symbol', value: '' },
          reference: { type: 'symbol', value: 'HELLO' },
        },
        {},
      ),
    ).toThrow(/non-empty input sequence/i);
  });
});

describe('TruncateSymbolSequence', () => {
  it('keeps the left side of a symbol sequence by default', () => {
    const result = TruncateSymbolSequence.evaluate(
      { in: { type: 'symbol', value: 'HELLOWORLD' } },
      { targetLength: 5, side: 'left' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'HELLO' });
  });

  it('can preserve the right side of a symbol sequence', () => {
    const result = TruncateSymbolSequence.evaluate(
      { in: { type: 'symbol', value: 'HELLOWORLD' } },
      { targetLength: 5, side: 'right' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'WORLD' });
  });
});

describe('TruncateSymbolToMatch', () => {
  it('keeps the left side when the input is longer than the reference', () => {
    const result = TruncateSymbolToMatch.evaluate(
      {
        in: { type: 'symbol', value: 'HELLOWORLD' },
        reference: { type: 'symbol', value: 'KEY' },
      },
      { side: 'left' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'HEL' });
  });

  it('keeps the right side when requested', () => {
    const result = TruncateSymbolToMatch.evaluate(
      {
        in: { type: 'symbol', value: 'HELLOWORLD' },
        reference: { type: 'symbol', value: 'KEY' },
      },
      { side: 'right' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'RLD' });
  });

  it('keeps the input unchanged when it is already shorter than the reference', () => {
    const result = TruncateSymbolToMatch.evaluate(
      {
        in: { type: 'symbol', value: 'KEY' },
        reference: { type: 'symbol', value: 'HELLOWORLD' },
      },
      { side: 'left' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'KEY' });
  });
});

describe('PadSymbolToMatch', () => {
  it('pads on the left to match the reference length', () => {
    const result = PadSymbolToMatch.evaluate(
      {
        in: { type: 'symbol', value: 'KEY' },
        reference: { type: 'symbol', value: 'HELLOWORLD' },
      },
      { side: 'left', padChar: '_' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: '_______KEY' });
  });

  it('pads on the right to match the reference length', () => {
    const result = PadSymbolToMatch.evaluate(
      {
        in: { type: 'symbol', value: 'KEY' },
        reference: { type: 'symbol', value: 'HELLOWORLD' },
      },
      { side: 'right', padChar: 'X' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'KEYXXXXXXX' });
  });

  it('keeps the input unchanged when it is already longer than the reference', () => {
    const result = PadSymbolToMatch.evaluate(
      {
        in: { type: 'symbol', value: 'HELLOWORLD' },
        reference: { type: 'symbol', value: 'KEY' },
      },
      { side: 'right', padChar: ' ' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'HELLOWORLD' });
  });
});

describe('RequireSymbolLengthMatch', () => {
  it('passes the input through unchanged when the reference length matches', () => {
    const result = RequireSymbolLengthMatch.evaluate(
      {
        in: { type: 'symbol', value: 'ATTACK' },
        reference: { type: 'symbol', value: 'SECRET' },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'ATTACK' });
  });

  it('throws when the input and reference lengths differ', () => {
    expect(() =>
      RequireSymbolLengthMatch.evaluate(
        {
          in: { type: 'symbol', value: 'ATTACKNOW' },
          reference: { type: 'symbol', value: 'KEY' },
        },
        {},
      ),
    ).toThrow(
      'RequireSymbolLengthMatch mismatch: input 9 chars; reference 3 chars — input is 6 chars longer. Use RepeatSymbolToMatch, PadSymbolToMatch, or TruncateSymbolToMatch if the graph should repair the mismatch explicitly instead.',
    );
  });
});

describe('Symbol sequence foundation', () => {
  it('emits a whole symbol sequence explicitly', () => {
    const result = SymbolSequenceInput.evaluate({}, { value: 'KEY' });
    expect(result.out).toEqual({ type: 'symbol', value: 'KEY' });
  });

  it('reads one symbol per tick from a repeated sequence', () => {
    const repeated = RepeatSymbolToLength.evaluate(
      { in: { type: 'symbol', value: 'KEY' } },
      { targetLength: 10 },
    );

    const tick0 = SymbolSequenceToTicked.evaluate(
      { in: repeated.out, clock: { type: 'bits', value: [1] } },
      { index: 0, wrap: true },
    );
    const tick1 = SymbolSequenceToTicked.evaluate(
      { in: repeated.out, clock: { type: 'bits', value: [1] } },
      { index: 1, wrap: true },
    );
    const tick2 = SymbolSequenceToTicked.evaluate(
      { in: repeated.out, clock: { type: 'bits', value: [1] } },
      { index: 2, wrap: true },
    );

    expect(tick0.out).toEqual({ type: 'symbol', value: 'K' });
    expect(tick1.out).toEqual({ type: 'symbol', value: 'E' });
    expect(tick2.out).toEqual({ type: 'symbol', value: 'Y' });
  });
});

describe('ASCII sequence foundation', () => {
  it('emits a whole ASCII sequence explicitly', () => {
    const result = AsciiSequenceInput.evaluate({}, { value: 'KEY' });
    expect(result.out).toEqual({ type: 'symbol', value: 'KEY' });
  });

  it('encodes a whole ASCII sequence directly into one bit buffer', () => {
    const result = AsciiSequenceToBits.evaluate(
      { in: { type: 'symbol', value: 'AB' } },
      {},
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
    });
  });

  it('rejects non-ASCII characters in a whole ASCII sequence bridge', () => {
    expect(() => AsciiSequenceToBits.evaluate({ in: { type: 'symbol', value: 'A\x80' } }, {})).toThrow(
      'AsciiSequenceToBits accepts only 7-bit ASCII characters',
    );
  });

  it('reads one ASCII character per tick from a whole sequence', () => {
    const tick0 = AsciiSequenceToTicked.evaluate(
      { in: { type: 'symbol', value: 'KEY' }, clock: { type: 'bits', value: [1] } },
      { index: 0, wrap: true },
    );
    const tick1 = AsciiSequenceToTicked.evaluate(
      { in: { type: 'symbol', value: 'KEY' }, clock: { type: 'bits', value: [1] } },
      { index: 1, wrap: true },
    );
    const tick2 = AsciiSequenceToTicked.evaluate(
      { in: { type: 'symbol', value: 'KEY' }, clock: { type: 'bits', value: [1] } },
      { index: 2, wrap: true },
    );

    expect(tick0.out).toEqual({ type: 'symbol', value: 'K' });
    expect(tick1.out).toEqual({ type: 'symbol', value: 'E' });
    expect(tick2.out).toEqual({ type: 'symbol', value: 'Y' });
  });
});

describe('Ticked-to-sequence collectors', () => {
  it('collects scalar symbols into one visible sequence', () => {
    const result = TickedSymbolsToSequence.evaluate(
      { in: { type: 'symbol', value: 'Y' }, clock: { type: 'bits', value: [1] } },
      { collected: 'KE', count: 2 },
    );

    expect(result.out).toEqual({ type: 'symbol', value: 'KEY' });
  });

  it('advances the symbol collector only on active clock pulses', () => {
    const held = TickedSymbolsToSequence.advance(
      { collected: 'KE', count: 2 },
      0,
      { in: { type: 'symbol', value: 'Y' }, clock: { type: 'bits', value: [0] } },
    );
    const advanced = TickedSymbolsToSequence.advance(
      { collected: 'KE', count: 2 },
      0,
      { in: { type: 'symbol', value: 'Y' }, clock: { type: 'bits', value: [1] } },
    );

    expect(held).toEqual({ collected: 'KE', count: 2 });
    expect(advanced).toEqual({ collected: 'KEY', count: 3 });
  });

  it('collects scalar bit words into one visible bit sequence', () => {
    const result = TickedBitsToSequence.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 1] }, clock: { type: 'bits', value: [1] } },
      { collected: [0, 0, 1, 1], count: 4 },
    );

    expect(result.out).toEqual({ type: 'bits', value: [0, 0, 1, 1, 1, 0, 1, 1] });
  });

  it('advances the bit collector by appending the current scalar word', () => {
    const advanced = TickedBitsToSequence.advance(
      { collected: [0, 0, 1, 1], count: 4 },
      0,
      { in: { type: 'bits', value: [1, 0, 1, 1] }, clock: { type: 'bits', value: [1] } },
    );

    expect(advanced).toEqual({
      collected: [0, 0, 1, 1, 1, 0, 1, 1],
      count: 8,
    });
  });
});

describe('RepeatBitsToLength', () => {
  it('repeats a bit mask until the configured width', () => {
    const result = RepeatBitsToLength.evaluate(
      { in: { type: 'bits', value: [1, 0, 1] } },
      { targetLength: 8 },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1, 0, 1, 1, 0] });
  });

  it('throws on an empty bit sequence', () => {
    expect(() =>
      RepeatBitsToLength.evaluate(
        { in: { type: 'bits', value: [] } },
        { targetLength: 8 },
      ),
    ).toThrow(/empty bit sequence/i);
  });
});

describe('RepeatBitsToMatch', () => {
  it('repeats a bit mask until it matches the reference width', () => {
    const result = RepeatBitsToMatch.evaluate(
      {
        in: { type: 'bits', value: [1, 0, 1] },
        reference: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 0, 0] },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1, 0, 1, 1, 0] });
  });

  it('returns an empty sequence when the reference is empty', () => {
    const result = RepeatBitsToMatch.evaluate(
      {
        in: { type: 'bits', value: [1, 0, 1] },
        reference: { type: 'bits', value: [] },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [] });
  });

  it('throws on an empty bit sequence when the reference is non-empty', () => {
    expect(() =>
      RepeatBitsToMatch.evaluate(
        {
          in: { type: 'bits', value: [] },
          reference: { type: 'bits', value: [0, 1, 0, 1] },
        },
        {},
      ),
    ).toThrow(/non-empty input sequence/i);
  });
});

describe('TruncateBitsSequence', () => {
  it('keeps the left side of a bit sequence by default', () => {
    const result = TruncateBitsSequence.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 1, 0, 0] } },
      { targetLength: 4, side: 'left' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1] });
  });

  it('can preserve the right side of a bit sequence', () => {
    const result = TruncateBitsSequence.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 1, 0, 0] } },
      { targetLength: 4, side: 'right' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 0, 0] });
  });
});

describe('TruncateBitsToMatch', () => {
  it('keeps the left side when the input is longer than the reference', () => {
    const result = TruncateBitsToMatch.evaluate(
      {
        in: { type: 'bits', value: [1, 0, 1, 1, 0, 0, 1, 1] },
        reference: { type: 'bits', value: [0, 0, 0, 0] },
      },
      { side: 'left' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1] });
  });

  it('keeps the right side when requested', () => {
    const result = TruncateBitsToMatch.evaluate(
      {
        in: { type: 'bits', value: [1, 0, 1, 1, 0, 0, 1, 1] },
        reference: { type: 'bits', value: [0, 0, 0, 0] },
      },
      { side: 'right' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [0, 0, 1, 1] });
  });

  it('keeps the input unchanged when it is already shorter than the reference', () => {
    const result = TruncateBitsToMatch.evaluate(
      {
        in: { type: 'bits', value: [1, 0, 1] },
        reference: { type: 'bits', value: [0, 0, 0, 0, 0, 0] },
      },
      { side: 'left' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1] });
  });
});

describe('PadBitsToMatch', () => {
  it('pads on the left to match the reference width', () => {
    const result = PadBitsToMatch.evaluate(
      {
        in: { type: 'bits', value: [1, 0, 1] },
        reference: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 0, 0] },
      },
      { side: 'left', padBit: '0' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [0, 0, 0, 0, 0, 1, 0, 1] });
  });

  it('pads on the right to match the reference width', () => {
    const result = PadBitsToMatch.evaluate(
      {
        in: { type: 'bits', value: [1, 0, 1] },
        reference: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 0, 0] },
      },
      { side: 'right', padBit: '1' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1, 1, 1, 1, 1] });
  });

  it('keeps the input unchanged when it is already longer than the reference', () => {
    const result = PadBitsToMatch.evaluate(
      {
        in: { type: 'bits', value: [1, 0, 1, 1, 0, 0, 1, 1] },
        reference: { type: 'bits', value: [0, 0, 0, 0] },
      },
      { side: 'right', padBit: '0' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1, 0, 0, 1, 1] });
  });
});

describe('RequireBitsLengthMatch', () => {
  it('passes the input through unchanged when the reference width matches', () => {
    const result = RequireBitsLengthMatch.evaluate(
      {
        in: { type: 'bits', value: [1, 0, 1, 1, 0, 0, 1, 1] },
        reference: { type: 'bits', value: [0, 0, 0, 0, 1, 1, 1, 1] },
      },
      {},
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1, 0, 0, 1, 1] });
  });

  it('throws when the input and reference widths differ', () => {
    expect(() =>
      RequireBitsLengthMatch.evaluate(
        {
          in: { type: 'bits', value: [1, 0, 1] },
          reference: { type: 'bits', value: [0, 0, 0, 0] },
        },
        {},
      ),
    ).toThrow(
      'RequireBitsLengthMatch mismatch: input 3 bits; reference 4 bits — input is 1 bit shorter. Use RepeatBitsToMatch, PadBitsToMatch, or TruncateBitsToMatch if the graph should repair the mismatch explicitly instead.',
    );
  });
});

describe('PadBitsSequence', () => {
  it('pads a bit sequence on the right by default', () => {
    const result = PadBitsSequence.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 1] } },
      { targetLength: 8, side: 'right', padBit: '0' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1, 0, 0, 0, 0] });
  });

  it('pads a bit sequence on the left with explicit ones', () => {
    const result = PadBitsSequence.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 1] } },
      { targetLength: 8, side: 'left', padBit: '1' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 1, 1, 1, 0, 1, 1] });
  });
});

describe('Bit and hex sequence foundation', () => {
  it('emits a whole bit sequence explicitly', () => {
    const result = BitSequenceInput.evaluate({}, { stream: [1, 0, 1, 1, 0, 0, 1, 1] });
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 1, 0, 0, 1, 1] });
  });

  it('emits a whole hex-authored bit sequence using the shared hex parser', () => {
    const result = HexSequenceInput.evaluate({}, { value: ' a3 f9 ' });
    expect(result.out).toEqual({
      type: 'bits',
      value: [1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1],
    });
  });

  it('converts a whole in-graph hex sequence back into bits', () => {
    const result = HexSequenceToBits.evaluate({ in: { type: 'symbol', value: ' a3 f9 ' } }, {});
    expect(result.out).toEqual({
      type: 'bits',
      value: [1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1],
    });
  });

  it('reads one fixed-width bit word per tick from a whole bit sequence', () => {
    const result0 = BitsSequenceToTicked.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 1, 0, 0, 1, 1] }, clock: { type: 'bits', value: [1] } },
      { index: 0, wordWidth: 4, wrap: true, remainderMode: 'error' },
    );
    const result1 = BitsSequenceToTicked.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 1, 0, 0, 1, 1] }, clock: { type: 'bits', value: [1] } },
      { index: 1, wordWidth: 4, wrap: true, remainderMode: 'error' },
    );

    expect(result0.out).toEqual({ type: 'bits', value: [1, 0, 1, 1] });
    expect(result1.out).toEqual({ type: 'bits', value: [0, 0, 1, 1] });
  });

  it('defaults to error on incomplete trailing words', () => {
    expect(() =>
      BitsSequenceToTicked.evaluate(
        { in: { type: 'bits', value: [1, 0, 1, 1, 0, 0, 1, 1, 1, 0] }, clock: { type: 'bits', value: [1] } },
        { index: 0, wordWidth: 4, wrap: true, remainderMode: 'error' },
      ),
    ).toThrow(/cannot emit 10 bits as 4-bit words/i);
  });

  it('pads trailing words when remainder mode is pad', () => {
    const result = BitsSequenceToTicked.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 0, 1, 1] }, clock: { type: 'bits', value: [1] } },
      { index: 1, wordWidth: 4, wrap: true, remainderMode: 'pad' },
    );

    expect(result.out).toEqual({ type: 'bits', value: [1, 1, 0, 0] });
  });
});

describe('BroadcastBits', () => {
  it('repeats the full bit pattern by copy count', () => {
    const result = BroadcastBits.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 0, 1, 1, 0, 0] } },
      { copies: 3 },
    );
    expect(result.out).toEqual({
      type: 'bits',
      value: [
        1, 0, 1, 0, 1, 1, 0, 0,
        1, 0, 1, 0, 1, 1, 0, 0,
        1, 0, 1, 0, 1, 1, 0, 0,
      ],
    });
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

describe('MultiRouter', () => {
  it('routes the input word to the selected output for four routes', () => {
    const result = MultiRouter.evaluate(
      {
        select: { type: 'bits', value: [1, 0] },
        in: { type: 'bits', value: [1, 0, 1, 1] },
      },
      { routeCount: '4' },
    );

    expect(result.out0).toEqual({ type: 'bits', value: [0, 0, 0, 0] });
    expect(result.out1).toEqual({ type: 'bits', value: [0, 0, 0, 0] });
    expect(result.out2).toEqual({ type: 'bits', value: [1, 0, 1, 1] });
    expect(result.out3).toEqual({ type: 'bits', value: [0, 0, 0, 0] });
    expect(result.out4).toEqual({ type: 'bits', value: [0, 0, 0, 0] });
    expect(result.out7).toEqual({ type: 'bits', value: [0, 0, 0, 0] });
  });

  it('supports eight-route counter-style routing', () => {
    const result = MultiRouter.evaluate(
      {
        select: { type: 'bits', value: [1, 1, 0] },
        in: { type: 'bits', value: [1] },
      },
      { routeCount: '8' },
    );

    expect(result.out6).toEqual({ type: 'bits', value: [1] });
    expect(result.out0).toEqual({ type: 'bits', value: [0] });
    expect(result.out7).toEqual({ type: 'bits', value: [0] });
  });

  it('throws when the select width does not match route count', () => {
    expect(() =>
      MultiRouter.evaluate(
        {
          select: { type: 'bits', value: [1] },
          in: { type: 'bits', value: [1, 0, 1, 1] },
        },
        { routeCount: '4' },
      ),
    ).toThrow(/2-bit word/i);
  });
});

describe('MultiSelector', () => {
  it('selects the input word at the indexed position for four inputs', () => {
    const result = MultiSelector.evaluate(
      {
        select: { type: 'bits', value: [1, 0] },
        in0: { type: 'bits', value: [1, 1, 1, 1] },
        in1: { type: 'bits', value: [0, 0, 0, 0] },
        in2: { type: 'bits', value: [1, 0, 1, 0] },
        in3: { type: 'bits', value: [0, 1, 0, 1] },
        in4: { type: 'bits', value: [0, 0, 0, 0] },
        in5: { type: 'bits', value: [0, 0, 0, 0] },
        in6: { type: 'bits', value: [0, 0, 0, 0] },
        in7: { type: 'bits', value: [0, 0, 0, 0] },
      },
      { selectCount: '4' },
    );

    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 0] });
  });

  it('selects in0 for select value zero', () => {
    const result = MultiSelector.evaluate(
      {
        select: { type: 'bits', value: [0] },
        in0: { type: 'bits', value: [1, 1] },
        in1: { type: 'bits', value: [0, 0] },
        in2: { type: 'bits', value: [0, 0] },
        in3: { type: 'bits', value: [0, 0] },
        in4: { type: 'bits', value: [0, 0] },
        in5: { type: 'bits', value: [0, 0] },
        in6: { type: 'bits', value: [0, 0] },
        in7: { type: 'bits', value: [0, 0] },
      },
      { selectCount: '2' },
    );

    expect(result.out).toEqual({ type: 'bits', value: [1, 1] });
  });

  it('throws when the select width does not match select count', () => {
    expect(() =>
      MultiSelector.evaluate(
        {
          select: { type: 'bits', value: [1] },
          in0: { type: 'bits', value: [1] },
          in1: { type: 'bits', value: [0] },
          in2: { type: 'bits', value: [0] },
          in3: { type: 'bits', value: [0] },
          in4: { type: 'bits', value: [0] },
          in5: { type: 'bits', value: [0] },
          in6: { type: 'bits', value: [0] },
          in7: { type: 'bits', value: [0] },
        },
        { selectCount: '4' },
      ),
    ).toThrow(/2-bit word/i);
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

describe('PolluxFractionation', () => {
  it('encodes bits with deterministic per-set round-robin selection', () => {
    const result = PolluxFractionation.evaluate(
      { in: { type: 'bits', value: [0, 1, 0, 0, 1, 1] } },
      { zeroAlphabet: 'XQ', oneAlphabet: 'MN' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'XMQXNM' });
  });

  it('accepts comma-separated alphabets and normalizes letters to uppercase', () => {
    const result = PolluxFractionation.evaluate(
      { in: { type: 'bits', value: [1, 0, 1, 0] } },
      { zeroAlphabet: 'a, c', oneAlphabet: 'b, d' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'BADC' });
  });

  it('returns an empty symbol stream for an empty bit input', () => {
    const result = PolluxFractionation.evaluate(
      { in: { type: 'bits', value: [] } },
      { zeroAlphabet: 'XQ', oneAlphabet: 'MN' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: '' });
  });

  it('rejects overlapping alphabets', () => {
    expect(() =>
      PolluxFractionation.evaluate(
        { in: { type: 'bits', value: [0, 1] } },
        { zeroAlphabet: 'AX', oneAlphabet: 'AB' },
      ),
    ).toThrow(/disjoint/i);
  });
});

describe('PolluxControlledFractionation', () => {
  it('encodes bits using explicit selector bits to choose alphabet entries', () => {
    const result = PolluxControlledFractionation.evaluate(
      {
        in: { type: 'bits', value: [0, 1, 0, 1] },
        select: { type: 'bits', value: [1, 0, 1, 1, 0, 0] },
      },
      { zeroAlphabet: 'XQZ', oneAlphabet: 'MNO' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'ZMXO' });
  });

  it('wraps selector bits cyclically when the selector stream is shorter than required', () => {
    const result = PolluxControlledFractionation.evaluate(
      {
        in: { type: 'bits', value: [0, 0, 1] },
        select: { type: 'bits', value: [1, 0] },
      },
      { zeroAlphabet: 'XQZ', oneAlphabet: 'MN' },
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'ZZN' });
  });

  it('roundtrips cleanly with PolluxInverse', () => {
    const encoded = PolluxControlledFractionation.evaluate(
      {
        in: { type: 'bits', value: [0, 1, 1, 0, 1, 0] },
        select: { type: 'bits', value: [1, 1, 0, 0] },
      },
      { zeroAlphabet: 'ABC', oneAlphabet: 'XYZ' },
    );

    const decoded = PolluxInverse.evaluate(
      { in: encoded.out },
      { zeroAlphabet: 'ABC', oneAlphabet: 'XYZ' },
    );

    expect(decoded.out).toEqual({ type: 'bits', value: [0, 1, 1, 0, 1, 0] });
  });

  it('rejects an empty selector stream', () => {
    expect(() =>
      PolluxControlledFractionation.evaluate(
        {
          in: { type: 'bits', value: [0, 1] },
          select: { type: 'bits', value: [] },
        },
        { zeroAlphabet: 'XQ', oneAlphabet: 'MN' },
      ),
    ).toThrow(/non-empty selector bit stream/i);
  });
});

describe('PolluxInverse', () => {
  it('decodes symbols back into bits using alphabet membership', () => {
    const result = PolluxInverse.evaluate(
      { in: { type: 'symbol', value: 'XMQXNM' } },
      { zeroAlphabet: 'XQ', oneAlphabet: 'MN' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [0, 1, 0, 0, 1, 1] });
  });

  it('normalizes lowercase symbols during decode', () => {
    const result = PolluxInverse.evaluate(
      { in: { type: 'symbol', value: 'badc' } },
      { zeroAlphabet: 'a, c', oneAlphabet: 'b, d' },
    );
    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 1, 0] });
  });

  it('rejects symbols outside both alphabets', () => {
    expect(() =>
      PolluxInverse.evaluate(
        { in: { type: 'symbol', value: 'AXZ' } },
        { zeroAlphabet: 'AB', oneAlphabet: 'MN' },
      ),
    ).toThrow(/either alphabet/i);
  });
});

describe('parsePolluxAlphabet', () => {
  it('splits bare strings into single-character symbols', () => {
    expect(parsePolluxAlphabet('XQZ', 'zeroAlphabet')).toEqual(['X', 'Q', 'Z']);
  });

  it('rejects duplicates within a single alphabet', () => {
    expect(() => parsePolluxAlphabet('AAB', 'zeroAlphabet')).toThrow(/duplicate/i);
  });
});

describe('encodePolluxFractionation', () => {
  it('cycles zero and one alphabets independently', () => {
    expect(encodePolluxFractionation([1, 1, 0, 1, 0], ['X', 'Q'], ['M', 'N'])).toBe('MNXMQ');
  });
});

describe('encodePolluxControlledFractionation', () => {
  it('derives symbol choices from selector chunks', () => {
    expect(
      encodePolluxControlledFractionation([0, 1, 0, 1], [1, 0, 1, 1, 0, 0], ['X', 'Q', 'Z'], ['M', 'N', 'O']),
    ).toBe('ZMXO');
  });
});

describe('decodePolluxFractionation', () => {
  it('maps symbols back to bits by membership only', () => {
    expect(decodePolluxFractionation('MNXMQ', ['X', 'Q'], ['M', 'N'])).toEqual([1, 1, 0, 1, 0]);
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

describe('HexToAscii', () => {
  it('decodes hexadecimal bytes into ASCII text', () => {
    const result = HexToAscii.evaluate(
      { in: { type: 'symbol', value: '4142' } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'AB' });
  });

  it('ignores whitespace in hex input', () => {
    const result = HexToAscii.evaluate(
      { in: { type: 'symbol', value: '41 42' } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: 'AB' });
  });

  it('throws on odd-length hex input', () => {
    expect(() => HexToAscii.evaluate({ in: { type: 'symbol', value: '414' } }, {})).toThrow();
  });

  it('throws on non-ascii byte values', () => {
    expect(() => HexToAscii.evaluate({ in: { type: 'symbol', value: '80' } }, {})).toThrow();
  });
});

describe('AsciiToHex', () => {
  it('encodes ASCII text into uppercase hex bytes', () => {
    const result = AsciiToHex.evaluate(
      { in: { type: 'symbol', value: 'AB' } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: '4142' });
  });

  it('encodes single character', () => {
    const result = AsciiToHex.evaluate(
      { in: { type: 'symbol', value: 'A' } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: '41' });
  });

  it('encodes empty string', () => {
    const result = AsciiToHex.evaluate(
      { in: { type: 'symbol', value: '' } },
      {},
    );
    expect(result.out).toEqual({ type: 'symbol', value: '' });
  });

  it('round-trips with HexToAscii', () => {
    const hex = AsciiToHex.evaluate(
      { in: { type: 'symbol', value: 'HELLO' } },
      {},
    );
    const ascii = HexToAscii.evaluate(
      { in: hex.out! },
      {},
    );
    expect(ascii.out).toEqual({ type: 'symbol', value: 'HELLO' });
  });

  it('throws on non-ASCII characters', () => {
    expect(() => AsciiToHex.evaluate({ in: { type: 'symbol', value: '\x80' } }, {})).toThrow();
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

  it('normalizes valid reciprocal plugboard wiring without changing its mapping', () => {
    const wiring = pairPlugboardLetters(buildIdentityPlugboardWiring(), 'A', 'Z');
    expect(normalizePlugboardReciprocalWiring(wiring)).toEqual(wiring);
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
  it('bit-word conversions stay exact above the old 31-bit boundary', () => {
    const width = 40;
    const bits = [1, ...Array.from({ length: width - 2 }, () => 0), 1];

    expect(bitsToUnsignedNumber(bits)).toBe(549755813889);
    expect(unsignedNumberToBits(549755813889, width)).toEqual(bits);
  });

  it('bit-word number conversion rejects unsafe integers', () => {
    expect(() => unsignedNumberToBits(Number.MAX_SAFE_INTEGER + 1, 54)).toThrow(/safe integer/i);
  });

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

  it('ADD mod 2^n stays exact above the old 31-bit coercion boundary', () => {
    const width = 40;
    const left = [1, ...Array.from({ length: width - 1 }, () => 0)];
    const right = [...Array.from({ length: width - 1 }, () => 0), 1];

    const result = AddMod.evaluate(
      {
        a: { type: 'bits', value: left },
        b: { type: 'bits', value: right },
      },
      {},
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [1, ...Array.from({ length: width - 2 }, () => 0), 1],
    });
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

describe('IntegerOutput', () => {
  it('accepts an integer signal and produces no outputs', () => {
    const result = IntegerOutput.evaluate({ in: { type: 'integer', value: '65535' } }, {});
    expect(result).toEqual({});
  });
});

describe('TextOutput', () => {
  it('accepts a symbol signal and produces no outputs', () => {
    const result = TextOutput.evaluate({ in: { type: 'symbol', value: 'HELLO' } }, {});
    expect(result).toEqual({});
  });
});

describe('HexOutput', () => {
  it('accepts a symbol signal and produces no outputs', () => {
    const result = HexOutput.evaluate({ in: { type: 'symbol', value: '4142' } }, {});
    expect(result).toEqual({});
  });
});

describe('BaudotOutput', () => {
  it('accepts a symbol signal and produces no outputs', () => {
    const result = BaudotOutput.evaluate({ in: { type: 'symbol', value: 'ABC' } }, {});
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

  it('rotates permutation orders left and right', () => {
    expect(rotatePermutationOrder([0, 2, 1, 3], 'left')).toEqual([2, 1, 3, 0]);
    expect(rotatePermutationOrder([0, 2, 1, 3], 'right')).toEqual([3, 0, 2, 1]);
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

describe('ByteRotate', () => {
  it('rotates bytes left by one byte', () => {
    const result = ByteRotate.evaluate(
      { in: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0] } },
      { amount: 1, direction: 'left' },
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    });
  });

  it('rotates bytes right by one byte', () => {
    const result = ByteRotate.evaluate(
      { in: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0] } },
      { amount: 1, direction: 'right' },
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    });
  });

  it('matches BitShifter rotate-left by 8 bits', () => {
    const input = { type: 'bits', value: [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0] } as Signal;
    const byteRotated = ByteRotate.evaluate({ in: input }, { amount: 1, direction: 'left' });
    const bitRotated = BitShifter.evaluate({ in: input }, { amount: 8, mode: 'rotate-left' });
    expect(byteRotated.out).toEqual(bitRotated.out);
  });

  it('throws when input width is not divisible by 8', () => {
    expect(() =>
      ByteRotate.evaluate(
        { in: { type: 'bits', value: [1, 0, 1, 0] } },
        { amount: 1, direction: 'left' },
      ),
    ).toThrow(/divisible by 8/i);
  });
});

describe('ByteSwap', () => {
  it('reverses byte order in a 16-bit word', () => {
    const result = ByteSwap.evaluate(
      { in: { type: 'bits', value: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0] } },
      {},
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    });
  });

  it('throws when input width is not divisible by 8', () => {
    expect(() =>
      ByteSwap.evaluate({ in: { type: 'bits', value: [1, 0, 1, 0] } }, {}),
    ).toThrow(/divisible by 8/i);
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

  it('supports explicit 6->4 substitution tables', () => {
    const table = [
      14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7,
      0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8,
      4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0,
      15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13,
    ].join(',');
    const result = SBox.evaluate(
      { in: { type: 'bits', value: [1, 0, 0, 0, 1, 1] } },
      { inputBits: '6', outputBits: '4', table },
    );

    expect(result.out).toEqual({ type: 'bits', value: [1, 0, 0, 0] });
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

  it('swaps authored entries by index when duplicate outputs are allowed', () => {
    expect(swapSBoxEntriesByIndex([0, 0, 1, 1], 1, 2)).toEqual([0, 1, 0, 1]);
  });

  it('sets authored entries directly for non-permutation tables', () => {
    expect(setSBoxEntry([0, 1, 2, 3], 2, 1, 15)).toEqual([0, 1, 1, 3]);
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

  it('parses rotor wiring as a full permutation', () => {
    expect(parseRotorWiring(enigmaWiring)).toEqual(enigmaWiring);
  });

  it('computes reverse traversal through the active rotor wiring', () => {
    expect(traverseRotor('Q', enigmaWiring, 0, 0, 'reverse')).toBe('H');
  });
});

describe('RotorReverse', () => {
  it('maps through the inverse rotor path while keeping turnover semantics', () => {
    const result = RotorReverse.evaluate(
      { in: { type: 'symbol', value: 'Q' } },
      { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'.split(''), position: 0, ringOffset: 0, notches: '' },
    );

    expect(result.out).toEqual({ type: 'symbol', value: 'H' });
    expect(result.turnover).toEqual({ type: 'bits', value: [0] });
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

  it('normalizes valid involutive reflector wiring without changing its mapping', () => {
    expect(normalizeReflectorReciprocalWiring(reverseWiring)).toEqual(reverseWiring);
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

  it('stays exact for products above the old 31-bit conversion boundary', () => {
    const width = 40;
    const left = [0, ...Array.from({ length: width - 3 }, () => 0), 1, 0];
    const right = [0, ...Array.from({ length: width - 3 }, () => 0), 1, 1];

    const result = MulMod.evaluate(
      {
        a: { type: 'bits', value: left },
        b: { type: 'bits', value: right },
      },
      {},
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [...Array.from({ length: width - 3 }, () => 0), 1, 1, 0],
    });
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

  it('handles exact modular exponentiation above the old 31-bit conversion boundary', () => {
    const width = 40;
    const result = ModExp.evaluate(
      {
        base: {
          type: 'bits',
          value: [0, 0, 0, 0, 1, ...Array.from({ length: width - 6 }, () => 0), 1],
        },
        exp: { type: 'bits', value: [0, ...Array.from({ length: width - 3 }, () => 0), 1, 0] },
      },
      { modulus: 97 },
    );

    expect(result.out).toEqual({
      type: 'bits',
      value: [...Array.from({ length: width - 2 }, () => 0), 1, 1],
    });
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
