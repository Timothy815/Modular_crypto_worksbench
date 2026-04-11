import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

function repeatBitsToMatch(bits: number[], reference: number[]): number[] {
  const targetLength = reference.length;

  if (targetLength === 0) {
    return [];
  }

  if (bits.length === 0) {
    throw new Error('RepeatBitsToMatch requires a non-empty input sequence to repeat');
  }

  return Array.from({ length: targetLength }, (_, index) => bits[index % bits.length]);
}

export const RepeatBitsToMatch: ModuleDef = {
  id: 'RepeatBitsToMatch',
  name: 'Repeat Bits To Match',
  inputs: [
    { name: 'in', type: 'bits', kind: 'sequence' },
    { name: 'reference', type: 'bits', kind: 'sequence' },
  ],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const bits = expectBitsSignal(inputs.in, 'RepeatBitsToMatch');
    const reference = expectBitsSignal(inputs.reference, 'RepeatBitsToMatch');

    return {
      out: {
        type: 'bits',
        value: repeatBitsToMatch(bits, reference),
      },
    };
  },
};
