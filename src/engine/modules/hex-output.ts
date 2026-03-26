import type { ModuleDef } from '../types';

export const HexOutput: ModuleDef = {
  id: 'HexOutput',
  name: 'Hex Output',
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [],
  paramSchema: {},
  evaluate: (inputs) => {
    void inputs;
    return {};
  },
};

