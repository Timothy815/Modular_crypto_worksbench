import type { ModuleDef } from '../types';
import { decodeBaudotBits } from './baudot-codec';

export const BitsToBaudot: ModuleDef = {
  id: 'BitsToBaudot',
  name: 'Bits → Baudot',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'bits') {
      throw new Error('BitsToBaudot expects a bits signal');
    }

    return {
      out: { type: 'symbol', value: decodeBaudotBits(signal.value) },
    };
  },
};
