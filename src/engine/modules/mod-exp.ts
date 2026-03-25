import type { ModuleDef } from '../types';
import {
  bitsToUnsignedNumber,
  expectBitsSignal,
  normalizePositiveInteger,
  unsignedNumberToBits,
} from './bit-word';

export function validateModExpParam(key: string, value: unknown): string | null {
  if (key !== 'modulus') {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 2) {
    return 'ModExp requires an integer modulus of at least 2.';
  }

  return null;
}

function modularExponentiation(base: number, exp: number, mod: number): number {
  if (mod === 1) {
    return 0;
  }

  let result = 1;
  let b = base % mod;

  let e = exp;
  while (e > 0) {
    if (e % 2 === 1) {
      result = (result * b) % mod;
    }
    e = Math.floor(e / 2);
    b = (b * b) % mod;
  }

  return result;
}

export const ModExp: ModuleDef = {
  id: 'ModExp',
  name: 'MOD EXP',
  inputs: [
    { name: 'base', type: 'bits' },
    { name: 'exp', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    modulus: {
      key: 'modulus',
      label: 'Modulus',
      kind: 'number',
      defaultValue: 15,
      required: true,
      description: 'Integer modulus (>= 2). Result is base^exp mod modulus.',
    },
  },
  evaluate: (inputs, params) => {
    const baseBits = expectBitsSignal(inputs.base, 'ModExp');
    const expBits = expectBitsSignal(inputs.exp, 'ModExp');
    const modulus = normalizePositiveInteger(params.modulus, 'ModExp', 'modulus');

    if (modulus < 2) {
      throw new Error('ModExp requires a modulus of at least 2');
    }

    const width = baseBits.length;

    if (width === 0) {
      return { out: { type: 'bits', value: [] } };
    }

    const maxValue = 2 ** width;
    if (modulus > maxValue) {
      throw new Error('ModExp modulus must not exceed the base word range');
    }

    const base = bitsToUnsignedNumber(baseBits);
    const exp = bitsToUnsignedNumber(expBits);
    const result = modularExponentiation(base, exp, modulus);

    return {
      out: { type: 'bits', value: unsignedNumberToBits(result, width) },
    };
  },
};
