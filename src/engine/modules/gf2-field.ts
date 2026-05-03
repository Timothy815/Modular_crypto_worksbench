import type { ModuleDef } from '../types';
import { normalizeBigIntHexParam } from './bigint-param';

/** AES reduction polynomial x⁸ + x⁴ + x³ + x + 1 = 0x11B. */
export const AES_POLY = 0x11B;

function validateGF2Poly(value: unknown, moduleName: string): string | null {
  let parsed: bigint;
  try {
    parsed = normalizeBigIntHexParam(value, moduleName, 'poly');
  } catch (error) {
    return error instanceof Error ? error.message : `${moduleName} requires a valid "poly" value.`;
  }
  if (parsed < 0x100n || parsed > 0x1FFn) {
    return `${moduleName} requires "poly" to be a 9-bit degree-8 polynomial (0x100–0x1FF, i.e., bit 8 set). For AES, use 0x11B.`;
  }
  return null;
}

export function validateGF2Param(moduleName: string, key: string, value: unknown): string | null {
  if (key !== 'poly') return null;
  return validateGF2Poly(value, moduleName);
}

/** Multiply two bytes in GF(2⁸) with the given reduction polynomial. */
export function gf2Mul(a: number, b: number, poly: number): number {
  let result = 0;
  let aVal = a & 0xFF;
  let bVal = b & 0xFF;
  while (bVal > 0) {
    if (bVal & 1) {
      result ^= aVal;
    }
    const highBit = aVal & 0x80;
    aVal = (aVal << 1) & 0xFF;
    if (highBit) {
      aVal ^= (poly & 0xFF);
    }
    bVal >>= 1;
  }
  return result;
}

/** Multiplicative inverse in GF(2⁸). gf2Inv(0) = 0 by convention. */
export function gf2Inv(a: number, poly: number): number {
  if (a === 0) return 0;
  for (let b = 1; b < 256; b++) {
    if (gf2Mul(a, b, poly) === 1) {
      return b;
    }
  }
  throw new Error(`GF2Inv: ${a.toString(16).toUpperCase()} has no inverse under polynomial 0x${poly.toString(16).toUpperCase()}`);
}

function bitsToByteValue(bits: number[]): number {
  if (bits.length !== 8) {
    throw new Error('Expected exactly 8 bits');
  }
  let val = 0;
  for (const bit of bits) {
    val = (val << 1) | (bit & 1);
  }
  return val & 0xFF;
}

function byteValueToBits(val: number): number[] {
  const bits: number[] = [];
  for (let i = 7; i >= 0; i--) {
    bits.push((val >> i) & 1);
  }
  return bits;
}

export const GF2Mul: ModuleDef = {
  id: 'GF2Mul',
  name: 'GF(2⁸) Mul',
  inputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    poly: {
      key: 'poly',
      label: 'Reduction Polynomial',
      kind: 'bigint-hex',
      defaultValue: '11B',
      required: true,
      description:
        'Irreducible reduction polynomial for GF(2⁸). Must have bit 8 set. For AES use 11B (x⁸ + x⁴ + x³ + x + 1).',
    },
  },
  evaluate: (inputs, params) => {
    const bitsA = inputs.a;
    const bitsB = inputs.b;
    if (bitsA?.type !== 'bits' || bitsA.value.length !== 8) {
      throw new Error('GF2Mul requires input "a" to be exactly 8 bits wide.');
    }
    if (bitsB?.type !== 'bits' || bitsB.value.length !== 8) {
      throw new Error('GF2Mul requires input "b" to be exactly 8 bits wide.');
    }

    const polyBig = normalizeBigIntHexParam(params.poly, 'GF2Mul', 'poly');
    const poly = Number(polyBig);
    if (poly < 0x100 || poly > 0x1FF) {
      throw new Error('GF2Mul requires "poly" to be a 9-bit degree-8 polynomial (0x100–0x1FF).');
    }

    const aVal = bitsToByteValue(bitsA.value);
    const bVal = bitsToByteValue(bitsB.value);
    const result = gf2Mul(aVal, bVal, poly);

    return { out: { type: 'bits', value: byteValueToBits(result) } };
  },
};

export const GF2Inv: ModuleDef = {
  id: 'GF2Inv',
  name: 'GF(2⁸) Inv',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    poly: {
      key: 'poly',
      label: 'Reduction Polynomial',
      kind: 'bigint-hex',
      defaultValue: '11B',
      required: true,
      description:
        'Irreducible reduction polynomial for GF(2⁸). Must have bit 8 set. For AES use 11B.',
    },
  },
  evaluate: (inputs, params) => {
    const bitsIn = inputs.in;
    if (bitsIn?.type !== 'bits' || bitsIn.value.length !== 8) {
      throw new Error('GF2Inv requires input to be exactly 8 bits wide.');
    }

    const polyBig = normalizeBigIntHexParam(params.poly, 'GF2Inv', 'poly');
    const poly = Number(polyBig);
    if (poly < 0x100 || poly > 0x1FF) {
      throw new Error('GF2Inv requires "poly" to be a 9-bit degree-8 polynomial (0x100–0x1FF).');
    }

    const aVal = bitsToByteValue(bitsIn.value);
    const result = gf2Inv(aVal, poly);

    return { out: { type: 'bits', value: byteValueToBits(result) } };
  },
};
