import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';
import { getKeyedSBoxVariantTable } from '../analysis/keyed-sbox-analysis';

function bitsToNumber(bits: number[]): number {
  return bits.reduce((value, bit) => (value << 1) | bit, 0);
}

function numberToBits(value: number, width: number): number[] {
  const bits: number[] = [];
  for (let index = width - 1; index >= 0; index -= 1) {
    bits.push((value >> index) & 1);
  }
  return bits;
}

function isPermutation(table: readonly number[]) {
  return new Set(table).size === table.length;
}

export const KeyedSBox4: ModuleDef = {
  id: 'KeyedSBox4',
  name: 'Keyed S-Box (4-bit)',
  inputs: [
    { name: 'in', type: 'bits' },
    { name: 'key', type: 'bits' },
  ],
  outputs: [
    { name: 'out', type: 'bits' },
    { name: 'valid', type: 'bits' },
  ],
  paramSchema: {},
  evaluate: (inputs) => {
    const inputBits = expectBitsSignal(inputs.in, 'KeyedSBox4');
    const keyBits = expectBitsSignal(inputs.key, 'KeyedSBox4');

    if (inputBits.length !== 4) {
      throw new Error('KeyedSBox4 expects a 4-bit input nibble.');
    }
    if (keyBits.length !== 2) {
      throw new Error('KeyedSBox4 expects a visible 2-bit key.');
    }

    const table = getKeyedSBoxVariantTable(keyBits);
    const outputValue = table[bitsToNumber(inputBits)];

    return {
      out: { type: 'bits', value: numberToBits(outputValue, 4) },
      valid: { type: 'bits', value: [isPermutation(table) ? 1 : 0] },
    };
  },
};
