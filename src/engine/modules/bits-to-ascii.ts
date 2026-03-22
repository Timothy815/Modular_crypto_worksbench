import type { ModuleDef } from '../types';

function bitsToChar(bits: number[]): string {
  let value = 0;
  for (const bit of bits) {
    value = (value << 1) | bit;
  }

  if (value > 0x7f) {
    throw new Error('BitsToAscii can only decode 7-bit ASCII byte values (0-127)');
  }

  return String.fromCharCode(value);
}

export const BitsToAscii: ModuleDef = {
  id: 'BitsToAscii',
  name: 'Bits → ASCII',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'bits') {
      throw new Error('BitsToAscii expects a bits signal');
    }

    if (signal.value.length % 8 !== 0) {
      throw new Error('BitsToAscii expects a bit width divisible by 8');
    }

    const chars = [];
    for (let index = 0; index < signal.value.length; index += 8) {
      chars.push(bitsToChar(signal.value.slice(index, index + 8)));
    }

    return {
      out: { type: 'symbol', value: chars.join('') },
    };
  },
};
