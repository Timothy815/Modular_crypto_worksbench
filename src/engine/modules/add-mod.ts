import type { ModuleDef } from '../types';
import {
  bitsToUnsignedBigInt,
  expectBitsSignal,
  requireEqualBitWidths,
  unsignedBigIntToBits,
} from './bit-word';

export const AddMod: ModuleDef = {
  id: 'AddMod',
  name: 'ADD mod 2^n',
  inputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const left = expectBitsSignal(inputs.a, 'ADD mod 2^n');
    const right = expectBitsSignal(inputs.b, 'ADD mod 2^n');
    const width = requireEqualBitWidths(left, right, 'ADD mod 2^n');

    if (width === 0) {
      return { out: { type: 'bits', value: [] } };
    }

    const modulus = 1n << BigInt(width);
    const result = (bitsToUnsignedBigInt(left) + bitsToUnsignedBigInt(right)) % modulus;

    return {
      out: { type: 'bits', value: unsignedBigIntToBits(result, width) },
    };
  },
};
