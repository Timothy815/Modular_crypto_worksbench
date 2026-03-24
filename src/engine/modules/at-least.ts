import type { ModuleDef } from '../types';
import { bitsToUnsignedNumber, expectBitsSignal, requireEqualBitWidths } from './bit-word';
import { singleBitControl } from './control-signal';

export const AtLeast: ModuleDef = {
  id: 'AtLeast',
  name: 'At Least',
  inputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const left = expectBitsSignal(inputs.a, 'AtLeast');
    const right = expectBitsSignal(inputs.b, 'AtLeast');
    requireEqualBitWidths(left, right, 'AtLeast');

    return {
      out: singleBitControl(bitsToUnsignedNumber(left) >= bitsToUnsignedNumber(right)),
    };
  },
};
