import type { ModuleDef } from '../types';
import { hexToBits, sanitizeHex } from './hex-source';

export const HexSequenceInput: ModuleDef = {
  id: 'HexSequenceInput',
  name: 'Hex Sequence Input',
  inputs: [],
  outputs: [{ name: 'out', type: 'bits', kind: 'sequence' }],
  paramSchema: {
    value: {
      key: 'value',
      label: 'Hex Sequence',
      kind: 'string',
      defaultValue: 'A3F9',
      required: true,
      description: 'A whole hex-authored bit sequence such as A3F9 or DEADBEEF.',
    },
  },
  evaluate: (_inputs, params) => {
    const value = sanitizeHex(params.value);
    return {
      out: { type: 'bits', value: hexToBits(value) },
    };
  },
};
