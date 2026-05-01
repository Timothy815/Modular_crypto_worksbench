import type { ModuleDef } from '../types';
import {
  bitsToUnsignedBigInt,
  expectBitsSignal,
  normalizePositiveSafeInteger,
  unsignedBigIntToBits,
} from './bit-word';

export function validateModuloParam(value: unknown): string | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    return 'Modulo requires a positive safe integer modulus';
  }

  return null;
}

export const Modulo: ModuleDef = {
  id: 'Modulo',
  name: 'Modulo',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    modulus: {
      key: 'modulus',
      label: 'Modulus',
      kind: 'number',
      defaultValue: 16,
      required: true,
      description: 'Positive integer modulus, bounded by the input bit width',
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'Modulo');
    const modulus = BigInt(normalizePositiveSafeInteger(params.modulus, 'Modulo', 'modulus'));
    const maxValue = 1n << BigInt(bits.length);

    if (modulus > maxValue) {
      throw new Error('Modulo requires a modulus no larger than the input word range');
    }

    if (bits.length === 0) {
      return { out: { type: 'bits', value: [] } };
    }

    const result = bitsToUnsignedBigInt(bits) % modulus;
    return {
      out: { type: 'bits', value: unsignedBigIntToBits(result, bits.length) },
    };
  },
};
