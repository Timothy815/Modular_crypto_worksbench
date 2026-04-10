import type { ModuleDef } from '../types';

function nibbleToHex(bits: number[]): string {
  let value = 0;
  for (const bit of bits) {
    value = (value << 1) | bit;
  }

  return value.toString(16).toUpperCase();
}

export const BitsToHexDigit: ModuleDef = {
  id: 'BitsToHexDigit',
  name: 'Bits → Hex Digit',
  inputs: [{ name: 'in', type: 'bits', kind: 'scalar' }],
  outputs: [{ name: 'out', type: 'symbol', kind: 'scalar' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'bits') {
      throw new Error('BitsToHexDigit expects a bits signal');
    }

    if (signal.value.length !== 4) {
      throw new Error('BitsToHexDigit expects exactly 4 bits');
    }

    return {
      out: { type: 'symbol', value: nibbleToHex(signal.value) },
    };
  },
};
