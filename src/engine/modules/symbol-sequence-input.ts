import type { ModuleDef } from '../types';

export const SymbolSequenceInput: ModuleDef = {
  id: 'SymbolSequenceInput',
  name: 'Symbol Sequence Input',
  inputs: [],
  outputs: [{ name: 'out', type: 'symbol', kind: 'sequence' }],
  paramSchema: {
    value: {
      key: 'value',
      label: 'Sequence',
      kind: 'string',
      defaultValue: 'KEY',
      required: true,
      description: 'An ordered symbol sequence such as KEY, HELLO, or SECRET.',
    },
  },
  evaluate: (_inputs, params) => ({
    out: { type: 'symbol', value: String(params.value ?? '') },
  }),
};
