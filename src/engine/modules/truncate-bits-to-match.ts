import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

type SequenceSide = 'left' | 'right';

function normalizeSide(value: unknown): SequenceSide {
  if (value === 'left' || value === 'right') {
    return value;
  }

  throw new Error('TruncateBitsToMatch requires "side" to be left or right');
}

export function validateTruncateBitsToMatchParam(fieldKey: string, value: unknown): string | null {
  try {
    if (fieldKey === 'side') {
      normalizeSide(value);
    }

    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'TruncateBitsToMatch parameter is invalid.';
  }
}

function truncateBitsToMatch(bits: number[], reference: number[], side: SequenceSide): number[] {
  const targetLength = reference.length;

  if (bits.length <= targetLength) {
    return [...bits];
  }

  return side === 'left' ? bits.slice(0, targetLength) : bits.slice(bits.length - targetLength);
}

export const TruncateBitsToMatch: ModuleDef = {
  id: 'TruncateBitsToMatch',
  name: 'Truncate Bits To Match',
  inputs: [
    { name: 'in', type: 'bits', kind: 'sequence' },
    { name: 'reference', type: 'bits', kind: 'sequence' },
  ],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {
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
    const bits = expectBitsSignal(inputs.in, 'TruncateBitsToMatch');
    const reference = expectBitsSignal(inputs.reference, 'TruncateBitsToMatch');
    const side = normalizeSide(params.side);

    return {
      out: {
        type: 'bits',
        value: truncateBitsToMatch(bits, reference, side),
      },
    };
  },
};
