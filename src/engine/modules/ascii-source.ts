import type { ModuleDef } from '../types';

function normalizeAscii(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('AsciiSource requires a text string');
  }

  for (const char of value) {
    if (char.charCodeAt(0) > 0x7f) {
      throw new Error('AsciiSource accepts only 7-bit ASCII characters');
    }
  }

  return value;
}

function charToBits(char: string): number[] {
  const code = char.charCodeAt(0);
  return [7, 6, 5, 4, 3, 2, 1, 0].map((shift) => (code >> shift) & 1);
}

export const AsciiSource: ModuleDef = {
  id: 'AsciiSource',
  name: 'ASCII Source',
  inputs: [],
  outputs: [{ name: 'out', type: 'bits' }],
  paramSchema: {
    value: {
      key: 'value',
      label: 'ASCII Text',
      kind: 'string',
      defaultValue: 'A',
      required: true,
      description: 'ASCII text such as A, HELLO, or TEST',
    },
  },
  evaluate: (_inputs, params) => {
    const value = normalizeAscii(params.value);
    return {
      out: { type: 'bits', value: value.split('').flatMap(charToBits) },
    };
  },
};
