import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

type SequenceSide = 'left' | 'right';

function normalizeTargetLength(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error('TruncateBitsSequence requires "targetLength" to be a non-negative integer');
  }

  return value;
}

function normalizeSide(value: unknown): SequenceSide {
  if (value === 'left' || value === 'right') {
    return value;
  }

  throw new Error('TruncateBitsSequence requires "side" to be left or right');
}

export function validateTruncateBitsSequenceParam(fieldKey: string, value: unknown): string | null {
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
    return error instanceof Error ? error.message : 'TruncateBitsSequence parameter is invalid.';
  }
}

export const TruncateBitsSequence: ModuleDef = {
  id: 'TruncateBitsSequence',
  name: 'Truncate Bits Sequence',
  inputs: [{ name: 'in', type: 'bits', kind: 'sequence' }],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {
    targetLength: {
      key: 'targetLength',
      label: 'Target Length',
      kind: 'number',
      defaultValue: 8,
      required: true,
      description: 'Keep at most this many bits from the visible sequence.',
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
      description: 'Choose whether truncation preserves the left or right side of the bit sequence.',
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'TruncateBitsSequence');
    const targetLength = normalizeTargetLength(params.targetLength);
    const side = normalizeSide(params.side);

    if (bits.length <= targetLength) {
      return { out: { type: 'bits', value: [...bits] } };
    }

    const truncated =
      side === 'left'
        ? bits.slice(0, targetLength)
        : bits.slice(bits.length - targetLength);

    return { out: { type: 'bits', value: truncated } };
  },
};
