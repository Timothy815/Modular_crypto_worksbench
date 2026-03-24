import type { ModuleDef } from '../types';
import { expectBitsSignal, requireEqualBitWidths } from './bit-word';
import { singleBitControl } from './control-signal';

export const Equals: ModuleDef = {
  id: 'Equals',
  name: 'Equals',
  inputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const left = expectBitsSignal(inputs.a, 'Equals');
    const right = expectBitsSignal(inputs.b, 'Equals');
    const width = requireEqualBitWidths(left, right, 'Equals');

    for (let index = 0; index < width; index += 1) {
      if (left[index] !== right[index]) {
        return { out: singleBitControl(false) };
      }
    }

    return { out: singleBitControl(true) };
  },
};
