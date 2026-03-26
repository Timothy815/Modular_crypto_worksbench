import type { ModuleDef } from '../types';

export const BaudotOutput: ModuleDef = {
  id: 'BaudotOutput',
  name: 'Baudot Output',
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [],
  paramSchema: {},
  evaluate: (inputs) => {
    void inputs;
    return {};
  },
};
