import type { ModuleDef } from '../types';

export const Output: ModuleDef = {
  id: 'Output',
  name: 'Output',
  inputs: [{ name: 'in', type: 'symbol' }],
  outputs: [],
  paramSchema: {},
  evaluate: (inputs) => {
    // Sink module — captures the input but produces no outputs.
    // The executor trace records whatever arrives at 'in'.
    void inputs;
    return {};
  },
};
