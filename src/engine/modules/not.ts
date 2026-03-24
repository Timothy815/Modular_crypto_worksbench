import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

export const NOT: ModuleDef = {
  id: 'NOT',
  name: 'NOT',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const bits = expectBitsSignal(inputs.in, 'NOT');

    return {
      out: {
        type: 'bits',
        value: bits.map((bit) => (bit === 0 ? 1 : 0)),
      },
    };
  },
};
