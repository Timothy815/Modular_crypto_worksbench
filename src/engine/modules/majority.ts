import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';

function expectSingleBitWord(bits: number[], label: string) {
  if (bits.length !== 1) {
    throw new Error(`Majority expects ${label} to be a 1-bit word`);
  }
  return bits[0] ?? 0;
}

export const Majority: ModuleDef = {
  id: 'Majority',
  name: 'Majority',
  inputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
    { name: 'c', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const a = expectSingleBitWord(expectBitsSignal(inputs.a, 'Majority'), 'input a');
    const b = expectSingleBitWord(expectBitsSignal(inputs.b, 'Majority'), 'input b');
    const c = expectSingleBitWord(expectBitsSignal(inputs.c, 'Majority'), 'input c');
    const activeCount = a + b + c;

    return {
      out: {
        type: 'bits',
        value: [activeCount >= 2 ? 1 : 0],
      },
    };
  },
};
