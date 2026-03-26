import type { ModuleDef } from '../types';

export const TextOutput: ModuleDef = {
  id: 'TextOutput',
  name: 'Text Output',
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [],
  paramSchema: {},
  evaluate: (inputs) => {
    void inputs;
    return {};
  },
};

