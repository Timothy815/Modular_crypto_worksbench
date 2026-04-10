import type { ModuleInputs, StatefulModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

function normalizeCollected(value: unknown): number[] {
  if (!Array.isArray(value) || value.some((bit) => bit !== 0 && bit !== 1)) {
    throw new Error('TickedBitsToSequence requires "collected" to be a bit array');
  }

  return value;
}

function normalizeCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error('TickedBitsToSequence requires "count" to be a non-negative integer');
  }

  return value;
}

function isActiveClockInput(inputs: ModuleInputs): boolean {
  const clock = inputs.clock;
  if (!clock) {
    return true;
  }

  return clock.type === 'bits' && clock.value.length === 1 && clock.value[0] === 1;
}

function getPendingAppend(inputs: ModuleInputs): number[] {
  const signal = inputs.in;
  if (!signal) {
    throw new Error('TickedBitsToSequence expects a scalar bits input');
  }

  const bits = expectBitsSignal(signal, 'TickedBitsToSequence');
  return isActiveClockInput(inputs) ? [...bits] : [];
}

export function validateTickedBitsToSequenceParam(fieldKey: string, value: unknown): string | null {
  try {
    switch (fieldKey) {
      case 'count':
        normalizeCount(value);
        return null;
      case 'collected':
        normalizeCollected(value);
        return null;
      default:
        return null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'TickedBitsToSequence parameter is invalid.';
  }
}

export const TickedBitsToSequence: StatefulModuleDef = {
  id: 'TickedBitsToSequence',
  name: 'Ticked Bits To Sequence',
  usesClockAsInput: true,
  inputs: [
    { name: 'in', type: 'bits', kind: 'scalar' },
    { name: 'clock', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  liveStateDisplay: {
    key: 'count',
    label: 'count',
  },
  paramSchema: {
    collected: {
      key: 'collected',
      label: 'Collected',
      kind: 'bits',
      defaultValue: [],
      required: true,
      hidden: true,
      description: 'Current collected bit sequence.',
    },
    count: {
      key: 'count',
      label: 'Count',
      kind: 'number',
      defaultValue: 0,
      required: true,
      hidden: true,
      description: 'Current number of collected bits.',
    },
  },
  evaluate: (inputs, params) => {
    const collected = normalizeCollected(params.collected);
    return {
      out: {
        type: 'bits',
        value: [...collected, ...getPendingAppend(inputs)],
      },
    };
  },
  advance: (params, _tick, inputs) => {
    const collected = normalizeCollected(params.collected);
    const count = normalizeCount(params.count);
    const append = inputs ? getPendingAppend(inputs) : [];
    if (append.length === 0) {
      return {
        ...params,
        collected: [...collected],
        count,
      };
    }

    return {
      ...params,
      collected: [...collected, ...append],
      count: count + append.length,
    };
  },
};
