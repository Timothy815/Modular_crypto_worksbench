import type { ModuleDef } from '../types';

function bitsToChar(bits: number[]): string {
  let value = 0;
  for (const bit of bits) {
    value = (value << 1) | bit;
  }

  if (value > 0x7f) {
    throw new Error('BitsToAsciiChar can only decode 7-bit ASCII byte values (0-127)');
  }

  return String.fromCharCode(value);
}

export const BitsToAsciiChar: ModuleDef = {
  id: 'BitsToAsciiChar',
  name: 'Bits → ASCII Char',
  inputs: [{ name: 'in', type: 'bits', kind: 'scalar' }],
  outputs: [{ name: 'out', type: 'symbol', kind: 'scalar' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'bits') {
      throw new Error('BitsToAsciiChar expects a bits signal');
    }

    if (signal.value.length !== 8) {
      throw new Error('BitsToAsciiChar expects exactly 8 bits; use padding or truncation helpers first');
    }

    return {
      out: { type: 'symbol', value: bitsToChar(signal.value) },
    };
  },
};
