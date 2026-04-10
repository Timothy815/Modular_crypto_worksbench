import type { ModuleDef } from '../types';
import { validateAsciiSourceValue } from './ascii-source';

function normalizeAscii(value: unknown): string {
  const validationMessage = validateAsciiSourceValue(value);
  if (validationMessage) {
    throw new Error(validationMessage);
  }

  return typeof value === 'string' ? value : '';
}

export const AsciiSequenceInput: ModuleDef = {
  id: 'AsciiSequenceInput',
  name: 'ASCII Sequence Input',
  inputs: [],
  outputs: [{ name: 'out', type: 'symbol', kind: 'sequence' }],
  paramSchema: {
    value: {
      key: 'value',
      label: 'ASCII Sequence',
      kind: 'string',
      defaultValue: 'HELLO',
      required: true,
      description: 'A whole ASCII sequence such as HELLO, TEST, or SECRET.',
    },
  },
  evaluate: (_inputs, params) => ({
    out: { type: 'symbol', value: normalizeAscii(params.value) },
  }),
};
