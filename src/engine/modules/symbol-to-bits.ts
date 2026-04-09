import type { ModuleDef } from '../types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const SymbolToBits: ModuleDef = {
  id: 'SymbolToBits',
  name: 'Symbol → Bits',
  inputs: [{ name: 'in', type: 'symbol', kind: 'scalar' }],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = inputs.in;
    if (signal.type !== 'symbol') {
      throw new Error('SymbolToBits expects a symbol signal');
    }

    if (signal.value.length !== 1) {
      throw new Error(`SymbolToBits expects exactly one symbol, received "${signal.value}"`);
    }

    const index = ALPHABET.indexOf(signal.value.toUpperCase());
    if (index === -1) {
      throw new Error(`SymbolToBits: "${signal.value}" is not in the alphabet`);
    }

    // Encode as 5-bit binary (A=0 → 00000, Z=25 → 11001)
    const bits: number[] = [];
    for (let i = 4; i >= 0; i--) {
      bits.push((index >> i) & 1);
    }

    return {
      out: { type: 'bits', value: bits },
    };
  },
};
