import type { ModuleDef } from '../types';
import {
  bitsToUnsignedBigInt,
  expectBitsSignal,
  unsignedBigIntToBits,
} from './bit-word';
import { normalizeBigIntHexParam, validateBigIntHexParam } from './bigint-param';

export function validateModExpParam(key: string, value: unknown): string | null {
  if (key !== 'modulus') {
    return null;
  }

  const error = validateBigIntHexParam('ModExp', 'modulus', value);
  if (error) {
    return error;
  }

  try {
    const parsed = normalizeBigIntHexParam(value, 'ModExp', 'modulus');
    if (parsed < 2n) {
      return 'ModExp requires a modulus of at least 2.';
    }
  } catch {
    return 'ModExp requires a valid hex integer modulus of at least 2.';
  }

  return null;
}

function modularExponentiation(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod === 1n) {
    return 0n;
  }

  let result = 1n;
  let b = base % mod;

  let e = exp;
  while (e > 0n) {
    if (e % 2n === 1n) {
      result = (result * b) % mod;
    }
    e /= 2n;
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
      kind: 'bigint-hex',
      defaultValue: 'F',
      required: true,
      description: 'Integer modulus (>= 2). Result is base^exp mod modulus.',
    },
  },
  evaluate: (inputs, params) => {
    const baseBits = expectBitsSignal(inputs.base, 'ModExp');
    const expBits = expectBitsSignal(inputs.exp, 'ModExp');
    const modulus = normalizeBigIntHexParam(params.modulus, 'ModExp', 'modulus');

    if (modulus < 2n) {
      throw new Error('ModExp requires a modulus of at least 2');
    }

    const width = baseBits.length;

    if (width === 0) {
      return { out: { type: 'bits', value: [] } };
    }

    const maxValue = 1n << BigInt(width);
    if (modulus > maxValue) {
      throw new Error('ModExp modulus must not exceed the base word range');
    }

    const base = bitsToUnsignedBigInt(baseBits);
    const exp = bitsToUnsignedBigInt(expBits);
    const result = modularExponentiation(base, exp, modulus);

    return {
      out: { type: 'bits', value: unsignedBigIntToBits(result, width) },
    };
  },
};
