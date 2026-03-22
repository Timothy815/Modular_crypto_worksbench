import type { ModuleDef } from '../types';

export const BitOutput: ModuleDef = {
  id: 'BitOutput',
  name: 'Bit Output',
  inputs: [{ name: 'in', type: 'bits' }],
  outputs: [],
  paramSchema: {},
  evaluate: (inputs) => {
    void inputs;
    return {};
  },
};
