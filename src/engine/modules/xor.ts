import type { ModuleDef } from '../types';

export const XOR: ModuleDef = {
  id: 'XOR',
  name: 'XOR',
  inputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const a = inputs.a;
    const b = inputs.b;
    if (a.type !== 'bits' || b.type !== 'bits') {
      throw new Error('XOR expects two bits signals');
    }

    const len = Math.min(a.value.length, b.value.length);
    const result: number[] = [];
    for (let i = 0; i < len; i++) {
      result.push(a.value[i] ^ b.value[i]);
    }

    return {
      out: { type: 'bits', value: result },
    };
  },
};
