import type { TickSliceableModuleDef } from '../types';

export const TextInput: TickSliceableModuleDef = {
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
  tickSlice: (params, tick) => {
    const full = String(params.value ?? '');
    const char = tick < full.length ? full[tick] : '';
    return { ...params, value: char };
  },
  tickLength: (params) => String(params.value ?? '').length,
};
