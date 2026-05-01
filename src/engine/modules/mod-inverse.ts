import type { ModuleDef } from '../types';
import {
  bitsToUnsignedBigInt,
  expectBitsSignal,
  normalizePositiveSafeInteger,
  unsignedBigIntToBits,
} from './bit-word';

export function validateModInverseParam(key: string, value: unknown): string | null {
  if (key !== 'modulus') {
    return null;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    !Number.isSafeInteger(value) ||
    value < 2
  ) {
    return 'ModInverse requires a safe integer modulus of at least 2.';
  }

  return null;
}

function extendedGcd(a: bigint, b: bigint): { gcd: bigint; x: bigint } {
  let oldR = a;
  let r = b;
  let oldS = 1n;
  let s = 0n;

  while (r !== 0n) {
    const q = oldR / r;
    const tempR = r;
    r = oldR - q * r;
    oldR = tempR;
    const tempS = s;
    s = oldS - q * s;
    oldS = tempS;
  }

  return { gcd: oldR, x: oldS };
}

export const ModInverse: ModuleDef = {
  id: 'ModInverse',
  name: 'MOD INV',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    modulus: {
      key: 'modulus',
      label: 'Modulus',
      kind: 'number',
      defaultValue: 15,
      required: true,
      description: 'Integer modulus (>= 2). Result is the modular inverse of the input.',
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'ModInverse');
    const modulus = BigInt(normalizePositiveSafeInteger(params.modulus, 'ModInverse', 'modulus'));

    if (modulus < 2n) {
      throw new Error('ModInverse requires a modulus of at least 2');
    }

    const width = bits.length;

    if (width === 0) {
      return { out: { type: 'bits', value: [] } };
    }

    const maxValue = 1n << BigInt(width);
    if (modulus > maxValue) {
      throw new Error('ModInverse modulus must not exceed the input word range');
    }

    const value = bitsToUnsignedBigInt(bits);
    const { gcd, x } = extendedGcd(value, modulus);

    if (gcd !== 1n) {
      throw new Error(
        `ModInverse: ${value} has no inverse mod ${modulus} (GCD is ${gcd})`,
      );
    }

    const result = ((x % modulus) + modulus) % modulus;

    return {
      out: { type: 'bits', value: unsignedBigIntToBits(result, width) },
    };
  },
};
