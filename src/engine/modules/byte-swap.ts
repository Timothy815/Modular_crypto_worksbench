import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

export const ByteSwap: ModuleDef = {
  id: 'ByteSwap',
  name: 'Byte Swap',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const bits = expectBitsSignal(inputs.in, 'ByteSwap');
    if (bits.length === 0) {
      return { out: { type: 'bits', value: [] } };
    }

    if (bits.length % 8 !== 0) {
      throw new Error('ByteSwap expects an input width divisible by 8');
    }

    const bytes: number[][] = [];
    for (let index = 0; index < bits.length; index += 8) {
      bytes.push(bits.slice(index, index + 8));
    }

    return {
      out: {
        type: 'bits',
        value: bytes.reverse().flat(),
      },
    };
  },
};
