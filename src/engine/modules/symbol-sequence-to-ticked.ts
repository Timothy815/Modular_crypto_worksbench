import type { StatefulModuleDef } from '../types';

function normalizeIndex(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error('SymbolSequenceToTicked requires "index" to be a non-negative integer');
  }

  return value;
}

export function validateSymbolSequenceToTickedParam(fieldKey: string, value: unknown): string | null {
  try {
    switch (fieldKey) {
      case 'index':
        normalizeIndex(value);
        return null;
      case 'wrap':
        return typeof value === 'boolean'
          ? null
          : 'SymbolSequenceToTicked requires "wrap" to be a boolean';
      default:
        return null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'SymbolSequenceToTicked parameter is invalid.';
  }
}

export const SymbolSequenceToTicked: StatefulModuleDef = {
  id: 'SymbolSequenceToTicked',
  name: 'Symbol Sequence To Ticked',
  inputs: [
    { name: 'in', type: 'symbol', kind: 'sequence' },
    { name: 'clock', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'symbol', kind: 'scalar' }],
  liveStateDisplay: {
    key: 'index',
    label: 'step',
  },
  paramSchema: {
    index: {
      key: 'index',
      label: 'Index',
      kind: 'number',
      defaultValue: 0,
      required: true,
      description: 'Current sequence index emitted at this tick.',
    },
    wrap: {
      key: 'wrap',
      label: 'Wrap',
      kind: 'boolean',
      defaultValue: true,
      required: true,
      description: 'Wrap back to the start of the sequence after the last symbol.',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('SymbolSequenceToTicked expects a symbol sequence');
    }

    const sequence = String(signal.value ?? '');
    if (sequence.length === 0) {
      return { out: { type: 'symbol', value: '' } };
    }

    const index = normalizeIndex(params.index);
    const wrap = params.wrap !== false;
    const resolvedIndex = wrap ? index % sequence.length : index;
    const value = resolvedIndex < sequence.length ? sequence[resolvedIndex] ?? '' : '';

    return {
      out: {
        type: 'symbol',
        value,
      },
    };
  },
  advance: (params) => ({
    ...params,
    index: normalizeIndex(params.index) + 1,
  }),
};
