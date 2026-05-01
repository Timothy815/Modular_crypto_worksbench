import type { StatefulModuleDef } from '../types';
import {
  normalizeNonNegativeSafeInteger,
  normalizePositiveSafeInteger,
  unsignedBigIntToBits,
} from './bit-word';

export function validateCounterParam(fieldKey: string, value: unknown): string | null {
  try {
    switch (fieldKey) {
      case 'width':
      case 'step':
        normalizePositiveSafeInteger(value, 'Counter', fieldKey);
        return null;
      case 'value':
        normalizeNonNegativeSafeInteger(value, 'Counter', fieldKey);
        return null;
      default:
        return null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'Counter parameter is invalid.';
  }
}

function normalizeValue(params: Record<string, unknown>): { width: number; step: number; value: number } {
  const width = normalizePositiveSafeInteger(params.width, 'Counter', 'width');
  const step = normalizePositiveSafeInteger(params.step, 'Counter', 'step');
  const value = normalizeNonNegativeSafeInteger(params.value, 'Counter', 'value');
  const modulus = 1n << BigInt(width);
  return {
    width,
    step,
    value: Number(BigInt(value) % modulus),
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
      out: { type: 'bits', value: unsignedBigIntToBits(BigInt(value), width) },
    };
  },
  advance: (params) => {
    const { width, value, step } = normalizeValue(params);
    const modulus = 1n << BigInt(width);
    return {
      ...params,
      value: Number((BigInt(value) + BigInt(step)) % modulus),
    };
  },
};
