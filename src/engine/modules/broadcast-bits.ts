import type { ModuleDef } from '../types';
import { expectBitsSignal, normalizePositiveInteger } from './bit-word';

export function validateBroadcastBitsParam(fieldKey: string, value: unknown): string | null {
  if (fieldKey !== 'copies') {
    return null;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return 'BroadcastBits copies must be a positive integer.';
  }

  return null;
}

export const BroadcastBits: ModuleDef = {
  id: 'BroadcastBits',
  name: 'Broadcast Bits',
  inputs: [{ name: 'in', type: 'bits', kind: 'scalar' }],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {
    copies: {
      key: 'copies',
      label: 'Copies',
      kind: 'number',
      defaultValue: 2,
      required: true,
      description: 'Repeat the entire input bit pattern this many times in sequence.',
    },
  },
  evaluate: (inputs, params) => {
    const bits = expectBitsSignal(inputs.in, 'BroadcastBits');
    if (bits.length === 0) {
      throw new Error('BroadcastBits cannot broadcast an empty bit pattern');
    }

    const copies = normalizePositiveInteger(params.copies, 'BroadcastBits', 'copies');
    const result: number[] = [];
    for (let copy = 0; copy < copies; copy += 1) {
      result.push(...bits);
    }

    return {
      out: {
        type: 'bits',
        value: result,
      },
    };
  },
};
