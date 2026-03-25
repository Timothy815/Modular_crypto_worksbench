import type { ModuleDef } from '../types';
import { bitsToUnsignedNumber, expectBitsSignal, requireEqualBitWidths } from './bit-word';
import { singleBitControl } from './control-signal';

export const GreaterThan: ModuleDef = {
  id: 'GreaterThan',
  name: 'Greater Than',
  inputs: [
    { name: 'a', type: 'bits' },
    { name: 'b', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const left = expectBitsSignal(inputs.a, 'GreaterThan');
    const right = expectBitsSignal(inputs.b, 'GreaterThan');
    requireEqualBitWidths(left, right, 'GreaterThan');

    return {
      out: singleBitControl(bitsToUnsignedNumber(left) > bitsToUnsignedNumber(right)),
    };
  },
};
