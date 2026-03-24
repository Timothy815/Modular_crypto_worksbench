import type { Signal } from '../types';

export function expectBitsSignal(signal: Signal, moduleName: string): number[] {
  if (signal.type !== 'bits') {
    throw new Error(`${moduleName} expects a bits signal`);
  }

  return signal.value;
}

export function requireEqualBitWidths(left: number[], right: number[], moduleName: string): number {
  if (left.length !== right.length) {
    throw new Error(`${moduleName} expects equal-width bits inputs`);
  }

  return left.length;
}

export function bitsToUnsignedNumber(bits: number[]): number {
  let value = 0;
  for (const bit of bits) {
    value = (value << 1) | bit;
  }
  return value;
}

export function unsignedNumberToBits(value: number, width: number): number[] {
  const normalized = Math.trunc(value);
  return Array.from({ length: width }, (_, index) => {
    const shift = width - index - 1;
    return (normalized >> shift) & 1;
  });
}

export function normalizePositiveInteger(value: unknown, moduleName: string, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${moduleName} requires "${fieldName}" to be a positive integer`);
  }

  return value;
}
