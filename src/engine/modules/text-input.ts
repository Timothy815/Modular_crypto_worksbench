import type { ModuleDef } from '../types';

export const TextInput: ModuleDef = {
  id: 'TextInput',
  name: 'Text Input',
  inputs: [],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {
    value: {
      key: 'value',
      label: 'Text',
      kind: 'string',
      defaultValue: 'A',
      required: true,
      description: 'The symbol to output',
    },
  },
  evaluate: (_inputs, params) => ({
    out: { type: 'symbol', value: String(params.value ?? 'A') },
  }),
};
