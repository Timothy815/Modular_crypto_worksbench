import type { ModuleDef } from '../types';
import {
  bitsToUnsignedNumber,
  expectBitsSignal,
  requireEqualBitWidths,
  unsignedNumberToBits,
} from './bit-word';

export const MulMod: ModuleDef = {
  id: 'MulMod',
  name: 'MUL mod 2^n',
  inputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const left = expectBitsSignal(inputs.a, 'MUL mod 2^n');
    const right = expectBitsSignal(inputs.b, 'MUL mod 2^n');
    const width = requireEqualBitWidths(left, right, 'MUL mod 2^n');

    if (width === 0) {
      return { out: { type: 'bits', value: [] } };
    }

    const modulus = 2 ** width;
    const result = (bitsToUnsignedNumber(left) * bitsToUnsignedNumber(right)) % modulus;

    return {
      out: { type: 'bits', value: unsignedNumberToBits(result, width) },
    };
  },
};
