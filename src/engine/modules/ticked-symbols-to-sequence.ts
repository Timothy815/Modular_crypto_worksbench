import type { ModuleInputs, StatefulModuleDef } from '../types';

function normalizeCollected(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error('TickedSymbolsToSequence requires "count" to be a non-negative integer');
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

function getPendingAppend(inputs: ModuleInputs): string {
  const signal = inputs.in;
  if (!signal || signal.type !== 'symbol') {
    throw new Error('TickedSymbolsToSequence expects a scalar symbol input');
  }

  return isActiveClockInput(inputs) ? String(signal.value ?? '') : '';
}

export function validateTickedSymbolsToSequenceParam(fieldKey: string, value: unknown): string | null {
  try {
    switch (fieldKey) {
      case 'count':
        normalizeCount(value);
        return null;
      case 'collected':
        return typeof value === 'string' ? null : 'TickedSymbolsToSequence requires "collected" to be a string';
      default:
        return null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'TickedSymbolsToSequence parameter is invalid.';
  }
}

export const TickedSymbolsToSequence: StatefulModuleDef = {
  id: 'TickedSymbolsToSequence',
  name: 'Ticked Symbols To Sequence',
  usesClockAsInput: true,
  inputs: [
    { name: 'in', type: 'symbol', kind: 'scalar' },
    { name: 'clock', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'symbol', kind: 'sequence' }],
  liveStateDisplay: {
    key: 'count',
    label: 'count',
  },
  paramSchema: {
    collected: {
      key: 'collected',
      label: 'Collected',
      kind: 'string',
      defaultValue: '',
      required: true,
      hidden: true,
      description: 'Current collected symbol sequence.',
    },
    count: {
      key: 'count',
      label: 'Count',
      kind: 'number',
      defaultValue: 0,
      required: true,
      hidden: true,
      description: 'Current number of collected symbol elements.',
    },
  },
  evaluate: (inputs, params) => {
    const collected = normalizeCollected(params.collected);
    return {
      out: {
        type: 'symbol',
        value: collected + getPendingAppend(inputs),
      },
    };
  },
  advance: (params, _tick, inputs) => {
    const collected = normalizeCollected(params.collected);
    const count = normalizeCount(params.count);
    const append = inputs ? getPendingAppend(inputs) : '';
    if (append.length === 0) {
      return {
        ...params,
        collected,
        count,
      };
    }

    return {
      ...params,
      collected: collected + append,
      count: count + append.length,
    };
  },
};
