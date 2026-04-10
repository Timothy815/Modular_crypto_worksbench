import type { ModuleDef } from '../types';

function nibbleToHex(bits: number[]): string {
  let value = 0;
  for (const bit of bits) {
    value = (value << 1) | bit;
  }
  return value.toString(16).toUpperCase();
}

export const BitsToHex: ModuleDef = {
  id: 'BitsToHex',
  name: 'Bits → Hex',
  inputs: [{ name: 'in', type: 'bits', kind: 'sequence' }],
  outputs: [{ name: 'out', type: 'symbol', kind: 'sequence' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'bits') {
      throw new Error('BitsToHex expects a bits signal');
    }

    if (signal.value.length % 4 !== 0) {
      throw new Error('BitsToHex expects a bit width divisible by 4');
    }

    const digits = [];
    for (let index = 0; index < signal.value.length; index += 4) {
      digits.push(nibbleToHex(signal.value.slice(index, index + 4)));
    }

    return {
      out: { type: 'symbol', value: digits.join('') },
    };
  },
};
