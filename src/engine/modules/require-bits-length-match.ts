import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

function requireBitsLengthMatch(bits: number[], reference: number[]): number[] {
  if (bits.length !== reference.length) {
    throw new Error(
      `RequireBitsLengthMatch length mismatch: input has ${bits.length} bits but reference has ${reference.length}`,
    );
  }

  return [...bits];
}

export const RequireBitsLengthMatch: ModuleDef = {
  id: 'RequireBitsLengthMatch',
  name: 'Require Bits Length Match',
  inputs: [
    { name: 'in', type: 'bits', kind: 'sequence' },
    { name: 'reference', type: 'bits', kind: 'sequence' },
  ],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const bits = expectBitsSignal(inputs.in, 'RequireBitsLengthMatch');
    const reference = expectBitsSignal(inputs.reference, 'RequireBitsLengthMatch');

    return {
      out: {
        type: 'bits',
        value: requireBitsLengthMatch(bits, reference),
      },
    };
  },
};
