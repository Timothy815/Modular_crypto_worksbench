import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

function expectSingleBitWord(bits: number[], label: string) {
  if (bits.length !== 1) {
    throw new Error(`Mux expects ${label} to be a 1-bit word`);
  }
  return bits[0] ?? 0;
}

export const Mux: ModuleDef = {
  id: 'Mux',
  name: 'Mux',
  inputs: [
    { name: 'select', type: 'bits' },
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const select = expectSingleBitWord(expectBitsSignal(inputs.select, 'Mux'), 'select');
    const a = expectSingleBitWord(expectBitsSignal(inputs.a, 'Mux'), 'input a');
    const b = expectSingleBitWord(expectBitsSignal(inputs.b, 'Mux'), 'input b');

    return {
      out: {
        type: 'bits',
        value: [select === 1 ? b : a],
      },
    };
  },
};
