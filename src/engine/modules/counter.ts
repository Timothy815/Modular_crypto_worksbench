import type { StatefulModuleDef } from '../types';
import { unsignedNumberToBits } from './bit-word';

function normalizePositiveInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Counter requires "${fieldName}" to be a positive integer`);
  }

  return value;
}

function normalizeNonNegativeInteger(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`Counter requires "${fieldName}" to be a non-negative integer`);
  }

  return value;
}

export function validateCounterParam(fieldKey: string, value: unknown): string | null {
  try {
    switch (fieldKey) {
      case 'width':
      case 'step':
        normalizePositiveInteger(value, fieldKey);
        return null;
      case 'value':
        normalizeNonNegativeInteger(value, fieldKey);
        return null;
      default:
        return null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'Counter parameter is invalid.';
  }
}

function normalizeValue(params: Record<string, unknown>): { width: number; step: number; value: number } {
  const width = normalizePositiveInteger(params.width, 'width');
  const step = normalizePositiveInteger(params.step, 'step');
  const value = normalizeNonNegativeInteger(params.value, 'value');
  const modulus = 2 ** width;
  return {
    width,
    step,
    value: modulus > 0 ? value % modulus : value,
  };
}

export const Counter: StatefulModuleDef = {
  id: 'Counter',
  name: 'Counter',
  inputs: [{ name: 'clock', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  liveStateDisplay: {
    key: 'value',
    label: 'count',
  },
  paramSchema: {
    width: {
      key: 'width',
      label: 'Width',
      kind: 'number',
      defaultValue: 3,
      required: true,
      description: 'How many bits the counter emits',
    },
    value: {
      key: 'value',
      label: 'Value',
      kind: 'number',
      defaultValue: 0,
      required: true,
      description: 'Current counter value',
    },
    step: {
      key: 'step',
      label: 'Step',
      kind: 'number',
      defaultValue: 1,
      required: true,
      description: 'How much the counter advances on each active clock pulse',
    },
  },
  evaluate: (_inputs, params) => {
    const { width, value } = normalizeValue(params);
    return {
      out: { type: 'bits', value: unsignedNumberToBits(value, width) },
    };
  },
  advance: (params) => {
    const { width, value, step } = normalizeValue(params);
    const modulus = 2 ** width;
    return {
      ...params,
      value: (value + step) % modulus,
    };
  },
};
