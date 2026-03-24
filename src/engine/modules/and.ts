import type { ModuleDef } from '../types';
import { expectBitsSignal, requireEqualBitWidths } from './bit-word';

export const AND: ModuleDef = {
  id: 'AND',
  name: 'AND',
  inputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const left = expectBitsSignal(inputs.a, 'AND');
    const right = expectBitsSignal(inputs.b, 'AND');
    const width = requireEqualBitWidths(left, right, 'AND');

    return {
      out: {
        type: 'bits',
        value: Array.from({ length: width }, (_, index) => left[index] & right[index]),
      },
    };
  },
};
