import type { ModuleDef } from '../types';

export const PointOutput: ModuleDef = {
  id: 'PointOutput',
  name: 'Point Output',
  inputs: [{ name: 'in', type: 'ec-point' }],
  outputs: [],
  paramSchema: {},
  evaluate: (inputs) => {
    void inputs;
    return {};
  },
};
