import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

function expectSingleBitWord(bits: number[], label: string) {
  if (bits.length !== 1) {
    throw new Error(`Demux expects ${label} to be a 1-bit word`);
  }
  return bits[0] ?? 0;
}

export const Demux: ModuleDef = {
  id: 'Demux',
  name: 'Demux',
  inputs: [
    { name: 'select', type: 'bits' },
    { name: 'in', type: 'bits' },
  ],
  outputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  paramSchema: {},
  evaluate: (inputs) => {
    const select = expectSingleBitWord(expectBitsSignal(inputs.select, 'Demux'), 'select');
    const inputBit = expectSingleBitWord(expectBitsSignal(inputs.in, 'Demux'), 'input');

    return {
      a: {
        type: 'bits',
        value: [select === 0 ? inputBit : 0],
      },
      b: {
        type: 'bits',
        value: [select === 1 ? inputBit : 0],
      },
    };
  },
};
