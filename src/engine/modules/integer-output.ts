import type { ModuleDef } from '../types';

export const IntegerOutput: ModuleDef = {
  id: 'IntegerOutput',
  name: 'Integer Output',
  inputs: [{ name: 'in', type: 'integer' }],
  outputs: [],
  paramSchema: {},
  evaluate: (inputs) => {
    void inputs;
    return {};
  },
};
