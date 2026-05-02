import type { Signal } from '../types';
import { normalizePositiveSafeInteger } from './bit-word';
import { parseUnsignedIntegerString } from './integer-signal';

function getScalarOrderError(value: unknown, moduleName: string, fieldName: string): string | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    !Number.isSafeInteger(value) ||
    value < 2
  ) {
    return `${moduleName} requires "${fieldName}" to be a subgroup-order safe integer of at least 2 in V1.`;
  }

  return null;
}

export function validateScalarOrderParam(moduleName: string, key: string, value: unknown): string | null {
  if (key !== 'n') {
    return null;
  }

  return getScalarOrderError(value, moduleName, 'n');
}

export function normalizeScalarOrder(value: unknown, moduleName: string): bigint {
  const base = normalizePositiveSafeInteger(value, moduleName, 'n');
  const error = getScalarOrderError(base, moduleName, 'n');
  if (error) {
    throw new Error(error);
  }

  return BigInt(base);
}

export function expectScalarSignalInRange(
  signal: Signal,
  order: bigint,
  moduleName: string,
  label: string,
): { decimal: string; value: bigint } {
  if (signal.type !== 'integer') {
    throw new Error(`${moduleName} expects ${label} to be an integer signal`);
  }

  const decimal = signal.value.trim();
  const value = parseUnsignedIntegerString(decimal, moduleName);
  if (value >= order) {
    throw new Error(
      `${moduleName} expects ${label} to be in the scalar range 0..${(order - 1n).toString(10)} for subgroup order n=${order.toString(10)}.`,
    );
  }

  return { decimal: value.toString(10), value };
}

export function formatScalarOrderResult(value: bigint, order: bigint): string {
  const normalized = ((value % order) + order) % order;
  return normalized.toString(10);
}
