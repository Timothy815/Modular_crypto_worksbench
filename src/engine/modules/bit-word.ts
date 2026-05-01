import type { Signal } from '../types';

export const MAX_SAFE_UNSIGNED_BITS = 53;
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

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

export function bitsToUnsignedBigInt(bits: number[]): bigint {
  let value = 0n;
  for (const bit of bits) {
    value = (value << 1n) | BigInt(bit);
  }
  return value;
}

export function unsignedBigIntToBits(value: bigint, width: number): number[] {
  const normalized = value < 0n ? 0n : value;
  return Array.from({ length: width }, (_, index) => {
    const shift = BigInt(width - index - 1);
    return Number((normalized >> shift) & 1n);
  });
}

export function bitsToUnsignedNumber(bits: number[]): number {
  const value = bitsToUnsignedBigInt(bits);
  if (value > MAX_SAFE_INTEGER_BIGINT) {
    throw new Error(
      `Bit-word value exceeds JavaScript safe integer range; exact number conversion is only supported up to ${MAX_SAFE_UNSIGNED_BITS} bits`,
    );
  }
  return Number(value);
}

export function unsignedNumberToBits(value: number, width: number): number[] {
  if (!Number.isFinite(value) || !Number.isInteger(value) || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('Bit-word number conversion requires a non-negative safe integer');
  }
  const normalized = Math.trunc(value);
  return unsignedBigIntToBits(BigInt(normalized), width);
}

export function normalizePositiveInteger(value: unknown, moduleName: string, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${moduleName} requires "${fieldName}" to be a positive integer`);
  }

  return value;
}

export function normalizePositiveSafeInteger(value: unknown, moduleName: string, fieldName: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    throw new Error(`${moduleName} requires "${fieldName}" to be a positive safe integer`);
  }

  return value;
}

export function normalizeNonNegativeSafeInteger(value: unknown, moduleName: string, fieldName: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(`${moduleName} requires "${fieldName}" to be a non-negative safe integer`);
  }

  return value;
}
