import type { ModuleDef } from '../types';

export const BitJoin: ModuleDef = {
  id: 'BitJoin',
  name: 'Bit Join',
  inputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    if (inputs.a.type !== 'bits' || inputs.b.type !== 'bits') {
      throw new Error('BitJoin expects two bits signals');
    }

    return {
      out: {
        type: 'bits',
        value: [...inputs.a.value, ...inputs.b.value],
      },
    };
  },
};
