import type { ModuleDef } from '../types';

type SequenceSide = 'left' | 'right';

function normalizeTargetLength(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error('TruncateSymbolSequence requires "targetLength" to be a non-negative integer');
  }

  return value;
}

function normalizeSide(value: unknown): SequenceSide {
  if (value === 'left' || value === 'right') {
    return value;
  }

  throw new Error('TruncateSymbolSequence requires "side" to be left or right');
}

export function validateTruncateSymbolSequenceParam(fieldKey: string, value: unknown): string | null {
  try {
    switch (fieldKey) {
      case 'targetLength':
        normalizeTargetLength(value);
        return null;
      case 'side':
        normalizeSide(value);
        return null;
      default:
        return null;
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'TruncateSymbolSequence parameter is invalid.';
  }
}

export const TruncateSymbolSequence: ModuleDef = {
  id: 'TruncateSymbolSequence',
  name: 'Truncate Symbol Sequence',
  inputs: [{ name: 'in', type: 'symbol', kind: 'sequence' }],
  outputs: [{ name: 'out', type: 'symbol', kind: 'sequence' }],
  paramSchema: {
    targetLength: {
      key: 'targetLength',
      label: 'Target Length',
      kind: 'number',
      defaultValue: 5,
      required: true,
      description: 'Keep at most this many symbols from the visible sequence.',
    },
    side: {
      key: 'side',
      label: 'Preserve Side',
      kind: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      required: true,
      description: 'Choose whether truncation preserves the left or right side of the sequence.',
    },
  },
  evaluate: (inputs, params) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('TruncateSymbolSequence expects a symbol signal');
    }

    const targetLength = normalizeTargetLength(params.targetLength);
    const side = normalizeSide(params.side);
    const symbols = Array.from(signal.value);

    if (symbols.length <= targetLength) {
      return { out: { type: 'symbol', value: signal.value } };
    }

    const truncated =
      side === 'left'
        ? symbols.slice(0, targetLength)
        : symbols.slice(symbols.length - targetLength);

    return { out: { type: 'symbol', value: truncated.join('') } };
  },
};
