import type { ModuleDef } from '../types';
import { bitsToUnsignedBigInt, expectBitsSignal } from './bit-word';

export const BitsToInteger: ModuleDef = {
  id: 'BitsToInteger',
  name: 'Bits → Integer',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'integer' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const bits = expectBitsSignal(inputs.in, 'BitsToInteger');
    return {
      out: {
        type: 'integer',
        value: bitsToUnsignedBigInt(bits).toString(10),
      },
    };
  },
};
