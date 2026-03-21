import type { ModuleDef } from '../types';

export const KeyInput: ModuleDef = {
  id: 'KeyInput',
  name: 'Key Input',
  inputs: [],
  outputs: [{ name: 'out', type: 'symbol' }],
  paramSchema: {
    value: {
      key: 'value',
      label: 'Key',
      kind: 'string',
      defaultValue: 'A',
      required: true,
      description: 'The key symbol to output',
    },
  },
  evaluate: (_inputs, params) => ({
    out: { type: 'symbol', value: String(params.value ?? 'A') },
  }),
};
