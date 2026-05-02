import type { Signal } from '../types';
import { normalizePositiveSafeInteger } from './bit-word';
import { parseUnsignedIntegerString } from './integer-signal';

const PRIME_TEST_BASES = [2n, 325n, 9375n, 28178n, 450775n, 9780504n, 1795265022n] as const;

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n;
  let factor = base % modulus;
  let power = exponent;

  while (power > 0n) {
    if ((power & 1n) === 1n) {
      result = (result * factor) % modulus;
    }
    factor = (factor * factor) % modulus;
    power >>= 1n;
  }

  return result;
}

export function isPrimeSafeIntegerBigInt(value: bigint): boolean {
  if (value < 2n) {
    return false;
  }

  if (value === 2n || value === 3n) {
    return true;
  }

  if (value % 2n === 0n) {
    return false;
  }

  let d = value - 1n;
  let s = 0n;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s += 1n;
  }

  for (const base of PRIME_TEST_BASES) {
    if (base % value === 0n) {
      continue;
    }

    let x = modPow(base, d, value);
    if (x === 1n || x === value - 1n) {
      continue;
    }

    let witnessedComposite = true;
    for (let round = 1n; round < s; round += 1n) {
      x = (x * x) % value;
      if (x === value - 1n) {
        witnessedComposite = false;
        break;
      }
    }

    if (witnessedComposite) {
      return false;
    }
  }

  return true;
}

function getPrimeFieldModulusError(value: unknown, moduleName: string): string | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    !Number.isSafeInteger(value) ||
    value < 2
  ) {
    return `${moduleName} requires a prime safe integer modulus of at least 2.`;
  }

  return isPrimeSafeIntegerBigInt(BigInt(value))
    ? null
    : `${moduleName} requires "modulus" to be prime in V1.`;
}

export function validatePrimeFieldModulusParam(moduleName: string, key: string, value: unknown): string | null {
  if (key !== 'modulus') {
    return null;
  }

  return getPrimeFieldModulusError(value, moduleName);
}

export function normalizePrimeFieldModulus(value: unknown, moduleName: string): bigint {
  const base = normalizePositiveSafeInteger(value, moduleName, 'modulus');
  const error = getPrimeFieldModulusError(base, moduleName);
  if (error) {
    throw new Error(error);
  }

  return BigInt(base);
}

export function expectFieldElementSignal(
  signal: Signal,
  modulus: bigint,
  moduleName: string,
  label: string,
): { decimal: string; value: bigint } {
  if (signal.type !== 'integer') {
    throw new Error(`${moduleName} expects ${label} to be an integer signal`);
  }

  const decimal = signal.value.trim();
  const value = parseUnsignedIntegerString(decimal, moduleName);
  if (value >= modulus) {
    throw new Error(
      `${moduleName} expects ${label} to be in the range 0..${(modulus - 1n).toString(10)} for modulus ${modulus.toString(10)}`,
    );
  }

  return { decimal: value.toString(10), value };
}

export function formatFieldResult(value: bigint, modulus: bigint): string {
  const normalized = ((value % modulus) + modulus) % modulus;
  return normalized.toString(10);
}

export function multiplicativeInverse(value: bigint, modulus: bigint): bigint {
  let oldR = value;
  let r = modulus;
  let oldS = 1n;
  let s = 0n;

  while (r !== 0n) {
    const quotient = oldR / r;

    const nextR = oldR - quotient * r;
    oldR = r;
    r = nextR;

    const nextS = oldS - quotient * s;
    oldS = s;
    s = nextS;
  }

  if (oldR !== 1n) {
    throw new Error(
      `Prime-field inverse is undefined for ${value.toString(10)} modulo ${modulus.toString(10)}`,
    );
  }

  return ((oldS % modulus) + modulus) % modulus;
}
