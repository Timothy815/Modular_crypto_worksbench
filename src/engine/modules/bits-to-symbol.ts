import type { ModuleDef } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const BitsToSymbol: ModuleDef = {
  id: 'BitsToSymbol',
  name: 'Bits → Symbol',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'bits') {
      throw new Error('BitsToSymbol expects a bits signal');
    }

    // Decode 5-bit binary to alphabet index
    const bits = signal.value;
    let index = 0;
    for (let i = 0; i < bits.length; i++) {
      index = (index << 1) | bits[i];
    }

    // Wrap to alphabet range
    index = ((index % 26) + 26) % 26;

    return {
      out: { type: 'symbol', value: ALPHABET[index] },
    };
  },
};
