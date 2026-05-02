import type { Signal } from '../types';
import { normalizeBigIntHexParam } from './bigint-param';
import { parseUnsignedIntegerString } from './integer-signal';

export function validateScalarOrderParam(moduleName: string, key: string, value: unknown): string | null {
  if (key !== 'n') {
    return null;
  }

  try {
    const parsed = normalizeBigIntHexParam(value, moduleName, 'n');
    if (parsed < 2n) {
      return `${moduleName} requires "n" to be a subgroup order of at least 2.`;
    }
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : `${moduleName} requires "n" to be a valid hex integer of at least 2.`;
  }
}

export function normalizeScalarOrder(value: unknown, moduleName: string): bigint {
  const order = normalizeBigIntHexParam(value, moduleName, 'n');
  if (order < 2n) {
    throw new Error(`${moduleName} requires "n" to be a subgroup order of at least 2.`);
  }
  return order;
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
