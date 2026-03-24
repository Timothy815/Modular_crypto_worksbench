import type { ModuleDef } from '../types';
import { expectBitsSignal } from './bit-word';
import { expectControlBits, isActiveControlPulse } from './control-signal';

export const Gate: ModuleDef = {
  id: 'Gate',
  name: 'Gate',
  inputs: [
    { name: 'in', type: 'bits' },
    { name: 'control', type: 'bits' },
  ],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {},
  evaluate: (inputs) => {
    const signal = expectBitsSignal(inputs.in, 'Gate');
    const control = expectControlBits(inputs.control, 'Gate');
    const active = isActiveControlPulse(control);

    return {
      out: {
        type: 'bits',
        value: active ? [...signal] : signal.map(() => 0),
      },
    };
  },
};
