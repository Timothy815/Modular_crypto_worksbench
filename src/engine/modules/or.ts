import type { ModuleDef } from '../types';
import { expectBitsSignal, requireEqualBitWidths } from './bit-word';

export const OR: ModuleDef = {
  id: 'OR',
  name: 'OR',
  inputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const left = expectBitsSignal(inputs.a, 'OR');
    const right = expectBitsSignal(inputs.b, 'OR');
    const width = requireEqualBitWidths(left, right, 'OR');

    return {
      out: {
        type: 'bits',
        value: Array.from({ length: width }, (_, index) => left[index] | right[index]),
      },
    };
  },
};
