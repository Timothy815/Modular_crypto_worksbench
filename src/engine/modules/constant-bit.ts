import type { ModuleDef } from '../types';

export const ConstantBit: ModuleDef = {
  id: 'ConstantBit',
  name: 'Constant Bit',
  inputs: [],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    value: {
      key: 'value',
      label: 'Bit Value',
      kind: 'number',
      defaultValue: 1,
      required: true,
      description: 'Fixed output bit: 0 or 1. Emits the same single bit on every tick without being consumed.',
    },
  },
  evaluate: (_inputs, params) => {
    const bit = params.value === 0 ? 0 : 1;
    return {
      out: { type: 'bits', value: [bit] },
    };
  },
};
